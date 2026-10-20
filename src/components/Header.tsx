import React, { useState, useRef, useEffect } from 'react';
import { 
  MapPin, 
  BarChart3, 
  PlusCircle, 
  Menu, 
  X, 
  Activity, 
  CheckCircle2, 
  Info, 
  LayoutDashboard, 
  ChevronRight,
  HelpCircle,
  Route,
  FileDown
} from 'lucide-react';

export type ActiveTab = 
  | 'dashboard'
  | 'potholes'
  | 'sensor'
  | 'my-reports'
  | 'about';

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
    <header className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Branding */}
          <div 
            className="flex items-center space-x-3 cursor-pointer select-none"
            onClick={() => setActiveTab('potholes')}
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950 font-black shrink-0 border border-teal-300/40">
              <span className="text-base font-black tracking-tight">SP</span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
                  GGC <span className="text-teal-400 font-black">SansPotholes</span>
                </h1>
                <span className="hidden sm:inline-block text-[11px] font-semibold bg-slate-800 text-teal-300 border border-teal-500/30 px-2.5 py-0.5 rounded-full">
                  Parking & Hazards
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                GGC SansPotholes - Visualizing Gwinnett County, sans potholes.
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

            {/* Hamburger / Navigation Menu */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Navigation menu"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Dropdown Menu replacing old dispatcher with existing menu functionalities */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl py-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Application Features & Navigation
                  </div>

                  {/* 1. Map & Hazards */}
                  <button
                    onClick={() => handleSelectTab('potholes')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                      activeTab === 'potholes' ? 'text-emerald-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Map & Hazards</div>
                        <div className="text-[10px] text-slate-400">Interactive OpenStreetMap hazard pins</div>
                      </div>
                    </div>
                    <span className="text-[10px] bg-slate-800 text-teal-300 font-mono px-1.5 py-0.5 rounded border border-slate-700">
                      {potholeCount}
                    </span>
                  </button>

                  {/* 2. Drive-Time Mapping (Predominantly next to Map) */}
                  <button
                    onClick={() => handleSelectTab('sensor')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                      activeTab === 'sensor' ? 'text-teal-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Route className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Drive-Time Mapping</div>
                        <div className="text-[10px] text-slate-400">Live route telemetry & shock incident readout</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-teal-950 text-teal-300 font-bold px-1.5 py-0.5 rounded border border-teal-800 uppercase">
                      Patrol
                    </span>
                  </button>

                  {/* 3. Dashboard & Parking */}
                  <button
                    onClick={() => handleSelectTab('dashboard')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                      activeTab === 'dashboard' ? 'text-teal-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <LayoutDashboard className="w-4 h-4 text-teal-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">Parking & Hazards</div>
                        <div className="text-[10px] text-slate-400">Commuter telemetry & lot occupancy</div>
                      </div>
                    </div>
                  </button>

                  {/* 4. My Reports */}
                  <button
                    onClick={() => handleSelectTab('my-reports')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                      activeTab === 'my-reports' ? 'text-blue-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">My Reports</div>
                        <div className="text-[10px] text-slate-400">Manage submitted road dockets</div>
                      </div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-slate-800"></div>

                  {/* 5. About & Help */}
                  <button
                    onClick={() => handleSelectTab('about')}
                    className={`w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition ${
                      activeTab === 'about' ? 'text-cyan-400 font-bold bg-slate-800/60' : 'text-slate-300'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-semibold text-white">About & Help</div>
                        <div className="text-[10px] text-slate-400">Purpose, team & synthetic data notices</div>
                      </div>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {/* 6. Capstone Presentation Download */}
                  <a
                    href="/GGC_SansPotholes_Branch_Evolution_Presentation.pptx"
                    download="GGC_SansPotholes_Branch_Evolution_Presentation.pptx"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full px-3.5 py-2.5 text-left flex items-center justify-between hover:bg-slate-800 transition text-emerald-400 group"
                  >
                    <div className="flex items-center space-x-2.5">
                      <FileDown className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition" />
                      <div>
                        <div className="font-semibold text-emerald-300">Download Presentation</div>
                        <div className="text-[10px] text-slate-400">12 slides in Comic Sans MS (.pptx)</div>
                      </div>
                    </div>
                    <span className="text-[9px] bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.5 rounded border border-emerald-800 uppercase">
                      PPTX
                    </span>
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Primary Navigation Menu Bar Tabs */}
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

          {/* Drive-Time Mapping Tab (NOW PREDOMINANTLY NEXT TO MAP & HAZARDS!) */}
          <button
            onClick={() => setActiveTab('sensor')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'sensor'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-teal-400 hover:text-white hover:bg-slate-800/80 border border-teal-500/30'
            }`}
          >
            <Route className="w-4 h-4 text-teal-300" />
            <span>Drive-Time Mapping</span>
          </button>

          {/* Parking & Hazards Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-teal-600 text-white shadow-md shadow-teal-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Parking & Hazards</span>
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

          {/* About / Help Tab */}
          <button
            onClick={() => setActiveTab('about')}
            className={`px-3.5 py-2 text-xs sm:text-sm font-bold rounded-xl flex items-center space-x-2 whitespace-nowrap transition-all ${
              activeTab === 'about'
                ? 'bg-cyan-700 text-white shadow-md shadow-cyan-700/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-cyan-400" />
            <span>About & Help</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
