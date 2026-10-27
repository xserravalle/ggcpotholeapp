import { PotholeReport, Actor, UserRole } from './types';
import { canTransition, ReportStatus } from './status';

export type CivicAction =
  | 'create'
  | 'confirm'
  | 'comment'
  | 'rateFix'
  | 'reopen'
  | 'verify'
  | 'reject'
  | 'merge'
  | 'setPriority'
  | 'assign'
  | 'reassign'
  | 'close'
  | 'exportData'
  | 'dispatchEmail'
  | 'startWork'
  | 'resolve';

type PermissionRule = boolean | ((report?: PotholeReport, actor?: Actor) => boolean);

type PermissionMatrix = Record<CivicAction, Record<UserRole, PermissionRule>>;

/**
 * Checks if a report belongs to the actor (by matching email or name).
 */
export function isOwnReport(report?: PotholeReport, actor?: Actor): boolean {
  if (!report || !actor) return false;
  
  if (actor.email && report.reporterEmail) {
    if (actor.email.trim().toLowerCase() === report.reporterEmail.trim().toLowerCase()) {
      return true;
    }
  }

  if (actor.name && report.reporterName) {
    if (actor.name.trim().toLowerCase() === report.reporterName.trim().toLowerCase()) {
      return true;
    }
  }

  // Also check if actor's ID matches reporter email/id
  if (actor.id && (actor.id === report.reporterEmail || actor.id === report.reporterName)) {
    return true;
  }

  return false;
}

/**
 * Checks if a report is assigned to the specified officer.
 */
export function isAssignedOfficer(report?: PotholeReport, actor?: Actor): boolean {
  if (!report || !actor) return false;

  if (report.assignedOfficerId && actor.id) {
    if (report.assignedOfficerId === actor.id) {
      return true;
    }
  }

  if (report.assignedOfficerId && actor.name) {
    if (report.assignedOfficerId.trim().toLowerCase() === actor.name.trim().toLowerCase()) {
      return true;
    }
  }

  if (report.assignedCrew && actor.name) {
    if (report.assignedCrew.trim().toLowerCase().includes(actor.name.trim().toLowerCase())) {
      return true;
    }
  }

  return false;
}

/**
 * Readable permissions matrix mapping every civic action to role rules.
 * Keeps permissions clear, declarative, and easily auditable.
 */
export const PERMISSIONS_TABLE: PermissionMatrix = {
  create: {
    guest: true,
    user: true,
    admin: true,
    officer: true,
  },

  confirm: {
    guest: true,
    user: true,
    admin: true,
    officer: true,
  },

  comment: {
    guest: true,
    user: true,
    admin: true,
    officer: (report, actor) => isAssignedOfficer(report, actor),
  },

  rateFix: {
    guest: (report, actor) => isOwnReport(report, actor) && (report?.status === 'resolved' || report?.status === 'closed'),
    user: (report, actor) => isOwnReport(report, actor) && (report?.status === 'resolved' || report?.status === 'closed'),
    admin: false,
    officer: false,
  },

  reopen: {
    guest: (report, actor) =>
      isOwnReport(report, actor) && (report?.status === 'resolved' || report?.status === 'closed'),
    user: (report, actor) =>
      isOwnReport(report, actor) && (report?.status === 'resolved' || report?.status === 'closed'),
    admin: false,
    officer: false,
  },

  verify: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  reject: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  merge: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  setPriority: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  assign: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  reassign: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  close: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  exportData: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  dispatchEmail: {
    guest: false,
    user: false,
    admin: true,
    officer: false,
  },

  startWork: {
    guest: false,
    user: false,
    admin: false,
    officer: (report, actor) => isAssignedOfficer(report, actor) && report?.status === 'assigned',
  },

  resolve: {
    guest: false,
    user: false,
    admin: false,
    officer: (report, actor) => isAssignedOfficer(report, actor) && report?.status === 'in_progress',
  },
};

/**
 * Validates whether an actor with a given role can perform a civic action on a report.
 */
export function can(
  role: UserRole,
  action: CivicAction,
  report?: PotholeReport,
  actor?: Actor
): boolean {
  const rule = PERMISSIONS_TABLE[action]?.[role];
  if (typeof rule === 'function') {
    return rule(report, actor);
  }
  return Boolean(rule);
}
