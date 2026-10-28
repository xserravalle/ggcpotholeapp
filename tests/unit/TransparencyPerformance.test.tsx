import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../helpers/render';
import {
  computeAgencyMetrics,
  computeCommunityScoreboardData,
  getActivityLog,
  filterActivityLog,
  sanitizeCsvCell,
  generateActivityLogCsv,
} from '@/domain/timelineMetrics';
import { PotholeReport, TimelineEntry, UserRole } from '@/domain/types';
import { CommunityScoreboardView } from '@/components/scoreboard/CommunityScoreboardView';
import { PerformanceWorkspaceView } from '@/components/workspaces/PerformanceWorkspaceView';

vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div data-testid="recharts-container" style={{ width: 500, height: 300 }}>
        {children}
      </div>
    ),
  };
});

const createTestReport = (overrides: Partial<PotholeReport> = {}): PotholeReport => ({
  id: 'rep-test-1',
  trackingCode: 'GAP-2026-SMP001',
  title: 'Hazard on Collins Hill',
  roadName: 'Collins Hill Rd',
  address: '1000 University Center Ln',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  authorityId: 'GWINNETT_COUNTY',
  authorityName: 'Gwinnett County DOT',
  assignedAgencyId: 'GWINNETT_COUNTY',
  latitude: 33.98,
  longitude: -84.0,
  severity: 'high',
  status: 'resolved',
  priority: 'high',
  priorityScore: 75,
  verificationsCount: 3,
  userConfirmed: true,
  reportedAt: '2026-08-01T10:00:00.000Z',
  lastVerifiedAt: '2026-08-01T22:00:00.000Z',
  timeline: [],
  estimatedDepthInches: 3,
  estimatedWidthInches: 18,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
  description: 'Test hazard',
  ...overrides,
});

