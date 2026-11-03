
import type { PotholeReport } from '../types/pothole';

export interface RepairPriority {
  score: number;
  level: 'low' | 'medium' | 'high' | 'urgent';
  reasons: string[];
}

const severityPoints = {
  minor: 10,
  moderate: 25,
  severe: 45,
  critical: 60,
} as const;

export function calculateRepairPriority(
  report: Pick<
    PotholeReport,
    'severity' | 'status' | 'verificationsCount' | 'reportedAt'
  >,
  now: Date = new Date()
): RepairPriority {
  if (report.status === 'repaired') {
    return {
      score: 0,
      level: 'low',
      reasons: ['Already repaired'],
    };
  }

  const reasons = [`Severity: ${report.severity}`];

  let score = severityPoints[report.severity] ?? 0;

  const reportedMs = Date.parse(report.reportedAt);
  const nowMs = now.getTime();

  const days =
    Number.isFinite(reportedMs) &&
    Number.isFinite(nowMs) &&
    reportedMs <= nowMs
      ? Math.floor((nowMs - reportedMs) / 86400000)
      : 0;

  const agePoints = Math.min(
    20,
    Math.floor(days / 7) * 5
  );

  if (agePoints > 0) {
    reasons.push(`Open for ${days} days`);
  }

  score += agePoints;

  const count = Number.isFinite(report.verificationsCount)
    ? Math.max(0, Math.floor(report.verificationsCount))
    : 0;

  const confirmationPoints = Math.min(20, count * 4);

  if (confirmationPoints > 0) {
    reasons.push(`${count} verifications`);
  }

  score = Math.min(100, score + confirmationPoints);

  const level =
    score >= 80
      ? 'urgent'
      : score >= 55
        ? 'high'
        : score >= 30
          ? 'medium'
          : 'low';

  return { score, level, reasons };
}
