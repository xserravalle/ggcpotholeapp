import React, { useState, useRef, useEffect } from 'react';
import { 
  AlertTriangle, 
  Car, 
  MapPin, 
  FileText, 
  BarChart3, 
  PlusCircle, 
  Building2,
  Menu,
  X,
  Activity,
  CheckCircle2,
  Info,
  LayoutDashboard,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'potholes'
  | 'sensor'
  | 'my-reports'
  | 'dispatcher'
  | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  potholeCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  potholeCount
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
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

  const handleSelectAdminTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <>
      <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center justify-between gap-4">
            
            {/* Branding */}
            <div 
              className="flex items-center space-x-3 cursor-pointer select-none"
              onClick={() => setActiveTab('potholes')}
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black shrink-0 border border-teal-300/40">
                <span className="text-base font-black tracking-tight">P³</span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                    Gwinnett <span className="text-teal-400 font-black">P3</span>
                  </h1>
                  <span className="hidden sm:inline-block text-[11px] font-semibold bg-slate-800 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                    Parking &bull; Potholes &bull; People
                  </span>
                </div>
                <p className="text-xs text-slate-400 hidden sm:block">
                  Report road hazards. Find parking. Gwinnett County — powered by you.
                </p>
              </div>
            </div>

            {/* Right Action & Menu */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Primary Header CTA */}
              <button
                onClick={onOpenReportModal}
                className="hidden sm:flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-teal-500/20 transition-all text-xs active:scale-95"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Report Hazard</span>
              </button>

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
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs">
                    <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      Operations & Agency Tools
                    </div>

                    <button
                      onClick={() => handleSelectAdminTab('dispatcher')}
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
                      onClick={() => handleSelectAdminTab('analytics')}
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

                    <div className="my-1 border-t border-slate-800"></div>

                    <button
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsAboutOpen(true);
                      }}
                      className="w-full px-3.5 py-2 text-left flex items-center space-x-2 text-slate-400 hover:text-white hover:bg-slate-800 transition"
                    >
                      <Info className="w-4 h-4 text-slate-400" />
                      <span>About Gwinnett P3</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Streamlined Primary Navigation Tabs */}
          <nav className="flex space-x-2 sm:space-x-3 mt-3 pt-2.5 border-t border-slate-800 overflow-x-auto no-scrollbar">
            {/* Map Tab */}
            <button
              onClick={() => setActiveTab('potholes')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                activeTab === 'potholes'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Map & Hazards</span>
              <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-2 py-0.5 rounded-full border border-slate-700">
                {potholeCount}
              </span>
            </button>

            {/* Dashboard Tab */}
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard & Parking</span>
            </button>

            {/* Drive Sensor Tab */}
            <button
              onClick={() => setActiveTab('sensor')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                activeTab === 'sensor'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Drive Sensor</span>
            </button>

            {/* My Reports Tab */}
            <button
              onClick={() => setActiveTab('my-reports')}
              className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
                activeTab === 'my-reports'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>My Reports</span>
            </button>
          </nav>
        </div>
      </header>

      {/* About Modal */}
      {isAboutOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold font-mono">
                  P³
                </div>
                <h3 className="text-lg font-bold text-white">About Gwinnett P3</h3>
              </div>
              <button
                onClick={() => setIsAboutOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs sm:text-sm text-slate-300 space-y-3 leading-relaxed">
              <p>
                <strong>Gwinnett P3 (Parking, Potholes & People)</strong> is a civic utility prototype designed for Georgia Gwinnett College (GGC) students and Gwinnett County commuters.
              </p>
              <div className="bg-slate-800/60 rounded-2xl p-3.5 border border-slate-700 space-y-2">
                <div className="font-semibold text-white">Key Capabilities:</div>
                <ul className="list-disc list-inside space-y-1 text-slate-300 text-xs">
                  <li><strong>Real-time Hazard Map</strong>: OpenStreetMap view of campus and county pavement risks.</li>
                  <li><strong>Drive Sensor</strong>: 100 Hz shock detection using your smartphone's built-in accelerometer.</li>
                  <li><strong>Campus Parking Forecast</strong>: Live occupancy and what-if simulation for GGC decks and regional hubs.</li>
                  <li><strong>Social Confirmation</strong>: Community upvoting so road crews prioritize the most severe potholes first.</li>
                </ul>
              </div>
              <p className="text-slate-400 text-xs">
                Built as a collaborative student prototype for Georgia Gwinnett College and Gwinnett County transportation innovation.
              </p>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsAboutOpen(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
