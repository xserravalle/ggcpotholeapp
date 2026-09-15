import React from 'react';
import { 
  AlertTriangle, 
  Car, 
  MapPin, 
  Camera, 
  FileText, 
  BarChart3, 
  PlusCircle, 
  Clock, 
  ShieldCheck,
  Zap,
  GraduationCap,
  Building2
} from 'lucide-react';

export type ActiveTab = 
  | 'overview' 
  | 'potholes' 
  | 'parking' 
  | 'ai-lab' 
  | 'dispatcher' 
  | 'analytics';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  potholeCount: number;
  criticalPotholeCount: number;
  campusPotholeCount: number;
  congestedLotsCount: number;
  simulationTime: string;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  potholeCount,
  criticalPotholeCount,
  campusPotholeCount,
  congestedLotsCount,
  simulationTime
}) => {
  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      {/* Top Banner / Civic & Campus Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 via-teal-600 to-purple-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-black border border-emerald-400/40 shrink-0">
              <span className="text-sm font-mono tracking-tighter">GGC/GW</span>
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-1.5">
                  Georgia <span className="text-emerald-400 font-extrabold">Pothole Patrol</span>
                </h1>
                <span className="text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-emerald-400" /> GGC Campus & 16 Municipalities
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pothole Detection, Accelerometer Drive Telemetry, and Work Order Routing across Gwinnett & GDOT
              </p>
            </div>
          </div>

          {/* Right Metrics & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
            {/* Live Clock */}
            <div className="flex items-center space-x-1.5 bg-slate-800/90 text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-700">
              <Clock className="w-3.5 h-3.5 text-teal-400" />
              <span className="font-mono font-medium">{simulationTime}</span>
            </div>

            {/* Quick Status Chips */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center space-x-1.5 bg-emerald-950/70 text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-800/60">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400" />
                <span>{campusPotholeCount} GGC Campus</span>
              </div>
              <div className="flex items-center space-x-1.5 bg-rose-950/60 text-rose-300 px-2.5 py-1 rounded-md border border-rose-800/50">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span>{criticalPotholeCount} Axle-Risk</span>
              </div>
            </div>

            {/* CTA Button: Report Pothole */}
            <button
              onClick={onOpenReportModal}
              className="flex items-center space-x-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-3.5 py-1.5 rounded-lg shadow-md hover:shadow-emerald-500/20 transition-all text-xs active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Road Hazard</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-1.5 mt-2.5 pt-2 border-t border-slate-800/80 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('potholes')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'potholes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-300" />
            <span>Map & Reporting</span>
            <span className="ml-1 text-[10px] bg-slate-700/80 text-slate-300 px-1.5 py-0.2 rounded-full">
              {potholeCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('dispatcher')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'dispatcher'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-blue-400" />
            <span>Authority & Dispatcher Hub</span>
          </button>

          <button
            onClick={() => setActiveTab('ai-lab')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'ai-lab'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Camera className="w-3.5 h-3.5 text-purple-300" />
            <span>AI Dashcam & Sensors</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'overview'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-teal-300" />
            <span>Command Overview</span>
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Pavement Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('parking')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center space-x-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'parking'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Car className="w-3.5 h-3.5 text-amber-400" />
            <span>Campus Parking & Commute</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
