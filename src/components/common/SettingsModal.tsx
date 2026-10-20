import React from 'react';
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
  Sparkles
} from 'lucide-react';
import { useAccessibility, FontSizeKey, FontFamilyKey, ThemeKey } from '../../context/AccessibilityContext';
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
            onClick={onClose}
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
              const isActive = fontSize === key;
              return (
                <button
                  key={key}
                  onClick={() => setFontSize(key)}
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
              onClick={() => setFontFamily(fontFamily === 'comic-sans' ? 'sans' : 'comic-sans')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 border ${
                fontFamily === 'comic-sans'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/60'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
              }`}
            >
              {fontFamily === 'comic-sans' ? 'Active (Default)' : 'Standard Sans'}
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
              const isActive = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => setTheme(key)}
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

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs border border-slate-700 transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
