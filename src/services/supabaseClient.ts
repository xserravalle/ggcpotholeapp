/**
 * SansPotholes Supabase REST & Auth Service.
 * Implemented using native standard fetch to strictly avoid adding extra npm dependencies.
 *
 * Cloudflare Pages Environment Variables:
 * - VITE_SUPABASE_URL: e.g. https://xyzcompany.supabase.co
 * - VITE_SUPABASE_ANON_KEY: Public client anon key
 */

const AUTH_TOKEN_KEY = 'ggc-supabase-auth-token';
const AUTH_USER_KEY = 'ggc-supabase-auth-user';

export interface SupabaseAuthSession {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      displayName?: string;
      [key: string]: unknown;
    };
  };
}

export interface SupabaseUserRoleRecord {
  user_id: string;
  role: 'admin' | 'officer' | 'user';
  officer_id?: string | null;
  agency_id?: string | null;
}

export function getSupabaseUrl(): string {
  return (import.meta.env.VITE_SUPABASE_URL || '').replace(/\/$/, '');
}

export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}

/**
 * Returns true if real Supabase environment variables are configured.
 * When false, the application gracefully operates in Demo Mode (offline sandbox).
 */
export function isSupabaseConfigured(): boolean {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  return Boolean(url && key && url.startsWith('http'));
}

export function getStoredSession(): SupabaseAuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_TOKEN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveStoredSession(session: SupabaseAuthSession | null): void {
  try {
    if (!session) {
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_KEY);
    } else {
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(session));
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(session.user));
    }
  } catch (err) {
    console.error('Failed to persist auth session:', err);
  }
}

/**
 * Native fetch wrapper for Supabase PostgREST endpoints.
 */
export async function supabaseFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<{ data: T | null; error: Error | null; status: number }> {
  const baseUrl = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!isSupabaseConfigured()) {
    return {
      data: null,
      error: new Error('Supabase is not configured. Running in offline demo mode.'),
      status: 0,
    };
  }

  const session = getStoredSession();
  const token = session?.accessToken || anonKey;

  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(options.headers || {});
  headers.set('apikey', anonKey);
  headers.set('Authorization', `Bearer ${token}`);
  if (!headers.has('Content-Type') && options.method && options.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  try {
    const resp = await fetch(url, { ...options, headers });
    const status = resp.status;

    if (!resp.ok) {
      let errorMsg = `Supabase request failed with status ${status}`;
      try {
        const errJson = await resp.json();
        errorMsg = errJson.message || errJson.msg || errJson.error_description || errorMsg;
      } catch {
        // use default error message
      }
      return { data: null, error: new Error(errorMsg), status };
    }

    // 204 No Content
    if (status === 204) {
      return { data: null, error: null, status };
    }

    const data = await resp.json();
    return { data, error: null, status };
  } catch (err: any) {
    return { data: null, error: err instanceof Error ? err : new Error(String(err)), status: 0 };
  }
}

/**
 * Supabase Auth API methods via native HTTP POST
 */
export const supabaseAuth = {
  async signInWithPassword(email: string, password: string): Promise<{ session: SupabaseAuthSession | null; error: string | null }> {
    const baseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    if (!isSupabaseConfigured()) {
      return { session: null, error: 'Supabase backend is not configured.' };
    }

    try {
      const resp = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const body = await resp.json();
      if (!resp.ok) {
        return { session: null, error: body.error_description || body.message || 'Authentication failed' };
      }

      const session: SupabaseAuthSession = {
        accessToken: body.access_token,
        refreshToken: body.refresh_token,
        expiresAt: Date.now() + (body.expires_in || 3600) * 1000,
        user: body.user,
      };

      saveStoredSession(session);
      return { session, error: null };
    } catch (err: any) {
      return { session: null, error: err.message || 'Network error during login' };
    }
  },

  async signUp(email: string, password: string, displayName?: string): Promise<{ session: SupabaseAuthSession | null; error: string | null }> {
    const baseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();

    if (!isSupabaseConfigured()) {
      return { session: null, error: 'Supabase backend is not configured.' };
    }

    try {
      const resp = await fetch(`${baseUrl}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          data: { displayName: displayName || email.split('@')[0] },
        }),
      });

      const body = await resp.json();
      if (!resp.ok) {
        return { session: null, error: body.error_description || body.message || 'Signup failed' };
      }

      if (body.access_token) {
        const session: SupabaseAuthSession = {
          accessToken: body.access_token,
          refreshToken: body.refresh_token,
          expiresAt: Date.now() + (body.expires_in || 3600) * 1000,
          user: body.user,
        };
        saveStoredSession(session);
        return { session, error: null };
      }

      return { session: null, error: null }; // Signup successful, check email confirmation
    } catch (err: any) {
      return { session: null, error: err.message || 'Network error during signup' };
    }
  },

  async signOut(): Promise<void> {
    const baseUrl = getSupabaseUrl();
    const anonKey = getSupabaseAnonKey();
    const session = getStoredSession();

    if (isSupabaseConfigured() && session?.accessToken) {
      try {
        await fetch(`${baseUrl}/auth/v1/logout`, {
          method: 'POST',
          headers: {
            apikey: anonKey,
            Authorization: `Bearer ${session.accessToken}`,
          },
        });
      } catch {
        // Silently clear local session
      }
    }

    saveStoredSession(null);
  },

  async getUserRole(userId: string): Promise<SupabaseUserRoleRecord | null> {
    const { data, error } = await supabaseFetch<SupabaseUserRoleRecord[]>(
      `/rest/v1/user_roles?user_id=eq.${encodeURIComponent(userId)}&select=*`
    );
    if (error || !data || data.length === 0) {
      return null;
    }
    return data[0];
  },

  /**
   * Permanent account deletion (Apple App Store Guideline 5.1.1(v) compliance)
   */
  async deleteAccount(): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabaseFetch('/rest/v1/rpc/delete_user_account', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    if (error) {
      return { success: false, error: error.message };
    }

    saveStoredSession(null);
    return { success: true };
  },
};
