export type ReportStatus =
  | 'reported'
  | 'verified'
  | 'assigned'
  | 'in_progress'
  | 'resolved'
  | 'closed'
  | 'rejected';

export interface TransitionContext {
  resolvedAt?: string;
  now?: Date | string;
}

export const MAX_REOPEN_WINDOW_DAYS = 14;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Base allowed transitions without dynamic constraints.
 * Dynamic rule: closed -> verified requires being within 14 days of resolvedAt.
 */
export const ALLOWED_TRANSITIONS: Record<ReportStatus, readonly ReportStatus[]> = {
  reported: ['verified', 'rejected'],
  verified: ['assigned', 'rejected'],
  assigned: ['in_progress', 'assigned'],
  in_progress: ['resolved'],
  resolved: ['closed', 'verified'],
  closed: ['verified'],
  rejected: [],
};

/**
 * Checks whether transitioning from one ReportStatus to another is valid.
 * Handles the special rule: closed -> verified is only permitted within 14 days of resolvedAt.
 */
export function canTransition(
  from: ReportStatus,
  to: ReportStatus,
  context?: TransitionContext
): boolean {
  if (from === to && from !== 'assigned') {
    return false;
  }

  const allowedTargets = ALLOWED_TRANSITIONS[from];
  if (!allowedTargets || !allowedTargets.includes(to)) {
    return false;
  }

  // Dynamic rule: Reopening a closed report requires resolvedAt and must be within 14 days
  if (from === 'closed' && to === 'verified') {
    if (!context?.resolvedAt) {
      return false;
    }
    const resolvedTime = new Date(context.resolvedAt).getTime();
    if (Number.isNaN(resolvedTime)) {
      return false;
    }
    const currentTime = context.now ? new Date(context.now).getTime() : Date.now();
    const daysElapsed = (currentTime - resolvedTime) / MS_PER_DAY;
    return daysElapsed >= 0 && daysElapsed <= MAX_REOPEN_WINDOW_DAYS;
  }

  return true;
}

/**
 * Checks whether a report is currently in an open (active) lifecycle state.
 * Reports that are 'resolved', 'closed', or 'rejected' are considered inactive/resolved.
 */
export function isOpenStatus(status: ReportStatus): boolean {
  return status !== 'resolved' && status !== 'closed' && status !== 'rejected';
}

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  reported: 'Reported',
  verified: 'Verified & Triaged',
  assigned: 'Assigned to Crew',
  in_progress: 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
};

export interface StatusColorConfig {
  label: string;
  badge: string;
  text: string;
  bg: string;
  border: string;
  dot: string;
}

export const REPORT_STATUS_COLORS: Record<ReportStatus, StatusColorConfig> = {
  reported: {
    label: 'Reported',
    badge: 'bg-amber-950/80 text-amber-300 border-amber-800',
    text: 'text-amber-300',
    bg: 'bg-amber-950/80',
    border: 'border-amber-800',
    dot: 'bg-amber-400',
  },
  verified: {
    label: 'Verified & Triaged',
    badge: 'bg-blue-950/80 text-blue-300 border-blue-800',
    text: 'text-blue-300',
    bg: 'bg-blue-950/80',
    border: 'border-blue-800',
    dot: 'bg-blue-400',
  },
  assigned: {
    label: 'Assigned to Crew',
    badge: 'bg-purple-950/80 text-purple-300 border-purple-800',
    text: 'text-purple-300',
    bg: 'bg-purple-950/80',
    border: 'border-purple-800',
    dot: 'bg-purple-400',
  },
  in_progress: {
    label: 'In Progress',
    badge: 'bg-cyan-950/80 text-cyan-300 border-cyan-800',
    text: 'text-cyan-300',
    bg: 'bg-cyan-950/80',
    border: 'border-cyan-800',
    dot: 'bg-cyan-400',
  },
  resolved: {
    label: 'Resolved',
    badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    text: 'text-emerald-300',
    bg: 'bg-emerald-950/80',
    border: 'border-emerald-800',
    dot: 'bg-emerald-400',
  },
  closed: {
    label: 'Closed',
    badge: 'bg-slate-800 text-slate-300 border-slate-700',
    text: 'text-slate-300',
    bg: 'bg-slate-800',
    border: 'border-slate-700',
    dot: 'bg-slate-400',
  },
  rejected: {
    label: 'Rejected',
    badge: 'bg-rose-950/80 text-rose-300 border-rose-800',
    text: 'text-rose-300',
    bg: 'bg-rose-950/80',
    border: 'border-rose-800',
    dot: 'bg-rose-400',
  },
};
