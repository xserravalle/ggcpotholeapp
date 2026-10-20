import React from 'react';
import { Car, MapPin, CheckCircle2, Settings } from 'lucide-react';
import { ActiveTab } from '../Header';

interface MobileNavBarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSettings?: () => void;
  onOpenReportModal?: () => void;
}

export const MobileNavBar: React.FC<MobileNavBarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSettings
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-slate-950/95 backdrop-blur-lg border-t border-slate-800 z-40 px-3 py-2 flex items-center justify-around safe-bottom shadow-2xl">
      
      {/* Map Tab */}
      <button
        onClick={() => setActiveTab('potholes')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
          activeTab === 'potholes' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <MapPin className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Map</span>
      </button>

      {/* Parking Tab */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
          activeTab === 'dashboard' ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Car className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">Parking</span>
      </button>

      {/* My Reports Tab */}
      <button
        onClick={() => setActiveTab('my-reports')}
        className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition ${
          activeTab === 'my-reports' ? 'text-blue-400 font-bold' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <CheckCircle2 className="w-5 h-5" />
        <span className="text-[10px] mt-0.5">My Reports</span>
      </button>

      {/* Settings / Options */}
      {onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="flex flex-col items-center justify-center py-1 px-3 rounded-xl text-slate-400 hover:text-teal-400 transition"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-0.5">Settings</span>
        </button>
      )}

    </nav>
  );
};
