import React, { useState, useMemo } from 'react';
import { PotholeReport, Actor } from '../../domain/types';
import { ReportStatus } from '../../domain/status';
import { slaDueAt, isOverdue, daysOpen } from '../../domain/sla';
import { classifyJurisdiction } from '../../services/jurisdictionClassifier';
import { AUTHORITIES_DIRECTORY } from '../../data/jurisdictionsData';
import {
  DEMO_OFFICERS,
  Officer,
  AGENCY_LABELS,
  getOfficersByAgency,
} from '../../data/officersData';
import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import { PriorityBadge, StatusBadge, EmptyState } from '../kit';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { MunicipalDispatcherModal } from '../potholes/MunicipalDispatcherModal';
import {
  Mail,
  Calendar,
  Clock,
  AlertTriangle,
  Building2,
  User,
  UserCheck,
  CheckCircle2,
  X,
  ExternalLink,
  FileDown,
  RotateCw,
  Send,
  MapPin,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';

export interface DispatchBoardViewProps {
  potholes?: PotholeReport[];
  onSelectPotholeForMap?: (p: PotholeReport) => void;
  onOpenDispatcherModal?: (p: PotholeReport) => void;
}

const BOARD_COLUMNS: {
  status: ReportStatus;
  title: string;
  badgeClass: string;
  dotColor: string;
}[] = [
  {
    status: 'verified',
    title: 'Verified',
    badgeClass: 'bg-blue-950 text-blue-300 border-blue-800',
    dotColor: 'bg-blue-400',
  },
  {
    status: 'assigned',
    title: 'Assigned',
    badgeClass: 'bg-purple-950 text-purple-300 border-purple-800',
    dotColor: 'bg-purple-400',
  },
  {
    status: 'in_progress',
    title: 'In Progress',
    badgeClass: 'bg-amber-950 text-amber-300 border-amber-800',
    dotColor: 'bg-amber-400',
  },
  {
    status: 'resolved',
    title: 'Resolved',
    badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800',
    dotColor: 'bg-emerald-400',
  },
];

export const DispatchBoardView: React.FC<DispatchBoardViewProps> = ({
  potholes: propPotholes,
  onSelectPotholeForMap,
  onOpenDispatcherModal,
}) => {
  const { potholes: contextPotholes, dispatchAction } = useReports();
  const potholes = propPotholes || contextPotholes;
  const { user } = useAuth();

  const adminActor: Actor = useMemo(
    () => ({
      name: user?.displayName || 'Municipal Operations Admin',
      email: user?.email,
      role: 'admin',
    }),
    [user]
  );

  // Mobile active tab for phones (verified | assigned | in_progress | resolved)
  const [mobileTab, setMobileTab] = useState<ReportStatus>('verified');

  // Modals state
  const [assignTargetReport, setAssignTargetReport] = useState<PotholeReport | null>(null);
  const [closeTargetReport, setCloseTargetReport] = useState<PotholeReport | null>(null);
  const [emailModalReport, setEmailModalReport] = useState<PotholeReport | null>(null);

  // Assign Dialog internal form state
  const [selectedAgencyId, setSelectedAgencyId] = useState<string>('GWINNETT_COUNTY');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>('');
  const [assignNote, setAssignNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Close Dialog internal form state
  const [closeNote, setCloseNote] = useState<string>('');

  // Compute officer workload: number of assigned or in_progress reports
  const getOfficerOpenWorkload = (officer: Officer): number => {
    return potholes.filter((p) => {
      const isAssigned =
        p.assignedOfficerId === officer.id ||
        p.assignedOfficerId === officer.name ||
        p.assignedCrew === officer.name;
      const isOpen = p.status === 'assigned' || p.status === 'in_progress';
      return isAssigned && isOpen;
    }).length;
  };

  // Group reports by column status
  const columnReports = useMemo(() => {
    const map: Record<ReportStatus, PotholeReport[]> = {
      reported: [],
      verified: [],
      assigned: [],
      in_progress: [],
      resolved: [],
      closed: [],
      rejected: [],
    };
    for (const p of potholes) {
      if (map[p.status]) {
        map[p.status].push(p);
      }
    }
    return map;
  }, [potholes]);

  // Handle opening Assign / Reassign dialog
  const handleOpenAssignModal = (report: PotholeReport) => {
    setAssignTargetReport(report);
    setErrorMessage(null);
    setAssignNote('');

    // Preselect agency: from existing report assignment, authority, or jurisdictionClassifier
    let preselectedAgency = report.assignedAgencyId || report.authorityId;
    if (!preselectedAgency || !AUTHORITIES_DIRECTORY[preselectedAgency]) {
      try {
        const classified = classifyJurisdiction(
          report.latitude,
          report.longitude,
          report.roadName || report.address || ''
        );
        if (classified?.authority?.id) {
          preselectedAgency = classified.authority.id;
        }
      } catch {
        preselectedAgency = 'GWINNETT_COUNTY';
      }
    }
    const finalAgency = preselectedAgency || 'GWINNETT_COUNTY';
    setSelectedAgencyId(finalAgency);

    // Filter officers to selected agency
    const officers = getOfficersByAgency(finalAgency);
    if (officers.length > 0) {
      // Default to existing assigned officer if valid for this agency, else first
      const existing = officers.find(
        (o) => o.id === report.assignedOfficerId || o.name === report.assignedCrew
      );
      setSelectedOfficerId(existing ? existing.id : officers[0].id);
    } else {
      setSelectedOfficerId('');
    }
  };

  // When agency changes in the Assign dialog, filter officers
  const handleAgencyChange = (newAgencyId: string) => {
    setSelectedAgencyId(newAgencyId);
    const officers = getOfficersByAgency(newAgencyId);
    setSelectedOfficerId(officers.length > 0 ? officers[0].id : '');
  };

  // Officers filtered for current selection in assign modal
  const modalOfficers = useMemo(() => {
    return getOfficersByAgency(selectedAgencyId);
  }, [selectedAgencyId]);

  // Calculate target SLA deadline for assign modal
  const targetSlaDays = useMemo(() => {
    const authority = AUTHORITIES_DIRECTORY[selectedAgencyId];
    return authority?.slaTargetDays ?? 3;
  }, [selectedAgencyId]);

  const modalCalculatedDeadline = useMemo(() => {
    if (!assignTargetReport) return '';
    return slaDueAt(assignTargetReport, targetSlaDays);
  }, [assignTargetReport, targetSlaDays]);

  // Confirm Assign or Reassign action
  const handleConfirmAssign = async () => {
    if (!assignTargetReport) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const isReassign = assignTargetReport.status === 'assigned';
      const actionName = isReassign ? 'reassign' : 'assign';
      const selectedOfficer = modalOfficers.find((o) => o.id === selectedOfficerId);

      await dispatchAction(assignTargetReport.id, actionName, adminActor, {
        assignedAgencyId: selectedAgencyId,
        assignedOfficerId: selectedOfficer?.id || selectedOfficerId,
        assignedCrew: selectedOfficer?.name || selectedOfficerId,
        slaDueAt: modalCalculatedDeadline,
        message: assignNote.trim() || undefined,
      });

      setAssignTargetReport(null);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to dispatch assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Admin Close action
  const handleConfirmClose = async () => {
    if (!closeTargetReport) return;
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      await dispatchAction(closeTargetReport.id, 'close', adminActor, {
        message: closeNote.trim() || 'Work order officially closed and verified by municipal administrator.',
      });

      setCloseTargetReport(null);
      setCloseNote('');
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to close work order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle email dispatch click on a card
  const handleTriggerEmail = (report: PotholeReport) => {
    if (onOpenDispatcherModal) {
      onOpenDispatcherModal(report);
    } else {
      setEmailModalReport(report);
    }
  };

  // Card render helper
  const renderCard = (report: PotholeReport) => {
    const overdue = isOverdue(report);
    const days = daysOpen(report);
    const agencyName =
      (report.assignedAgencyId && AGENCY_LABELS[report.assignedAgencyId]) ||
      report.authorityName ||
      report.jurisdiction ||
      'Gwinnett County';

    const deadlineFormatted = report.slaDueAt
      ? new Date(report.slaDueAt).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null;

    return (
      <div
        key={report.id}
        data-testid={`dispatch-card-${report.id}`}
        className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 shadow-md transition space-y-3"
      >
        {/* Top Line: Priority, Overdue Badge & Tracking Code */}
        <div className="flex items-center justify-between gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <PriorityBadge
              priority={report.priority || 'medium'}
              score={report.priorityScore}
              size="sm"
            />
            {overdue && (
              <span
                data-testid="overdue-badge"
                className="inline-flex items-center gap-1 text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 uppercase tracking-wider"
              >
                <AlertTriangle className="w-3 h-3 text-rose-400" />
                <span>Overdue</span>
              </span>
            )}
          </div>
          <span className="font-mono text-[11px] font-bold text-teal-400">
            {report.trackingCode || `#${report.id.slice(-6)}`}
          </span>
        </div>

        {/* Road & Title */}
        <div>
          <h4 className="text-sm font-bold text-white tracking-tight line-clamp-1">
            {report.roadName || report.title}
          </h4>
          <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5 truncate">
            <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
            <span className="truncate">{report.address || report.roadName}</span>
          </p>
        </div>

        {/* Metadata Details: Agency, Days Open, SLA Deadline */}
        <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-xs text-slate-400">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">Agency:</span>
            <span
              data-testid="card-agency"
              className="text-slate-200 font-medium truncate max-w-[180px] text-right"
              title={agencyName}
            >
              {agencyName}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">Days open:</span>
            <span data-testid="card-days-open" className="font-mono font-semibold text-slate-200">
              {days} {days === 1 ? 'day' : 'days'} open
            </span>
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">Deadline:</span>
            <span
              data-testid="card-deadline"
              className={`font-mono text-[11px] font-semibold ${
                overdue ? 'text-rose-400' : 'text-slate-300'
              }`}
            >
              {deadlineFormatted ? `Due: ${deadlineFormatted}` : 'No deadline'}
            </span>
          </div>

          {(report.assignedOfficerId || report.assignedCrew) && (
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/40">
              <span className="text-[11px] text-slate-500">Assigned:</span>
              <span className="text-slate-300 text-[11px] truncate font-medium">
                {report.assignedCrew || report.assignedOfficerId}
              </span>
            </div>
          )}
        </div>

        {/* Card Action Buttons */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-1.5">
          {/* Status specific primary actions */}
          {report.status === 'verified' && (
            <button
              type="button"
              onClick={() => handleOpenAssignModal(report)}
              className="w-full py-1.5 px-3 bg-purple-700 hover:bg-purple-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>Assign Crew</span>
            </button>
          )}

          {report.status === 'assigned' && (
            <button
              type="button"
              onClick={() => handleOpenAssignModal(report)}
              className="w-full py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-800/60 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Reassign Crew</span>
            </button>
          )}

          {report.status === 'resolved' && (
            <button
              type="button"
              onClick={() => {
                setCloseTargetReport(report);
                setCloseNote('');
                setErrorMessage(null);
              }}
              className="w-full py-1.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Close</span>
            </button>
          )}

          {/* Universal Work Order Email Button */}
          <div className="flex items-center gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => handleTriggerEmail(report)}
              className="flex-1 py-1.5 px-2.5 bg-slate-800 hover:bg-blue-600/80 text-slate-300 hover:text-white border border-slate-700 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 truncate"
              title="Send Certified Work Order Email"
            >
              <Mail className="w-3.5 h-3.5 text-blue-400" />
              <span className="truncate">Send Work Order Email</span>
            </button>

            {onSelectPotholeForMap && (
              <button
                type="button"
                onClick={() => onSelectPotholeForMap(report)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-teal-600 text-slate-400 hover:text-white border border-slate-700 transition"
                title="Inspect on Interactive Map"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={() => generatePotholePdf(report)}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-purple-700 text-slate-400 hover:text-white border border-slate-700 transition"
              title="Download Certified PDF Work Order"
            >
              <FileDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Board Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <span className="text-xl font-black text-white">Agency Dispatch Board</span>
              <span className="bg-purple-950 text-purple-300 border border-purple-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                Kanban Workflow
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Field crew assignment pipeline: route verified hazards to agencies, track live SLA deadlines, and oversee repairs.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-semibold">{potholes.length}</span>
              <span className="text-slate-400">Total Work Orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Tab Switcher (Phones) */}
      <div className="block md:hidden">
        <div className="grid grid-cols-2 gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
          {BOARD_COLUMNS.map((col) => {
            const count = columnReports[col.status]?.length || 0;
            const isActive = mobileTab === col.status;
            return (
              <button
                key={col.status}
                type="button"
                onClick={() => setMobileTab(col.status)}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-between ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                <span>{col.title}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    isActive ? 'bg-purple-900/80 text-purple-200' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile View: Render active column only */}
        <div className="mt-4 space-y-3">
          {columnReports[mobileTab]?.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-8 text-center">
              <p className="text-xs text-slate-400">No work orders currently in {mobileTab.replace('_', ' ')}.</p>
            </div>
          ) : (
            columnReports[mobileTab]?.map(renderCard)
          )}
        </div>
      </div>

      {/* Desktop 4-Column Kanban Board */}
      <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
        {BOARD_COLUMNS.map((col) => {
          const reports = columnReports[col.status] || [];
          return (
            <div
              key={col.status}
              data-testid={`dispatch-column-${col.status}`}
              className="bg-slate-950/60 border border-slate-800/80 rounded-3xl p-4 flex flex-col space-y-3 min-h-[500px]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {col.title}
                  </h3>
                </div>
                <span
                  data-testid={`column-count-${col.status}`}
                  className="font-mono text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-900 text-slate-300 border border-slate-800"
                >
                  {reports.length}
                </span>
              </div>

              {/* Cards List */}
              <div className="space-y-3 flex-1 overflow-y-auto max-h-[800px] pr-0.5">
                {reports.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-center p-4 border border-dashed border-slate-800/80 rounded-2xl">
                    <span className="text-[11px] text-slate-500">No {col.title.toLowerCase()} work orders</span>
                  </div>
                ) : (
                  reports.map(renderCard)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign / Reassign Dialog Modal */}
      {assignTargetReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {assignTargetReport.status === 'assigned' ? 'Reassign Work Order' : 'Assign Work Order'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Select target agency & maintenance crew with live workload tracking
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAssignTargetReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Report Context Pill */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-4 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-teal-400 font-bold">{assignTargetReport.trackingCode}</span>
                <PriorityBadge priority={assignTargetReport.priority || 'medium'} size="sm" />
              </div>
              <p className="font-bold text-white truncate">{assignTargetReport.roadName || assignTargetReport.address}</p>
              <p className="text-[11px] text-slate-400">{assignTargetReport.city || 'Gwinnett County'}, GA</p>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-4 text-xs">
              {/* Agency Selector */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Target Municipal Agency / Jurisdiction:
                </label>
                <select
                  data-testid="assign-agency-select"
                  value={selectedAgencyId}
                  onChange={(e) => handleAgencyChange(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                >
                  {Object.keys(AUTHORITIES_DIRECTORY).map((agencyKey) => (
                    <option key={agencyKey} value={agencyKey}>
                      {AGENCY_LABELS[agencyKey] || AUTHORITIES_DIRECTORY[agencyKey].name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Officer Dropdown (Filtered to selected agency, shows open workload) */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Assigned Maintenance Officer / Crew:
                </label>
                {modalOfficers.length === 0 ? (
                  <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 text-slate-400 text-xs">
                    No specific officers listed for this agency. Will be dispatched to general field crew.
                  </div>
                ) : (
                  <select
                    data-testid="assign-officer-select"
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs focus:ring-1 focus:ring-purple-500 outline-none"
                  >
                    {modalOfficers.map((officer) => {
                      const openCount = getOfficerOpenWorkload(officer);
                      return (
                        <option key={officer.id} value={officer.id}>
                          {officer.name} ({openCount} open) - {officer.title}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Target SLA Deadline Preview */}
              <div className="bg-purple-950/40 border border-purple-800/50 rounded-2xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-300 block">SLA Target Turnaround:</span>
                  <span className="text-white font-mono font-bold text-xs">
                    {targetSlaDays} {targetSlaDays === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-slate-400 block">Calculated Resolution Deadline:</span>
                  <span
                    data-testid="calculated-deadline-preview"
                    className="font-mono text-emerald-400 font-bold text-xs"
                  >
                    {modalCalculatedDeadline
                      ? new Date(modalCalculatedDeadline).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A'}
                  </span>
                </div>
              </div>

              {/* Assignment Note */}
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Crew Dispatch Note (Optional):
                </label>
                <textarea
                  value={assignNote}
                  onChange={(e) => setAssignNote(e.target.value)}
                  placeholder="e.g. Inspect storm drain edge and apply hot-mix asphalt patch..."
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-purple-500 outline-none"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setAssignTargetReport(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-assignment-button"
                onClick={handleConfirmAssign}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-lg shadow-purple-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Dispatching...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Close Dialog Modal */}
      {closeTargetReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Admin Close Work Order</h3>
                  <p className="text-xs text-slate-400">
                    Officially close and archive resolved road defect
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCloseTargetReport(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 mb-4 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-teal-400 font-bold">{closeTargetReport.trackingCode}</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Resolved
                </span>
              </div>
              <p className="font-bold text-white truncate">{closeTargetReport.roadName || closeTargetReport.address}</p>
            </div>

            {errorMessage && (
              <div className="mb-4 bg-rose-950/80 border border-rose-800 text-rose-200 text-xs p-3 rounded-xl flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                This report is marked <span className="text-emerald-400 font-semibold">Resolved</span>. Closing it archives the case and notifies the reporting citizen without requiring a public star rating.
              </p>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Administrative Close Note:
                </label>
                <textarea
                  data-testid="close-note-input"
                  value={closeNote}
                  onChange={(e) => setCloseNote(e.target.value)}
                  placeholder="e.g. Verified road surface asphalt compaction meets municipal standards."
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-xs placeholder-slate-500 focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-4 mt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setCloseTargetReport(null)}
                className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                data-testid="confirm-close-button"
                onClick={handleConfirmClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Closing...' : 'Close & Archive'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Internal MunicipalDispatcherModal fallback if triggered without external handler */}
      {emailModalReport && !onOpenDispatcherModal && (
        <MunicipalDispatcherModal
          isOpen={!!emailModalReport}
          onClose={() => setEmailModalReport(null)}
          pothole={emailModalReport}
          allPotholes={potholes}
          onSelectPothole={setEmailModalReport}
          onUpdateStatus={() => {}}
        />
      )}
    </div>
  );
};
