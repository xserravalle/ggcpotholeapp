import { PotholeReport, TimelineEntry, UserRole, ReportPriority } from './types';
import { ReportStatus, isOpenStatus } from './status';
import { isOverdue } from './sla';
import { AGENCY_LABELS } from '../data/officersData';
import { AUTHORITIES_DIRECTORY } from '../data/jurisdictionsData';

export interface AgencyPerformanceMetrics {
  agencyId: string;
  agencyName: string;
  totalReports: number;
  openReportsCount: number;
  verifiedCount: number;
  avgVerifyTimeHours: number; // In hours
  avgVerifyTimeDays: number; // In days
  resolvedCount: number;
  avgFixTimeDays: number; // In days
  onTimeCount: number;
  onTimePercentage: number; // 0 - 100
  overdueCount: number;
  reopenedCount: number;
  reopenRate: number; // 0 - 100
  ratedCount: number;
  avgRating: number; // 1.0 - 5.0 (0 if none)
}

export interface CommunityScoreboardAgencyStat {
  agencyId: string;
  agencyName: string;
  avgDaysToFix: number;
  onTimePercentage: number;
  fixedCount: number;
  avgRating: number;
  openCount: number;
}

export interface CommunityScoreboardData {
  fixedThisMonth: number;
  overallAvgDaysToFix: number;
  overallOnTimePercentage: number;
  overallAvgRating: number;
  totalFixed: number;
  totalOpen: number;
  agencyStats: CommunityScoreboardAgencyStat[];
  mostConfirmedOpenHazards: PotholeReport[];
}

export interface ActivityLogEntry extends TimelineEntry {
  reportId: string;
  trackingCode: string;
  title: string;
  roadName: string;
  jurisdiction: string;
  agencyId: string;
  agencyName: string;
  reportStatus: ReportStatus;
  reportPriority: ReportPriority;
}

export interface ActivityLogFilter {
  role?: string;
  action?: string;
  agency?: string;
  search?: string;
}

/**
 * Resolves an agency key from a report's jurisdiction or assigned agency id.
 */
export function resolveAgencyKey(report: PotholeReport): string {
  if (report.assignedAgencyId) {
    const norm = report.assignedAgencyId.trim().toUpperCase();
    if (AGENCY_LABELS[norm]) return norm;
  }

  if (report.authorityId) {
    const norm = report.authorityId.trim().toUpperCase();
    if (AGENCY_LABELS[norm]) return norm;
  }

  const jur = (report.jurisdiction || '').toLowerCase();
  if (jur.includes('campus') || jur.includes('georgia gwinnett') || jur.includes('ggc')) {
    return 'GGC';
  }
  if (jur.includes('gdot') || jur.includes('state route') || jur.includes('highway') || jur.includes('interstate')) {
    return 'GDOT';
  }
  if (jur.includes('lawrenceville')) return 'LAWRENCEVILLE';
  if (jur.includes('duluth')) return 'DULUTH';
  if (jur.includes('suwanee')) return 'SUWANEE';
  if (jur.includes('peachtree corners')) return 'PEACHTREE_CORNERS';
  if (jur.includes('norcross')) return 'NORCROSS';
  if (jur.includes('snellville')) return 'SNELLVILLE';
  if (jur.includes('buford')) return 'BUFORD';
  if (jur.includes('lilburn')) return 'LILBURN';
  if (jur.includes('sugar hill')) return 'SUGAR_HILL';
  if (jur.includes('dacula')) return 'DACULA';

  return 'GWINNETT_COUNTY';
}

/**
 * Returns a human-friendly display name for an agency key.
 */
export function resolveAgencyName(agencyKey: string): string {
  if (AGENCY_LABELS[agencyKey]) {
    // Strip leading emoji if present for clean table display
    return AGENCY_LABELS[agencyKey].replace(/^[^\w\s]+\s*/, '');
  }
  const auth = AUTHORITIES_DIRECTORY[agencyKey];
  if (auth) return auth.name;
  return agencyKey.replace(/_/g, ' ');
}

/**
 * Returns expected SLA target days for an agency.
 */
export function getAgencyTargetDays(agencyKey: string): number {
  const auth = AUTHORITIES_DIRECTORY[agencyKey];
  if (auth && auth.slaTargetDays) {
    return auth.slaTargetDays;
  }
  return 7; // Default 7 business days
}

/**
 * Extracts creation timestamp strictly from report timeline (falling back to reportedAt).
 */
export function extractCreationTimestamp(report: PotholeReport): string {
  if (report.timeline && report.timeline.length > 0) {
    const createEntry = report.timeline.find(
      (e) => e.action === 'REPORT_CREATED' || e.status === 'reported'
    );
    if (createEntry) return createEntry.timestamp;
    return report.timeline[0].timestamp;
  }
  return report.reportedAt;
}

