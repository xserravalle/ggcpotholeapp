import React, { useState } from 'react';
import { PotholeReport } from '../../types/pothole';
import { EditReportModal } from './EditReportModal';
import { 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  PlusCircle, 
  Clock, 
  ThumbsUp, 
  ExternalLink,
  Shield,
  Layers,
  Edit3,
  Activity,
  Trash2,
  ChevronDown,
  ChevronUp
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
  const [editingReport, setEditingReport] = useState<PotholeReport | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Include user reports, 3x sensor reports, and hazards the user confirmed
  const myReports = potholes.filter(
    p => p.source === 'user' || p.source === 'sensor' || p.userConfirmed
  );

  const displayedReports = showAll ? myReports : myReports.slice(0, 5);

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

  const getStatusStep = (status: PotholeReport['status']) => {
    switch (status) {
      case 'reported': return 1;
      case 'investigating': return 2;
      case 'scheduled': return 3;
      case 'repaired': return 4;
      default: return 1;
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 space-y-3.5">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg sm:text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>My Reports & Confirmations</span>
            </h2>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
              {myReports.length} Active
            </span>
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

      {/* Reports List or Empty State */}
      {myReports.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-3">
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
        <div className="space-y-2">
          {/* Scrollable Container keeping content within the viewport */}
          <div className="max-h-[calc(100vh-215px)] overflow-y-auto space-y-2.5 pr-1.5 scrollbar-thin">
            {displayedReports.map((report) => {
              const step = getStatusStep(report.status);

              return (
                <div
                  key={report.id}
                  onClick={() => onSelectPothole(report)}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-700/60 rounded-2xl p-3 sm:p-3.5 shadow-md transition cursor-pointer space-y-2 group relative"
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left Column: Details */}
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(report.status)}`}>
                          {report.status}
                        </span>
                        <span className="text-xs font-mono text-slate-300">
                          {report.trackingCode || report.id}
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

                      <p className="text-xs text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{report.address || `${report.roadName}, ${report.city}`}</span>
                      </p>

                      {report.description && (
                        <p className="text-xs text-slate-300/90 line-clamp-1 pt-0.5">
                          {report.description}
                        </p>
                      )}
                    </div>

                    {/* Right Column: Jurisdiction & Action Button */}
                    <div className="flex flex-col items-end justify-between gap-2 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                          <span>👆</span>
                          <span>{report.verificationsCount} verified</span>
                        </span>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          {report.jurisdiction}
                        </span>
                      </div>

                      {/* Edit / Review Button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingReport(report);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-emerald-700 text-slate-200 hover:text-white border border-slate-700 hover:border-emerald-600 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Edit3 className="w-3 h-3 text-emerald-400 group-hover:text-white" />
                        <span>Edit / Review</span>
                      </button>
                    </div>
                  </div>

                  {/* Compact Progress Pipeline */}
                  <div className="pt-1.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 shrink-0">
                      <span className={step >= 1 ? 'text-emerald-400 font-bold' : ''}>1. Reported</span>
                      <span>→</span>
                      <span className={step >= 2 ? 'text-emerald-400 font-bold' : ''}>2. Investigating</span>
                      <span>→</span>
                      <span className={step >= 3 ? 'text-emerald-400 font-bold' : ''}>3. Scheduled</span>
                      <span>→</span>
                      <span className={step >= 4 ? 'text-emerald-400 font-bold' : ''}>4. Repaired</span>
                    </div>
                    <div className="flex-1 max-w-[120px] grid grid-cols-4 gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${step >= 1 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full ${step >= 2 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full ${step >= 3 ? 'bg-emerald-500' : 'bg-transparent'}`} />
                      <div className={`h-full rounded-full ${step >= 4 ? 'bg-emerald-400' : 'bg-transparent'}`} />
                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* Show All / Show Recent Toggle Button */}
          {myReports.length > 5 && (
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-white font-bold rounded-xl text-xs border border-slate-700 transition flex items-center justify-center gap-2 mx-auto active:scale-95 shadow"
              >
                {showAll ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5" />
                    <span>Show Recent 5 Only</span>
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
