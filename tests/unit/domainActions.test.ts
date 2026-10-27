import { describe, it, expect } from 'vitest';
import { applyAction } from '@/domain/actions';
import { PotholeReport, Actor } from '@/domain/types';

const initialReport: PotholeReport = {
  id: 'rep-action-01',
  trackingCode: 'GAP-2026-ACT01',
  title: 'Hazard on Collins Hill Rd',
  address: '1000 University Center Ln',
  roadName: 'Collins Hill Rd',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  latitude: 33.98,
  longitude: -84.00,
  severity: 'moderate',
  status: 'reported',
  priority: 'medium',
  priorityScore: 35,
  timeline: [],
  verificationsCount: 1,
  userConfirmed: true,
  reportedAt: '2026-09-01T10:00:00Z',
  lastVerifiedAt: '2026-09-01T10:00:00Z',
  description: 'Moderate cavity in right lane',
  reporterName: 'Alex Citizen',
  reporterEmail: 'alex.citizen@example.com',
  estimatedDepthInches: 3,
  estimatedWidthInches: 18,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
};

const citizenActor: Actor = {
  id: 'act-alex',
  name: 'Alex Citizen',
  email: 'alex.citizen@example.com',
  role: 'user',
};

const adminActor: Actor = {
  id: 'act-admin',
  name: 'Sam Director',
  role: 'admin',
};

const officerActor: Actor = {
  id: 'off-pat',
  name: 'Officer Pat Roadcrew',
  role: 'officer',
};

