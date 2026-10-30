import React, { useState } from 'react';
import { PotholeReport } from '../../domain/types';
import { ReportStatus, REPORT_STATUS_LABELS, isOpenStatus } from '../../domain/status';
import { isOverdue } from '../../domain/sla';
import { exportPotholesToCsv } from '../../services/storageService';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { useReports } from '../../context/ReportsContext';
import { ActiveTab } from '../Header';
import {
  StatCard,
  StatusBadge,
  PriorityBadge,
  SectionHeader,
  EmptyState
} from '../kit';
import {
  FileText,
  Clock,
  HardHat,
  AlertTriangle,
  CheckCircle2,
  Star,
  ListFilter,
  Building2,
  ArrowRight,
  Download,
  RotateCcw,
  Sparkles,
  FileDown,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { AGENCY_LABELS } from '../../data/officersData';

export interface AdminOverviewViewProps {
  potholes: PotholeReport[];
  onNavigateTab?: (tab: ActiveTab) => void;
  onSelectPotholeForMap?: (p: PotholeReport) => void;
}

export function matchAgencyId(report: PotholeReport): string {
  if (report.assignedAgencyId) return report.assignedAgencyId;
  if (report.authorityId) {
    if (report.authorityId === 'GGC' || report.authorityId.includes('GGC')) return 'GGC';
    if (report.authorityId === 'GDOT') return 'GDOT';
    if (report.authorityId === 'GWINNETT_COUNTY' || report.authorityId === 'gwinnett-dot') return 'GWINNETT_COUNTY';
    for (const [key] of Object.entries(AGENCY_LABELS)) {
      if (report.authorityId.toUpperCase().includes(key)) return key;
    }
  }
  const j = (report.jurisdiction || report.authorityName || '').toLowerCase();
  if (j.includes('ggc') || j.includes('college')) return 'GGC';
  if (j.includes('gdot') || j.includes('state route')) return 'GDOT';
  if (j.includes('lawrenceville')) return 'LAWRENCEVILLE';
  if (j.includes('duluth')) return 'DULUTH';
  if (j.includes('suwanee')) return 'SUWANEE';
  if (j.includes('peachtree')) return 'PEACHTREE_CORNERS';
  if (j.includes('norcross')) return 'NORCROSS';
  if (j.includes('snellville')) return 'SNELLVILLE';
  if (j.includes('buford')) return 'BUFORD';
  if (j.includes('lilburn')) return 'LILBURN';
  if (j.includes('sugar hill')) return 'SUGAR_HILL';
  if (j.includes('dacula')) return 'DACULA';
  return 'GWINNETT_COUNTY';
}

export const AdminOverviewView: React.FC<AdminOverviewViewProps> = ({
  potholes,
  onNavigateTab,
  onSelectPotholeForMap,
}) => {
  const { resetDemoData, loadSampleWorkflow } = useReports();
  const [isActionPending, setIsActionPending] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const handleResetDemoData = async () => {
    try {
      setIsActionPending(true);
      await resetDemoData();
      setFeedbackMessage('Demo data reset to initial baseline.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error resetting demo: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsActionPending(false);
    }
  };

  const handleLoadSampleWorkflow = async () => {
    try {
      setIsActionPending(true);
      await loadSampleWorkflow();
      setFeedbackMessage('Sample workflow loaded: 10 reports across all 7 statuses with realistic timelines.');
      setTimeout(() => setFeedbackMessage(null), 4000);
    } catch (err: any) {
      setFeedbackMessage(`Error loading sample workflow: ${err?.message || 'Unknown error'}`);
      setTimeout(() => setFeedbackMessage(null), 4000);
    } finally {
      setIsActionPending(false);
    }
  };

  // --- STAT METRICS MATH ---
  const totalCount = potholes.length;
  const needsTriageCount = potholes.filter((p) => p.status === 'reported').length;
  const inProgressCount = potholes.filter((p) => p.status === 'in_progress').length;
  const overdueCount = potholes.filter((p) => isOverdue(p)).length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const fixedThisMonthCount = potholes.filter((p) => {
    if (p.status !== 'resolved' && p.status !== 'closed') return false;
    const dateStr = p.resolvedAt || p.lastVerifiedAt || p.reportedAt;
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return !Number.isNaN(d.getTime()) && d.getFullYear() === currentYear && d.getMonth() === currentMonth;
  }).length;

  const ratedReports = potholes.filter((p) => p.feedback?.rating && p.feedback.rating > 0);
  const avgRatingVal =
    ratedReports.length > 0
      ? (
          ratedReports.reduce((acc, curr) => acc + (curr.feedback?.rating || 0), 0) /
          ratedReports.length
        ).toFixed(1)
      : null;

  // --- STATUS BREAKDOWN ---
  const allStatuses: ReportStatus[] = [
    'reported',
    'verified',
    'assigned',
    'in_progress',
    'resolved',
    'closed',
    'rejected',
  ];

  const statusCounts = allStatuses.map((s) => {
    const count = potholes.filter((p) => p.status === s).length;
    const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
    return {
      status: s,
      label: REPORT_STATUS_LABELS[s],
      count,
      pct,
    };
  });

  const STATUS_BAR_COLORS: Record<ReportStatus, string> = {
    reported: 'bg-amber-500',
    verified: 'bg-blue-500',
    assigned: 'bg-purple-500',
    in_progress: 'bg-cyan-500',
    resolved: 'bg-emerald-500',
    closed: 'bg-slate-400',
    rejected: 'bg-rose-500',
  };

  // --- AGENCY BREAKDOWN ---
  // List of major jurisdictions
  const knownAgencies = [
    { id: 'GGC', name: 'Georgia Gwinnett College (Campus Facilities)' },
    { id: 'GWINNETT_COUNTY', name: 'Gwinnett County DOT' },
    { id: 'GDOT', name: 'GDOT District 1 (State Routes)' },
    { id: 'LAWRENCEVILLE', name: 'City of Lawrenceville' },
    { id: 'DULUTH', name: 'City of Duluth' },
    { id: 'SUWANEE', name: 'City of Suwanee' },
    { id: 'PEACHTREE_CORNERS', name: 'City of Peachtree Corners' },
    { id: 'NORCROSS', name: 'City of Norcross' },
    { id: 'SNELLVILLE', name: 'City of Snellville' },
    { id: 'BUFORD', name: 'City of Buford' },
    { id: 'LILBURN', name: 'City of Lilburn' },
    { id: 'SUGAR_HILL', name: 'City of Sugar Hill' },
  ];

  const agencyRows = knownAgencies
    .map((agency) => {
      const agencyReports = potholes.filter((p) => matchAgencyId(p) === agency.id);
      const openReports = agencyReports.filter((p) => isOpenStatus(p.status));
      const overdueReports = agencyReports.filter((p) => isOverdue(p));
      return {
        ...agency,
        total: agencyReports.length,
        openCount: openReports.length,
        overdueCount: overdueReports.length,
      };
    })
    .filter((a) => a.total > 0 || a.id === 'GGC' || a.id === 'GWINNETT_COUNTY' || a.id === 'GDOT');

  // --- 5 MOST RECENT ---
  const recentReports = [...potholes]
    .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
    .slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Page Title & Operational Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Admin Operations Dashboard
            </h2>
            <span className="bg-blue-950 text-blue-300 text-xs px-2.5 py-0.5 rounded-full border border-blue-800 font-semibold">
              Staff Portal
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gwinnett County multi-agency defect triage, work order assignment, and municipal SLA monitoring.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleResetDemoData}
            disabled={isActionPending}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50 cursor-pointer"
            title="Reset reports to initial baseline data and clear comments/notifications"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={handleLoadSampleWorkflow}
            disabled={isActionPending}
            className="px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700 text-xs font-semibold flex items-center gap-1.5 transition shadow disabled:opacity-50 cursor-pointer"
            title="Seed 10 reports spanning all 7 workflow statuses with realistic timelines"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Load Sample Workflow</span>
          </button>

          <button
            onClick={() => exportPotholesToCsv(potholes)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition shadow cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-teal-400" />
            <span>Export CSV Work Orders</span>
          </button>
        </div>
      </div>

      {feedbackMessage && (
        <div className="bg-emerald-950/80 border border-emerald-600/50 text-emerald-200 text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-2 shadow-md">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* 1. Stat Cards (Total, Needs Triage, In Progress, Overdue, Fixed This Month, Average Rating) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total"
          value={totalCount}
          subtext="Total reported"
          variant="default"
          icon={FileText}
        />
        <StatCard
          label="Needs Triage"
          value={needsTriageCount}
          subtext="Pending verification"
          variant="amber"
          icon={Clock}
          onClick={onNavigateTab ? () => onNavigateTab('triage') : undefined}
        />
        <StatCard
          label="In Progress"
          value={inProgressCount}
          subtext="Active crew work"
          variant="blue"
          icon={HardHat}
        />
        <StatCard
          label="Overdue"
          value={overdueCount}
          subtext="SLA breached"
          variant="rose"
          icon={AlertTriangle}
        />
        <StatCard
          label="Fixed This Month"
          value={fixedThisMonthCount}
          subtext="Resolved / closed"
          variant="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          label="Average Rating"
          value={avgRatingVal ? `${avgRatingVal} / 5` : 'N/A'}
          subtext={
            avgRatingVal
              ? `${ratedReports.length} citizen rating${ratedReports.length === 1 ? '' : 's'}`
              : 'No ratings yet'
          }
          variant="cyan"
          icon={Star}
        />
      </div>

      {/* 2. Quick Links to Triage and the Dispatch Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Triage Quick Link Card */}
        <div className="bg-gradient-to-br from-slate-900 to-amber-950/20 border border-slate-800 hover:border-amber-700/60 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-950/80 border border-amber-700/60 flex items-center justify-center text-amber-400">
                  <ListFilter className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Triage Queue</h3>
                  <span className="text-xs text-amber-400 font-semibold">
                    {needsTriageCount} pending verification
                  </span>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
                Priority Review
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Inspect unverified citizen reports and sensor spikes sorted by severity score. Verify priority levels, reject invalid defects with required reason codes, or merge nearby duplicates.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab?.('triage')}
            data-testid="quick-link-triage"
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Open Triage Queue</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dispatch Board Quick Link Card */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950/20 border border-slate-800 hover:border-blue-700/60 rounded-3xl p-5 shadow-xl transition flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-700/60 flex items-center justify-center text-blue-400">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Dispatch Board</h3>
                  <span className="text-xs text-blue-400 font-semibold">
                    {potholes.filter((p) => p.status === 'verified' || p.status === 'assigned').length} work orders in pipeline
                  </span>
                </div>
              </div>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-semibold">
                Agency Routing
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              Assign triaged roadway defects to responsible municipal maintenance divisions (GGC Facilities, Gwinnett DOT, GDOT District 1) and designate specific crew officers with SLA tracking.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab?.('dispatch-board')}
            data-testid="quick-link-dispatch"
            className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
          >
            <span>Open Dispatch Board</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3. Status Breakdown with Proportional Bars */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <SectionHeader
          title="Status Breakdown"
          subtitle="Proportional lifecycle distribution of all reported hazards across municipal pipelines"
        />

        {/* Aggregated Proportional Bar */}
        {totalCount > 0 ? (
          <div className="space-y-4">
            <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden flex shadow-inner">
              {statusCounts.map((s) =>
                s.count > 0 ? (
                  <div
                    key={s.status}
                    style={{ width: `${(s.count / totalCount) * 100}%` }}
                    className={`${STATUS_BAR_COLORS[s.status]} transition-all duration-300`}
                    title={`${s.label}: ${s.count} (${s.pct}%)`}
                  />
                ) : null
              )}
            </div>

            {/* Individual Status Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              {statusCounts.map((s) => (
                <div
                  key={s.status}
                  className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300">{s.label}</span>
                    <span className="font-mono font-bold text-white">
                      {s.count} <span className="text-slate-500 font-normal">({s.pct}%)</span>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${s.pct}%` }}
                      className={`h-full ${STATUS_BAR_COLORS[s.status]} rounded-full`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="No reports logged"
            description="The report repository has no recorded hazards yet."
          />
        )}
      </div>

      {/* 4. Open Reports and Overdue Counts Per Agency */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <SectionHeader
          title="Agency Workload & Overdue SLA Counts"
          subtitle="Real-time open defect queues and overdue compliance breaches segmented by municipal authority"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider text-slate-400">
                <th className="py-3 px-4">Agency / Municipal Authority</th>
                <th className="py-3 px-4 text-center">Open Reports</th>
                <th className="py-3 px-4 text-center">Overdue Deficits</th>
                <th className="py-3 px-4 text-center">Total Volume</th>
                <th className="py-3 px-4 text-right">SLA Health</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {agencyRows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No active agencies found with assigned hazards.
                  </td>
                </tr>
              ) : (
                agencyRows.map((agency) => {
                  const hasOverdue = agency.overdueCount > 0;
                  return (
                    <tr
                      key={agency.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4 font-semibold text-white">
                        <div className="flex items-center space-x-2">
                          <Building2 className="w-4 h-4 text-slate-400 shrink-0 group-hover:text-emerald-400 transition" />
                          <span>{agency.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {agency.openCount}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {hasOverdue ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold font-mono bg-rose-950 text-rose-300 border border-rose-800">
                            {agency.overdueCount} overdue
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/60">
                            0 overdue
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-400">
                        {agency.total}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {hasOverdue ? (
                          <span className="text-rose-400 font-semibold text-[11px]">
                            Attention Required
                          </span>
                        ) : agency.openCount > 0 ? (
                          <span className="text-emerald-400 font-semibold text-[11px]">
                            On Schedule
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Queue Clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. The 5 Most Recent Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <SectionHeader
          title="5 Most Recent Submissions"
          subtitle="Latest road defects entered into the municipal system"
          actions={
            onNavigateTab ? (
              <button
                onClick={() => onNavigateTab('triage')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition cursor-pointer"
              >
                <span>View Full Triage</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
        />

        {recentReports.length === 0 ? (
          <EmptyState
            title="No recent submissions"
            description="No road hazards have been submitted yet."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] uppercase font-bold tracking-wider text-slate-400">
                  <th className="py-3 px-4">Docket & Road</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Priority</th>
                  <th className="py-3 px-4">Agency</th>
                  <th className="py-3 px-4">Reported</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentReports.map((report) => {
                  const overdue = isOverdue(report);
                  const dateObj = new Date(report.reportedAt);
                  const formattedDate = !Number.isNaN(dateObj.getTime())
                    ? dateObj.toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : report.reportedAt;

                  return (
                    <tr
                      key={report.id}
                      className="hover:bg-slate-800/40 transition group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white">{report.roadName || report.address}</div>
                        <div className="font-mono text-[11px] text-emerald-400 flex items-center gap-1.5 mt-0.5">
                          <span>{report.trackingCode || report.id}</span>
                          {overdue && (
                            <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-950 text-rose-300 border border-rose-800 font-bold">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={report.status} size="sm" />
                      </td>
                      <td className="py-3 px-4">
                        <PriorityBadge priority={report.priority} size="sm" />
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {report.authorityName || report.jurisdiction || 'Gwinnett County'}
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {formattedDate}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Certified PDF Docket Work Order Button */}
                          <button
                            onClick={() => generatePotholePdf(report)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-purple-800 text-slate-300 hover:text-white transition shadow cursor-pointer"
                            title="Download Certified PDF Work Order"
                            aria-label={`Download PDF for ${report.trackingCode || report.id}`}
                          >
                            <FileDown className="w-4 h-4 text-purple-300" />
                          </button>

                          {/* Map Pin inspect button */}
                          {onSelectPotholeForMap && (
                            <button
                              onClick={() => onSelectPotholeForMap(report)}
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-teal-700 text-slate-300 hover:text-white transition shadow cursor-pointer"
                              title="Inspect on Map"
                              aria-label={`Inspect ${report.trackingCode || report.id} on map`}
                            >
                              <ExternalLink className="w-4 h-4 text-teal-300" />
                            </button>
                          )}
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

    </div>
  );
};
