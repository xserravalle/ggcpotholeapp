export type UserRole = 'Dispatcher' | 'Viewer';

export interface AuthSession {
  email: string;
  token: string;
  expiresAt: number;
  role: UserRole;
}

export const AUTH_STORAGE_KEY = 'ggc-pothole-patrol-auth-session';
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 hours

/**
 * Determines role based on email domain:
 * @ggc.edu domain -> Dispatcher
 * all others -> Viewer
 */
export function determineRole(email: string): UserRole {
  const normalized = email.trim().toLowerCase();
  if (normalized.endsWith('@ggc.edu')) {
    return 'Dispatcher';
  }
  return 'Viewer';
}

/**
 * Validates credentials and creates a persistent 8-hour session token.
 */
export function login(email: string, password: string): AuthSession {
  if (!email || !email.trim()) {
    throw new Error('Email is required');
  }

  const trimmedEmail = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmedEmail)) {
    throw new Error('Please enter a valid email address');
  }

  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }

  if (password.length < 4) {
    throw new Error('Password must be at least 4 characters');
  }

  const role = determineRole(trimmedEmail);
  const token = `auth_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  const session: AuthSession = {
    email: trimmedEmail,
    token,
    expiresAt,
    role
  };

  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  } catch (err) {
    console.error('Failed to save auth session to localStorage', err);
  }

  return session;
}

/**
 * Clears current session from localStorage.
 */
export function logout(): void {
  try {
    localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch (err) {
    console.error('Failed to remove auth session from localStorage', err);
  }
}

/**
 * Validates if a session or current stored session is valid and not expired.
 */
export function isSessionValid(session?: AuthSession | null): boolean {
  const target = session !== undefined ? session : getRawStoredSession();
  if (!target) return false;

  const isValid = typeof target.expiresAt === 'number' && Date.now() < target.expiresAt;
  if (!isValid && session === undefined) {
    // If checking stored session directly and it's expired, clear it
    logout();
  }
  return isValid;
}

/**
 * Helper to safely get session directly from localStorage without clearing yet.
 */
function getRawStoredSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || !parsed.email || !parsed.token || !parsed.expiresAt) {
      return null;
    }
    // Ensure role is backfilled if missing
    if (!parsed.role) {
      parsed.role = determineRole(parsed.email);
    }
    return parsed as AuthSession;
  } catch {
    return null;
  }
}

/**
 * Returns the current active session if valid, or null if expired or missing.
 */
export function getSession(): AuthSession | null {
  const session = getRawStoredSession();
  if (!session) return null;

  if (!isSessionValid(session)) {
    logout();
    return null;
  }

  return session;
}
