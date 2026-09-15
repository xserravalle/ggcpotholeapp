import React from 'react';

interface Preset {
  id: string;
  name: string;
  lat: number;
  lng: number;
  zoom: number;
  badge: string;
}

const PRESETS: Preset[] = [
  { id: 'ggc', name: '🎓 GGC Campus', lat: 33.9798, lng: -84.0017, zoom: 15, badge: 'Campus 1-Mile Core' },
  { id: 'lawrenceville', name: '🏛️ Lawrenceville', lat: 33.9575, lng: -83.9880, zoom: 14, badge: 'Historic Square' },
  { id: 'suwanee', name: '🌳 Suwanee', lat: 34.0525, lng: -84.0722, zoom: 14, badge: 'Town Center' },
  { id: 'duluth', name: '🛍️ Duluth', lat: 34.0028, lng: -84.1446, zoom: 14, badge: 'Main St Corridor' },
  { id: 'ptc', name: '💡 Peachtree Corners', lat: 33.9702, lng: -84.2185, zoom: 14, badge: 'Curiosity Lab' },
  { id: 'norcross', name: '🚂 Norcross', lat: 33.9412, lng: -84.2135, zoom: 14, badge: 'Downtown' },
  { id: 'snellville', name: '🛣️ Snellville', lat: 33.8580, lng: -84.0185, zoom: 14, badge: 'Scenic Hwy' },
  { id: 'buford', name: '🏬 Buford', lat: 34.1180, lng: -84.0045, zoom: 14, badge: 'Mall of GA' },
  { id: 'gdot', name: '⚡ GA-316 / I-85', lat: 33.9712, lng: -84.0320, zoom: 14, badge: 'GDOT Highway' }
];

interface MunicipalQuickJumpProps {
  onSelectPreset: (lat: number, lng: number, zoom: number) => void;
  activePresetId?: string;
}

export const MunicipalQuickJump: React.FC<MunicipalQuickJumpProps> = ({
  onSelectPreset,
  activePresetId
}) => {
  return (
    <div className="px-3 py-1.5 bg-slate-900/90 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs no-scrollbar">
      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] whitespace-nowrap mr-1">
        Quick Jump:
      </span>
      {PRESETS.map(preset => (
        <button
          key={preset.id}
          onClick={() => onSelectPreset(preset.lat, preset.lng, preset.zoom)}
          className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition border ${
            activePresetId === preset.id
              ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500 shadow-xs'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
};
