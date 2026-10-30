import React, { useMemo } from 'react';
import { PotholeReport } from '../../domain/types';
import { useReports } from '../../context/ReportsContext';
import { computeCommunityScoreboardData } from '../../domain/timelineMetrics';
import { StatCard, StatusBadge, PriorityBadge, SectionHeader, EmptyState } from '../kit';
import { ActiveTab } from '../Header';
import {
  Trophy,
  Calendar,
  Clock,
  CheckCircle2,
  Star,
  Building2,
  ThumbsUp,
  MapPin,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  PlusCircle,
  ExternalLink,
} from 'lucide-react';

export interface CommunityScoreboardViewProps {
  potholes?: PotholeReport[];
  onSelectPothole?: (report: PotholeReport) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onOpenReportModal?: () => void;
}

export const CommunityScoreboardView: React.FC<CommunityScoreboardViewProps> = ({
  potholes,
  onSelectPothole,
  onNavigateTab,
  onOpenReportModal,
}) => {
  const { potholes: contextPotholes } = useReports();
  const allReports = potholes && potholes.length > 0 ? potholes : contextPotholes;

  // Compute all metrics strictly from the timelines!
  const scoreboard = useMemo(
    () => computeCommunityScoreboardData(allReports),
    [allReports]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8 animate-in fade-in duration-300">
      {/* 1. Hero Header */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/20 to-slate-900 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Public Civic Transparency &bull; NagarSetu Model</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Community Roadway Scoreboard
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Public accountability for roadway hazard repairs across Gwinnett County. Every metric is computed strictly from verified event timelines.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Hazard</span>
            </button>
          )}

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('potholes')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold rounded-2xl transition flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <MapPin className="w-4 h-4 text-emerald-400" />
              <span>View Map</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Top Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Fixed This Month"
          value={scoreboard.fixedThisMonth}
          subtext="Road repairs completed"
          variant="emerald"
          icon={Calendar}
        />
        <StatCard
          label="Average Days to Fix"
          value={`${scoreboard.overallAvgDaysToFix}d`}
          subtext="From report to resolution"
          variant="cyan"
          icon={Clock}
        />
        <StatCard
          label="On-Time Resolution"
          value={`${scoreboard.overallOnTimePercentage}%`}
          subtext="Adhering to municipal SLA"
          variant="blue"
          icon={CheckCircle2}
        />
        <StatCard
          label="Average Citizen Rating"
          value={scoreboard.overallAvgRating > 0 ? `${scoreboard.overallAvgRating} ★` : 'No ratings'}
          subtext="Commuter repair satisfaction"
          variant="amber"
          icon={Star}
        />
      </div>

      {/* 3. Agency Accountability Leaderboard */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-400" />
              <span>Municipal Agency Performance Leaderboard</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparative repair turnaround and on-time benchmarks per maintenance department.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-slate-400">
            {scoreboard.agencyStats.length} Reporting Agencies
          </span>
        </div>

        {scoreboard.agencyStats.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scoreboard.agencyStats.map((agency) => (
              <div
                key={agency.agencyId}
                className="bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-4.5 space-y-3 transition shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-white tracking-tight">
                      {agency.agencyName}
                    </h4>
                    <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">
                      Code: {agency.agencyId}
                    </span>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-purple-950 text-purple-300 border border-purple-800">
                    {agency.fixedCount} Fixed
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-850 text-center">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Avg Fix</span>
                    <span className="text-xs font-extrabold font-mono text-cyan-300 mt-0.5 block">
                      {agency.avgDaysToFix}d
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">On-Time</span>
                    <span className="text-xs font-extrabold font-mono text-blue-300 mt-0.5 block">
                      {agency.onTimePercentage}%
                    </span>
                  </div>

                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60">
                    <span className="text-[10px] text-slate-400 block font-medium">Rating</span>
                    <span className="text-xs font-extrabold font-mono text-amber-300 mt-0.5 block flex items-center justify-center gap-0.5">
                      {agency.avgRating > 0 ? (
                        <>
                          <span>{agency.avgRating}</span>
                          <Star className="w-2.5 h-2.5 fill-current text-amber-400" />
                        </>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                </div>

                {/* Progress bar for on-time % */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>SLA Compliance</span>
                    <span className="font-mono font-bold text-slate-300">
                      {agency.onTimePercentage}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        agency.onTimePercentage >= 90
                          ? 'bg-emerald-500'
                          : agency.onTimePercentage >= 70
                          ? 'bg-blue-500'
                          : 'bg-amber-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, agency.onTimePercentage))}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Building2}
            title="No Agency Data Available"
            description="Municipal agency metrics will populate as work orders are assigned and resolved."
          />
        )}
      </div>

      {/* 4. Most Confirmed Open Hazards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-emerald-400" />
              <span>Most Confirmed Open Hazards</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Road hazards backed by the highest number of community citizen verifications.
            </p>
          </div>

          <span className="text-xs font-mono font-bold text-emerald-400">
            Citizen Priority Queue
          </span>
        </div>

        {scoreboard.mostConfirmedOpenHazards.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scoreboard.mostConfirmedOpenHazards.map((hazard, index) => (
              <div
                key={hazard.id}
                onClick={onSelectPothole ? () => onSelectPothole(hazard) : undefined}
                className="bg-slate-950/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition shadow-sm group cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-300 font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-slate-700">
                      #{index + 1}
                    </span>
                    <StatusBadge status={hazard.status} size="sm" />
                    <PriorityBadge priority={hazard.priority || 'medium'} size="sm" />
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-mono font-extrabold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1 shrink-0">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span>+{hazard.verificationsCount || 0} Confirmations</span>
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-emerald-300 transition line-clamp-1">
                    {hazard.title}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{hazard.roadName || hazard.address}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-850 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="truncate">
                    {hazard.jurisdiction || hazard.authorityName || 'Gwinnett County'}
                  </span>
                  <span className="font-mono text-teal-400 font-bold shrink-0">
                    {hazard.trackingCode || `#${hazard.id.slice(-6)}`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={CheckCircle2}
            title="No Open Hazards"
            description="There are currently no open community hazards with verifications."
          />
        )}
      </div>
    </div>
  );
};
