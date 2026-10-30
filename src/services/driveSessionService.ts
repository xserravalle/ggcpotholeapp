import { DriveSession, DriveBreadcrumb, DriveShockIncident } from '../types/driveSession';

export const DRIVE_SESSIONS_STORAGE_KEY = 'ggc_drive_sessions_v1';

/**
 * Calculates the great-circle distance between two GPS coordinates in miles using the Haversine formula.
 */
export function haversineDistanceMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Calculates total cumulative distance in miles for a series of GPS breadcrumbs.
 */
export function calculatePathDistanceMiles(path: DriveBreadcrumb[]): number {
  if (path.length < 2) return 0;
  let total = 0;
  for (let i = 1; i < path.length; i++) {
    const dist = haversineDistanceMiles(
      path[i - 1].lat,
      path[i - 1].lng,
      path[i].lat,
      path[i].lng
    );
    // Filter out GPS jump anomalies (> 0.25 miles between adjacent 1-second ticks)
    if (dist < 0.25) {
      total += dist;
    }
  }
  return parseFloat(total.toFixed(2));
}

/**
 * Formats seconds into MM:SS or HH:MM:SS string.
 */
export function formatDuration(seconds: number): string {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const DRIVE_RETENTION_STORAGE_KEY = 'ggc_drive_retention_days';
export const DEFAULT_DRIVE_RETENTION_DAYS = 30;

/**
 * Gets the current drive session retention setting in days.
 * 7 = 7 days, 30 = 30 days, -1 = Until I delete it.
 */
export function getDriveRetentionDays(): number {
  try {
    const raw = localStorage.getItem(DRIVE_RETENTION_STORAGE_KEY);
    if (!raw) return DEFAULT_DRIVE_RETENTION_DAYS;
    const parsed = parseInt(raw, 10);
    if (parsed === 7 || parsed === 30 || parsed === -1) {
      return parsed;
    }
    return DEFAULT_DRIVE_RETENTION_DAYS;
  } catch {
    return DEFAULT_DRIVE_RETENTION_DAYS;
  }
}

/**
 * Sets the drive session retention setting in days and immediately purges expired sessions.
 */
export function setDriveRetentionDays(days: number): number {
  try {
    const valid = days === 7 || days === 30 || days === -1 ? days : DEFAULT_DRIVE_RETENTION_DAYS;
    localStorage.setItem(DRIVE_RETENTION_STORAGE_KEY, valid.toString());
    return purgeExpiredDriveSessions(valid);
  } catch {
    return 0;
  }
}

/**
 * Automatically purges drive sessions older than the specified retention window.
 * Returns the number of purged sessions.
 */
export function purgeExpiredDriveSessions(retentionDays?: number, nowMs: number = Date.now()): number {
  try {
    const days = retentionDays !== undefined ? retentionDays : getDriveRetentionDays();
    if (days === -1) {
      // "Until I delete it" - do not purge
      return 0;
    }

    const cutoffTime = nowMs - days * 24 * 60 * 60 * 1000;
    const raw = localStorage.getItem(DRIVE_SESSIONS_STORAGE_KEY);
    if (!raw) return 0;

    const sessions: DriveSession[] = JSON.parse(raw);
    if (!Array.isArray(sessions)) return 0;

    const remaining = sessions.filter(session => {
      const sessionTime = session.startTime || 0;
      return sessionTime >= cutoffTime;
    });

    const purgedCount = sessions.length - remaining.length;
    if (purgedCount > 0) {
      localStorage.setItem(DRIVE_SESSIONS_STORAGE_KEY, JSON.stringify(remaining));
    }
    return purgedCount;
  } catch (e) {
    console.error('Failed to purge expired drive sessions', e);
    return 0;
  }
}

export function loadDriveSessions(): DriveSession[] {
  try {
    // Automatically purge expired sessions on load
    purgeExpiredDriveSessions();
    const raw = localStorage.getItem(DRIVE_SESSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load drive sessions from localStorage', e);
    return [];
  }
}

export function saveDriveSession(session: DriveSession): void {
  try {
    purgeExpiredDriveSessions();
    const existing = loadDriveSessions();
    const updated = [session, ...existing.filter(s => s.id !== session.id)].slice(0, 50);
    localStorage.setItem(DRIVE_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save drive session to localStorage', e);
  }
}

export function getStoredDriveSessionCount(): number {
  try {
    purgeExpiredDriveSessions();
    const raw = localStorage.getItem(DRIVE_SESSIONS_STORAGE_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

export function clearAllDriveSessions(): void {
  try {
    localStorage.removeItem(DRIVE_SESSIONS_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear drive sessions', e);
  }
}

export function generateDriveTrackingCode(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DRIVE-2026-${randomSuffix}`;
}
