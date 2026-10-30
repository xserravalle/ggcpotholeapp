import { ReportRepository, ReportFilter, RecipientFilter, UserDataExport } from './ReportRepository';
import { PotholeReport, Comment, NotificationMessage, Actor, UserRole, TimelineEntry } from '../domain/types';
import { CivicAction } from '../domain/permissions';
import { ActionPayload, ApplyActionResult, applyAction } from '../domain/actions';
import { priorityScore, suggestPriority } from '../domain/priority';
import { INITIAL_POTHOLES } from '../data/potholesData';
import { loadStoredPotholes, saveStoredPotholes, migrateReport } from '../services/storageService';
import { generateSampleWorkflowReports } from './sampleWorkflowData';
import { validatePotholeReport, validateActionPayload, validateComment } from '../services/reportValidator';
import { loadDriveSessions, clearAllDriveSessions, getDriveRetentionDays } from '../services/driveSessionService';

/**
 * Storage keys:
 * - Reports: 'ggc-pothole-patrol-reports-v2' (preserves existing storage key)
 * - Comments: 'ggc-pothole-comments-v1'
 * - Notifications: 'ggc-pothole-notifications-v1'
 *
 * STORAGE QUOTA NOTE:
 * Web browsers enforce a synchronous localStorage quota of approximately 5MB (UTF-16 text).
 * To prevent storage exhaustion in persistent sessions, notifications are automatically capped
 * at a maximum of 100 entries per recipient key. Oldest notifications for each recipient
 * are pruned whenever new events arrive.
 */
