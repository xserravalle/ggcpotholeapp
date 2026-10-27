import React, { useState } from 'react';
import { PotholeReport } from '../../types/pothole';
import { useAccessibility } from '../../context/AccessibilityContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { 
  MapPin, 
  ThumbsUp, 
  ShieldAlert, 
  Activity, 
  Building2, 
  X,
  Volume2,
  VolumeX,
  ExternalLink,
  FileDown,
  RefreshCw,
  Send
} from 'lucide-react';

interface PotholeDetailDrawerProps {
  pothole: PotholeReport | null;
  onClose: () => void;
  onVerify: (id: string) => void;
  onOpenDispatcher?: (pothole: PotholeReport) => void;
  isAdmin?: boolean;
}

export const PotholeDetailDrawer: React.FC<PotholeDetailDrawerProps> = ({
  pothole,
  onClose,
  onVerify,
  onOpenDispatcher,
  isAdmin = false
}) => {
  const { speakPothole, stopSpeaking, isSpeaking } = useAccessibility();
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  if (!pothole) return null;

  const isRepaired = pothole.status === 'resolved' || pothole.status === 'closed';
  const hasValidImage = Boolean(pothole.imageUrl && pothole.imageUrl.trim() !== '');

  // Calculate measured or estimated shock telemetry
  const shockValue = 
    pothole.bumpIntensity && pothole.bumpIntensity > 0
      ? pothole.bumpIntensity
      : pothole.sensorEvidence?.maxGForce
      ? pothole.sensorEvidence.maxGForce
      : pothole.severity === 'critical'
      ? 7.80
      : pothole.severity === 'severe'
      ? 5.40
      : pothole.severity === 'moderate'
      ? 3.80
      : 1.80;

  const handleDownloadPdf = async () => {
    setIsDownloadingPdf(true);
    try {
      await generatePotholePdf(pothole);
    } catch (e) {
      console.error('Error generating PDF:', e);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div className="flex items-center space-x-2">
          {isRepaired ? (
            <span className="px-2 py-0.5 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700">
              ✓ Repaired
            </span>
          ) : (
            <SeverityBadge severity={pothole.severity} />
          )}
          <span className="text-xs font-mono text-slate-400">
            #{pothole.id}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Audio Narration */}
          <button
            onClick={() => isSpeaking ? stopSpeaking() : speakPothole(pothole)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700'
            }`}
            title="Narrate hazard overview"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>

          {/* PDF Docket Download */}
          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center gap-1 transition disabled:opacity-60"
            title="Download PDF Claim Docket"
          >
            {isDownloadingPdf ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileDown className="w-3.5 h-3.5 text-teal-400" />
            )}
            <span>PDF</span>
          </button>

          {/* Close Drawer */}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-3.5 sm:p-4 space-y-3 flex-1 text-xs">
        {/* Title & Location */}
        <div>
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800 inline-flex items-center gap-1">
              📍 {pothole.landmark || pothole.roadName || 'GGC Campus Corridor'}
            </span>

            {/* Google Maps Jump Link */}
            <a
              href={`https://www.google.com/maps?q=${pothole.latitude},${pothole.longitude}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 transition"
            >
              <span>Google Maps</span>
              <ExternalLink className="w-3 h-3 text-teal-400" />
            </a>
          </div>

          <h2 className="text-base font-bold text-white leading-snug">{pothole.title}</h2>
          <div className="flex items-start space-x-2 mt-1.5 text-xs text-slate-200">
            <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-white">
                {pothole.roadName} {pothole.landmark ? `(near ${pothole.landmark})` : ''}
              </p>
              <p className="text-slate-300 text-[11px]">{pothole.address} • {pothole.city}, Gwinnett County</p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                GPS: {pothole.latitude.toFixed(5)}, {pothole.longitude.toFixed(5)}
                {pothole.distanceFromGgcMiles !== undefined ? ` (${pothole.distanceFromGgcMiles.toFixed(2)} mi from campus)` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Photo Preview ONLY if provided */}
        {hasValidImage && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group max-h-40">
            <img 
              src={pothole.imageUrl} 
              alt={pothole.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded text-[10px] text-slate-200 border border-slate-700">
              Verified Road Pavement Capture
            </div>
          </div>
        )}

        {/* Description */}
        {pothole.description && (
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-2.5 text-xs text-slate-200">
            <p className="leading-relaxed">{pothole.description}</p>
          </div>
        )}

        {/* Compact Physical Metrics & Shock Reading Grid */}
        <div className="grid grid-cols-4 gap-2">
          <div className="bg-slate-800/40 border border-slate-700/50 p-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-300 block">Depth</span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">
              {pothole.estimatedDepthInches}"
            </span>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-300 block">Width</span>
            <span className="text-xs font-bold text-white font-mono mt-0.5 block">
              {pothole.estimatedWidthInches}"
            </span>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-300 block">Material</span>
            <span className="text-xs font-bold text-white mt-0.5 block truncate">
              {pothole.surfaceType || 'Asphalt'}
            </span>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-2 rounded-xl text-center">
            <span className="text-[10px] text-slate-300 block flex items-center justify-center gap-1">
              <Activity className="w-3 h-3 text-emerald-400" /> Shock
            </span>
            <span className={`text-xs font-bold font-mono mt-0.5 block ${
              shockValue >= 6.0 ? 'text-rose-400' : shockValue >= 3.0 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {shockValue.toFixed(1)}G
            </span>
          </div>
        </div>

        {/* Sensor readings if applicable */}
        {pothole.sensorEvidence && (
          <section className="bg-emerald-950/30 border border-emerald-800/50 rounded-xl p-2.5 text-xs text-slate-200">
            <h3 className="font-semibold text-emerald-300 mb-1.5">
              Why this sensor report was created
            </h3>
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div>
                <span className="text-slate-400 block">Impacts nearby:</span>
                <span className="font-bold text-white">{pothole.sensorEvidence.hitCount}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Highest reading:</span>
                <span className="font-bold text-white">{pothole.sensorEvidence.maxGForce.toFixed(2)} G</span>
              </div>
            </div>
          </section>
        )}

        {/* Damage Hazard Assessment & Crowdsourced Verification Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-2.5">
            <div className="flex items-center space-x-1.5 text-rose-300 font-semibold text-[11px] mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Hazard Risk</span>
            </div>
            <p className="text-xs text-rose-200 font-medium">
              <strong className="text-white">{pothole.damageRisk}</strong>
            </p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1 font-semibold">
                <ThumbsUp className="w-3 h-3 text-emerald-400" /> Confirmations
              </span>
              <span className="font-mono font-bold text-emerald-300">{pothole.verificationsCount}</span>
            </div>
            <button
              onClick={() => onVerify(pothole.id)}
              className="mt-1.5 w-full bg-slate-700 hover:bg-emerald-600 hover:text-white text-slate-100 font-semibold py-1 rounded-lg text-[11px] flex items-center justify-center gap-1 transition active:scale-98"
            >
              <ThumbsUp className="w-3 h-3" />
              <span>Confirm (+1)</span>
            </button>
          </div>
        </div>

        {/* Municipal Jurisdiction & Work Order Info */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-2.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Assigned Jurisdiction
            </span>
            <span className="text-xs font-bold text-blue-300">{pothole.jurisdiction}</span>
          </div>

          {pothole.workOrderNumber && (
            <div className="flex justify-between text-[11px] pt-1 border-t border-slate-700/40">
              <span className="text-slate-300">Work Order #:</span>
              <span className="font-mono text-slate-100">{pothole.workOrderNumber}</span>
            </div>
          )}

          {pothole.assignedCrew && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300">Assigned Road Crew:</span>
              <span className="text-slate-100">{pothole.assignedCrew}</span>
            </div>
          )}

          {pothole.targetRepairDate && (
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-300">Target Completion:</span>
              <span className="text-emerald-400 font-semibold">{pothole.targetRepairDate}</span>
            </div>
          )}
        </div>

        {/* Admin-Only Structured Dispatch CTA */}
        {isAdmin && onOpenDispatcher && (
          <div className="pt-2">
            <button
              onClick={() => onOpenDispatcher(pothole)}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-2 shadow transition active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Admin: Dispatch Structured Report</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
