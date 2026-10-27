import { describe, it, expect } from 'vitest';
import { slaDueAt, isOverdue, daysOpen } from '@/domain/sla';
import { AUTHORITIES_DIRECTORY } from '@/data/jurisdictionsData';

describe('domain/sla: SLA Deadlines and Overdue Logic', () => {
  const reportedAt = '2026-09-01T12:00:00Z';

  it('computes correct slaDueAt timestamp based on agency targets', () => {
    // GGC: 2 days
    const ggcDue = slaDueAt({ reportedAt }, AUTHORITIES_DIRECTORY.GGC);
    expect(ggcDue).toBe('2026-09-03T12:00:00.000Z');

    // GCDOT: 5 days
    const gcdotDue = slaDueAt({ reportedAt }, AUTHORITIES_DIRECTORY.GWINNETT_COUNTY);
    expect(gcdotDue).toBe('2026-09-06T12:00:00.000Z');

    // Lawrenceville: 3 days
    const lawrencevilleDue = slaDueAt({ reportedAt }, AUTHORITIES_DIRECTORY.LAWRENCEVILLE);
    expect(lawrencevilleDue).toBe('2026-09-04T12:00:00.000Z');

    // Default when agency is null/undefined: 3 days
    const defaultDue = slaDueAt({ reportedAt }, null);
    expect(defaultDue).toBe('2026-09-04T12:00:00.000Z');

    // Direct numeric days argument: 7 days
    const directDue = slaDueAt({ reportedAt }, 7);
    expect(directDue).toBe('2026-09-08T12:00:00.000Z');
  });

  it('determines isOverdue correctly for open vs completed tickets', () => {
    const dueTimestamp = '2026-09-04T12:00:00Z';
    const beforeDue = new Date('2026-09-03T12:00:00Z');
    const afterDue = new Date('2026-09-05T12:00:00Z');

    // Open ticket before due date -> not overdue
    expect(isOverdue({ status: 'reported', slaDueAt: dueTimestamp }, beforeDue)).toBe(false);
    expect(isOverdue({ status: 'verified', slaDueAt: dueTimestamp }, beforeDue)).toBe(false);
    expect(isOverdue({ status: 'in_progress', slaDueAt: dueTimestamp }, beforeDue)).toBe(false);

    // Open ticket after due date -> overdue
    expect(isOverdue({ status: 'reported', slaDueAt: dueTimestamp }, afterDue)).toBe(true);
    expect(isOverdue({ status: 'verified', slaDueAt: dueTimestamp }, afterDue)).toBe(true);
    expect(isOverdue({ status: 'assigned', slaDueAt: dueTimestamp }, afterDue)).toBe(true);
    expect(isOverdue({ status: 'in_progress', slaDueAt: dueTimestamp }, afterDue)).toBe(true);

    // Resolved, closed, or rejected tickets are never overdue regardless of time
    expect(isOverdue({ status: 'resolved', slaDueAt: dueTimestamp }, afterDue)).toBe(false);
    expect(isOverdue({ status: 'closed', slaDueAt: dueTimestamp }, afterDue)).toBe(false);
    expect(isOverdue({ status: 'rejected', slaDueAt: dueTimestamp }, afterDue)).toBe(false);
  });

  it('calculates daysOpen accurately', () => {
    const nowDay4 = new Date('2026-09-05T18:00:00Z'); // 4.25 days elapsed
    expect(daysOpen({ reportedAt }, nowDay4)).toBe(4);

    // Resolved tickets use resolvedAt, not current time
    const resolvedReport = {
      reportedAt,
      resolvedAt: '2026-09-03T14:00:00Z', // 2.08 days elapsed
    };
    expect(daysOpen(resolvedReport, nowDay4)).toBe(2);

    // Same day returns 0 days open
    const sameDay = new Date('2026-09-01T18:00:00Z');
    expect(daysOpen({ reportedAt }, sameDay)).toBe(0);
  });
});
