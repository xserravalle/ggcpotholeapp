import React, { useState, useMemo } from 'react';
import { PotholeReport } from '../../types/pothole';
import { useAccessibility } from '../../context/AccessibilityContext';
import { EditReportModal } from './EditReportModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  PlusCircle, 
  Edit3, 
  Activity, 
  ChevronDown, 
  ChevronUp, 
  X 
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

  // Include user reports, 3x sensor reports, and hazards the user confirmed
  const myReports = potholes.filter(
    p => p.source === 'user' || p.source === 'sensor' || p.userConfirmed
  );

  // Dynamic initial count: 4 for small, 3 for normal/large, 2 for huge font
  const initialDisplayCount = useMemo(() => {
    if (fontSize === 'huge') return 2;
    if (fontSize === 'large') return 3;
    if (fontSize === 'small') return 4;
    return 3;
  }, [fontSize]);

  const displayedReports = showAll ? myReports : myReports.slice(0, initialDisplayCount);

  const getStatusColor = (status: PotholeReport['status']) => {
    switch (status) {
      case 'repaired':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800';
      case 'scheduled':
        return 'bg-blue-950 text-blue-300 border-blue-800';
      case 'investigating':
        return 'bg-amber-950 text-amber-300 border-amber-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

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
              className="w-5 h-5 rounded-full bg-slate-800 hover:bg-emerald-950 text-slate-300 hover:text-emerald-300 border border-slate-700 hover:border-emerald-700 flex items-center justify-center text-xs font-bold transition shadow-sm"
              title="How report resolution works (Stages explained)"
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
          className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2 active:scale-95 shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Report New Hazard</span>
        </button>
      </div>

      {/* Lifecycle Explanation Card (Triggered by [?] button) */}
      {showLifecycleHelp && (
        <div className="shrink-0 mt-2 bg-slate-900 border border-emerald-700/60 rounded-2xl p-3 shadow-xl text-xs text-slate-200 space-y-2 max-h-44 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <div className="flex items-center space-x-2">
              <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-[10px]">
                ?
              </span>
              <span className="font-bold text-white text-xs">How Hazard Resolution Works</span>
            </div>
            <button
              onClick={() => setShowLifecycleHelp(false)}
              className="p-1 text-slate-400 hover:text-white transition"
              aria-label="Close help"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">1. Reported</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Submitted via camera, map tap, or 3x sensor detections.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">2. Investigating</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Municipal road agency inspects cavity depth and road risks.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">3. Scheduled</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Assigned road crew work order queued for milling and patching.</p>
            </div>
            <div className="bg-slate-950/60 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">4. Repaired</span>
              <p className="text-[11px] text-slate-300 mt-0.5">Pavement leveled, inspected, and confirmed safe for drivers.</p>
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
              <div
                key={report.id}
                onClick={() => onSelectPothole(report)}
                className="bg-slate-900 border border-slate-800 hover:border-emerald-600/70 rounded-2xl p-3 sm:p-3.5 shadow-md transition cursor-pointer flex items-center justify-between gap-3 group relative"
              >
                {/* Details: Stage, Authority, Title, Location */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                      {report.status}
                    </span>
                    <span className="text-xs font-semibold text-emerald-400">
                      {report.jurisdiction || report.authorityName || 'Gwinnett County'}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      • {report.trackingCode || report.id}
                    </span>
                    {report.sensorDetected && (
                      <span className="text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-800/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>3x Sensor Verified ({report.bumpIntensity || 7.2}G)</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition truncate">
                    {report.title}
                  </h3>

                  <p className="text-xs text-slate-300 flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{report.address || `${report.roadName}, ${report.city}`}</span>
                  </p>
                </div>

                {/* Right Column: Upvotes & Edit / Review Button */}
                <div className="shrink-0 flex items-center gap-2.5">
                  {report.verificationsCount > 0 && (
                    <span className="hidden sm:inline-flex text-xs font-bold text-emerald-400 items-center gap-1">
                      <span>👆</span>
                      <span>{report.verificationsCount}</span>
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingReport(report);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-600 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
                    <span>Edit / Review</span>
                  </button>
                </div>
              </div>
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
