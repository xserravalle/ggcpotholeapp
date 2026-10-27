
import type { PotholeReport } from '../types/pothole';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePotholeReport(
  report: Partial<PotholeReport>
): ValidationResult {
  const errors: string[] = [];

  if (!report.id?.trim()) {
    errors.push('Missing report ID');
  }

  if (!report.title?.trim()) {
    errors.push('Missing title');
  }

  if (
    typeof report.latitude !== 'number' ||
    !Number.isFinite(report.latitude) ||
    Math.abs(report.latitude) > 90
  ) {
    errors.push('Invalid latitude');
  }

  if (
    typeof report.longitude !== 'number' ||
    !Number.isFinite(report.longitude) ||
    Math.abs(report.longitude) > 180
  ) {
    errors.push('Invalid longitude');
  }

  if (
    !['minor', 'moderate', 'severe', 'critical'].includes(
      report.severity ?? ''
    )
  ) {
    errors.push('Invalid severity');
  }

  if (
    ![
      'reported',
      'investigating',
      'scheduled',
      'repaired',
    ].includes(report.status ?? '')
  ) {
    errors.push('Invalid status');
  }

  for (const key of [
    'estimatedDepthInches',
    'estimatedWidthInches',
  ] as const) {
    const value = report[key];

    if (
      typeof value !== 'number' ||
      !Number.isFinite(value) ||
      value < 0
    ) {
      errors.push(`Invalid ${key}`);
    }
  }

  if (
    report.verificationsCount !== undefined &&
    (!Number.isInteger(report.verificationsCount) ||
      report.verificationsCount < 0)
  ) {
    errors.push('Invalid verification count');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
