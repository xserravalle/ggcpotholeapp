import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  Car,
  BarChart3, 
  Building2,
  Menu, 
  X, 
  CheckCircle2, 
  Info, 
  ChevronRight,
  Settings,
  ShieldCheck,
  User,
  LogOut,
  Route,
  FileDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type ActiveTab = 
  | 'dashboard'
  | 'potholes'
  | 'sensor'
  | 'my-reports'
  | 'about'
  | 'dispatcher'
  | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal?: () => void;
  onOpenSettings?: () => void;
  onOpenAuthModal?: () => void;
  potholeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal: _onOpenReportModal,
  onOpenSettings,
  onOpenAuthModal,
  potholeCount: _potholeCount
}) => {
  const { user, isAdmin, isLoggedIn, openAuthModal: contextOpenAuthModal, logout } = useAuth();
  const handleOpenAuth = onOpenAuthModal || contextOpenAuthModal;

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className="shrink-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Branding */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('potholes')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-700 flex items-center justify-center shadow-md text-white font-black shrink-0 border border-emerald-400/40">
              <span className="text-base font-black tracking-tight">SP</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  GGC <span className="text-emerald-400 font-black">SansPotholes</span>
                </h1>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">
                Report road hazards in Comic Sans. Find parking. Gwinnett County — powered by you.
              </p>
            </div>
          </div>

          {/* Right Action & Menu */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Account / Role Badge or Sign In Button */}
            {isAdmin ? (
              <button
                onClick={handleOpenAuth}
                aria-label="Staff Administrator Portal"
                title="Staff Administrator Portal (Signed In)"
                className="px-2.5 py-1.5 rounded-xl bg-blue-950/70 border border-blue-600/60 text-blue-300 text-xs font-bold hover:bg-blue-900/80 transition flex items-center gap-1.5 active:scale-95"
              >
                <ShieldCheck className="w-4 h-4 text-blue-400" />
                <span className="hidden sm:inline">Staff Admin</span>
              </button>
            ) : isLoggedIn ? (
              <button
                onClick={handleOpenAuth}
                aria-label="Commuter Profile"
                title="Commuter Profile (Signed In)"
                className="px-2.5 py-1.5 rounded-xl bg-emerald-950/70 border border-emerald-600/60 text-emerald-300 text-xs font-bold hover:bg-emerald-900/80 transition flex items-center gap-1.5 active:scale-95"
              >
                <User className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline max-w-[100px] truncate">{user.displayName || 'Commuter'}</span>
              </button>
            ) : (
              <button
                onClick={handleOpenAuth}
                aria-label="Sign in"
                title="Sign in or Admin access"
                className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 active:scale-95"
              >
                <User className="w-4 h-4 text-slate-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}

            {/* Settings / Accessibility Button */}
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                aria-label="Settings and options"
                title="Settings & Accessibility"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition flex items-center gap-1.5 text-xs font-semibold active:scale-95"
              >
                <Settings className="w-4 h-4 text-emerald-400" />
                <span className="hidden sm:inline">Settings</span>
              </button>
            )}

            {/* Hamburger / Secondary Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="More options"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Dropdown Menu */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  
                  {/* Active Profile Header */}
                  <div className="px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Active Profile
                      </div>
                      <div className="font-bold text-white text-xs truncate">
                        {isAdmin 
                          ? 'Staff Administrator' 
                          : isLoggedIn 
                            ? (user.displayName || user.email) 
                            : 'Guest Mode'}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        handleOpenAuth();
                      }}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-300 hover:text-white border border-slate-700 transition"
                    >
                      {isLoggedIn ? 'Manage' : 'Sign In'}
                    </button>
                  </div>

                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Preferences & Driver Tools
                  </div>

                  {onOpenSettings && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition text-slate-300"
                    >
                      <div className="flex items-center space-x-2.5">
                        <Settings className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-semibold text-white">Settings & Accessibility</div>
                          <div className="text-[10px] text-slate-500">Text size, themes & audio</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                    </button>
                  )}

                  <button
                    onClick={() => handleSelectTab('sensor')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                      activeTab === 'sensor' ? 'text-teal-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Route className="w-4 h-4 text-teal-400" />
                      <div>
                        <div className="font-semibold">Drive-Time Mapping</div>
                        <div className="text-[10px] text-slate-500">Route tracking & shock detector</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* Operations & Agency Tools: ONLY for Admins */}
                  {isAdmin ? (
                    <>
                      <div className="px-3 py-1.5 border-t border-b border-slate-800 text-[10px] uppercase font-bold text-blue-400 tracking-wider mt-1">
                        Operations & Agency Tools
                      </div>

                      <button
                        onClick={() => handleSelectTab('dispatcher')}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                          activeTab === 'dispatcher' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <Building2 className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="font-semibold">Municipal Dispatch Hub</div>
                            <div className="text-[10px] text-slate-500">Agency work order tracking</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>

                      <button
                        onClick={() => handleSelectTab('analytics')}
                        className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                          activeTab === 'analytics' ? 'text-teal-400 font-bold bg-slate-800/60' : 'text-slate-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2.5">
                          <BarChart3 className="w-4 h-4 text-teal-400" />
                          <div>
                            <div className="font-semibold">Pavement Analytics</div>
                            <div className="text-[10px] text-slate-500">Corridor PCI & risk metrics</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 border-t border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider mt-1">
                        Staff Access
                      </div>
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          handleOpenAuth();
                        }}
                        className="w-full px-3.5 py-2 text-left flex items-center justify-between hover:bg-slate-800 transition text-slate-400 hover:text-white"
                      >
                        <div className="flex items-center space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-blue-400" />
                          <div>
                            <div className="font-medium text-slate-300">Staff / Admin Sign In</div>
                            <div className="text-[10px] text-slate-500">Agency work order portal</div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                      </button>
                    </>
                  )}

                  <div className="my-1 border-t border-slate-800"></div>

                  {/* Presentations & Deliverables */}
                  <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Presentations & Deliverables
                  </div>

                  <a
                    href="/GGC_SansPotholes_Branch_Evolution_Presentation.pptx"
                    download="GGC_SansPotholes_Branch_Evolution_Presentation.pptx"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition text-emerald-400 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileDown className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                      <div>
                        <div className="font-semibold text-emerald-300">Capstone Evaluation Deck</div>
                        <div className="text-[10px] text-slate-400">12 slides in Comic Sans MS (.pptx)</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800 uppercase">
                      12 Slides
                    </span>
                  </a>

                  <a
                    href="/GGC_SansPotholes_Press_Release.pptx"
                    download="GGC_SansPotholes_Press_Release.pptx"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition text-cyan-400 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileDown className="w-4 h-4 text-cyan-400 shrink-0 group-hover:scale-110 transition" />
                      <div>
                        <div className="font-semibold text-cyan-300">Press Release Deck</div>
                        <div className="text-[10px] text-slate-400">3 slides with screencaptures (.pptx)</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-cyan-950 text-cyan-300 font-bold px-1.5 py-0.5 rounded border border-cyan-800 uppercase">
                      Press Release
                    </span>
                  </a>

                  <div className="my-1 border-t border-slate-800"></div>

                  {/* About GGC SansPotholes */}
                  <button
                    onClick={() => handleSelectTab('about')}
                    className={`w-full px-3.5 py-2 text-left flex items-center space-x-2 transition ${
                      activeTab === 'about' ? 'text-teal-400 font-bold bg-slate-800/60' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Info className="w-4 h-4 text-slate-400" />
                    <span>About GGC SansPotholes</span>
                  </button>

                  {isLoggedIn && (
                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        logout();
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center space-x-2 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 transition border-t border-slate-800/80 mt-1"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out ({isAdmin ? 'Admin' : 'Commuter'})</span>
                    </button>
                  )}

                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Navigation Tabs */}
        <nav className="flex space-x-2 sm:space-x-3 mt-3 pt-2.5 border-t border-slate-800 overflow-x-auto no-scrollbar">
          {/* Map Tab */}
          <button
            onClick={() => setActiveTab('potholes')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'potholes'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Map</span>
          </button>

          {/* Drive-Time Mapping Tab */}
          <button
            onClick={() => setActiveTab('sensor')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'sensor'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-teal-300 hover:text-white hover:bg-slate-800/80 border border-teal-500/20'
            }`}
          >
            <Route className="w-4 h-4 text-teal-400" />
            <span>Drive-Time</span>
          </button>

          {/* Parking Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <Car className="w-4 h-4" />
            <span>Parking</span>
          </button>

          {/* My Reports Tab */}
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'my-reports'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>My Reports</span>
          </button>

          {/* Active Admin Tools Tabs (Only visible when Admin navigates to them) */}
          {isAdmin && activeTab === 'dispatcher' && (
            <button
              onClick={() => setActiveTab('dispatcher')}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap bg-blue-700 text-white shadow-md"
            >
              <Building2 className="w-4 h-4" />
              <span>Dispatch Hub</span>
            </button>
          )}

          {isAdmin && activeTab === 'analytics' && (
            <button
              onClick={() => setActiveTab('analytics')}
              className="px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap bg-teal-700 text-white shadow-md"
            >
              <BarChart3 className="w-4 h-4" />
              <span>Pavement Analytics</span>
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};
