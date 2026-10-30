import { describe, it, expect } from 'vitest';
import { 
  milesBetween, 
  calculateBearing, 
  isHazardAhead, 
  HAZARD_WARNING_DISTANCE_MILES, 
  HAZARD_WARNING_DISTANCE_FEET 
} from '../../src/services/distanceCalculator';

describe('distanceCalculator & bearing', () => {
  it('calculates 0.1 miles as 528 feet', () => {
    expect(HAZARD_WARNING_DISTANCE_MILES).toBe(0.1);
    expect(HAZARD_WARNING_DISTANCE_FEET).toBe(528);
  });

  it('calculates approximate miles between two GPS points using Haversine', () => {
    // 1 deg latitude is roughly 69 miles
    const p1 = { lat: 33.98, lng: -84.00 };
    const p2 = { lat: 33.99, lng: -84.00 };
    const dist = milesBetween(p1, p2);
    expect(dist).toBeGreaterThan(0.6);
    expect(dist).toBeLessThan(0.8);
  });

  describe('calculateBearing', () => {
    it('calculates North heading (0 degrees)', () => {
      const p1 = { lat: 33.0, lng: -84.0 };
      const p2 = { lat: 34.0, lng: -84.0 };
      const bearing = calculateBearing(p1, p2);
      expect(Math.round(bearing)).toBe(0);
    });

    it('calculates East heading (90 degrees)', () => {
      const p1 = { lat: 33.0, lng: -84.0 };
      const p2 = { lat: 33.0, lng: -83.0 };
      const bearing = calculateBearing(p1, p2);
      expect(Math.round(bearing)).toBe(90);
    });

    it('calculates South heading (180 degrees)', () => {
      const p1 = { lat: 34.0, lng: -84.0 };
      const p2 = { lat: 33.0, lng: -84.0 };
      const bearing = calculateBearing(p1, p2);
      expect(Math.round(bearing)).toBe(180);
    });
  });

  describe('isHazardAhead', () => {
    const current = { lat: 33.0, lng: -84.0 };
    const northHazard = { lat: 33.001, lng: -84.0 }; // Due North

    it('returns true when vehicle is heading North towards North hazard', () => {
      expect(isHazardAhead(0, current, northHazard)).toBe(true);
      expect(isHazardAhead(350, current, northHazard)).toBe(true); // Within cone
      expect(isHazardAhead(15, current, northHazard)).toBe(true);  // Within cone
    });

    it('returns false when vehicle is heading South away from North hazard', () => {
      expect(isHazardAhead(180, current, northHazard)).toBe(false);
    });

    it('returns true when heading is unavailable (null, undefined, or NaN)', () => {
      expect(isHazardAhead(null, current, northHazard)).toBe(true);
      expect(isHazardAhead(undefined, current, northHazard)).toBe(true);
      expect(isHazardAhead(NaN, current, northHazard)).toBe(true);
    });
  });
});