/**
 * Extracts verification timestamp strictly from report timeline.
 */
export function extractVerificationTimestamp(report: PotholeReport): string | null {
  if (!report.timeline || report.timeline.length === 0) {
    return report.status !== 'reported' ? report.reportedAt : null;
  }
  // Find first verification action in timeline
  const verifyEntry = report.timeline.find(
    (e) =>
      e.action === 'STATUS_VERIFIED' ||
      e.action === 'TRIAGE_VERIFIED' ||
      e.action.includes('VERIF')
  );
  if (verifyEntry) return verifyEntry.timestamp;
  return null;
}

/**
 * Extracts resolution timestamp strictly from report timeline (or resolvedAt).
 */
export function extractResolutionTimestamp(report: PotholeReport): string | null {
  if (report.timeline && report.timeline.length > 0) {
    // Find the latest resolution event in the timeline
    for (let i = report.timeline.length - 1; i >= 0; i--) {
      const e = report.timeline[i];
      if (e.action === 'WORK_RESOLVED' || e.action.includes('RESOLV')) {
        return e.timestamp;
      }
    }
  }
  return report.resolvedAt || null;
}

/**
 * Checks if a report was reopened based strictly on its timeline.
 */
export function isReportReopened(report: PotholeReport): boolean {
  if (report.timeline && report.timeline.length > 0) {
    const hasReopenEntry = report.timeline.some(
      (e) =>
        e.action === 'STATUS_REOPENED' ||
        e.action === 'WORK_REOPENED' ||
        e.action.toUpperCase().includes('REOPEN')
    );
    if (hasReopenEntry) return true;
  }
  return Boolean(report.reopenCount && report.reopenCount > 0);
}

/**
 * Extracts citizen feedback rating strictly from report feedback or timeline.
 */
export function extractReportRating(report: PotholeReport): number | null {
  if (report.feedback && typeof report.feedback.rating === 'number') {
    return report.feedback.rating;
  }
  if (report.timeline && report.timeline.length > 0) {
    for (const e of report.timeline) {
      if (e.action === 'FIX_RATED') {
        const match = e.message.match(/(\d(\.\d)?)\/5/);
        if (match) {
          const parsed = parseFloat(match[1]);
          if (!isNaN(parsed) && parsed >= 1 && parsed <= 5) return parsed;
        }
      }
    }
  }
  return null;
}

/**
 * Computes comprehensive performance metrics per agency strictly from report timelines.
 * Accepts an optional dateRangeDays filter (7, 30, 90, or undefined for all).
 */
