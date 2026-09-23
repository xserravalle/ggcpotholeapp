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
  AlertTriangle, 
  Car, 
  MapPin, 
  CheckCircle2, 
  ArrowRight, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  ThumbsUp, 
  Clock, 
  Sparkles,
  ShieldCheck,
  Building2,
  Calendar,
  Layers,
  BarChart3
} from 'lucide-react';

interface UnifiedDashboardProps {
  potholes: PotholeReport[];
  parkingLots: ParkingLot[];
  simulationParams: SimulationParams;
  onChangeSimulationParams: (params: SimulationParams) => void;
  onNavigateTab: (tab: ActiveTab) => void;
  onSelectPothole: (p: PotholeReport) => void;
  onSelectLot: (l: ParkingLot) => void;
  onOpenReportModal: () => void;
  onVerifyPothole: (id: string) => void;
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  potholes,
  parkingLots,
  simulationParams,
  onChangeSimulationParams,
  onNavigateTab,
  onSelectPothole,
  onSelectLot,
  onOpenReportModal,
  onVerifyPothole
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

  // Priority road hazards sorted by critical severity and confirmations
  const priorityHazards = useMemo(() => {
    return [...potholes]
      .filter(p => p.status !== 'repaired')
      .sort((a, b) => {
        const sevScore = { critical: 4, severe: 3, moderate: 2, minor: 1 };
        const scoreA = (sevScore[a.severity] || 1) * 10 + Math.min(a.verificationsCount, 50);
        const scoreB = (sevScore[b.severity] || 1) * 10 + Math.min(b.verificationsCount, 50);
        return scoreB - scoreA;
      })
      .slice(0, 4);
  }, [potholes]);

  // My Reports (reports submitted by the current user or locally confirmed)
  const myReports = useMemo(() => {
    return potholes.filter(p => p.source === 'user' || (p.userConfirmed && p.id.startsWith('GW-POT-')));
  }, [potholes]);