describe('Task 9: Transparency & Performance Analytics', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // --- 1. AVERAGES & ON-TIME PERCENTAGE ON FIXED SAMPLE ---
  describe('1. Averages and On-Time Percentage on Fixed Sample', () => {
    it('computes exact average verification time, fix turnaround, on-time %, and rating strictly from timeline', () => {
      const fixedSample: PotholeReport[] = [
        // Report 1: Gwinnett County DOT (Verify: 12h, Fix: 2.0d, On-time: Yes, Rating: 5)
        createTestReport({
          id: 'rep-1',
          assignedAgencyId: 'GWINNETT_COUNTY',
          reportedAt: '2026-08-01T10:00:00.000Z',
          slaDueAt: '2026-08-05T10:00:00.000Z', // 4 days allowed
          timeline: [
            {
              id: 'tl-1-1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Hazard reported',
              actorName: 'Jordan Citizen',
              actorRole: 'user',
              timestamp: '2026-08-01T10:00:00.000Z',
            },
            {
              id: 'tl-1-2',
              status: 'verified',
              action: 'STATUS_VERIFIED',
              message: 'Verified by DOT',
              actorName: 'Admin',
              actorRole: 'admin',
              timestamp: '2026-08-01T22:00:00.000Z', // +12 hours
            },
            {
              id: 'tl-1-3',
              status: 'in_progress',
              action: 'WORK_STARTED',
              message: 'Crew started work',
              actorName: 'Officer Mendez',
              actorRole: 'officer',
              timestamp: '2026-08-02T10:00:00.000Z',
            },
            {
              id: 'tl-1-4',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Pavement restored',
              actorName: 'Officer Mendez',
              actorRole: 'officer',
              timestamp: '2026-08-03T10:00:00.000Z', // +2 days from report
            },
            {
              id: 'tl-1-5',
              status: 'closed',
              action: 'FIX_RATED',
              message: 'Citizen rated repair quality: 5/5 stars.',
              actorName: 'Jordan Citizen',
              actorRole: 'user',
              timestamp: '2026-08-03T14:00:00.000Z',
            },
          ],
          feedback: { rating: 5 },
        }),

        // Report 2: Gwinnett County DOT (Verify: 24h, Fix: 6.0d, On-time: No, Rating: 3)
        createTestReport({
          id: 'rep-2',
          assignedAgencyId: 'GWINNETT_COUNTY',
          reportedAt: '2026-08-01T10:00:00.000Z',
          slaDueAt: '2026-08-05T10:00:00.000Z', // 4 days allowed, took 6 days
          timeline: [
            {
              id: 'tl-2-1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Hazard reported',
              actorName: 'Taylor Resident',
              actorRole: 'user',
              timestamp: '2026-08-01T10:00:00.000Z',
            },
            {
              id: 'tl-2-2',
              status: 'verified',
              action: 'STATUS_VERIFIED',
              message: 'Verified by DOT',
              actorName: 'Admin',
              actorRole: 'admin',
              timestamp: '2026-08-02T10:00:00.000Z', // +24 hours
            },
            {
              id: 'tl-2-3',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Cavity filled',
              actorName: 'Officer Vance',
              actorRole: 'officer',
              timestamp: '2026-08-07T10:00:00.000Z', // +6 days from report (Late)
            },
            {
              id: 'tl-2-4',
              status: 'closed',
              action: 'FIX_RATED',
              message: 'Citizen rated repair quality: 3/5 stars.',
              actorName: 'Taylor Resident',
              actorRole: 'user',
              timestamp: '2026-08-07T12:00:00.000Z',
            },
          ],
          feedback: { rating: 3 },
        }),

        // Report 3: GGC Internal Campus (Verify: 6h, Fix: 1.0d, On-time: Yes, Rating: 4)
        createTestReport({
          id: 'rep-3',
          assignedAgencyId: 'GGC',
          jurisdiction: 'Georgia Gwinnett College (GGC Facilities)',
          reportedAt: '2026-08-05T10:00:00.000Z',
          slaDueAt: '2026-08-07T10:00:00.000Z',
          timeline: [
            {
              id: 'tl-3-1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Reported on campus',
              actorName: 'Campus Student',
              actorRole: 'user',
              timestamp: '2026-08-05T10:00:00.000Z',
            },
            {
              id: 'tl-3-2',
              status: 'verified',
              action: 'STATUS_VERIFIED',
              message: 'Facilities verified',
              actorName: 'Admin',
              actorRole: 'admin',
              timestamp: '2026-08-05T16:00:00.000Z', // +6 hours
            },
            {
              id: 'tl-3-3',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Campus roadway patched',
              actorName: 'Marcus Sterling',
              actorRole: 'officer',
              timestamp: '2026-08-06T10:00:00.000Z', // +1 day (On time)
            },
          ],
          feedback: { rating: 4 },
        }),
      ];

      // 1. Check Gwinnett County DOT metrics
      const agencyMetrics = computeAgencyMetrics(fixedSample, undefined, new Date('2026-08-10T10:00:00Z'));
      const gwinnett = agencyMetrics.find((m) => m.agencyId === 'GWINNETT_COUNTY');
      expect(gwinnett).toBeDefined();

      // Verify time: (12 + 24) / 2 = 18.0 hours
      expect(gwinnett!.avgVerifyTimeHours).toBe(18);
      // Fix turnaround: (2.0 + 6.0) / 2 = 4.0 days
      expect(gwinnett!.avgFixTimeDays).toBe(4);
      // On-time %: 1 out of 2 = 50%
      expect(gwinnett!.onTimePercentage).toBe(50);
      // Average citizen rating: (5 + 3) / 2 = 4.0
      expect(gwinnett!.avgRating).toBe(4);

      // 2. Check GGC metrics
      const ggc = agencyMetrics.find((m) => m.agencyId === 'GGC');
      expect(ggc).toBeDefined();
      expect(ggc!.avgVerifyTimeHours).toBe(6);
      expect(ggc!.avgFixTimeDays).toBe(1);
      expect(ggc!.onTimePercentage).toBe(100);
      expect(ggc!.avgRating).toBe(4);

      // 3. Check Overall Community Scoreboard metrics
      const scoreboard = computeCommunityScoreboardData(fixedSample, new Date('2026-08-10T10:00:00Z'));
      // Overall avg fix time: (2 + 6 + 1) / 3 = 3.0 days
      expect(scoreboard.overallAvgDaysToFix).toBe(3);
      // Overall on-time: 2 out of 3 = 67%
      expect(scoreboard.overallOnTimePercentage).toBe(67);
      // Overall avg rating: (5 + 3 + 4) / 3 = 4.0
      expect(scoreboard.overallAvgRating).toBe(4);
      // Fixed this month (August 2026): all 3 resolved in August
      expect(scoreboard.fixedThisMonth).toBe(3);
    });
  });

  // --- 2. REOPEN RATE ON FIXED SAMPLE ---
  describe('2. Reopen Rate Strict Calculation', () => {
    it('computes exact reopen rate from timeline STATUS_REOPENED entries', () => {
      const sampleWithReopens: PotholeReport[] = [
        // Resolved and never reopened
        createTestReport({
          id: 'rep-ok-1',
          assignedAgencyId: 'GWINNETT_COUNTY',
          timeline: [
            {
              id: 'tl-a1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Created',
              actorName: 'User',
              actorRole: 'user',
              timestamp: '2026-08-01T10:00:00.000Z',
            },
            {
              id: 'tl-a2',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Resolved',
              actorName: 'Officer',
              actorRole: 'officer',
              timestamp: '2026-08-03T10:00:00.000Z',
            },
          ],
        }),
        // Resolved, then reopened
        createTestReport({
          id: 'rep-reopened-1',
          assignedAgencyId: 'GWINNETT_COUNTY',
          reopenCount: 1,
          timeline: [
            {
              id: 'tl-b1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Created',
              actorName: 'User',
              actorRole: 'user',
              timestamp: '2026-08-01T10:00:00.000Z',
            },
            {
              id: 'tl-b2',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Resolved',
              actorName: 'Officer',
              actorRole: 'officer',
              timestamp: '2026-08-02T10:00:00.000Z',
            },
            {
              id: 'tl-b3',
              status: 'verified',
              action: 'STATUS_REOPENED',
              message: 'Still broken',
              actorName: 'User',
              actorRole: 'user',
              timestamp: '2026-08-04T10:00:00.000Z',
            },
          ],
        }),
        // Resolved and never reopened
        createTestReport({
          id: 'rep-ok-2',
          assignedAgencyId: 'GWINNETT_COUNTY',
          timeline: [
            {
              id: 'tl-c1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Created',
              actorName: 'User',
              actorRole: 'user',
              timestamp: '2026-08-01T10:00:00.000Z',
            },
            {
              id: 'tl-c2',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Resolved',
              actorName: 'Officer',
              actorRole: 'officer',
              timestamp: '2026-08-03T10:00:00.000Z',
            },
          ],
        }),
        // Resolved and never reopened
        createTestReport({
          id: 'rep-ok-3',
          assignedAgencyId: 'GWINNETT_COUNTY',
          timeline: [
            {
              id: 'tl-d1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Created',
              actorName: 'User',
              actorRole: 'user',
              timestamp: '2026-08-01T10:00:00.000Z',
            },
            {
              id: 'tl-d2',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Resolved',
              actorName: 'Officer',
              actorRole: 'officer',
              timestamp: '2026-08-03T10:00:00.000Z',
            },
          ],
        }),
      ];

      // 4 resolved, 1 reopened => reopenRate = 25.0%
      const metrics = computeAgencyMetrics(sampleWithReopens);
      const gwinnett = metrics.find((m) => m.agencyId === 'GWINNETT_COUNTY');
      expect(gwinnett).toBeDefined();
      expect(gwinnett!.resolvedCount).toBe(4);
      expect(gwinnett!.reopenedCount).toBe(1);
      expect(gwinnett!.reopenRate).toBe(25);
    });
  });

  // --- 3. ACTIVITY LOG FILTERS ---
  describe('3. Admin Activity Log Filtering', () => {
    const activityReport1 = createTestReport({
      id: 'act-rep-1',
      trackingCode: 'GAP-2026-ACT001',
      roadName: 'Sugarloaf Pkwy',
      assignedAgencyId: 'GWINNETT_COUNTY',
      timeline: [
        {
          id: 't-1',
          status: 'reported',
          action: 'REPORT_CREATED',
          message: 'Sensor detected impact 7.8G',
          actorName: 'AutoSensor',
          actorRole: 'system',
          timestamp: '2026-08-01T08:00:00.000Z',
        },
        {
          id: 't-2',
          status: 'verified',
          action: 'STATUS_VERIFIED',
          message: 'Accepted by triage lead',
          actorName: 'Admin Morgan',
          actorRole: 'admin',
          timestamp: '2026-08-01T10:00:00.000Z',
        },
        {
          id: 't-3',
          status: 'in_progress',
          action: 'WORK_STARTED',
          message: 'Crew beginning road patch',
          actorName: 'Officer Mendez',
          actorRole: 'officer',
          timestamp: '2026-08-02T09:00:00.000Z',
        },
      ],
    });

    const activityReport2 = createTestReport({
      id: 'act-rep-2',
      trackingCode: 'GAP-2026-ACT002',
      roadName: 'Buford Hwy',
      assignedAgencyId: 'DULUTH',
      timeline: [
        {
          id: 't-4',
          status: 'reported',
          action: 'REPORT_CREATED',
          message: 'Citizen report filed',
          actorName: 'Alice Commuter',
          actorRole: 'user',
          timestamp: '2026-08-02T12:00:00.000Z',
        },
        {
          id: 't-5',
          status: 'resolved',
          action: 'WORK_RESOLVED',
          message: 'Repaired by City of Duluth team',
          actorName: 'Officer Duluth',
          actorRole: 'officer',
          timestamp: '2026-08-03T15:00:00.000Z',
        },
      ],
    });

    it('flattens timeline entries across reports newest first', () => {
      const logs = getActivityLog([activityReport1, activityReport2]);
      expect(logs.length).toBe(5);
      // Newest first: t-5 (Aug 3) should be at index 0
      expect(logs[0].id).toBe('t-5');
      expect(logs[0].action).toBe('WORK_RESOLVED');
      expect(logs[logs.length - 1].id).toBe('t-1');
    });

    it('filters activity log by role', () => {
      const logs = getActivityLog([activityReport1, activityReport2]);

      const officerLogs = filterActivityLog(logs, { role: 'officer' });
      expect(officerLogs.every((l) => l.actorRole === 'officer')).toBe(true);
      expect(officerLogs.length).toBe(2); // t-3 and t-5

      const systemLogs = filterActivityLog(logs, { role: 'system' });
      expect(systemLogs.length).toBe(1);
      expect(systemLogs[0].id).toBe('t-1');

      const adminLogs = filterActivityLog(logs, { role: 'admin' });
      expect(adminLogs.length).toBe(1);
      expect(adminLogs[0].id).toBe('t-2');
    });

    it('filters activity log by action', () => {
      const logs = getActivityLog([activityReport1, activityReport2]);

      const resolveLogs = filterActivityLog(logs, { action: 'WORK_RESOLVED' });
      expect(resolveLogs.length).toBe(1);
      expect(resolveLogs[0].id).toBe('t-5');

      const createdLogs = filterActivityLog(logs, { action: 'REPORT_CREATED' });
      expect(createdLogs.length).toBe(2);
    });

    it('filters activity log by agency', () => {
      const logs = getActivityLog([activityReport1, activityReport2]);

      const duluthLogs = filterActivityLog(logs, { agency: 'DULUTH' });
      expect(duluthLogs.length).toBe(2);
      expect(duluthLogs.every((l) => l.agencyId === 'DULUTH')).toBe(true);

      const countyLogs = filterActivityLog(logs, { agency: 'GWINNETT_COUNTY' });
      expect(countyLogs.length).toBe(3);
    });
  });

  // --- 4. CSV FORMULA INJECTION ESCAPING ---
  describe('4. CSV Formula Injection Escaping', () => {
    it('escapes dangerous spreadsheet formula triggers (=, +, -, @, \\t, \\r)', () => {
      // Equals formula
      expect(sanitizeCsvCell('=SUM(A1:B10)')).toBe('"\'=SUM(A1:B10)"');
      // Plus formula
      expect(sanitizeCsvCell('+cmd|\' /C calc\'!A0')).toBe('"\' +cmd|\' /C calc\'!A0"'.replace("' ", "'"));
      // Minus formula
      expect(sanitizeCsvCell('-2+3*4')).toBe('"\' -2+3*4"'.replace("' ", "'"));
      // At-sign formula
      expect(sanitizeCsvCell('@SUM(1+1)')).toBe('"\'@SUM(1+1)"');
      // Tab character
      expect(sanitizeCsvCell('\tMaliciousTab')).toBe('"\'\tMaliciousTab"');
      // CR character
      expect(sanitizeCsvCell('\rMaliciousCR')).toBe('"\'\rMaliciousCR"');
    });

    it('leaves safe strings unescaped and quotes them properly', () => {
      expect(sanitizeCsvCell('Normal Road Repair')).toBe('"Normal Road Repair"');
      expect(sanitizeCsvCell('Pothole with "quotes" inside')).toBe('"Pothole with ""quotes"" inside"');
      expect(sanitizeCsvCell(42)).toBe('"42"');
      expect(sanitizeCsvCell(null)).toBe('""');
      expect(sanitizeCsvCell(undefined)).toBe('""');
    });

    it('generates fully sanitized CSV content from activity log', () => {
      const maliciousReport = createTestReport({
        trackingCode: '=DDE("cmd";"/C calc";"__dummy__")',
        title: '+cmd|\' /C calc\'!A0',
        timeline: [
          {
            id: 'mal-1',
            status: 'reported',
            action: '@MALICIOUS_ACTION',
            message: '-2+5*9 formula test',
            actorName: '=Hacker',
            actorRole: 'user',
            timestamp: '2026-08-01T10:00:00.000Z',
          },
        ],
      });

      const logs = getActivityLog([maliciousReport]);
      const csv = generateActivityLogCsv(logs);

      // Verify no cell starts directly with dangerous prefix after quote
      expect(csv).toContain('"\'=DDE("');
      expect(csv).toContain('"\'=Hacker"');
      expect(csv).toContain('"\'@MALICIOUS_ACTION"');
      expect(csv).toContain('"\'-2+5*9 formula test"');
    });
  });

  // --- 5. UI COMPONENTS RENDERING ---
  describe('5. UI Components Rendering & Navigation', () => {
    it('renders CommunityScoreboardView with fixed this month, averages, on-time %, and open hazards', () => {
      const sample = [
        createTestReport({
          id: 'sb-1',
          status: 'resolved',
          reportedAt: new Date().toISOString(),
          resolvedAt: new Date().toISOString(),
          timeline: [
            {
              id: 't-1',
              status: 'reported',
              action: 'REPORT_CREATED',
              message: 'Created',
              actorName: 'Citizen',
              actorRole: 'user',
              timestamp: new Date().toISOString(),
            },
            {
              id: 't-2',
              status: 'resolved',
              action: 'WORK_RESOLVED',
              message: 'Resolved',
              actorName: 'Officer',
              actorRole: 'officer',
              timestamp: new Date().toISOString(),
            },
          ],
        }),
        createTestReport({
          id: 'sb-2',
          status: 'in_progress',
          verificationsCount: 9,
        }),
      ];

      render(<CommunityScoreboardView potholes={sample} />);

      expect(screen.getByText('Community Roadway Scoreboard')).toBeTruthy();
      expect(screen.getByText('Fixed This Month')).toBeTruthy();
      expect(screen.getByText('Average Days to Fix')).toBeTruthy();
      expect(screen.getByText('On-Time Resolution')).toBeTruthy();
      expect(screen.getByText('Average Citizen Rating')).toBeTruthy();
      expect(screen.getByText('Most Confirmed Open Hazards')).toBeTruthy();
    });

    it('renders PerformanceWorkspaceView with benchmarks, date filter, and activity log sub-tab', () => {
      render(<PerformanceWorkspaceView potholes={[]} />);

      expect(screen.getByText('Agency Performance & SLA Dashboard')).toBeTruthy();
      expect(screen.getByText('7 Days')).toBeTruthy();
      expect(screen.getByText('30 Days')).toBeTruthy();
      expect(screen.getByText('90 Days')).toBeTruthy();
      expect(screen.getByText('All Time')).toBeTruthy();

      // Switch to Activity Log tab
      const activityTabBtn = screen.getByRole('button', { name: /Audit & Activity Log/i });
      fireEvent.click(activityTabBtn);

      expect(screen.getByText('Comprehensive Civic Activity Log')).toBeTruthy();
      expect(screen.getByText('Export Activity Log (CSV)')).toBeTruthy();
    });
  });
});
