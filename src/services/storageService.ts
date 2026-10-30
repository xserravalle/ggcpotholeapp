import { PotholeReport } from '../types/pothole';
import { TrackedHazardSpot } from '../types/sensorQueue';
import { ReportStatus } from '../domain/status';
import { priorityScore, suggestPriority } from '../domain/priority';
import { slaDueAt } from '../domain/sla';
import { AUTHORITIES_DIRECTORY } from '../data/jurisdictionsData';
import { INITIAL_POTHOLES } from '../data/potholesData';

export const STORAGE_KEY = 'ggc-pothole-patrol-reports-v2';
export const SPOTS_STORAGE_KEY = 'ggc-pothole-patrol-tracked-spots-v1';
export const ESTIMATED_LOCALSTORAGE_QUOTA_BYTES = 5 * 1024 * 1024; // 5 MB standard browser quota

export interface StorageQuotaInfo {
  usedBytes: number;
  estimatedQuotaBytes: number;
  percentUsed: number;
  percentageUsed: number;
  isNearQuota: boolean;
  isExceeded: boolean;
  isOverQuota: boolean;
  warningMessage: string | null;
}

/**
 * Calculates current localStorage usage and evaluates quota proximity.
 */
export function checkStorageQuota(): StorageQuotaInfo {
  try {
    let totalChars = 0;
    if (typeof localStorage !== 'undefined') {
      const keys = new Set<string>();
      try {
        for (const k of Object.keys(localStorage)) {
          if (typeof (localStorage as any)[k] !== 'function') {
            keys.add(k);
          }
        }
      } catch {
        // ignore
      }

      if (typeof localStorage.key === 'function' && typeof localStorage.length === 'number') {
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k) keys.add(k);
          }
        } catch {
          // ignore
        }
      }

      for (const key of keys) {
        try {
          const val = localStorage.getItem(key);
          totalChars += key.length + (val ? val.length : 0);
        } catch {
          // ignore item read error
        }
      }
    }
    const usedBytes = totalChars * 2; // UTF-16 character = 2 bytes
    const percentUsed = Math.min(100, (usedBytes / ESTIMATED_LOCALSTORAGE_QUOTA_BYTES) * 100);
    const isNearQuota = percentUsed >= 80;
    const isExceeded = percentUsed >= 100;

    let warningMessage: string | null = null;
    if (isExceeded) {
      warningMessage = 'Browser storage quota is full (100%). Saving new reports may fail. Please export or delete older reports.';
    } else if (isNearQuota) {
      warningMessage = `Browser storage is nearly full (${Math.round(percentUsed)}%). Consider exporting your data to avoid data loss.`;
    }

    return {
      usedBytes,
      estimatedQuotaBytes: ESTIMATED_LOCALSTORAGE_QUOTA_BYTES,
      percentUsed,
      percentageUsed: percentUsed,
      isNearQuota,
      isExceeded,
      isOverQuota: isExceeded,
      warningMessage,
    };
  } catch {
    return {
      usedBytes: 0,
      estimatedQuotaBytes: ESTIMATED_LOCALSTORAGE_QUOTA_BYTES,
      percentUsed: 0,
      percentageUsed: 0,
      isNearQuota: false,
      isExceeded: false,
      isOverQuota: false,
      warningMessage: null,
    };
  }
}

/**
 * Validates, repairs, or discards tampered/corrupted report records from untrusted storage.
 */
