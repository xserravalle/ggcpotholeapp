import React, { useState, useEffect } from 'react';
import { PotholeReport, SeverityLevel } from './types/pothole';
import { TrackedHazardSpot } from './types/sensorQueue';
import { DriveShockIncident } from './types/driveSession';
import { ParkingLot, SimulationParams } from './types/parking';
import { INITIAL_POTHOLES } from './data/potholesData';
import { HIGH_RISK_ROAD_SEGMENTS } from './data/roadSegmentsData';
import { PARKING_LOTS } from './data/parkingLotsData';
import { loadStoredPotholes, saveStoredPotholes, migrateReport } from './services/storageService';
import { distanceFromCampusMiles } from './services/distanceCalculator';
import { classifyJurisdiction } from './services/jurisdictionClassifier';
import { useAuth } from './context/AuthContext';

// Common Components
import { Header, ActiveTab } from './components/Header';
import { MobileNavBar } from './components/common/MobileNavBar';
import { SettingsModal } from './components/common/SettingsModal';
import { AuthModal } from './components/common/AuthModal';

// Views
import { UnifiedDashboard } from './components/dashboard/UnifiedDashboard';
import { PotholeMapView } from './components/potholes/PotholeMapView';
import { DriveSensorView } from './components/sensor/DriveSensorView';
import { MyReportsView } from './components/potholes/MyReportsView';
import { AboutHelpView } from './components/about/AboutHelpView';
import { AuthorityHubView } from './components/dispatcher/AuthorityHubView';
import { PotholeAnalyticsView } from './components/potholes/PotholeAnalyticsView';

// Modals & Drawers
import { PotholeDetailDrawer } from './components/potholes/PotholeDetailDrawer';
import { PotholeReportModal } from './components/potholes/PotholeReportModal';
import { DocketSuccessModal } from './components/potholes/DocketSuccessModal';
import { MunicipalDispatcherModal } from './components/potholes/MunicipalDispatcherModal';
import { LotDetailModal } from './components/parking/LotDetailModal';