describe('domain/actions: applyAction(report, action, actor, payload)', () => {
  it('handles "create" action producing initial timeline and admin notification', () => {
    const res = applyAction(initialReport, 'create', citizenActor, {
      message: 'New road hazard reported on Collins Hill Rd',
    });

    expect(res.report.status).toBe('reported');
    expect(res.timelineEntry.action).toBe('REPORT_CREATED');
    expect(res.timelineEntry.actorName).toBe('Alex Citizen');
    expect(res.report.timeline.length).toBe(1);
    expect(res.notifications.length).toBe(1);
    expect(res.notifications[0].recipientRole).toBe('admin');
  });

  it('handles "confirm" action updating verificationsCount, priorityScore, and timeline', () => {
    const res = applyAction(initialReport, 'confirm', citizenActor);

    expect(res.report.verificationsCount).toBe(2);
    expect(res.report.userConfirmed).toBe(true);
    expect(res.timelineEntry.action).toBe('CONFIRMED');
    expect(res.report.timeline.length).toBe(1);
  });

  it('handles "comment" action and notifies respective party', () => {
    // Admin comment notifies citizen reporter
    const adminRes = applyAction(initialReport, 'comment', adminActor, {
      message: 'Inspector scheduled for afternoon inspection.',
    });

    expect(adminRes.timelineEntry.action).toBe('COMMENT_ADDED');
    expect(adminRes.timelineEntry.message).toBe('Inspector scheduled for afternoon inspection.');
    expect(adminRes.notifications.length).toBe(1);
    expect(adminRes.notifications[0].recipientRole).toBe('user');
    expect(adminRes.notifications[0].recipientName).toBe('Alex Citizen');
  });

  it('handles "verify" action transitioning status to verified', () => {
    const res = applyAction(initialReport, 'verify', adminActor, {
      message: 'Cavity inspected and confirmed eligible for GCDOT resurfacing.',
    });

    expect(res.report.status).toBe('verified');
    expect(res.timelineEntry.action).toBe('STATUS_VERIFIED');
    expect(res.notifications[0].recipientRole).toBe('user');
  });

  it('handles "reject" action requiring a reason and transitioning to rejected', () => {
    // Missing reason should throw
    expect(() =>
      applyAction(initialReport, 'reject', adminActor, {})
    ).toThrow(/rejection reason is required/i);

    const res = applyAction(initialReport, 'reject', adminActor, {
      reason: 'not_a_pothole',
      message: 'Surface expansion joint, not a road cavity.',
    });

    expect(res.report.status).toBe('rejected');
    expect(res.report.rejectedReason).toBe('not_a_pothole');
    expect(res.timelineEntry.action).toBe('STATUS_REJECTED');
  });

  it('handles "merge" action merging duplicate report into another', () => {
    expect(() =>
      applyAction(initialReport, 'merge', adminActor, {})
    ).toThrow(/mergedIntoId.*required/i);

    const res = applyAction(initialReport, 'merge', adminActor, {
      mergedIntoId: 'GW-POT-MASTER-99',
    });

    expect(res.report.status).toBe('rejected');
    expect(res.report.rejectedReason).toBe('duplicate');
    expect(res.report.mergedIntoId).toBe('GW-POT-MASTER-99');
    expect(res.timelineEntry.action).toBe('STATUS_MERGED');
  });

  it('handles "setPriority" action with manual admin override', () => {
    const res = applyAction(initialReport, 'setPriority', adminActor, {
      priority: 'critical',
      message: 'Near hospital emergency vehicle corridor.',
    });

    expect(res.report.priority).toBe('critical');
    expect(res.timelineEntry.action).toBe('PRIORITY_OVERRIDDEN');
  });

  it('handles "assign" and "reassign" workflow', () => {
    // Must be in verified status to assign
    const verifiedReport: PotholeReport = { ...initialReport, status: 'verified' };

    const assignRes = applyAction(verifiedReport, 'assign', adminActor, {
      assignedAgencyId: 'GWINNETT_COUNTY',
      assignedOfficerId: 'off-pat',
      assignedCrew: 'Gwinnett Patch Unit 4',
    });

    expect(assignRes.report.status).toBe('assigned');
    expect(assignRes.report.assignedOfficerId).toBe('off-pat');
    expect(assignRes.report.assignedCrew).toBe('Gwinnett Patch Unit 4');
    expect(assignRes.timelineEntry.action).toBe('STATUS_ASSIGNED');
    expect(assignRes.notifications.some(n => n.recipientRole === 'officer')).toBe(true);

    // Reassign
    const reassignRes = applyAction(assignRes.report, 'reassign', adminActor, {
      assignedOfficerId: 'off-dan',
      assignedCrew: 'Gwinnett Emergency Rapid Response',
    });

    expect(reassignRes.report.assignedOfficerId).toBe('off-dan');
    expect(reassignRes.timelineEntry.action).toBe('STATUS_REASSIGNED');
  });

  it('handles officer "startWork" and "resolve" lifecycle', () => {
    const assignedReport: PotholeReport = {
      ...initialReport,
      status: 'assigned',
      assignedOfficerId: 'off-pat',
    };

    // startWork
    const startRes = applyAction(assignedReport, 'startWork', officerActor, {
      message: 'Hot asphalt trailer stationed at site.',
    });
    expect(startRes.report.status).toBe('in_progress');
    expect(startRes.timelineEntry.action).toBe('WORK_STARTED');

    // resolve
    const resolveRes = applyAction(startRes.report, 'resolve', officerActor, {
      message: 'Infrared resurfacing complete. Smooth compaction verified.',
      imageUrl: 'https://example.com/repaired-photo.jpg',
    });
    expect(resolveRes.report.status).toBe('resolved');
    expect(resolveRes.report.resolvedAt).toBeTruthy();
    expect(resolveRes.report.imageUrl).toBe('https://example.com/repaired-photo.jpg');
    expect(resolveRes.timelineEntry.action).toBe('WORK_RESOLVED');
  });

  it('handles citizen "rateFix" action with 1-5 rating validation', () => {
    const resolvedReport: PotholeReport = {
      ...initialReport,
      status: 'resolved',
      resolvedAt: '2026-09-02T15:00:00Z',
      assignedOfficerId: 'off-pat',
    };

    // Invalid ratings
    expect(() =>
      applyAction(resolvedReport, 'rateFix', citizenActor, { rating: 0 })
    ).toThrow(/between 1 and 5/i);
    expect(() =>
      applyAction(resolvedReport, 'rateFix', citizenActor, { rating: 6 })
    ).toThrow(/between 1 and 5/i);

    // Valid rating
    const rateRes = applyAction(resolvedReport, 'rateFix', citizenActor, {
      rating: 5,
      comment: 'Super fast fix and smooth driving now! Thanks GGC team.',
    });

    expect(rateRes.report.feedback?.rating).toBe(5);
    expect(rateRes.report.feedback?.comment).toContain('Super fast fix');
    expect(rateRes.timelineEntry.action).toBe('FIX_RATED');
    expect(rateRes.notifications.some(n => n.recipientRole === 'officer')).toBe(true);
  });

  it('handles citizen "reopen" within 14 days and rejects beyond 14 days', () => {
    const resolvedTime = new Date('2026-09-01T12:00:00Z');
    const resolvedReport: PotholeReport = {
      ...initialReport,
      status: 'resolved',
      resolvedAt: resolvedTime.toISOString(),
      assignedOfficerId: 'off-pat',
    };

    // Reopen within 3 days
    const reopenRes = applyAction(resolvedReport, 'reopen', citizenActor, {
      message: 'Patch sank after rainstorm; still hitting wheel rim.',
      now: new Date('2026-09-04T12:00:00Z'),
    });

    expect(reopenRes.report.status).toBe('verified');
    expect(reopenRes.report.reopenCount).toBe(1);
    expect(reopenRes.timelineEntry.action).toBe('STATUS_REOPENED');

    // Reopen after 16 days should throw error
    const oldClosedReport: PotholeReport = {
      ...initialReport,
      status: 'closed',
      resolvedAt: resolvedTime.toISOString(),
    };

    expect(() =>
      applyAction(oldClosedReport, 'reopen', citizenActor, {
        now: new Date('2026-09-18T12:00:00Z'), // 17 days later
      })
    ).toThrow(/reopening is only permitted within 14 days/i);
  });

  it('throws readable permission denied error when role is not allowed', () => {
    expect(() =>
      applyAction(initialReport, 'close', citizenActor)
    ).toThrow(/permission denied.*not permitted.*close/i);

    expect(() =>
      applyAction(initialReport, 'verify', officerActor)
    ).toThrow(/permission denied.*not permitted.*verify/i);
  });
});
