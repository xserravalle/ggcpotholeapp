import React from 'react';
import { SimulationParams } from '../../types/parking';
import { 
  Clock, 
  Calendar, 
  Flame, 
  ShoppingBag, 
  GraduationCap, 
  CloudRain, 
  Sparkles, 
  RotateCcw,
  Sliders
} from 'lucide-react';

interface SimulationControlsProps {
  params: SimulationParams;
  onChangeParams: (newParams: SimulationParams) => void;
}

const DAYS: SimulationParams['dayOfWeek'][] = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

export const SimulationControls: React.FC<SimulationControlsProps> = ({
  params,
  onChangeParams
}) => {
  // Quick Presets
  const applyPreset = (presetName: string) => {
    switch (presetName) {
      case 'ggc-class-change':
        onChangeParams({
          dayOfWeek: 'Tuesday',
          hourOfDay: 10,
          minuteOfDay: 45,
          isGgcClassChange: true,
          isWeekendRush: false,
          isHolidaySurge: false,
          isRainWeather: false
        });
        break;
      case 'costco-saturday-rush':
        onChangeParams({
          dayOfWeek: 'Saturday',
          hourOfDay: 14,
          minuteOfDay: 0,
          isWeekendRush: true,
          isGgcClassChange: false,
          isHolidaySurge: false,
          isRainWeather: false
        });
        break;
      case 'holiday-mall-surge':
        onChangeParams({
          dayOfWeek: 'Saturday',
          hourOfDay: 16,
          minuteOfDay: 30,
          isHolidaySurge: true,
          isWeekendRush: true,
          isGgcClassChange: false,
          isRainWeather: false
        });
        break;
      case 'weekday-commute':
        onChangeParams({
          dayOfWeek: 'Wednesday',
          hourOfDay: 8,
          minuteOfDay: 15,
          isGgcClassChange: false,
          isWeekendRush: false,
          isHolidaySurge: false,
          isRainWeather: false
        });
        break;
      case 'reset':
        onChangeParams({
          dayOfWeek: 'Saturday',
          hourOfDay: 14,
          minuteOfDay: 15,
          isWeekendRush: true,
          isHolidaySurge: false,
          isGgcClassChange: false,
          isRainWeather: false
        });
        break;
    }
  };

  // Format time for display
  const formatTime = (h: number, m: number) => {
    const period = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const displayM = m < 10 ? `0${m}` : m;
    return `${displayH}:${displayM} ${period}`;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-xs space-y-4">
      
      {/* Top Bar: Title, Live Slider Display & Reset */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-teal-400" />
          <h3 className="font-bold text-white text-sm">
            Gwinnett Parking Predictive Simulator & Time Controls
          </h3>
        </div>

        {/* Current Active Simulated Time Tag */}
        <div className="flex items-center space-x-2">
          <div className="bg-teal-950/80 border border-teal-700/80 text-teal-300 font-mono font-bold px-3 py-1 rounded-lg flex items-center gap-1.5 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            <span>{params.dayOfWeek}, {formatTime(params.hourOfDay, params.minuteOfDay)}</span>
          </div>
          <button
            onClick={() => applyPreset('reset')}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            title="Reset to default Saturday afternoon"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Day of Week Selector */}
      <div>
        <label className="block text-slate-400 font-medium mb-1.5 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5 text-blue-400" /> Day of Week:
        </label>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day) => {
            const isSelected = params.dayOfWeek === day;
            const isWeekend = day === 'Saturday' || day === 'Sunday';
            return (
              <button
                key={day}
                onClick={() => onChangeParams({ ...params, dayOfWeek: day })}
                className={`py-1.5 px-1 rounded-lg text-center font-medium transition text-[11px] ${
                  isSelected
                    ? 'bg-blue-600 text-white font-bold shadow'
                    : isWeekend
                    ? 'bg-slate-800/90 text-amber-300 hover:bg-slate-700'
                    : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time of Day Slider (6 AM to 11 PM) */}
      <div>
        <div className="flex items-center justify-between text-slate-300 mb-1.5">
          <span className="font-medium text-slate-400">Hour of Day (6:00 AM - 11:59 PM):</span>
          <span className="font-mono text-teal-300 font-bold">{formatTime(params.hourOfDay, params.minuteOfDay)}</span>
        </div>
        <input
          type="range"
          min="6"
          max="23"
          step="1"
          value={params.hourOfDay}
          onChange={(e) => onChangeParams({ ...params, hourOfDay: parseInt(e.target.value) })}
          className="w-full accent-teal-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>6 AM (Morning Open)</span>
          <span>12 PM (Lunch)</span>
          <span>5 PM (Evening Commute)</span>
          <span>11 PM (Close)</span>
        </div>
      </div>

      {/* Predictive Surge Scenario Toggles */}
      <div>
        <label className="block text-slate-400 font-medium mb-1.5">
          Dynamic Surge Modifiers (Predictive Overlays):
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          
          {/* Weekend Rush Toggle */}
          <button
            type="button"
            onClick={() => onChangeParams({ ...params, isWeekendRush: !params.isWeekendRush })}
            className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition text-left ${
              params.isWeekendRush
                ? 'bg-amber-950/60 border-amber-500 text-amber-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${params.isWeekendRush ? 'bg-amber-500 text-slate-950' : 'bg-slate-700 text-slate-300'}`}>
              <Flame className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-[11px]">Weekend Rush Surge</div>
              <div className="text-[10px] text-slate-400">+18% Costco, Sam's & Malls</div>
            </div>
          </button>

          {/* Holiday Shopping Surge Toggle */}
          <button
            type="button"
            onClick={() => onChangeParams({ ...params, isHolidaySurge: !params.isHolidaySurge })}
            className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition text-left ${
              params.isHolidaySurge
                ? 'bg-rose-950/60 border-rose-500 text-rose-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${params.isHolidaySurge ? 'bg-rose-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              <ShoppingBag className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-[11px]">Holiday Shopping Surge</div>
              <div className="text-[10px] text-slate-400">+35% Black Friday / Retail</div>
            </div>
          </button>

          {/* GGC Class Change Pulse Toggle */}
          <button
            type="button"
            onClick={() => onChangeParams({ ...params, isGgcClassChange: !params.isGgcClassChange })}
            className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition text-left ${
              params.isGgcClassChange
                ? 'bg-purple-950/60 border-purple-500 text-purple-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${params.isGgcClassChange ? 'bg-purple-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              <GraduationCap className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-[11px]">GGC Class-Change Peak</div>
              <div className="text-[10px] text-slate-400">+30% Campus Decks & Lots</div>
            </div>
          </button>

          {/* Rainy Weather Toggle */}
          <button
            type="button"
            onClick={() => onChangeParams({ ...params, isRainWeather: !params.isRainWeather })}
            className={`p-2.5 rounded-xl border flex items-center space-x-2.5 transition text-left ${
              params.isRainWeather
                ? 'bg-blue-950/60 border-blue-500 text-blue-200'
                : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
            }`}
          >
            <div className={`p-1.5 rounded-lg ${params.isRainWeather ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
              <CloudRain className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="font-bold text-[11px]">Inclement Weather</div>
              <div className="text-[10px] text-slate-400">+15% Slower Lot Turnover</div>
            </div>
          </button>

        </div>
      </div>

      {/* Quick Preset Buttons */}
      <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-1.5 text-[11px]">
        <span className="text-slate-400 font-medium flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-teal-400" /> One-Click Gwinnett Scenarios:
        </span>
        <button
          type="button"
          onClick={() => applyPreset('costco-saturday-rush')}
          className="bg-slate-800 hover:bg-amber-600/30 hover:text-amber-200 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          Sat 2:00 PM: Costco & Sam's Club Rush
        </button>
        <button
          type="button"
          onClick={() => applyPreset('ggc-class-change')}
          className="bg-slate-800 hover:bg-purple-600/30 hover:text-purple-200 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          Tue 10:45 AM: GGC Campus Class Transition
        </button>
        <button
          type="button"
          onClick={() => applyPreset('holiday-mall-surge')}
          className="bg-slate-800 hover:bg-rose-600/30 hover:text-rose-200 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          Sugarloaf Mills Holiday Black Friday Surge
        </button>
        <button
          type="button"
          onClick={() => applyPreset('weekday-commute')}
          className="bg-slate-800 hover:bg-blue-600/30 hover:text-blue-200 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700 transition"
        >
          Wed 8:15 AM: Satellite Blvd Commute
        </button>
      </div>

    </div>
  );
};
