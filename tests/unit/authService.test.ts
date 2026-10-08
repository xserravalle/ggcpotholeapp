import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  login, 
  logout, 
  getSession, 
  isSessionValid, 
  determineRole,
  AUTH_STORAGE_KEY,
  SESSION_DURATION_MS
} from '../../src/services/authService';

describe('authService', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('determineRole', () => {
    it('should assign Dispatcher role for @ggc.edu addresses', () => {
      expect(determineRole('dispatcher@ggc.edu')).toBe('Dispatcher');
      expect(determineRole('JOHN.DOE@GGC.EDU')).toBe('Dispatcher');
      expect(determineRole('facilities@ggc.edu')).toBe('Dispatcher');
    });

    it('should assign Viewer role for non-@ggc.edu addresses', () => {
      expect(determineRole('observer@gwinnettcounty.com')).toBe('Viewer');
      expect(determineRole('citizen@gmail.com')).toBe('Viewer');
      expect(determineRole('fake@notggc.edu.com')).toBe('Viewer');
    });
  });

  describe('login', () => {
    it('should throw an error if email is empty', () => {
      expect(() => login('', 'password123')).toThrow('Email is required');
      expect(() => login('   ', 'password123')).toThrow('Email is required');
    });

    it('should throw an error if email format is invalid', () => {
      expect(() => login('not-an-email', 'password123')).toThrow('Please enter a valid email address');
    });

    it('should throw an error if password is empty', () => {
      expect(() => login('user@ggc.edu', '')).toThrow('Password is required');
      expect(() => login('user@ggc.edu', '   ')).toThrow('Password is required');
    });

    it('should throw an error if password is too short', () => {
      expect(() => login('user@ggc.edu', '123')).toThrow('Password must be at least 4 characters');
    });

    it('should successfully log in, return session, and persist to localStorage', () => {
      const session = login('dispatcher@ggc.edu', 'Pothole2026!');
      expect(session).toBeDefined();
      expect(session.email).toBe('dispatcher@ggc.edu');
      expect(session.role).toBe('Dispatcher');
      expect(session.token).toMatch(/^auth_/);
      expect(session.expiresAt).toBeGreaterThan(Date.now());

      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(parsed.email).toBe('dispatcher@ggc.edu');
      expect(parsed.token).toBe(session.token);
    });

    it('should create Viewer session for external users', () => {
      const session = login('viewer@gwinnett.gov', 'Pothole2026!');
      expect(session.role).toBe('Viewer');
    });
  });

  describe('getSession & isSessionValid', () => {
    it('should return null when no session exists', () => {
      expect(getSession()).toBeNull();
      expect(isSessionValid()).toBe(false);
    });

    it('should return active session if within 8 hours', () => {
      const session = login('dispatcher@ggc.edu', 'secret123');
      const retrieved = getSession();
      expect(retrieved).not.toBeNull();
      expect(retrieved?.email).toBe('dispatcher@ggc.edu');
      expect(isSessionValid()).toBe(true);
      expect(isSessionValid(session)).toBe(true);
    });

    it('should expire and clear session after 8 hours', () => {
      const now = Date.now();
      const expiredSession = {
        email: 'dispatcher@ggc.edu',
        token: 'auth_test_123',
        expiresAt: now - 1000, // expired 1s ago
        role: 'Dispatcher' as const
      };
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(expiredSession));

      expect(isSessionValid()).toBe(false);
      expect(getSession()).toBeNull();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove session from localStorage', () => {
      login('dispatcher@ggc.edu', 'secret123');
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).not.toBeNull();

      logout();
      expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
      expect(getSession()).toBeNull();
    });
  });
});
