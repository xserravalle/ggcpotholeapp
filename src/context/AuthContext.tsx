import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthContextType, RegisterUserInput } from '../types/auth';
import { 
  isSupabaseConfigured, 
  supabaseAuth, 
  getStoredSession, 
  saveStoredSession 
} from '../services/supabaseClient';

const STORAGE_KEY = 'ggc-auth-user';

const DEFAULT_GUEST: AuthUser = {
  role: 'guest'
};

const defaultContext: AuthContextType = {
  user: DEFAULT_GUEST,
  isAdmin: false,
  isLoggedIn: false,
  isCloudConnected: false,
  loginAsAdmin: () => ({ success: false, error: 'AuthProvider not initialized' }),
  loginAsUser: () => {},
  loginWithCredentials: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  registerUser: async () => ({ success: false, error: 'AuthProvider not initialized' }),
  logout: () => {},
  isAuthModalOpen: false,
  openAuthModal: () => {},
  closeAuthModal: () => {}
};

const AuthContext = createContext<AuthContextType>(defaultContext);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const isCloudConnected = isSupabaseConfigured();

  const [user, setUser] = useState<AuthUser>(() => {
    // 1. If Supabase is configured, check for an active Supabase session first
    if (isCloudConnected) {
      const session = getStoredSession();
      if (session?.user) {
        return {
          role: 'user',
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.displayName || session.user.email?.split('@')[0] || 'Commuter',
          affiliation: session.user.user_metadata?.affiliation as any
        };
      }
    }

    // 2. Fall back to local admin/guest storage
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && (parsed.role === 'admin' || parsed.role === 'user' || parsed.role === 'guest')) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored auth user', e);
    }
    return DEFAULT_GUEST;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  const loginAsAdmin = (passcode: string): { success: boolean; error?: string } => {
    const normalized = passcode.trim().toLowerCase();
    const validCodes = ['admin', 'staff', 'ggc-staff', 'ggc2026', 'potholeadmin'];
    
    if (validCodes.includes(normalized)) {
      const adminUser: AuthUser = {
        role: 'admin',
        displayName: 'GGC Transportation Staff',
        agency: 'Gwinnett County Municipal Public Works'
      };
      setUser(adminUser);
      setIsAuthModalOpen(false);
      return { success: true };
    }

    return { 
      success: false, 
      error: 'Invalid staff passcode. (Hint: Use passcode "admin" for prototype access)' 
    };
  };

  const loginAsUser = (email: string, displayName?: string) => {
    const cleanEmail = email.trim();
    const commuterUser: AuthUser = {
      role: 'user',
      email: cleanEmail,
      displayName: displayName?.trim() || cleanEmail.split('@')[0] || 'Commuter'
    };
    setUser(commuterUser);
    setIsAuthModalOpen(false);
  };

  const loginWithCredentials = async (
    email: string, 
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !password) {
      return { success: false, error: 'Please enter both your email and password.' };
    }

    if (isCloudConnected) {
      const { session, error } = await supabaseAuth.signInWithPassword(cleanEmail, password);
      if (error || !session) {
        return { success: false, error: error || 'Authentication failed' };
      }

      const authUser: AuthUser = {
        role: 'user',
        id: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.displayName || cleanEmail.split('@')[0],
        affiliation: session.user.user_metadata?.affiliation as any
      };

      setUser(authUser);
      setIsAuthModalOpen(false);
      return { success: true };
    }

    // Offline demo fallback
    loginAsUser(cleanEmail);
    return { success: true };
  };

  const registerUser = async (
    input: RegisterUserInput
  ): Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }> => {
    const cleanEmail = input.email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      return { success: false, error: 'Please enter a valid email address.' };
    }
    if (!input.password || input.password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }
    if (!input.displayName.trim()) {
      return { success: false, error: 'Please provide your full or display name.' };
    }

    if (isCloudConnected) {
      const { session, user: supaUser, error } = await supabaseAuth.signUp(
        cleanEmail, 
        input.password, 
        input.displayName,
        input.affiliation
      );

      if (error) {
        return { success: false, error };
      }

      // If Supabase immediately issued a session (email confirmation off)
      if (session) {
        const authUser: AuthUser = {
          role: 'user',
          id: session.user.id,
          email: session.user.email,
          displayName: session.user.user_metadata?.displayName || input.displayName,
          affiliation: input.affiliation
        };
        setUser(authUser);
        setIsAuthModalOpen(false);
        return { success: true };
      }

      // If email confirmation is required
      if (supaUser) {
        return { 
          success: true, 
          requiresEmailConfirmation: true 
        };
      }
    }

    // Offline demo fallback
    loginAsUser(cleanEmail, input.displayName);
    return { success: true };
  };

  const logout = () => {
    if (isCloudConnected) {
      supabaseAuth.signOut();
    }
    setUser(DEFAULT_GUEST);
    try {
      localStorage.removeItem(STORAGE_KEY);
      saveStoredSession(null);
    } catch (e) {
      console.warn('Failed to clear stored auth user', e);
    }
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const isAdmin = user.role === 'admin';
  const isLoggedIn = user.role !== 'guest';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoggedIn,
        isCloudConnected,
        loginAsAdmin,
        loginAsUser,
        loginWithCredentials,
        registerUser,
        logout,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  return useContext(AuthContext);
};