export function App() {
  const { isAdmin, isAuthModalOpen, closeAuthModal, openAuthModal } = useAuth();

  // Navigation: Default to Map & Hazards
  const [activeTab, setActiveTab] = useState<ActiveTab>('potholes');

  // Core Data State with Local Persistence
  const [potholes, setPotholes] = useState<PotholeReport[]>(() => loadStoredPotholes(INITIAL_POTHOLES));
  const [roadSegments] = useState(HIGH_RISK_ROAD_SEGMENTS);
  const [parkingLots] = useState<ParkingLot[]>(PARKING_LOTS);

  // Auto-save whenever potholes state changes
  useEffect(() => {
    saveStoredPotholes(potholes);
  }, [potholes]);

  // Always reset window scroll position to top on tab change
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [activeTab]);

  // Route security: if a non-admin is currently on an admin-only tab, redirect safely to Map
  useEffect(() => {
    if (!isAdmin && (activeTab === 'dispatcher' || activeTab === 'analytics')) {
      setActiveTab('potholes');
    }
  }, [isAdmin, activeTab]);

  // Interactive Selection State
  const [selectedPothole, setSelectedPothole] = useState<PotholeReport | null>(null);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);

  // Modals & Triggers
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDispatcherOpen, setIsDispatcherOpen] = useState(false);
  const [dispatcherTargetPothole, setDispatcherTargetPothole] = useState<PotholeReport | null>(null);
  const [docketSuccessReport, setDocketSuccessReport] = useState<PotholeReport | null>(null);

  // Sensor / Accelerometer Trigger State
  const [sensorTriggeredTelemetry, setSensorTriggeredTelemetry] = useState<{
    sensorDetected: boolean;
    bumpIntensity: number;
    severity?: SeverityLevel;
  } | undefined>(undefined);

  // Map dropped pin coordinates
  const [droppedPinCoords, setDroppedPinCoords] = useState<{
    lat: number;
    lng: number;
    address?: string;
  } | undefined>(undefined);

  // Simulation Parameters (Default to Saturday 2:15 PM)
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    dayOfWeek: 'Saturday',
    hourOfDay: 14,
    minuteOfDay: 15,
    isWeekendRush: true,
    isHolidaySurge: false,
    isGgcClassChange: false,
    isRainWeather: false
  });

  const handleOpenDispatcher = (pothole?: PotholeReport) => {
    setDispatcherTargetPothole(pothole || null);
    setIsDispatcherOpen(true);
  };

  // Verification Handler (Upvote)
  const handleVerifyPothole = (id: string) => {
    setPotholes(prev => prev.map(p => {
      if (p.id === id) {
        const newCount = p.verificationsCount + 1;
        return {
          ...p,
          verificationsCount: newCount,
          userConfirmed: true,
          lastVerifiedAt: new Date().toISOString()
        };
      }
      return p;
    }));

    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(prev => prev ? {
        ...prev,
        verificationsCount: prev.verificationsCount + 1,
        userConfirmed: true
      } : null);
    }
  };

  // Submit New Pothole Report
  const handleSubmitNewReport = (
    newReportData: Omit<PotholeReport, 'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt' | 'priority' | 'priorityScore' | 'timeline'>
  ) => {
    const uuid = crypto.randomUUID();
    const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
    const newId = `GW-POT-${uuid}`;
    const dist = distanceFromCampusMiles({ lat: newReportData.latitude, lng: newReportData.longitude });

    const newReport: PotholeReport = migrateReport({
      ...newReportData,
      id: newId,
      trackingCode,
      verificationsCount: 1,
      userConfirmed: true,
      reportedAt: new Date().toISOString(),
      lastVerifiedAt: new Date().toISOString(),
      workOrderNumber: `REF-${trackingCode}`,
      distanceFromGgcMiles: dist,
      source: 'user'
    });

    setPotholes(prev => [newReport, ...prev]);
    setSelectedPothole(newReport);
    setDocketSuccessReport(newReport);
    setSensorTriggeredTelemetry(undefined);
  };

  // Update Status Lifecycle
  const handleUpdateStatus = (id: string, newStatus: PotholeReport['status']) => {
    setPotholes(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, status: newStatus };
      }
      return p;
    }));

    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(prev => prev ? { ...prev, status: newStatus } : null);
    }
  };

  // Promote a spot that hit 3x into an official confirmed PotholeReport
  const handlePromoteSpotToReport = (spot: TrackedHazardSpot) => {
    const uuid = crypto.randomUUID();
    const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
    const newId = `GW-POT-${uuid}`;
    const dist = distanceFromCampusMiles({ lat: spot.latitude, lng: spot.longitude });
    const classification = classifyJurisdiction(spot.latitude, spot.longitude, spot.roadName);

    const newReport: PotholeReport = migrateReport({
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
        lastDetectedAt: spot.lastHitAt
      },
      bumpIntensity: spot.maxGForce,
      workOrderNumber: `REF-${newId}`,
      distanceFromGgcMiles: dist,
      source: 'sensor'
    });

    setPotholes(prev => [newReport, ...prev]);
  };

  // Promote all incidents from a completed Drive Session to official reports
  const handlePromoteDriveIncidents = (incidents: DriveShockIncident[]) => {
    const newReports: PotholeReport[] = incidents.map(inc => {
      const uuid = crypto.randomUUID();
      const trackingCode = `GAP-2026-${uuid.slice(0, 8).toUpperCase()}`;
      const newId = `GW-POT-${uuid}`;
      const dist = distanceFromCampusMiles({ lat: inc.latitude, lng: inc.longitude });
      const classification = classifyJurisdiction(inc.latitude, inc.longitude, inc.roadName);

      return migrateReport({
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
        source: 'sensor'
      });
    });

    setPotholes(prev => [...newReports, ...prev]);
  };

  // Update report details (from My Reports edit modal)
  const handleUpdateReport = (updatedReport: PotholeReport) => {
    setPotholes(prev => prev.map(p => p.id === updatedReport.id ? updatedReport : p));
    if (selectedPothole && selectedPothole.id === updatedReport.id) {
      setSelectedPothole(updatedReport);
    }
  };

  // Delete report (from My Reports edit modal)
  const handleDeleteReport = (id: string) => {
    setPotholes(prev => prev.filter(p => p.id !== id));
    if (selectedPothole && selectedPothole.id === id) {
      setSelectedPothole(null);
    }
  };

  return (
    <div className={`bg-slate-950 text-slate-100 flex flex-col selection:bg-teal-500 selection:text-slate-950 ${
      activeTab === 'my-reports' 
        ? 'h-screen max-h-screen overflow-hidden pb-16 md:pb-0' 
        : 'min-h-screen pb-16 md:pb-0'
    }`}>
      
      {/* Universal Streamlined Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuthModal={openAuthModal}
        potholeCount={potholes.length}
      />

      {/* Main Tab Content */}
      <main className={`flex-1 ${activeTab === 'my-reports' ? 'min-h-0 overflow-hidden flex flex-col' : ''}`}>
        {/* Tab 1: Campus Parking Availability */}
        {activeTab === 'dashboard' && (
          <UnifiedDashboard
            parkingLots={parkingLots}
            simulationParams={simulationParams}
            onChangeSimulationParams={setSimulationParams}
            onSelectLot={setSelectedLot}
          />
        )}

        {/* Tab 2: Interactive OpenStreetMap Hazard Map */}
        {activeTab === 'potholes' && (
          <PotholeMapView
            potholes={potholes}
            roadSegments={roadSegments}
            selectedPothole={selectedPothole}
            onSelectPothole={setSelectedPothole}
            onVerifyPothole={handleVerifyPothole}
            onMapDropPin={(lat, lng, address) => {
              setDroppedPinCoords({ lat, lng, address });
            }}
            onNavigateToDrive={() => setActiveTab('sensor')}
          />
        )}

        {/* Tab 3: Dedicated Drive Sensor View with Audio Hazard Warnings */}
        {activeTab === 'sensor' && (
          <DriveSensorView
            potholes={potholes}
            onPromoteSpotToReport={handlePromoteSpotToReport}
            onPromoteDriveIncidents={handlePromoteDriveIncidents}
            onNavigateToMyReports={() => setActiveTab('my-reports')}
          />
        )}

        {/* Tab 4: My Reports Submissions View */}
        {activeTab === 'my-reports' && (
          <MyReportsView
            potholes={potholes}
            onSelectPothole={setSelectedPothole}
            onOpenReportModal={() => {
              setSensorTriggeredTelemetry(undefined);
              setIsReportModalOpen(true);
            }}
            onNavigateToMap={() => setActiveTab('potholes')}
            onUpdateReport={handleUpdateReport}
            onDeleteReport={handleDeleteReport}
          />
        )}

        {/* Secondary Tab: Municipal Dispatcher Hub (accessible ONLY by Admins) */}
        {isAdmin && activeTab === 'dispatcher' && (
          <AuthorityHubView
            potholes={potholes}
            onUpdateStatus={handleUpdateStatus}
            onOpenDispatcherModal={handleOpenDispatcher}
            onSelectPotholeForMap={(p) => {
              setSelectedPothole(p);
              setActiveTab('potholes');
            }}
          />
        )}

        {/* Secondary Tab: Pavement Corridor Analytics (accessible ONLY by Admins) */}
        {isAdmin && activeTab === 'analytics' && (
          <PotholeAnalyticsView
            potholes={potholes}
            roadSegments={roadSegments}
          />
        )}

        {/* Tab 6: About & Help Documentation */}
        {activeTab === 'about' && (
          <AboutHelpView
            onNavigateTab={setActiveTab}
            onOpenReportModal={() => setIsReportModalOpen(true)}
          />
        )}
      </main>

      {/* Pothole Inspector Drawer */}
      <PotholeDetailDrawer
        pothole={selectedPothole}
        onClose={() => setSelectedPothole(null)}
        onVerify={handleVerifyPothole}
        isAdmin={isAdmin}
        onOpenDispatcher={(p) => {
          setSelectedPothole(null);
          handleOpenDispatcher(p);
        }}
      />

      {/* Citizen / Student Reporting Modal */}
      <PotholeReportModal
        isOpen={isReportModalOpen}
        onClose={() => {
          setIsReportModalOpen(false);
          setSensorTriggeredTelemetry(undefined);
          setDroppedPinCoords(undefined);
        }}
        onSubmitReport={handleSubmitNewReport}
        initialTelemetry={sensorTriggeredTelemetry}
        initialCoords={droppedPinCoords}
      />

      {/* Incident Docket Success Modal */}
      <DocketSuccessModal
        isOpen={!!docketSuccessReport}
        onClose={() => setDocketSuccessReport(null)}
        report={docketSuccessReport}
        onViewOnMap={() => {
          setDocketSuccessReport(null);
          setActiveTab('potholes');
        }}
      />

      {/* Municipal Dispatcher Work Order Router Modal (Admin Only) */}
      {isAdmin && isDispatcherOpen && (
        <MunicipalDispatcherModal
          isOpen={isDispatcherOpen}
          onClose={() => setIsDispatcherOpen(false)}
          pothole={dispatcherTargetPothole || potholes[0]}
          allPotholes={potholes}
          onSelectPothole={setDispatcherTargetPothole}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* Parking Lot Detail Modal */}
      <LotDetailModal
        lot={selectedLot}
        simulationParams={simulationParams}
        onClose={() => setSelectedLot(null)}
        onSelectAlternate={(altId) => {
          const found = parkingLots.find(l => l.id === altId);
          if (found) setSelectedLot(found);
        }}
      />

      {/* Settings & Accessibility Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onNavigateToSensor={() => {
          setActiveTab('sensor');
          setIsSettingsOpen(false);
        }}
        potholes={potholes}
      />

      {/* User & Admin Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
      />

      {/* Bottom Navigation Bar for Mobile Phones */}
      <MobileNavBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Streamlined Desktop Footer */}
      <footer className="shrink-0 hidden md:block bg-slate-900 border-t border-slate-800 py-3.5 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-slate-400 font-medium">
            &copy; 2026 GGC SansPotholes &bull; Georgia Gwinnett College ITEC 4860 &bull; Erick Vale, Tina Ly, Hina Luna, Peyton Holland
          </span>
          <div className="flex items-center space-x-4 text-slate-500">
            <button
              onClick={() => setActiveTab('about')}
              className="hover:text-slate-300 transition"
            >
              About & Help
            </button>
            <span>&bull;</span>
            {isAdmin ? (
              <>
                <button
                  onClick={() => setActiveTab('dispatcher')}
                  className="hover:text-blue-400 transition"
                >
                  Agency Dispatch
                </button>
                <span>&bull;</span>
                <button
                  onClick={() => setActiveTab('analytics')}
                  className="hover:text-teal-400 transition"
                >
                  Pavement Analytics
                </button>
                <span>&bull;</span>
                <span className="text-blue-400 font-semibold font-mono text-[11px]">
                  Admin Portal Active
                </span>
              </>
            ) : (
              <button
                onClick={openAuthModal}
                className="hover:text-slate-300 transition text-slate-400"
              >
                Staff / Admin Sign In
              </button>
            )}
          </div>
        </div>
      </footer>

    </div>
  );
}

export default App;
