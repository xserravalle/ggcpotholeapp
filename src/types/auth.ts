export type UserRole = 'guest' | 'user' | 'admin';

export type CommuterAffiliation = 
  | 'student' 
  | 'faculty_staff' 
  | 'gwinnett_resident' 
  | 'commercial_driver';

export interface RegisterUserInput {
  email: string;
  password: string;
  displayName: string;
  affiliation?: CommuterAffiliation;
}

export interface AuthUser {
  role: UserRole;
  id?: string;
  email?: string;
  displayName?: string;
  agency?: string;
  affiliation?: CommuterAffiliation;
}

export interface AuthContextType {
  user: AuthUser;
  isAdmin: boolean;
  isLoggedIn: boolean;
  isCloudConnected: boolean;
  loginAsAdmin: (passcode: string) => { success: boolean; error?: string };
  loginAsUser: (email: string, displayName?: string) => void;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  registerUser: (input: RegisterUserInput) => Promise<{ success: boolean; requiresEmailConfirmation?: boolean; error?: string }>;
  logout: () => void;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
}
