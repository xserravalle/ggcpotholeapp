import { describe, it, expect, beforeEach } from 'vitest';
import { LocalStorageReportRepository } from '@/repository/LocalStorageReportRepository';
import { PotholeReport, Actor, UserRole } from '@/domain/types';
import { INITIAL_POTHOLES } from '@/data/potholesData';

describe('LocalStorageReportRepository (Layer 2)', () => {
  let repo: LocalStorageReportRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageReportRepository();
  });

  describe('CRUD operations & Filtering', () => {
    it('initializes list from INITIAL_POTHOLES if localStorage is empty', async () => {
      const list = await repo.list();
      expect(list.length).toBe(INITIAL_POTHOLES.length);
    });

    it('saves a new report and retrieves it by ID', async () => {
      const newReport: PotholeReport = {
        id: 'test-rep-001',
        trackingCode: 'GAP-2026-TEST01',
        title: 'Deep trench on Collins Hill',
        roadName: 'Collins Hill Rd',
        address: '1000 University Center Ln',
        city: 'Lawrenceville',
        jurisdiction: 'Georgia Gwinnett College (Internal Campus)',
        authorityId: 'GGC',
        latitude: 33.9801,
        longitude: -84.0055,
        severity: 'critical',
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 1,
        userConfirmed: true,
        reportedAt: '2026-10-01T10:00:00Z',
        reporterName: 'Jordan Student',
        reporterEmail: 'jordan@ggc.edu',
        priority: 'critical',
        priorityScore: 85,
        timeline: [
          {
            id: 'time-init',
            status: 'reported',
            action: 'REPORT_CREATED',
            message: 'Report submitted by citizen',
            actorName: 'Jordan Student',
            actorRole: 'user',
            timestamp: '2026-10-01T10:00:00Z',
          },
        ],
        source: 'user',
      };

      const saved = await repo.save(newReport);
      expect(saved.id).toBe('test-rep-001');

      const retrieved = await repo.get('test-rep-001');
      expect(retrieved).not.toBeNull();
      expect(retrieved?.title).toBe('Deep trench on Collins Hill');
      expect(retrieved?.reporterName).toBe('Jordan Student');
    });

    it('filters reports by status, agency, and search query', async () => {
      const sample = await repo.loadSampleWorkflow();
      expect(sample.length).toBe(10);

      // Filter by status
      const reportedOnly = await repo.list({ status: 'reported' });
      expect(reportedOnly.every(r => r.status === 'reported')).toBe(true);

      const resolvedOnly = await repo.list({ status: 'resolved' });
      expect(resolvedOnly.every(r => r.status === 'resolved')).toBe(true);

      // Filter by agency
      const ggcOnly = await repo.list({ agencyId: 'GGC' });
      expect(ggcOnly.length).toBeGreaterThan(0);
      expect(ggcOnly.every(r => r.authorityId === 'GGC' || r.assignedAgencyId === 'GGC' || r.jurisdiction?.includes('GGC'))).toBe(true);

      // Filter by search query
      const searchResults = await repo.list({ searchQuery: 'Collins' });
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults.every(r => 
        r.roadName.includes('Collins') || 
        r.address.includes('Collins') || 
        r.title.includes('Collins')
      )).toBe(true);
    });

    it('deletes a report from repository', async () => {
      const listBefore = await repo.list();
      const targetId = listBefore[0].id;

      await repo.delete(targetId);

      const listAfter = await repo.list();
      expect(listAfter.find(r => r.id === targetId)).toBeUndefined();
      expect(await repo.get(targetId)).toBeNull();
    });
  });

  describe('Atomic dispatch and Civic Actions', () => {
    it('dispatches "verify" action atomically updating status, timeline, and notifications', async () => {
      const report: PotholeReport = {
        id: 'dispatch-rep-01',
        trackingCode: 'GAP-2026-DISP01',
        title: 'Rim Bender near Building B',
        roadName: 'University Center Ln',
        address: '1000 University Center Ln',
        jurisdiction: 'Georgia Gwinnett College (Internal Campus)',
        authorityId: 'GGC',
        latitude: 33.9805,
        longitude: -84.006,
        severity: 'severe',
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 2,
        userConfirmed: true,
        reportedAt: '2026-10-02T08:00:00Z',
        reporterName: 'Alex Citizen',
        reporterEmail: 'alex@example.org',
        priority: 'high',
        priorityScore: 75,
        timeline: [],
        source: 'user',
      };
      await repo.save(report);

      const adminActor: Actor = {
        name: 'Supervisor Vance',
        email: 'vance@ggc.edu',
        role: 'admin',
        agencyId: 'GGC',
      };

      const result = await repo.dispatch('dispatch-rep-01', 'verify', adminActor, {
        notes: 'Pothole confirmed on campus grounds',
      });

      expect(result.report.status).toBe('verified');
      expect(result.report.timeline.length).toBe(2);
      const lastEntry = result.report.timeline[result.report.timeline.length - 1];
      expect(lastEntry.action).toBe('STATUS_VERIFIED');
      expect(lastEntry.actorName).toBe('Supervisor Vance');

      // Check persisted state in repository
      const savedInRepo = await repo.get('dispatch-rep-01');
      expect(savedInRepo?.status).toBe('verified');

      // Check notification sent to reporter
      const citizenNotifs = await repo.listNotifications({ role: 'user', email: 'alex@example.org' });
      expect(citizenNotifs.length).toBeGreaterThanOrEqual(1);
      expect(citizenNotifs[0].title).toContain('Verified');
    });

    it('dispatches "reject" with a specific reason and notifies reporter', async () => {
      const report: PotholeReport = {
        id: 'dispatch-rep-02',
        trackingCode: 'GAP-2026-DISP02',
        title: 'Duplicate gravel patch',
        roadName: 'Highway 120',
        address: '500 Hwy 120',
        jurisdiction: 'Gwinnett County DOT',
        authorityId: 'GWINNETT_COUNTY',
        latitude: 33.95,
        longitude: -84.02,
        severity: 'minor',
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 1,
        userConfirmed: true,
        reportedAt: '2026-10-02T09:00:00Z',
        reporterName: 'Morgan Resident',
        reporterEmail: 'morgan@gmail.com',
        priority: 'low',
        priorityScore: 20,
        timeline: [],
        source: 'user',
      };
      await repo.save(report);

      const adminActor: Actor = {
        name: 'Triage Admin',
        role: 'admin',
      };

      const result = await repo.dispatch('dispatch-rep-02', 'reject', adminActor, {
        reason: 'duplicate',
        notes: 'Already tracked under docket GAP-2026-EXISTING',
      });

      expect(result.report.status).toBe('rejected');
      expect(result.report.rejectedReason).toBe('duplicate');

      const notifs = await repo.listNotifications({ role: 'user', email: 'morgan@gmail.com' });
      expect(notifs.length).toBeGreaterThanOrEqual(1);
      expect(notifs[0].message).toContain('duplicate');
    });

    it('dispatches "assign", "startWork", "resolve" full flow with officer and citizen notifications', async () => {
      const report: PotholeReport = {
        id: 'dispatch-flow-01',
        trackingCode: 'GAP-2026-FLOW01',
        title: 'Deep Crater on Buford Hwy',
        roadName: 'Buford Hwy NE',
        address: '4200 Buford Hwy',
        jurisdiction: 'Gwinnett County DOT',
        authorityId: 'GWINNETT_COUNTY',
        latitude: 33.96,
        longitude: -84.05,
        severity: 'critical',
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 3,
        userConfirmed: true,
        reportedAt: '2026-10-01T07:00:00Z',
        reporterName: 'Samantha Reporter',
        reporterEmail: 'sam@example.com',
        priority: 'critical',
        priorityScore: 90,
        timeline: [],
        source: 'user',
      };
      await repo.save(report);

      const admin: Actor = { name: 'Admin Dispatcher', role: 'admin' };
      const officer: Actor = { name: 'Officer Miller', email: 'miller@gwinnettcounty.com', role: 'officer', agencyId: 'GWINNETT_COUNTY' };

      // 1. Verify
      await repo.dispatch(report.id, 'verify', admin);

      // 2. Assign
      await repo.dispatch(report.id, 'assign', admin, {
        assignedAgencyId: 'GWINNETT_COUNTY',
        assignedOfficerId: 'miller@gwinnettcounty.com',
        assignedCrew: 'North Asphalt Crew 3',
      });

      const assignedReport = await repo.get(report.id);
      expect(assignedReport?.status).toBe('assigned');
      expect(assignedReport?.assignedOfficerId).toBe('miller@gwinnettcounty.com');

      // Notification checked for assigned officer
      const officerNotifs = await repo.listNotifications({ role: 'officer', email: 'miller@gwinnettcounty.com' });
      expect(officerNotifs.length).toBeGreaterThanOrEqual(1);

      // 3. Start work
      await repo.dispatch(report.id, 'startWork', officer);
      const inProgressReport = await repo.get(report.id);
      expect(inProgressReport?.status).toBe('in_progress');

      // 4. Resolve
      await repo.dispatch(report.id, 'resolve', officer, {
        notes: 'Patch completed with hot asphalt mix',
      });
      const resolvedReport = await repo.get(report.id);
      expect(resolvedReport?.status).toBe('resolved');
      expect(resolvedReport?.resolvedAt).toBeDefined();

      // Notification sent to citizen that work is resolved
      const samNotifs = await repo.listNotifications({ role: 'user', email: 'sam@example.com' });
      const resolveNotif = samNotifs.find(n => n.title.includes('Repaired') || n.title.includes('Resolved'));
      expect(resolveNotif).toBeDefined();
    });
  });

  describe('Comments and Notification Rules', () => {
    it('creates comments with id, timestamp, text, authorName, authorRole', async () => {
      const cmt = await repo.addComment({
        reportId: 'rep-cmt-01',
        text: 'Cold patch crew deployed to inspect this section.',
        authorName: 'Supervisor Vance',
        authorRole: 'admin',
      });

      expect(cmt.id).toBeDefined();
      expect(cmt.timestamp).toBeDefined();
      expect(cmt.text).toBe('Cold patch crew deployed to inspect this section.');
      expect(cmt.authorName).toBe('Supervisor Vance');
      expect(cmt.authorRole).toBe('admin');

      const allComments = await repo.listComments('rep-cmt-01');
      expect(allComments.length).toBe(1);
      expect(allComments[0].id).toBe(cmt.id);
    });

    it('rejects comments exceeding 1000 characters', async () => {
      const longText = 'A'.repeat(1001);

      await expect(repo.addComment({
        reportId: 'rep-cmt-02',
        text: longText,
        authorName: 'User',
        authorRole: 'user',
      })).rejects.toThrow(/1000 characters/i);
    });

    it('notifies reporter and officer on comment, but NEVER the comment author', async () => {
      const report: PotholeReport = {
        id: 'rep-notif-comment',
        trackingCode: 'GAP-2026-CMT01',
        title: 'Dangerous dip on Lawrenceville Hwy',
        roadName: 'Lawrenceville Hwy',
        address: '1200 Lawrenceville Hwy',
        jurisdiction: 'GDOT District 1',
        latitude: 33.95,
        longitude: -84.01,
        severity: 'high',
        hazardType: 'POTHOLE',
        status: 'assigned',
        verificationsCount: 1,
        userConfirmed: true,
        reportedAt: '2026-10-03T10:00:00Z',
        reporterName: 'Reporter Alice',
        reporterEmail: 'alice@example.com',
        assignedOfficerId: 'officer_dave',
        priority: 'high',
        priorityScore: 70,
        timeline: [],
        source: 'user',
      };
      await repo.save(report);

      // Case 1: Admin Vance writes a comment
      await repo.addComment({
        reportId: report.id,
        text: 'Crew is scheduled for tomorrow 8am.',
        authorName: 'Supervisor Vance',
        authorRole: 'admin',
      });

      // Reporter Alice MUST receive a notification
      const aliceNotifs = await repo.listNotifications({ role: 'user', email: 'alice@example.com' });
      expect(aliceNotifs.some(n => n.message.includes('Supervisor Vance'))).toBe(true);

      // Officer Dave MUST receive a notification
      const daveNotifs = await repo.listNotifications({ role: 'officer', name: 'officer_dave' });
      expect(daveNotifs.some(n => n.message.includes('Supervisor Vance'))).toBe(true);

      // Supervisor Vance (the author) must NOT receive a notification
      const vanceNotifs = await repo.listNotifications({ role: 'admin', name: 'Supervisor Vance' });
      expect(vanceNotifs.length).toBe(0);

      // Case 2: Reporter Alice writes a reply
      await repo.addComment({
        reportId: report.id,
        text: 'Thank you for following up!',
        authorName: 'Reporter Alice',
        authorRole: 'user',
      });

      // Alice herself must NOT receive a notification for her own comment
      const aliceNotifsAfter = await repo.listNotifications({ role: 'user', email: 'alice@example.com' });
      const selfNotif = aliceNotifsAfter.find(n => n.message.includes('Reporter Alice commented'));
      expect(selfNotif).toBeUndefined();
    });
  });

  describe('Storage Quota & Notification Capping (~5MB safeguard)', () => {
    it('caps notifications at 100 entries per recipient key', async () => {
      const recipientRole: UserRole = 'officer';
      const recipientEmail = 'patrol_chief@gwinnettcounty.com';

      const report: PotholeReport = {
        id: 'cap-test-rep',
        trackingCode: 'GAP-2026-CAP01',
        title: 'Test for capping',
        roadName: 'Highway 316',
        address: 'Hwy 316 @ Collins Hill',
        jurisdiction: 'GDOT',
        latitude: 33.97,
        longitude: -84.00,
        severity: 'moderate',
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 1,
        userConfirmed: true,
        reportedAt: '2026-10-01T00:00:00Z',
        reporterName: 'Reporter A',
        reporterEmail: 'rep_a@test.com',
        assignedOfficerId: recipientEmail,
        priority: 'medium',
        priorityScore: 50,
        timeline: [],
        source: 'user',
      };
      await repo.save(report);

      // Post 105 comments by another user so this officer receives 105 notifications
      for (let i = 1; i <= 105; i++) {
        await repo.addComment({
          reportId: report.id,
          text: `Update event index ${i}`,
          authorName: 'Admin Poster',
          authorRole: 'admin',
        });
      }

      const notifs = await repo.listNotifications({ role: 'officer', email: recipientEmail });
      expect(notifs.length).toBe(100);

      // Oldest notifications (1 through 5) should have been trimmed out
      const hasOldest = notifs.some(n => n.message.includes('index 1 ') || n.message.includes('index 2 '));
      const hasNewest = notifs.some(n => n.message.includes('index 105'));
      expect(hasOldest).toBe(false);
      expect(hasNewest).toBe(true);
    });

    it('marks single and all notifications as read', async () => {
      const report: PotholeReport = {
        id: 'mark-read-rep',
        trackingCode: 'GAP-2026-READ',
        title: 'Pothole for mark read',
        roadName: 'Sugarloaf Pkwy',
        address: 'Sugarloaf Pkwy',
        jurisdiction: 'Gwinnett County',
        latitude: 33.97,
        longitude: -84.01,
        severity: 'moderate',
        hazardType: 'POTHOLE',
        status: 'reported',
        verificationsCount: 1,
        userConfirmed: true,
        reportedAt: '2026-10-01T00:00:00Z',
        reporterName: 'Citizen Mark',
        reporterEmail: 'mark@test.com',
        priority: 'medium',
        priorityScore: 50,
        timeline: [],
        source: 'user',
      };
      await repo.save(report);

      await repo.addComment({
        reportId: report.id,
        text: 'Notification 1',
        authorName: 'Admin',
        authorRole: 'admin',
      });
      await repo.addComment({
        reportId: report.id,
        text: 'Notification 2',
        authorName: 'Admin',
        authorRole: 'admin',
      });

      const notifs = await repo.listNotifications({ role: 'user', email: 'mark@test.com' });
      expect(notifs.length).toBe(2);
      expect(notifs[0].read).toBeFalsy();

      // Mark single as read
      await repo.markRead(notifs[0].id);
      const afterSingle = await repo.listNotifications({ role: 'user', email: 'mark@test.com' });
      expect(afterSingle.find(n => n.id === notifs[0].id)?.read).toBe(true);
      expect(afterSingle.find(n => n.id === notifs[1].id)?.read).toBeFalsy();

      // Mark all as read
      await repo.markAllRead({ role: 'user', email: 'mark@test.com' });
      const afterAll = await repo.listNotifications({ role: 'user', email: 'mark@test.com' });
      expect(afterAll.every(n => n.read)).toBe(true);
    });
  });

  describe('Admin Demo Tools', () => {
    it('loadSampleWorkflow seeds 10 reports spanning all 7 statuses with detailed timelines', async () => {
      const samples = await repo.loadSampleWorkflow();

      expect(samples.length).toBe(10);

      // Verify all 7 statuses are represented
      const statuses = new Set(samples.map(s => s.status));
      expect(statuses.has('reported')).toBe(true);
      expect(statuses.has('verified')).toBe(true);
      expect(statuses.has('assigned')).toBe(true);
      expect(statuses.has('in_progress')).toBe(true);
      expect(statuses.has('resolved')).toBe(true);
      expect(statuses.has('closed')).toBe(true);
      expect(statuses.has('rejected')).toBe(true);

      // Verify realistic timelines and SLA targets
      for (const rep of samples) {
        expect(rep.timeline.length).toBeGreaterThanOrEqual(1);
        expect(rep.priorityScore).toBeGreaterThanOrEqual(0);
        expect(rep.priorityScore).toBeLessThanOrEqual(100);
        expect(rep.slaDueAt).toBeDefined();

        if (rep.status === 'resolved') {
          expect(rep.resolvedAt).toBeDefined();
        }
        if (rep.status === 'rejected') {
          expect(rep.rejectedReason).toBeDefined();
        }
        if (rep.status === 'assigned' || rep.status === 'in_progress') {
          expect(rep.assignedAgencyId).toBeDefined();
        }
      }
    });

    it('resetDemoData restores INITIAL_POTHOLES and clears comments and notifications', async () => {
      // First, seed sample workflow and add a comment
      await repo.loadSampleWorkflow();
      await repo.addComment({
        reportId: 'any-id',
        text: 'A temporary comment',
        authorName: 'Temp Author',
        authorRole: 'user',
      });

      // Now reset
      await repo.resetDemoData();

      const list = await repo.list();
      expect(list.length).toBe(INITIAL_POTHOLES.length);

      const comments = await repo.listComments('any-id');
      expect(comments.length).toBe(0);

      const notifs = await repo.listNotifications({ role: 'admin' });
      expect(notifs.length).toBe(0);
    });
  });
});
