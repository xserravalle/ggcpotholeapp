import { describe, it, expect } from 'vitest';
import {
  canTransition,
  ReportStatus,
  ALLOWED_TRANSITIONS,
  REPORT_STATUS_LABELS,
  REPORT_STATUS_COLORS,
  MAX_REOPEN_WINDOW_DAYS,
} from '@/domain/status';

describe('domain/status: canTransition and State Rules', () => {
  it('allows valid forward and review transitions', () => {
    // reported -> verified | rejected
    expect(canTransition('reported', 'verified')).toBe(true);
    expect(canTransition('reported', 'rejected')).toBe(true);

    // verified -> assigned | rejected
    expect(canTransition('verified', 'assigned')).toBe(true);
    expect(canTransition('verified', 'rejected')).toBe(true);

    // assigned -> in_progress | assigned (reassign)
    expect(canTransition('assigned', 'in_progress')).toBe(true);
    expect(canTransition('assigned', 'assigned')).toBe(true);

    // in_progress -> resolved
    expect(canTransition('in_progress', 'resolved')).toBe(true);

    // resolved -> closed | verified (reopen)
    expect(canTransition('resolved', 'closed')).toBe(true);
    expect(canTransition('resolved', 'verified')).toBe(true);
  });

  it('handles closed -> verified reopen window (14 days)', () => {
    const baseDate = new Date('2026-09-01T12:00:00Z');
    const within10Days = new Date('2026-09-11T12:00:00Z');
    const exactly14Days = new Date('2026-09-15T12:00:00Z');
    const after15Days = new Date('2026-09-16T12:00:00Z');

    // Missing resolvedAt should fail
    expect(canTransition('closed', 'verified')).toBe(false);
    expect(canTransition('closed', 'verified', {})).toBe(false);

    // Within 14 days should pass
    expect(
      canTransition('closed', 'verified', {
        resolvedAt: baseDate.toISOString(),
        now: within10Days,
      })
    ).toBe(true);

    expect(
      canTransition('closed', 'verified', {
        resolvedAt: baseDate.toISOString(),
        now: exactly14Days,
      })
    ).toBe(true);

    // Exceeding 14 days should fail
    expect(
      canTransition('closed', 'verified', {
        resolvedAt: baseDate.toISOString(),
        now: after15Days,
      })
    ).toBe(false);
  });

  it('rejects disallowed transitions', () => {
    // Cannot jump straight from reported to resolved or in_progress
    expect(canTransition('reported', 'resolved')).toBe(false);
    expect(canTransition('reported', 'in_progress')).toBe(false);
    expect(canTransition('reported', 'assigned')).toBe(false);

    // Terminal rejected state cannot transition to anything
    const allStatuses: ReportStatus[] = [
      'reported',
      'verified',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'rejected',
    ];
    for (const target of allStatuses) {
      expect(canTransition('rejected', target)).toBe(false);
    }

    // In progress cannot jump straight to closed or verified
    expect(canTransition('in_progress', 'closed')).toBe(false);
    expect(canTransition('in_progress', 'verified')).toBe(false);

    // Same state transitions are disallowed (except assigned for reassignment)
    expect(canTransition('reported', 'reported')).toBe(false);
    expect(canTransition('verified', 'verified')).toBe(false);
    expect(canTransition('in_progress', 'in_progress')).toBe(false);
    expect(canTransition('resolved', 'resolved')).toBe(false);
    expect(canTransition('closed', 'closed')).toBe(false);
  });

  it('provides human-readable labels and colors for every status', () => {
    const statuses: ReportStatus[] = [
      'reported',
      'verified',
      'assigned',
      'in_progress',
      'resolved',
      'closed',
      'rejected',
    ];

    for (const st of statuses) {
      expect(REPORT_STATUS_LABELS[st]).toBeTruthy();
      expect(typeof REPORT_STATUS_LABELS[st]).toBe('string');

      const color = REPORT_STATUS_COLORS[st];
      expect(color).toBeTruthy();
      expect(color.badge).toBeTruthy();
      expect(color.text).toBeTruthy();
      expect(color.bg).toBeTruthy();
      expect(color.dot).toBeTruthy();
    }
  });
});
