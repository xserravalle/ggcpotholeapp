import { describe, it, expect, beforeEach } from 'vitest';
import { isSupabaseConfigured, supabaseAuth } from '@/services/supabaseClient';
import { supabaseReportRepository } from '@/repository/SupabaseReportRepository';
import { reportRepository } from '@/repository/LocalStorageReportRepository';

describe('Task S5: Real Backend Architecture & Supabase RLS Layer', () => {
  beforeEach(async () => {
    localStorage.clear();
    await reportRepository.resetDemoData();
  });

  describe('1. Environment Detection and Offline Sandbox Fallback', () => {
    it('detects unconfigured backend and operates in demo mode by default', () => {
      expect(isSupabaseConfigured()).toBe(false);
    });

    it('falls back to local storage repository for report listing and retrieval', async () => {
      const reports = await supabaseReportRepository.list();
      expect(reports.length).toBeGreaterThan(0);

      const first = reports[0];
      const fetched = await supabaseReportRepository.get(first.id);
      expect(fetched).not.toBeNull();
      expect(fetched?.id).toBe(first.id);
    });

    it('falls back to local storage repository for civic action dispatching', async () => {
      const reports = await supabaseReportRepository.list();
      const reported = reports.find(r => r.status === 'reported') || reports[0];

      const result = await supabaseReportRepository.dispatch(
        reported.id,
        'verify',
        { role: 'admin', name: 'Director Smith' },
        { notes: 'Field crew verified on site.' }
      );

      expect(result.report).toBeDefined();
      expect(result.report.status).toBe('verified');
      expect(result.timelineEntry).toBeDefined();
    });

    it('falls back to local storage for comments and notifications', async () => {
      const reports = await supabaseReportRepository.list();
      const testReportId = reports[0].id;

      const comment = await supabaseReportRepository.addComment({
        reportId: testReportId,
        authorName: 'Inspector Vance',
        authorRole: 'officer',
        text: 'Cold patch applied as interim safety measure.',
      });

      expect(comment.id).toBeDefined();
      expect(comment.text).toContain('Cold patch');

      const comments = await supabaseReportRepository.listComments(testReportId);
      expect(comments.some(c => c.id === comment.id)).toBe(true);

      const notifs = await supabaseReportRepository.listNotifications({ role: 'admin' });
      expect(Array.isArray(notifs)).toBe(true);
    });
  });

  describe('2. Supabase Auth and Apple-Mandated Account Deletion', () => {
    it('reports failure gracefully if signInWithPassword is run without backend env vars', async () => {
      const result = await supabaseAuth.signInWithPassword('test@example.com', 'password123');
      expect(result.session).toBeNull();
      expect(result.error).toContain('Supabase backend is not configured');
    });

    it('reports failure gracefully if signUp is run without backend env vars', async () => {
      const result = await supabaseAuth.signUp('test@example.com', 'password123', 'Tester');
      expect(result.session).toBeNull();
      expect(result.error).toContain('Supabase backend is not configured');
    });

    it('clears stored session tokens on signOut', async () => {
      localStorage.setItem('ggc-supabase-auth-token', JSON.stringify({ accessToken: 'mock-token' }));
      await supabaseAuth.signOut();
      expect(localStorage.getItem('ggc-supabase-auth-token')).toBeNull();
    });
  });

  describe('3. Data Sovereignty and Backend Wiping', () => {
    it('exports complete user data via supabaseReportRepository', async () => {
      const exported = await supabaseReportRepository.exportAllData();
      expect(exported.version).toBe('1.0.0');
      expect(Array.isArray(exported.reports)).toBe(true);
      expect(Array.isArray(exported.comments)).toBe(true);
      expect(Array.isArray(exported.notifications)).toBe(true);
      expect(Array.isArray(exported.driveSessions)).toBe(true);
    });

    it('wipes all local records when deleteAllData is executed', async () => {
      await supabaseReportRepository.deleteAllData();
      const remaining = await supabaseReportRepository.list();
      expect(remaining).toHaveLength(0);
    });
  });
});
