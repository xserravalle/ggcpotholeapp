import React from 'react';
import { LayoutDashboard, MapPin, Plus, Route, CheckCircle2 } from 'lucide-react';
import { ActiveTab } from '../Header';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around safe-bottom shadow-2xl">
      
      {/* 1. Map Tab */}
      <button
        onClick={() => setActiveTab('potholes')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          activeTab === 'potholes' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Map</span>
      </button>

      {/* 2. Drive-Time Mapping Tab (Prominently next to Map) */}
      <button
        onClick={() => setActiveTab('sensor')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          activeTab === 'sensor' ? 'text-teal-400 font-bold' : 'text-teal-400/80 hover:text-teal-300'
        }`}
      >
        <Route className="w-5 h-5 text-teal-400" />
        <span className="text-[10px] mt-0.5 font-bold">Drive-Time</span>
      </button>

      {/* 3. Center Report Action Button (Elevated FAB) */}
      <button
        onClick={onOpenReportModal}
        className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-full p-3 shadow-xl shadow-teal-500/40 active:scale-95 transition border-2 border-slate-950"
        aria-label="Report Hazard"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* 4. Parking & Hazards Tab */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Parking</span>
      </button>

      {/* 5. My Reports Tab */}
      <button
        onClick={() => setActiveTab('my-reports')}
        className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition ${
          activeTab === 'my-reports' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Reports</span>
      </button>

    </nav>
  );
};
