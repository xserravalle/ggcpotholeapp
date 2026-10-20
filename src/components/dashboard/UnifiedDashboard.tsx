import React, { useState, useMemo } from 'react';
import { PotholeReport } from '../../types/pothole';
import { ParkingLot, SimulationParams } from '../../types/parking';
import { calculateParkingState } from '../../services/predictiveParking';
import { distanceFromCampusMiles } from '../../services/distanceCalculator';
import { SimulationControls } from '../parking/SimulationControls';
import { ParkingDashboard } from '../parking/ParkingDashboard';
import { ParkingPredictorView } from '../parking/ParkingPredictorView';
import { ActiveTab } from '../Header';
import { 
  Car, 
  MapPin, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Clock 
} from 'lucide-react';

interface UnifiedDashboardProps {
  potholes?: PotholeReport[];
  parkingLots: ParkingLot[];
  simulationParams: SimulationParams;
  onChangeSimulationParams: (params: SimulationParams) => void;
  onNavigateTab?: (tab: ActiveTab) => void;
  onSelectPothole?: (p: PotholeReport) => void;
  onSelectLot: (l: ParkingLot) => void;
  onOpenReportModal?: () => void;
  onVerifyPothole?: (id: string) => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  parkingLots,
  simulationParams,
  onChangeSimulationParams,
  onSelectLot
}) => {
  // Accordion state for simulation controls (default collapsed to eliminate visual noise)
  const [isForecastExpanded, setIsForecastExpanded] = useState(false);
  const [forecastViewMode, setForecastViewMode] = useState<'cards' | 'curves'>('cards');

  // Calculate parking states
  const calculatedLots = useMemo(() => {
    return parkingLots.map(lot => ({
      lot,
      state: calculateParkingState(lot, simulationParams)
    })).sort((a, b) => b.state.occupancyPercent - a.state.occupancyPercent);
  }, [parkingLots, simulationParams]);

  // Top 5 Busiest Parking Lots right now
  const topBusiestLots = useMemo(() => {
    return calculatedLots.slice(0, 5);
  }, [calculatedLots]);

  // Aggregate stats
  const fullLotsCount = calculatedLots.filter(c => c.state.congestionStatus === 'full' || c.state.occupancyPercent >= 85).length;
  const totalAvailableSpots = calculatedLots.reduce((acc, c) => acc + c.state.availableSpots, 0);
  const totalCapacity = parkingLots.reduce((acc, l) => acc + l.totalCapacity, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Parking Overview Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Car className="w-6 h-6 text-emerald-400" />
            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
              Campus Parking Availability
            </h2>
            <span className="text-xs font-mono bg-emerald-950 text-emerald-300 border border-emerald-800/80 px-2.5 py-0.5 rounded-full font-bold">
              {totalAvailableSpots} Open Spots
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">
            Real-time occupancy for Georgia Gwinnett College student decks, faculty lots, and perimeter parking.
          </p>
        </div>

        {/* Quick Stat Badges */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl px-3.5 py-2 text-center">
            <span className="text-[10px] text-slate-300 uppercase font-bold block">Congested</span>
            <span className="text-base font-black font-mono text-amber-400">{fullLotsCount} of {parkingLots.length}</span>
          </div>
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl px-3.5 py-2 text-center">
            <span className="text-[10px] text-slate-300 uppercase font-bold block">Total Capacity</span>
            <span className="text-base font-black font-mono text-emerald-400">{totalCapacity}</span>
          </div>
        </div>
      </div>

      {/* SECTION 1: Top 5 Busiest Parking Lots Right Now */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Top Busiest Parking Right Now
              </h3>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Live occupancy for GGC campus decks and major surrounding retail hubs
            </p>
          </div>
          
          <button
            onClick={() => setIsForecastExpanded(!isForecastExpanded)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 flex items-center gap-1.5 transition"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isForecastExpanded ? 'Hide Forecast Controls' : 'What-If Forecast & Time'}</span>
            {isForecastExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {/* Top 5 Lots List */}
        <div className="space-y-3">
          {topBusiestLots.map(({ lot, state }, index) => {
            const isCritical = state.occupancyPercent >= 85;
            const isModerate = state.occupancyPercent >= 60 && state.occupancyPercent < 85;

            return (
              <div
                key={lot.id}
                onClick={() => onSelectLot(lot)}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-3.5 sm:p-4 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
              >
                {/* Lot info */}
                <div className="flex items-start space-x-3 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-slate-700/70 flex items-center justify-center font-bold text-xs text-slate-300 shrink-0 font-mono mt-0.5">
                    #{index + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2 flex-wrap">
                      <span className={`w-2.5 h-2.5 rounded-full ${
                        isCritical ? 'bg-red-500 animate-pulse' :
                        isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}></span>
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-emerald-300 transition">
                        {lot.name}
                      </h4>
                      <span className="text-[10px] text-slate-300 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                        {lot.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-300 mt-1">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{lot.address}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-medium whitespace-nowrap">{distanceFromCampusMiles({ lat: lot.latitude, lng: lot.longitude }).toFixed(1)} mi from GGC</span>
                    </div>
                  </div>
                </div>

                {/* Status & Bar */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1.5 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-700/40">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      isCritical ? 'text-red-400' : isModerate ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {state.occupancyPercent}% Full
                    </span>
                    <span className="text-xs text-slate-300 font-mono">
                      ({state.availableSpots} open / {lot.totalCapacity})
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-28 sm:w-36 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isCritical ? 'bg-red-500' : isModerate ? 'bg-amber-400' : 'bg-emerald-400'
                      }`}
                      style={{ width: `${Math.min(state.occupancyPercent, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Collapsible Accordion: Simulation What-If Controls */}
        {isForecastExpanded && (
          <div className="mt-4 pt-4 border-t border-slate-800 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  What-If Simulation Time & Rush Hour Engine
                </h4>
                <p className="text-xs text-slate-300">
                  Adjust the day, class change schedules, and weather conditions to forecast parking loads:
                </p>
              </div>

              {/* View Switcher: Cards vs Curves */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setForecastViewMode('cards')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    forecastViewMode === 'cards' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  All Lots Grid
                </button>
                <button
                  onClick={() => setForecastViewMode('curves')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    forecastViewMode === 'curves' ? 'bg-emerald-600 text-white shadow' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Predictive Curves
                </button>
              </div>
            </div>

            {/* Embedded Simulation Controls */}
            <SimulationControls
              params={simulationParams}
              onChangeParams={onChangeSimulationParams}
            />

            {/* Sub-view Content */}
            {forecastViewMode === 'cards' ? (
              <ParkingDashboard
                parkingLots={parkingLots}
                simulationParams={simulationParams}
                onChangeSimulationParams={onChangeSimulationParams}
                onSelectLot={onSelectLot}
              />
            ) : (
              <ParkingPredictorView
                parkingLots={parkingLots}
                simulationParams={simulationParams}
                onChangeSimulationParams={onChangeSimulationParams}
              />
            )}
          </div>
        )}
      </div>

    </div>
  );
};