export function repairOrSanitizeReport(raw: any): PotholeReport | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  // ID validation: ensure valid string or generate recovery ID
  const id = typeof raw.id === 'string' && raw.id.trim()
    ? raw.id.trim()
    : `repaired-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  // Geospatial coordinates validation and repair
  let latitude = Number(raw.latitude);
  let longitude = Number(raw.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    latitude = 33.9806; // Default to GGC Campus coordinates
  }
  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    longitude = -84.0069; // Default to GGC Campus coordinates
  }

  // Title validation and sanitization
  const title = typeof raw.title === 'string' && raw.title.trim()
    ? raw.title.trim().slice(0, 100)
    : 'Road Hazard';

  // Severity validation
  const validSeverities = ['minor', 'moderate', 'severe', 'critical'];
  const severity = validSeverities.includes(raw.severity) ? raw.severity : 'moderate';

  const cleaned = {
    ...raw,
    id,
    title,
    latitude,
    longitude,
    severity,
    address: typeof raw.address === 'string' ? raw.address.slice(0, 200) : '',
    roadName: typeof raw.roadName === 'string' ? raw.roadName.slice(0, 100) : '',
    description: typeof raw.description === 'string' ? raw.description.slice(0, 1000) : '',
    landmark: typeof raw.landmark === 'string' ? raw.landmark.slice(0, 200) : undefined,
    reporterName: typeof raw.reporterName === 'string' ? raw.reporterName.slice(0, 100) : undefined,
    reporterEmail: typeof raw.reporterEmail === 'string' ? raw.reporterEmail.slice(0, 254) : undefined,
    estimatedDepthInches:
      typeof raw.estimatedDepthInches === 'number' && Number.isFinite(raw.estimatedDepthInches) && raw.estimatedDepthInches >= 0
        ? Math.min(raw.estimatedDepthInches, 120)
        : 0,
    estimatedWidthInches:
      typeof raw.estimatedWidthInches === 'number' && Number.isFinite(raw.estimatedWidthInches) && raw.estimatedWidthInches >= 0
        ? Math.min(raw.estimatedWidthInches, 360)
        : 0,
    verificationsCount:
      typeof raw.verificationsCount === 'number' && Number.isInteger(raw.verificationsCount) && raw.verificationsCount >= 0
        ? raw.verificationsCount
        : 0,
    userConfirmed: Boolean(raw.userConfirmed),
    reportedAt: typeof raw.reportedAt === 'string' && !isNaN(Date.parse(raw.reportedAt))
      ? raw.reportedAt
      : new Date().toISOString(),
    lastVerifiedAt: typeof raw.lastVerifiedAt === 'string' && !isNaN(Date.parse(raw.lastVerifiedAt))
      ? raw.lastVerifiedAt
      : new Date().toISOString(),
  };

  return migrateReport(cleaned);
}

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
  if (!raw || typeof raw !== 'object') {
    throw new Error('Cannot migrate null or non-object report.');
  }

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
  return list.map(item => repairOrSanitizeReport(item)).filter((r): r is PotholeReport => r !== null);
}

/**
 * Loads reports from localStorage, resilient against tampered records, malformed JSON,
 * and schema violations. Skips or repairs corrupted records without crashing.
 */
export function loadStoredPotholes(fallbackList: PotholeReport[] = INITIAL_POTHOLES): PotholeReport[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const migratedFallback = migrateReports(fallbackList);
      saveStoredPotholes(migratedFallback);
      return migratedFallback;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (parseErr) {
      console.warn('Malformed or tampered JSON encountered in localStorage; restoring fallback.', parseErr);
      const migratedFallback = migrateReports(fallbackList);
      saveStoredPotholes(migratedFallback);
      return migratedFallback;
    }

    if (!Array.isArray(parsed)) {
      console.warn('Expected array in localStorage reports but found non-array; restoring fallback.');
      const migratedFallback = migrateReports(fallbackList);
      saveStoredPotholes(migratedFallback);
      return migratedFallback;
    }

    if (parsed.length === 0) {
      return [];
    }

    const sanitizedList: PotholeReport[] = [];
    for (const item of parsed) {
      const repaired = repairOrSanitizeReport(item);
      if (repaired) {
        sanitizedList.push(repaired);
      }
    }

    if (sanitizedList.length > 0) {
      saveStoredPotholes(sanitizedList);
      return sanitizedList;
    }

    // All records were completely irrecoverable
    const migratedFallback = migrateReports(fallbackList);
    saveStoredPotholes(migratedFallback);
    return migratedFallback;
  } catch (err) {
    console.warn('Unexpected error in loadStoredPotholes; returning fallback.', err);
    return migrateReports(fallbackList);
  }
}

/**
 * Saves reports to localStorage, guarding against QuotaExceededError and alerting the UI.
 */
export function saveStoredPotholes(list: PotholeReport[]): { success: boolean; error?: string } {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return { success: true };
  } catch (err: any) {
    console.error('Failed to save potholes to localStorage', err);
    const isQuota =
      err?.name === 'QuotaExceededError' ||
      err?.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
      err?.code === 22 ||
      err?.code === 1014;

    const errorMsg = isQuota
      ? 'Storage quota exceeded. Browser storage is full. Please export reports or clear storage.'
      : 'Failed to write reports to local storage.';

    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      window.dispatchEvent(
        new CustomEvent('storage-quota-warning', { detail: { message: errorMsg, isQuota: true } })
      );
    }
    return { success: false, error: errorMsg };
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
