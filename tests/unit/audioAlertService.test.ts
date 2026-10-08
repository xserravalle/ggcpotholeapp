import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  buildHazardAlertMessage, 
  formatSpeechDistance, 
  playHazardWarning, 
  cancelHazardWarning,
  isSpeechSynthesisSupported 
} from '../../src/services/audioAlertService';

describe('audioAlertService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('message formatting', () => {
    it('rounds speech distance correctly', () => {
      expect(formatSpeechDistance(40)).toBe(50);
      expect(formatSpeechDistance(95)).toBe(100);
      expect(formatSpeechDistance(184)).toBe(180);
      expect(formatSpeechDistance(210)).toBe(210);
      expect(formatSpeechDistance(478)).toBe(500);
    });

    it('generates the standard alert phrase under 3 seconds', () => {
      const msg = buildHazardAlertMessage(210);
      expect(msg).toBe('Hazard ahead. Pothole reported 210 feet.');
      expect(msg.split(' ').length).toBeLessThan(10);
    });
  });

  describe('playHazardWarning', () => {
    it('does not play audio when muted option is true', () => {
      const speakSpy = vi.fn();
      vi.stubGlobal('speechSynthesis', { speak: speakSpy, cancel: vi.fn() });
      vi.stubGlobal('SpeechSynthesisUtterance', class {});

      const result = playHazardWarning(200, { muted: true });
      expect(result).toBe(false);
      expect(speakSpy).not.toHaveBeenCalled();
    });

    it('triggers speech synthesis when unmuted and supported', () => {
      const speakSpy = vi.fn();
      const cancelSpy = vi.fn();
      let createdUtterance: any = null;

      class MockUtterance {
        text: string;
        rate: number = 1;
        volume: number = 1;
        constructor(text: string) {
          this.text = text;
          createdUtterance = this;
        }
      }

      vi.stubGlobal('speechSynthesis', { speak: speakSpy, cancel: cancelSpy });
      vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);

      const result = playHazardWarning(200, { muted: false });
      expect(result).toBe(true);
      expect(cancelSpy).toHaveBeenCalledTimes(1);
      expect(speakSpy).toHaveBeenCalledTimes(1);
      expect(createdUtterance?.text).toBe('Hazard ahead. Pothole reported 200 feet.');
      expect(createdUtterance?.rate).toBeGreaterThanOrEqual(1.1);
      expect(createdUtterance?.volume).toBe(1.0);
    });

    it('gracefully handles unsupported environments without throwing', () => {
      vi.stubGlobal('speechSynthesis', undefined);
      expect(playHazardWarning(200)).toBe(false);
    });
  });

  describe('cancelHazardWarning', () => {
    it('calls speechSynthesis.cancel if supported', () => {
      const cancelSpy = vi.fn();
      vi.stubGlobal('speechSynthesis', { cancel: cancelSpy });
      vi.stubGlobal('SpeechSynthesisUtterance', class {});

      cancelHazardWarning();
      expect(cancelSpy).toHaveBeenCalledTimes(1);
    });
  });
});
