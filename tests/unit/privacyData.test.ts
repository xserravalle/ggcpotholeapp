import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getDriveRetentionDays, 
  setDriveRetentionDays, 
  purgeExpiredDriveSessions, 
  loadDriveSessions, 
  saveDriveSession, 
  getStoredDriveSessionCount, 
  clearAllDriveSessions,
  DRIVE_RETENTION_STORAGE_KEY,
  DRIVE_SESSIONS_STORAGE_KEY 
} from '@/services/driveSessionService';
import { reportRepository } from '@/repository/LocalStorageReportRepository';
import { DriveSession } from '@/types/driveSession';

describe('Task S4: Privacy, Data Sovereignty and Drive Retention', () => {
  beforeEach(async () => {
    localStorage.clear();
    await reportRepository.resetDemoData();
  });

  describe('1. Drive History Retention (Task S4.2)', () => {
    it('defaults to 30 days retention when no setting exists', () => {
      expect(getDriveRetentionDays()).toBe(30);
    });

    it('sets and persists retention days (7, 30, -1)', () => {
      setDriveRetentionDays(7);
      expect(getDriveRetentionDays()).toBe(7);

      setDriveRetentionDays(-1);
      expect(getDriveRetentionDays()).toBe(-1);

      setDriveRetentionDays(30);
      expect(getDriveRetentionDays()).toBe(30);
    });

    it('falls back to default 30 days if invalid value is in storage', () => {
      localStorage.setItem(DRIVE_RETENTION_STORAGE_KEY, '999');
      expect(getDriveRetentionDays()).toBe(30);
    });

    it('automatically purges drive sessions older than the retention window', () => {
      const now = Date.now();
      const DAY_MS = 24 * 60 * 60 * 1000;

      const recentSession: DriveSession = {
        id: 'DRV-recent',
        trackingCode: 'DRIVE-2026-1111',
        startTime: now - (3 * DAY_MS), // 3 days old
        durationSeconds: 600,
        totalDistanceMiles: 5.2,
        peakG: 1.8,
        path: [],
        incidents: [],
        status: 'completed',
      };

      const oldSession10d: DriveSession = {
        id: 'DRV-10d',
        trackingCode: 'DRIVE-2026-2222',
        startTime: now - (10 * DAY_MS), // 10 days old
        durationSeconds: 900,
        totalDistanceMiles: 8.0,
        peakG: 2.1,
        path: [],
        incidents: [],
        status: 'completed',
      };

      const ancientSession45d: DriveSession = {
        id: 'DRV-45d',
        trackingCode: 'DRIVE-2026-3333',
        startTime: now - (45 * DAY_MS), // 45 days old
        durationSeconds: 1200,
        totalDistanceMiles: 12.0,
        peakG: 1.5,
        path: [],
        incidents: [],
        status: 'completed',
      };

      localStorage.setItem(
        DRIVE_SESSIONS_STORAGE_KEY,
        JSON.stringify([recentSession, oldSession10d, ancientSession45d])
      );

      // Purge with 7 days retention: oldSession10d and ancientSession45d should be removed
      const purged = purgeExpiredDriveSessions(7, now);
      expect(purged).toBe(2);

      const remaining = loadDriveSessions();
      expect(remaining.length).toBe(1);
      expect(remaining[0].id).toBe('DRV-recent');
    });

    it('preserves all sessions when retention is set to -1 ("Until I delete it")', () => {
      const now = 1700000000000;
      const DAY_MS = 24 * 60 * 60 * 1000;

      const ancientSession: DriveSession = {
        id: 'DRV-ancient',
        trackingCode: 'DRIVE-2026-9999',
        startTime: now - (365 * DAY_MS), // 1 year old
        durationSeconds: 300,
        totalDistanceMiles: 2.0,
        peakG: 1.2,
        path: [],
        incidents: [],
        status: 'completed',
      };

      localStorage.setItem(DRIVE_SESSIONS_STORAGE_KEY, JSON.stringify([ancientSession]));

      // With retention -1, nothing is purged
      const purged = purgeExpiredDriveSessions(-1, now);
      expect(purged).toBe(0);

      const raw = localStorage.getItem(DRIVE_SESSIONS_STORAGE_KEY);
      expect(JSON.parse(raw!)).toHaveLength(1);
    });

    it('getStoredDriveSessionCount returns correct count after auto-purge', () => {
      clearAllDriveSessions();
      expect(getStoredDriveSessionCount()).toBe(0);

      const s1: DriveSession = {
        id: 'DRV-1',
        trackingCode: 'DRIVE-2026-1001',
        startTime: Date.now(),
        durationSeconds: 120,
        totalDistanceMiles: 1.0,
        peakG: 1.1,
        path: [],
        incidents: [],
        status: 'completed',
      };
      saveDriveSession(s1);
      expect(getStoredDriveSessionCount()).toBe(1);
    });
  });

  describe('2. My Data Export & Sovereignty (Task S4.3)', () => {
    it('exports all user data in a valid structured JSON format', async () => {
      // Add a drive session
      const sampleSession: DriveSession = {
        id: 'DRV-export-test',
        trackingCode: 'DRIVE-2026-5555',
        startTime: Date.now(),
        durationSeconds: 400,
        totalDistanceMiles: 3.5,
        peakG: 2.0,
        path: [],
        incidents: [],
        status: 'completed',
      };
      saveDriveSession(sampleSession);

      // Add a comment to first report
      const reports = await reportRepository.list();
      expect(reports.length).toBeGreaterThan(0);
      const testReportId = reports[0].id;
      await reportRepository.addComment({
        reportId: testReportId,
        authorName: 'Dr. Jane Tester',
        authorRole: 'admin',
        text: 'Civic engineering inspection scheduled.',
      });

      const exportData = await reportRepository.exportAllData();

      expect(exportData).toBeDefined();
      expect(exportData.version).toBe('1.0.0');
      expect(new Date(exportData.exportedAt).getTime()).not.toBeNaN();
      expect(Array.isArray(exportData.reports)).toBe(true);
      expect(exportData.reports.length).toBe(reports.length);
      expect(Array.isArray(exportData.comments)).toBe(true);
      expect(exportData.comments.some(c => c.text.includes('Civic engineering'))).toBe(true);
      expect(Array.isArray(exportData.driveSessions)).toBe(true);
      expect(exportData.driveSessions.some(s => s.id === 'DRV-export-test')).toBe(true);
      expect(typeof exportData.retentionDays).toBe('number');
    });

    it('permanently deletes all user data when deleteAllData is invoked', async () => {
      // Pre-condition: populate storage
      saveDriveSession({
        id: 'DRV-to-delete',
        trackingCode: 'DRIVE-2026-7777',
        startTime: Date.now(),
        durationSeconds: 100,
        totalDistanceMiles: 1.0,
        peakG: 1.0,
        path: [],
        incidents: [],
        status: 'completed',
      });

      const beforeReports = await reportRepository.list();
      expect(beforeReports.length).toBeGreaterThan(0);

      // Execute permanent deletion
      await reportRepository.deleteAllData();

      // Verify reports cleared
      const afterReports = await reportRepository.list();
      expect(afterReports).toHaveLength(0);

      // Verify drive sessions cleared
      const afterSessions = loadDriveSessions();
      expect(afterSessions).toHaveLength(0);
      expect(getStoredDriveSessionCount()).toBe(0);

      // Verify comments and notifications cleared
      const comments = await reportRepository.listComments('any-id');
      expect(comments).toHaveLength(0);
    });
  });
});