export function computeAgencyMetrics(
  reports: PotholeReport[],
  dateRangeDays?: number,
  now = new Date()
): AgencyPerformanceMetrics[] {
  const cutoffTime =
    dateRangeDays && dateRangeDays > 0
      ? now.getTime() - dateRangeDays * 24 * 60 * 60 * 1000
      : 0;

  // Filter reports by date window if specified
  const filteredReports = reports.filter((report) => {
    if (cutoffTime <= 0) return true;
    const createdAt = new Date(extractCreationTimestamp(report)).getTime();
    const resolvedAt = extractResolutionTimestamp(report);
    const resolvedTime = resolvedAt ? new Date(resolvedAt).getTime() : 0;
    return createdAt >= cutoffTime || resolvedTime >= cutoffTime;
  });

  // Group by agency
  const agencyBuckets = new Map<string, PotholeReport[]>();

  for (const report of filteredReports) {
    const key = resolveAgencyKey(report);
    if (!agencyBuckets.has(key)) {
      agencyBuckets.set(key, []);
    }
    agencyBuckets.get(key)!.push(report);
  }

  const results: AgencyPerformanceMetrics[] = [];

  for (const [agencyId, agencyReports] of agencyBuckets.entries()) {
    const totalReports = agencyReports.length;
    let openReportsCount = 0;
    let verifiedCount = 0;
    let totalVerifyTimeHours = 0;
    let resolvedCount = 0;
    let totalFixTimeDays = 0;
    let onTimeCount = 0;
    let overdueCount = 0;
    let reopenedCount = 0;
    let ratedCount = 0;
    let totalRating = 0;

    const targetDays = getAgencyTargetDays(agencyId);

    for (const report of agencyReports) {
      const createdStr = extractCreationTimestamp(report);
      const createdTime = new Date(createdStr).getTime();

      // Check open
      if (isOpenStatus(report.status)) {
        openReportsCount++;
        if (isOverdue(report, now)) {
          overdueCount++;
        }
      }

      // Check verification time from timeline
      const verifiedStr = extractVerificationTimestamp(report);
      if (verifiedStr) {
        verifiedCount++;
        const verifyTime = new Date(verifiedStr).getTime();
        const diffHours = Math.max(0, (verifyTime - createdTime) / (1000 * 60 * 60));
        totalVerifyTimeHours += diffHours;
      }

      // Check resolution time and SLA on-time from timeline
      const resolvedStr = extractResolutionTimestamp(report);
      if (resolvedStr) {
        resolvedCount++;
        const resolveTime = new Date(resolvedStr).getTime();
        const diffDays = Math.max(0, (resolveTime - createdTime) / (1000 * 60 * 60 * 24));
        totalFixTimeDays += diffDays;

        // SLA deadline calculation
        const deadline = report.slaDueAt
          ? new Date(report.slaDueAt).getTime()
          : createdTime + targetDays * 24 * 60 * 60 * 1000;

        if (resolveTime <= deadline) {
          onTimeCount++;
        }
      }

      // Check reopen from timeline
      if (isReportReopened(report)) {
        reopenedCount++;
      }

      // Check rating from timeline / feedback
      const rating = extractReportRating(report);
      if (rating !== null) {
        ratedCount++;
        totalRating += rating;
      }
    }

    const avgVerifyTimeHours = verifiedCount > 0 ? totalVerifyTimeHours / verifiedCount : 0;
    const avgVerifyTimeDays = avgVerifyTimeHours / 24;
    const avgFixTimeDays = resolvedCount > 0 ? totalFixTimeDays / resolvedCount : 0;
    const onTimePercentage =
      resolvedCount > 0 ? Math.round((onTimeCount / resolvedCount) * 100) : 100;
    const reopenRate =
      resolvedCount > 0 ? Math.round((reopenedCount / resolvedCount) * 1000) / 10 : 0;
    const avgRating = ratedCount > 0 ? Math.round((totalRating / ratedCount) * 10) / 10 : 0;

    results.push({
      agencyId,
      agencyName: resolveAgencyName(agencyId),
      totalReports,
      openReportsCount,
      verifiedCount,
      avgVerifyTimeHours: Math.round(avgVerifyTimeHours * 10) / 10,
      avgVerifyTimeDays: Math.round(avgVerifyTimeDays * 10) / 10,
      resolvedCount,
      avgFixTimeDays: Math.round(avgFixTimeDays * 10) / 10,
      onTimeCount,
      onTimePercentage,
      overdueCount,
      reopenedCount,
      reopenRate,
      ratedCount,
      avgRating,
    });
  }

  // Sort agencies by total reports descending
  return results.sort((a, b) => b.totalReports - a.totalReports);
}

/**
 * Computes public Community Scoreboard metrics strictly from report timelines.
 */
export function computeCommunityScoreboardData(
  reports: PotholeReport[],
  now = new Date()
): CommunityScoreboardData {
  let fixedThisMonth = 0;
  let totalFixTimeDays = 0;
  let totalResolved = 0;
  let totalOnTime = 0;
  let totalRating = 0;
  let totalRated = 0;
  let totalOpen = 0;

  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  for (const report of reports) {
    if (isOpenStatus(report.status)) {
      totalOpen++;
    }

    const createdTime = new Date(extractCreationTimestamp(report)).getTime();
    const resolvedStr = extractResolutionTimestamp(report);

    if (resolvedStr) {
      totalResolved++;
      const resolvedDate = new Date(resolvedStr);
      const resolveTime = resolvedDate.getTime();

      // Check if fixed this month
      if (
        resolvedDate.getFullYear() === currentYear &&
        resolvedDate.getMonth() === currentMonth
      ) {
        fixedThisMonth++;
      }

      // Fix days
      const days = Math.max(0, (resolveTime - createdTime) / (1000 * 60 * 60 * 24));
      totalFixTimeDays += days;

      // On-time SLA
      const agencyKey = resolveAgencyKey(report);
      const targetDays = getAgencyTargetDays(agencyKey);
      const deadline = report.slaDueAt
        ? new Date(report.slaDueAt).getTime()
        : createdTime + targetDays * 24 * 60 * 60 * 1000;

      if (resolveTime <= deadline) {
        totalOnTime++;
      }
    }

    const rating = extractReportRating(report);
    if (rating !== null) {
      totalRated++;
      totalRating += rating;
    }
  }

  const overallAvgDaysToFix =
    totalResolved > 0 ? Math.round((totalFixTimeDays / totalResolved) * 10) / 10 : 0;
  const overallOnTimePercentage =
    totalResolved > 0 ? Math.round((totalOnTime / totalResolved) * 100) : 100;
  const overallAvgRating =
    totalRated > 0 ? Math.round((totalRating / totalRated) * 10) / 10 : 0;

  // Agency specific stats
  const agencyMetrics = computeAgencyMetrics(reports, undefined, now);
  const agencyStats: CommunityScoreboardAgencyStat[] = agencyMetrics.map((m) => ({
    agencyId: m.agencyId,
    agencyName: m.agencyName,
    avgDaysToFix: m.avgFixTimeDays,
    onTimePercentage: m.onTimePercentage,
    fixedCount: m.resolvedCount,
    avgRating: m.avgRating,
    openCount: m.openReportsCount,
  }));

  // Most confirmed open hazards (sorted by confirmations descending)
  const mostConfirmedOpenHazards = reports
    .filter((r) => isOpenStatus(r.status))
    .sort((a, b) => (b.verificationsCount || 0) - (a.verificationsCount || 0))
    .slice(0, 8);

  return {
    fixedThisMonth,
    overallAvgDaysToFix,
    overallOnTimePercentage,
    overallAvgRating,
    totalFixed: totalResolved,
    totalOpen,
    agencyStats,
    mostConfirmedOpenHazards,
  };
}

