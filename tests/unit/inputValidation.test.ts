import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  validatePotholeReport,
  validateComment,
  validateCitizenFeedback,
  validateActionPayload,
} from '@/services/reportValidator';
import {
  loadStoredPotholes,
  checkStorageQuota,
  repairOrSanitizeReport,
  STORAGE_KEY,
} from '@/services/storageService';
import { compressImageFile } from '@/utils/imageCompressor';
import { LocalStorageReportRepository } from '@/repository/LocalStorageReportRepository';
import { PotholeReport } from '@/domain/types';

describe('Task S3: Input Validation and Storage Hardening', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('1. Centralized Field Validation (reportValidator.ts)', () => {
    const validReport: Partial<PotholeReport> = {
      title: 'Pothole on Main St',
      description: 'Dangerous pothole near the intersection.',
      landmark: 'Next to library',
      reporterName: 'Jane Citizen',
      reporterEmail: 'jane@example.com',
      latitude: 33.98,
      longitude: -84.01,
      estimatedDepthInches: 3.5,
      estimatedWidthInches: 18,
    };

    it('passes for valid input fields', () => {
      const res = validatePotholeReport(validReport);
      expect(res.isValid).toBe(true);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    it('enforces title length limits (min 3, max 100)', () => {
      const tooShort = validatePotholeReport({ ...validReport, title: 'Hi' });
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.errors.some(e => e.includes('Title must be at least'))).toBe(true);

      const tooLong = validatePotholeReport({ ...validReport, title: 'A'.repeat(101) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.some(e => e.includes('Title must not exceed'))).toBe(true);
    });

    it('enforces description limit (max 1000)', () => {
      const tooLong = validatePotholeReport({ ...validReport, description: 'A'.repeat(1001) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.some(e => e.includes('Description must not exceed'))).toBe(true);
    });

    it('enforces landmark limit (max 200)', () => {
      const tooLong = validatePotholeReport({ ...validReport, landmark: 'L'.repeat(201) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.some(e => e.includes('Landmark must not exceed'))).toBe(true);
    });

    it('enforces reporter name limit (max 100)', () => {
      const tooLong = validatePotholeReport({ ...validReport, reporterName: 'N'.repeat(101) });
      expect(tooLong.isValid).toBe(false);
      expect(tooLong.errors.some(e => e.includes('Reporter name must not exceed'))).toBe(true);
    });

    it('enforces email format and length limits (max 254)', () => {
      const invalidFormat = validatePotholeReport({ ...validReport, reporterEmail: 'invalid-email' });
      expect(invalidFormat.isValid).toBe(false);
      expect(invalidFormat.errors.some(e => e.includes('valid email address'))).toBe(true);

      const tooLongEmail = 'a'.repeat(245) + '@example.com'; // > 254
      const invalidLength = validatePotholeReport({ ...validReport, reporterEmail: tooLongEmail });
      expect(invalidLength.isValid).toBe(false);
    });

    it('enforces coordinate boundaries and numeric validity', () => {
      const invalidLat = validatePotholeReport({ ...validReport, latitude: 95.0 });
      expect(invalidLat.isValid).toBe(false);
      expect(invalidLat.errors.some(e => e.includes('Invalid latitude'))).toBe(true);

      const invalidLng = validatePotholeReport({ ...validReport, longitude: -195.0 });
      expect(invalidLng.isValid).toBe(false);
      expect(invalidLng.errors.some(e => e.includes('Invalid longitude'))).toBe(true);

      const nanLat = validatePotholeReport({ ...validReport, latitude: NaN });
      expect(nanLat.isValid).toBe(false);
    });

    it('enforces estimated dimension ranges', () => {
      const invalidDepth = validatePotholeReport({ ...validReport, estimatedDepthInches: -1 });
      expect(invalidDepth.isValid).toBe(false);

      const crazyDepth = validatePotholeReport({ ...validReport, estimatedDepthInches: 150 });
      expect(crazyDepth.isValid).toBe(false);

      const invalidWidth = validatePotholeReport({ ...validReport, estimatedWidthInches: 600 });
      expect(invalidWidth.isValid).toBe(false);
    });

    it('validates comments (max 1000 chars, non-empty)', () => {
      expect(validateComment('').isValid).toBe(false);
      expect(validateComment('   ').isValid).toBe(false);
      expect(validateComment('A'.repeat(1001)).isValid).toBe(false);

      const validComm = validateComment('Work completed smoothly.');
      expect(validComm.isValid).toBe(true);
      expect(validComm.errors).toHaveLength(0);
    });

    it('validates citizen feedback (rating 1-5, comment max 1000)', () => {
      expect(validateCitizenFeedback({ rating: 0 }).isValid).toBe(false);
      expect(validateCitizenFeedback({ rating: 6 }).isValid).toBe(false);
      expect(validateCitizenFeedback({ rating: 5, comment: 'C'.repeat(1001) }).isValid).toBe(false);
      expect(validateCitizenFeedback({ rating: 5, comment: 'Great job!' }).isValid).toBe(true);
    });

    it('validates action payloads notes and comments', () => {
      expect(validateActionPayload('REJECT', { rejectedReason: 'invalid_reason' as any }).isValid).toBe(false);
      expect(validateActionPayload('REJECT', { rejectedReason: 'duplicate', note: 'Too long '.repeat(150) }).isValid).toBe(false);
      expect(validateActionPayload('RESOLVE', { note: 'Too long '.repeat(150) }).isValid).toBe(false);
      expect(validateActionPayload('RESOLVE', { note: '' }).isValid).toBe(false);
      expect(validateActionPayload('RESOLVE', { note: 'Patched asphalt and sealed edges' }).isValid).toBe(true);
      expect(validateActionPayload('REJECT', { rejectedReason: 'not_a_pothole', note: 'Checked location' }).isValid).toBe(true);
    });
  });

  describe('2. Untrusted Storage Recovery (storageService.ts)', () => {
    it('handles syntax error and corrupted JSON string without throwing', () => {
      localStorage.setItem(STORAGE_KEY, '{corrupted, garbage json: true');
      const loaded = loadStoredPotholes();
      expect(Array.isArray(loaded)).toBe(true);
      expect(loaded.length).toBeGreaterThan(0); // Fallbacks to INITIAL_POTHOLES
    });

    it('handles primitive values or non-arrays in localStorage', () => {
      localStorage.setItem(STORAGE_KEY, '"just a string"');
      expect(Array.isArray(loadStoredPotholes())).toBe(true);

      localStorage.setItem(STORAGE_KEY, '12345');
      expect(Array.isArray(loadStoredPotholes())).toBe(true);

      localStorage.setItem(STORAGE_KEY, '{"foo": "bar"}');
      expect(Array.isArray(loadStoredPotholes())).toBe(true);
    });

    it('filters out nulls and corrupted elements in array without crashing', () => {
      const corruptArray = JSON.stringify([null, undefined, 42, 'string-item']);
      localStorage.setItem(STORAGE_KEY, corruptArray);
      const loaded = loadStoredPotholes();
      expect(Array.isArray(loaded)).toBe(true);
    });

    it('repairs damaged report records and sanitizes fields via repairOrSanitizeReport', () => {
      const damagedRecord: any = {
        id: 'corrupt-1',
        title: '   ', // empty title
        latitude: '33.9845', // string instead of number
        longitude: null, // missing longitude
        status: 'non_existent_status',
        severity: 'invalid_severity',
        timeline: null,
      };

      const repaired = repairOrSanitizeReport(damagedRecord);
      expect(repaired).not.toBeNull();
      expect(repaired!.id).toBe('corrupt-1');
      expect(typeof repaired!.latitude).toBe('number');
      expect(typeof repaired!.longitude).toBe('number');
      expect(repaired!.title.length).toBeGreaterThanOrEqual(3);
      expect(repaired!.status).toBe('reported');
      expect(repaired!.severity).toBe('moderate');
      expect(Array.isArray(repaired!.timeline)).toBe(true);
    });
  });

  describe('3. Photo Validation and Compression Limits (imageCompressor.ts)', () => {
    it('rejects unsupported MIME types like image/gif and application/pdf', async () => {
      const gifBlob = new Blob(['fake gif data'], { type: 'image/gif' });
      const gifFile = new File([gifBlob], 'sample.gif', { type: 'image/gif' });

      await expect(compressImageFile(gifFile)).rejects.toThrow(/Unsupported photo format/);

      const pdfBlob = new Blob(['fake pdf data'], { type: 'application/pdf' });
      const pdfFile = new File([pdfBlob], 'document.pdf', { type: 'application/pdf' });

      await expect(compressImageFile(pdfFile)).rejects.toThrow(/Unsupported photo format/);
    });
  });

  describe('4. Storage Quota Calculations and Warnings (storageService.ts)', () => {
    it('computes storage bytes and percentage correctly', () => {
      const quota = checkStorageQuota();
      expect(quota.usedBytes).toBeGreaterThanOrEqual(0);
      expect(quota.percentUsed).toBeGreaterThanOrEqual(0);
      expect(quota.percentageUsed).toBeGreaterThanOrEqual(0);
      expect(quota.isNearQuota).toBe(false);
      expect(quota.isExceeded).toBe(false);
      expect(quota.isOverQuota).toBe(false);
    });

    it('identifies near-quota condition when localStorage has high usage', () => {
      // 2.1 million characters in UTF-16 = ~4.2 MB >= 80% of 5MB
      const largeData = 'A'.repeat(Math.floor(2.1 * 1024 * 1024));
      localStorage.setItem('large-usage-test-key', largeData);

      const quota = checkStorageQuota();
      expect(quota.isNearQuota).toBe(true);
      expect(quota.percentUsed).toBeGreaterThanOrEqual(80);
      expect(quota.percentageUsed).toBeGreaterThanOrEqual(80);
      expect(quota.warningMessage).not.toBeNull();
    });
  });

  describe('5. Repository Validation Enforcement (LocalStorageReportRepository)', () => {
    let repo: LocalStorageReportRepository;

    beforeEach(() => {
      repo = new LocalStorageReportRepository();
    });

    it('rejects saving a report that fails input validation', async () => {
      const invalidReport: any = {
        id: 'bad-1',
        title: 'X', // too short (<3)
        latitude: 200, // out of range
        longitude: 0,
        status: 'reported',
      };

      await expect(repo.save(invalidReport)).rejects.toThrow(/Report validation failed/);
    });

    it('rejects adding a comment with invalid length or empty text', async () => {
      await expect(
        repo.addComment({ reportId: 'any-id', text: '', authorName: 'User', authorRole: 'user' })
      ).rejects.toThrow(/Comment validation failed/);

      await expect(
        repo.addComment({ reportId: 'any-id', text: 'A'.repeat(1001), authorName: 'User', authorRole: 'user' })
      ).rejects.toThrow(/Comment validation failed/);
    });

    it('rejects dispatching actions with invalid action payloads', async () => {
      const adminActor = {
        id: 'admin-1',
        name: 'Admin',
        role: 'admin' as const,
      };

      const validReport: PotholeReport = {
        id: 'valid-rep-1',
        title: 'Main Street Pothole',
        latitude: 33.98,
        longitude: -84.01,
        status: 'reported',
        severity: 'moderate',
        hazardType: 'POTHOLE',
        verificationsCount: 0,
        userConfirmed: false,
        reportedAt: new Date().toISOString(),
        timeline: [],
      };
      await repo.save(validReport);

      await expect(
        repo.dispatch('valid-rep-1', 'reject', adminActor, {
          reason: 'duplicate',
          message: 'R'.repeat(1001),
        })
      ).rejects.toThrow(/Action payload validation failed/);
    });
  });
});
