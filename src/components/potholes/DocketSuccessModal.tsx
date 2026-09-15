import React from 'react';
import { PotholeReport } from '../../types/pothole';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { 
  Check, 
  FileDown, 
  Mail, 
  X, 
  Building2, 
  ExternalLink,
  GraduationCap
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
  const authName = report.authorityName || report.jurisdiction;
  const authEmail = report.authorityEmail || 'dotcustomerservice@gwinnettcounty.com';

  const emailSubject = encodeURIComponent(`[ROAD HAZARD DISPATCH] ${trackingCode} - ${report.severity.toUpperCase()} on ${report.roadName || report.address}`);
  const emailBody = encodeURIComponent(
    `ATTN: ${authName} Road Maintenance Dispatch,\n\n` +
    `A priority road hazard has been logged and assigned to your jurisdiction.\n\n` +
    `Incident Tracking Code: ${trackingCode}\n` +
    `Severity: ${report.severity.toUpperCase()}\n` +
    `Hazard: ${report.hazardType || 'POTHOLE'}\n` +
    `GPS Coordinates: ${report.latitude.toFixed(5)}, ${report.longitude.toFixed(5)}\n` +
    `Corridor/Address: ${report.address}\n` +
    `Landmark: ${report.landmark || 'N/A'}\n` +
    `Telemetry: ${report.sensorDetected ? `Vertical shock spike of ${report.bumpIntensity}G` : report.detectedBy}\n\n` +
    `Description: ${report.description}\n\n` +
    `Official certified PDF docket has been generated. Please review and dispatch road crew.`
  );

  const mailtoUrl = `mailto:${authEmail}?subject=${emailSubject}&body=${emailBody}`;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-8 animate-in fade-in zoom-in-95 text-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-white">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <span>Report Docket Successfully Logged</span>
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
            <Building2 className="w-3.5 h-3.5 text-teal-400" />
            <span>Assigned to: {authName}</span>
          </p>
        </div>

        {/* Summary Card */}
        <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-1.5 mb-4 text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-500">Location:</span>
            <span className="font-semibold text-white truncate max-w-[200px]">{report.address}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Severity:</span>
            <span className={`font-bold uppercase ${
              report.severity === 'critical' ? 'text-rose-400' : 'text-amber-400'
            }`}>
              {report.severity}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Target Contact:</span>
            <span className="font-mono text-teal-400">{authEmail}</span>
          </div>
          {report.sensorDetected && (
            <div className="flex justify-between text-rose-400">
              <span>Drive Telemetry:</span>
              <span className="font-bold">{report.bumpIntensity}G Shock Spike</span>
            </div>
          )}
        </div>

        <p className="text-slate-400 text-center mb-4 leading-relaxed text-[11px]">
          An official transportation hazard docket has been drafted. You can download the certified incident PDF or dispatch a direct pre-filled email to maintenance.
        </p>

        {/* Actions */}
        <div className="space-y-2">
          <button
            onClick={() => generatePotholePdf(report)}
            className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow-lg shadow-purple-700/25 transition flex items-center justify-center gap-2 active:scale-98"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Certified Incident PDF</span>
          </button>

          <a
            href={mailtoUrl}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 active:scale-98"
          >
            <Mail className="w-4 h-4" />
            <span>Send Email to Maintenance Dispatch</span>
          </a>

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
