import React, { useState } from 'react';
import { DriveSession, DriveShockIncident } from '../../types/driveSession';
import { formatDuration } from '../../services/driveSessionService';
import { generateDrivePdf } from '../../services/drivePdfGenerator';
import { DriveRouteMap } from './DriveRouteMap';
import { 
  X, 
  FileDown, 
  Mail, 
  MapPin, 
  Activity, 
  Clock, 
  Route, 
  AlertTriangle, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  UploadCloud,
  RefreshCw
} from 'lucide-react';

interface DriveReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: DriveSession | null;
  onPromoteIncidentsToReports?: (incidents: DriveShockIncident[]) => void;
}

export const DriveReportModal: React.FC<DriveReportModalProps> = ({
  isOpen,
  onClose,
  session,
  onPromoteIncidentsToReports
}) => {
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [promotedSuccess, setPromotedSuccess] = useState(false);

  if (!isOpen || !session) return null;

  const targetEmail = 'peyton.holland@gmail.com';
  const trackingCode = session.trackingCode;

  // Build formatted email body
  const incidentRows = session.incidents.map((inc, i) => (
    `Incident #${i + 1} (${inc.severity.toUpperCase()} - ${inc.peakG.toFixed(2)}G):\n` +
    `  • Elapsed Time: +${formatDuration(inc.elapsedSeconds)} into drive\n` +
    `  • Closest Address: ${inc.address || inc.roadName}\n` +
    `  • GPS Coordinates: ${inc.latitude.toFixed(5)}, ${inc.longitude.toFixed(5)}\n` +
    `  • Google Maps: https://www.google.com/maps?q=${inc.latitude},${inc.longitude}\n`
  )).join('\n');

  const emailSubject = encodeURIComponent(
    `[GGC SansPotholes] Drive Patrol Report - ${trackingCode} (${session.totalDistanceMiles.toFixed(2)} mi, ${session.incidents.length} Hazards)`
  );

  const emailBody = encodeURIComponent(
    `GGC SANSPOTHOLES DRIVE-TIME PATROL READOUT\n` +
    `==============================================\n\n` +
    `Drive Tracking ID:    ${trackingCode}\n` +
    `Total Drive Length:   ${session.totalDistanceMiles.toFixed(2)} miles\n` +
    `Total Drive Duration: ${formatDuration(session.durationSeconds)}\n` +
    `Potholes Detected:    ${session.incidents.length} significant shock events\n` +
    `Max Measured Shock:   ${session.peakG.toFixed(2)} G\n` +
    `Drive Start Time:     ${new Date(session.startTime).toLocaleString()}\n` +
    `Drive End Time:       ${session.endTime ? new Date(session.endTime).toLocaleString() : 'N/A'}\n\n` +
    `==============================================\n` +
    `POTHOLE INCIDENCE READOUT:\n\n` +
    (incidentRows || 'No significant shocks recorded during this drive.\n\n') +
    `==============================================\n` +
    `Dispatched via GGC SansPotholes Drive Patrol (Academic Prototype)`
  );

  const mailtoUrl = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generateDrivePdf(session);
    } catch (e) {
      console.error('Error downloading drive PDF:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePromoteAll = () => {
    if (onPromoteIncidentsToReports && session.incidents.length > 0) {
      onPromoteIncidentsToReports(session.incidents);
      setPromotedSuccess(true);
      setTimeout(() => setPromotedSuccess(false), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 pt-14 sm:pt-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 text-xs max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-600/20 text-teal-400 border border-teal-500/30 flex items-center justify-center">
              <Route className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">Drive Patrol Report & Readout</h2>
                <span className="font-mono text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-bold">
                  {trackingCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Point-of-activation to point-of-termination route log & pothole incident audit
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto pr-1 space-y-4">
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Drive Length</span>
              <span className="text-xl font-black font-mono text-teal-400 mt-0.5 block">
                {session.totalDistanceMiles.toFixed(2)} <span className="text-xs font-sans text-slate-400">mi</span>
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Drive Time</span>
              <span className="text-xl font-black font-mono text-blue-400 mt-0.5 block">
                {formatDuration(session.durationSeconds)}
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Potholes Found</span>
              <span className="text-xl font-black font-mono text-rose-400 mt-0.5 block">
                {session.incidents.length} <span className="text-xs font-sans text-slate-400">hits</span>
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl text-center">
              <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Peak Shock</span>
              <span className="text-xl font-black font-mono text-amber-400 mt-0.5 block">
                {session.peakG.toFixed(2)} <span className="text-xs font-sans text-slate-400">G</span>
              </span>
            </div>
          </div>

          {/* Full Visual Route Map */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span>Mapped Drive Route & Shock Incidence Locations</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {session.path.length} GPS Waypoints
              </span>
            </div>

            <DriveRouteMap
              path={session.path}
              incidents={session.incidents}
              isLive={false}
              heightClass="h-48 sm:h-64"
            />
          </div>

          {/* Incident Ledger Readout */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Pothole Incidences Readout ({session.incidents.length} Events)</span>
              </span>
              {session.incidents.length > 0 && onPromoteIncidentsToReports && (
                <button
                  type="button"
                  onClick={handlePromoteAll}
                  disabled={promotedSuccess}
                  className="text-[11px] font-bold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition disabled:text-emerald-400"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{promotedSuccess ? '✓ Potholes Added to Map!' : 'Add All to System Map'}</span>
                </button>
              )}
            </div>

            {session.incidents.length === 0 ? (
              <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-center text-slate-400">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                <p className="font-semibold text-white">Clean Route — No Severe Impacts</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  No impacts exceeded the 3.0G threshold along this {session.totalDistanceMiles.toFixed(2)} mile route.
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {session.incidents.map((inc, idx) => {
                  const isHigh = inc.peakG >= 6.0;

                  return (
                    <div
                      key={inc.id}
                      className="bg-slate-950 border border-slate-800/90 hover:border-slate-700 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                    >
                      <div className="flex items-start space-x-2.5 min-w-0">
                        <div className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center font-mono font-bold text-xs text-teal-300 shrink-0">
                          #{idx + 1}
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-xs truncate">
                              {inc.roadName || inc.address}
                            </span>
                            <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider ${
                              isHigh ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {inc.severity}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              +{formatDuration(inc.elapsedSeconds)} into drive
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">
                            {inc.address}
                          </p>
                          <p className="text-[10px] font-mono text-slate-500">
                            GPS: {inc.latitude.toFixed(5)}, {inc.longitude.toFixed(5)}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                        <div className="text-right">
                          <span className="text-[9px] text-slate-500 uppercase block font-sans">Shock Force</span>
                          <span className={`text-base font-black font-mono ${
                            isHigh ? 'text-rose-400' : 'text-amber-400'
                          }`}>
                            {inc.peakG.toFixed(2)}G
                          </span>
                        </div>

                        <a
                          href={`https://www.google.com/maps?q=${inc.latitude},${inc.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-teal-300 border border-slate-800 transition"
                          title="View on Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action Dispatches */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <a
                href={mailtoUrl}
                className="py-2.5 px-3 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/20 transition flex items-center justify-center gap-2 active:scale-98"
              >
                <Mail className="w-4 h-4" />
                <span>Send Readout to {targetEmail}</span>
              </a>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={isDownloadingPdf}
                className="py-2.5 px-3 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
              >
                {isDownloadingPdf ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Preparing Drive Audit PDF...</span>
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    <span>Download Drive Audit PDF Docket</span>
                  </>
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-center transition"
            >
              Done / Close Readout
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
