import type { PotholeReport, Comment, CitizenFeedback } from '../types/pothole';
import type { CivicAction } from '../domain/permissions';
import type { ActionPayload } from '../domain/actions';

export interface ValidationResult {
  valid: boolean;
  isValid: boolean;
  errors: string[];
}

export const VALIDATION_LIMITS = {
  TITLE_MIN_LENGTH: 3,
  TITLE_MAX_LENGTH: 100,
  DESCRIPTION_MAX_LENGTH: 1000,
  LANDMARK_MAX_LENGTH: 200,
  REPORTER_NAME_MAX_LENGTH: 100,
  REPORTER_EMAIL_MAX_LENGTH: 254,
  COMMENT_MAX_LENGTH: 1000,
  FEEDBACK_COMMENT_MAX_LENGTH: 1000,
  NOTE_MAX_LENGTH: 1000,
  MAX_DEPTH_INCHES: 120,
  MAX_WIDTH_INCHES: 360,
  LAT_MIN: -90,
  LAT_MAX: 90,
  LON_MIN: -180,
  LON_MAX: 180,
} as const;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const VALID_SEVERITIES = ['minor', 'moderate', 'severe', 'critical', 'high', 'low', 'medium'] as const;

const VALID_STATUSES = [
  'reported',
  'verified',
  'assigned',
  'in_progress',
  'resolved',
  'closed',
  'rejected',
  // Legacy status support
  'investigating',
  'scheduled',
  'repaired',
] as const;

const VALID_REJECTION_REASONS = [
  'duplicate',
  'not_a_pothole',
  'out_of_area',
  'insufficient_info',
] as const;

/**
 * Validates a pothole report against civic domain schema rules and length limits.
 * Expands on Tina's baseline validator with strict boundary checks.
 */
