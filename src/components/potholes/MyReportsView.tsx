import React, { useState, useMemo } from 'react';
import { PotholeReport } from '../../types/pothole';
import { useAccessibility } from '../../context/AccessibilityContext';
import { EditReportModal } from './EditReportModal';
import { ReportCard } from '../kit/ReportCard';
import { ReportStatus, REPORT_STATUS_LABELS } from '../../domain/status';
import { isOverdue } from '../../domain/sla';
import { 
  CheckCircle2, 
  AlertTriangle, 
  PlusCircle, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  X,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface MyReportsViewProps {
  potholes: PotholeReport[];
  onSelectPothole: (p: PotholeReport) => void;
  onOpenReportModal: () => void;
  onNavigateToMap: () => void;
  onUpdateReport?: (updated: PotholeReport) => void;
  onDeleteReport?: (id: string) => void;
}

export const MyReportsView: React.FC<MyReportsViewProps> = ({
  potholes,
  onSelectPothole,
  onOpenReportModal,
  onNavigateToMap,
  onUpdateReport,
  onDeleteReport
}) => {
  const { fontSize } = useAccessibility();
  const [editingReport, setEditingReport] = useState<PotholeReport | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showLifecycleHelp, setShowLifecycleHelp] = useState(false);

  const [statusFilter, setStatusFilter] = useState<'all' | ReportStatus>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'most_confirmed' | 'overdue'>('newest');

  // Include user reports, 3x sensor reports, and hazards the user confirmed
  const myReports = useMemo(() => {
    return potholes.filter(
      p => p.source === 'user' || p.source === 'sensor' || p.userConfirmed
    );
  }, [potholes]);

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: myReports.length };
    const statuses: ReportStatus[] = [
      'reported',
      'verified',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'rejected'
    ];
    for (const s of statuses) {
      counts[s] = myReports.filter(p => p.status === s).length;
    }
    return counts;
  }, [myReports]);

  const filteredAndSortedReports = useMemo(() => {
    let list = myReports;
    if (statusFilter !== 'all') {
      list = list.filter(p => p.status === statusFilter);
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'most_confirmed') {
        return (b.verificationsCount || 0) - (a.verificationsCount || 0);
      }
      if (sortBy === 'overdue') {
        const aOverdue = isOverdue(a) ? 1 : 0;
        const bOverdue = isOverdue(b) ? 1 : 0;
        if (aOverdue !== bOverdue) return bOverdue - aOverdue;
        return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
      }
      // 'newest' default
      return new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime();
    });
  }, [myReports, statusFilter, sortBy]);

  // Dynamic initial count: 4 for small, 3 for normal/large, 2 for huge font
  const initialDisplayCount = useMemo(() => {
    if (fontSize === 'huge') return 2;
    if (fontSize === 'large') return 3;
    if (fontSize === 'small') return 4;
    return 3;
  }, [fontSize]);

  const displayedReports = showAll ? filteredAndSortedReports : filteredAndSortedReports.slice(0, initialDisplayCount);

  const handleSaveEditedReport = (updated: PotholeReport) => {
    if (onUpdateReport) {
      onUpdateReport(updated);
    }
    setEditingReport(null);
  };

  const handleDeleteReport = (id: string) => {
    if (onDeleteReport) {
      onDeleteReport(id);
    }
    setEditingReport(null);
  };

  const filterTabs: Array<{ id: 'all' | ReportStatus; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'reported', label: 'Reported' },
    { id: 'verified', label: 'Verified' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'resolved', label: 'Resolved' },
    { id: 'closed', label: 'Closed' },
    { id: 'rejected', label: 'Rejected' },
  ];

  return (
    <div className="h-full w-full max-w-4xl mx-auto px-4 sm:px-6 py-3 flex flex-col min-h-0 overflow-hidden">
      
      {/* Header Banner - Fixed at top */}
      <div className="shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>My Reports & Confirmations</span>
            </h2>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              {myReports.length} Active
            </span>
            <button
              type="button"
              onClick={() => setShowLifecycleHelp(!showLifecycleHelp)}
              className="w-5 h-5 rounded-full bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 flex items-center justify-center text-xs font-bold transition shadow-sm cursor-pointer"
              title="How report resolution works (7 stages explained)"
              aria-label="Lifecycle resolution process"
            >
              ?
            </button>
          </div>
          <p className="text-xs text-slate-300 mt-0.5">
            Centralized log of hazards you submitted, confirmed, or auto-logged via 3x sensor detections.
          </p>
        </div>

        <button
          onClick={onOpenReportModal}
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 shrink-0 cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Hazard</span>
        </button>
      </div>

      {/* Filter Chips & Sort Controls */}
      <div className="shrink-0 mt-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <span className="text-slate-400 text-xs font-semibold flex items-center gap-1 mr-1 shrink-0">
            <Filter className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Status:</span>
          </span>
          {filterTabs.map((tab) => {
            const count = statusCounts[tab.id] || 0;
            const isSelected = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                data-testid={`filter-chip-${tab.id}`}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-2.5 py-1 rounded-xl text-xs font-medium whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-emerald-800 text-white' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-900 text-slate-200 border border-slate-800 rounded-xl px-2.5 py-1 text-xs font-semibold outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="most_confirmed">Most Confirmed</option>
            <option value="overdue">Overdue First</option>
          </select>
        </div>
      </div>

      {/* Lifecycle Explanation Card (Triggered by [?] button) - 7 Stages Explained */}
      {showLifecycleHelp && (
        <div className="shrink-0 mt-2 bg-slate-900 border border-emerald-700/60 rounded-2xl p-3 shadow-xl text-xs text-slate-200 space-y-2 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                ?
              </span>
              <span className="font-bold text-white text-xs">How Hazard Resolution Works (7 Lifecycle Stages)</span>
            </div>
            <button
              onClick={() => setShowLifecycleHelp(false)}
              className="p-1 text-slate-400 hover:text-white transition cursor-pointer"
              aria-label="Close help"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-amber-900/40">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">1. Reported</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Submitted via camera, map tap, or 3x vehicle sensor hits. Awaiting review.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-blue-900/40">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">2. Verified</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Inspected by road authority; cavity depth and safety priority confirmed.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-purple-900/40">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">3. Assigned</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Work order routed to agency crew for scheduled repair.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-cyan-900/40">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">4. In Progress</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Road crew on site milling and filling asphalt cavity.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-emerald-900/40">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">5. Resolved</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Pavement leveled and restored. Awaiting citizen rating.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">6. Closed</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Citizen confirmed fix quality or work order archived.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-rose-900/40">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">7. Rejected</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Duplicate, outside county jurisdiction, or not a road hazard.</p>
            </div>
          </div>
        </div>
      )}

      {/* Reports List or Empty State */}
      {myReports.length === 0 ? (
        <div className="shrink-0 mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-sm font-bold text-white">No hazards reported from this device yet</h3>
            <p className="text-xs text-slate-300">
              When you submit a pothole report using the camera, map tap, or when the Drive Sensor registers 3 strikes on the same road spot, your reports appear here.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={onNavigateToMap}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
            >
              Explore Map
            </button>
          </div>
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col mt-2.5 overflow-hidden">
          {/* Scrollable Container: ONLY THIS SCROLLS */}
          <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1.5 scrollbar-thin overscroll-contain">
            {displayedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => onSelectPothole(report)}
                actions={
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Tap card for full details, timeline & comments
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingReport(report);
                      }}
                      className="px-3 py-1 rounded-xl bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-600 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit / Review</span>
                    </button>
                  </div>
                }
              />
            ))}
          </div>

          {/* Show All / Show Recent Toggle Button - Fixed at bottom */}
          {myReports.length > initialDisplayCount && (
            <div className="shrink-0 pt-2 pb-0.5 text-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white font-bold rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-2 mx-auto active:scale-95 shadow"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Show Recent ({initialDisplayCount}) Only</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Show All ({myReports.length} Reports & Confirmations)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Edit / Review Modal */}
      <EditReportModal
        isOpen={!!editingReport}
        onClose={() => setEditingReport(null)}
        report={editingReport}
        onSaveReport={handleSaveEditedReport}
        onDeleteReport={handleDeleteReport}
      />

    </div>
  );
};
