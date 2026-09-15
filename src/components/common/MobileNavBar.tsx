import React from 'react';
import { MapPin, PlusCircle, ShieldAlert, Activity, Sparkles, Car } from 'lucide-react';

export type ActiveTab = 'overview' | 'potholes' | 'dispatcher' | 'ai-lab' | 'analytics' | 'parking';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenReportModal: () => void;
  criticalPotholeCount: number;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenReportModal,
  criticalPotholeCount
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 z-40 px-2 py-1.5 flex items-center justify-around safe-bottom">
      
      {/* Map Tab */}
      <button
        onClick={() => setActiveTab('potholes')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
          activeTab === 'potholes' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Map</span>
      </button>

      {/* AI Vision Lab Tab */}
      <button
        onClick={() => setActiveTab('ai-lab')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
          activeTab === 'ai-lab' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">AI Vision</span>
      </button>

      {/* Center Report Action Button */}
      <button
        onClick={onOpenReportModal}
        className="flex flex-col items-center justify-center -mt-5 bg-gradient-to-tr from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-full p-3 shadow-lg shadow-teal-500/30 active:scale-95 transition"
        aria-label="Report Pothole"
      >
        <PlusCircle className="w-6 h-6" />
      </button>

      {/* Authority Hub Tab */}
      <button
        onClick={() => setActiveTab('dispatcher')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg relative transition ${
          activeTab === 'dispatcher' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <ShieldAlert className="w-5 h-5" />
        {criticalPotholeCount > 0 && (
          <span className="absolute top-1 right-2 w-2 h-2 bg-rose-500 rounded-full"></span>
        )}
        <span className="text-[10px] mt-0.5">Authority</span>
      </button>

      {/* Parking / Commute Tab */}
      <button
        onClick={() => setActiveTab('parking')}
        className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition ${
          activeTab === 'parking' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Car className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Commute</span>
      </button>

    </nav>
  );
};
