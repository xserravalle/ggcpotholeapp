import React, { useState, useMemo, useRef, useEffect } from 'react';
import { PotholeReport } from '../../types/pothole';
import { ParkingLot, SimulationParams } from '../../types/parking';
import { calculateParkingState } from '../../services/predictiveParking';
import { distanceFromCampusMiles, milesBetween } from '../../services/distanceCalculator';
import { CAMPUS_CENTER } from '../../data/jurisdictionsData';
import { isOpenStatus } from '../../domain/status';
import { SimulationControls } from '../parking/SimulationControls';
import { ParkingDashboard } from '../parking/ParkingDashboard';
import { ParkingPredictorView } from '../parking/ParkingPredictorView';
import { ActiveTab } from '../Header';
import {
  StatCard,
  ReportCard,
  EmptyState,
  SectionHeader
} from '../kit';
import { 
  Car, 
  MapPin, 
  Sliders, 
  ChevronDown, 
  ChevronUp, 
  Clock,
  Search,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
  HardHat,
  ArrowRight,
  Compass,
  Trophy
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
  userLocation?: { lat: number; lng: number };
}

export const UnifiedDashboard: React.FC<UnifiedDashboardProps> = ({
  parkingLots,
  simulationParams,
  onChangeSimulationParams,
  onSelectLot,
  potholes = [],
  onSelectPothole,
  onOpenReportModal,
  onNavigateTab,
  userLocation
}) => {
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Tracking Code search state
  const [searchCode, setSearchCode] = useState('');
  const [searchError, setSearchError] = useState('');

  // User GPS or fallback position
  const [detectedCoords, setDetectedCoords] = useState<{ lat: number; lng: number }>(userLocation || CAMPUS_CENTER);

  useEffect(() => {
    if (userLocation) {
      setDetectedCoords(userLocation);
    } else if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setDetectedCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        () => {
          setDetectedCoords(CAMPUS_CENTER);
        },
        { timeout: 5000, maximumAge: 60000 }
      );
    }
  }, [userLocation]);

  // Citizen Hazard stats math
  const myReports = useMemo(() => {
    return potholes.filter(p => p.source === 'user' || p.source === 'sensor' || p.userConfirmed);
  }, [potholes]);

  const myReportsCount = myReports.length;
  const waitingReviewCount = myReports.filter(p => p.status === 'reported').length;
  const beingFixedCount = myReports.filter(
    p => p.status === 'verified' || p.status === 'assigned' || p.status === 'in_progress'
  ).length;
  const fixedCount = myReports.filter(p => p.status === 'resolved' || p.status === 'closed').length;

  // My 5 most recent reports
  const myRecentReports = useMemo(() => {
    return [...myReports]
      .sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime())
      .slice(0, 5);
  }, [myReports]);

  // Open hazards near me (within 1 mile, fallback to GGC)
  const openHazardsNearMe = useMemo(() => {
    return potholes
      .filter(p => isOpenStatus(p.status))
      .map(p => ({
        report: p,
        dist: milesBetween(detectedCoords, { lat: p.latitude, lng: p.longitude }),
      }))
      .filter(item => item.dist <= 1.0)
      .sort((a, b) => a.dist - b.dist)
      .map(item => item.report);
  }, [potholes, detectedCoords]);

  const handleTrackByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchCode.trim().toUpperCase();
    if (!query) {
      setSearchError('Please enter a tracking code (e.g. GAP-2026-XXXXXXXX)');
      return;
    }

    const matched = potholes.find(p => {
      const pCode = (p.trackingCode || '').trim().toUpperCase();
      const pId = (p.id || '').trim().toUpperCase();
      return pCode === query || pId === query || pCode.endsWith(query);
    });

    if (matched) {
      setSearchError('');
      if (onSelectPothole) {
        onSelectPothole(matched);
      }
    } else {
      setSearchError(`No hazard report found for tracking code "${searchCode.trim()}". Please verify and try again.`);
    }
  };

  const handleFocusTrackInput = () => {
    searchInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    searchInputRef.current?.focus();
  };

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
      
      {/* Citizen Action & Quick Start Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-emerald-400 font-bold block mb-1">
            Gwinnett County Civic Portal
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Citizen Hazard Reporting & Tracking
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Report road hazards, monitor municipal repair progress in real time, and inspect campus parking congestion.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          {onOpenReportModal && (
            <button
              onClick={onOpenReportModal}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold rounded-2xl shadow-lg transition flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report a Pothole</span>
            </button>
          )}

          <button
            onClick={handleFocusTrackInput}
            aria-label="Search report code"
            className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold rounded-2xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Track a Report</span>
          </button>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('scoreboard')}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 hover:text-white border border-amber-500/40 text-xs font-semibold rounded-2xl transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
              title="View Public Community Scoreboard"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Scoreboard</span>
            </button>
          )}
        </div>
      </div>

      {/* Citizen Lifecycle Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="My Reports"
          value={myReportsCount}
          subtext="Total filed & confirmed"
          variant="emerald"
          icon={CheckCircle2}
        />
        <StatCard
          label="Waiting for Review"
          value={waitingReviewCount}
          subtext="Pending municipal triage"
          variant="amber"
          icon={Clock}
        />
        <StatCard
          label="Being Fixed"
          value={beingFixedCount}
          subtext="Assigned or in progress"
          variant="blue"
          icon={HardHat}
        />
        <StatCard
          label="Fixed"
          value={fixedCount}
          subtext="Repaired & closed"
          variant="cyan"
          icon={CheckCircle2}
        />
      </div>

      {/* Track Road Hazard by Code */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Search className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Track Hazard by Code
              </h3>
            </div>
            <p className="text-xs text-slate-300">
              Lookup any reported road hazard by docket tracking code (e.g. <span className="font-mono text-emerald-400 font-semibold">GAP-2026-XXXXXXXX</span>)
            </p>
          </div>

          <form onSubmit={handleTrackByCode} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <input
                ref={searchInputRef}
                type="text"
                value={searchCode}
                onChange={(e) => {
                  setSearchCode(e.target.value);
                  if (searchError) setSearchError('');
                }}
                placeholder="GAP-2026-XXXXXXXX"
                className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-xs font-mono text-white placeholder-slate-500 outline-none uppercase"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Track</span>
            </button>
          </form>
        </div>

        {searchError && (
          <div className="mt-3 bg-rose-950/40 border border-rose-800/60 rounded-xl px-3.5 py-2 text-xs text-rose-300 flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{searchError}</span>
          </div>
        )}
      </div>

      {/* Section: My 5 Most Recent Reports */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <SectionHeader
          title="My Recent Reports"
          subtitle="Your 5 most recent road hazard submissions and confirmations"
          actions={
            onNavigateTab ? (
              <button
                onClick={() => onNavigateTab('my-reports')}
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition"
              >
                <span>View all ({myReports.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : undefined
          }
        />

        {myRecentReports.length === 0 ? (
          <EmptyState
            title="No reports submitted yet"
            description="You haven't reported or confirmed any potholes on this device yet. Use the 'Report a Pothole' button to file your first report."
            action={
              onOpenReportModal
                ? { label: 'Report a Pothole', onClick: onOpenReportModal }
                : undefined
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {myRecentReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => onSelectPothole?.(report)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Section: Open Hazards Near Me */}
      <div data-testid="open-hazards-near-me" className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <SectionHeader
          title="Open Hazards Near Me"
          subtitle="Unresolved road defects within 1.0 mile of your GPS location or GGC campus"
        />

        {openHazardsNearMe.length === 0 ? (
          <EmptyState
            title="No active road hazards nearby"
            description="All roadway segments within 1.0 mile of your position are currently clear or repaired."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {openHazardsNearMe.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onClick={() => onSelectPothole?.(report)}
              />
            ))}
          </div>
        )}
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