export function validatePotholeReport(
  report: Partial<PotholeReport>
): ValidationResult {
  const errors: string[] = [];

  // ID validation
  if (report.id !== undefined && (!report.id || !report.id.trim())) {
    errors.push('Report ID cannot be empty');
  }

  // Title validation
  if (!report.title || !report.title.trim()) {
    errors.push('Title is required');
  } else {
    const trimmedTitle = report.title.trim();
    if (trimmedTitle.length < VALIDATION_LIMITS.TITLE_MIN_LENGTH) {
      errors.push(`Title must be at least ${VALIDATION_LIMITS.TITLE_MIN_LENGTH} characters`);
    } else if (trimmedTitle.length > VALIDATION_LIMITS.TITLE_MAX_LENGTH) {
      errors.push(`Title must not exceed ${VALIDATION_LIMITS.TITLE_MAX_LENGTH} characters`);
    }
  }

  // Description validation (optional, but capped)
  if (report.description !== undefined && report.description !== null) {
    if (report.description.length > VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH) {
      errors.push(`Description must not exceed ${VALIDATION_LIMITS.DESCRIPTION_MAX_LENGTH} characters`);
    }
  }

  // Landmark validation (optional, but capped)
  if (report.landmark !== undefined && report.landmark !== null && report.landmark.trim() !== '') {
    if (report.landmark.trim().length > VALIDATION_LIMITS.LANDMARK_MAX_LENGTH) {
      errors.push(`Landmark must not exceed ${VALIDATION_LIMITS.LANDMARK_MAX_LENGTH} characters`);
    }
  }

  // Reporter Name validation
  if (report.reporterName !== undefined && report.reporterName !== null && report.reporterName.trim() !== '') {
    if (report.reporterName.trim().length > VALIDATION_LIMITS.REPORTER_NAME_MAX_LENGTH) {
      errors.push(`Reporter name must not exceed ${VALIDATION_LIMITS.REPORTER_NAME_MAX_LENGTH} characters`);
    }
  }

  // Reporter Email validation
  if (report.reporterEmail !== undefined && report.reporterEmail !== null && report.reporterEmail.trim() !== '') {
    const email = report.reporterEmail.trim();
    if (email.length > VALIDATION_LIMITS.REPORTER_EMAIL_MAX_LENGTH) {
      errors.push(`Reporter email must not exceed ${VALIDATION_LIMITS.REPORTER_EMAIL_MAX_LENGTH} characters`);
    } else if (!EMAIL_REGEX.test(email)) {
      errors.push('Reporter email is not a valid email address');
    }
  }

  // Geospatial Latitude validation
  if (
    typeof report.latitude !== 'number' ||
    !Number.isFinite(report.latitude) ||
    report.latitude < VALIDATION_LIMITS.LAT_MIN ||
    report.latitude > VALIDATION_LIMITS.LAT_MAX
  ) {
    errors.push('Invalid latitude: must be a number between -90 and 90');
  }

  // Geospatial Longitude validation
  if (
    typeof report.longitude !== 'number' ||
    !Number.isFinite(report.longitude) ||
    report.longitude < VALIDATION_LIMITS.LON_MIN ||
    report.longitude > VALIDATION_LIMITS.LON_MAX
  ) {
    errors.push('Invalid longitude: must be a number between -180 and 180');
  }

  // Severity validation
  if (report.severity !== undefined) {
    if (!VALID_SEVERITIES.includes(report.severity as any)) {
      errors.push(`Invalid severity: must be one of ${VALID_SEVERITIES.join(', ')}`);
    }
  }

  // Status validation
  if (report.status !== undefined) {
    if (!VALID_STATUSES.includes(report.status as any)) {
      errors.push(`Invalid status: must be a recognized report status`);
    }
  }

  // Dimensions: Depth
  if (report.estimatedDepthInches !== undefined) {
    const depth = report.estimatedDepthInches;
    if (typeof depth !== 'number' || !Number.isFinite(depth) || depth < 0) {
      errors.push('Invalid estimated depth: must be a non-negative number');
    } else if (depth > VALIDATION_LIMITS.MAX_DEPTH_INCHES) {
      errors.push(`Invalid estimated depth: exceeds maximum limit of ${VALIDATION_LIMITS.MAX_DEPTH_INCHES} inches`);
    }
  }

  // Dimensions: Width
  if (report.estimatedWidthInches !== undefined) {
    const width = report.estimatedWidthInches;
    if (typeof width !== 'number' || !Number.isFinite(width) || width < 0) {
      errors.push('Invalid estimated width: must be a non-negative number');
    } else if (width > VALIDATION_LIMITS.MAX_WIDTH_INCHES) {
      errors.push(`Invalid estimated width: exceeds maximum limit of ${VALIDATION_LIMITS.MAX_WIDTH_INCHES} inches`);
    }
  }

  // Verifications Count
  if (
    report.verificationsCount !== undefined &&
    (!Number.isInteger(report.verificationsCount) || report.verificationsCount < 0)
  ) {
    errors.push('Invalid verification count: must be a non-negative integer');
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a user comment against text content and character boundaries.
 */
export function validateComment(
  comment: Partial<Comment> | string,
  authorName?: string
): ValidationResult {
  const errors: string[] = [];
  const text = typeof comment === 'string' ? comment : comment.text;
  const author = typeof comment === 'string' ? authorName : comment.authorName;

  if (!text || !text.trim()) {
    errors.push('Comment cannot be empty');
  } else if (text.trim().length > VALIDATION_LIMITS.COMMENT_MAX_LENGTH) {
    errors.push(`Comment exceeds maximum limit of ${VALIDATION_LIMITS.COMMENT_MAX_LENGTH} characters`);
  }

  if (author !== undefined && author !== null && author.trim().length > VALIDATION_LIMITS.REPORTER_NAME_MAX_LENGTH) {
    errors.push(`Author name exceeds maximum limit of ${VALIDATION_LIMITS.REPORTER_NAME_MAX_LENGTH} characters`);
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates citizen star rating and feedback comment.
 */
export function validateCitizenFeedback(
  feedback: Partial<CitizenFeedback>
): ValidationResult {
  const errors: string[] = [];

  if (
    typeof feedback.rating !== 'number' ||
    !Number.isInteger(feedback.rating) ||
    feedback.rating < 1 ||
    feedback.rating > 5
  ) {
    errors.push('Rating must be an integer between 1 and 5 stars');
  }

  if (
    feedback.comment !== undefined &&
    feedback.comment !== null &&
    feedback.comment.trim().length > VALIDATION_LIMITS.FEEDBACK_COMMENT_MAX_LENGTH
  ) {
    errors.push(`Feedback comment exceeds maximum limit of ${VALIDATION_LIMITS.FEEDBACK_COMMENT_MAX_LENGTH} characters`);
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates civic action payloads (e.g., rejection reasons, resolution notes).
 */
export function validateActionPayload(
  action: CivicAction | string,
  payload?: ActionPayload & { note?: string; notes?: string; rejectedReason?: string }
): ValidationResult {
  const errors: string[] = [];
  const normalizedAction = (typeof action === 'string' ? action.toLowerCase().replace(/_/g, '') : action);

  const noteOrMessage = payload?.message || payload?.note || payload?.notes || payload?.comment;
  const rejectionReason = payload?.reason || payload?.rejectedReason;

  if (normalizedAction === 'reject') {
    if (!rejectionReason) {
      errors.push('Rejection reason is required');
    } else if (!VALID_REJECTION_REASONS.includes(rejectionReason as any)) {
      errors.push(`Invalid rejection reason: must be one of ${VALID_REJECTION_REASONS.join(', ')}`);
    }

    if (noteOrMessage && noteOrMessage.length > VALIDATION_LIMITS.NOTE_MAX_LENGTH) {
      errors.push(`Rejection note exceeds maximum limit of ${VALIDATION_LIMITS.NOTE_MAX_LENGTH} characters`);
    }
  }

  if (normalizedAction === 'resolve') {
    if (!noteOrMessage || !noteOrMessage.trim()) {
      errors.push('Resolution note explaining what repair was completed is required');
    } else if (noteOrMessage.trim().length > VALIDATION_LIMITS.NOTE_MAX_LENGTH) {
      errors.push(`Resolution note exceeds maximum limit of ${VALIDATION_LIMITS.NOTE_MAX_LENGTH} characters`);
    }
  }

  if (
    normalizedAction === 'startwork' ||
    normalizedAction === 'verify' ||
    normalizedAction === 'assign' ||
    normalizedAction === 'close' ||
    normalizedAction === 'adminclose' ||
    normalizedAction === 'reopen'
  ) {
    if (noteOrMessage && noteOrMessage.length > VALIDATION_LIMITS.NOTE_MAX_LENGTH) {
      errors.push(`Note exceeds maximum limit of ${VALIDATION_LIMITS.NOTE_MAX_LENGTH} characters`);
    }
  }

  return {
    valid: errors.length === 0,
    isValid: errors.length === 0,
    errors,
  };
}
