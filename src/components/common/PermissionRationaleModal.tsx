import React from 'react';
import { MapPin, Activity, Camera, Shield, X } from 'lucide-react';

export type PermissionType = 'location' | 'motion' | 'camera';

interface PermissionRationaleModalProps {
  isOpen: boolean;
  type: PermissionType;
  title?: string;
  rationale: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export const PermissionRationaleModal: React.FC<PermissionRationaleModalProps> = ({
  isOpen,
  type,
  title,
  rationale,
  confirmLabel,
  cancelLabel = 'Not Now',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const config = {
    location: {
      icon: MapPin,
      defaultTitle: 'Location Access',
      defaultConfirm: 'Allow Location',
      color: 'emerald',
      bgColor: 'bg-emerald-500/20',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-400',
      btnBg: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20',
    },
    motion: {
      icon: Activity,
      defaultTitle: 'Motion Sensor Access',
      defaultConfirm: 'Allow Motion Sensor',
      color: 'amber',
      bgColor: 'bg-amber-500/20',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-400',
      btnBg: 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/20',
    },
    camera: {
      icon: Camera,
      defaultTitle: 'Camera & Photo Access',
      defaultConfirm: 'Allow Camera',
      color: 'sky',
      bgColor: 'bg-sky-500/20',
      borderColor: 'border-sky-500/30',
      textColor: 'text-sky-400',
      btnBg: 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/20',
    },
  }[type];

  const Icon = config.icon;

  const handleConfirmClick = (e: React.MouseEvent) => {
    e.preventDefault();
    // Synchronous execution path preserves iOS Safari user gesture context
    onConfirm();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="permission-modal-title"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${config.bgColor} ${config.borderColor} ${config.textColor}`}
            >
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                  Privacy Choice
                </span>
              </div>
              <h3
                id="permission-modal-title"
                className="text-lg font-bold text-white tracking-tight mt-0.5"
              >
                {title || config.defaultTitle}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Dismiss permission prompt"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/80 rounded-2xl p-4">
          <p className="text-sm text-slate-200 leading-relaxed font-medium">
            {rationale}
          </p>
          <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
            <span>Device-only processing</span>
            <span>Never shared with advertisers</span>
          </div>
        </div>

        <div className="flex items-center space-x-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={handleConfirmClick}
            className={`flex-1 py-2.5 px-4 text-white font-bold rounded-xl text-xs shadow-lg transition active:scale-95 ${config.btnBg}`}
          >
            {confirmLabel || config.defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );
};
