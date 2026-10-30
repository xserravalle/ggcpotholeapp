import React, { useState } from 'react';
import { PotholeReport } from '../../types/pothole';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { 
  Check, 
  FileDown, 
  Mail, 
  X, 
  Building2, 
  MapPin,
  ExternalLink,
  Camera,
  RefreshCw,
  Copy
} from 'lucide-react';
import { AUTHORITIES_DIRECTORY } from '../../data/jurisdictionsData';
import { formatDispatchMailto, isDemoDispatch, DEMO_DISPATCH_EMAIL, getEffectiveDispatchEmail } from '../../config/dispatch';

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
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen || !report) return null;

  const trackingCode = report.trackingCode || `GAP-2026-${report.id.replace(/[^0-9]/g, '').slice(-4) || '1042'}`;

  const authority = (report.authorityId && AUTHORITIES_DIRECTORY[report.authorityId]) ||
    Object.values(AUTHORITIES_DIRECTORY).find(
      a => a.name === report.authorityName || a.name === report.jurisdiction
    ) || AUTHORITIES_DIRECTORY.GWINNETT_COUNTY;

  const agencyName = report.authorityName || report.jurisdiction || authority?.name || 'Gwinnett County DOT';
  const targetDays = authority?.slaTargetDays ?? 5;
  const targetEmail = getEffectiveDispatchEmail(authority?.contactEmail);

  const handleCopyTrackingCode = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(trackingCode);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mailtoUrl = formatDispatchMailto({
    to: authority?.contactEmail || 'dotcustomerservice@gwinnettcounty.com',
    agencyName,
    subject: `[GGC SansPotholes] Road Hazard Report - ${trackingCode} (${report.severity.toUpperCase()})`,
    body: (
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
      `Centralized Map Location:\n` +
      `https://www.google.com/maps?q=${encodeURIComponent(report.latitude)},${encodeURIComponent(report.longitude)}\n` +
      `Location Snapshot:      Generated & attached to incident PDF docket\n\n` +
      `========================================\n` +
      `Dispatched via GGC SansPotholes (Academic Prototype)`
    ),
  });

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generatePotholePdf(report);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-4 pt-14 sm:pt-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 text-xs max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3 shrink-0">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <div className="w-7 h-7 rounded-full bg-emerald-950 border border-emerald-700 flex items-center justify-center text-white">
              <Check className="w-4 h-4 text-emerald-400" />
            </div>
            <span>Road Report Generated</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto pr-0.5 space-y-3">
          {/* Tracking Code Centerpiece */}
          <div className="text-center py-2 bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Incident Tracking Code
            </span>
            <div className="flex items-center justify-center gap-2 mt-1 flex-wrap">
              <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 tracking-wider">
                {trackingCode}
              </span>
              <button
                type="button"
                onClick={handleCopyTrackingCode}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5 text-xs font-semibold transition cursor-pointer"
                title="Copy tracking code"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 text-[11px]">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-[11px]">Copy</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-300 mt-1.5 font-semibold flex items-center justify-center gap-1">
              <Mail className="w-3.5 h-3.5 text-teal-400" />
              <span>Target: <strong className="font-mono text-teal-300">{targetEmail}</strong></span>
            </p>
          </div>

          {/* Routed Agency & Target Repair Time */}
          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 border border-emerald-700 flex items-center justify-center shrink-0 text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Routed Agency
              </div>
              <div className="text-xs font-bold text-white truncate">
                {agencyName}
              </div>
              <div className="text-[11px] text-emerald-400 font-medium">
                {agencyName} usually responds within {targetDays} days
              </div>
            </div>
          </div>

          {/* Centralized Location Map Screenshot Image */}
          {report.imageUrl && (
            <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-md">
              <div className="relative">
                <img
                  src={report.imageUrl}
                  alt="Centralized Incident Map Location Screenshot"
                  className="w-full h-32 sm:h-36 object-cover"
                />
                <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-slate-900/90 border border-slate-700 text-[10px] font-mono font-semibold text-emerald-400 flex items-center gap-1 shadow">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  <span>Location Snapshot Captured</span>
                </div>
              </div>
              <div className="px-3 py-1.5 bg-slate-900 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                <span>GPS Pin: {report.latitude.toFixed(5)}, {report.longitude.toFixed(5)}</span>
                <span className="text-teal-400 font-sans font-medium flex items-center gap-1">
                  <Camera className="w-3 h-3 text-teal-400" />
                  <span>Verified Image</span>
                </span>
              </div>
            </div>
          )}

          {/* Summary Card */}
          <div className="bg-slate-950 rounded-xl p-3.5 border border-slate-800 space-y-2 text-slate-300">
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 shrink-0">Closest Address:</span>
              <span className="font-semibold text-white text-right truncate max-w-[220px]">{report.address}</span>
            </div>
            <div className="flex justify-between items-start gap-2">
              <span className="text-slate-500 shrink-0">Routed Agency:</span>
              <span className="font-semibold text-white text-right truncate max-w-[220px]">{agencyName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Target Repair Time:</span>
              <span className="font-semibold text-emerald-400">{targetDays} days</span>
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

          <p className="text-slate-400 text-center leading-relaxed text-[11px]">
            Tap below to send the formatted incident report to your testing inbox, or download the official PDF docket with the map screenshot embedded.
          </p>

          {/* Actions */}
          <div className="space-y-2 pt-1">
            <a
              href={mailtoUrl.url}
              className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl shadow-lg shadow-teal-600/25 transition flex items-center justify-center gap-2 active:scale-98"
            >
              <Mail className="w-4 h-4" />
              <span>Send Report Email ({agencyName})</span>
            </a>
            {isDemoDispatch() && (
              <span className="text-[11px] text-amber-400 font-medium block text-center">
                Demo mode: email routes to {DEMO_DISPATCH_EMAIL}
              </span>
            )}

            <button
              onClick={handleDownloadPdf}
              disabled={isDownloadingPdf}
              className="w-full py-2.5 px-4 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow transition flex items-center justify-center gap-2 active:scale-98 disabled:opacity-60"
            >
              {isDownloadingPdf ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Preparing Incident PDF Docket...</span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  <span>Download Incident PDF Docket</span>
                </>
              )}
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
    </div>
  );
};
