import React from 'react';
import { ParkingLot, SimulationParams } from '../../types/parking';
import { 
  calculateParkingState, 
  generate24HourForecast, 
  generate7DayCongestionMatrix 
} from '../../services/predictiveParking';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { 
  X, 
  Car, 
  Clock, 
  MapPin, 
  BatteryCharging, 
  Accessibility, 
  Compass, 
  TrendingUp, 
  Layers,
  Sparkles,
  Info
} from 'lucide-react';

interface LotDetailModalProps {
  lot: ParkingLot | null;
  simulationParams: SimulationParams;
  onClose: () => void;
  onSelectAlternate?: (alternateId: string) => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  lot,
  simulationParams,
  onClose,
  onSelectAlternate
}) => {
  if (!lot) return null;

  const state = calculateParkingState(lot, simulationParams);
  const forecastData = generate24HourForecast(lot, simulationParams);
  const matrixData = generate7DayCongestionMatrix(lot, simulationParams.hourOfDay);

  const sampleHours = [8, 10, 12, 14, 16, 18, 20, 22];

  // Helper for heatmap cell color
  const getCellColor = (val: number) => {
    if (val >= 94) return 'bg-rose-600 text-white';
    if (val >= 82) return 'bg-amber-600 text-white';
    if (val >= 60) return 'bg-blue-600 text-white';
    return 'bg-emerald-700/80 text-white';
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full p-6 shadow-2xl relative my-8 animate-in fade-in">
        
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4 mb-5">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                {lot.category}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-xs text-slate-400 font-medium">{lot.corridor}</span>
            </div>
            <h2 className="text-xl font-bold text-white mt-1">{lot.name}</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              <span>{lot.address}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Real-Time Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5 text-xs">
          <div className="bg-slate-800/70 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 block">Current Occupancy</span>
            <div className="text-xl font-bold text-white font-mono mt-0.5">
              {state.occupancyPercent}%
            </div>
            <span className="text-[10px] text-slate-400">{state.occupiedSpots} / {lot.totalCapacity} spots</span>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 block">Available Stalls</span>
            <div className="text-xl font-bold text-emerald-400 font-mono mt-0.5">
              {state.availableSpots}
            </div>
            <span className="text-[10px] text-emerald-300">Vacant stalls right now</span>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 block">Estimated Time to Park</span>
            <div className="text-xl font-bold text-teal-400 font-mono mt-0.5">
              ~{state.estimatedTimeToFindSpotMinutes} min
            </div>
            <span className="text-[10px] text-slate-400">Drive-in & stall locating</span>
          </div>

          <div className="bg-slate-800/70 border border-slate-700/70 p-3 rounded-xl">
            <span className="text-[11px] text-slate-400 block">Congestion Status</span>
            <div className="text-base font-bold text-white uppercase tracking-wide mt-1">
              {state.congestionStatus}
            </div>
            <span className="text-[10px] text-slate-400">Simulated live load</span>
          </div>
        </div>

        {/* Section / Deck Floor Breakdown */}
        <div className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-4 mb-5">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-teal-400" />
            Zone & Level Breakdown (Capacity, EV & ADA)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {lot.zones.map((zone) => {
              const zoneOccupancy = Math.min(100, Math.round((zone.occupied / zone.capacity) * 100));
              return (
                <div 
                  key={zone.id} 
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-white">{zone.name}</span>
                      <span className="font-mono text-[11px] text-teal-400 font-semibold">{zoneOccupancy}%</span>
                    </div>
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2 overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          zoneOccupancy > 90 ? 'bg-rose-500' : zoneOccupancy > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${zoneOccupancy}%` }}
                      ></div>
                    </div>
                    <div className="text-[11px] text-slate-400 mb-2">
                      {zone.occupied} / {zone.capacity} spaces filled
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-800/80 space-y-1 text-[10px] text-slate-400">
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <BatteryCharging className="w-3 h-3 text-emerald-400" /> EV Fast Chargers:
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {zone.evChargersTotal - zone.evChargersOccupied} / {zone.evChargersTotal} free
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="flex items-center gap-1">
                        <Accessibility className="w-3 h-3 text-blue-400" /> ADA Accessible:
                      </span>
                      <span className="font-mono text-slate-200 font-medium">
                        {zone.adaSpotsTotal - zone.adaSpotsOccupied} / {zone.adaSpotsTotal} free
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 24-Hour Projected Occupancy Curve (Recharts) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                24-Hour Congestion Forecast Curve
              </h3>
              <p className="text-[11px] text-slate-400">
                Modeled for {simulationParams.dayOfWeek} with active modifiers
              </p>
            </div>
            <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
              Peak: {lot.peakHoursDescription}
            </span>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00f5d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#00f5d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-slate-800 border border-slate-700 p-2 rounded-lg text-xs">
                          <p className="font-bold text-white">{d.label}</p>
                          <p className="text-teal-400">Occupancy: {d.occupancy}%</p>
                          <p className="text-slate-300">Free Spots: {d.available}</p>
                          <p className="text-amber-400">Est. Wait: ~{d.waitMinutes} mins</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#00f5d4" 
                  strokeWidth={2.5}
                  fillOpacity={1} 
                  fill="url(#colorOcc)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Day-by-Day Congestion Heatmap Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 mb-5 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                7-Day Historical & Predictive Congestion Heatmap
              </h3>
              <p className="text-[11px] text-slate-400">
                Hourly occupancy density across the full week
              </p>
            </div>
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-emerald-700"></span> &lt;60%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-600"></span> 60-80%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-amber-600"></span> 80-94%</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-rose-600"></span> &gt;94%</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-center text-xs">
              <thead>
                <tr className="text-[11px] text-slate-400 border-b border-slate-800">
                  <th className="py-1 px-2 text-left">Day</th>
                  {sampleHours.map(h => (
                    <th key={h} className="py-1 px-1">{h > 12 ? h - 12 : h} {h >= 12 ? 'P' : 'A'}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {matrixData.map(row => (
                  <tr key={row.day}>
                    <td className="py-1.5 px-2 text-left font-semibold text-slate-300 text-xs">
                      {row.day.slice(0, 3)}
                    </td>
                    {sampleHours.map(h => {
                      const val = row.hours[h] ?? 50;
                      return (
                        <td key={h} className="p-1">
                          <div className={`py-1 px-1 rounded text-[10px] font-mono font-bold ${getCellColor(val)}`}>
                            {val}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Guidance & Nearby Alternate Recommendation */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-teal-400" />
            <span className="text-slate-300 font-medium">Recommended Strategy:</span>
            <span className="text-teal-300 font-semibold">{state.recommendation}</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition"
          >
            Close Inspector
          </button>
        </div>

      </div>
    </div>
  );
};
