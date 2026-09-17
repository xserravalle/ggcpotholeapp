import React, { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Circle, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { PotholeReport, RoadSegment, SeverityLevel, PotholeStatus } from '../../types/pothole';
import { CAMPUS_CENTER } from '../../data/jurisdictionsData';
import { MunicipalQuickJump } from '../map/MunicipalQuickJump';
import { GgcReportDialog } from './GgcReportDialog';
import { generatePotholePdf } from '../../services/pdfGenerator';
import { classifyJurisdiction } from '../../services/jurisdictionClassifier';
import { reverseGeocode } from '../../services/reverseGeocoding';
import { distanceFromCampusMiles, formatCoords } from '../../services/distanceCalculator';
import { 
  AlertTriangle, 
  Filter, 
  ThumbsUp, 
  Send, 
  FileDown, 
  FileText, 
  Crosshair, 
  GraduationCap, 
  Map as MapIcon,
  ShieldCheck,
  PlusCircle,
  Building2
} from 'lucide-react';

interface PotholeMapViewProps {
  potholes: PotholeReport[];
  roadSegments: RoadSegment[];
  selectedPothole: PotholeReport | null;
  onSelectPothole: (pothole: PotholeReport) => void;
  onVerifyPothole: (id: string) => void;
  onOpenDispatcher: (pothole: PotholeReport) => void;
  onOpenReportModal: () => void;
  onMapDropPin?: (lat: number, lng: number, address: string) => void;
}

// Controller to smoothly pan & zoom map
const MapController: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 1.2 });
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

// Custom SVG icon generator for map pins
const createPotholeIcon = (severity: SeverityLevel, status: PotholeStatus, verifications: number) => {
  let bgColor = '#f59e0b'; // Amber for moderate
  let ringClass = '';
  let borderColor = '#b45309';

  if (severity === 'severe' || severity === 'critical') {
    bgColor = '#ef4444'; // Red
    borderColor = '#991b1b';
    ringClass = 'animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;';
  } else if (severity === 'minor') {
    bgColor = '#eab308'; // Yellow
    borderColor = '#a16207';
  }

  const isRepaired = status === 'repaired';
  if (isRepaired) {
    bgColor = '#10b981'; // Green
    borderColor = '#047857';
  }

  const svgHtml = `
    <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
      ${(severity === 'severe' || severity === 'critical') && !isRepaired ? `
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: ${bgColor}; opacity: 0.4; ${ringClass}"></div>
      ` : ''}
      <div style="
        width: 28px; 
        height: 28px; 
        background: ${bgColor}; 
        border: 2px solid ${borderColor}; 
        border-radius: 50%; 
        box-shadow: 0 4px 6px -1px rgba(0,0,0,0.5); 
        display: flex; 
        align-items: center; 
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 11px;
        position: relative;
        z-index: 2;
      ">
        ${isRepaired ? '✓' : verifications > 0 ? verifications : '!'}
      </div>
      <div style="
        position: absolute; 
        bottom: -4px; 
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
    className: 'custom-pothole-icon',
    iconSize: [34, 34],
    iconAnchor: [17, 34],
    popupAnchor: [0, -32]
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
      box-shadow: 0 0 12px rgba(0,103,71,0.8);
    ">
      GGC
    </div>
  `,
  className: 'ggc-campus-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16]
});

