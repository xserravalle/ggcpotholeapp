import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  AlertCircle, 
  ShieldCheck, 
  Eye, 
  ArrowLeft,
  KeyRound
} from 'lucide-react';
import { login, AuthSession } from '../../services/authService';

interface LoginPageProps {
  onLoginSuccess: (session: AuthSession) => void;
  onCancel?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onCancel
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email.trim()) {
      setErrorMessage('Email address is required');
      return;
    }

    if (!password.trim()) {
      setErrorMessage('Password is required');
      return;
    }

    setIsSubmitting(true);
    try {
      const session = login(email, password);
      onLoginSuccess(session);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Authentication failed. Please check your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  // Preview projected role
  const isGgcDomain = email.trim().toLowerCase().endsWith('@ggc.edu');

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative space-y-6">
        
        {/* Top Back Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Public Map</span>
          </button>
        )}

        {/* Branding & Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black text-xl border border-teal-300/40">
            P³
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Authority Operations Hub
          </h2>
          <p className="text-xs text-slate-400">
            Secure access for Gwinnett municipal dispatchers, maintenance personnel, and observers.
          </p>
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div 
            role="alert"
            className="bg-rose-950/80 border border-rose-800 text-rose-300 px-4 py-3 rounded-2xl text-xs flex items-center gap-2.5 animate-in fade-in duration-200"
          >
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form noValidate onSubmit={handleSubmit} className="space-y-4">
          
          {/* Email Field */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-slate-300 block">
              Official Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="dispatcher@ggc.edu"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Password Field */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-slate-300 block">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-800 focus:border-teal-500 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition"
              />
            </div>
          </div>

          {/* Dynamic Role Preview Badge */}
          {email.includes('@') && (
            <div className="text-[11px] p-2.5 rounded-xl border flex items-center gap-2 transition bg-slate-950">
              {isGgcDomain ? (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-emerald-300">
                    Recognized domain: <strong>Dispatcher Role</strong> (full work order control)
                  </span>
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 text-blue-400 shrink-0" />
                  <span className="text-blue-300">
                    Public domain: <strong>Viewer Role</strong> (read-only incident map access)
                  </span>
                </>
              )}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold py-2.5 rounded-xl shadow-lg shadow-teal-500/20 text-xs transition active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{isSubmitting ? 'Authenticating...' : 'Sign In to Operations Hub'}</span>
          </button>
        </form>

        {/* Domain Access Guidance */}
        <div className="border-t border-slate-800 pt-4 space-y-2 text-[11px] text-slate-400">
          <div className="font-semibold text-slate-300 flex items-center gap-1">
            <span>Role-Based Access Control Rules:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-emerald-400 font-bold block flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> @ggc.edu Domain
              </span>
              <span className="text-slate-400">Dispatcher: update status, route work orders, assign road crews.</span>
            </div>
            <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800">
              <span className="text-blue-400 font-bold block flex items-center gap-1">
                <Eye className="w-3 h-3" /> Other Domains
              </span>
              <span className="text-slate-400">Viewer: inspect map and reports in read-only mode.</span>
            </div>
          </div>

          {/* Fast Demo Fill Links */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickFill('dispatcher@ggc.edu', 'PotholePatrol2026!')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-300 text-[10px] font-mono border border-emerald-900 transition"
            >
              Quick Fill: Dispatcher Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('observer@gwinnett.gov', 'PotholePatrol2026!')}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-mono border border-blue-900 transition"
            >
              Quick Fill: Viewer Demo
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
