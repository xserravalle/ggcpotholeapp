import { PotholeReport } from './types';
import { ReportStatus } from './status';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DEFAULT_SLA_DAYS = 3;

export interface AgencySlaInfo {
  slaTargetDays?: number;
}

/**
 * Calculates the ISO timestamp when SLA resolution is due for a report.
 * Accepts an agency object with slaTargetDays, a numeric day count, or falls back to 3 days.
 */
export function slaDueAt(
  report: { reportedAt: string },
  agency?: AgencySlaInfo | number | null
): string {
  const targetDays =
    typeof agency === 'number'
      ? agency
      : agency?.slaTargetDays ?? DEFAULT_SLA_DAYS;

  const reportedTime = new Date(report.reportedAt).getTime();
  const baseTime = Number.isNaN(reportedTime) ? Date.now() : reportedTime;
  const dueTimestamp = baseTime + targetDays * MS_PER_DAY;
  return new Date(dueTimestamp).toISOString();
}

/**
 * Checks whether an active report has exceeded its SLA deadline.
 * Resolved, closed, or rejected reports are not overdue.
 */
export function isOverdue(
  report: {
    status: ReportStatus;
    slaDueAt?: string;
    reportedAt?: string;
  },
  now: Date | string = new Date()
): boolean {
  // If report has reached completion or rejection, it's not overdue
  if (
    report.status === 'resolved' ||
    report.status === 'closed' ||
    report.status === 'rejected'
  ) {
    return false;
  }

  const nowTime = typeof now === 'string' ? new Date(now).getTime() : now.getTime();

  if (report.slaDueAt) {
    const dueTime = new Date(report.slaDueAt).getTime();
    if (!Number.isNaN(dueTime)) {
      return nowTime > dueTime;
    }
  }

  if (report.reportedAt) {
    const reportedTime = new Date(report.reportedAt).getTime();
    if (!Number.isNaN(reportedTime)) {
      const defaultDueTime = reportedTime + DEFAULT_SLA_DAYS * MS_PER_DAY;
      return nowTime > defaultDueTime;
    }
  }

  return false;
}

/**
 * Returns the number of full days a report has been open.
 * If resolvedAt is present, computes days between reportedAt and resolvedAt.
 * Otherwise, computes days between reportedAt and `now`.
 */
export function daysOpen(
  report: {
    reportedAt: string;
    resolvedAt?: string;
  },
  now: Date | string = new Date()
): number {
  const startTime = new Date(report.reportedAt).getTime();
  if (Number.isNaN(startTime)) return 0;

  const endTime = report.resolvedAt
    ? new Date(report.resolvedAt).getTime()
    : typeof now === 'string'
    ? new Date(now).getTime()
    : now.getTime();

  if (Number.isNaN(endTime)) return 0;

  const elapsedMs = endTime - startTime;
  if (elapsedMs <= 0) return 0;

  return Math.floor(elapsedMs / MS_PER_DAY);
}
