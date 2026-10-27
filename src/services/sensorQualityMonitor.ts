
/**
 * Quality warnings only.
 * Does not modify impact detection.
 */

export interface SensorQualityInput {
  nowMs: number;
  lastMotionMs: number | null;
  gpsAccuracyMeters: number | null;
  lastGpsMs: number | null;
  speedMetersPerSecond: number | null;
}

export type SensorWarning =
  | 'motion-unavailable'
  | 'motion-stale'
  | 'gps-unavailable'
  | 'gps-stale'
  | 'gps-inaccurate'
  | 'speed-unavailable';

export function evaluateSensorQuality(
  input: SensorQualityInput
): SensorWarning[] {
  const warnings: SensorWarning[] = [];

  const {
    nowMs,
    lastMotionMs,
    lastGpsMs,
    gpsAccuracyMeters,
    speedMetersPerSecond,
  } = input;

  if (!Number.isFinite(nowMs)) {
    return ['motion-unavailable', 'gps-unavailable'];
  }

  if (
    lastMotionMs === null ||
    !Number.isFinite(lastMotionMs) ||
    lastMotionMs > nowMs
  ) {
    warnings.push('motion-unavailable');
  } else if (nowMs - lastMotionMs > 3000) {
    warnings.push('motion-stale');
  }

  if (
    lastGpsMs === null ||
    !Number.isFinite(lastGpsMs) ||
    lastGpsMs > nowMs
  ) {
    warnings.push('gps-unavailable');
  } else if (nowMs - lastGpsMs > 10000) {
    warnings.push('gps-stale');
  }

  if (
    gpsAccuracyMeters !== null &&
    (!Number.isFinite(gpsAccuracyMeters) ||
      gpsAccuracyMeters < 0 ||
      gpsAccuracyMeters > 30)
  ) {
    warnings.push('gps-inaccurate');
  }

  if (
    speedMetersPerSecond === null ||
    !Number.isFinite(speedMetersPerSecond) ||
    speedMetersPerSecond < 0
  ) {
    warnings.push('speed-unavailable');
  }

  return warnings;
}
