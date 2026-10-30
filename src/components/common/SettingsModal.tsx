import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  Eye, 
  Type, 
  Palette, 
  Volume2, 
  Square, 
  Activity, 
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Clock,
  Download,
  Trash2,
  Shield,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';
import { useAccessibility, FontSizeKey, FontFamilyKey, ThemeKey, FONT_SIZES } from '../../context/AccessibilityContext';
import { useReports } from '../../context/ReportsContext';
import { 
  getDriveRetentionDays, 
  setDriveRetentionDays, 
  getStoredDriveSessionCount 
} from '../../services/driveSessionService';
import { PotholeReport } from '../../types/pothole';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToSensor?: () => void;
  potholes?: PotholeReport[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onNavigateToSensor,
  potholes = []
}) => {
  const {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    theme,
    setTheme,
    isSpeaking,
    speakSummary,
    stopSpeaking
  } = useAccessibility();

  // Draft local state for previewing adjustments before committing
  const [draftFontSize, setDraftFontSize] = useState<FontSizeKey>(fontSize);
  const [draftFontFamily, setDraftFontFamily] = useState<FontFamilyKey>(fontFamily);
  const [draftTheme, setDraftTheme] = useState<ThemeKey>(theme);

  // Data Sovereignty & Drive Retention state (Task S4)
  const { exportAllData, deleteAllData } = useReports();
  const [retentionDays, setRetentionDaysState] = useState<number>(30);
  const [driveSessionCount, setDriveSessionCount] = useState<number>(0);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isPrivacyExpanded, setIsPrivacyExpanded] = useState(false);

  // Synchronize draft state with actual context when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftFontSize(fontSize);
      setDraftFontFamily(fontFamily);
      setDraftTheme(theme);
      setRetentionDaysState(getDriveRetentionDays());
      setDriveSessionCount(getStoredDriveSessionCount());
      setIsConfirmingDelete(false);
      setDeleteSuccess(false);
    }
  }, [isOpen, fontSize, fontFamily, theme]);

  const handleRetentionChange = (days: number) => {
    setRetentionDaysState(days);
    setDriveRetentionDays(days);
    setDriveSessionCount(getStoredDriveSessionCount());
  };

  const handleDownloadData = async () => {
    setIsExporting(true);
    try {
      const data = await exportAllData();
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sanspotholes-my-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export data:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAllData = async () => {
    try {
      await deleteAllData();
      setDriveSessionCount(0);
      setIsConfirmingDelete(false);
      setDeleteSuccess(true);
      setTimeout(() => setDeleteSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to delete data:', err);
    }
  };

  if (!isOpen) return null;

  const fontSizes: { key: FontSizeKey; label: string; desc: string }[] = [
    { key: 'small', label: 'A−', desc: 'Compact' },
    { key: 'normal', label: 'A', desc: 'Standard' },
    { key: 'large', label: 'A+', desc: 'Large' },
    { key: 'huge', label: 'A++', desc: 'Maximum' }
  ];

  const themes: { key: ThemeKey; title: string; subtitle: string; badge: string }[] = [
    { key: 'colorblind', title: 'Colorblind-Safe', subtitle: 'Okabe-Ito verified palette for color vision deficiency', badge: 'Recommended' },
    { key: 'high-contrast', title: 'High Contrast', subtitle: 'Maximum contrast black & amber for bright daylight', badge: 'High Visibility' },
    { key: 'standard', title: 'Standard GGC', subtitle: 'Georgia Gwinnett College green & slate motif', badge: 'GGC Classic' },
    { key: 'dark', title: 'Dark Modern', subtitle: 'Deep neutral midnight theme for night driving', badge: 'Dark Mode' }
  ];

  // Live visual preview handlers without persisting to localStorage
  const handlePreviewFontSize = (size: FontSizeKey) => {
    setDraftFontSize(size);
    document.documentElement.style.fontSize = FONT_SIZES[size];
    document.documentElement.style.setProperty('--app-font-size', FONT_SIZES[size]);
  };

  const handlePreviewFontFamily = (font: FontFamilyKey) => {
    setDraftFontFamily(font);
    document.documentElement.setAttribute('data-font', font);
    document.body.setAttribute('data-font', font);
  };

  const handlePreviewTheme = (newTheme: ThemeKey) => {
    setDraftTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  // Roll back previewed styles to saved context values
  const handleCancel = () => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
    document.documentElement.style.setProperty('--app-font-size', FONT_SIZES[fontSize]);
    document.documentElement.setAttribute('data-font', fontFamily);
    document.body.setAttribute('data-font', fontFamily);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
    onClose();
  };

  // Commit draft styles to context and localStorage
  const handleDone = () => {
    if (draftFontSize !== fontSize) {
      setFontSize(draftFontSize);
    }
    if (draftFontFamily !== fontFamily) {
      setFontFamily(draftFontFamily);
    }
    if (draftTheme !== theme) {
      setTheme(draftTheme);
    }
    onClose();
  };

  const hasUnsavedChanges = 
    draftFontSize !== fontSize || 
    draftFontFamily !== fontFamily || 
    draftTheme !== theme;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-6 my-8 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 id="settings-modal-title" className="text-lg font-bold text-white tracking-tight">
                Settings & Accessibility
              </h3>
              <p className="text-xs text-slate-300">
                Personalize font sizing, color themes, voice, and driver tools
              </p>
            </div>
          </div>
          <button
            onClick={handleCancel}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Font Sizing & Dyslexia Typography */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Eye className="w-4 h-4" />
            <span>Text Size & Typography</span>
          </div>

          {/* Font Size Buttons */}
          <div className="grid grid-cols-4 gap-2">
            {fontSizes.map(({ key, label, desc }) => {
              const isActive = draftFontSize === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePreviewFontSize(key)}
                  className={`py-2 px-1 rounded-xl text-center border transition flex flex-col items-center justify-center gap-0.5 ${
                    isActive 
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 font-black' 
                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80 hover:bg-slate-800 hover:text-white'
                  }`}
                  aria-pressed={isActive}
                >
                  <span className="text-base leading-none font-bold">{label}</span>
                  <span className="text-[10px] opacity-80">{desc}</span>
                </button>
              );
            })}
          </div>

          {/* Typeface Toggle: Comic Sans vs Sans */}
          <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center space-x-2">
                <Type className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-xs font-bold text-white">Comic Sans MS Typography</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Irregular character shapes assist readers with dyslexia and reduce cognitive fatigue
              </p>
            </div>
            <button
              onClick={() => handlePreviewFontFamily(draftFontFamily === 'comic-sans' ? 'sans' : 'comic-sans')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                draftFontFamily === 'comic-sans'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {draftFontFamily === 'comic-sans' ? 'Active (Default)' : 'Standard Sans'}
            </button>
          </div>
        </div>

        {/* Section 2: Color Schemes */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Palette className="w-4 h-4" />
            <span>Color Palette & Contrast</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {themes.map(({ key, title, subtitle, badge }) => {
              const isActive = draftTheme === key;
              return (
                <button
                  key={key}
                  onClick={() => handlePreviewTheme(key)}
                  className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                    isActive
                      ? 'bg-slate-800 border-emerald-500 shadow-md ring-1 ring-emerald-500/50'
                      : 'bg-slate-800/50 border-slate-700/70 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                  aria-pressed={isActive}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isActive ? 'text-emerald-300' : 'text-white'}`}>
                      {title}
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-300 border border-slate-700">
                      {badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-300 mt-1 line-clamp-2">
                    {subtitle}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 3: Voice & Narration */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Volume2 className="w-4 h-4" />
            <span>Voice Audio Narration</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700/80 flex items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold text-white block">Southern Voice Assistant</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Speaks a friendly voice overview of campus hazards and road conditions
              </p>
            </div>
            {isSpeaking ? (
              <button
                onClick={stopSpeaking}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition animate-pulse shrink-0"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop Voice</span>
              </button>
            ) : (
              <button
                onClick={() => speakSummary(potholes)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition shrink-0 active:scale-95"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Play Voice</span>
              </button>
            )}
          </div>
        </div>

        {/* Section 4: Drive Sensor Navigation */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            <span>Vehicle Sensor Setup</span>
          </div>

          <div className="bg-slate-800/40 rounded-2xl p-3.5 border border-slate-700/60 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="text-xs font-bold text-white block">In-Vehicle Drive Sensor</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Optional silent 100 Hz accelerometer detector that clusters bumps and auto-logs after 3 strikes
              </p>
            </div>
            {onNavigateToSensor && (
              <button
                onClick={onNavigateToSensor}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1 transition shadow shrink-0 active:scale-95"
              >
                <span>Open Sensor</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Section 5: Drive History Retention */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Clock className="w-4 h-4" />
            <span>Drive History Retention</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <div>
              <span className="text-xs font-bold text-white block">Auto-Purge Retention Window</span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Automatically purges raw drive tracks and sensor shock telemetry older than your chosen period.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 7, label: '7 Days', desc: 'Minimal history' },
                { value: 30, label: '30 Days', desc: 'Default' },
                { value: -1, label: 'Until I delete', desc: 'Keep all' },
              ].map(opt => {
                const isSelected = retentionDays === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleRetentionChange(opt.value)}
                    className={`py-2 px-2 rounded-xl text-center border transition flex flex-col items-center justify-center gap-0.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-md font-bold'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                  >
                    <span className="text-xs font-bold">{opt.label}</span>
                    <span className="text-[9px] opacity-80">{opt.desc}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
              <span className="font-mono">
                Currently stored: <strong className="text-emerald-400">{driveSessionCount}</strong> {driveSessionCount === 1 ? 'drive session' : 'drive sessions'}
              </span>
              <span className="text-[10px] text-slate-400">Older sessions automatically purged</span>
            </div>
          </div>
        </div>

        {/* Section 6: My Data & Sovereignty */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <Shield className="w-4 h-4" />
            <span>My Data</span>
          </div>

          <div className="bg-slate-800/60 rounded-2xl p-4 border border-slate-700/80 space-y-3">
            <p className="text-[11px] text-slate-300">
              Export your reported road hazards, comments, notifications, and drive sessions, or permanently erase all locally stored data.
            </p>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleDownloadData}
                disabled={isExporting}
                className="flex-1 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 disabled:opacity-60 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isExporting ? 'Exporting...' : 'Download My Data (JSON)'}</span>
              </button>

              {!isConfirmingDelete ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="flex-1 py-2 px-3 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Delete All My Data</span>
                </button>
              ) : (
                <div className="flex-1 flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="flex-1 py-2 px-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-medium border border-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteAllData}
                    className="flex-1 py-2 px-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/40"
                  >
                    Confirm Wipe
                  </button>
                </div>
              )}
            </div>

            {deleteSuccess && (
              <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All local reports, drive history, and cached data have been wiped.</span>
              </div>
            )}
          </div>
        </div>

        {/* Section 7: In-App Privacy Policy */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>Privacy Information</span>
          </div>

          <div className="bg-slate-800/40 rounded-2xl border border-slate-700/60 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsPrivacyExpanded(!isPrivacyExpanded)}
              className="w-full p-3.5 text-left flex items-center justify-between gap-2 hover:bg-slate-800/60 transition cursor-pointer"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <Info className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-white">How SansPotholes Protects Your Privacy</span>
              </div>
              {isPrivacyExpanded ? (
                <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              )}
            </button>

            {isPrivacyExpanded && (
              <div className="p-4 pt-1 border-t border-slate-700/50 space-y-3 text-xs text-slate-300">
                <div>
                  <h5 className="font-bold text-white text-[11px] uppercase tracking-wide text-emerald-400">
                    1. What is collected and why
                  </h5>
                  <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">
                    We collect road hazard coordinates and road names to plot potholes on the map; device accelerometer motion data during active drive sessions to calculate G-force road shocks; and optional photos to help public works verify surface breakdown.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-white text-[11px] uppercase tracking-wide text-emerald-400">
                    2. Stays on this device
                  </h5>
                  <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">
                    SansPotholes runs client-first in your browser. All reported potholes, comments, notifications, and drive sessions remain stored in this device&apos;s local storage. No advertising identifiers, telemetry beacons, or third-party ad networks are used.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-white text-[11px] uppercase tracking-wide text-emerald-400">
                    3. Outside services receiving coordinates
                  </h5>
                  <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">
                    To display the map and convert GPS points into street names, the app contacts OpenStreetMap tile mirrors for map graphics and Photon (Komoot) or Nominatim for reverse geocoding. Only coordinate pairs are transmitted—never your name, email, or device ID.
                  </p>
                </div>

                <div>
                  <h5 className="font-bold text-white text-[11px] uppercase tracking-wide text-emerald-400">
                    4. Complete user control and deletion
                  </h5>
                  <p className="mt-0.5 text-slate-300 leading-relaxed text-[11px]">
                    You have permanent control over your data. You can download a complete JSON backup or immediately erase all local data using the buttons in the &quot;My Data&quot; section above.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Cancel and Done */}
        <div className="pt-3 flex items-center justify-between border-t border-slate-800">
          <div className="text-[11px]">
            {hasUnsavedChanges ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                Visualizing preview (not applied)
              </span>
            ) : (
              <span className="text-slate-400">Settings up to date</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCancel}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-semibold rounded-xl text-xs border border-slate-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDone}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
