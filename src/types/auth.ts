import { UserRole } from '../domain/types';

export type { UserRole };

export interface AuthUser {
  id?: string;
  role: UserRole;
  email?: string;
  displayName?: string;
  agency?: string;
  officerId?: string;
}

export interface AuthContextType {
  user: AuthUser;
  isAdmin: boolean;
  isLoggedIn: boolean;
  loginAsAdmin: (passcode: string) => { success: boolean; error?: string };
  loginAsUser: (email: string, displayName?: string) => void;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}
