import React from 'react';
import { PotholeReport } from '../../types/pothole';
import { 
  AlertTriangle, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ThumbsUp, 
  Send, 
  ShieldAlert, 
  Ruler, 
  HardHat, 
  Building2, 
  X,
  Share2
} from 'lucide-react';

interface PotholeDetailDrawerProps {
  pothole: PotholeReport | null;
  onClose: () => void;
  onVerify: (id: string) => void;
  onOpenDispatcher: (pothole: PotholeReport) => void;
}

export const PotholeDetailDrawer: React.FC<PotholeDetailDrawerProps> = ({
  pothole,
  onClose,
  onVerify,
  onOpenDispatcher
}) => {
  if (!pothole) return null;

  const isSevere = pothole.severity === 'severe';
  const isRepaired = pothole.status === 'repaired';

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div className="flex items-center space-x-2">
          <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
            isRepaired ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700' :
            isSevere ? 'bg-rose-900/60 text-rose-300 border border-rose-700' :
            pothole.severity === 'moderate' ? 'bg-amber-900/60 text-amber-300 border border-amber-700' :
            'bg-yellow-900/60 text-yellow-300 border border-yellow-700'
          }`}>
            {isRepaired ? 'Repaired' : `${pothole.severity} Hazard`}
          </span>
          <span className="text-xs text-slate-400 font-mono">#{pothole.id}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-5 flex-1">
        {/* Title & Location */}
        <div>
          <h2 className="text-lg font-bold text-white leading-snug">{pothole.title}</h2>
          <div className="flex items-start space-x-2 mt-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-slate-200">{pothole.address}</p>
              <p className="text-slate-400">{pothole.roadName} • {pothole.city}, Gwinnett County</p>
            </div>
          </div>
        </div>

        {/* Photo Preview if available */}
        {pothole.imageUrl && (
          <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video group">
            <img 
              src={pothole.imageUrl} 
              alt={pothole.title}
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" 
            />
            <div className="absolute bottom-2 left-2 bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded text-[11px] text-slate-300 border border-slate-700">
              Verified Road Pavement Capture
            </div>
          </div>
        )}

        {/* Description */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">{pothole.description}</p>
        </div>

        {/* Physical Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="bg-slate-800/40 border border-slate-700/50 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Ruler className="w-3 h-3 text-blue-400" /> Estimated Depth
            </span>
            <span className="text-sm font-bold text-white block mt-1 font-mono">
              {pothole.estimatedDepthInches} inches
            </span>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-2.5 rounded-xl">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <Ruler className="w-3 h-3 text-teal-400" /> Cavity Diameter
            </span>
            <span className="text-sm font-bold text-white block mt-1 font-mono">
              {pothole.estimatedWidthInches} inches
            </span>
          </div>

          <div className="bg-slate-800/40 border border-slate-700/50 p-2.5 rounded-xl col-span-2 sm:col-span-1">
            <span className="text-[10px] text-slate-400 block">Surface Material</span>
            <span className="text-sm font-bold text-white block mt-1">
              {pothole.surfaceType}
            </span>
          </div>
        </div>

        {/* Damage Hazard Assessment */}
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3.5">
          <div className="flex items-center space-x-2 text-rose-300 font-semibold text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Vehicular Hazard Rating</span>
          </div>
          <p className="text-xs text-rose-200/90 font-medium">
            Primary Risk: <strong className="text-white">{pothole.damageRisk}</strong>
          </p>
          <p className="text-[11px] text-rose-300/70 mt-1">
            Detected via: <span className="text-slate-200 font-medium">{pothole.detectedBy}</span>
          </p>
        </div>

        {/* Crowdsourced Verification Bar */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-teal-400" /> Crowdsourced Confirmations
            </span>
            <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
              {pothole.verificationsCount} Citizens Confirmed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Reports with multiple citizen upvotes receive priority dispatch in municipal work queues.
          </p>
          <button
            onClick={() => onVerify(pothole.id)}
            className="w-full bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-200 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition active:scale-98"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>I Encountered This Pothole (+1 Verification)</span>
          </button>
        </div>

        {/* Municipal Jurisdiction & Work Order Info */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Assigned Jurisdiction
            </span>
            <span className="text-xs font-bold text-blue-300">{pothole.jurisdiction}</span>
          </div>

          {pothole.workOrderNumber && (
            <div className="flex justify-between text-xs pt-1 border-t border-slate-700/40">
              <span className="text-slate-400">Work Order #:</span>
              <span className="font-mono text-slate-200">{pothole.workOrderNumber}</span>
            </div>
          )}

          {pothole.assignedCrew && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Assigned Road Crew:</span>
              <span className="text-slate-200">{pothole.assignedCrew}</span>
            </div>
          )}

          {pothole.targetRepairDate && (
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Target Completion:</span>
              <span className="text-emerald-400 font-semibold">{pothole.targetRepairDate}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer CTA Buttons */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex gap-2">
        <button
          onClick={() => onOpenDispatcher(pothole)}
          className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition active:scale-98"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch Structured Report</span>
        </button>
      </div>

    </div>
  );
};
