import React, { useState, useMemo } from 'react';
import { ParkingLot, SimulationParams, ParkingLotCategory } from '../../types/parking';
import { calculateParkingState } from '../../services/predictiveParking';
import { SimulationControls } from './SimulationControls';
import { 
  Car, 
  Clock, 
  MapPin, 
  AlertCircle, 
  Search, 
  Filter, 
  Layers, 
  ArrowRight, 
  CheckCircle2, 
  BatteryCharging, 
  Compass,
  BarChart2
} from 'lucide-react';

interface ParkingDashboardProps {
  parkingLots: ParkingLot[];
  simulationParams: SimulationParams;
  onChangeSimulationParams: (params: SimulationParams) => void;
  onSelectLot: (lot: ParkingLot) => void;
}

export const ParkingDashboard: React.FC<ParkingDashboardProps> = ({
  parkingLots,
  simulationParams,
  onChangeSimulationParams,
  onSelectLot
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedCorridor, setSelectedCorridor] = useState<string>('all');

  // Corridors list
  const corridors = [
    'Pleasant Hill Rd',
    'Scenic Hwy (SR 124)',
    'Satellite Blvd',
    'Sugarloaf Pkwy',
    'Collins Hill Rd'
  ];

  // Categories list
  const categories: ParkingLotCategory[] = [
    'Club & Bulk Warehouse',
    'Higher Education',
    'Supercenter',
    'Grocery Center',
    'Regional Mall',
    'Big Box & Power Center',
    'Major Asian Plaza / Corridor'
  ];

  // Filtered lots with real-time calculated states
  const lotCards = useMemo(() => {
    return parkingLots.map(lot => {
      const state = calculateParkingState(lot, simulationParams);
      return {
        lot,
        state
      };
    }).filter(({ lot }) => {
      if (searchTerm && !lot.name.toLowerCase().includes(searchTerm.toLowerCase()) && !lot.address.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      if (selectedCategory !== 'all' && lot.category !== selectedCategory) {
        return false;
      }
      if (selectedCorridor !== 'all' && !lot.corridor.includes(selectedCorridor)) {
        return false;
      }
      return true;
    });
  }, [parkingLots, simulationParams, searchTerm, selectedCategory, selectedCorridor]);

  // Congestion status badge helper
  const getStatusBadge = (status: string, percent: number) => {
    switch (status) {
      case 'full':
        return (
          <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
            Critical ({percent}%)
          </span>
        );
      case 'congested':
        return (
          <span className="bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Heavy Congestion ({percent}%)
          </span>
        );
      case 'moderate':
        return (
          <span className="bg-blue-950 text-blue-300 border border-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Moderate Load ({percent}%)
          </span>
        );
      default:
        return (
          <span className="bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
            Plentiful ({percent}%)
          </span>
        );
    }
  };

  // Progress bar color
  const getProgressColor = (percent: number) => {
    if (percent >= 94) return 'bg-rose-500';
    if (percent >= 82) return 'bg-amber-500';
    if (percent >= 60) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Simulation Controls Component at the Top */}
      <SimulationControls
        params={simulationParams}
        onChangeParams={onChangeSimulationParams}
      />

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by lot name (Costco, GGC, Sam's, Walmart, Sugarloaf Mills...)"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none"
          >
            <option value="all">All Facility Types</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Corridor Filter */}
          <select
            value={selectedCorridor}
            onChange={(e) => setSelectedCorridor(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-xl px-3 py-2 focus:ring-1 focus:ring-teal-500 outline-none"
          >
            <option value="all">All Corridors</option>
            {corridors.map((corridor) => (
              <option key={corridor} value={corridor}>{corridor}</option>
            ))}
          </select>
        </div>

      </div>

      {/* Grid of Monitored Parking Lots */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {lotCards.map(({ lot, state }) => {
          const isCritical = state.congestionStatus === 'full';
          return (
            <div
              key={lot.id}
              className={`bg-slate-900 border rounded-2xl p-5 shadow-xl transition hover:border-slate-600 flex flex-col justify-between ${
                isCritical ? 'border-rose-900/60 shadow-rose-950/20' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header & Category */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider block">
                      {lot.category}
                    </span>
                    <h3 className="text-sm font-bold text-white leading-snug mt-0.5">
                      {lot.name}
                    </h3>
                  </div>
                  {getStatusBadge(state.congestionStatus, state.occupancyPercent)}
                </div>

                {/* Location & Corridor */}
                <p className="text-xs text-slate-400 flex items-center gap-1 mb-3">
                  <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate">{lot.address}</span>
                </p>

                {/* Occupancy Meter */}
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">Occupancy Load</span>
                    <span className="font-mono font-bold text-white">
                      {state.occupiedSpots} / {lot.totalCapacity} ({state.occupancyPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(state.occupancyPercent)}`}
                      style={{ width: `${state.occupancyPercent}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>
                      <strong className="text-emerald-400 font-mono">{state.availableSpots}</strong> spots free
                    </span>
                    <span className="text-slate-400">
                      Turnover: ~{state.turnoverRatePerHour} cars/hr
                    </span>
                  </div>
                </div>

                {/* Key Insight Metric: Estimated Time to Find a Spot */}
                <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className={`w-4 h-4 ${
                      state.estimatedTimeToFindSpotMinutes > 10 ? 'text-rose-400' :
                      state.estimatedTimeToFindSpotMinutes > 5 ? 'text-amber-400' : 'text-teal-400'
                    }`} />
                    <span className="text-xs text-slate-300 font-medium">Search Time:</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-bold font-mono ${
                      state.estimatedTimeToFindSpotMinutes > 10 ? 'text-rose-400' :
                      state.estimatedTimeToFindSpotMinutes > 5 ? 'text-amber-400' : 'text-teal-400'
                    }`}>
                      ~{state.estimatedTimeToFindSpotMinutes} mins
                    </span>
                    <span className="text-[10px] text-slate-400 block">to locate open stall</span>
                  </div>
                </div>

                {/* Smart Recommendation */}
                <div className="text-xs text-slate-300 bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 mb-3">
                  <span className="text-[10px] text-teal-400 font-bold block mb-0.5">Smart Parking Guidance:</span>
                  <p className="text-[11px] leading-relaxed text-slate-300">{state.recommendation}</p>
                </div>

                {/* Smart Overflow Alternative if Critical */}
                {isCritical && lot.nearbyAlternativeName && (
                  <div className="bg-teal-950/40 border border-teal-800/60 rounded-xl p-2.5 mb-3 text-[11px] text-teal-300 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Compass className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                      <span>Alternate: {lot.nearbyAlternativeName}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button: View Zone Breakdown & 24h Trend */}
              <button
                onClick={() => onSelectLot(lot)}
                className="w-full mt-2 bg-slate-800 hover:bg-teal-600 hover:text-white text-slate-200 font-semibold py-2 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-98 border border-slate-700 hover:border-teal-500"
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Inspect Zones & 24-Hr Forecast</span>
                <ArrowRight className="w-3 h-3" />
              </button>

            </div>
          );
        })}
      </div>

    </div>
  );
};