const STORAGE_KEY_REPORTS = 'ggc-pothole-patrol-reports-v2';
const STORAGE_KEY_COMMENTS = 'ggc-pothole-comments-v1';
const STORAGE_KEY_NOTIFICATIONS = 'ggc-pothole-notifications-v1';
const MAX_NOTIFICATIONS_PER_RECIPIENT = 100;

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export class LocalStorageReportRepository implements ReportRepository {
  // --- REPORTS ---

  async list(filter?: ReportFilter): Promise<PotholeReport[]> {
    const list = loadStoredPotholes(INITIAL_POTHOLES);
    if (!filter) return list;

    return list.filter(report => {
      // 1. Status filter
      if (filter.status && filter.status !== 'all') {
        if (Array.isArray(filter.status)) {
          if (!filter.status.includes(report.status)) return false;
        } else if (report.status !== filter.status) {
          return false;
        }
      }

      // 2. Agency filter
      if (filter.agencyId && filter.agencyId !== 'all') {
        const agencyLower = filter.agencyId.toLowerCase();
        const matchesAgency =
          (report.authorityId && report.authorityId.toLowerCase() === agencyLower) ||
          (report.assignedAgencyId && report.assignedAgencyId.toLowerCase() === agencyLower) ||
          (report.jurisdiction && report.jurisdiction.toLowerCase().includes(agencyLower));
        if (!matchesAgency) return false;
      }

      // 3. Officer filter
      if (filter.officerId && filter.officerId !== 'all') {
        const offLower = filter.officerId.toLowerCase();
        const matchesOfficer =
          (report.assignedOfficerId && report.assignedOfficerId.toLowerCase() === offLower) ||
          (report.assignedCrew && report.assignedCrew.toLowerCase().includes(offLower));
        if (!matchesOfficer) return false;
      }

      // 4. Reporter email/name
      if (filter.reporterEmail) {
        if (
          !report.reporterEmail ||
          report.reporterEmail.trim().toLowerCase() !== filter.reporterEmail.trim().toLowerCase()
        ) {
          return false;
        }
      }
      if (filter.reporterName) {
        if (
          !report.reporterName ||
          report.reporterName.trim().toLowerCase() !== filter.reporterName.trim().toLowerCase()
        ) {
          return false;
        }
      }

      // 5. Severity filter
      if (filter.severity && filter.severity !== 'all') {
        if (report.severity !== filter.severity) return false;
      }

      // 6. User confirmed only
      if (filter.onlyUserConfirmed && !report.userConfirmed && report.source !== 'user') {
        return false;
      }

      // 7. Search query
      if (filter.searchQuery && filter.searchQuery.trim()) {
        const q = filter.searchQuery.trim().toLowerCase();
        const match =
          report.title.toLowerCase().includes(q) ||
          report.address.toLowerCase().includes(q) ||
          report.roadName.toLowerCase().includes(q) ||
          report.jurisdiction.toLowerCase().includes(q) ||
          (report.trackingCode || '').toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }

  async get(id: string): Promise<PotholeReport | null> {
    const list = loadStoredPotholes(INITIAL_POTHOLES);
    const found = list.find(r => r.id === id);
    return found ? migrateReport(found) : null;
  }

  async save(report: PotholeReport): Promise<PotholeReport> {
    const validation = validatePotholeReport(report);
    if (!validation.valid) {
      throw new Error(`Report validation failed: ${validation.errors.join('; ')}`);
    }

    const migrated = migrateReport(report);
    const list = loadStoredPotholes(INITIAL_POTHOLES);
    const index = list.findIndex(r => r.id === migrated.id);

    let updatedList: PotholeReport[];
    if (index >= 0) {
      updatedList = [...list];
      updatedList[index] = migrated;
    } else {
      updatedList = [migrated, ...list];
    }

    saveStoredPotholes(updatedList);
    return migrated;
  }

  async delete(id: string): Promise<void> {
    const list = loadStoredPotholes(INITIAL_POTHOLES);
    const updated = list.filter(r => r.id !== id);
    saveStoredPotholes(updated);
  }

  async dispatch(
    id: string,
    action: CivicAction,
    actor: Actor,
    payload?: ActionPayload
  ): Promise<ApplyActionResult> {
    const report = await this.get(id);
    if (!report) {
      throw new Error(`Cannot dispatch action "${action}": Report with ID "${id}" was not found.`);
    }

    // Validate payload against civic limits so UI cannot bypass
    const actionValidation = validateActionPayload(action, payload);
    if (!actionValidation.valid) {
      throw new Error(`Action payload validation failed: ${actionValidation.errors.join('; ')}`);
    }

    // Call domain event transition
    const result = applyAction(report, action, actor, payload);

    // Save report and append emitted notifications
    await this.save(result.report);

    if (result.notifications.length > 0) {
      await this.saveNotifications(result.notifications);
    }

    // If this is a merge, also update target master report with added confirmations
    if (action === 'merge' && payload?.mergedIntoId) {
      const target = await this.get(payload.mergedIntoId);
      if (target) {
        const addedCount = report.verificationsCount || 1;
        const newTargetCount = (target.verificationsCount || 0) + addedCount;
        target.verificationsCount = newTargetCount;
        const nowIso = new Date().toISOString();
        target.lastVerifiedAt = nowIso;
        target.priorityScore = priorityScore(target);
        target.priority = suggestPriority(target.priorityScore);

        const mergeTimelineEntry: TimelineEntry = {
          id: generateId('tle'),
          status: target.status,
          action: 'MERGED_CONFIRMATION',
          message: `Merged duplicate report #${report.trackingCode || report.id}. Added +${addedCount} community confirmations (Total: ${newTargetCount}).`,
          actorName: actor.name,
          actorRole: actor.role,
          timestamp: nowIso,
        };
        target.timeline = [mergeTimelineEntry, ...(target.timeline || [])];

        await this.save(target);
      }
    }

    return result;
  }

  // --- COMMENTS ---

  async listComments(reportId: string): Promise<Comment[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
      if (!raw) return [];
      let allComments: unknown;
      try {
        allComments = JSON.parse(raw);
      } catch {
        return [];
      }
      if (!Array.isArray(allComments)) return [];
      return allComments
        .filter((c): c is Comment => Boolean(c && typeof c === 'object' && typeof c.id === 'string' && typeof c.text === 'string' && typeof c.reportId === 'string'))
        .filter(c => c.reportId === reportId);
    } catch {
      return [];
    }
  }

  async addComment(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> {
    const commentValidation = validateComment(comment.text, comment.authorName);
    if (!commentValidation.valid) {
      throw new Error(`Comment validation failed: ${commentValidation.errors.join('; ')}`);
    }

    const timestamp = new Date().toISOString();
    const newComment: Comment = {
      id: generateId('cmt'),
      reportId: comment.reportId,
      authorName: comment.authorName.trim(),
      authorRole: comment.authorRole,
      text: comment.text.trim(),
      timestamp,
    };

    // 1. Save comment to storage
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
      let allComments: Comment[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            allComments = parsed.filter(c => c && typeof c === 'object' && typeof c.id === 'string');
          }
        } catch {
          allComments = [];
        }
      }
      allComments.push(newComment);
      localStorage.setItem(STORAGE_KEY_COMMENTS, JSON.stringify(allComments));
    } catch (err: any) {
      console.error('Failed to save comment to localStorage', err);
      const isQuota = err?.name === 'QuotaExceededError' || err?.code === 22;
      if (isQuota && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('storage-quota-warning', { detail: { message: 'Storage quota exceeded while saving comment.', isQuota: true } })
        );
      }
    }

    // 2. Generate notifications
    const report = await this.get(comment.reportId);
    if (report) {
      const pendingNotifications: NotificationMessage[] = [];
      const authorNameLower = comment.authorName.trim().toLowerCase();

      // Check reporter notification
      const reporterNameLower = report.reporterName?.trim().toLowerCase();
      const isAuthorReporter =
        authorNameLower === reporterNameLower ||
        (comment.authorRole === 'user' && comment.authorName === report.reporterName);

      if (report.reporterName && !isAuthorReporter) {
        pendingNotifications.push({
          id: generateId('notif'),
          recipientRole: 'user',
          recipientName: report.reporterName,
          recipientEmail: report.reporterEmail,
          title: `New Comment on #${report.trackingCode || report.id}`,
          message: `${comment.authorName} (${comment.authorRole}): "${comment.text.slice(0, 120)}${comment.text.length > 120 ? '...' : ''}"`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
          read: false,
        });
      }

      // Check assigned officer notification
      if (report.assignedOfficerId) {
        const officerLower = report.assignedOfficerId.trim().toLowerCase();
        const isAuthorOfficer = authorNameLower === officerLower;

        if (!isAuthorOfficer) {
          pendingNotifications.push({
            id: generateId('notif'),
            recipientRole: 'officer',
            recipientName: report.assignedOfficerId,
            title: `Citizen Update on Assigned Work Order #${report.trackingCode || report.id}`,
            message: `${comment.authorName}: "${comment.text.slice(0, 120)}${comment.text.length > 120 ? '...' : ''}"`,
            reportId: report.id,
            trackingCode: report.trackingCode,
            timestamp,
            read: false,
          });
        }
      }

      if (pendingNotifications.length > 0) {
        await this.saveNotifications(pendingNotifications);
      }
    }

    return newComment;
  }

  // --- NOTIFICATIONS & CAPPING ---

  async listNotifications(recipient: RecipientFilter): Promise<NotificationMessage[]> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (!raw) return [];
      let all: unknown;
      try {
        all = JSON.parse(raw);
      } catch {
        return [];
      }
      if (!Array.isArray(all)) return [];

      const sanitized = all.filter((n): n is NotificationMessage => Boolean(n && typeof n === 'object' && typeof n.id === 'string' && typeof n.recipientRole === 'string'));

      return sanitized.filter(n => {
        // Admin gets all admin notifications
        if (recipient.role === 'admin') {
          return n.recipientRole === 'admin';
        }

        // Officer gets officer notifications matching their identity
        if (recipient.role === 'officer') {
          if (n.recipientRole !== 'officer') return false;
          if (!recipient.name) return true;
          return n.recipientName?.toLowerCase() === recipient.name.toLowerCase();
        }

        // Citizen (user / guest)
        if (recipient.role === 'user' || recipient.role === 'guest') {
          if (n.recipientRole !== 'user' && n.recipientRole !== 'guest') return false;
          if (recipient.email && n.recipientEmail) {
            return recipient.email.toLowerCase() === n.recipientEmail.toLowerCase();
          }
          if (recipient.name && n.recipientName) {
            return recipient.name.toLowerCase() === n.recipientName.toLowerCase();
          }
          return true;
        }

        return false;
      }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch {
      return [];
    }
  }

  async markRead(notificationId: string): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (!raw) return;
      let all: unknown;
      try {
        all = JSON.parse(raw);
      } catch {
        return;
      }
      if (!Array.isArray(all)) return;

      const updated = all
        .filter((n): n is NotificationMessage => Boolean(n && typeof n === 'object' && typeof n.id === 'string'))
        .map(n => n.id === notificationId ? { ...n, read: true } : n);
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to mark notification as read', err);
    }
  }

  async markAllRead(recipient: RecipientFilter): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      if (!raw) return;
      let all: unknown;
      try {
        all = JSON.parse(raw);
      } catch {
        return;
      }
      if (!Array.isArray(all)) return;

      const updated = all
        .filter((n): n is NotificationMessage => Boolean(n && typeof n === 'object' && typeof n.id === 'string'))
        .map(n => {
          const matchesRole =
            recipient.role === 'admin'
              ? n.recipientRole === 'admin'
              : recipient.role === 'officer'
              ? n.recipientRole === 'officer' && (!recipient.name || n.recipientName?.toLowerCase() === recipient.name.toLowerCase())
              : (n.recipientRole === 'user' || n.recipientRole === 'guest') &&
                (!recipient.email || n.recipientEmail?.toLowerCase() === recipient.email.toLowerCase());

          return matchesRole ? { ...n, read: true } : n;
        });

      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(updated));
    } catch (err) {
      console.error('Failed to mark all notifications as read', err);
    }
  }

  private async saveNotifications(newNotifs: NotificationMessage[]): Promise<void> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      let existing: NotificationMessage[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            existing = parsed.filter(n => n && typeof n === 'object' && typeof n.id === 'string');
          }
        } catch {
          existing = [];
        }
      }
      const combined = [...newNotifs, ...existing];

      // Cap at 100 entries per recipient key to respect localStorage ~5MB limit
      const capped = this.capNotifications(combined, MAX_NOTIFICATIONS_PER_RECIPIENT);
      localStorage.setItem(STORAGE_KEY_NOTIFICATIONS, JSON.stringify(capped));
    } catch (err: any) {
      console.error('Failed to persist notifications to localStorage', err);
      const isQuota = err?.name === 'QuotaExceededError' || err?.code === 22;
      if (isQuota && typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(
          new CustomEvent('storage-quota-warning', { detail: { message: 'Storage quota exceeded while saving notifications.', isQuota: true } })
        );
      }
    }
  }

  /**
   * Enforces the maximum notification quota per recipient identity.
   */
  private capNotifications(
    list: NotificationMessage[],
    maxPerRecipient: number
  ): NotificationMessage[] {
    const groups = new Map<string, NotificationMessage[]>();

    for (const notif of list) {
      const recipientKey = `${notif.recipientRole}:${notif.recipientEmail || notif.recipientName || 'all'}`;
      if (!groups.has(recipientKey)) {
        groups.set(recipientKey, []);
      }
      const group = groups.get(recipientKey)!;
      if (group.length < maxPerRecipient) {
        group.push(notif);
      }
    }

    const result: NotificationMessage[] = [];
    for (const group of groups.values()) {
      result.push(...group);
    }
    return result;
  }

  // --- DEMO TOOLS ---

  async resetDemoData(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY_REPORTS);
    localStorage.removeItem(STORAGE_KEY_COMMENTS);
    localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
    loadStoredPotholes(INITIAL_POTHOLES);
  }

  async resetDemo(): Promise<void> {
    return this.resetDemoData();
  }

  async loadSampleWorkflow(): Promise<PotholeReport[]> {
    const sampleReports = generateSampleWorkflowReports();
    saveStoredPotholes(sampleReports);
    return sampleReports;
  }

  // --- DATA SOVEREIGNTY (TASK S4) ---

  async exportAllData(): Promise<UserDataExport> {
    const reports = await this.list();
    let comments: Comment[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_COMMENTS);
      comments = raw ? JSON.parse(raw) : [];
    } catch {
      comments = [];
    }

    let notifications: NotificationMessage[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY_NOTIFICATIONS);
      notifications = raw ? JSON.parse(raw) : [];
    } catch {
      notifications = [];
    }

    const driveSessions = loadDriveSessions();
    const retentionDays = getDriveRetentionDays();

    return {
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
      reports,
      comments,
      notifications,
      driveSessions,
      retentionDays,
    };
  }

  async deleteAllData(): Promise<void> {
    try {
      localStorage.removeItem(STORAGE_KEY_REPORTS);
      localStorage.removeItem(STORAGE_KEY_COMMENTS);
      localStorage.removeItem(STORAGE_KEY_NOTIFICATIONS);
      clearAllDriveSessions();
      saveStoredPotholes([]);
    } catch (e) {
      console.error('Failed to delete all data:', e);
    }
  }
}

export const reportRepository = new LocalStorageReportRepository();
