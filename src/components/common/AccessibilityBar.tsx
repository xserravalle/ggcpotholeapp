import React, { useState } from 'react';
import { useAccessibility, FontSizeKey, FontFamilyKey, ThemeKey } from '../../context/AccessibilityContext';
import { PotholeReport } from '../../types/pothole';
import { 
  Volume2, 
  Square, 
  Palette, 
  Eye, 
  Type, 
  ChevronDown, 
  ChevronUp, 
  Sparkles,
  SunMoon
} from 'lucide-react';

interface AccessibilityBarProps {
  potholes: PotholeReport[];
}

export const AccessibilityBar: React.FC<AccessibilityBarProps> = ({ potholes }) => {
  const {
    fontSize,
    setFontSize,
    fontFamily,
    setFontFamily,
    theme,
    setTheme,
    cycleTheme,
    isSpeaking,
    speakSummary,
    stopSpeaking
  } = useAccessibility();

  const [isExpanded, setIsExpanded] = useState(false);

  const themeLabels: Record<ThemeKey, string> = {
    colorblind: 'Colorblind-Safe',
    'high-contrast': 'High Contrast',
    standard: 'Standard (GGC)',
    dark: 'Dark Modern'
  };

  return (
    <div className="bg-slate-900/90 border-b border-slate-800 text-xs text-slate-300 px-4 sm:px-6 py-2 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5">
        
        {/* Left: Quick Accessibility Pills */}
        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-y-1.5">
          {/* Label */}
          <span className="text-[11px] font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Accessibility & Voice</span>
          </span>

          {/* Font Size Stepper */}
          <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700/80">
            {(['small', 'normal', 'large', 'huge'] as FontSizeKey[]).map((sizeKey, idx) => {
              const labels = ['A−', 'A', 'A+', 'A++'];
              const isActive = fontSize === sizeKey;
              return (
                <button
                  key={sizeKey}
                  onClick={() => setFontSize(sizeKey)}
                  aria-pressed={isActive}
                  title={`Font Size: ${sizeKey}`}
                  className={`px-2 py-0.5 rounded text-xs font-bold transition ${
                    isActive 
                      ? 'bg-teal-600 text-white shadow' 
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {labels[idx]}
                </button>
              );
            })}
          </div>

          {/* Comic Sans / Dyslexia Font Toggle */}
          <button
            onClick={() => setFontFamily(fontFamily === 'comic-sans' ? 'sans' : 'comic-sans')}
            aria-pressed={fontFamily === 'comic-sans'}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 ${
              fontFamily === 'comic-sans'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="Toggle Comic Sans MS for dyslexia and reading ease"
          >
            <Type className="w-3.5 h-3.5" />
            <span>{fontFamily === 'comic-sans' ? 'Comic Sans (Default)' : 'Standard Sans'}</span>
          </button>

          {/* Colorblind & High-Contrast Theme Button */}
          <button
            onClick={cycleTheme}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
              theme === 'colorblind'
                ? 'bg-sky-500/30 text-sky-200 border-sky-400'
                : theme === 'high-contrast'
                ? 'bg-yellow-400 text-black border-yellow-200 font-extrabold'
                : theme === 'standard'
                ? 'bg-emerald-800 text-emerald-100 border-emerald-400'
                : 'bg-slate-800 text-slate-200 border-slate-600 hover:text-white'
            }`}
            title="Cycle between Colorblind-Safe (Okabe-Ito), High Contrast, Standard GGC, and Dark modes"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme: {themeLabels[theme]}</span>
          </button>
        </div>

        {/* Right: Text-to-Speech Southern Voice Narrator */}
        <div className="flex items-center space-x-2">
          {isSpeaking ? (
            <button
              onClick={stopSpeaking}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 shadow-md shadow-rose-900/30 transition animate-pulse"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Stop Audio</span>
            </button>
          ) : (
            <button
              onClick={() => speakSummary(potholes)}
              className="px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-teal-500/20 transition active:scale-95"
              title="Listen to campus hazard overview in friendly Southern cadence"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>🔊 Read Overview (Southern Voice)</span>
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
