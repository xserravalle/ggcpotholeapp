import { PotholeReport } from '../types/pothole';
import { TrackedHazardSpot } from '../types/sensorQueue';
import { ReportStatus } from '../domain/status';
import { priorityScore, suggestPriority } from '../domain/priority';
import { slaDueAt } from '../domain/sla';
import { AUTHORITIES_DIRECTORY } from '../data/jurisdictionsData';

const STORAGE_KEY = 'ggc-pothole-patrol-reports-v2';
const SPOTS_STORAGE_KEY = 'ggc-pothole-patrol-tracked-spots-v1';

/**
 * Migrates a raw or legacy report to the 4-layer civic domain schema.
 * - investigating -> verified
 * - scheduled -> assigned
 * - repaired -> resolved
 * - computes priorityScore (0-100) and suggested priority ('low'|'medium'|'high'|'critical')
 * - adds initial starting timeline entry if absent
 * - idempotent: running multiple times is safe and produces identical results
 */
export function migrateReport(raw: any): PotholeReport {
  if (!raw) throw new Error('Cannot migrate null or undefined report.');

  // 1. Status migration
  let status: ReportStatus = raw.status;
  if (raw.status === 'investigating') {
    status = 'verified';
  } else if (raw.status === 'scheduled') {
    status = 'assigned';
  } else if (raw.status === 'repaired') {
    status = 'resolved';
  } else if (
    raw.status !== 'reported' &&
    raw.status !== 'verified' &&
    raw.status !== 'assigned' &&
    raw.status !== 'in_progress' &&
    raw.status !== 'resolved' &&
    raw.status !== 'closed' &&
    raw.status !== 'rejected'
  ) {
    status = 'reported';
  }

  // 2. Priority & Score migration
  const score =
    typeof raw.priorityScore === 'number'
      ? raw.priorityScore
      : priorityScore(raw);

  const priority = raw.priority || suggestPriority(score);

  // 3. Timeline migration
  let timeline = Array.isArray(raw.timeline) ? [...raw.timeline] : [];
  if (timeline.length === 0) {
    const isSensor = raw.source === 'sensor' || Boolean(raw.sensorDetected);
    timeline.push({
      id: `tl-init-${raw.id || 'seed'}`,
      status: 'reported',
      action: 'REPORT_CREATED',
      message: isSensor
        ? 'Auto-reported from in-vehicle accelerometer sensor telemetry.'
        : `Hazard reported at ${raw.address || raw.roadName || 'Gwinnett County'}`,
      actorName: isSensor ? 'Vehicle Sensor System' : raw.reporterName || 'Citizen Commuter',
      actorRole: isSensor ? 'system' : 'user',
      timestamp: raw.reportedAt || new Date().toISOString(),
    });

    if (status !== 'reported') {
      timeline.push({
        id: `tl-trans-${raw.id || 'trans'}`,
        status,
        action: `STATUS_${status.toUpperCase()}`,
        message: `Status set to ${status} in civic operations queue`,
        actorName: 'GGC Transportation Staff',
        actorRole: 'admin',
        timestamp: raw.lastVerifiedAt || raw.reportedAt || new Date().toISOString(),
      });
    }
  }

  // 4. SLA Calculation
  const agency = raw.authorityId ? AUTHORITIES_DIRECTORY[raw.authorityId] : undefined;
  const computedSlaDueAt =
    raw.slaDueAt || (raw.reportedAt ? slaDueAt(raw, agency) : undefined);

  return {
    ...raw,
    status,
    priority,
    priorityScore: score,
    timeline,
    reopenCount: raw.reopenCount ?? 0,
    slaDueAt: computedSlaDueAt,
    resolvedAt:
      raw.resolvedAt ||
      (status === 'resolved' || status === 'closed'
        ? raw.lastVerifiedAt || raw.reportedAt
        : undefined),
  };
}

export function migrateReports(list: any[]): PotholeReport[] {
  if (!Array.isArray(list)) return [];
  return list.map(migrateReport);
}

export function loadStoredPotholes(fallbackList: PotholeReport[]): PotholeReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migratedFallback = migrateReports(fallbackList);
      saveStoredPotholes(migratedFallback);
      return migratedFallback;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const migrated = migrateReports(parsed);
      saveStoredPotholes(migrated);
      return migrated;
    }
    const migratedFallback = migrateReports(fallbackList);
    saveStoredPotholes(migratedFallback);
    return migratedFallback;
  } catch {
    return migrateReports(fallbackList);
  }
}

export function saveStoredPotholes(list: PotholeReport[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (err) {
    console.error('Failed to save potholes to localStorage', err);
  }
}

export function loadTrackedSpots(): TrackedHazardSpot[] {
  try {
    const raw = localStorage.getItem(SPOTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTrackedSpots(spots: TrackedHazardSpot[]): void {
  try {
    localStorage.setItem(SPOTS_STORAGE_KEY, JSON.stringify(spots));
  } catch (err) {
    console.error('Failed to save tracked spots to localStorage', err);
  }
}

function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '""';
  let str = String(value);
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  } else {
    str = str.trim();
    if (/^[=+\-@\t\r]/.test(str)) {
      str = `'${str}`;
    }
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export function exportPotholesToCsv(list: PotholeReport[], filename = 'gwinnett_pothole_work_orders.csv'): void {
  const headers = [
    'Work Order / Tracking Code',
    'Title',
    'Priority',
    'Priority Score',
    'Severity',
    'Hazard Type',
    'Status',
    'Jurisdiction',
    'Address',
    'Latitude',
    'Longitude',
    'Distance from GGC (mi)',
    'Depth (in)',
    'Width (in)',
    'Surface Type',
    'Damage Risk',
    'Detected By',
    'Sensor Detected',
    'Bump Intensity (G)',
    'Reported At',
    'Verifications'
  ];

  const rows = list.map(item => [
    sanitizeCsvCell(item.trackingCode || item.workOrderNumber || item.id),
    sanitizeCsvCell(item.title || ''),
    sanitizeCsvCell(item.priority?.toUpperCase() || 'MEDIUM'),
    item.priorityScore ?? 0,
    sanitizeCsvCell(item.severity.toUpperCase()),
    sanitizeCsvCell(item.hazardType || 'POTHOLE'),
    sanitizeCsvCell(item.status.toUpperCase()),
    sanitizeCsvCell(item.jurisdiction),
    sanitizeCsvCell(item.address || ''),
    item.latitude.toFixed(6),
    item.longitude.toFixed(6),
    (item.distanceFromGgcMiles ?? 0).toFixed(2),
    item.estimatedDepthInches || 0,
    item.estimatedWidthInches || 0,
    sanitizeCsvCell(item.surfaceType || 'Asphalt'),
    sanitizeCsvCell(item.damageRisk || ''),
    sanitizeCsvCell(item.detectedBy),
    item.sensorDetected ? 'YES' : 'NO',
    item.bumpIntensity || 0,
    sanitizeCsvCell(item.reportedAt || ''),
    item.verificationsCount || 0
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
