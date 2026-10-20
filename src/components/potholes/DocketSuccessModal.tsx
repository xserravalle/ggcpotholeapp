import React from 'react';
import { PotholeReport } from '../../types/pothole';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { 
  Check, 
  FileDown, 
  Mail, 
  X, 
  Building2, 
  MapPin,
  ExternalLink
} from 'lucide-react';

interface DocketSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: PotholeReport | null;
  onViewOnMap?: () => void;
}

export const DocketSuccessModal: React.FC<DocketSuccessModalProps> = ({
  isOpen,
  onClose,
  report,
  onViewOnMap
}) => {
  if (!isOpen || !report) return null;

  const trackingCode = report.trackingCode || `GAP-2026-${report.id.replace(/[^0-9]/g, '').slice(-4) || '1042'}`;
  const targetEmail = 'peyton.holland@gmail.com';

  const emailSubject = encodeURIComponent(`[GGC SansPotholes] Road Hazard Report - ${trackingCode} (${report.severity.toUpperCase()})`);
  const emailBody = encodeURIComponent(
    `GGC SANSPOTHOLES ROAD HAZARD DOCKET\n` +
    `========================================\n\n` +
    `Incident Tracking Code: ${trackingCode}\n` +
    `Severity Rating:        ${report.severity.toUpperCase()}\n` +
    `Hazard Type:            ${report.hazardType || 'POTHOLE'}\n` +
    `Nearest Street Address: ${report.address}\n` +
    `Landmark / Specifics:   ${report.landmark || 'None provided'}\n` +
    `Potential Damage Risk:  ${report.damageRisk || 'Tire / Rim Damage'}\n` +
    `Detection Source:       ${report.sensorDetected ? `In-Vehicle Accelerometer (${report.bumpIntensity}G Shock Spike)` : report.detectedBy}\n` +
    `Driver Notes:           ${report.description || 'No additional details.'}\n` +
    `Submitted Date & Time:  ${new Date().toLocaleString()}\n` +
    `Reporter:               ${report.reporterName || 'Anonymous Citizen'}${report.reporterEmail ? ` <${report.reporterEmail}>` : ''}\n\n` +
    `Map Location Pin:\n` +
    `https://www.google.com/maps?q=${report.latitude},${report.longitude}\n\n` +
    `========================================\n` +
    `Dispatched via GGC SansPotholes (Academic Prototype)`
  );

  const mailtoUrl = `mailto:${targetEmail}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 pt-14 sm:pt-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-white">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <span>Road Report Generated</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tracking Code Centerpiece */}
        <div className="text-center py-2 mb-3">
          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            Incident Tracking Code
          </span>
          <div className="text-2xl font-black font-mono text-emerald-400 tracking-wide mt-0.5">
            {trackingCode}
          </div>
          <p className="text-xs text-slate-300 mt-1 font-semibold flex items-center justify-center gap-1">
            <Mail className="w-3.5 h-3.5 text-teal-400" />
            <span>Target: <strong className="font-mono text-teal-300">{targetEmail}</strong></span>
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 mb-4 text-slate-300">
          <div className="flex justify-between items-start gap-2">
            <span className="text-slate-500 shrink-0">Closest Address:</span>
            <span className="font-semibold text-white text-right truncate max-w-[220px]">{report.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Severity:</span>
            <span className={`font-bold uppercase ${
              report.severity === 'critical' || report.severity === 'severe' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {report.severity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Category:</span>
            <span className="text-white font-medium">{report.hazardType || 'Pothole'}</span>
          </div>
          {report.sensorDetected && (
            <div className="flex justify-between text-rose-400 font-medium">
              <span>Drive Telemetry:</span>
              <span className="font-bold">{report.bumpIntensity}G Shock Spike</span>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-center mb-4 leading-relaxed text-[11px]">
          Tap below to send the complete formatted incident report to your testing email, or download the certified PDF docket.
        </p>

        {/* Actions */}
        <div className="space-y-2">
          <a
            href={mailtoUrl}
            className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Mail className="w-4 h-4" />
            <span>Send Report to {targetEmail}</span>
          </a>

          <button
            onClick={() => generatePotholePdf(report)}
            className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 active:scale-98"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Incident PDF Docket</span>
          </button>

          {onViewOnMap && (
            <button
              onClick={() => {
                onClose();
                onViewOnMap();
              }}
              className="w-full py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-center transition"
            >
              View on Interactive Map
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
