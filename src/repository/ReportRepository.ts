import { PotholeReport, Comment, NotificationMessage, Actor, UserRole, SeverityLevel } from '../domain/types';
import { ReportStatus } from '../domain/status';
import { CivicAction } from '../domain/permissions';
import { ActionPayload, ApplyActionResult } from '../domain/actions';

export interface ReportFilter {
  status?: ReportStatus | ReportStatus[] | 'all';
  agencyId?: string;
  officerId?: string;
  reporterEmail?: string;
  reporterName?: string;
  severity?: SeverityLevel | 'all';
  searchQuery?: string;
  onlyUserConfirmed?: boolean;
}

export interface RecipientFilter {
  role: UserRole;
  name?: string;
  email?: string;
}

/**
 * Async, Promise-based repository interface representing Layer 2.
 * Abstracted so components never touch localStorage directly, allowing future
 * transition to an external backend like Supabase or PostgreSQL.
 */
export interface ReportRepository {
  /**
   * Retrieves reports matching an optional filter criteria.
   */
  list(filter?: ReportFilter): Promise<PotholeReport[]>;

  /**
   * Retrieves a single report by its unique ID.
   */
  get(id: string): Promise<PotholeReport | null>;

  /**
   * Saves or updates a report.
   */
  save(report: PotholeReport): Promise<PotholeReport>;

  /**
   * Deletes a report by unique ID.
   */
  delete(id: string): Promise<void>;

  /**
   * Dispatches a civic action using domain applyAction, atomically persisting
   * the updated report, its new timeline entry, and any emitted notifications.
   */
  dispatch(
    id: string,
    action: CivicAction,
    actor: Actor,
    payload?: ActionPayload
  ): Promise<ApplyActionResult>;

  /**
   * Lists chronological comments posted on a specific report.
   */
  listComments(reportId: string): Promise<Comment[]>;

  /**
   * Posts a new comment on a report (max 1000 characters).
   * Notifies the reporter and the assigned officer, never the author.
   */
  addComment(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment>;

  /**
   * Retrieves notifications for a given recipient role/identity.
   */
  listNotifications(recipient: RecipientFilter): Promise<NotificationMessage[]>;

  /**
   * Marks a single notification as read.
   */
  markRead(notificationId: string): Promise<void>;

  /**
   * Marks all notifications as read for a given recipient.
   */
  markAllRead(recipient: RecipientFilter): Promise<void>;

  /**
   * Admin demo tool: Resets reports back to INITIAL_POTHOLES, clearing comments and notifications.
   */
  resetDemoData(): Promise<void>;

  /**
   * Admin demo tool: Seeds ~10 realistic reports across all 7 civic workflow statuses with detailed timelines.
   */
  loadSampleWorkflow(): Promise<PotholeReport[]>;

  /**
   * Data sovereignty (Task S4): Exports all user reports, comments, notifications,
   * drive history sessions, and retention preferences as a structured JSON object.
   */
  exportAllData(): Promise<UserDataExport>;

  /**
   * Data sovereignty (Task S4): Permanently wipes all user-stored data across
   * reports, comments, notifications, and drive sessions.
   */
  deleteAllData(): Promise<void>;
}

export interface UserDataExport {
  exportedAt: string;
  version: string;
  reports: PotholeReport[];
  comments: Comment[];
  notifications: NotificationMessage[];
  driveSessions: any[];
  retentionDays: number;
}
