import { 
  ReportRepository, 
  ReportFilter, 
  RecipientFilter, 
  UserDataExport 
} from './ReportRepository';
import { 
  PotholeReport, 
  Comment, 
  NotificationMessage, 
  Actor, 
  UserRole, 
  TimelineEntry 
} from '../domain/types';
import { CivicAction } from '../domain/permissions';
import { ActionPayload, ApplyActionResult, applyAction } from '../domain/actions';
import { 
  supabaseFetch, 
  isSupabaseConfigured, 
  supabaseAuth 
} from '../services/supabaseClient';
import { LocalStorageReportRepository } from './LocalStorageReportRepository';
import { validatePotholeReport, validateActionPayload, validateComment } from '../services/reportValidator';
import { migrateReport } from '../services/storageService';

/**
 * ReportRepository implementation backed by Supabase Postgres & Row-Level Security.
 * When Supabase environment variables are missing, it falls back seamlessly to
 * LocalStorageReportRepository, preserving offline sandbox presentation capabilities.
 */
export class SupabaseReportRepository implements ReportRepository {
  private fallback: LocalStorageReportRepository;

  constructor() {
    this.fallback = new LocalStorageReportRepository();
  }

  // Helper to map DB snake_case record to PotholeReport camelCase
  private mapDbToReport(row: any, timeline: TimelineEntry[] = []): PotholeReport {
    return migrateReport({
      id: row.id,
      trackingCode: row.tracking_code,
      title: row.title,
      description: row.description,
      status: row.status,
      severity: row.severity,
      latitude: row.latitude,
      longitude: row.longitude,
      address: row.address,
      roadName: row.road_name,
      city: row.city,
      jurisdiction: row.jurisdiction,
      authorityId: row.authority_id || undefined,
      reporterName: row.reporter_name || undefined,
      reporterEmail: row.reporter_email || undefined,
      assignedAgencyId: row.assigned_agency_id || undefined,
      assignedOfficerId: row.assigned_officer_id || undefined,
      assignedCrew: row.assigned_crew || undefined,
      imageUrl: row.image_url || undefined,
      afterImageUrl: row.after_image_url || undefined,
      landmark: row.landmark || undefined,
      feedback:
        row.feedback_rating != null || row.feedback_comment
          ? {
              rating: row.feedback_rating || 5,
              comment: row.feedback_comment || undefined,
            }
          : undefined,
      rejectedReason: row.rejection_reason || undefined,
      priority: row.priority || undefined,
      priorityScore: row.priority_score || undefined,
      slaDueAt: row.sla_due_at || undefined,
      lastVerifiedAt: row.last_verified_at || undefined,
      verificationsCount: row.verifications_count || 1,
      userConfirmed: row.user_confirmed ?? true,
      reportedAt: row.reported_at,
      timeline,
    });
  }

  // Helper to map PotholeReport camelCase to DB snake_case
  private mapReportToDb(report: PotholeReport): any {
    return {
      id: report.id,
      tracking_code: report.trackingCode,
      title: report.title,
      description: report.description,
      status: report.status,
      severity: report.severity,
      latitude: report.latitude,
      longitude: report.longitude,
      address: report.address,
      road_name: report.roadName,
      city: report.city,
      jurisdiction: report.jurisdiction,
      authority_id: report.authorityId || null,
      reporter_name: report.reporterName || null,
      reporter_email: report.reporterEmail || null,
      assigned_agency_id: report.assignedAgencyId || null,
      assigned_officer_id: report.assignedOfficerId || null,
      assigned_crew: report.assignedCrew || null,
      image_url: report.imageUrl || null,
      after_image_url: report.afterImageUrl || null,
      landmark: report.landmark || null,
      feedback_rating: report.feedback?.rating || null,
      feedback_comment: report.feedback?.comment || null,
      rejection_reason: report.rejectedReason || null,
      priority: report.priority || null,
      priority_score: report.priorityScore || null,
      sla_due_at: report.slaDueAt || null,
      last_verified_at: report.lastVerifiedAt || null,
      verifications_count: report.verificationsCount || 1,
      user_confirmed: report.userConfirmed ?? true,
      reported_at: report.reportedAt,
      updated_at: new Date().toISOString(),
    };
  }

