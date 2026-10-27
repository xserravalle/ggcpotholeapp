import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { PotholeReport, Comment, NotificationMessage, Actor, UserRole } from '../domain/types';
import { ReportStatus } from '../domain/status';
import { CivicAction } from '../domain/permissions';
import { ActionPayload, ApplyActionResult } from '../domain/actions';
import { TrackedHazardSpot } from '../types/sensorQueue';
import { DriveShockIncident } from '../types/driveSession';
import { ReportRepository, RecipientFilter } from '../repository/ReportRepository';
import { reportRepository as defaultRepo } from '../repository/LocalStorageReportRepository';
import { distanceFromCampusMiles } from '../services/distanceCalculator';
import { classifyJurisdiction } from '../services/jurisdictionClassifier';
import { migrateReport } from '../services/storageService';

export interface ReportsContextType {
  potholes: PotholeReport[];
  isLoading: boolean;
  error: string | null;
  notifications: NotificationMessage[];
  unreadCount: number;

  refreshReports: () => Promise<void>;
  getReport: (id: string) => Promise<PotholeReport | null>;
  submitReport: (
    newReportData: Omit<
      PotholeReport,
      'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt' | 'priority' | 'priorityScore' | 'timeline'
    >
  ) => Promise<PotholeReport>;
  confirmReport: (id: string, actor?: Actor, message?: string) => Promise<PotholeReport>;
  updateReportStatus: (id: string, newStatus: ReportStatus, actor?: Actor) => Promise<PotholeReport>;
  dispatchAction: (
    id: string,
    action: CivicAction,
    actor: Actor,
    payload?: ActionPayload
  ) => Promise<ApplyActionResult>;
  promoteSensorSpot: (spot: TrackedHazardSpot) => Promise<PotholeReport>;
  promoteDriveIncidents: (incidents: DriveShockIncident[]) => Promise<PotholeReport[]>;
  updateReport: (updated: PotholeReport) => Promise<PotholeReport>;
  deleteReport: (id: string) => Promise<void>;

  // Comments
  getComments: (reportId: string) => Promise<Comment[]>;
  addComment: (reportId: string, text: string, author: { name: string; role: UserRole }) => Promise<Comment>;

  // Notifications
  refreshNotifications: (recipient: RecipientFilter) => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (recipient: RecipientFilter) => Promise<void>;

  // Admin Demo Tools
  resetDemoData: () => Promise<void>;
  loadSampleWorkflow: () => Promise<void>;
}

export const ReportsContext = createContext<ReportsContextType | null>(null);

export interface ReportsProviderProps {
  children: ReactNode;
  repository?: ReportRepository;
  activeRecipient?: RecipientFilter;
}

