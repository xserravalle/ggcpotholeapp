import { describe, it, expect } from 'vitest';
import { migrateReport, migrateReports } from '@/services/storageService';
import { INITIAL_POTHOLES } from '@/data/potholesData';

describe('services/storageService: Report Migration and Idempotency', () => {
  it('correctly maps legacy statuses to new domain statuses', () => {
    const legacyInvestigating = {
      id: 'leg-1',
      title: 'Legacy Investigating',
      status: 'investigating',
      severity: 'severe',
      roadName: 'Scenic Hwy',
    };
    const legacyScheduled = {
      id: 'leg-2',
      title: 'Legacy Scheduled',
      status: 'scheduled',
      severity: 'moderate',
      roadName: 'Buford Hwy',
    };
    const legacyRepaired = {
      id: 'leg-3',
      title: 'Legacy Repaired',
      status: 'repaired',
      severity: 'minor',
      roadName: 'Crogan St',
    };

    const mig1 = migrateReport(legacyInvestigating);
    const mig2 = migrateReport(legacyScheduled);
    const mig3 = migrateReport(legacyRepaired);

    expect(mig1.status).toBe('verified');
    expect(mig2.status).toBe('assigned');
    expect(mig3.status).toBe('resolved');
  });

  it('computes priority score, suggested priority, and initial timeline', () => {
    const raw = {
      id: 'pothole-999',
      title: 'Discovered Pothole',
      address: '1000 University Center Ln',
      roadName: 'Collins Hill Rd @ GGC',
      severity: 'critical', // 45
      verificationsCount: 4, // 20
      bumpIntensity: 7.2, // 20 (>=6.0G)
      status: 'reported',
      reportedAt: '2026-09-01T12:00:00Z',
    };

    const migrated = migrateReport(raw);

    // 45 + 20 + 20 + 5 (GGC campus) = 90
    expect(migrated.priorityScore).toBe(90);
    expect(migrated.priority).toBe('critical');

    // Starting timeline entry added
    expect(migrated.timeline.length).toBe(1);
    expect(migrated.timeline[0].status).toBe('reported');
    expect(migrated.timeline[0].action).toBe('REPORT_CREATED');
  });

  it('is completely idempotent: running twice on the same report produces identical results', () => {
    const raw = {
      id: 'idempotent-test-01',
      title: 'Test Idempotency',
      status: 'scheduled',
      severity: 'moderate',
      roadName: 'Highway 316',
      reportedAt: '2026-09-05T08:00:00Z',
    };

    const firstRun = migrateReport(raw);
    const secondRun = migrateReport(firstRun);
    const thirdRun = migrateReport(secondRun);

    expect(secondRun).toEqual(firstRun);
    expect(thirdRun).toEqual(firstRun);

    // Timeline must not have duplicated entries
    expect(secondRun.timeline.length).toBe(firstRun.timeline.length);
    expect(secondRun.status).toBe('assigned');
  });

  it('verifies INITIAL_POTHOLES dataset is completely migrated', () => {
    expect(INITIAL_POTHOLES.length).toBeGreaterThan(0);

    const validStatuses = new Set([
      'reported',
      'verified',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'rejected',
    ]);

    for (const pothole of INITIAL_POTHOLES) {
      // Status validity
      expect(validStatuses.has(pothole.status)).toBe(true);

      // Priority fields present
      expect(typeof pothole.priorityScore).toBe('number');
      expect(pothole.priorityScore).toBeGreaterThanOrEqual(0);
      expect(pothole.priorityScore).toBeLessThanOrEqual(100);
      expect(['low', 'medium', 'high', 'critical']).toContain(pothole.priority);

      // Timeline initialized
      expect(Array.isArray(pothole.timeline)).toBe(true);
      expect(pothole.timeline.length).toBeGreaterThanOrEqual(1);

      // Distance and SLA
      expect(typeof pothole.distanceFromGgcMiles).toBe('number');
      expect(typeof pothole.slaDueAt).toBe('string');
    }
  });
});
