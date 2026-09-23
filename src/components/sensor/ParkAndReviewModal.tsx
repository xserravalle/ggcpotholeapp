import React from 'react';
import { QueuedImpact } from '../../types/sensorQueue';
import { 
  CheckCircle2, 
  Trash2, 
  Camera, 
  MapPin, 
  Clock, 
  AlertTriangle, 
  X, 
  ShieldCheck, 
  Car,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

interface ParkAndReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  queuedImpacts: QueuedImpact[];
  onConfirmImpact: (id: string) => void;
  onDiscardImpact: (id: string) => void;
  onAddDetails: (impact: QueuedImpact) => void;
  onSubmitAllPending: () => void;
  onClearQueue: () => void;
}

export const ParkAndReviewModal: React.FC<ParkAndReviewModalProps> = ({
  isOpen,
  onClose,
  queuedImpacts,
  onConfirmImpact,
  onDiscardImpact,
  onAddDetails,
  onSubmitAllPending,
  onClearQueue
}) => {
  if (!isOpen) return null;

  const pendingImpacts = queuedImpacts.filter(i => i.status === 'pending');
  const confirmedImpacts = queuedImpacts.filter(i => i.status === 'confirmed');
  const discardedImpacts = queuedImpacts.filter(i => i.status === 'discarded');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Car className="w-4 h-4" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Park & Review — Today's Drive
              </h2>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-lg">
              Safely review road shocks auto-logged by your vehicle's accelerometer. Confirm real potholes to alert the community, or discard false alarms (speed bumps, driveway curbs).
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition shrink-0"
            aria-label="Close review queue"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Counters */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-950/50 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-3">
            <span className="font-semibold text-slate-300">
              {queuedImpacts.length} Captured Shocks
            </span>
            <span className="text-slate-600">&bull;</span>
            <span className="text-amber-400 font-medium">
              {pendingImpacts.length} to review
            </span>
            {confirmedImpacts.length > 0 && (
              <>
                <span className="text-slate-600">&bull;</span>
                <span className="text-emerald-400 font-medium">
                  {confirmedImpacts.length} confirmed
                </span>
              </>
            )}
          </div>

          {queuedImpacts.length > 0 && (
            <button
              onClick={onClearQueue}
              className="text-[11px] text-slate-500 hover:text-rose-400 transition flex items-center gap-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear Drive History</span>
            </button>
          )}
        </div>

        {/* Impact List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3.5 flex-1">
          {queuedImpacts.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-500">
                <ShieldCheck className="w-7 h-7 text-teal-400" />
              </div>
              <h3 className="text-sm font-bold text-white">No road shocks recorded</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Drive with the sensor active or press "Simulate Impact Spike" on the sensor page to test background auto-logging.
              </p>
            </div>
          ) : (
            queuedImpacts.map((impact) => {
              const isCrit = impact.gForce >= 6.0;
              const isPending = impact.status === 'pending';
              const isConfirmed = impact.status === 'confirmed';
              const isDiscarded = impact.status === 'discarded';

              return (
                <div
                  key={impact.id}
                  className={`border rounded-2xl p-4 transition space-y-3 ${
                    isConfirmed
                      ? 'bg-emerald-950/20 border-emerald-800/50'
                      : isDiscarded
                      ? 'bg-slate-900/40 border-slate-800 opacity-60'
                      : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2 flex-wrap">
                        {/* G-Force Badge */}
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 ${
                          isCrit
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        }`}>
                          <AlertTriangle className="w-3 h-3" />
                          <span>{impact.gForce}G Impact</span>
                        </span>

                        <span className="text-xs font-semibold text-white">
                          {isCrit ? 'Severe Jolt (Potential Rim Risk)' : 'Moderate Pavement Vibration'}
                        </span>
                      </div>

                      {/* Location & Time */}
                      <div className="flex items-center space-x-3 text-xs text-slate-400 pt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{impact.timestamp}</span>
                        </span>
                        <span>&bull;</span>
                        <span className="flex items-center gap-1 font-mono text-[11px] text-teal-300/90">
                          <MapPin className="w-3 h-3 text-slate-500" />
                          <span>{impact.roadName || `${impact.latitude.toFixed(4)}, ${impact.longitude.toFixed(4)}`}</span>
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <div>
                      {isConfirmed && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirmed</span>
                        </span>
                      )}
                      {isDiscarded && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1.5">
                          <X className="w-3.5 h-3.5" />
                          <span>Discarded (False Alarm)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons for Pending Items */}
                  {isPending && (
                    <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {/* 1-Tap Confirm Button */}
                        <button
                          onClick={() => onConfirmImpact(impact.id)}
                          className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition flex items-center gap-1.5 active:scale-95"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Confirm Pothole</span>
                        </button>

                        {/* 1-Tap False Alarm Discard */}
                        <button
                          onClick={() => onDiscardImpact(impact.id)}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5 active:scale-95"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>False Alarm</span>
                        </button>
                      </div>

                      {/* Optional: Add Photo / Details */}
                      <button
                        onClick={() => onAddDetails(impact)}
                        className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 transition"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Add Photo / Notes</span>
                      </button>
                    </div>
                  )}

                  {/* Discarded Undo Option */}
                  {isDiscarded && (
                    <div className="pt-1 flex justify-end">
                      <button
                        onClick={() => onConfirmImpact(impact.id)}
                        className="text-[11px] text-slate-400 hover:text-teal-300 flex items-center gap-1 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Re-evaluate & Confirm</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        {queuedImpacts.length > 0 && (
          <div className="p-4 sm:p-5 bg-slate-950/70 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              {pendingImpacts.length > 0 
                ? `${pendingImpacts.length} pending shocks waiting for confirmation`
                : 'All detected shocks have been processed'}
            </span>

            <div className="flex items-center space-x-2.5">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 border border-slate-700 transition"
              >
                Close
              </button>

              {pendingImpacts.length > 0 && (
                <button
                  onClick={onSubmitAllPending}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-teal-500/20 transition flex items-center gap-1.5 active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Confirm All ({pendingImpacts.length}) to Map</span>
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