export const ReportsProvider: React.FC<ReportsProviderProps> = ({
  children,
  repository = defaultRepo,
  activeRecipient = { role: 'admin' },
}) => {
  const [potholes, setPotholes] = useState<PotholeReport[]>([]);
  const [notifications, setNotifications] = useState<NotificationMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshReports = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const list = await repository.list();
      setPotholes(list);
    } catch (err: any) {
      console.error('Failed to load reports from repository', err);
      setError(err?.message || 'Failed to load road hazards');
    } finally {
      setIsLoading(false);
    }
  }, [repository]);

  const refreshNotifications = useCallback(async (recipient: RecipientFilter) => {
    try {
      const notifs = await repository.listNotifications(recipient);
      setNotifications(notifs);
    } catch (err) {
      console.error('Failed to load notifications', err);
    }
  }, [repository]);

  // Initial load
  useEffect(() => {
    refreshReports();
    if (activeRecipient) {
      refreshNotifications(activeRecipient);
    }
  }, [refreshReports, refreshNotifications, activeRecipient]);

  const getReport = async (id: string): Promise<PotholeReport | null> => {
    return repository.get(id);
  };

  const submitReport = async (
    newReportData: Omit<
      PotholeReport,
      'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt' | 'priority' | 'priorityScore' | 'timeline'
    >
  ): Promise<PotholeReport> => {
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
    const newId = `GW-POT-${uuid}`;
    const dist = distanceFromCampusMiles({ lat: newReportData.latitude, lng: newReportData.longitude });

    const reportObj = migrateReport({
      ...newReportData,
      id: newId,
      trackingCode,
      verificationsCount: 1,
      userConfirmed: true,
      reportedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      workOrderNumber: `REF-${trackingCode}`,
      distanceFromGgcMiles: dist,
      source: newReportData.source || 'user',
    });

    const saved = await repository.save(reportObj);
    setPotholes(prev => [saved, ...prev.filter(p => p.id !== saved.id)]);

    // Emit initial creation notification
    const actor: Actor = {
      name: newReportData.reporterName || 'Citizen Commuter',
      email: newReportData.reporterEmail,
      role: 'user',
    };
    try {
      await repository.dispatch(saved.id, 'create', actor, {
        message: `New pothole reported at ${saved.address || saved.roadName}`,
      });
    } catch (e) {
      console.warn('Non-fatal error logging initial report creation event', e);
    }

    if (activeRecipient) {
      await refreshNotifications(activeRecipient);
    }

    return saved;
  };

  const confirmReport = async (id: string, actor?: Actor, message?: string): Promise<PotholeReport> => {
    const effectiveActor: Actor = actor || {
      name: 'Citizen Commuter',
      role: 'user',
    };

    const res = await repository.dispatch(id, 'confirm', effectiveActor, message ? { message } : undefined);
    setPotholes(prev => prev.map(p => p.id === id ? res.report : p));
    return res.report;
  };

  const updateReportStatus = async (
    id: string,
    newStatus: ReportStatus,
    actor?: Actor
  ): Promise<PotholeReport> => {
    const target = await repository.get(id);
    if (!target) throw new Error(`Report #${id} not found.`);

    // Map status update to appropriate civic action
    const effectiveActor: Actor = actor || {
      name: 'GGC Transportation Staff',
      role: 'admin',
    };

    let action: CivicAction = 'verify';
    if (newStatus === 'verified') action = 'verify';
    else if (newStatus === 'assigned') action = 'assign';
    else if (newStatus === 'in_progress') action = 'startWork';
    else if (newStatus === 'resolved') action = 'resolve';
    else if (newStatus === 'closed') action = 'close';
    else if (newStatus === 'rejected') action = 'reject';

    try {
      const res = await repository.dispatch(id, action, effectiveActor, {
        reason: 'duplicate', // fallback for reject
        assignedCrew: target.assignedCrew || 'Maintenance Crew',
      });
      setPotholes(prev => prev.map(p => p.id === id ? res.report : p));
      if (activeRecipient) {
        await refreshNotifications(activeRecipient);
      }
      return res.report;
    } catch {
      // Direct status fallback when bypassing standard workflow
      const updated = migrateReport({ ...target, status: newStatus });
      const saved = await repository.save(updated);
      setPotholes(prev => prev.map(p => p.id === id ? saved : p));
      return saved;
    }
  };

  const dispatchAction = async (
    id: string,
    action: CivicAction,
    actor: Actor,
    payload?: ActionPayload
  ): Promise<ApplyActionResult> => {
    const result = await repository.dispatch(id, action, actor, payload);
    setPotholes(prev => prev.map(p => p.id === id ? result.report : p));
    if (activeRecipient) {
      await refreshNotifications(activeRecipient);
    }
    return result;
  };

  const promoteSensorSpot = async (spot: TrackedHazardSpot): Promise<PotholeReport> => {
    const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
    const newId = `GW-POT-${uuid}`;
    const dist = distanceFromCampusMiles({ lat: spot.latitude, lng: spot.longitude });
    const classification = classifyJurisdiction(spot.latitude, spot.longitude, spot.roadName);

    const reportObj = migrateReport({
      id: newId,
      trackingCode,
      title: `Possible Road Hazard on ${spot.roadName}`,
      roadName: spot.roadName || 'Detected Road Hazard',
      address: `${spot.latitude.toFixed(5)}, ${spot.longitude.toFixed(5)}`,
      city: spot.city || 'Lawrenceville',
      jurisdiction: classification.authority.name,
      authorityId: classification.authority.id,
      authorityName: classification.authority.name,
      authorityEmail: classification.authority.contactEmail,
      latitude: spot.latitude,
      longitude: spot.longitude,
      severity: spot.severity,
      hazardType: 'POTHOLE',
      status: 'reported',
      verificationsCount: 0,
      userConfirmed: false,
      reportedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      description: `Sensor recorded ${spot.hitCount} impacts near this location. Review the road condition before treating this as a confirmed pothole.`,
      estimatedDepthInches: spot.maxGForce >= 6.0 ? 3.5 : 2.5,
      estimatedWidthInches: spot.maxGForce >= 6.0 ? 20 : 14,
      surfaceType: 'Asphalt',
      damageRisk: spot.maxGForce >= 6.0 ? 'Tire / Rim Damage' : 'Suspension / Alignment',
      detectedBy: 'Vehicle Accelerometer Telemetry',
      sensorDetected: true,
      sensorEvidence: {
        hitCount: spot.hitCount,
        maxGForce: spot.maxGForce,
        firstDetectedAt: spot.createdAt,
        lastDetectedAt: spot.lastHitAt,
      },
      bumpIntensity: spot.maxGForce,
      workOrderNumber: `REF-${newId}`,
      distanceFromGgcMiles: dist,
      source: 'sensor',
      timeline: [
        {
          id: `tl-sensor-${uuid}`,
          status: 'reported',
          action: 'SENSOR_DETECTED',
          message: 'Auto-reported from in-vehicle accelerometer sensor (3-hit threshold reached)',
          actorName: 'Vehicle Sensor System',
          actorRole: 'system',
          timestamp: new Date().toISOString(),
        },
      ],
    });

    const saved = await repository.save(reportObj);
    setPotholes(prev => [saved, ...prev]);
    return saved;
  };

  const promoteDriveIncidents = async (incidents: DriveShockIncident[]): Promise<PotholeReport[]> => {
    const savedReports: PotholeReport[] = [];
    for (const inc of incidents) {
      const uuid = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
      const newId = `GW-POT-${uuid}`;
      const dist = distanceFromCampusMiles({ lat: inc.latitude, lng: inc.longitude });
      const classification = classifyJurisdiction(inc.latitude, inc.longitude, inc.roadName);

      const reportObj = migrateReport({
        id: newId,
        trackingCode,
        title: `Pothole on ${inc.roadName || 'Roadway'}`,
        roadName: inc.roadName || 'Corridor',
        address: inc.address || `${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}`,
        city: inc.city || 'Lawrenceville',
        jurisdiction: classification.authority.name,
        authorityId: classification.authority.id,
        authorityName: classification.authority.name,
        authorityEmail: classification.authority.contactEmail,
        latitude: inc.latitude,
        longitude: inc.longitude,
        severity: inc.severity,
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 1,
        userConfirmed: true,
        reportedAt: new Date(inc.timestamp).toISOString(),
        lastVerifiedAt: new Date(inc.timestamp).toISOString(),
        description: `Logged during Drive-Time Patrol (${inc.peakG.toFixed(2)}G Shock). Nearest address: ${inc.address}.`,
        estimatedDepthInches: inc.peakG >= 6.0 ? 3.5 : 2.5,
        estimatedWidthInches: inc.peakG >= 6.0 ? 20 : 14,
        surfaceType: 'Asphalt',
        damageRisk: inc.peakG >= 6.0 ? 'Tire / Rim Damage' : 'Suspension / Alignment',
        detectedBy: 'Vehicle Accelerometer Telemetry',
        sensorDetected: true,
        bumpIntensity: inc.peakG,
        imageUrl: inc.imageUrl,
        workOrderNumber: `REF-${newId}`,
        distanceFromGgcMiles: dist,
        source: 'sensor',
        timeline: [
          {
            id: `tl-sensor-inc-${uuid}`,
            status: 'reported',
            action: 'SENSOR_DETECTED',
            message: 'Auto-reported from in-vehicle accelerometer drive incident',
            actorName: 'Vehicle Sensor System',
            actorRole: 'system',
            timestamp: new Date(inc.timestamp).toISOString(),
          },
        ],
      });

      const saved = await repository.save(reportObj);
      savedReports.push(saved);
    }

    setPotholes(prev => [...savedReports, ...prev]);
    return savedReports;
  };

  const updateReport = async (updated: PotholeReport): Promise<PotholeReport> => {
    const saved = await repository.save(updated);
    setPotholes(prev => prev.map(p => p.id === saved.id ? saved : p));
    return saved;
  };

  const deleteReport = async (id: string): Promise<void> => {
    await repository.delete(id);
    setPotholes(prev => prev.filter(p => p.id !== id));
  };

  // --- COMMENTS ---
  const getComments = async (reportId: string): Promise<Comment[]> => {
    return repository.listComments(reportId);
  };

  const addComment = async (
    reportId: string,
    text: string,
    author: { name: string; role: UserRole }
  ): Promise<Comment> => {
    const cmt = await repository.addComment({
      reportId,
      text,
      authorName: author.name,
      authorRole: author.role,
    });
    if (activeRecipient) {
      await refreshNotifications(activeRecipient);
    }
    return cmt;
  };

  // --- NOTIFICATIONS ---
  const markNotificationRead = async (id: string): Promise<void> => {
    await repository.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = async (recipient: RecipientFilter): Promise<void> => {
    await repository.markAllRead(recipient);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  // --- DEMO TOOLS ---
  const resetDemoData = async (): Promise<void> => {
    await repository.resetDemoData();
    await refreshReports();
    if (activeRecipient) {
      await refreshNotifications(activeRecipient);
    }
  };

  const loadSampleWorkflow = async (): Promise<void> => {
    const samples = await repository.loadSampleWorkflow();
    setPotholes(samples);
    if (activeRecipient) {
      await refreshNotifications(activeRecipient);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <ReportsContext.Provider
      value={{
        potholes,
        isLoading,
        error,
        notifications,
        unreadCount,
        refreshReports,
        getReport,
        submitReport,
        confirmReport,
        updateReportStatus,
        dispatchAction,
        promoteSensorSpot,
        promoteDriveIncidents,
        updateReport,
        deleteReport,
        getComments,
        addComment,
        refreshNotifications,
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData,
        loadSampleWorkflow,
      }}
    >
      {children}
    </ReportsContext.Provider>
  );
};

export const useReports = (): ReportsContextType => {
  const context = useContext(ReportsContext);
  if (!context) {
    throw new Error('useReports must be used within a ReportsProvider');
  }
  return context;
};
