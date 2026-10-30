import React, { useState, useMemo } from 'react';
import { PotholeReport, ReportPriority, RejectedReason, Actor } from '../../domain/types';
import { isOpenStatus } from '../../domain/status';
import { priorityScore, suggestPriority } from '../../domain/priority';
import { milesBetween } from '../../services/distanceCalculator';
import { classifyJurisdiction } from '../../services/jurisdictionClassifier';
import { AGENCY_LABELS } from '../../data/officersData';
import { useReports } from '../../context/ReportsContext';
import { useAuth } from '../../context/AuthContext';
import {
  SectionHeader,
  PriorityBadge,
  EmptyState
} from '../kit';
import {
  ListFilter,
  CheckCircle2,
  XCircle,
  GitMerge,
  Camera,
  ThumbsUp,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  CheckSquare,
  Square,
  X,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

export interface TriageQueueViewProps {
  potholes: PotholeReport[];
  onSelectPotholeForMap?: (p: PotholeReport) => void;
}

export function formatAge(isoDate?: string): string {
  if (!isoDate) return 'Unknown';
  const diffMs = Date.now() - new Date(isoDate).getTime();
  if (Number.isNaN(diffMs)) return 'Unknown';
  const diffMins = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (3600 * 1000));
  const diffDays = Math.floor(diffMs / (86400 * 1000));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return '1d ago';
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Date(isoDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatPeakG(report: PotholeReport): string {
  if (report.bumpIntensity && report.bumpIntensity > 0) {
    return `${report.bumpIntensity.toFixed(1)}G`;
  }
  if (report.sensorEvidence?.maxGForce && report.sensorEvidence.maxGForce > 0) {
    return `${report.sensorEvidence.maxGForce.toFixed(1)}G`;
  }
  return '—';
}

export function getSuggestedAgency(report: PotholeReport): string {
  if (report.assignedAgencyId && AGENCY_LABELS[report.assignedAgencyId]) {
    return AGENCY_LABELS[report.assignedAgencyId];
  }
  if (report.authorityName) return report.authorityName;
  if (report.jurisdiction) return report.jurisdiction;
  try {
    const res = classifyJurisdiction(report.latitude, report.longitude, report.roadName);
    return res.authority.name;
  } catch {
    return 'Gwinnett County DOT';
  }
}

export const REJECT_OPTIONS: { value: RejectedReason; label: string; desc: string }[] = [
  {
    value: 'duplicate',
    label: 'Duplicate Report',
    desc: 'Already reported and actively managed under another docket',
  },
  {
    value: 'not_a_pothole',
    label: 'Not a Pothole',
    desc: 'Normal surface wear, shallow joint, or non-hazardous defect',
  },
  {
    value: 'out_of_area',
    label: 'Out of Jurisdiction',
    desc: 'Defect located on private roadway or outside maintenance limits',
  },
  {
    value: 'insufficient_info',
    label: 'Insufficient Information',
    desc: 'Location or defect photos unclear; cannot verify in the field',
  },
];

export const TriageQueueView: React.FC<TriageQueueViewProps> = ({
  potholes,
  onSelectPotholeForMap,
}) => {
  const { dispatchAction } = useReports();
  const { user } = useAuth();

  const adminActor: Actor = useMemo(() => ({
    id: user?.id || 'admin-1',
    name: user?.displayName || 'Municipal Triage Admin',
    role: 'admin',
    email: user?.email || 'admin@gwinnettcounty.gov',
  }), [user]);

  // Selected row IDs for bulk operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Modal Dialog States
  const [activeVerifyReport, setActiveVerifyReport] = useState<PotholeReport | null>(null);
  const [verifyPriority, setVerifyPriority] = useState<ReportPriority>('medium');
  const [verifyNote, setVerifyNote] = useState('');

  const [activeRejectReport, setActiveRejectReport] = useState<PotholeReport | null>(null);
  const [rejectReason, setRejectReason] = useState<RejectedReason>('duplicate');
  const [rejectNote, setRejectNote] = useState('');

  const [activeMergeReport, setActiveMergeReport] = useState<PotholeReport | null>(null);
  const [selectedMergeTargetId, setSelectedMergeTargetId] = useState<string>('');
  const [mergeNote, setMergeNote] = useState('');

  // 1. Triage queue (status 'reported'), sorted strictly by priorityScore (highest first)
  const queueReports = useMemo(() => {
    return potholes
      .filter((p) => p.status === 'reported')
      .map((p) => {
        const score = p.priorityScore ?? priorityScore(p);
        const priority = p.priority || suggestPriority(score);
        return {
          ...p,
          priorityScore: score,
          priority,
        };
      })
      .sort((a, b) => (b.priorityScore ?? 0) - (a.priorityScore ?? 0));
  }, [potholes]);

  // Nearby candidates for Merge modal
  const mergeCandidates = useMemo(() => {
    if (!activeMergeReport) return [];
    return potholes
      .filter((p) => isOpenStatus(p.status) && p.id !== activeMergeReport.id)
      .map((p) => ({
        report: p,
        distMiles: milesBetween(
          { lat: activeMergeReport.latitude, lng: activeMergeReport.longitude },
          { lat: p.latitude, lng: p.longitude }
        ),
      }))
      .sort((a, b) => a.distMiles - b.distMiles);
  }, [potholes, activeMergeReport]);

  // --- SELECTION HANDLERS ---
  const handleToggleSelectAll = () => {
    if (selectedIds.size === queueReports.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(queueReports.map((r) => r.id)));
    }
  };

  const handleToggleSelectRow = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // --- ACTION MODAL TRIGGERS ---
  const handleOpenVerify = (report: PotholeReport) => {
    const suggested = report.priority || suggestPriority(report.priorityScore ?? priorityScore(report));
    setVerifyPriority(suggested);
    setVerifyNote('');
    setActiveVerifyReport(report);
  };

  const handleOpenReject = (report: PotholeReport) => {
    setRejectReason('duplicate');
    setRejectNote('');
    setActiveRejectReport(report);
  };

  const handleOpenMerge = (report: PotholeReport) => {
    setSelectedMergeTargetId('');
    setMergeNote('');
    setActiveMergeReport(report);
  };

  // --- ACTION SUBMISSIONS ---
  const handleConfirmVerify = async () => {
    if (!activeVerifyReport) return;
    setIsProcessing(true);
    try {
      await dispatchAction(activeVerifyReport.id, 'verify', adminActor, {
        priority: verifyPriority,
        message: verifyNote.trim() || undefined,
      });
      setActionNotice(`Verified report ${activeVerifyReport.trackingCode || activeVerifyReport.id} with priority ${verifyPriority.toUpperCase()}.`);
      setTimeout(() => setActionNotice(null), 4000);
      setActiveVerifyReport(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(activeVerifyReport.id);
        return next;
      });
    } catch (err: any) {
      alert(`Error verifying report: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!activeRejectReport) return;
    setIsProcessing(true);
    try {
      await dispatchAction(activeRejectReport.id, 'reject', adminActor, {
        reason: rejectReason,
        message: rejectNote.trim() || undefined,
      });
      setActionNotice(`Rejected report ${activeRejectReport.trackingCode || activeRejectReport.id} (${rejectReason}).`);
      setTimeout(() => setActionNotice(null), 4000);
      setActiveRejectReport(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(activeRejectReport.id);
        return next;
      });
    } catch (err: any) {
      alert(`Error rejecting report: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmMerge = async () => {
    if (!activeMergeReport || !selectedMergeTargetId) {
      alert('Please select a target master report to merge into.');
      return;
    }
    setIsProcessing(true);
    try {
      await dispatchAction(activeMergeReport.id, 'merge', adminActor, {
        mergedIntoId: selectedMergeTargetId,
        message: mergeNote.trim() || undefined,
      });
      setActionNotice(`Merged report ${activeMergeReport.trackingCode || activeMergeReport.id} into master ticket #${selectedMergeTargetId}.`);
      setTimeout(() => setActionNotice(null), 4000);
      setActiveMergeReport(null);
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(activeMergeReport.id);
        return next;
      });
    } catch (err: any) {
      alert(`Error merging report: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- BULK VERIFY ACTION ---
  const handleBulkVerify = async () => {
    if (selectedIds.size === 0) return;
    setIsProcessing(true);
    try {
      const idsToVerify = Array.from(selectedIds);
      for (const id of idsToVerify) {
        const rep = queueReports.find((p) => p.id === id);
        if (rep) {
          const suggested = rep.priority || suggestPriority(rep.priorityScore ?? priorityScore(rep));
          await dispatchAction(id, 'verify', adminActor, {
            priority: suggested,
            message: 'Bulk verified via triage queue',
          });
        }
      }
      setActionNotice(`Successfully verified ${idsToVerify.length} reports with their suggested priorities.`);
      setTimeout(() => setActionNotice(null), 4000);
      setSelectedIds(new Set());
    } catch (err: any) {
      alert(`Error during bulk verification: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const allSelected = queueReports.length > 0 && selectedIds.size === queueReports.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Header */}
      <SectionHeader
        title="Road Hazard Triage Queue"
        subtitle="Review, verify, reject, and merge incoming citizen and telemetry hazard submissions."
        badge={`${queueReports.length} Pending Review`}
        badgeColor="bg-amber-950 text-amber-300 border-amber-800"
      />

      {actionNotice && (
        <div className="bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-md animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="bg-amber-950/40 border border-amber-700/60 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center space-x-2 text-xs font-semibold text-amber-200">
            <CheckSquare className="w-4 h-4 text-amber-400" />
            <span>
              {selectedIds.size} of {queueReports.length} report{selectedIds.size === 1 ? '' : 's'} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              disabled={isProcessing}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Clear Selection
            </button>
            <button
              onClick={handleBulkVerify}
              disabled={isProcessing}
              data-testid="bulk-verify-btn"
              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1.5 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Verify Selected ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Triage Queue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
        {queueReports.length === 0 ? (
          <EmptyState
            icon={ListFilter}
            title="Triage queue is all caught up!"
            description="There are currently no reported road hazards awaiting triage verification (automated AI triage rules coming in a later task)."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-3 px-3 w-8 text-center">
                    <button
                      onClick={handleToggleSelectAll}
                      data-testid="select-all-checkbox"
                      title={allSelected ? 'Deselect all' : 'Select all'}
                      aria-label="Select all rows"
                      className="text-slate-400 hover:text-white transition cursor-pointer"
                    >
                      {allSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-3 w-14">Photo</th>
                  <th className="py-3 px-4">Roadway & Docket</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3 text-center">Peak G</th>
                  <th className="py-3 px-3 text-center">Confirmations</th>
                  <th className="py-3 px-4">Suggested Agency</th>
                  <th className="py-3 px-3">Age</th>
                  <th className="py-3 px-3 text-center">Priority Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {queueReports.map((report) => {
                  const isSelected = selectedIds.has(report.id);
                  const suggestedAgency = getSuggestedAgency(report);
                  const peakG = formatPeakG(report);
                  const age = formatAge(report.reportedAt);

                  return (
                    <tr
                      key={report.id}
                      className={`hover:bg-slate-800/40 transition group ${
                        isSelected ? 'bg-emerald-950/20' : ''
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => handleToggleSelectRow(report.id)}
                          data-testid={`select-report-${report.id}`}
                          aria-label={`Select report ${report.trackingCode || report.id}`}
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Photo Thumbnail */}
                      <td className="py-3.5 px-3">
                        {report.imageUrl ? (
                          <img
                            src={report.imageUrl}
                            alt="Hazard thumbnail"
                            className="w-10 h-10 rounded-xl object-cover border border-slate-700 shadow-sm"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-slate-500">
                            <Camera className="w-4 h-4" />
                          </div>
                        )}
                      </td>

                      {/* Roadway & Docket */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="font-bold text-white tracking-tight truncate">
                          {report.roadName || report.address || report.title}
                        </div>
                        <div className="font-mono text-[11px] text-emerald-400 mt-0.5 truncate">
                          {report.trackingCode || report.id}
                        </div>
                        {report.address && report.roadName && (
                          <div className="text-[11px] text-slate-400 truncate mt-0.5">
                            {report.address}
                          </div>
                        )}
                      </td>

                      {/* Severity */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            report.severity === 'critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : report.severity === 'severe'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : report.severity === 'moderate'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {report.severity}
                        </span>
                      </td>

                      {/* Peak G */}
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-300">
                        {peakG}
                      </td>

                      {/* Confirmations */}
                      <td className="py-3.5 px-3 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-800/50 text-[11px]">
                          <ThumbsUp className="w-3 h-3" />
                          <span>{report.verificationsCount || 1}</span>
                        </span>
                      </td>

                      {/* Suggested Agency */}
                      <td className="py-3.5 px-4 text-slate-300 text-xs">
                        <span className="line-clamp-1">{suggestedAgency}</span>
                      </td>

                      {/* Age */}
                      <td className="py-3.5 px-3 text-slate-400 text-[11px] whitespace-nowrap">
                        {age}
                      </td>

                      {/* Priority Score & Suggested Badge */}
                      <td className="py-3.5 px-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-mono font-extrabold text-sm text-white">
                            {report.priorityScore}
                          </span>
                          <PriorityBadge priority={report.priority} size="sm" />
                        </div>
                      </td>

                      {/* Actions: Verify, Reject, Merge */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Verify Button */}
                          <button
                            onClick={() => handleOpenVerify(report)}
                            data-testid={`verify-btn-${report.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Verify and accept into triage"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Verify</span>
                          </button>

                          {/* Reject Button */}
                          <button
                            onClick={() => handleOpenReject(report)}
                            data-testid={`reject-btn-${report.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-900/80 text-rose-300 border border-slate-700 hover:border-rose-700 text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Reject report with reason"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>

                          {/* Merge Button */}
                          <button
                            onClick={() => handleOpenMerge(report)}
                            data-testid={`merge-btn-${report.id}`}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-purple-900/80 text-purple-300 border border-slate-700 hover:border-purple-700 text-xs font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                            title="Merge into nearby duplicate master"
                          >
                            <GitMerge className="w-3.5 h-3.5" />
                            <span>Merge</span>
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- VERIFY MODAL --- */}
      {activeVerifyReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-emerald-400">
                <CheckCircle2 className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Verify Road Hazard</h3>
              </div>
              <button
                onClick={() => setActiveVerifyReport(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">Report Target</span>
              <div className="font-bold text-white text-sm">
                {activeVerifyReport.roadName || activeVerifyReport.address}
              </div>
              <div className="font-mono text-xs text-emerald-400">
                {activeVerifyReport.trackingCode || activeVerifyReport.id}
              </div>
            </div>

            {/* Priority Selection (prefilled from suggestion) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Assigned Priority Level
              </label>
              <select
                value={verifyPriority}
                onChange={(e) => setVerifyPriority(e.target.value as ReportPriority)}
                data-testid="verify-priority-select"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="low">LOW — Minor superficial wear</option>
                <option value="medium">MEDIUM — Moderate pavement cavity</option>
                <option value="high">HIGH — Severe rim-strike hazard</option>
                <option value="critical">CRITICAL — Immediate axle failure / blowout hazard</option>
              </select>
              <span className="text-[11px] text-slate-400 block">
                Suggested based on severity score of {activeVerifyReport.priorityScore}:{' '}
                <span className="font-semibold text-emerald-400 uppercase">
                  {suggestPriority(activeVerifyReport.priorityScore ?? 50)}
                </span>
              </span>
            </div>

            {/* Optional Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Verification Note (Optional)
              </label>
              <textarea
                value={verifyNote}
                onChange={(e) => setVerifyNote(e.target.value)}
                placeholder="e.g. Verified by county engineer; defect depth measures approx 3.5 inches."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveVerifyReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmVerify}
                disabled={isProcessing}
                data-testid="confirm-verify-btn"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Confirm Verification
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- REJECT MODAL --- */}
      {activeRejectReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-rose-400">
                <XCircle className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Reject Road Hazard</h3>
              </div>
              <button
                onClick={() => setActiveRejectReport(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs text-slate-400 block">Report Target</span>
              <div className="font-bold text-white text-sm">
                {activeRejectReport.roadName || activeRejectReport.address}
              </div>
              <div className="font-mono text-xs text-emerald-400">
                {activeRejectReport.trackingCode || activeRejectReport.id}
              </div>
            </div>

            {/* Required Rejection Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Rejection Reason <span className="text-rose-400">*</span>
              </label>
              <select
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value as RejectedReason)}
                data-testid="reject-reason-select"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white outline-none focus:border-rose-500 cursor-pointer"
              >
                {REJECT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label} — {opt.desc}
                  </option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Explanatory Note for Citizen
              </label>
              <textarea
                value={rejectNote}
                onChange={(e) => setRejectNote(e.target.value)}
                placeholder="Explain why this complaint was rejected (e.g. Surface depression under 1 inch threshold)."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-xs text-white placeholder-slate-500 outline-none focus:border-rose-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveRejectReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isProcessing}
                data-testid="confirm-reject-btn"
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MERGE MODAL --- */}
      {activeMergeReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2 text-purple-400">
                <GitMerge className="w-5 h-5" />
                <h3 className="font-extrabold text-white text-base">Merge Duplicate Hazard</h3>
              </div>
              <button
                onClick={() => setActiveMergeReport(null)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-purple-950/30 border border-purple-800/60 rounded-2xl text-xs space-y-1">
              <span className="font-semibold text-purple-300">Duplicate Report to Retire:</span>
              <div className="font-bold text-white">
                {activeMergeReport.roadName || activeMergeReport.address} (
                <span className="font-mono text-emerald-400">{activeMergeReport.trackingCode || activeMergeReport.id}</span>
                )
              </div>
              <p className="text-[11px] text-slate-400">
                This report will be rejected as <span className="font-mono text-purple-300">duplicate</span>, and its {activeMergeReport.verificationsCount || 1} confirmation(s) will be transferred to the master ticket.
              </p>
            </div>

            {/* Candidate Master Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                Pick Nearby Open Master Report <span className="text-purple-400">*</span>
              </label>

              {mergeCandidates.length === 0 ? (
                <div className="p-4 bg-slate-800/60 border border-slate-700 rounded-2xl text-center text-xs text-slate-400">
                  No other open reports available to merge into.
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-800/40">
                  {mergeCandidates.map(({ report: candidate, distMiles }) => {
                    const isSelected = selectedMergeTargetId === candidate.id;
                    const distStr =
                      distMiles < 0.1
                        ? `${Math.round(distMiles * 5280)} ft away`
                        : `${distMiles.toFixed(2)} mi away`;

                    return (
                      <div
                        key={candidate.id}
                        onClick={() => setSelectedMergeTargetId(candidate.id)}
                        className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between text-xs ${
                          isSelected
                            ? 'bg-purple-950/50 border-purple-500 ring-1 ring-purple-500'
                            : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-white truncate">
                            {candidate.roadName || candidate.address}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span className="font-mono text-emerald-400">
                              {candidate.trackingCode || candidate.id}
                            </span>
                            <span>•</span>
                            <span className="capitalize">{candidate.status}</span>
                            <span>•</span>
                            <span className="text-purple-300">{distStr}</span>
                          </div>
                        </div>

                        <div className="shrink-0 flex items-center gap-1.5">
                          <span className="text-[11px] font-mono font-bold text-slate-300">
                            +{candidate.verificationsCount || 1}
                          </span>
                          <input
                            type="radio"
                            name="mergeTarget"
                            checked={isSelected}
                            onChange={() => setSelectedMergeTargetId(candidate.id)}
                            className="text-purple-600 focus:ring-purple-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Optional Merge Note */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Merge Audit Note (Optional)
              </label>
              <input
                type="text"
                value={mergeNote}
                onChange={(e) => setMergeNote(e.target.value)}
                placeholder="e.g. Same roadway defect confirmed at Collins Hill intersection"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setActiveMergeReport(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmMerge}
                disabled={isProcessing || !selectedMergeTargetId}
                data-testid="confirm-merge-btn"
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition shadow active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                Confirm & Merge
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