export const PotholeMapView: React.FC<PotholeMapViewProps> = ({
  potholes,
  roadSegments,
  selectedPothole,
  onSelectPothole,
  onVerifyPothole,
  onOpenDispatcher,
  onOpenReportModal,
  onMapDropPin
}) => {
  // Map View Scopes
  const [viewScope, setViewScope] = useState<'campus' | 'gwinnett'>('campus');
  const [mapTarget, setMapTarget] = useState<{ center: [number, number]; zoom: number }>({
    center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng],
    zoom: 14
  });

  // Filters
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('all');
  const [showRoadSegments, setShowRoadSegments] = useState<boolean>(true);
  const [showRadiusCircle, setShowRadiusCircle] = useState<boolean>(true);

  // Active Pin drop
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [isTextReportOpen, setIsTextReportOpen] = useState(false);

  // Toggle View Scope
  const handleScopeChange = (scope: 'campus' | 'gwinnett') => {
    setViewScope(scope);
    if (scope === 'campus') {
      setMapTarget({ center: [CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], zoom: 14 });
    } else {
      setMapTarget({ center: [33.972, -84.095], zoom: 11 });
    }
  };

  // Quick Preset Click
  const handlePresetSelect = (lat: number, lng: number, zoom: number) => {
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
        err => {
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
      if (severityFilter !== 'all' && p.severity !== severityFilter) return false;
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (jurisdictionFilter !== 'all' && p.jurisdiction !== jurisdictionFilter) return false;
      if (viewScope === 'campus') {
        const dist = p.distanceFromGgcMiles ?? distanceFromCampusMiles({ lat: p.latitude, lng: p.longitude });
        if (dist > 1.5) return false; // Focus on 1.5 mi around campus in campus view
      }
      return true;
    });
  }, [potholes, severityFilter, statusFilter, jurisdictionFilter, viewScope]);

  // Segment risk color helper
  const getSegmentColor = (risk: RoadSegment['riskLevel']) => {
    switch (risk) {
      case 'Critical': return '#ef4444';
      case 'High': return '#f97316';
      case 'Moderate': return '#f59e0b';
      default: return '#10b981';
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] relative select-none">
      
      {/* Top Scope Switcher & Filter Toolbar */}
      <div className="bg-slate-900/95 backdrop-blur border-b border-slate-800 px-4 py-2 z-20 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        
        {/* Left: View Scope Switcher & GPS */}
        <div className="flex items-center space-x-2">
          <div className="inline-flex rounded-lg bg-slate-800 p-0.5 border border-slate-700 font-semibold">
            <button
              onClick={() => handleScopeChange('campus')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                viewScope === 'campus'
                  ? 'bg-emerald-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>GGC Campus (1-Mile Circle)</span>
            </button>

            <button
              onClick={() => handleScopeChange('gwinnett')}
              className={`px-3 py-1 rounded-md transition flex items-center gap-1.5 ${
                viewScope === 'gwinnett'
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Full Gwinnett County</span>
            </button>
          </div>

          <button
            onClick={handleGpsLocate}
            className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-700/50 hover:bg-emerald-600 text-emerald-200 hover:text-white rounded-lg border border-emerald-600/50 font-medium transition"
            title="Locate via GPS"
          >
            <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
            <span>GPS Pinpoint</span>
          </button>
        </div>

        {/* Center: Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5 mr-1 text-teal-400" />
            <span>Filter:</span>
          </div>

          <select 
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none text-xs"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical (Immediate Axle Risk)</option>
            <option value="severe">Severe</option>
            <option value="moderate">Moderate</option>
            <option value="minor">Minor</option>
          </select>

          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-md px-2 py-1 outline-none text-xs"
          >
            <option value="all">All Statuses</option>
            <option value="reported">Reported</option>
            <option value="investigating">Investigating</option>
            <option value="scheduled">Scheduled for Repair</option>
            <option value="repaired">Repaired</option>
          </select>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center space-x-2">
          {/* Text Report Action */}
          <button
            onClick={() => setIsTextReportOpen(true)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 flex items-center gap-1.5 transition"
            title="Generate text report with GGC distances"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-400" />
            <span>GGC Report (.txt)</span>
          </button>

          {/* New Hazard Report */}
          <button
            onClick={onOpenReportModal}
            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-bold flex items-center gap-1.5 shadow transition active:scale-95"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Hazard</span>
          </button>
        </div>

      </div>

      {/* Municipal Quick Jump Presets */}
      <MunicipalQuickJump onSelectPreset={handlePresetSelect} />

      {/* Main Map Canvas */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={mapTarget.center}
          zoom={mapTarget.zoom}
          scrollWheelZoom={true}
          className="w-full h-full"
        >
          <MapController center={mapTarget.center} zoom={mapTarget.zoom} />
          <MapClickHandler onMapClick={handleMapClick} />

          {/* OpenStreetMap standard tiles. CARTO's basemaps now require an API key and
              drew "API KEY REQUIRED" over the map; OSM's need no key (attribution required,
              light use only: https://operations.osmfoundation.org/policies/tiles/). */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* GGC Campus 1-Mile Radius Circle (from ggcpotholeprototype) */}
          {showRadiusCircle && (
            <Circle
              center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
              radius={CAMPUS_CENTER.radiusMeters}
              pathOptions={{
                color: '#006747',
                weight: 2.5,
                fillColor: '#c4a35a',
                fillOpacity: 0.12,
                dashArray: '6, 6'
              }}
            />
          )}

          {/* GGC Campus Center Marker */}
          <Marker
            position={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
            icon={ggcCenterIcon}
          >
            <Popup>
              <div className="text-slate-900 text-xs p-1">
                <strong className="text-emerald-800 text-sm">{CAMPUS_CENTER.name}</strong>
                <p className="text-slate-600 mt-1">{CAMPUS_CENTER.address}</p>
                <span className="text-[11px] text-slate-500 block mt-1">
                  Center of the 1-mile campus roadway maintenance perimeter.
                </span>
              </div>
            </Popup>
          </Marker>

          {/* User Dropped Pin (interactive pinpoint) */}
          {droppedPin && (
            <Marker position={[droppedPin.lat, droppedPin.lng]}>
              <Popup>
                <div className="text-slate-900 text-xs min-w-[200px]">
                  <strong className="text-purple-800 block mb-1">📍 Selected Coordinates</strong>
                  <p className="text-slate-700 font-medium mb-1">{droppedPin.address}</p>
                  <p className="text-slate-500 font-mono text-[10px] mb-2">
                    {formatCoords(droppedPin.lat, droppedPin.lng)}
                  </p>
                  <button
                    onClick={onOpenReportModal}
                    className="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-center transition"
                  >
                    Report Hazard at this Point
                  </button>
                </div>
              </Popup>
            </Marker>
          )}

          {/* High-Risk Road Segments Polylines */}
          {showRoadSegments && roadSegments.map(segment => (
            <Polyline
              key={segment.id}
              positions={segment.coordinates}
              pathOptions={{
                color: getSegmentColor(segment.riskLevel),
                weight: 5,
                opacity: 0.85,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            >
              <Popup>
                <div className="text-slate-900 text-xs">
                  <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1 mb-1">
                    <span className="font-bold text-sm text-slate-800">{segment.name}</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      segment.riskLevel === 'Critical' ? 'bg-red-100 text-red-700' :
                      segment.riskLevel === 'High' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {segment.riskLevel} Risk
                    </span>
                  </div>
                  <p className="text-slate-600 mb-1"><strong>Corridor:</strong> {segment.corridor}</p>
                  <p className="text-slate-600 mb-1"><strong>Pavement Condition:</strong> {segment.pci}/100</p>
                  <p className="text-slate-600 mb-1"><strong>Daily Traffic:</strong> {segment.dailyTrafficAADT.toLocaleString()} AADT</p>
                  <p className="text-slate-700 mb-1"><strong>Distress Root Cause:</strong> {segment.recurringIssue}</p>
                  <p className="text-blue-700 font-medium"><strong>Resurfacing:</strong> {segment.nextScheduledResurfacing}</p>
                </div>
              </Popup>
            </Polyline>
          ))}

          {/* Pothole Incident Markers */}
          {filteredPotholes.map(pothole => {
            const dist = pothole.distanceFromGgcMiles ?? distanceFromCampusMiles({ lat: pothole.latitude, lng: pothole.longitude });
            return (
              <Marker
                key={pothole.id}
                position={[pothole.latitude, pothole.longitude]}
                icon={createPotholeIcon(pothole.severity, pothole.status, pothole.verificationsCount)}
                eventHandlers={{
                  click: () => onSelectPothole(pothole)
                }}
              >
                <Popup>
                  <div className="text-slate-900 text-xs min-w-[250px] space-y-1.5">
                    {/* Header & Badges */}
                    <div className="flex items-center justify-between gap-1 border-b border-slate-200 pb-1">
                      <span className="font-bold text-slate-900 text-xs leading-tight">
                        {pothole.title}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        pothole.severity === 'critical' || pothole.severity === 'severe'
                          ? 'bg-rose-100 text-rose-700'
                          : pothole.severity === 'moderate'
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {pothole.severity}
                      </span>
                    </div>

                    {/* Address & Campus Distance */}
                    <p className="text-slate-600 font-medium">{pothole.address}</p>
                    
                    <div className="bg-slate-50 p-2 rounded border border-slate-200 text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Distance from GGC:</span>
                        <span className="font-bold text-emerald-700">{dist.toFixed(2)} miles</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Assigned Agency:</span>
                        <span className="font-semibold text-slate-800">{pothole.jurisdiction}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Telemetry:</span>
                        <span className="text-rose-700 font-medium">
                          {pothole.sensorDetected ? `${pothole.bumpIntensity}G Shock Spike` : pothole.detectedBy}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-1 pt-1">
                      <button
                        onClick={() => onVerifyPothole(pothole.id)}
                        className="bg-teal-600 hover:bg-teal-700 text-white py-1 px-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                        title="Upvote community verification"
                      >
                        <ThumbsUp className="w-3 h-3" />
                        <span>({pothole.verificationsCount})</span>
                      </button>

                      <button
                        onClick={() => generatePotholePdf(pothole)}
                        className="bg-purple-700 hover:bg-purple-800 text-white py-1 px-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                        title="Download official certified PDF docket"
                      >
                        <FileDown className="w-3 h-3" />
                        <span>PDF</span>
                      </button>

                      <button
                        onClick={() => onOpenDispatcher(pothole)}
                        className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-1.5 rounded text-[10px] font-semibold flex items-center justify-center gap-1 transition"
                        title="Dispatch work order to municipality"
                      >
                        <Send className="w-3 h-3" />
                        <span>Route</span>
                      </button>
                    </div>

                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>

        {/* Floating Quick Summary on Bottom-Left */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-2xl text-xs max-w-sm hidden sm:block">
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-bold text-white flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-400" />
              {viewScope === 'campus' ? 'GGC Campus 1-Mile Area' : 'Gwinnett County GIS Watch'}
            </span>
            <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 font-mono">
              {filteredPotholes.length} Active
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            {viewScope === 'campus'
              ? 'Showing potholes within 1.5 miles of Georgia Gwinnett College. Click map to add a point or drag to adjust coordinates.'
              : 'Showing full county perimeter including GCDOT, GDOT State Routes (GA-316, I-85), and 16 municipal agencies.'}
          </p>
        </div>

      </div>

      {/* GGC Plain Text Report Dialog */}
      <GgcReportDialog
        isOpen={isTextReportOpen}
        onClose={() => setIsTextReportOpen(false)}
        potholes={filteredPotholes}
      />

    </div>
  );
};
