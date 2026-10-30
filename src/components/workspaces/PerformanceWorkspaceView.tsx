import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from 'recharts';
import { PotholeReport } from '../../domain/types';
import { useReports } from '../../context/ReportsContext';
import {
  computeAgencyMetrics,
  getActivityLog,
  filterActivityLog,
  downloadActivityLogCsv,
  AgencyPerformanceMetrics,
  ActivityLogEntry,
} from '../../domain/timelineMetrics';
import { StatCard, SectionHeader, EmptyState } from '../kit';
import {
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Star,
  FileDown,
  Filter,
  Search,
  Building2,
  Calendar,
  Layers,
  History,
  TrendingUp,
} from 'lucide-react';

export interface PerformanceWorkspaceViewProps {
  potholes?: PotholeReport[];
  onSelectPothole?: (report: PotholeReport) => void;
}

type DateRangeOption = 7 | 30 | 90 | undefined;
type PerformanceTab = 'benchmarks' | 'activity-log';

export const PerformanceWorkspaceView: React.FC<PerformanceWorkspaceViewProps> = ({
  potholes,
  onSelectPothole,
}) => {
  const { potholes: contextPotholes } = useReports();
  const allReports = potholes && potholes.length > 0 ? potholes : contextPotholes;

  const [dateRange, setDateRange] = useState<DateRangeOption>(30); // Default to 30 days
  const [activeTab, setActiveTab] = useState<PerformanceTab>('benchmarks');

  // Activity Log Filters
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [agencyFilter, setAgencyFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Compute timeline metrics for the selected date range
  const agencyMetrics: AgencyPerformanceMetrics[] = useMemo(
    () => computeAgencyMetrics(allReports, dateRange),
    [allReports, dateRange]
  );

  // 2. Compute aggregate summary metrics strictly from the timeline data
  const summary = useMemo(() => {
    let totalVerified = 0;
    let totalVerifyTimeHours = 0;
    let totalResolved = 0;
    let totalFixTimeDays = 0;
    let totalOverdue = 0;
    let totalReopened = 0;
    let totalRated = 0;
    let totalRating = 0;

    for (const m of agencyMetrics) {
      totalVerified += m.verifiedCount;
      totalVerifyTimeHours += m.avgVerifyTimeHours * m.verifiedCount;
      totalResolved += m.resolvedCount;
      totalFixTimeDays += m.avgFixTimeDays * m.resolvedCount;
      totalOverdue += m.overdueCount;
      totalReopened += m.reopenedCount;
      totalRated += m.ratedCount;
      totalRating += m.avgRating * m.ratedCount;
    }

    const avgVerifyHours = totalVerified > 0 ? totalVerifyTimeHours / totalVerified : 0;
    const avgVerifyDays = avgVerifyHours / 24;
    const avgFixDays = totalResolved > 0 ? totalFixTimeDays / totalResolved : 0;
    const reopenRate =
      totalResolved > 0 ? Math.round((totalReopened / totalResolved) * 1000) / 10 : 0;
    const avgRating = totalRated > 0 ? Math.round((totalRating / totalRated) * 10) / 10 : 0;

    return {
      avgVerifyHours: Math.round(avgVerifyHours * 10) / 10,
      avgVerifyDays: Math.round(avgVerifyDays * 10) / 10,
      avgFixDays: Math.round(avgFixDays * 10) / 10,
      totalOverdue,
      reopenRate,
      avgRating,
      totalResolved,
    };
  }, [agencyMetrics]);

  // 3. Extract and filter activity log entries
  const allActivityLog = useMemo(() => getActivityLog(allReports), [allReports]);

  const filteredActivityLog = useMemo(() => {
    return filterActivityLog(allActivityLog, {
      role: roleFilter,
      action: actionFilter,
      agency: agencyFilter,
      search: searchQuery,
    });
  }, [allActivityLog, roleFilter, actionFilter, agencyFilter, searchQuery]);

  // Handle CSV export of activity log
  const handleExportCsv = () => {
    const filename = `civic_activity_log_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadActivityLogCsv(filteredActivityLog, filename);
  };

  // Recharts Chart Data: Fix Turnaround by Agency
  const fixTimeChartData = useMemo(() => {
    return agencyMetrics
      .filter((m) => m.resolvedCount > 0)
      .map((m) => ({
        name: m.agencyName,
        days: m.avgFixTimeDays,
        resolved: m.resolvedCount,
        onTime: m.onTimePercentage,
      }))
      .sort((a, b) => a.days - b.days);
  }, [agencyMetrics]);

  // Recharts Chart Data: Verification Speed by Agency
  const verifyTimeChartData = useMemo(() => {
    return agencyMetrics
      .filter((m) => m.verifiedCount > 0)
      .map((m) => ({
        name: m.agencyName,
        hours: m.avgVerifyTimeHours,
        verified: m.verifiedCount,
      }))
      .sort((a, b) => a.hours - b.hours);
  }, [agencyMetrics]);

  // Unique action options for filter dropdown
  const uniqueActions = useMemo(() => {
    const set = new Set<string>();
    for (const item of allActivityLog) {
      if (item.action) set.add(item.action);
    }
    return Array.from(set).sort();
  }, [allActivityLog]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* 1. Top Section Header */}
      <SectionHeader
        title="Agency Performance & SLA Dashboard"
        subtitle="Track municipal response times, SLA adherence, and crew resolution benchmarks computed strictly from event timelines."
        badge="Performance & SLA"
        badgeColor="bg-cyan-950 text-cyan-300 border-cyan-800"
      />

      {/* 2. Date Range Filter & Tab Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* View Switcher: Benchmarks vs Activity Log */}
        <div className="flex items-center bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setActiveTab('benchmarks')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'benchmarks'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Agency Benchmarks & Charts</span>
          </button>
          <button
            onClick={() => setActiveTab('activity-log')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'activity-log'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit & Activity Log ({filteredActivityLog.length})</span>
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 self-start md:self-auto flex-wrap">
          <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            <span>Window:</span>
          </span>
          <button
            onClick={() => setDateRange(7)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateRange === 7
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            7 Days
          </button>
          <button
            onClick={() => setDateRange(30)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateRange === 30
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            30 Days
          </button>
          <button
            onClick={() => setDateRange(90)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateRange === 90
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            90 Days
          </button>
          <button
            onClick={() => setDateRange(undefined)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
              dateRange === undefined
                ? 'bg-cyan-600 text-white shadow'
                : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* 3. Top Aggregate Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <StatCard
          label="Avg Time to Verify"
          value={summary.avgVerifyHours > 24 ? `${summary.avgVerifyDays}d` : `${summary.avgVerifyHours}h`}
          subtext="From report to triage acceptance"
          variant="amber"
          icon={Clock}
        />
        <StatCard
          label="Avg Time to Fix"
          value={`${summary.avgFixDays}d`}
          subtext="From report to work resolution"
          variant="cyan"
          icon={Activity}
        />
        <StatCard
          label="Overdue Count"
          value={summary.totalOverdue}
          subtext="Open past SLA deadline"
          variant="rose"
          icon={AlertTriangle}
        />
        <StatCard
          label="Reopen Rate"
          value={`${summary.reopenRate}%`}
          subtext="Unsatisfied repairs reopened"
          variant="purple"
          icon={RotateCcw}
        />
        <StatCard
          label="Average Rating"
          value={summary.avgRating > 0 ? `${summary.avgRating} ★` : '—'}
          subtext="Citizen resolution rating"
          variant="emerald"
          icon={Star}
        />
      </div>

      {/* 4. Tab 1: Agency Benchmarks & Visual Recharts */}
      {activeTab === 'benchmarks' && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Average Fix Time by Agency */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    <span>Average Days to Fix by Agency</span>
                  </h3>
                  <p className="text-xs text-slate-400">Lower numbers indicate faster turnaround</p>
                </div>
                <span className="text-[10px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800">
                  Days to Resolution
                </span>
              </div>

              <div className="h-64 w-full">
                {fixTimeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={fixTimeChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        unit="d"
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#cbd5e1"
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-bold text-white">{data.name}</p>
                                <p className="text-cyan-400 font-bold">
                                  Average Fix: {data.days} days
                                </p>
                                <p className="text-slate-300">Resolved: {data.resolved} tickets</p>
                                <p className="text-blue-300">On-Time SLA: {data.onTime}%</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="days" radius={[0, 6, 6, 0]}>
                        {fixTimeChartData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={
                              entry.days <= 3
                                ? '#10b981'
                                : entry.days <= 7
                                ? '#06b6d4'
                                : entry.days <= 14
                                ? '#f59e0b'
                                : '#ef4444'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                    No resolution data within selected window.
                  </div>
                )}
              </div>
            </div>

            {/* Chart 2: Average Verification Speed by Agency */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Average Verification Time (Hours)</span>
                  </h3>
                  <p className="text-xs text-slate-400">Intake triage latency from report creation</p>
                </div>
                <span className="text-[10px] font-mono text-emerald-300 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                  Hours to Verify
                </span>
              </div>

              <div className="h-64 w-full">
                {verifyTimeChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={verifyTimeChartData}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <XAxis
                        type="number"
                        stroke="#64748b"
                        tick={{ fontSize: 11 }}
                        unit="h"
                      />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#cbd5e1"
                        tick={{ fontSize: 11 }}
                        width={120}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-slate-800 border border-slate-700 p-2.5 rounded-xl shadow-xl text-xs space-y-1">
                                <p className="font-bold text-white">{data.name}</p>
                                <p className="text-emerald-400 font-bold">
                                  Average Verification: {data.hours} hours
                                </p>
                                <p className="text-slate-300">Verified: {data.verified} tickets</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="hours" fill="#10b981" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-500 italic">
                    No verification data within selected window.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Detailed Agency Performance Matrix Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-cyan-400" />
                  <span>Agency Performance & SLA Compliance Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Full comparative scorecard computed directly from verified timeline logs.
                </p>
              </div>

              <span className="text-xs font-mono font-bold text-slate-400">
                {agencyMetrics.length} Maintenance Authorities
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-3">Agency Name</th>
                    <th className="py-3 px-3 text-center">Total</th>
                    <th className="py-3 px-3 text-center">Avg Verify</th>
                    <th className="py-3 px-3 text-center">Avg Fix</th>
                    <th className="py-3 px-3 text-center">On-Time %</th>
                    <th className="py-3 px-3 text-center">Overdue</th>
                    <th className="py-3 px-3 text-center">Reopen Rate</th>
                    <th className="py-3 px-3 text-center">Citizen Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {agencyMetrics.map((agency) => (
                    <tr
                      key={agency.agencyId}
                      className="hover:bg-slate-850/60 transition group"
                    >
                      <td className="py-3.5 px-3">
                        <div className="font-bold text-white group-hover:text-cyan-300 transition">
                          {agency.agencyName}
                        </div>
                        <div className="text-[10px] font-mono text-slate-500">
                          {agency.agencyId}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-slate-300">
                        {agency.totalReports}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-300">
                        {agency.verifiedCount > 0
                          ? agency.avgVerifyTimeHours > 24
                            ? `${agency.avgVerifyTimeDays}d`
                            : `${agency.avgVerifyTimeHours}h`
                          : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono font-bold text-cyan-300">
                        {agency.resolvedCount > 0 ? `${agency.avgFixTimeDays}d` : '—'}
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                            agency.onTimePercentage >= 90
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : agency.onTimePercentage >= 75
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {agency.onTimePercentage}%
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        {agency.overdueCount > 0 ? (
                          <span className="font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 text-[11px]">
                            {agency.overdueCount}
                          </span>
                        ) : (
                          <span className="text-slate-500 font-mono">0</span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-purple-300 font-bold">
                        {agency.reopenRate}%
                      </td>

                      <td className="py-3.5 px-3 text-center font-mono text-amber-300 font-bold">
                        {agency.avgRating > 0 ? (
                          <span className="inline-flex items-center gap-1">
                            <span>{agency.avgRating}</span>
                            <Star className="w-3 h-3 fill-current text-amber-400" />
                          </span>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. Tab 2: Admin Activity Log & Audit Feed */}
      {activeTab === 'activity-log' && (
        <div className="space-y-4">
          {/* Controls Bar: Filters + CSV Export */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <History className="w-5 h-5 text-cyan-400" />
                  <span>Comprehensive Civic Activity Log</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Complete event audit trail across all road hazard lifecycles.
                </p>
              </div>

              {/* CSV Export Button */}
              <button
                onClick={handleExportCsv}
                className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95 shrink-0"
              >
                <FileDown className="w-4 h-4" />
                <span>Export Activity Log (CSV)</span>
              </button>
            </div>

            {/* Filter Controls Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-800">
              {/* Role Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Filter by Role:
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2 outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Roles</option>
                  <option value="user">Citizen / User</option>
                  <option value="admin">Administrator</option>
                  <option value="officer">Crew Officer</option>
                  <option value="system">Automated System</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              {/* Action Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Filter by Action:
                </label>
                <select
                  value={actionFilter}
                  onChange={(e) => setActionFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2 outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Actions</option>
                  {uniqueActions.map((act) => (
                    <option key={act} value={act}>
                      {act.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Agency Filter */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Filter by Agency:
                </label>
                <select
                  value={agencyFilter}
                  onChange={(e) => setAgencyFilter(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl p-2 outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="all">All Agencies</option>
                  {agencyMetrics.map((ag) => (
                    <option key={ag.agencyId} value={ag.agencyId}>
                      {ag.agencyName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Free Text Search */}
              <div>
                <label className="text-[11px] font-semibold text-slate-400 block mb-1">
                  Search Log:
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tracking code, road, message..."
                    className="w-full bg-slate-950 border border-slate-700 text-white text-xs rounded-xl pl-8 pr-3 py-2 outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Activity Log Feed */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono font-bold text-slate-400">
                Displaying {filteredActivityLog.length} Timeline Events (Newest First)
              </span>
              {(roleFilter !== 'all' || actionFilter !== 'all' || agencyFilter !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setRoleFilter('all');
                    setActionFilter('all');
                    setAgencyFilter('all');
                    setSearchQuery('');
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-bold transition cursor-pointer"
                >
                  Reset Filters
                </button>
              )}
            </div>

            {filteredActivityLog.length > 0 ? (
              <div className="divide-y divide-slate-800/80">
                {filteredActivityLog.map((entry) => {
                  const roleBadgeClass =
                    entry.actorRole === 'admin'
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : entry.actorRole === 'officer'
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : entry.actorRole === 'system'
                      ? 'bg-amber-950 text-amber-300 border-amber-800'
                      : 'bg-emerald-950 text-emerald-300 border-emerald-800';

                  const actionBadgeClass =
                    entry.action.includes('RESOLV')
                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      : entry.action.includes('START')
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-800'
                      : entry.action.includes('ASSIGN')
                      ? 'bg-purple-950 text-purple-300 border-purple-800'
                      : entry.action.includes('VERIF')
                      ? 'bg-blue-950 text-blue-300 border-blue-800'
                      : entry.action.includes('REOPEN')
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : entry.action.includes('REJECT')
                      ? 'bg-rose-950 text-rose-300 border-rose-800'
                      : 'bg-slate-800 text-slate-300 border-slate-700';

                  return (
                    <div
                      key={entry.id}
                      className="py-3 px-2 hover:bg-slate-850/60 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border uppercase tracking-wider ${actionBadgeClass}`}
                          >
                            {entry.action.replace(/_/g, ' ')}
                          </span>

                          <span className="text-xs font-bold text-white">
                            {entry.trackingCode}
                          </span>

                          <span className="text-xs text-slate-400">
                            &bull; {entry.roadName}
                          </span>

                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            {entry.agencyName}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 leading-relaxed">
                          {entry.message}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end md:self-auto text-right">
                        <div>
                          <div className="flex items-center gap-1.5 justify-end">
                            <span className="text-xs font-semibold text-slate-200">
                              {entry.actorName}
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase border ${roleBadgeClass}`}
                            >
                              {entry.actorRole}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {new Date(entry.timestamp).toLocaleString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12">
                <EmptyState
                  icon={History}
                  title="No Matching Activity Log Entries"
                  description="No timeline events matched your selected role, action, and agency filters."
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
