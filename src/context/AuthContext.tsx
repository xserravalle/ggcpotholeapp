import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthContextType } from '../types/auth';
import { getOfficerById } from '../data/officersData';
import { isSupabaseConfigured, supabaseAuth, getStoredSession } from '../services/supabaseClient';

const STORAGE_KEY = 'ggc-auth-user';

const DEFAULT_GUEST: AuthUser = {
  role: 'guest'
};

const defaultContext: AuthContextType = {
  user: DEFAULT_GUEST,
  isAdmin: false,
  isOfficer: false,
  isLoggedIn: false,
  isBackendConnected: false,
  loginAsAdmin: () => ({ success: false, error: 'AuthProvider not initialized' }),
  loginAsUser: () => {},
  loginAsOfficer: () => ({ success: false, error: 'AuthProvider not initialized' }),
  logout: () => {},
  deleteAccount: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {}
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          (parsed.role === 'admin' ||
            parsed.role === 'user' ||
            parsed.role === 'officer' ||
            parsed.role === 'guest')
        ) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }
    return DEFAULT_GUEST;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isBackendConnected = isSupabaseConfigured();

  // Restore authenticated session on mount if backend is connected
  useEffect(() => {
    if (isBackendConnected) {
      const session = getStoredSession();
      if (session?.user?.id) {
        supabaseAuth.getUserRole(session.user.id).then(roleRecord => {
          if (roleRecord) {
            setUser({
              id: session.user.id,
              role: roleRecord.role,
              email: session.user.email,
              displayName: session.user.user_metadata?.displayName || session.user.email?.split('@')[0],
              agencyId: roleRecord.agency_id || undefined,
              officerId: roleRecord.officer_id || undefined,
            });
          }
        }).catch(err => {
          console.warn('Failed to verify backend user role:', err);
        });
      }
    }
  }, [isBackendConnected]);

  useEffect(() => {
    try {
      if (user.role === 'guest') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      }
    } catch (e) {
      console.warn('Failed to persist auth user', e);
    }
  }, [user]);

  const loginAsAdmin = (
    credentialsOrPasscode: string,
    password?: string
  ): any => {
    // 1. Supabase Backend Real Authentication
    if (isBackendConnected && password) {
      return (async () => {
        const { session, error } = await supabaseAuth.signInWithPassword(credentialsOrPasscode, password);
        if (error || !session) {
          return { success: false, error: error || 'Authentication failed' };
        }

        const roleRecord = await supabaseAuth.getUserRole(session.user.id);
        if (!roleRecord || roleRecord.role !== 'admin') {
          await supabaseAuth.signOut();
          return {
            success: false,
            error: 'Access denied: Account does not hold municipal administrator privileges in Supabase Postgres.',
          };
        }

        const adminUser: AuthUser = {
          id: session.user.id,
          role: 'admin',
          email: session.user.email,
          displayName: session.user.user_metadata?.displayName || 'GGC Transportation Staff',
          agency: 'Gwinnett County Municipal Public Works',
        };
        setUser(adminUser);
        setIsAuthModalOpen(false);
        return { success: true };
      })();
    }

    // 2. Offline Demo Sandbox Fallback
    const normalized = credentialsOrPasscode.trim().toLowerCase();
    const demoAllowed = ['admin', 'staff', 'ggc-staff', 'ggc2026', 'potholeadmin'];

    if (demoAllowed.includes(normalized)) {
      const adminUser: AuthUser = {
        role: 'admin',
        displayName: 'GGC Transportation Staff',
        agency: 'Gwinnett County Municipal Public Works',
      };
      setUser(adminUser);
      setIsAuthModalOpen(false);
      return { success: true };
    }

    return {
      success: false,
      error: 'Invalid staff passcode.',
    };
  };

  const loginAsUser = (email: string, displayName?: string, password?: string): any => {
    const cleanEmail = email.trim();

    if (isBackendConnected && password) {
      return (async () => {
        const { session, error } = await supabaseAuth.signInWithPassword(cleanEmail, password);
        if (error || !session) {
          const signupRes = await supabaseAuth.signUp(cleanEmail, password, displayName);
          if (signupRes.error || !signupRes.session) {
            return { success: false, error: signupRes.error || error || 'Login failed' };
          }
        }
        const commuterUser: AuthUser = {
          role: 'user',
          email: cleanEmail,
          displayName: displayName?.trim() || cleanEmail.split('@')[0] || 'Commuter',
        };
        setUser(commuterUser);
        setIsAuthModalOpen(false);
        return { success: true };
      })();
    }

    const commuterUser: AuthUser = {
      role: 'user',
      email: cleanEmail,
      displayName: displayName?.trim() || cleanEmail.split('@')[0] || 'Commuter',
    };
    setUser(commuterUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const loginAsOfficer = (
    officerIdOrEmail: string,
    password?: string
  ): any => {
    if (isBackendConnected && password) {
      return (async () => {
        const { session, error } = await supabaseAuth.signInWithPassword(officerIdOrEmail, password);
        if (error || !session) {
          return { success: false, error: error || 'Authentication failed' };
        }

        const roleRecord = await supabaseAuth.getUserRole(session.user.id);
        if (!roleRecord || roleRecord.role !== 'officer') {
          await supabaseAuth.signOut();
          return {
            success: false,
            error: 'Access denied: Account is not registered as active agency crew in Supabase Postgres.',
          };
        }

        const officerUser: AuthUser = {
          id: session.user.id,
          role: 'officer',
          officerId: roleRecord.officer_id || undefined,
          agencyId: roleRecord.agency_id || undefined,
          displayName: session.user.user_metadata?.displayName || 'Agency Crew',
          agency: roleRecord.agency_id || 'Municipal Public Works',
        };
        setUser(officerUser);
        setIsAuthModalOpen(false);
        return { success: true };
      })();
    }

    // Demo Officer Fallback
    const officer = getOfficerById(officerIdOrEmail);
    if (!officer) {
      return { success: false, error: 'Demo officer not found.' };
    }
    const officerUser: AuthUser = {
      id: officer.id,
      role: 'officer',
      officerId: officer.id,
      agencyId: officer.agencyId,
      displayName: officer.name,
      agency: `${officer.title} — ${officer.agencyId}`,
    };
    setUser(officerUser);
    setIsAuthModalOpen(false);
    return { success: true };
  };

  const logout = async () => {
    if (isBackendConnected) {
      await supabaseAuth.signOut();
    }
    setUser(DEFAULT_GUEST);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear stored auth user', e);
    }
  };

  /**
   * Permanent account deletion (Apple App Store Guideline 5.1.1(v) compliance)
   */
  const deleteAccount = async (): Promise<{ success: boolean; error?: string }> => {
    if (isBackendConnected) {
      const result = await supabaseAuth.deleteAccount();
      if (!result.success) {
        return result;
      }
    }
    await logout();
    return { success: true };
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const isAdmin = user.role === 'admin';
  const isOfficer = user.role === 'officer';
  const isLoggedIn = user.role !== 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isOfficer,
        isLoggedIn,
        isBackendConnected,
        loginAsAdmin,
        loginAsUser,
        loginAsOfficer,
        logout,
        deleteAccount,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
