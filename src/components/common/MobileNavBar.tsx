import React from 'react';
import { 
  Home, 
  MapPin, 
  Plus, 
  Route, 
  CheckCircle2, 
  LayoutDashboard, 
  ListFilter, 
  Building2, 
  Activity, 
  BarChart3, 
  ClipboardList 
} from 'lucide-react';
import { ActiveTab } from '../Header';
import { useAuth } from '../../context/AuthContext';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings?: () => void;
  onOpenReportModal?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal
}) => {
  const { isAdmin, isOfficer } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around safe-bottom shadow-2xl">
      {isAdmin ? (
        <>
          {/* Admin Overview */}
          <button
            onClick={() => setActiveTab('admin-overview')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activeTab === 'admin-overview' || activeTab === 'dispatcher' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Overview</span>
          </button>

          {/* Triage */}
          <button
            onClick={() => setActiveTab('triage')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activeTab === 'triage' ? 'text-amber-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ListFilter className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Triage</span>
          </button>

          {/* Dispatch Board */}
          <button
            onClick={() => setActiveTab('dispatch-board')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activeTab === 'dispatch-board' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Building2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Dispatch</span>
          </button>

          {/* Performance */}
          <button
            onClick={() => setActiveTab('performance')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activeTab === 'performance' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Perf</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activeTab === 'analytics' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Analytics</span>
          </button>
        </>
      ) : isOfficer ? (
        <>
          {/* My Assignments */}
          <button
            onClick={() => setActiveTab('my-assignments')}
            className={`flex flex-col items-center justify-center py-1 px-6 rounded-xl transition ${
              activeTab === 'my-assignments' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <ClipboardList className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">My Assignments</span>
          </button>

          {/* Map */}
          <button
            onClick={() => setActiveTab('potholes')}
            className={`flex flex-col items-center justify-center py-1 px-6 rounded-xl transition ${
              activeTab === 'potholes' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Map</span>
          </button>
        </>
      ) : (
        <>
          {/* 1. Home */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Home</span>
          </button>

          {/* 2. Map Tab */}
          <button
            onClick={() => setActiveTab('potholes')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'potholes' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Map</span>
          </button>

          {/* 3. Center Report Action Button (Elevated FAB) */}
          <button
            onClick={onOpenReportModal ? onOpenReportModal : () => setActiveTab('report')}
            className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-full p-3 shadow-xl shadow-teal-500/40 active:scale-95 transition border-2 border-slate-950"
            aria-label="Report Hazard"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>

          {/* 4. My Reports Tab */}
          <button
            onClick={() => setActiveTab('my-reports')}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition ${
              activeTab === 'my-reports' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">Reports</span>
          </button>

          {/* 5. Drive-Time Sensor Tab */}
          <button
            onClick={() => setActiveTab('sensor')}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
              activeTab === 'sensor' ? 'text-teal-400 font-bold' : 'text-teal-400/80 hover:text-teal-300'
            }`}
          >
            <Route className="w-5 h-5 text-teal-400" />
            <span className="text-[10px] mt-0.5 font-bold">Drive</span>
          </button>
        </>
      )}
    </nav>
  );
};
