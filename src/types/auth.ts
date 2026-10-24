export type UserRole = 'guest' | 'user' | 'admin';

export interface AuthUser {
  role: UserRole;
  email?: string;
  displayName?: string;
  agency?: string;
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
