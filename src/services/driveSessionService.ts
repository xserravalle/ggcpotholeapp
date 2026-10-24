import { DriveSession, DriveBreadcrumb, DriveShockIncident } from '../types/driveSession';

const DRIVE_SESSIONS_STORAGE_KEY = 'ggc_drive_sessions_v1';

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

export function loadDriveSessions(): DriveSession[] {
  try {
    const raw = localStorage.getItem(DRIVE_SESSIONS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load drive sessions from localStorage', e);
    return [];
  }
}

export function saveDriveSession(session: DriveSession): void {
  try {
    const existing = loadDriveSessions();
    const updated = [session, ...existing.filter(s => s.id !== session.id)].slice(0, 20);
    localStorage.setItem(DRIVE_SESSIONS_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save drive session to localStorage', e);
  }
}

export function generateDriveTrackingCode(): string {
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `DRIVE-2026-${randomSuffix}`;
}
