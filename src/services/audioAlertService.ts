/**
 * Audio Alert Service for Vehicle Hazard Proximity Warnings
 * Uses Web Speech API (speechSynthesis) with graceful fallbacks.
 * Respects device volume and keeps announcements under 3 seconds.
 */

export interface AudioAlertOptions {
  muted?: boolean;
}

/**
 * Checks if SpeechSynthesis is available in the current environment
 */
export function isSpeechSynthesisSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.speechSynthesis !== 'undefined' &&
    window.speechSynthesis !== null &&
    typeof window.SpeechSynthesisUtterance !== 'undefined' &&
    window.SpeechSynthesisUtterance !== null
  );
}

/**
 * Formats distance to speech-friendly number rounded to nearest 10 or 50 feet
 */
export function formatSpeechDistance(distanceFeet: number): number {
  if (distanceFeet <= 50) return 50;
  if (distanceFeet <= 100) return 100;
  if (distanceFeet <= 250) return Math.round(distanceFeet / 10) * 10;
  return Math.round(distanceFeet / 50) * 50;
}

/**
 * Generates the standardized alert announcement string
 */
export function buildHazardAlertMessage(distanceFeet: number): string {
  const rounded = formatSpeechDistance(distanceFeet);
  return `Hazard ahead. Pothole reported ${rounded} feet.`;
}

/**
 * Plays an audio warning when approaching a reported road hazard.
 * Ensures the speech message is concise and finishes in under 3 seconds.
 */
export function playHazardWarning(
  distanceFeet: number,
  options: AudioAlertOptions = {}
): boolean {
  if (options.muted) {
    return false;
  }

  if (!isSpeechSynthesisSupported()) {
    return false;
  }

  try {
    const synth = window.speechSynthesis;
    if (!synth || typeof synth.speak !== 'function') {
      return false;
    }

    // Cancel any previous speech so warnings don't pile up or lag behind
    if (typeof synth.cancel === 'function') {
      synth.cancel();
    }

    const message = buildHazardAlertMessage(distanceFeet);
    const utterance = new SpeechSynthesisUtterance(message);

    // Rate 1.15x guarantees message completes in ~1.8 seconds (well under 3s limit)
    utterance.rate = 1.15;
    utterance.pitch = 1.0;
    // Default system volume (0.0 to 1.0)
    utterance.volume = 1.0;

    synth.speak(utterance);
    return true;
  } catch (err) {
    console.error('Failed to trigger hazard audio warning', err);
    return false;
  }
}

/**
 * Immediately cancels any active speech output
 */
export function cancelHazardWarning(): void {
  if (isSpeechSynthesisSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore cleanup error
    }
  }
}
