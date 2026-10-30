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
  Wrench
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getOfficersGroupedByAgency, DEMO_OFFICERS } from '../../data/officersData';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const { user, isAdmin, isOfficer, isLoggedIn, loginAsAdmin, loginAsUser, loginAsOfficer, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'admin' | 'commuter' | 'officer'>('admin');
  const [adminPasscode, setAdminPasscode] = useState('');
  const [adminError, setAdminError] = useState<string | null>(null);

  const [commuterEmail, setCommuterEmail] = useState('');
  const [commuterName, setCommuterName] = useState('');

  const officerGroups = getOfficersGroupedByAgency();
  const [selectedOfficerId, setSelectedOfficerId] = useState<string>(DEMO_OFFICERS[0]?.id || '');

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

  const handleCommuterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commuterEmail.trim()) return;
    loginAsUser(commuterEmail, commuterName);
    setCommuterEmail('');
    setCommuterName('');
    onClose();
  };

  const handleOfficerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOfficerId) return;
    loginAsOfficer(selectedOfficerId);
    onClose();
  };

  const handleSignOut = () => {
    logout();
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
                : isOfficer
                ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}>
              {isAdmin ? <ShieldCheck className="w-5 h-5" /> : isOfficer ? <Wrench className="w-5 h-5" /> : <User className="w-5 h-5" />}
            </div>
            <div>
              <h3 id="auth-modal-title" className="text-lg font-bold text-white tracking-tight">
                {isLoggedIn ? 'Account Profile' : 'Sign In / Role Access'}
              </h3>
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
              className="w-full py-2.5 bg-rose-900/40 hover:bg-rose-900/70 text-rose-300 border border-rose-800/60 font-semibold rounded-xl text-xs flex items-center justify-center gap-2 transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out (Return to Guest Mode)</span>
            </button>
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

            {/* Admin Passcode Form */}
            {activeTab === 'admin' ? (
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
            ) : activeTab === 'officer' ? (
              /* Officer / Agency Crew Form */
              <form onSubmit={handleOfficerSubmit} className="space-y-3.5">
                <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-3 text-xs text-purple-200">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold flex items-center gap-1.5 text-purple-300">
                      <Wrench className="w-4 h-4" /> Agency Crew Simulation
                    </p>
                    <span className="text-[10px] font-mono bg-purple-900/60 text-purple-200 px-2 py-0.5 rounded-full border border-purple-700">
                      Demo Mode
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
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-purple-600/20 transition active:scale-95 flex items-center justify-center gap-1.5"
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
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-emerald-600/20 transition active:scale-95"
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
