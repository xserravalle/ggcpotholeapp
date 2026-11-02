import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  isPaused: boolean;
  speakingPotholeId: string | null;
  speakText: (text: string, onComplete?: () => void) => void;
  stopSpeaking: () => void;
  speakSummary: (potholes: PotholeReport[]) => void;
  speakPothole: (pothole: PotholeReport) => void;
  toggleSpeakPothole: (pothole: PotholeReport) => void;
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
  const [isPaused, setIsPaused] = useState(false);
  const [speakingPotholeId, setSpeakingPotholeId] = useState<string | null>(null);
  const lastCharIndexRef = useRef<number>(0);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const currentSpeechTextRef = useRef<string>('');

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
    setIsPaused(false);
    setSpeakingPotholeId(null);
    lastCharIndexRef.current = 0;
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

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onpause = () => {
      setIsSpeaking(false);
      setIsPaused(true);
    };
    utterance.onresume = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingPotholeId(null);
      lastCharIndexRef.current = 0;
      if (onComplete) onComplete();
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingPotholeId(null);
      lastCharIndexRef.current = 0;
    };

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

  const buildPotholeSpeech = (p: PotholeReport) => {
    const loc = p.roadName || p.title;
    const dist = p.distanceFromGgcMiles ? `${p.distanceFromGgcMiles.toFixed(1)} miles from campus` : p.city;
    const confirms = `${p.verificationsCount} driver confirmations`;
    let speech = `Road hazard report: ${loc}. Severity: ${p.severity}. Distance: ${dist}. ${confirms}. Notes: ${p.description || 'Pavement damage reported.'}`;
    if (!speech.endsWith("y'all!") && !speech.endsWith("y'all.")) {
      speech += " ... y'all!";
    }
    return speech;
  };

  const startSpeakingPothole = (p: PotholeReport, startOffset = 0) => {
    if (!isSpeechSupported()) {
      alert('Text-to-speech is not supported on this browser.');
      return;
    }

    if (isSpeechSupported()) {
      window.speechSynthesis.cancel();
    }

    const fullText = buildPotholeSpeech(p);
    currentSpeechTextRef.current = fullText;
    const textToSpeak = startOffset > 0 ? fullText.slice(startOffset) : fullText;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
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

    utterance.onboundary = (e) => {
      if (typeof e.charIndex === 'number') {
        lastCharIndexRef.current = startOffset + e.charIndex;
      }
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
      setSpeakingPotholeId(p.id);
    };

    utterance.onpause = () => {
      setIsSpeaking(false);
      setIsPaused(true);
    };

    utterance.onresume = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingPotholeId(null);
      lastCharIndexRef.current = 0;
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
      setSpeakingPotholeId(null);
      lastCharIndexRef.current = 0;
    };

    currentUtteranceRef.current = utterance;
    setSpeakingPotholeId(p.id);
    setIsSpeaking(true);
    setIsPaused(false);
    window.speechSynthesis.speak(utterance);
  };

  const speakPothole = (p: PotholeReport) => {
    startSpeakingPothole(p, 0);
  };

  // Toggle audio speech: pause when clicked again, and resume from where it stopped when clicked again
  const toggleSpeakPothole = (p: PotholeReport) => {
    if (speakingPotholeId === p.id) {
      if (isSpeaking) {
        // Audio is currently playing -> stop / pause audio
        if (isSpeechSupported()) {
          window.speechSynthesis.pause();
        }
        setIsSpeaking(false);
        setIsPaused(true);
      } else if (isPaused) {
        // Audio was paused -> resume right from where it stopped
        if (isSpeechSupported() && window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
          setIsSpeaking(true);
          setIsPaused(false);
        } else {
          // Fallback if browser reset paused utterance: resume text slice from last character index
          const resumeOffset = lastCharIndexRef.current || 0;
          startSpeakingPothole(p, resumeOffset);
        }
      } else {
        startSpeakingPothole(p, 0);
      }
    } else {
      // New pothole selected -> stop any previous audio and start fresh
      stopSpeaking();
      startSpeakingPothole(p, 0);
    }
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
        isPaused,
        speakingPotholeId,
        speakText,
        stopSpeaking,
        speakSummary,
        speakPothole,
        toggleSpeakPothole
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
  isPaused: false,
  speakingPotholeId: null,
  setFontSize: () => {},
  setFontFamily: () => {},
  setTheme: () => {},
  cycleTheme: () => {},
  speakText: () => {},
  stopSpeaking: () => {},
  speakSummary: () => {},
  speakPothole: () => {},
  toggleSpeakPothole: () => {}
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  return context || DEFAULT_A11Y_STATE;
};
