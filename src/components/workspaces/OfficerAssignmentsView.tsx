import React, { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { PotholeReport, Actor } from '../../domain/types';
import { useAuth } from '../../context/AuthContext';
import { useReports } from '../../context/ReportsContext';
import { getReportsForOfficer } from '../../domain/permissions';
import { isOverdue } from '../../domain/sla';
import { AGENCY_LABELS } from '../../data/officersData';
import { compressImageFile } from '../../utils/imageCompressor';
import { StatCard, StatusBadge, PriorityBadge, ReportCard, EmptyState } from '../kit';
import {
  Wrench,
  Clock,
  Activity,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Navigation,
  Play,
  Camera,
  Upload,
  X,
  List,
  Map as MapIcon,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';

export interface OfficerAssignmentsViewProps {
  potholes?: PotholeReport[];
  onSelectPothole?: (report: PotholeReport) => void;
  onNavigateToMap?: () => void;
}

type TabMode = 'list' | 'route';
type FilterStatus = 'all' | 'assigned' | 'in_progress' | 'resolved' | 'overdue';

const PRIORITY_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Custom numbered route pin for crew navigation map
const createRoutePinIcon = (stopNumber: number, status: string) => {
  const bg = status === 'in_progress' ? '#06b6d4' : '#a855f7';
  return L.divIcon({
    html: `
      <div style="background: ${bg}; color: white; width: 30px; height: 30px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 13px; font-family: monospace; border: 2.5px solid white; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);">
        ${stopNumber}
      </div>
    `,
    className: 'crew-route-pin',
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -15],
  });
};

export const OfficerAssignmentsView: React.FC<OfficerAssignmentsViewProps> = ({
  potholes,
  onSelectPothole,
  onNavigateToMap,
}) => {
  const { user } = useAuth();
  const { potholes: contextPotholes, dispatchAction, refreshReports } = useReports();

  // Combine prop potholes or context
  const allReports = potholes && potholes.length > 0 ? potholes : contextPotholes;

  const [activeTab, setActiveTab] = useState<TabMode>('list');
  const [filter, setFilter] = useState<FilterStatus>('all');

  // Start Work Modal State
  const [startWorkReport, setStartWorkReport] = useState<PotholeReport | null>(null);
  const [startWorkNote, setStartWorkNote] = useState('');
  const [isStartingWork, setIsStartingWork] = useState(false);

  // Mark Resolved Modal State
  const [resolveReport, setResolveReport] = useState<PotholeReport | null>(null);
  const [resolveNote, setResolveNote] = useState('');
  const [resolveNoteError, setResolveNoteError] = useState('');
  const [resolvePhoto, setResolvePhoto] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [isCompressingPhoto, setIsCompressingPhoto] = useState(false);

  // Scoped actor
  const actor: Actor = useMemo(
    () => ({
      id: user.officerId || user.id,
      name: user.displayName || 'Field Officer',
      role: 'officer',
      email: user.email,
      agencyId: user.agencyId,
    }),
    [user]
  );

  // Officer Scoping: backed by getReportsForOfficer() and can()
  const myAssignments = useMemo(
    () => getReportsForOfficer(allReports, actor),
    [allReports, actor]
  );

  // Counts for Stat Cards
  const stats = useMemo(() => {
    const total = myAssignments.length;
    const pendingStart = myAssignments.filter((r) => r.status === 'assigned').length;
    const inProgress = myAssignments.filter((r) => r.status === 'in_progress').length;
    const resolved = myAssignments.filter(
      (r) => r.status === 'resolved' || r.status === 'closed'
    ).length;
    const overdue = myAssignments.filter((r) => isOverdue(r)).length;

    return { total, pendingStart, inProgress, resolved, overdue };
  }, [myAssignments]);

  // Filtering
  const filteredReports = useMemo(() => {
    return myAssignments.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'assigned') return r.status === 'assigned';
      if (filter === 'in_progress') return r.status === 'in_progress';
      if (filter === 'resolved') return r.status === 'resolved' || r.status === 'closed';
      if (filter === 'overdue') return isOverdue(r);
      return true;
    });
  }, [myAssignments, filter]);

  // Sorting: Overdue first, then by priority (critical -> high -> medium -> low), then newest
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const aOverdue = isOverdue(a) ? 1 : 0;
      const bOverdue = isOverdue(b) ? 1 : 0;
      if (aOverdue !== bOverdue) {
        return bOverdue - aOverdue; // Overdue first
      }

      const aPriority = PRIORITY_ORDER[a.priority || 'medium'] || 0;
      const bPriority = PRIORITY_ORDER[b.priority || 'medium'] || 0;
      if (aPriority !== bPriority) {
        return bPriority - aPriority; // Higher priority first
      }

      const aTime = new Date(a.reportedAt).getTime();
      const bTime = new Date(b.reportedAt).getTime();
      return bTime - aTime;
    });
  }, [filteredReports]);

  // Route stops: open assignments (assigned or in_progress), sorted overdue first then priority
  const routeStops = useMemo(() => {
    return myAssignments
      .filter((r) => r.status === 'assigned' || r.status === 'in_progress')
      .sort((a, b) => {
        const aOverdue = isOverdue(a) ? 1 : 0;
        const bOverdue = isOverdue(b) ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;

        const aPriority = PRIORITY_ORDER[a.priority || 'medium'] || 0;
        const bPriority = PRIORITY_ORDER[b.priority || 'medium'] || 0;
        if (aPriority !== bPriority) return bPriority - aPriority;

        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      });
  }, [myAssignments]);

  // Action: Start Work
  const handleOpenStartWork = (e: React.MouseEvent, report: PotholeReport) => {
    e.stopPropagation();
    setStartWorkReport(report);
    setStartWorkNote(`Crew en route. Safety cones and asphalt equipment stationed.`);
  };

  const handleConfirmStartWork = async () => {
    if (!startWorkReport) return;
    setIsStartingWork(true);
    try {
      await dispatchAction(startWorkReport.id, 'startWork', actor, {
        message: startWorkNote.trim() || `Field work started by ${actor.name}.`,
      });
      setStartWorkReport(null);
      setStartWorkNote('');
      await refreshReports();
    } catch (err) {
      console.error('Failed to start work:', err);
    } finally {
      setIsStartingWork(false);
    }
  };

  // Action: Mark Resolved
  const handleOpenResolve = (e: React.MouseEvent, report: PotholeReport) => {
    e.stopPropagation();
    setResolveReport(report);
    setResolveNote('');
    setResolveNoteError('');
    setResolvePhoto(null);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressingPhoto(true);
    try {
      const dataUrl = await compressImageFile(file, 640, 0.7);
      setResolvePhoto(dataUrl);
    } catch (err) {
      console.error('Failed to compress resolution photo:', err);
    } finally {
      setIsCompressingPhoto(false);
    }
  };

  const handleConfirmResolve = async () => {
    if (!resolveReport) return;
    const trimmed = resolveNote.trim();
    if (!trimmed) {
      setResolveNoteError('A resolution note describing what was done is required to resolve this report.');
      return;
    }

    setIsResolving(true);
    setResolveNoteError('');
    try {
      await dispatchAction(resolveReport.id, 'resolve', actor, {
        message: trimmed,
        imageUrl: resolvePhoto || undefined,
        afterImageUrl: resolvePhoto || undefined,
      });
      setResolveReport(null);
      setResolveNote('');
      setResolvePhoto(null);
      await refreshReports();
    } catch (err: any) {
      console.error('Failed to resolve report:', err);
      setResolveNoteError(err.message || 'Failed to mark report resolved.');
    } finally {
      setIsResolving(false);
    }
  };

  const agencyDisplayName =
    (user.agencyId && AGENCY_LABELS[user.agencyId]) || user.agencyId || 'Field Crew';

  const defaultCenter: [number, number] =
    routeStops.length > 0
      ? [routeStops[0].latitude, routeStops[0].longitude]
      : [33.9806, -84.0067]; // GGC Campus Center

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* 1. Header & Greeting */}
      <div className="bg-gradient-to-r from-purple-950/40 via-slate-900 to-slate-900 border border-purple-800/40 rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <span className="text-xs font-bold uppercase tracking-wider text-purple-400 block">
            My Field Assignments
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Welcome, {user.displayName || 'Field Officer'}
            </h1>
            <span className="text-xs font-bold font-mono px-3 py-1 rounded-full bg-purple-950 text-purple-300 border border-purple-800 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
              <span>{agencyDisplayName}</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Manage your assigned road repairs, initiate active site work, log completion photos, and navigate crew routes.
          </p>
        </div>

        {/* View Switcher: List vs Route Map */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto shrink-0 shadow-inner">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'list'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Work Orders ({myAssignments.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('route')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'route'
                ? 'bg-purple-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Crew Route Map ({routeStops.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Assigned"
          value={stats.total}
          subtext="Total work orders"
          icon={Wrench}
          variant="purple"
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'ring-2 ring-purple-500' : ''}
        />
        <StatCard
          label="Pending Start"
          value={stats.pendingStart}
          subtext="Awaiting crew departure"
          icon={Clock}
          variant="amber"
          onClick={() => setFilter('assigned')}
          className={filter === 'assigned' ? 'ring-2 ring-amber-500' : ''}
        />
        <StatCard
          label="In Progress"
          value={stats.inProgress}
          subtext="Active repair sites"
          icon={Activity}
          variant="cyan"
          onClick={() => setFilter('in_progress')}
          className={filter === 'in_progress' ? 'ring-2 ring-cyan-500' : ''}
        />
        <StatCard
          label="Resolved"
          value={stats.resolved}
          subtext="Completed road fixes"
          icon={CheckCircle2}
          variant="emerald"
          onClick={() => setFilter('resolved')}
          className={filter === 'resolved' ? 'ring-2 ring-emerald-500' : ''}
        />
      </div>

      {/* 3. Filter Chips Bar (in List View) */}
      {activeTab === 'list' && (
        <div className="flex items-center justify-between flex-wrap gap-3 pb-1 border-b border-slate-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 mr-1">Filter:</span>
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'all'
                  ? 'bg-purple-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilter('assigned')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'assigned'
                  ? 'bg-amber-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Pending Start ({stats.pendingStart})
            </button>
            <button
              onClick={() => setFilter('in_progress')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'in_progress'
                  ? 'bg-cyan-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              In Progress ({stats.inProgress})
            </button>
            <button
              onClick={() => setFilter('resolved')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                filter === 'resolved'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
              }`}
            >
              Resolved ({stats.resolved})
            </button>
            {stats.overdue > 0 && (
              <button
                onClick={() => setFilter('overdue')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                  filter === 'overdue'
                    ? 'bg-rose-600 text-white shadow'
                    : 'bg-rose-950/40 text-rose-300 hover:text-white border border-rose-800/80'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Overdue ({stats.overdue})</span>
              </button>
            )}
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Sorted: Overdue first, then Priority
          </span>
        </div>
      )}

      {/* 4. Tab 1: Work Orders List */}
      {activeTab === 'list' && (
        <>
          {sortedReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedReports.map((report) => {
                const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`;

                return (
                  <ReportCard
                    key={report.id}
                    report={report}
                    onClick={onSelectPothole ? () => onSelectPothole(report) : undefined}
                    actions={
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        {/* Google Maps Directions */}
                        <a
                          href={directionsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5"
                          title="Open navigation directions in Google Maps"
                        >
                          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                          <span>Directions</span>
                        </a>

                        {/* Status-specific action button */}
                        {report.status === 'assigned' && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenStartWork(e, report)}
                            className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>Start Work</span>
                          </button>
                        )}

                        {report.status === 'in_progress' && (
                          <button
                            type="button"
                            onClick={(e) => handleOpenResolve(e, report)}
                            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer ml-auto"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Mark Resolved</span>
                          </button>
                        )}

                        {(report.status === 'resolved' || report.status === 'closed') && (
                          <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 ml-auto">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completed</span>
                          </span>
                        )}
                      </div>
                    }
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12">
              <EmptyState
                icon={Wrench}
                title={
                  filter === 'all'
                    ? 'No Field Assignments Found'
                    : `No ${filter.replace('_', ' ')} assignments`
                }
                description={
                  filter === 'all'
                    ? 'You currently have no road repair tickets assigned to your crew.'
                    : `There are currently no assignments matching the "${filter}" filter.`
                }
                action={
                  filter !== 'all'
                    ? {
                        label: 'View All Assignments',
                        onClick: () => setFilter('all'),
                      }
                    : onNavigateToMap
                    ? {
                        label: 'Explore Incident Map',
                        onClick: onNavigateToMap,
                      }
                    : undefined
                }
              />
            </div>
          )}
        </>
      )}

      {/* 5. Tab 2: Crew Route Map */}
      {activeTab === 'route' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <Navigation className="w-5 h-5 text-cyan-400" />
                  <span>Crew Repair Route Sequence</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Optimized sequence of active work orders prioritized by overdue status and hazard severity.
                </p>
              </div>

              <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-slate-950 text-slate-300 border border-slate-800">
                {routeStops.length} Active Waypoints
              </span>
            </div>

            {routeStops.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Interactive Leaflet Map */}
                <div className="lg:col-span-2 h-[450px] rounded-2xl overflow-hidden border border-slate-800 relative z-0 shadow-inner">
                  <MapContainer
                    center={defaultCenter}
                    zoom={13}
                    scrollWheelZoom={true}
                    className="w-full h-full"
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {routeStops.map((report, idx) => (
                      <Marker
                        key={report.id}
                        position={[report.latitude, report.longitude]}
                        icon={createRoutePinIcon(idx + 1, report.status)}
                      >
                        <Popup>
                          <div className="p-1 space-y-2 text-slate-900">
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span className="bg-purple-700 text-white w-5 h-5 rounded-full inline-flex items-center justify-center text-[11px]">
                                {idx + 1}
                              </span>
                              <span>{report.roadName || report.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-600">
                              {report.address} ({report.city})
                            </p>
                            <div className="text-[10px] font-mono text-purple-700 font-bold uppercase">
                              Status: {report.status.replace('_', ' ')} • Priority: {report.priority}
                            </div>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 underline mt-1"
                            >
                              <Navigation className="w-3 h-3" />
                              <span>Navigate Here (Google Maps)</span>
                            </a>
                          </div>
                        </Popup>
                      </Marker>
                    ))}
                  </MapContainer>
                </div>

                {/* Ordered Route Stops List */}
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                  {routeStops.map((report, idx) => {
                    const overdue = isOverdue(report);
                    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${report.latitude},${report.longitude}`;

                    return (
                      <div
                        key={report.id}
                        onClick={onSelectPothole ? () => onSelectPothole(report) : undefined}
                        className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-3.5 space-y-2 transition cursor-pointer shadow-sm group"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-mono font-bold text-xs flex items-center justify-center shrink-0 shadow">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-mono font-bold text-teal-400">
                              {report.trackingCode || `#${report.id.slice(-6)}`}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <StatusBadge status={report.status} size="sm" />
                            <PriorityBadge priority={report.priority || 'medium'} size="sm" />
                            {overdue && (
                              <span className="text-[10px] font-bold font-mono px-1.5 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                                Overdue
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-xs font-bold text-white group-hover:text-purple-300 transition truncate">
                            {report.title}
                          </h4>
                          <p className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                            <span>{report.roadName || report.address}</span>
                          </p>
                        </div>

                        {/* Directions & Actions */}
                        <div className="pt-2 border-t border-slate-900 flex items-center justify-between gap-2">
                          <a
                            href={directionsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-cyan-400 border border-slate-800 text-[11px] font-bold rounded-lg transition flex items-center gap-1"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Directions</span>
                          </a>

                          {report.status === 'assigned' && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenStartWork(e, report)}
                              className="px-2.5 py-1 bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Start</span>
                            </button>
                          )}

                          {report.status === 'in_progress' && (
                            <button
                              type="button"
                              onClick={(e) => handleOpenResolve(e, report)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Resolve</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-8">
                <EmptyState
                  icon={CheckCircle2}
                  title="Route Clear! No Open Work Orders"
                  description="All assigned work orders are resolved. No active road hazard waypoints remain on your crew route."
                  action={
                    onNavigateToMap
                      ? {
                          label: 'Explore Pothole Map',
                          onClick: onNavigateToMap,
                        }
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 6. Modal: Start Work (assigned -> in_progress) */}
      {startWorkReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Start Field Work</h3>
                  <span className="text-xs font-mono text-teal-400">
                    {startWorkReport.trackingCode || `#${startWorkReport.id}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setStartWorkReport(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-white">{startWorkReport.title}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{startWorkReport.address || startWorkReport.roadName}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 block">
                Work Initiation Note (Optional):
              </label>
              <textarea
                value={startWorkNote}
                onChange={(e) => setStartWorkNote(e.target.value)}
                rows={3}
                placeholder="Crew en route, safety cones placed, beginning road cut..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-cyan-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setStartWorkReport(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isStartingWork}
                onClick={handleConfirmStartWork}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{isStartingWork ? 'Starting...' : 'Confirm & Start Work'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Modal: Mark Resolved (in_progress -> resolved) */}
      {resolveReport && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Mark Work Order Resolved</h3>
                  <span className="text-xs font-mono text-teal-400">
                    {resolveReport.trackingCode || `#${resolveReport.id}`}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setResolveReport(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-full bg-slate-800 hover:bg-slate-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1">
              <div className="text-xs font-bold text-white">{resolveReport.title}</div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500" />
                <span>{resolveReport.address || resolveReport.roadName}</span>
              </div>
            </div>

            {/* Required Note Field */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-emerald-300 block">
                What Was Done (Required):
              </label>
              <textarea
                value={resolveNote}
                onChange={(e) => {
                  setResolveNote(e.target.value);
                  if (resolveNoteError) setResolveNoteError('');
                }}
                rows={3}
                placeholder="Describe repair actions (e.g. excavated cavity, hot-mix asphalt filled, compacted flush with road)..."
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 outline-none resize-none"
              />
              {resolveNoteError && (
                <p className="text-xs text-rose-400 font-medium">{resolveNoteError}</p>
              )}
            </div>

            {/* Optional "After" Photo with Compression */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Upload "After" Photo (Optional):</span>
                <span className="text-[10px] text-slate-500">Auto-compressed for storage</span>
              </label>

              {resolvePhoto ? (
                <div className="relative rounded-2xl overflow-hidden border border-emerald-800/80 bg-slate-950 aspect-video max-h-48 group">
                  <img
                    src={resolvePhoto}
                    alt="After repair preview"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setResolvePhoto(null)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-rose-900 text-white transition cursor-pointer"
                    title="Remove photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-emerald-950/90 backdrop-blur px-2 py-0.5 rounded text-[10px] text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>Resolution Photo Attached</span>
                  </div>
                </div>
              ) : (
                <label className="border border-dashed border-slate-700 hover:border-emerald-500/80 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 bg-slate-950/50 hover:bg-slate-950 transition cursor-pointer">
                  <Camera className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300">
                    {isCompressingPhoto ? 'Compressing photo...' : 'Click to take or attach "After" photo'}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    JPEG / PNG compressed to &lt;50KB
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={isCompressingPhoto}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResolveReport(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResolving || isCompressingPhoto}
                onClick={handleConfirmResolve}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isResolving ? 'Resolving...' : 'Complete & Mark Resolved'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

