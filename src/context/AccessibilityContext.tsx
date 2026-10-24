import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { PotholeReport } from '../types/pothole';

export type FontSizeKey = 'small' | 'normal' | 'large' | 'huge';
export type FontFamilyKey = 'sans' | 'comic-sans';
export type ThemeKey = 'colorblind' | 'high-contrast' | 'standard' | 'dark';

interface AccessibilityContextType {
  fontSize: FontSizeKey;
  setFontSize: (size: FontSizeKey) => void;
  fontFamily: FontFamilyKey;
  setFontFamily: (font: FontFamilyKey) => void;
  theme: ThemeKey;
  setTheme: (theme: ThemeKey) => void;
  cycleTheme: () => void;
  // Text to Speech
  isSpeaking: boolean;
  speakText: (text: string, onComplete?: () => void) => void;
  stopSpeaking: () => void;
  speakSummary: (potholes: PotholeReport[]) => void;
  speakPothole: (pothole: PotholeReport) => void;
}

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const FONT_SIZES: Record<FontSizeKey, string> = {
  small: '14px',
  normal: '16px',
  large: '20px',
  huge: '24px'
};

const THEMES: { id: ThemeKey; label: string }[] = [
  { id: 'colorblind', label: 'Colorblind-Safe' },
  { id: 'high-contrast', label: 'High Contrast' },
  { id: 'standard', label: 'Standard GGC' },
  { id: 'dark', label: 'Dark Modern' }
];

export const AccessibilityProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State initialization with localStorage
  const [fontSize, setFontSizeState] = useState<FontSizeKey>(() => {
    return (localStorage.getItem('ggc-a11y-font-size') as FontSizeKey) || 'normal';
  });

  const [fontFamily, setFontFamilyState] = useState<FontFamilyKey>(() => {
    return (localStorage.getItem('ggc-a11y-font-family') as FontFamilyKey) || 'comic-sans';
  });

  const [theme, setThemeState] = useState<ThemeKey>(() => {
    return (localStorage.getItem('ggc-a11y-theme') as ThemeKey) || 'colorblind';
  });

  const [isSpeaking, setIsSpeaking] = useState(false);

  // Apply font size
  const setFontSize = (size: FontSizeKey) => {
    setFontSizeState(size);
    localStorage.setItem('ggc-a11y-font-size', size);
    document.documentElement.style.fontSize = FONT_SIZES[size];
    document.documentElement.style.setProperty('--app-font-size', FONT_SIZES[size]);
  };

  // Apply font family
  const setFontFamily = (font: FontFamilyKey) => {
    setFontFamilyState(font);
    localStorage.setItem('ggc-a11y-font-family', font);
    document.documentElement.setAttribute('data-font', font);
    document.body.setAttribute('data-font', font);
  };

  // Apply theme
  const setTheme = (newTheme: ThemeKey) => {
    setThemeState(newTheme);
    localStorage.setItem('ggc-a11y-theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    document.body.setAttribute('data-theme', newTheme);
  };

  const cycleTheme = () => {
    const currentIndex = THEMES.findIndex(t => t.id === theme);
    const nextTheme = THEMES[(currentIndex + 1) % THEMES.length];
    setTheme(nextTheme.id);
  };

  // Initialize attributes on mount
  useEffect(() => {
    document.documentElement.style.fontSize = FONT_SIZES[fontSize];
    document.documentElement.style.setProperty('--app-font-size', FONT_SIZES[fontSize]);
    document.documentElement.setAttribute('data-font', fontFamily);
    document.body.setAttribute('data-font', fontFamily);
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, []);

  // Text to speech helpers
  const isSpeechSupported = () => 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;

  const stopSpeaking = () => {
    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakText = (text: string, onComplete?: () => void) => {
    if (!isSpeechSupported()) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    stopSpeaking();

    // Friendly Southern sign-off
    let southernText = text.trim();
    if (!southernText.toLowerCase().endsWith("y'all!") && !southernText.toLowerCase().endsWith("y'all.")) {
      southernText += " ... y'all!";
    }

    const utterance = new SpeechSynthesisUtterance(southernText);
    // Relaxed Southern drawl cadence
    utterance.rate = 0.84;
    utterance.pitch = 0.95;
    utterance.lang = 'en-US';

    const voices = window.speechSynthesis.getVoices();
    const usVoice = voices.find(
      v => (v.lang === 'en-US' || v.lang === 'en_US') && !v.name.includes('Google')
    ) || voices.find(v => v.lang.startsWith('en'));

    if (usVoice) {
      utterance.voice = usVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => {
      setIsSpeaking(false);
      if (onComplete) onComplete();
    };
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const speakSummary = (potholes: PotholeReport[]) => {
    const nearCampus = potholes.filter(p => (p.distanceFromGgcMiles ?? 999) <= 1.5);
    const severeCount = nearCampus.filter(p => p.severity === 'critical' || p.severity === 'severe').length;
    const modCount = nearCampus.filter(p => p.severity === 'moderate').length;

    let speech = `Well howdy y'all! GGC SansPotholes checkin' in. We're monitorin' road conditions within campus and Gwinnett corridors. `;
    speech += `There are currently ${nearCampus.length} hazards on record near campus: `;
    speech += `${severeCount} high severity axle risks, and ${modCount} moderate bumps. `;

    if (severeCount > 0) {
      const topSevere = nearCampus.find(p => p.severity === 'critical' || p.severity === 'severe');
      if (topSevere) {
        speech += `Heads up! Keep an eye out around ${topSevere.roadName || topSevere.title}. `;
      }
    }
    speech += `Drive safe out there`;

    speakText(speech);
  };

  const speakPothole = (p: PotholeReport) => {
    const loc = p.roadName || p.title;
    const dist = p.distanceFromGgcMiles ? `${p.distanceFromGgcMiles.toFixed(1)} miles from campus` : p.city;
    const confirms = `${p.verificationsCount} driver confirmations`;
    const speech = `Road hazard report: ${loc}. Severity: ${p.severity}. Distance: ${dist}. ${confirms}. Notes: ${p.description || 'Pavement damage reported.'}`;
    speakText(speech);
  };

  return (
    <AccessibilityContext.Provider
      value={{
        fontSize,
        setFontSize,
        fontFamily,
        setFontFamily,
        theme,
        setTheme,
        cycleTheme,
        isSpeaking,
        speakText,
        stopSpeaking,
        speakSummary,
        speakPothole
      }}
    >
      {children}
    </AccessibilityContext.Provider>
  );
};

const DEFAULT_A11Y_STATE: AccessibilityContextType = {
  fontSize: 'normal',
  fontFamily: 'comic-sans',
  theme: 'colorblind',
  isSpeaking: false,
  setFontSize: () => {},
  setFontFamily: () => {},
  setTheme: () => {},
  cycleTheme: () => {},
  speakText: () => {},
  stopSpeaking: () => {},
  speakSummary: () => {},
  speakPothole: () => {}
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  return context || DEFAULT_A11Y_STATE;
};
