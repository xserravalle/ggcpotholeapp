import React, { useState } from 'react';
import { ParkingLot, SimulationParams } from '../../types/parking';
import { 
  calculateParkingState, 
  generate24HourForecast 
} from '../../services/predictiveParking';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Sparkles, 
  GraduationCap, 
  ShoppingBag, 
  Clock, 
  AlertTriangle, 
  Layers,
  Flame,
  CheckCircle2
} from 'lucide-react';

interface ParkingPredictorViewProps {
  parkingLots: ParkingLot[];
  simulationParams: SimulationParams;
  onChangeSimulationParams: (params: SimulationParams) => void;
}

export const ParkingPredictorView: React.FC<ParkingPredictorViewProps> = ({
  parkingLots,
  simulationParams,
  onChangeSimulationParams
}) => {
  // Preset comparison groups
  const comparisonSets = [
    {
      id: 'bulk-clubs',
      title: 'Bulk Warehouse Clash: Costco vs Sam\'s Clubs',
      lotIds: ['PARK-COSTCO-01', 'PARK-SAMS-DULUTH', 'PARK-SAMS-SNELLVILLE'],
      description: 'Saturday/Sunday shopping traffic comparison along Pleasant Hill Rd and Scenic Hwy.'
    },
    {
      id: 'ggc-campus',
      title: 'Higher Ed Pulse: GGC Deck 1 vs Surface Lot H',
      lotIds: ['PARK-GGC-CAMPUS', 'PARK-GGC-LOTH'],
      description: 'Mon-Thu class-change wave spikes at 10:45 AM, 12:15 PM, and 1:45 PM.'
    },
    {
      id: 'retail-malls',
      title: 'Regional Mega-Retail: Sugarloaf Mills vs Target vs Walmart',
      lotIds: ['PARK-SUGARLOAF-MILLS', 'PARK-TARGET-PLEASANT-HILL', 'PARK-WALMART-DULUTH'],
      description: 'Holiday surge simulation and weekend afternoon peak loads.'
    },
    {
      id: 'corridor-hubs',
      title: 'Asian Plaza Corridor: H Mart vs Mega Mart vs Publix PTC',
      lotIds: ['PARK-HMART-PLAZA', 'PARK-GWINNETT-PLACE', 'PARK-PUBLIX-PTC'],
      description: 'High turnover dining and grocery dynamics along Pleasant Hill Rd and Peachtree Corners.'
    }
  ];

  const [activeSetId, setActiveSetId] = useState('bulk-clubs');
  const activeSet = comparisonSets.find(s => s.id === activeSetId) || comparisonSets[0];

  // Selected lots to compare
  const lotsToCompare = parkingLots.filter(l => activeSet.lotIds.includes(l.id));

  // Generate combined 24-hour comparative data points for Recharts
  const hours = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const chartColors = ['#00f5d4', '#f59e0b', '#ec4899', '#3b82f6'];

  const comparativeData = hours.map(h => {
    const label = `${h > 12 ? h - 12 : h === 0 ? 12 : h}:00 ${h >= 12 ? 'PM' : 'AM'}`;
    const point: Record<string, any> = { hour: h, label };

    lotsToCompare.forEach(lot => {
      const state = calculateParkingState(lot, {
        ...simulationParams,
        hourOfDay: h,
        minuteOfDay: 0
      });
      point[lot.shortName] = state.occupancyPercent;
    });

    return point;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title */}
      <div className="border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-xl font-bold text-white">Gwinnett County Parking Congestion Predictive Modeling</h2>
          <span className="bg-teal-950 text-teal-300 text-xs px-2.5 py-0.5 rounded-full border border-teal-800 font-semibold flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-teal-400" /> Multi-Corridor Machine Forecast
          </span>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Predictive simulation engine modeling GGC class turnover surges, weekend warehouse retail spikes, and holiday shopping surges across Gwinnett County.
        </p>
      </div>

      {/* Comparison Group Switcher */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {comparisonSets.map((set) => {
          const isSelected = set.id === activeSetId;
          return (
            <button
              key={set.id}
              onClick={() => setActiveSetId(set.id)}
              className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-950/70 border-blue-500 shadow-lg shadow-blue-950/50 text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-850 hover:border-slate-700'
              }`}
            >
              <div>
                <h4 className="font-bold text-xs leading-snug mb-1 text-slate-200">
                  {set.title}
                </h4>
                <p className="text-[11px] text-slate-400 leading-normal">
                  {set.description}
                </p>
              </div>
              <span className={`text-[10px] font-semibold mt-2 ${isSelected ? 'text-teal-400' : 'text-slate-500'}`}>
                {isSelected ? '● Active Model' : 'Click to Load Model'}
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Comparative Curve Graph */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Comparative 24-Hour Occupancy Forecast ({simulationParams.dayOfWeek})
            </h3>
            <p className="text-xs text-slate-400">
              Curves reflect active predictive modifiers: {simulationParams.isWeekendRush && 'Weekend Rush (+18%), '}
              {simulationParams.isHolidaySurge && 'Holiday Surge (+35%), '}
              {simulationParams.isGgcClassChange && 'GGC Class-Change Peak (+30%), '}
              {simulationParams.isRainWeather && 'Rainy Weather (+8%)'}
              {!simulationParams.isWeekendRush && !simulationParams.isHolidaySurge && !simulationParams.isGgcClassChange && !simulationParams.isRainWeather && 'Standard baseline trajectory'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Current Hour:</span>
            <span className="font-mono text-xs text-teal-300 font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
              {simulationParams.hourOfDay > 12 ? simulationParams.hourOfDay - 12 : simulationParams.hourOfDay}:00 {simulationParams.hourOfDay >= 12 ? 'PM' : 'AM'}
            </span>
          </div>
        </div>

        {/* Recharts Multi-Line Curve */}
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={comparativeData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 11 }} unit="%" />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-800 border border-slate-700 p-3 rounded-xl shadow-2xl text-xs space-y-1">
                        <p className="font-bold text-white mb-1 border-b border-slate-700 pb-1">{label}</p>
                        {payload.map((p, idx) => (
                          <div key={idx} className="flex items-center justify-between gap-3">
                            <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }}></span>
                              {p.name}:
                            </span>
                            <span className="font-mono font-bold text-white">{p.value}%</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '11px' }} />
              {lotsToCompare.map((lot, idx) => (
                <Line
                  key={lot.id}
                  type="monotone"
                  dataKey={lot.shortName}
                  stroke={chartColors[idx % chartColors.length]}
                  strokeWidth={3}
                  dot={{ r: 3 }}
                  activeDot={{ r: 6 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Real-time Predictive Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {lotsToCompare.map((lot, idx) => {
          const state = calculateParkingState(lot, simulationParams);
          const color = chartColors[idx % chartColors.length];
          return (
            <div key={lot.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {lot.category}
                  </span>
                  <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                </div>

                <h4 className="text-sm font-bold text-white leading-snug mb-1">{lot.name}</h4>
                <p className="text-[11px] text-slate-400 mb-3">{lot.corridor}</p>

                <div className="bg-slate-800/60 rounded-xl p-3 mb-3 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Projected Load:</span>
                    <span className="font-mono font-bold text-white">{state.occupancyPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Available Spots:</span>
                    <span className="font-mono font-bold text-emerald-400">{state.availableSpots} stalls</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Estimated Search Time:</span>
                    <span className="font-mono font-bold text-teal-400">~{state.estimatedTimeToFindSpotMinutes} minutes</span>
                  </div>
                </div>

                <div className="text-xs text-slate-300 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <strong className="text-teal-400 block text-[10px] uppercase">Peak Rule:</strong>
                  <span className="text-[11px] text-slate-400">{lot.peakHoursDescription}</span>
                </div>
              </div>

              {lot.specialRules && (
                <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-amber-300/90 flex items-start gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{lot.specialRules}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

    </div>
  );
};