  async list(filter?: ReportFilter): Promise<PotholeReport[]> {
    if (!isSupabaseConfigured()) {
      return this.fallback.list(filter);
    }

    let queryPath = '/rest/v1/reports?select=*';

    if (filter) {
      if (filter.status && filter.status !== 'all') {
        if (Array.isArray(filter.status)) {
          queryPath += `&status=in.(${filter.status.join(',')})`;
        } else {
          queryPath += `&status=eq.${encodeURIComponent(filter.status)}`;
        }
      }
      if (filter.agencyId && filter.agencyId !== 'all') {
        queryPath += `&assigned_agency_id=eq.${encodeURIComponent(filter.agencyId)}`;
      }
      if (filter.officerId && filter.officerId !== 'all') {
        queryPath += `&assigned_officer_id=eq.${encodeURIComponent(filter.officerId)}`;
      }
      if (filter.severity && filter.severity !== 'all') {
        queryPath += `&severity=eq.${encodeURIComponent(filter.severity)}`;
      }
    }

    queryPath += '&order=reported_at.desc';

    const { data, error } = await supabaseFetch<any[]>(queryPath);
    if (error || !data) {
      console.warn('Supabase reports list error, falling back to local storage:', error?.message);
      return this.fallback.list(filter);
    }

    return data.map(row => this.mapDbToReport(row));
  }

  async get(id: string): Promise<PotholeReport | null> {
    if (!isSupabaseConfigured()) {
      return this.fallback.get(id);
    }

    const { data: reportRows, error: reportErr } = await supabaseFetch<any[]>(
      `/rest/v1/reports?id=eq.${encodeURIComponent(id)}&select=*`
    );

    if (reportErr || !reportRows || reportRows.length === 0) {
      return this.fallback.get(id);
    }

    // Fetch timeline entries for this report
    const { data: timelineRows } = await supabaseFetch<any[]>(
      `/rest/v1/timeline_entries?report_id=eq.${encodeURIComponent(id)}&order=timestamp.asc`
    );

    const timeline: TimelineEntry[] = (timelineRows || []).map(row => ({
      id: row.id,
      status: row.status || 'reported',
      action: row.action,
      message: row.message || row.notes || '',
      actorName: row.actor_name,
      actorRole: row.actor_role,
      timestamp: row.timestamp,
    }));

    return this.mapDbToReport(reportRows[0], timeline);
  }

  async save(report: PotholeReport): Promise<PotholeReport> {
    const validation = validatePotholeReport(report);
    if (!validation.valid) {
      throw new Error(`Report validation failed: ${validation.errors.join('; ')}`);
    }

    const migrated = migrateReport(report);

    if (!isSupabaseConfigured()) {
      return this.fallback.save(migrated);
    }

    const dbRow = this.mapReportToDb(migrated);
    const { data, error } = await supabaseFetch<any[]>('/rest/v1/reports?on_conflict=id', {
      method: 'POST',
      headers: {
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify(dbRow),
    });

    if (error || !data || data.length === 0) {
      console.warn('Supabase report save failed, caching locally:', error?.message);
      return this.fallback.save(migrated);
    }

    return this.mapDbToReport(data[0], migrated.timeline);
  }

  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return this.fallback.delete(id);
    }

