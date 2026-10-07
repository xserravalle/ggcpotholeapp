import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  processImpact,
  validateImpactInput,
  DEFAULT_RADIUS_FEET,
  DEFAULT_G_FORCE_THRESHOLD,
  ImpactInput,
} from '@/services/potholeAutoReportService';
import { TrackedHazardSpot } from '@/types/sensorQueue';

describe('Pothole Auto-Report Service (3-Hit Confirmation)', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('Normal Scenarios', () => {
    it('3 impacts above threshold at the same spot -> 1 report filed, reviewable in My Reports', () => {
      let spots: TrackedHazardSpot[] = [];
      const location = {
        latitude: 33.9821,
        longitude: -84.0048,
        roadName: 'Collins Hill Rd',
        gForce: 3.5,
      };

      // 1st impact
      const res1 = processImpact(location, spots);
      expect(res1.accepted).toBe(true);
      expect(res1.spot?.hitCount).toBe(1);
      expect(res1.reportCreated).toBeNull();
      spots = res1.updatedSpots;

      // 2nd impact
      const res2 = processImpact(location, spots);
      expect(res2.accepted).toBe(true);
      expect(res2.spot?.hitCount).toBe(2);
      expect(res2.reportCreated).toBeNull();
      spots = res2.updatedSpots;

      // 3rd impact -> Auto-files 1 report
      const res3 = processImpact(location, spots);
      expect(res3.accepted).toBe(true);
      expect(res3.spot?.hitCount).toBe(3);
      expect(res3.reportCreated).not.toBeNull();
      expect(res3.reportCreated?.roadName).toBe('Collins Hill Rd');
      expect(res3.reportCreated?.status).toBe('reported');
      expect(res3.reportCreated?.source).toBe('sensor');
      expect(res3.reportCreated?.sensorDetected).toBe(true);
      expect(res3.reportCreated?.sensorEvidence?.hitCount).toBe(3);
    });

    it('2 impacts at the same spot -> Logged, no report', () => {
      let spots: TrackedHazardSpot[] = [];
      const location = {
        latitude: 33.9821,
        longitude: -84.0048,
        roadName: 'University Center Ln',
        gForce: 3.2,
      };

      const res1 = processImpact(location, spots);
      spots = res1.updatedSpots;
      const res2 = processImpact(location, spots);

      expect(res2.accepted).toBe(true);
      expect(res2.spot?.hitCount).toBe(2);
      expect(res2.reportCreated).toBeNull();
    });

    it('3 impacts at 3 distinct locations -> Logged, no report', () => {
      let spots: TrackedHazardSpot[] = [];

      const loc1 = { latitude: 33.9821, longitude: -84.0048, roadName: 'Spot 1', gForce: 3.5 };
      const loc2 = { latitude: 33.9921, longitude: -84.0148, roadName: 'Spot 2', gForce: 3.5 }; // ~1 mile away
      const loc3 = { latitude: 33.9721, longitude: -83.9948, roadName: 'Spot 3', gForce: 3.5 }; // ~1 mile away

      const res1 = processImpact(loc1, spots);
      spots = res1.updatedSpots;

      const res2 = processImpact(loc2, spots);
      spots = res2.updatedSpots;

      const res3 = processImpact(loc3, spots);
      spots = res3.updatedSpots;

      expect(spots.length).toBe(3);
      expect(spots.map((s) => s.hitCount)).toEqual([1, 1, 1]);
      expect(res1.reportCreated).toBeNull();
      expect(res2.reportCreated).toBeNull();
      expect(res3.reportCreated).toBeNull();
    });
  });

  describe('Edge Scenarios', () => {
    it('Boundary: hits around the "same spot" radius edge (50 ft radius)', () => {
      let spots: TrackedHazardSpot[] = [];
      // 1 degree latitude ≈ 364,000 ft.
      // 40 feet in lat delta ≈ 40 / 364000 = 0.00010989 deg
      // 60 feet in lat delta ≈ 60 / 364000 = 0.00016483 deg

      const center = { latitude: 33.9821, longitude: -84.0048, gForce: 3.5 };
      const inside40ft = { latitude: 33.9821 + 0.00010989, longitude: -84.0048, gForce: 3.5 };
      const outside60ft = { latitude: 33.9821 + 0.00016483, longitude: -84.0048, gForce: 3.5 };

      // 1st hit at center
      const res1 = processImpact(center, spots, { radiusFeet: 50 });
      spots = res1.updatedSpots;
      expect(spots.length).toBe(1);

      // 2nd hit inside 50 ft (~40 ft away) -> Should cluster into same spot
      const res2 = processImpact(inside40ft, spots, { radiusFeet: 50 });
      spots = res2.updatedSpots;
      expect(spots.length).toBe(1);
      expect(res2.spot?.hitCount).toBe(2);

      // 3rd hit outside 50 ft (~60 ft away) -> Should create a separate spot
      const res3 = processImpact(outside60ft, spots, { radiusFeet: 50 });
      spots = res3.updatedSpots;
      expect(spots.length).toBe(2);
      expect(res3.spot?.hitCount).toBe(1);
    });

    it('4+ hits at an already-reported spot -> No duplicate report', () => {
      let spots: TrackedHazardSpot[] = [];
      const location = { latitude: 33.9821, longitude: -84.0048, gForce: 3.5 };

      // Hits 1, 2, 3
      spots = processImpact(location, spots).updatedSpots;
      spots = processImpact(location, spots).updatedSpots;
      const res3 = processImpact(location, spots);
      spots = res3.updatedSpots;

      expect(res3.reportCreated).not.toBeNull();
      const initialReportId = res3.reportCreated?.id;

      // 4th hit
      const res4 = processImpact(location, spots);
      spots = res4.updatedSpots;
      expect(res4.spot?.hitCount).toBe(4);
      expect(res4.reportCreated).toBeNull(); // No duplicate report!

      // 5th hit
      const res5 = processImpact(location, spots);
      expect(res5.spot?.hitCount).toBe(5);
      expect(res5.reportCreated).toBeNull(); // No duplicate report!
      expect(res5.spot?.promotedToReportId).toBe(initialReportId);
    });

    it('Impact just below / at 1.7G setting -> Counts only at or above 1.7G', () => {
      let spots: TrackedHazardSpot[] = [];
      const locationBelow = { latitude: 33.9821, longitude: -84.0048, gForce: 1.69 };
      const locationAt = { latitude: 33.9821, longitude: -84.0048, gForce: 1.70 };

      // Just below 1.7G
      const resBelow = processImpact(locationBelow, spots, { thresholdG: 1.7 });
      expect(resBelow.accepted).toBe(false);
      expect(resBelow.updatedSpots.length).toBe(0);

      // At 1.7G
      const resAt = processImpact(locationAt, spots, { thresholdG: 1.7 });
      expect(resAt.accepted).toBe(true);
      expect(resAt.updatedSpots.length).toBe(1);
      expect(resAt.spot?.hitCount).toBe(1);
    });

    it('Impact just below / at 2.3G setting -> Counts only at or above 2.3G', () => {
      let spots: TrackedHazardSpot[] = [];
      const locationBelow = { latitude: 33.9821, longitude: -84.0048, gForce: 2.29 };
      const locationAt = { latitude: 33.9821, longitude: -84.0048, gForce: 2.30 };

      // Just below 2.3G
      const resBelow = processImpact(locationBelow, spots, { thresholdG: 2.3 });
      expect(resBelow.accepted).toBe(false);
      expect(resBelow.updatedSpots.length).toBe(0);

      // At 2.3G
      const resAt = processImpact(locationAt, spots, { thresholdG: 2.3 });
      expect(resAt.accepted).toBe(true);
      expect(resAt.updatedSpots.length).toBe(1);
      expect(resAt.spot?.hitCount).toBe(1);
    });

    it('Impact just below / at 3.2G setting -> Counts only at or above 3.2G', () => {
      let spots: TrackedHazardSpot[] = [];
      const locationBelow = { latitude: 33.9821, longitude: -84.0048, gForce: 3.19 };
      const locationAt = { latitude: 33.9821, longitude: -84.0048, gForce: 3.20 };

      // Just below 3.2G
      const resBelow = processImpact(locationBelow, spots, { thresholdG: 3.2 });
      expect(resBelow.accepted).toBe(false);
      expect(resBelow.updatedSpots.length).toBe(0);

      // At 3.2G
      const resAt = processImpact(locationAt, spots, { thresholdG: 3.2 });
      expect(resAt.accepted).toBe(true);
      expect(resAt.updatedSpots.length).toBe(1);
      expect(resAt.spot?.hitCount).toBe(1);
    });
  });

  describe('Invalid Inputs', () => {
    it('Missing or NaN GPS -> Ignored, error logged, no crash, no pothole report', () => {
      const spots: TrackedHazardSpot[] = [];

      // Missing latitude
      const res1 = processImpact({ latitude: null as any, longitude: -84.0048, gForce: 3.5 }, spots);
      expect(res1.accepted).toBe(false);
      expect(res1.reportCreated).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // NaN longitude
      const res2 = processImpact({ latitude: 33.9821, longitude: NaN, gForce: 3.5 }, spots);
      expect(res2.accepted).toBe(false);
      expect(res2.reportCreated).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Latitude out of range
      const res3 = processImpact({ latitude: 120, longitude: -84.0048, gForce: 3.5 }, spots);
      expect(res3.accepted).toBe(false);
      expect(res3.reportCreated).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('Null or NaN G-force -> Ignored, error logged, no crash, no pothole report', () => {
      const spots: TrackedHazardSpot[] = [];

      // Null G-force
      const res1 = processImpact({ latitude: 33.9821, longitude: -84.0048, gForce: null as any }, spots);
      expect(res1.accepted).toBe(false);
      expect(res1.reportCreated).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();

      // NaN G-force
      const res2 = processImpact({ latitude: 33.9821, longitude: -84.0048, gForce: NaN }, spots);
      expect(res2.accepted).toBe(false);
      expect(res2.reportCreated).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('Bad timestamp -> Ignored, error logged, no crash, no pothole report', () => {
      const spots: TrackedHazardSpot[] = [];

      const res = processImpact(
        { latitude: 33.9821, longitude: -84.0048, gForce: 3.5, timestamp: 'invalid-date-xyz' },
        spots
      );
      expect(res.accepted).toBe(false);
      expect(res.reportCreated).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });

    it('validateImpactInput returns specific error messages for invalid inputs', () => {
      expect(validateImpactInput(null as any)).toBe('Impact input object is missing or null');
      expect(validateImpactInput({ latitude: NaN, longitude: 0, gForce: 3.0 })).toBe('Invalid or missing latitude');
      expect(validateImpactInput({ latitude: 0, longitude: NaN, gForce: 3.0 })).toBe('Invalid or missing longitude');
      expect(validateImpactInput({ latitude: 0, longitude: 0, gForce: NaN })).toBe('Invalid or missing G-force');
      expect(validateImpactInput({ latitude: 0, longitude: 0, gForce: 3.0, timestamp: 'bad' })).toBe('Invalid timestamp provided');
    });
  });
});
