import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { PotholeReport, RoadSegment, SeverityLevel, PotholeStatus } from '../../types/pothole';
import { CAMPUS_CENTER } from '../../data/jurisdictionsData';
import { MunicipalQuickJump } from '../map/MunicipalQuickJump';
import { reverseGeocode } from '../../services/reverseGeocoding';
import { distanceFromCampusMiles, formatCoords } from '../../services/distanceCalculator';
import { useAccessibility, ThemeKey } from '../../context/AccessibilityContext';
import { 
  Filter, 
  ThumbsUp, 
  Crosshair, 
  GraduationCap, 
  Map as MapIcon,
  Building2,
  Clock,
  Volume2,
  FileText
} from 'lucide-react';

interface PotholeMapViewProps {
  potholes: PotholeReport[];
  roadSegments: RoadSegment[];
  selectedPothole: PotholeReport | null;
  onSelectPothole: (pothole: PotholeReport) => void;
  onVerifyPothole: (id: string) => void;
  onMapDropPin?: (lat: number, lng: number, address: string) => void;
}

// Controller to smoothly pan & zoom map
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.0 });
  }, [center, zoom, map]);
  return null;
};

// Map click event handler to allow dropping a marker
const MapClickHandler: React.FC<{ onMapClick: (lat: number, lng: number) => void }> = ({ onMapClick }) => {
  useMapEvents({
    click(e) {
      onMapClick(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Dynamic Marker Icon Generator with Theme Awareness (Colorblind, High Contrast, Standard GGC, Dark)
const createTrafficLightIcon = (
  severity: SeverityLevel,
  status: PotholeStatus,
  verifications: number,
  theme: ThemeKey = 'colorblind'
) => {
  const isRepaired = status === 'repaired';
  let color = '#0072b2';
  let borderColor = '#ffffff';
  let textColor = '#ffffff';
  let pulseColor = '#0072b2';
  let symbol = '◆';

  if (isRepaired) {
    symbol = '✓';
    if (theme === 'high-contrast') {
      color = '#00ffff';
      textColor = '#000000';
      borderColor = '#ffffff';
    } else if (theme === 'colorblind') {
      color = '#009e73';
      borderColor = '#ffffff';
    } else if (theme === 'standard') {
      color = '#006747';
      borderColor = '#c4a35a';
    } else {
      color = '#10b981';
      borderColor = '#059669';
    }
  } else if (severity === 'severe' || severity === 'critical') {
    symbol = '▲';
    if (theme === 'high-contrast') {
      color = '#ff0000';
      textColor = '#ffffff';
      borderColor = '#ffffff';
      pulseColor = '#ff0000';
    } else if (theme === 'colorblind') {
      color = '#d55e00'; // Okabe-Ito Vermilion
      borderColor = '#ffffff';
      pulseColor = '#d55e00';
    } else if (theme === 'standard') {
      color = '#dc2626';
      borderColor = '#ffffff';
      pulseColor = '#dc2626';
    } else {
      color = '#ef4444';
      borderColor = '#b91c1c';
      pulseColor = '#ef4444';
    }
  } else if (severity === 'moderate') {
    symbol = '◆';
    if (theme === 'high-contrast') {
      color = '#ffff00';
      textColor = '#000000';
      borderColor = '#ffffff';
    } else if (theme === 'colorblind') {
      color = '#0072b2'; // Okabe-Ito Sky Blue
      borderColor = '#ffffff';
    } else if (theme === 'standard') {
      color = '#c4a35a'; // GGC Gold
      textColor = '#1a1f1c';
      borderColor = '#ffffff';
    } else {
      color = '#f59e0b';
      borderColor = '#d97706';
    }
  } else {
    // Minor
    symbol = '●';
    if (theme === 'high-contrast') {
      color = '#00ffff';
      textColor = '#000000';
      borderColor = '#ffffff';
    } else if (theme === 'colorblind') {
      color = '#009e73'; // Okabe-Ito Bluish Green
      borderColor = '#ffffff';
    } else if (theme === 'standard') {
      color = '#006747'; // GGC Green
      borderColor = '#ffffff';
    } else {
      color = '#10b981';
      borderColor = '#059669';
    }
  }

  const isSevere = severity === 'severe' || severity === 'critical';
  const pulseHtml = isSevere && !isRepaired ? `
    <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${pulseColor}; opacity: 0.35; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
  ` : '';

  const borderWidth = theme === 'high-contrast' ? '3px' : '2.5px';

  const svgHtml = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      ${pulseHtml}
      <div style="
        width: 28px; 
        height: 28px; 
        background: ${color}; 
        border: ${borderWidth} solid ${borderColor}; 
        border-radius: 50%; 
        box-shadow: 0 4px 8px -1px rgba(0,0,0,0.5); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        color: ${textColor};
        font-weight: 900;
        font-size: 13px;
        position: relative;
        z-index: 2;
        user-select: none;
      ">
        ${symbol}
      </div>
      <div style="
        position: absolute; 
        bottom: -3px; 
        width: 0; 
        height: 0; 
        border-left: 5px solid transparent; 
        border-right: 5px solid transparent; 
        border-top: 6px solid ${borderColor};
      "></div>
    </div>
  `;

  return L.divIcon({
    html: svgHtml,
    className: 'custom-traffic-pin',
    iconSize: [34, 37],
    iconAnchor: [17, 37],
    popupAnchor: [0, -37]
  });
};

// GGC Center Campus Marker Icon
const ggcCenterIcon = L.divIcon({
  html: `
    <div style="
      background: #006747; 
      color: #c4a35a; 
      border: 2px solid #c4a35a; 
      border-radius: 50%; 
      width: 32px; 
      height: 32px; 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      font-weight: 900; 
      font-size: 11px; 
      box-shadow: 0 0 14px rgba(0,103,71,0.8);
    ">
      GGC
    </div>
  `,
  className: 'ggc-campus-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

// Helper for freshness indicator
function getFreshnessInfo(reportedAt: string, lastVerifiedAt?: string) {
  const dateStr = lastVerifiedAt || reportedAt;
  const time = new Date(dateStr).getTime();
  const now = Date.now();
  const diffHours = (now - time) / (1000 * 60 * 60);

  if (diffHours < 24) {
    return { text: 'Active today', dotColor: 'bg-emerald-500' };
  } else if (diffHours < 72) {
    return { text: `${Math.round(diffHours / 24)}d ago`, dotColor: 'bg-amber-500' };
  } else {
    return { text: 'Older report', dotColor: 'bg-slate-400' };
  }
}

export const PotholeMapView: React.FC<PotholeMapViewProps> = ({
  potholes,
  roadSegments,
  selectedPothole,
  onSelectPothole,
  onVerifyPothole,
  onMapDropPin
}) => {
  const { speakPothole, theme } = useAccessibility();
  // Map View Scopes
  const [viewScope, setViewScope] = useState<'campus' | 'gwinnett'>('campus');
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number }>({
    center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
    zoom: 14
  });

  const [activePresetId, setActivePresetId] = useState<string>('ggc');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; address: string } | null>(null);

  // Toggle View Scope
  const handleScopeChange = (scope: 'campus' | 'gwinnett') => {
    setViewScope(scope);
    if (scope === 'campus') {
      setActivePresetId('ggc');
      setMapTarget({ center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], zoom: 14 });
    } else {
      setActivePresetId('');
      setMapTarget({ center: [33.972, -84.095], zoom: 11 });
    }
  };

  // Quick Preset Click
  const handlePresetSelect = (lat: number, lng: number, zoom: number, id: string) => {
    setActivePresetId(id);
    setMapTarget({ center: [lat, lng], zoom });
  };

  // GPS Device Geolocation
  const handleGpsLocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setMapTarget({ center: [lat, lng], zoom: 16 });
          const geo = await reverseGeocode(lat, lng);
          setDroppedPin({ lat, lng, address: geo.address });
        },
        () => {
          alert('GPS location access denied or unavailable.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Handle map click to drop custom pin
  const handleMapClick = async (lat: number, lng: number) => {
    const geo = await reverseGeocode(lat, lng);
    setDroppedPin({ lat, lng, address: geo.address });
    if (onMapDropPin) {
      onMapDropPin(lat, lng, geo.address);
    }
  };

  // Filtered potholes
  const filteredPotholes = useMemo(() => {
    return potholes.filter(p => {
      if (severityFilter === 'critical' && p.severity !== 'critical' && p.severity !== 'severe') return false;
      if (severityFilter === 'moderate' && p.severity !== 'moderate') return false;
      if (severityFilter === 'resolved' && p.status !== 'repaired') return false;
      
      if (viewScope === 'campus') {
        const dist = p.distanceFromGgcMiles ?? distanceFromCampusMiles({ lat: p.latitude, lng: p.longitude });
        if (dist > 1.8) return false;
      }
      return true;
    });
  }, [potholes, severityFilter, viewScope]);

  return (
    <div className="flex flex-col h-[calc(100vh-125px)] relative select-none">
      
      {/* Top Scope Switcher & Clean Top-Right Filter Bar */}
      <div className="bg-slate-900 border-b border-slate-800 px-3 sm:px-4 py-2 z-20 flex flex-wrap items-center justify-between gap-2 text-xs">
        
        {/* Left: View Scope Switcher & GPS */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-xl bg-slate-800 p-0.5 border border-slate-700 font-semibold">
            <button
              onClick={() => handleScopeChange('campus')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                viewScope === 'campus'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>GGC Campus</span>
            </button>

            <button
              onClick={() => handleScopeChange('gwinnett')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
                viewScope === 'gwinnett'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>All Gwinnett</span>
            </button>
          </div>

          <button
            onClick={handleGpsLocate}
            className="flex items-center space-x-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 font-medium transition"
            title="Locate via phone GPS"
          >
            <Crosshair className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Near Me</span>
          </button>
        </div>

        {/* Right: Consolidated Traffic Light Filter */}
        <div className="flex items-center space-x-2 ml-auto">
          <div className="flex items-center text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 mr-1 text-teal-400" />
            <span className="hidden sm:inline">Filter:</span>
          </div>

          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1 outline-none text-xs font-semibold focus:ring-1 focus:ring-teal-500"
          >
            <option value="all">All Hazards ({potholes.length})</option>
            <option value="critical">🔴 Critical / Action Needed</option>
            <option value="moderate">🟡 Moderate / Watch</option>
            <option value="resolved">🟢 Resolved / Repaired</option>
          </select>
        </div>

      </div>

      {/* Municipal Quick Jump Presets */}
      <MunicipalQuickJump
        onSelectPreset={handlePresetSelect}
        activePresetId={activePresetId}
      />

      {/* Main Full-Height Leaflet Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={mapTarget.center}
          zoom={mapTarget.zoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapController center={mapTarget.center} zoom={mapTarget.zoom} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* Standard OpenStreetMap Tile Layer - 100% Free, NO API Key Required Watermarks */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* GGC Campus 1-Mile Radius Circle */}
          <Circle
            center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
            radius={CAMPUS_CENTER.radiusMeters}
            pathOptions={{
              color: '#006747',
              weight: 2,
              fillColor: '#c4a35a',
              fillOpacity: 0.10,
              dashArray: '5, 5'
            }}
          />

          {/* GGC Campus Center Marker */}
          <Marker
            position={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
            icon={ggcCenterIcon}
          >
            <Popup>
              <div className="text-slate-900 text-xs p-1">
                <strong className="text-emerald-800 text-sm block">{CAMPUS_CENTER.name}</strong>
                <p className="text-slate-600 mt-0.5">{CAMPUS_CENTER.address}</p>
                <span className="text-[10px] text-slate-500 block mt-1">
                  1-mile campus radius boundary anchor.
                </span>
              </div>
            </Popup>
          </Marker>

          {/* Dropped Interactive Pin */}
          {droppedPin && (
            <Marker position={[droppedPin.lat, droppedPin.lng]}>
              <Popup>
                <div className="text-slate-900 text-xs min-w-[180px]">
                  <strong className="text-purple-800 block mb-1">📍 Selected Point</strong>
                  <p className="text-slate-700 font-medium mb-1">{droppedPin.address}</p>
                  <p className="text-slate-500 font-mono text-[10px]">
                    {formatCoords(droppedPin.lat, droppedPin.lng)}
                  </p>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Pothole Incident Markers */}
          {filteredPotholes.map(pothole => {
            const dist = pothole.distanceFromGgcMiles ?? distanceFromCampusMiles({ lat: pothole.latitude, lng: pothole.longitude });
            const freshness = getFreshnessInfo(pothole.reportedAt, pothole.lastVerifiedAt);
            const isCritical = pothole.severity === 'critical' || pothole.severity === 'severe';

            return (
              <Marker
                key={`${pothole.id}-${theme}`}
                position={[pothole.latitude, pothole.longitude]}
                icon={createTrafficLightIcon(pothole.severity, pothole.status, pothole.verificationsCount, theme)}
              >
                <Popup>
                  <div className="text-slate-200 text-xs min-w-[260px] space-y-2.5 p-1">
                    
                    {/* Landmark / Road Name Priority */}
                    <div className="flex items-start justify-between border-b border-slate-700 pb-2 gap-2">
                      <div>
                        <span className="font-bold text-white text-sm leading-tight block">
                          {pothole.roadName || pothole.title}
                        </span>
                        {pothole.landmark && pothole.landmark !== pothole.roadName && (
                          <span className="text-[11px] text-emerald-300 font-semibold block mt-0.5">
                            🏫 Landmark: {pothole.landmark}
                          </span>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 border ${
                        isCritical 
                          ? 'bg-rose-950/80 text-rose-300 border-rose-700' 
                          : pothole.status === 'repaired'
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                          : 'bg-amber-950/80 text-amber-300 border-amber-700'
                      }`}>
                        {isCritical ? '▲ Critical' : pothole.status === 'repaired' ? '✓ Resolved' : '◆ Moderate'}
                      </span>
                    </div>

                    {/* Primary Metric: Bold Community Confirmations */}
                    <div className="bg-slate-900/90 border border-slate-700/80 rounded-xl p-2 flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <span>👆</span>
                        <span className="text-emerald-300">{pothole.verificationsCount} drivers confirmed</span>
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-slate-300">
                        <span className={`w-2 h-2 rounded-full ${freshness.dotColor}`} />
                        <span>{freshness.text}</span>
                      </span>
                    </div>

                    {/* Proximity & Secondary GPS metadata */}
                    <div className="space-y-1 text-xs">
                      <div className="font-medium text-slate-200">{pothole.address}</div>
                      <div className="text-[11px] text-emerald-400 font-bold">
                        {dist.toFixed(2)} mi from GGC Student Center
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        GPS: {formatCoords(pothole.latitude, pothole.longitude)}
                      </div>
                      <div className="text-[10px] text-slate-300 flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        <span>Agency: {pothole.jurisdiction}</span>
                      </div>
                    </div>

                    {/* More Details & Inspector Button */}
                    <button
                      onClick={() => onSelectPothole(pothole)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5 transition shadow active:scale-98"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>More Details</span>
                    </button>

                    {/* Actions: Listen & Upvote */}
                    <div className="pt-0.5 flex items-center gap-2">
                      <button
                        onClick={() => speakPothole(pothole)}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold py-1.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition shadow-sm active:scale-98 border border-slate-700"
                        title="Listen to this report read aloud in Southern voice"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Listen</span>
                      </button>

                      <button
                        onClick={() => onVerifyPothole(pothole.id)}
                        className="flex-1 bg-slate-800 hover:bg-emerald-700 text-emerald-300 hover:text-white font-bold py-1.5 px-2.5 rounded-xl text-xs flex items-center justify-center gap-1 transition active:scale-98 border border-emerald-700/60 shadow-sm"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span>Confirm (+1)</span>
                      </button>
                    </div>

                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Legend pill on bottom left with Dual Coding Symbols */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl px-3 py-2 text-[11px] text-slate-300 shadow-xl hidden sm:flex items-center gap-3">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
            {theme === 'colorblind' ? 'Colorblind (Okabe-Ito)' : theme === 'high-contrast' ? 'High Contrast' : theme === 'standard' ? 'GGC Grizzly' : 'Dark'}:
          </span>
          <span className="flex items-center gap-1 font-semibold" style={{ color: theme === 'high-contrast' ? '#ff4d4d' : theme === 'colorblind' ? '#ff7b25' : '#ef4444' }}>
            <span className="text-xs">▲</span> Critical
          </span>
          <span className="flex items-center gap-1 font-semibold" style={{ color: theme === 'high-contrast' ? '#ffff00' : theme === 'colorblind' ? '#38bdf8' : theme === 'standard' ? '#c4a35a' : '#f59e0b' }}>
            <span className="text-xs">◆</span> Moderate
          </span>
          <span className="flex items-center gap-1 font-semibold" style={{ color: theme === 'high-contrast' ? '#00ffff' : theme === 'colorblind' ? '#34d399' : theme === 'standard' ? '#00a877' : '#10b981' }}>
            <span className="text-xs">●</span> Low / Resolved
          </span>
        </div>

      </div>

    </div>
  );
};
