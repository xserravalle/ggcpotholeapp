import { PotholeReport, Actor, TimelineEntry, NotificationMessage, RejectedReason, ReportPriority } from './types';
import { CivicAction, can } from './permissions';
import { canTransition } from './status';
import { priorityScore, suggestPriority } from './priority';

export interface ActionPayload {
  message?: string;
  comment?: string;
  reason?: RejectedReason;
  mergedIntoId?: string;
  assignedAgencyId?: string;
  assignedOfficerId?: string;
  assignedCrew?: string;
  priority?: ReportPriority;
  rating?: number; // 1 to 5
  imageUrl?: string;
  now?: Date | string;
}

export interface ApplyActionResult {
  report: PotholeReport;
  timelineEntry: TimelineEntry;
  notifications: NotificationMessage[];
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Executes a state change or civic action on a report.
 * Pure function: validates permissions and transition rules, returns
 * updated report, newly appended timeline entry, and pending notifications.
 * Throws a descriptive Error if the action is not allowed.
 */
export function applyAction(
  report: PotholeReport,
  action: CivicAction,
  actor: Actor,
  payload?: ActionPayload
): ApplyActionResult {
  // 1. Permission Check
  if (!can(actor.role, action, report, actor)) {
    throw new Error(
      `Permission Denied: Actor "${actor.name}" with role "${actor.role}" is not permitted to perform "${action}" on report ${report.id}.`
    );
  }

  const now = payload?.now ? new Date(payload.now) : new Date();
  const timestamp = now.toISOString();
  const notifications: NotificationMessage[] = [];

  let updatedReport: PotholeReport = { ...report };
  let timelineAction = action.toUpperCase();
  let timelineMessage = payload?.message || payload?.comment || '';

  // 2. State & Business Rules Validation
  switch (action) {
    case 'create': {
      timelineAction = 'REPORT_CREATED';
      timelineMessage = payload?.message || `Report created by ${actor.name}`;
      notifications.push({
        id: generateId('notif'),
        recipientRole: 'admin',
        title: 'New Road Hazard Reported',
        message: `New pothole reported at ${report.address || report.roadName}: ${report.title}`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'confirm': {
      const newCount = (report.verificationsCount || 0) + 1;
      updatedReport.verificationsCount = newCount;
      updatedReport.userConfirmed = true;
      updatedReport.lastVerifiedAt = timestamp;

      // Recalculate priority score with the new confirmation
      const newScore = priorityScore(updatedReport);
      updatedReport.priorityScore = newScore;
      updatedReport.priority = suggestPriority(newScore);

      timelineAction = 'CONFIRMED';
      timelineMessage = `Community confirmation (+1) logged by ${actor.name}. Total: ${newCount}`;
      break;
    }

    case 'comment': {
      const text = payload?.message || payload?.comment;
      if (!text || !text.trim()) {
        throw new Error('Comment message cannot be empty.');
      }
      timelineAction = 'COMMENT_ADDED';
      timelineMessage = text.trim();

      // Notify citizen if authority commented, or notify assigned officer if citizen commented
      if (actor.role === 'admin' || actor.role === 'officer') {
        notifications.push({
          id: generateId('notif'),
          recipientRole: 'user',
          recipientName: report.reporterName,
          recipientEmail: report.reporterEmail,
          title: 'New Update on Your Report',
          message: `${actor.name} (${actor.role}): "${text.trim()}"`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
        });
      } else if (report.assignedOfficerId) {
        notifications.push({
          id: generateId('notif'),
          recipientRole: 'officer',
          recipientName: report.assignedOfficerId,
          title: 'Citizen Comment Received',
          message: `${actor.name}: "${text.trim()}"`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
        });
      }
      break;
    }

    case 'verify': {
      if (!canTransition(report.status, 'verified')) {
        throw new Error(`Cannot verify report with current status "${report.status}".`);
      }
      updatedReport.status = 'verified';
      timelineAction = 'STATUS_VERIFIED';
      timelineMessage = payload?.message || `Report verified and accepted into triage by ${actor.name}.`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Report Verified',
        message: `Your report #${report.trackingCode || report.id} has been verified by municipal authorities.`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'reject': {
      if (!canTransition(report.status, 'rejected')) {
        throw new Error(`Cannot reject report with current status "${report.status}".`);
      }
      if (!payload?.reason) {
        throw new Error('A rejection reason is required to reject a report.');
      }
      updatedReport.status = 'rejected';
      updatedReport.rejectedReason = payload.reason;
      timelineAction = 'STATUS_REJECTED';
      timelineMessage = `Report rejected: ${payload.reason}.${payload.message ? ` Note: ${payload.message}` : ''}`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Report Update: Not Actionable',
        message: `Your report #${report.trackingCode || report.id} was rejected (${payload.reason}).`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'merge': {
      if (!payload?.mergedIntoId) {
        throw new Error('A target report ID (mergedIntoId) is required to merge a duplicate report.');
      }
      if (!canTransition(report.status, 'rejected')) {
        throw new Error(`Cannot merge report with current status "${report.status}".`);
      }
      updatedReport.status = 'rejected';
      updatedReport.rejectedReason = 'duplicate';
      updatedReport.mergedIntoId = payload.mergedIntoId;
      timelineAction = 'STATUS_MERGED';
      timelineMessage = `Marked duplicate and merged into master report #${payload.mergedIntoId} by ${actor.name}.`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Report Merged with Existing Issue',
        message: `Your report was merged into duplicate master ticket #${payload.mergedIntoId}.`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'setPriority': {
      if (!payload?.priority) {
        throw new Error('A priority level is required.');
      }
      updatedReport.priority = payload.priority;
      timelineAction = 'PRIORITY_OVERRIDDEN';
      timelineMessage = `Priority manually adjusted to ${payload.priority.toUpperCase()} by ${actor.name}.${payload.message ? ` Reason: ${payload.message}` : ''}`;
      break;
    }

    case 'assign': {
      if (!canTransition(report.status, 'assigned')) {
        throw new Error(`Cannot assign report with current status "${report.status}".`);
      }
      if (!payload?.assignedAgencyId && !payload?.assignedOfficerId && !payload?.assignedCrew) {
        throw new Error('Assignment requires an agency and an assigned officer or crew.');
      }

      updatedReport.status = 'assigned';
      if (payload.assignedAgencyId) updatedReport.assignedAgencyId = payload.assignedAgencyId;
      if (payload.assignedOfficerId) updatedReport.assignedOfficerId = payload.assignedOfficerId;
      if (payload.assignedCrew) updatedReport.assignedCrew = payload.assignedCrew;
      else if (payload.assignedOfficerId) updatedReport.assignedCrew = payload.assignedOfficerId;

      timelineAction = 'STATUS_ASSIGNED';
      const target = updatedReport.assignedOfficerId || updatedReport.assignedCrew || 'Field Crew';
      timelineMessage = `Assigned to ${target} (${updatedReport.assignedAgencyId || updatedReport.jurisdiction}) by ${actor.name}.`;

      if (updatedReport.assignedOfficerId) {
        notifications.push({
          id: generateId('notif'),
          recipientRole: 'officer',
          recipientName: updatedReport.assignedOfficerId,
          title: 'New Work Order Assigned',
          message: `You were assigned work order #${report.trackingCode || report.id} at ${report.address}.`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
        });
      }

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Work Crew Assigned',
        message: `Your report has been assigned to ${target}.`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'reassign': {
      if (!canTransition(report.status, 'assigned')) {
        throw new Error(`Cannot reassign report with current status "${report.status}".`);
      }
      if (!payload?.assignedAgencyId && !payload?.assignedOfficerId && !payload?.assignedCrew) {
        throw new Error('Reassignment requires at least one target agency, officer, or crew.');
      }

      if (payload.assignedAgencyId) updatedReport.assignedAgencyId = payload.assignedAgencyId;
      if (payload.assignedOfficerId) updatedReport.assignedOfficerId = payload.assignedOfficerId;
      if (payload.assignedCrew) updatedReport.assignedCrew = payload.assignedCrew;

      timelineAction = 'STATUS_REASSIGNED';
      const newTarget = updatedReport.assignedOfficerId || updatedReport.assignedCrew || 'Field Crew';
      timelineMessage = `Reassigned to ${newTarget} by ${actor.name}.`;

      if (updatedReport.assignedOfficerId) {
        notifications.push({
          id: generateId('notif'),
          recipientRole: 'officer',
          recipientName: updatedReport.assignedOfficerId,
          title: 'Work Order Reassigned to You',
          message: `Work order #${report.trackingCode || report.id} reassigned to your queue.`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
        });
      }
      break;
    }

    case 'startWork': {
      if (!canTransition(report.status, 'in_progress')) {
        throw new Error(`Cannot start work on report with status "${report.status}". Must be "assigned".`);
      }
      updatedReport.status = 'in_progress';
      timelineAction = 'WORK_STARTED';
      timelineMessage = payload?.message || `Crew arrived on site and initiated repair operations.`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Repair Work in Progress',
        message: `Repair crew has arrived on site at ${report.roadName}. Work is underway.`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'resolve': {
      if (!canTransition(report.status, 'resolved')) {
        throw new Error(`Cannot resolve report with status "${report.status}". Must be "in_progress".`);
      }
      updatedReport.status = 'resolved';
      updatedReport.resolvedAt = timestamp;
      if (payload?.imageUrl) {
        updatedReport.imageUrl = payload.imageUrl;
      }

      timelineAction = 'WORK_RESOLVED';
      timelineMessage = payload?.message || `Pothole cavity repaired and roadway restored by ${actor.name}.`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Pothole Repaired! Rate the Fix',
        message: `Work on #${report.trackingCode || report.id} is complete! Please inspect and rate the fix.`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'rateFix': {
      if (report.status !== 'resolved' && report.status !== 'closed') {
        throw new Error('Repairs can only be rated once marked resolved or closed.');
      }
      const rating = payload?.rating;
      if (rating === undefined || rating < 1 || rating > 5) {
        throw new Error('Rating must be a numeric score between 1 and 5 stars.');
      }

      updatedReport.feedback = {
        rating,
        comment: payload?.comment?.trim() || undefined,
      };

      timelineAction = 'FIX_RATED';
      timelineMessage = `Citizen rated repair quality: ${rating}/5 stars.${payload?.comment ? ` Feedback: "${payload.comment}"` : ''}`;

      if (report.assignedOfficerId) {
        notifications.push({
          id: generateId('notif'),
          recipientRole: 'officer',
          recipientName: report.assignedOfficerId,
          title: 'Citizen Rated Your Fix',
          message: `Citizen gave ${rating}/5 stars on #${report.trackingCode || report.id}.`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
        });
      }
      break;
    }

    case 'reopen': {
      const allowed = canTransition(report.status, 'verified', {
        resolvedAt: report.resolvedAt,
        now: timestamp,
      });

      if (!allowed) {
        throw new Error(
          `Cannot reopen report: reopening is only permitted within 14 days of resolution (current status: ${report.status}).`
        );
      }

      updatedReport.status = 'verified';
      updatedReport.reopenCount = (report.reopenCount || 0) + 1;

      timelineAction = 'STATUS_REOPENED';
      timelineMessage = `Report reopened by reporting citizen: ${payload?.message || payload?.comment || 'Defect unresolved or resurfaced.'}`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'admin',
        title: 'Work Order Reopened by Citizen',
        message: `Citizen reopened #${report.trackingCode || report.id} (Reopen #${updatedReport.reopenCount}): ${timelineMessage}`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });

      if (report.assignedOfficerId) {
        notifications.push({
          id: generateId('notif'),
          recipientRole: 'officer',
          recipientName: report.assignedOfficerId,
          title: 'Work Order Reopened',
          message: `Citizen was unsatisfied and reopened #${report.trackingCode || report.id}.`,
          reportId: report.id,
          trackingCode: report.trackingCode,
          timestamp,
        });
      }
      break;
    }

    case 'close': {
      if (!canTransition(report.status, 'closed')) {
        throw new Error(`Cannot close report with status "${report.status}". Must be "resolved".`);
      }
      updatedReport.status = 'closed';
      timelineAction = 'STATUS_CLOSED';
      timelineMessage = payload?.message || `Work order officially closed and archived by ${actor.name}.`;

      notifications.push({
        id: generateId('notif'),
        recipientRole: 'user',
        recipientName: report.reporterName,
        recipientEmail: report.reporterEmail,
        title: 'Work Order Closed',
        message: `Case #${report.trackingCode || report.id} has been officially closed.`,
        reportId: report.id,
        trackingCode: report.trackingCode,
        timestamp,
      });
      break;
    }

    case 'exportData':
    case 'dispatchEmail':
    case 'viewAssignments': {
      timelineAction =
        action === 'exportData'
          ? 'AUDIT_EXPORT_CSV'
          : action === 'dispatchEmail'
          ? 'DISPATCH_EMAIL_SENT'
          : 'VIEW_ASSIGNMENTS';
      timelineMessage = payload?.message || `Operational audit: ${action} executed by ${actor.name}.`;
      break;
    }

    default: {
      const _exhaustiveCheck: never = action;
      throw new Error(`Unhandled action type: ${_exhaustiveCheck}`);
    }
  }

  // 3. Assemble and append timeline entry
  const timelineEntry: TimelineEntry = {
    id: generateId('tl'),
    status: updatedReport.status,
    action: timelineAction,
    message: timelineMessage,
    actorName: actor.name,
    actorRole: actor.role,
    timestamp,
  };

  updatedReport.timeline = [...(report.timeline || []), timelineEntry];

  return {
    report: updatedReport,
    timelineEntry,
    notifications,
  };
}