/**
 * Extracts and flattens every timeline entry across all reports into an activity log,
 * sorted newest first.
 */
export function getActivityLog(reports: PotholeReport[]): ActivityLogEntry[] {
  const entries: ActivityLogEntry[] = [];

  for (const report of reports) {
    const agencyId = resolveAgencyKey(report);
    const agencyName = resolveAgencyName(agencyId);

    // If report has no timeline, create a baseline report created entry
    const reportTimeline =
      report.timeline && report.timeline.length > 0
        ? report.timeline
        : [
            {
              id: `tl-gen-${report.id}`,
              status: report.status,
              action: 'REPORT_CREATED',
              message: report.description || 'Hazard reported by citizen.',
              actorName: report.reporterName || 'Citizen Commuter',
              actorRole: 'user' as UserRole,
              timestamp: report.reportedAt,
            },
          ];

    for (const item of reportTimeline) {
      entries.push({
        ...item,
        reportId: report.id,
        trackingCode: report.trackingCode || `#${report.id.slice(-6)}`,
        title: report.title,
        roadName: report.roadName || report.address,
        jurisdiction: report.jurisdiction,
        agencyId,
        agencyName,
        reportStatus: report.status,
        reportPriority: report.priority,
      });
    }
  }

  // Sort newest first
  return entries.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

/**
 * Filters the activity log by role, action, agency, and free text search.
 */
export function filterActivityLog(
  entries: ActivityLogEntry[],
  filters: ActivityLogFilter
): ActivityLogEntry[] {
  return entries.filter((entry) => {
    if (filters.role && filters.role !== 'all') {
      if (entry.actorRole !== filters.role) return false;
    }

    if (filters.action && filters.action !== 'all') {
      const normAction = entry.action.toUpperCase();
      const normFilter = filters.action.toUpperCase();
      if (!normAction.includes(normFilter)) return false;
    }

    if (filters.agency && filters.agency !== 'all') {
      const normAgency = filters.agency.toUpperCase();
      if (
        entry.agencyId.toUpperCase() !== normAgency &&
        !entry.agencyName.toUpperCase().includes(normAgency)
      ) {
        return false;
      }
    }

    if (filters.search && filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      const match =
        entry.trackingCode.toLowerCase().includes(q) ||
        entry.title.toLowerCase().includes(q) ||
        entry.roadName.toLowerCase().includes(q) ||
        entry.message.toLowerCase().includes(q) ||
        entry.actorName.toLowerCase().includes(q) ||
        entry.action.toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });
}

/**
 * Sanitizes CSV cell values to neutralize formula injection attacks (=, +, -, @, tab, cr).
 */
export function sanitizeCsvCell(value: string | number | boolean | null | undefined): string {
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

/**
 * Generates CSV string for the activity log with formula injection protection.
 */
export function generateActivityLogCsv(entries: ActivityLogEntry[]): string {
  const headers = [
    'Timestamp',
    'Action',
    'Actor Name',
    'Actor Role',
    'Tracking Code',
    'Road Name',
    'Agency',
    'Report Status',
    'Priority',
    'Message',
  ];

  const rows = entries.map((e) => [
    sanitizeCsvCell(e.timestamp),
    sanitizeCsvCell(e.action),
    sanitizeCsvCell(e.actorName),
    sanitizeCsvCell(e.actorRole),
    sanitizeCsvCell(e.trackingCode),
    sanitizeCsvCell(e.roadName),
    sanitizeCsvCell(e.agencyName),
    sanitizeCsvCell(e.reportStatus),
    sanitizeCsvCell(e.reportPriority),
    sanitizeCsvCell(e.message),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

/**
 * Triggers a client-side CSV download in the browser.
 */
export function downloadActivityLogCsv(
  entries: ActivityLogEntry[],
  filename = 'gwinnett_civic_activity_log.csv'
): void {
  const csvContent = generateActivityLogCsv(entries);
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