    await supabaseFetch(`/rest/v1/reports?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });

    await this.fallback.delete(id);
  }

  async dispatch(
    id: string,
    action: CivicAction,
    actor: Actor,
    payload?: ActionPayload
  ): Promise<ApplyActionResult> {
    validateActionPayload(action, payload);

    if (!isSupabaseConfigured()) {
      return this.fallback.dispatch(id, action, actor, payload);
    }

    const current = await this.get(id);
    if (!current) {
      throw new Error(`Cannot dispatch action "${action}": Report with ID "${id}" was not found.`);
    }

    const result = applyAction(current, action, actor, payload);
    const saved = await this.save(result.report);

    // Save timeline entry if generated
    if (result.timelineEntry) {
      await supabaseFetch('/rest/v1/timeline_entries', {
        method: 'POST',
        body: JSON.stringify({
          id: result.timelineEntry.id || `tl-${crypto.randomUUID()}`,
          report_id: id,
          timestamp: result.timelineEntry.timestamp,
          action: result.timelineEntry.action,
          status: result.timelineEntry.status,
          actor_role: result.timelineEntry.actorRole,
          actor_name: result.timelineEntry.actorName,
          message: result.timelineEntry.message || '',
        }),
      });
    }

    // Save notifications if generated
    if (result.notifications && result.notifications.length > 0) {
      for (const notif of result.notifications) {
        await supabaseFetch('/rest/v1/notifications', {
          method: 'POST',
          body: JSON.stringify({
            id: notif.id || `notif-${crypto.randomUUID()}`,
            recipient_role: notif.recipientRole,
            recipient_name: notif.recipientName || null,
            recipient_email: notif.recipientEmail || null,
            title: notif.title,
            message: notif.message,
            report_id: notif.reportId,
            tracking_code: notif.trackingCode || null,
            read: notif.read ?? false,
            created_at: notif.timestamp || new Date().toISOString(),
          }),
        });
      }
    }

    return {
      report: saved,
      timelineEntry: result.timelineEntry,
      notifications: result.notifications,
    };
  }

  async listComments(reportId: string): Promise<Comment[]> {
    if (!isSupabaseConfigured()) {
      return this.fallback.listComments(reportId);
    }

    const { data, error } = await supabaseFetch<any[]>(
      `/rest/v1/comments?report_id=eq.${encodeURIComponent(reportId)}&order=created_at.asc`
    );

    if (error || !data) {
      return this.fallback.listComments(reportId);
    }

    return data.map(row => ({
      id: row.id,
      reportId: row.report_id,
      authorName: row.author_name,
      authorRole: row.author_role,
      text: row.text,
      timestamp: row.created_at,
    }));
  }

  async addComment(comment: Omit<Comment, 'id' | 'timestamp'>): Promise<Comment> {
    if (!isSupabaseConfigured()) {
      return this.fallback.addComment(comment);
    }

    const validation = validateComment(comment.text, comment.authorName);
    if (!validation.valid) {
      throw new Error(`Comment validation failed: ${validation.errors.join('; ')}`);
    }

    const newCommentId = `cmt-${crypto.randomUUID()}`;
    const nowIso = new Date().toISOString();

    const { data, error } = await supabaseFetch<any[]>('/rest/v1/comments', {
      method: 'POST',
      headers: {
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        id: newCommentId,
        report_id: comment.reportId,
        author_name: comment.authorName,
        author_role: comment.authorRole,
        text: comment.text,
        created_at: nowIso,
      }),
    });

    if (error || !data || data.length === 0) {
      console.warn('Supabase addComment failed, falling back locally:', error?.message);
      return this.fallback.addComment(comment);
    }

    return {
      id: data[0].id,
      reportId: data[0].report_id,
      authorName: data[0].author_name,
      authorRole: data[0].author_role,
      text: data[0].text,
      timestamp: data[0].created_at,
    };
  }

  async listNotifications(recipient: RecipientFilter): Promise<NotificationMessage[]> {
    if (!isSupabaseConfigured()) {
      return this.fallback.listNotifications(recipient);
    }

    const { data, error } = await supabaseFetch<any[]>(
      `/rest/v1/notifications?recipient_role=eq.${encodeURIComponent(recipient.role)}&order=created_at.desc&limit=100`
    );

    if (error || !data) {
      return this.fallback.listNotifications(recipient);
    }

    return data.map(row => ({
      id: row.id,
      recipientRole: row.recipient_role,
      recipientName: row.recipient_name || undefined,
      recipientEmail: row.recipient_email || undefined,
      title: row.title,
      message: row.message,
      reportId: row.report_id,
      trackingCode: row.tracking_code || undefined,
      timestamp: row.created_at,
      read: row.read,
    }));
  }

  async markRead(notificationId: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      return this.fallback.markRead(notificationId);
    }

    await supabaseFetch(`/rest/v1/notifications?id=eq.${encodeURIComponent(notificationId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });

    await this.fallback.markRead(notificationId);
  }

  async markAllRead(recipient: RecipientFilter): Promise<void> {
    if (!isSupabaseConfigured()) {
      return this.fallback.markAllRead(recipient);
    }

    await supabaseFetch(`/rest/v1/notifications?recipient_role=eq.${encodeURIComponent(recipient.role)}`, {
      method: 'PATCH',
      body: JSON.stringify({ read: true }),
    });

    await this.fallback.markAllRead(recipient);
  }

  async resetDemoData(): Promise<void> {
    return this.fallback.resetDemoData();
  }

  async loadSampleWorkflow(): Promise<PotholeReport[]> {
    return this.fallback.loadSampleWorkflow();
  }

  async exportAllData(): Promise<UserDataExport> {
    return this.fallback.exportAllData();
  }

  async deleteAllData(): Promise<void> {
    if (isSupabaseConfigured()) {
      try {
        await supabaseAuth.deleteAccount();
      } catch (e) {
        console.warn('Supabase account deletion skipped in demo:', e);
      }
    }
    return this.fallback.deleteAllData();
  }
}

export const supabaseReportRepository = new SupabaseReportRepository();
