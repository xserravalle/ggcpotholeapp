import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  LogOut, 
  CheckCircle2, 
  AlertCircle,
  Building2,
  Sparkles,
  CloudCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { CommuterAffiliation } from '../../types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    isAdmin, 
    isLoggedIn, 
    isCloudConnected,
    loginAsAdmin, 
    loginWithCredentials, 
    registerUser, 
    logout 
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'commuter'>('commuter');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  // Commuter Form State
  const [commuterMode, setCommuterMode] = useState<'signin' | 'register'>('signin');
  const [commuterEmail, setCommuterEmail] = useState('');
  const [commuterPassword, setCommuterPassword] = useState('');
  const [commuterConfirmPassword, setCommuterConfirmPassword] = useState('');
  const [commuterName, setCommuterName] = useState('');
  const [commuterAffiliation, setCommuterAffiliation] = useState<CommuterAffiliation>('student');
  const [commuterError, setCommuterError] = useState<string | null>(null);
  const [commuterSuccessMsg, setCommuterSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    const result = loginAsAdmin(adminPasscode);
    if (result.success) {
      setAdminPasscode('');
      onClose();
    } else {
      setAdminError(result.error || 'Authentication failed');
    }
  };

  const handleCommuterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommuterError(null);
    setCommuterSuccessMsg(null);

    if (commuterMode === 'signin') {
      if (!commuterEmail.trim() || !commuterPassword) {
        setCommuterError('Please enter both email and password.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await loginWithCredentials(commuterEmail, commuterPassword);
        if (result.success) {
          setCommuterPassword('');
          onClose();
        } else {
          setCommuterError(result.error || 'Authentication failed');
        }
      } catch {
        setCommuterError('Network error during authentication.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Registration mode
      if (!commuterEmail.trim()) {
        setCommuterError('Please enter an email address.');
        return;
      }
      if (!commuterName.trim()) {
        setCommuterError('Please enter your full or display name.');
        return;
      }
      if (commuterPassword.length < 6) {
        setCommuterError('Password must be at least 6 characters long.');
        return;
      }
      if (commuterPassword !== commuterConfirmPassword) {
        setCommuterError('Passwords do not match.');
        return;
      }

      setIsSubmitting(true);
      try {
        const result = await registerUser({
          email: commuterEmail,
          password: commuterPassword,
          displayName: commuterName,
          affiliation: commuterAffiliation
        });

        if (result.success) {
          setCommuterPassword('');
          setCommuterConfirmPassword('');
          if (result.requiresEmailConfirmation) {
            setCommuterSuccessMsg('Account created! A confirmation email has been sent. Please verify your email before signing in.');
            setCommuterMode('signin');
          } else {
            onClose();
          }
        } else {
          setCommuterError(result.error || 'Registration failed');
        }
      } catch {
        setCommuterError('Network error during account registration.');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
  };

  const handleClose = () => {
    setCommuterPassword('');
    setCommuterConfirmPassword('');
    setCommuterError(null);
    setCommuterSuccessMsg(null);
    setAdminError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div 
        className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border ${
              isAdmin 
                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="auth-modal-title" className="text-lg font-bold text-white tracking-tight">
                  {isLoggedIn ? 'Account Profile' : 'Sign In / Role Access'}
                </h3>
                {isCloudConnected && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/80 text-emerald-400 border border-emerald-800">
                    <CloudCheck className="w-3 h-3" /> Cloud Sync
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isLoggedIn ? 'Manage your active cloud session' : 'Sign in to sync hazard reports across mobile & desktop'}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Logged-In View */}
        {isLoggedIn ? (
          <div className="space-y-4">
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Current Role</span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${
                  isAdmin 
                    ? 'bg-blue-950 text-blue-300 border-blue-800' 
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {isAdmin ? 'Staff Administrator' : 'Registered Commuter'}
                </span>
              </div>

              <div>
                <span className="text-sm font-bold text-white block">
                  {user.displayName || user.email || 'Active User'}
                </span>
                {user.email && (
                  <span className="text-xs text-slate-400 font-mono block mt-0.5">{user.email}</span>
                )}
                {user.agency && (
                  <span className="text-xs text-blue-300 font-medium block mt-0.5">{user.agency}</span>
                )}
                {user.affiliation && (
                  <span className="text-xs text-emerald-400 font-medium block mt-0.5 capitalize">
                    {user.affiliation.replace('_', ' ')}
                  </span>
                )}
              </div>

              {isAdmin ? (
                <div className="pt-2 border-t border-slate-700/60 text-xs text-blue-200/90 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Municipal Dispatch Hub & Pavement Analytics are unlocked in the navigation menu.
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-700/60 text-xs text-emerald-200/90 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Your account is active. Reports and sensor detections are synced across all your devices.
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out (Return to Guest Mode)</span>
            </button>
          </div>
        ) : (
          /* Sign In / Register Options */
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-1 bg-slate-800/70 p-1 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('commuter');
                  setAdminError(null);
                  setCommuterError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'commuter'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-4 h-4" />
                <span>Commuter Sign In</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setAdminError(null);
                  setCommuterError(null);
                }}
                className={`py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Staff</span>
              </button>
            </div>

            {/* Commuter / Student Form */}
            {activeTab === 'commuter' ? (
              <form onSubmit={handleCommuterSubmit} className="space-y-3.5">
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-200">
                  <p className="font-semibold flex items-center gap-1.5 text-emerald-300">
                    <Sparkles className="w-4 h-4" /> Cross-Device Cloud Sync
                  </p>
                  <p className="text-[11px] text-emerald-300/80 mt-1">
                    Sign in to access your hazard reports, sensor telemetry, and dispatch dockets on both mobile and desktop.
                  </p>
                </div>

                {/* Sub-mode switcher */}
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-semibold text-slate-300">
                    {commuterMode === 'signin' ? 'Sign In' : 'Create Cloud Account'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCommuterMode(commuterMode === 'signin' ? 'register' : 'signin');
                      setCommuterError(null);
                      setCommuterSuccessMsg(null);
                      setCommuterPassword('');
                      setCommuterConfirmPassword('');
                    }}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold transition"
                  >
                    {commuterMode === 'signin' ? 'Need an account? Register' : 'Have an account? Sign In'}
                  </button>
                </div>

                {commuterSuccessMsg && (
                  <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-2.5 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{commuterSuccessMsg}</span>
                  </div>
                )}

                {/* Registration fields */}
                {commuterMode === 'register' && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        required
                        value={commuterName}
                        onChange={(e) => setCommuterName(e.target.value)}
                        placeholder="e.g. Alex Grizzly"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Affiliation
                      </label>
                      <select
                        value={commuterAffiliation}
                        onChange={(e) => setCommuterAffiliation(e.target.value as CommuterAffiliation)}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      >
                        <option value="student">GGC Student</option>
                        <option value="faculty_staff">GGC Faculty / Staff</option>
                        <option value="gwinnett_resident">Gwinnett County Resident</option>
                        <option value="commercial_driver">Commercial / Delivery Driver</option>
                      </select>
                    </div>
                  </>
                )}

                {/* Email (common to both signin and register) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={commuterEmail}
                      onChange={(e) => setCommuterEmail(e.target.value)}
                      placeholder="student@ggc.edu"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Password (common to both signin and register) */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-slate-300">
                      Password
                    </label>
                    {commuterMode === 'register' && (
                      <span className="text-[10px] text-slate-400">Min. 6 characters</span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      value={commuterPassword}
                      onChange={(e) => setCommuterPassword(e.target.value)}
                      placeholder={commuterMode === 'register' ? 'Create a secure password' : 'Enter your password'}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Confirm Password (register mode only) */}
                {commuterMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Confirm Password
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                      <input
                        type="password"
                        required
                        value={commuterConfirmPassword}
                        onChange={(e) => setCommuterConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                )}

                {commuterError && (
                  <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{commuterError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting 
                    ? 'Connecting to Supabase...' 
                    : commuterMode === 'signin' 
                      ? 'Sign In & Sync Reports' 
                      : 'Create Cloud Account'}
                </button>
              </form>
            ) : (
              /* Admin Passcode Form */
              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-3 text-xs text-blue-200">
                  <p className="font-semibold flex items-center gap-1.5 text-blue-300">
                    <Building2 className="w-4 h-4" /> Municipal Authority Access
                  </p>
                  <p className="text-[11px] text-blue-300/80 mt-1">
                    Unlocks Municipal Dispatch Hub, structured road crew work orders, and corridor pavement analytics.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Staff Passcode
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      value={adminPasscode}
                      onChange={(e) => setAdminPasscode(e.target.value)}
                      placeholder="Enter admin passcode"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Prototype test passcode: <code className="text-amber-300 font-mono">admin</code>
                  </p>
                </div>

                {adminError && (
                  <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition active:scale-95"
                >
                  Unlock Admin Portal
                </button>
              </form>
            )}

            {/* Guest reassurance */}
            <div className="pt-2 border-t border-slate-800 text-center">
              <p className="text-[11px] text-slate-400">
                Prefer not to sign in? You are currently browsing as a <strong>Guest</strong>. All map views and pothole reporting work completely without an account.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
