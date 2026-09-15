import React from 'react';
import { PotholeReport, RoadSegment } from '../../types/pothole';
import { ParkingLot, SimulationParams } from '../../types/parking';
import { calculateParkingState } from '../../services/predictiveParking';
import { ActiveTab } from '../Header';
import { 
  AlertTriangle, 
  Car, 
  Clock, 
  MapPin, 
  ShieldAlert, 
  Building2, 
  TrendingUp, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Compass, 
  Sparkles,
  Camera,
  Layers
} from 'lucide-react';

interface DualOverviewProps {
  potholes: PotholeReport[];
  roadSegments: RoadSegment[];
  parkingLots: ParkingLot[];
  simulationParams: SimulationParams;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectPothole: (p: PotholeReport) => void;
  onSelectLot: (l: ParkingLot) => void;
  onOpenReportModal: () => void;
}

export const DualOverview: React.FC<DualOverviewProps> = ({
  potholes,
  roadSegments,
  parkingLots,
  simulationParams,
  onNavigateTab,
  onSelectPothole,
  onSelectLot,
  onOpenReportModal
}) => {
  // Aggregate KPIs
  const severePotholes = potholes.filter(p => p.severity === 'severe');
  const totalVerifications = potholes.reduce((acc, p) => acc + p.verificationsCount, 0);
  const totalParkingCapacity = parkingLots.reduce((acc, l) => acc + l.totalCapacity, 0);

  // Parking calculations
  const calculatedLots = parkingLots.map(l => ({
    lot: l,
    state: calculateParkingState(l, simulationParams)
  }));

  const fullLots = calculatedLots.filter(c => c.state.congestionStatus === 'full');
  const averageOccupancy = Math.round(
    calculatedLots.reduce((acc, c) => acc + c.state.occupancyPercent, 0) / calculatedLots.length
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Executive Welcome & Live Advisory Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-teal-950 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center space-x-2 text-teal-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Gwinnett County Smart Mobility & Infrastructure Command</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Dual-Function Civic Transportation Insight System
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Unified intelligence monitoring county-wide pavement conditions, crowdsourced pothole reports, and automated municipal work order dispatch, synchronized with real-time parking congestion tracking across Gwinnett's commercial and higher education corridors.
            </p>
          </div>

          {/* Quick Action Group */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-teal-500/20 transition active:scale-95 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-slate-950" />
              <span>Submit Pothole Report</span>
            </button>
            <button
              onClick={() => onNavigateTab('parking')}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white font-semibold rounded-xl text-xs border border-slate-700 transition active:scale-95 flex items-center gap-2"
            >
              <Car className="w-4 h-4 text-teal-400" />
              <span>Inspect Parking Loads</span>
            </button>
          </div>
        </div>
      </div>

      {/* High-Level County Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" /> Active Potholes
          </span>
          <div className="text-xl font-bold text-white mt-1 font-mono">{potholes.length}</div>
          <span className="text-[10px] text-slate-400">Tracked in Gwinnett</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Severe Hazards
          </span>
          <div className="text-xl font-bold text-rose-400 mt-1 font-mono">{severePotholes.length}</div>
          <span className="text-[10px] text-rose-400/80 font-medium">Rim/Tire Damage</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" /> Citizen Upvotes
          </span>
          <div className="text-xl font-bold text-teal-400 mt-1 font-mono">{totalVerifications}</div>
          <span className="text-[10px] text-slate-400">Crowdsource Confirms</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Car className="w-3.5 h-3.5 text-blue-400" /> Parking Hubs
          </span>
          <div className="text-xl font-bold text-white mt-1 font-mono">{parkingLots.length}</div>
          <span className="text-[10px] text-slate-400">{totalParkingCapacity.toLocaleString()} Stalls</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Lots &gt;90% Capacity
          </span>
          <div className="text-xl font-bold text-amber-400 mt-1 font-mono">{fullLots.length}</div>
          <span className="text-[10px] text-amber-300">Congested Hubs</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 shadow-lg">
          <span className="text-[11px] text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> County Parking Load
          </span>
          <div className="text-xl font-bold text-emerald-400 mt-1 font-mono">{averageOccupancy}%</div>
          <span className="text-[10px] text-slate-400">Overall Utilization</span>
        </div>
      </div>

      {/* Side-by-Side Dual Command Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Module: Pothole & Roadway Pavement Radar */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="font-bold text-white text-sm">Pothole Detection & Infrastructure Radar</h3>
              </div>
              <button
                onClick={() => onNavigateTab('potholes')}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition"
              >
                <span>Full Interactive Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-3">
              High-priority pavement failures requiring immediate citizen caution or municipal road-crew patching:
            </p>

            {/* List of Recent Urgent Potholes */}
            <div className="space-y-2.5">
              {potholes.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  onClick={() => onSelectPothole(p)}
                  className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3 transition cursor-pointer flex items-center justify-between"
                >
                  <div className="pr-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        p.severity === 'severe' ? 'bg-red-950 text-red-300 border border-red-800' :
                        p.severity === 'moderate' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                        'bg-yellow-950 text-yellow-300 border border-yellow-800'
                      }`}>
                        {p.severity}
                      </span>
                      <span className="font-bold text-white text-xs truncate max-w-[220px]">
                        {p.title}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{p.roadName} • {p.city}</span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-mono font-bold text-teal-400 block">
                      {p.verificationsCount} upvotes
                    </span>
                    <span className="text-[10px] text-slate-400">{p.jurisdiction}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick links to AI Lab and Dispatcher */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <button
              onClick={() => onNavigateTab('ai-lab')}
              className="text-purple-400 hover:text-purple-300 flex items-center gap-1.5 font-medium transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Launch AI Dashcam Lab</span>
            </button>
            <button
              onClick={() => onNavigateTab('dispatcher')}
              className="text-blue-400 hover:text-blue-300 flex items-center gap-1.5 font-medium transition"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Municipal Dispatch (7 Cities)</span>
            </button>
          </div>
        </div>

        {/* Right Module: Parking-Lot Congestion Monitoring */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center space-x-2">
                <Car className="w-4 h-4 text-teal-400" />
                <h3 className="font-bold text-white text-sm">Busiest Parking Lots Congestion Pulse</h3>
              </div>
              <button
                onClick={() => onNavigateTab('parking')}
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition"
              >
                <span>All 12 Facilities</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
              <span>Current Time Modeled: <strong className="text-white">{simulationParams.dayOfWeek}, {simulationParams.hourOfDay}:00</strong></span>
              <span className="text-[11px] text-teal-400 font-mono">Live Simulation</span>
            </div>

            {/* List of Key Busiest Lots */}
            <div className="space-y-2.5">
              {calculatedLots.slice(0, 4).map(({ lot, state }) => (
                <div
                  key={lot.id}
                  onClick={() => onSelectLot(lot)}
                  className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-xl p-3 transition cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h4 className="font-bold text-white text-xs leading-tight">{lot.name}</h4>
                      <p className="text-[11px] text-slate-400">{lot.corridor}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-mono text-xs font-bold text-white">{state.occupancyPercent}% Full</span>
                      <span className="text-[10px] text-teal-400 block font-medium">~{state.estimatedTimeToFindSpotMinutes} min search</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        state.occupancyPercent > 90 ? 'bg-rose-500' :
                        state.occupancyPercent > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${state.occupancyPercent}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick link to Forecast View */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 text-[11px]">
              {simulationParams.isWeekendRush ? '🔥 Weekend Rush Active' : 'Standard traffic dynamics'}
            </span>
            <button
              onClick={() => onNavigateTab('parking')}
              className="text-teal-400 hover:text-teal-300 flex items-center gap-1 font-medium transition"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Open 24-Hr Surge Forecaster</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