  // Count aggregates
  const criticalCount = potholes.filter(p => p.severity === 'critical' || p.severity === 'severe').length;
  const totalConfirmations = potholes.reduce((acc, p) => acc + p.verificationsCount, 0);
  const fullLotsCount = calculatedLots.filter(c => c.state.congestionStatus === 'full' || c.state.occupancyPercent >= 85).length;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      
      {/* Community Hero & Overview Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-teal-400" />
              Georgia Gwinnett College & Gwinnett County
            </span>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-800/80 px-2.5 py-1 rounded-full border border-slate-700/60">
              Community Live Feed
            </span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Gwinnett P3 Dashboard
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Real-time road hazards and parking congestion, powered by student and driver reports. Check campus decks before you commute, or flag road damage to protect drivers.
          </p>

          {/* Quick Metrics Bar - Traffic Light Unified */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {/* Red: Critical Hazards */}
            <div className="bg-slate-900/90 border border-red-500/30 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center space-x-1.5 text-red-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span>Critical Hazards</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {criticalCount}
              </div>
              <span className="text-[10px] text-red-300/80 truncate">Tire/Axle risk</span>
            </div>

            {/* Yellow: Parking Hotspots */}
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center space-x-1.5 text-amber-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span>Decks &gt;85% Full</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {fullLotsCount}
              </div>
              <span className="text-[10px] text-amber-300/80 truncate">Of {parkingLots.length} facilities</span>
            </div>

            {/* Green: Community Confirmations */}
            <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Driver Confirms</span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-white mt-1">
                {totalConfirmations}
              </div>
              <span className="text-[10px] text-emerald-300/80 truncate">Community upvotes</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Top 5 Busiest Parking Lots Right Now */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-teal-400" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Top Busiest Parking Right Now
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live occupancy for GGC campus decks and major surrounding retail hubs
            </p>
          </div>
          
          <button
            onClick={() => setIsForecastExpanded(!isForecastExpanded)}
            className="self-start sm:self-auto px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 flex items-center gap-1.5 transition"
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
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-teal-300 transition">
                        {lot.name}
                      </h4>
                      <span className="text-[10px] text-slate-400 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">
                        {lot.category}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span className="truncate">{lot.address}</span>
                      <span>&bull;</span>
                      <span className="text-teal-400/90 font-medium whitespace-nowrap">{distanceFromCampusMiles({ lat: lot.latitude, lng: lot.longitude }).toFixed(1)} mi from GGC</span>
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
                    <span className="text-xs text-slate-400 font-mono">
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
                <h4 className="text-sm font-bold text-teal-300 flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  What-If Simulation Time & Rush Hour Engine
                </h4>
                <p className="text-xs text-slate-400">
                  Adjust the day, class change schedules, and weather conditions to forecast parking loads:
                </p>
              </div>

              {/* View Switcher: Cards vs Curves */}
              <div className="flex items-center space-x-1 bg-slate-800 p-1 rounded-xl text-xs">
                <button
                  onClick={() => setForecastViewMode('cards')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    forecastViewMode === 'cards' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  All Lots Grid
                </button>
                <button
                  onClick={() => setForecastViewMode('curves')}
                  className={`px-3 py-1 rounded-lg font-medium transition ${
                    forecastViewMode === 'curves' ? 'bg-teal-600 text-white shadow' : 'text-slate-400 hover:text-white'
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

      {/* SECTION 2: Recent Community Road Hazards */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                High-Priority Road Hazards
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Crowdsourced potholes and road damage verified by student and county drivers
            </p>
          </div>

          <button
            onClick={() => onNavigateTab('potholes')}
            className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1.5 transition"
          >
            <span>Open Interactive Map</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Hazard Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {priorityHazards.map((pothole) => {
            const isCrit = pothole.severity === 'critical' || pothole.severity === 'severe';
            const isMod = pothole.severity === 'moderate';

            return (
              <div
                key={pothole.id}
                onClick={() => onSelectPothole(pothole)}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-slate-600 rounded-2xl p-4 transition cursor-pointer flex flex-col justify-between space-y-3 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className={`px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                      isCrit
                        ? 'bg-red-950 text-red-300 border border-red-800/60'
                        : isMod
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    }`}>
                      {pothole.severity}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      {pothole.distanceFromGgcMiles ? `${pothole.distanceFromGgcMiles} mi from GGC` : pothole.city}
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-white group-hover:text-teal-300 transition line-clamp-1">
                    {pothole.title}
                  </h4>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1 truncate">
                    <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span>{pothole.roadName} • {pothole.city}</span>
                  </p>
                </div>

                {/* Bottom confirmation count and upvote */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-700/40 text-xs">
                  <span className="text-teal-400 font-bold flex items-center gap-1">
                    <span>👆</span>
                    <span>{pothole.verificationsCount} drivers confirmed</span>
                  </span>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onVerifyPothole(pothole.id);
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                      pothole.userConfirmed
                        ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                        : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                    }`}
                  >
                    <ThumbsUp className="w-3 h-3" />
                    <span>{pothole.userConfirmed ? 'Confirmed' : 'Confirm'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: My Reports Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-5 h-5 text-teal-400" />
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                My Reports & Confirmations
              </h3>
              <p className="text-xs text-slate-400">
                Hazards you submitted or validated from this device
              </p>
            </div>
          </div>

          <button
            onClick={onOpenReportModal}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-500 text-white flex items-center gap-1.5 shadow-md shadow-teal-600/20 transition active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Report Hazard</span>
          </button>
        </div>

        {myReports.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-800/40 border border-dashed border-slate-700 rounded-2xl space-y-3">
            <AlertTriangle className="w-8 h-8 text-slate-500 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-white">No hazards reported yet</h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Spotted a pothole or pavement crack on campus or local roads? Submit a report in 30 seconds to alert fellow drivers.
              </p>
            </div>
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold rounded-xl text-xs shadow-md transition"
            >
              Report Your First Hazard
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {myReports.map((report) => (
              <div
                key={report.id}
                onClick={() => onSelectPothole(report)}
                className="bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-2xl p-3.5 flex items-center justify-between gap-3 cursor-pointer transition"
              >
                <div className="min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <h5 className="text-xs sm:text-sm font-bold text-white truncate">
                      {report.title}
                    </h5>
                    <span className="text-[10px] text-slate-400 uppercase font-mono px-2 py-0.5 rounded bg-slate-700">
                      {report.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {report.roadName} • {report.city}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-xs font-mono font-bold text-teal-400 block">
                    {report.verificationsCount} confirms
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {report.trackingCode || 'Saved locally'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
