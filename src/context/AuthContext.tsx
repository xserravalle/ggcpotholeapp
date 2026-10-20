import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, AuthContextType } from '../types/auth';

const STORAGE_KEY = 'ggc-auth-user';

const DEFAULT_GUEST: AuthUser = {
  role: 'guest'
};

const defaultContext: AuthContextType = {
  user: DEFAULT_GUEST,
  isAdmin: false,
  isLoggedIn: false,
  loginAsAdmin: () => ({ success: false, error: 'AuthProvider not initialized' }),
  loginAsUser: () => {},
  logout: () => {},
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

  const logout = () => {
    setUser(DEFAULT_GUEST);
    try {
      localStorage.removeItem(STORAGE_KEY);
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
        loginAsAdmin,
        loginAsUser,
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
