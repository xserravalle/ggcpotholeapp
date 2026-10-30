import { UserRole } from '../domain/types';

export type { UserRole };

export interface AuthUser {
  id?: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  agency?: string;
  agencyId?: string;
  officerId?: string;
}

export interface AuthContextType {
  user: AuthUser;
  isAdmin: boolean;
  isOfficer: boolean;
  isLoggedIn: boolean;
  isBackendConnected: boolean;
  loginAsAdmin: (credentialsOrPasscode: string, password?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  loginAsUser: (email: string, displayName?: string, password?: string) => Promise<{ success: boolean; error?: string }> | void;
  loginAsOfficer: (officerIdOrEmail: string, password?: string) => Promise<{ success: boolean; error?: string }> | { success: boolean; error?: string };
  logout: () => void;
  deleteAccount: () => Promise<{ success: boolean; error?: string }>;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}
