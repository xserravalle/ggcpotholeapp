import React from 'react';

interface Preset {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  color: string;
}

const PRESETS: Preset[] = [
  { id: 'ggc', name: 'GGC Campus', lat: 33.9798, lng: -84.0017, zoom: 15, color: '#10b981' },
  { id: 'lawrenceville', name: 'Lawrenceville', lat: 33.9575, lng: -83.9880, zoom: 14, color: '#3b82f6' },
  { id: 'suwanee', name: 'Suwanee', lat: 34.0525, lng: -84.0722, zoom: 14, color: '#14b8a6' },
  { id: 'duluth', name: 'Duluth', lat: 34.0028, lng: -84.1446, zoom: 14, color: '#06b6d4' },
  { id: 'ptc', name: 'Peachtree Corners', lat: 33.9702, lng: -84.2185, zoom: 14, color: '#6366f1' },
  { id: 'norcross', name: 'Norcross', lat: 33.9412, lng: -84.2135, zoom: 14, color: '#8b5cf6' },
  { id: 'snellville', name: 'Snellville', lat: 33.8580, lng: -84.0185, zoom: 14, color: '#f97316' },
  { id: 'buford', name: 'Buford', lat: 34.1180, lng: -84.0045, zoom: 14, color: '#ec4899' },
];

interface MunicipalQuickJumpProps {
  onSelectPreset: (lat: number, lng: number, zoom: number, id: string) => void;
  activePresetId?: string;
}

export const MunicipalQuickJump: React.FC<MunicipalQuickJumpProps> = ({
  onSelectPreset,
  activePresetId
}) => {
  return (
    <div className="px-3 py-2 bg-slate-900/95 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap mr-1.5">
        Jump to Area:
      </span>
      {PRESETS.map(preset => {
        const isActive = activePresetId === preset.id;
        return (
          <button
            key={preset.id}
            onClick={() => onSelectPreset(preset.lat, preset.lng, preset.zoom, preset.id)}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 border ${
              isActive
                ? 'bg-slate-800 text-white border-teal-400 shadow-sm ring-1 ring-teal-400/50'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: preset.color }}
            />
            <span>{preset.name}</span>
          </button>
        );
      })}
    </div>
  );
};
