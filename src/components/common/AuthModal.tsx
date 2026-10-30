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
  Wrench,
  Trash2,
  Database
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOfficersGroupedByAgency, DEMO_OFFICERS } from '../../data/officersData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { 
    user, 
    isAdmin, 
    isOfficer, 
    isLoggedIn, 
    isBackendConnected,
    loginAsAdmin, 
    loginAsUser, 
    loginAsOfficer, 
    logout,
    deleteAccount
  } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'commuter' | 'officer'>('admin');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const [commuterEmail, setCommuterEmail] = useState('');
  const [commuterName, setCommuterName] = useState('');
  const [commuterPassword, setCommuterPassword] = useState('');

  const officerGroups = getOfficersGroupedByAgency();
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(DEMO_OFFICERS[0]?.id || '');
  const [officerPassword, setOfficerPassword] = useState('');

  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  if (!isOpen) return null;

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError(null);
    setAuthLoading(true);
    try {
      const result = await loginAsAdmin(adminEmail || adminPasscode, adminPassword || undefined);
      if (result.success) {
        setAdminPasscode('');
        setAdminEmail('');
        setAdminPassword('');
        onClose();
      } else {
        setAdminError(result.error || 'Authentication failed');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCommuterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commuterEmail.trim()) return;
    setAuthLoading(true);
    try {
      await loginAsUser(commuterEmail, commuterName, commuterPassword || undefined);
      setCommuterEmail('');
      setCommuterName('');
      setCommuterPassword('');
      onClose();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleOfficerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerId) return;
    setAuthLoading(true);
    try {
      await loginAsOfficer(selectedOfficerId, officerPassword || undefined);
      onClose();
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = () => {
    logout();
    onClose();
  };

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setDeleteAccountConfirm(false);
      onClose();
    } finally {
      setIsDeletingAccount(false);
    }
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
                : isOfficer
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : isOfficer ? <Wrench className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="auth-modal-title" className="text-lg font-bold text-white tracking-tight">
                  {isLoggedIn ? 'Account Profile' : 'Sign In / Role Access'}
                </h3>
                {isBackendConnected ? (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" /> Supabase
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-amber-950/80 text-amber-300 border border-amber-800/60">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                {isLoggedIn ? 'Manage your active session' : 'Sign in for staff, crew demo, or citizen tools'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
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
                    : isOfficer
                    ? 'bg-purple-950 text-purple-300 border-purple-800'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {isAdmin ? 'Staff Administrator' : isOfficer ? 'Agency Crew (Demo)' : 'Registered Commuter'}
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
              </div>

              {isAdmin ? (
                <div className="pt-2 border-t border-slate-700/60 text-xs text-blue-200/90 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  <span>
                    Municipal Dispatch Hub & Pavement Analytics are unlocked in the navigation menu.
                  </span>
                </div>
              ) : isOfficer ? (
                <div className="pt-2 border-t border-slate-700/60 text-xs text-purple-200/90 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    Field work order execution and My Assignments workspace are enabled.
                  </span>
                </div>
              ) : (
                <div className="pt-2 border-t border-slate-700/60 text-xs text-emerald-200/90 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    Your submitted hazard reports are linked to this profile for cross-device access.
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out (Return to Guest Mode)</span>
            </button>

            {/* Apple App Store Mandated Account Deletion (Guideline 5.1.1(v)) */}
            <div className="pt-2 border-t border-slate-800">
              {!deleteAccountConfirm ? (
                <button
                  type="button"
                  onClick={() => setDeleteAccountConfirm(true)}
                  className="w-full py-2 px-3 text-slate-400 hover:text-rose-400 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Account & Personal Data</span>
                </button>
              ) : (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-xl p-3 space-y-2">
                  <p className="text-[11px] text-rose-300">
                    Are you sure? This permanently wipes your user credentials and unlinks your submitted reports, complying with Apple App Store account deletion requirements.
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setDeleteAccountConfirm(false)}
                      className="flex-1 py-1.5 bg-slate-800 text-slate-300 text-xs rounded-lg border border-slate-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={isDeletingAccount}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg shadow"
                    >
                      {isDeletingAccount ? 'Deleting...' : 'Confirm Account Deletion'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Sign In Options */
          <div className="space-y-4">
            {/* Tab Selector */}
            <div className="grid grid-cols-3 gap-1 bg-slate-800/70 p-1 rounded-2xl border border-slate-700">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setAdminError(null);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                  activeTab === 'admin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('commuter');
                  setAdminError(null);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                  activeTab === 'commuter'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Citizen</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('officer');
                  setAdminError(null);
                }}
                className={`py-2 px-1 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition ${
                  activeTab === 'officer'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Agency Crew (Demo)</span>
              </button>
            </div>

            {/* Admin Passcode / Backend Login Form */}
            {activeTab === 'admin' ? (
              <form onSubmit={handleAdminSubmit} className="space-y-3.5">
                <div className="bg-blue-950/30 border border-blue-800/40 rounded-2xl p-3 text-xs text-blue-200">
                  <p className="font-semibold flex items-center gap-1.5 text-blue-300">
                    <Building2 className="w-4 h-4" /> Municipal Authority Access
                  </p>
                  <p className="text-[11px] text-blue-300/80 mt-1">
                    {isBackendConnected
                      ? 'Secure administrator sign-in verified by Supabase Postgres Row-Level Security.'
                      : 'Unlocks Municipal Dispatch Hub, structured road crew work orders, and corridor pavement analytics.'}
                  </p>
                </div>

                {isBackendConnected ? (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Staff Email
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="email"
                          required
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          placeholder="staff@gwinnettcounty.gov"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="password"
                          required
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="••••••••••••"
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </>
                ) : (
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
                  </div>
                )}

                {adminError && (
                  <div className="bg-rose-950/40 border border-rose-800/50 rounded-xl p-2.5 text-xs text-rose-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>{adminError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-600/20 transition active:scale-95 disabled:opacity-60"
                >
                  {authLoading ? 'Verifying...' : 'Unlock Admin Portal'}
                </button>

                {!isBackendConnected && (
                  <button
                    type="button"
                    onClick={() => {
                      loginAsAdmin('admin');
                      onClose();
                    }}
                    className="w-full py-2 bg-slate-800/80 hover:bg-slate-700 text-blue-300 border border-blue-900/60 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Demo Staff Access</span>
                  </button>
                )}
              </form>
            ) : activeTab === 'officer' ? (
              /* Officer / Agency Crew Form */
              <form onSubmit={handleOfficerSubmit} className="space-y-3.5">
                <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-3 text-xs text-purple-200">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold flex items-center gap-1.5 text-purple-300">
                      <Wrench className="w-4 h-4" /> Agency Crew Access
                    </p>
                    <span className="text-[10px] font-mono bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700">
                      {isBackendConnected ? 'Supabase RLS' : 'Demo Mode'}
                    </span>
                  </div>
                  <p className="text-[11px] text-purple-300/80 mt-1">
                    Select a fictional field officer to test repair work order management, status updates, and officer-specific assignments.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Select Demo Officer (Grouped by Agency)
                  </label>
                  <select
                    value={selectedOfficerId}
                    onChange={(e) => setSelectedOfficerId(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                  >
                    {officerGroups.map((group) => (
                      <optgroup key={group.id} label={group.name} className="bg-slate-900 text-slate-300 font-semibold">
                        {group.officers.map((off) => (
                          <option key={off.id} value={off.id} className="bg-slate-800 text-white">
                            {off.name} — {off.title}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60"
                >
                  <Wrench className="w-4 h-4" />
                  <span>Simulate Officer Login</span>
                </button>
              </form>
            ) : (
              /* Commuter / Student Form */
              <form onSubmit={handleCommuterSubmit} className="space-y-3.5">
                <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-3 text-xs text-emerald-200">
                  <p className="font-semibold flex items-center gap-1.5 text-emerald-300">
                    <Sparkles className="w-4 h-4" /> Save Reports Across Devices
                  </p>
                  <p className="text-[11px] text-emerald-300/80 mt-1">
                    Optional sign-in for Georgia Gwinnett College students and Gwinnett County commuters to sync hazard reports.
                  </p>
                </div>

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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Display Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={commuterName}
                    onChange={(e) => setCommuterName(e.target.value)}
                    placeholder="e.g. Alex Grizzly"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95 disabled:opacity-60"
                >
                  Sign In & Sync Reports
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
