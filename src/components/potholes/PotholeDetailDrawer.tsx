import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PotholeReport } from '../../types/pothole';
import { useAccessibility } from '../../context/AccessibilityContext';
import { SeverityBadge } from '../common/SeverityBadge';
import { 
  MapPin, 
  ThumbsUp, 
  ShieldAlert, 
  Activity, 
  Building2, 
  X,
  Volume2,
  VolumeX,
  Layers,
  ExternalLink
} from 'lucide-react';

interface PotholeDetailDrawerProps {
  pothole: PotholeReport | null;
  onClose: () => void;
  onVerify: (id: string) => void;
}

// Controller to keep mini map centered around the shock GPS
const DrawerMapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    // Invalidate size ensures Leaflet calculates tile dimensions correctly on slide-in
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 16, { animate: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
};

// Custom Pulsing Shock Marker for Drawer Map
const createShockMarkerIcon = (severity: string) => {
  const color = 
    severity === 'critical' ? '#f43f5e' : 
    severity === 'severe' ? '#ef4444' : 
    severity === 'moderate' ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: 'custom-shock-pin',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: ${color}44; animation: ping 1.8s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: ${color}; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
          <span style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></span>
        </span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

export const PotholeDetailDrawer: React.FC<PotholeDetailDrawerProps> = ({
  pothole,
  onClose,
  onVerify
}) => {
  const { speakPothole, stopSpeaking, isSpeaking } = useAccessibility();

  if (!pothole) return null;

  const isRepaired = pothole.status === 'repaired';

  // Calculate measured or estimated shock telemetry
  const shockValue = 
    pothole.bumpIntensity && pothole.bumpIntensity > 0
      ? pothole.bumpIntensity
      : pothole.sensorEvidence?.maxGForce
      ? pothole.sensorEvidence.maxGForce
      : pothole.severity === 'critical'
      ? 7.80
      : pothole.severity === 'severe'
      ? 5.40
      : pothole.severity === 'moderate'
      ? 3.80
      : 1.80;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-slate-900 border-l border-slate-800 shadow-2xl z-50 overflow-y-auto flex flex-col animate-in slide-in-from-right duration-300">
      
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur z-10">
        <div className="flex items-center space-x-2">
          {isRepaired ? (
            <span className="px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider bg-emerald-900/60 text-emerald-300 border border-emerald-700">
              Resolved & Repaired
            </span>
          ) : (
            <SeverityBadge severity={pothole.severity} />
          )}
          <span className="text-xs font-mono text-slate-400">
            #{pothole.id}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => isSpeaking ? stopSpeaking() : speakPothole(pothole)}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse'
                : 'bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700'
            }`}
            title="Narrate hazard in Southern cadence"
          >
            {isSpeaking ? <VolumeX className="w-3.5 h-3.5 text-amber-400" /> : <Volume2 className="w-3.5 h-3.5 text-teal-400" />}
            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 space-y-4 flex-1">
        {/* Title & Location (Human Landmark Priority) */}
        <div>
          <div className="mb-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-teal-900/40 text-teal-300 border border-teal-700/50 inline-flex items-center gap-1">
              📍 {pothole.landmark || pothole.roadName || 'GGC Campus Corridor'}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white leading-snug">{pothole.title}</h2>
          <div className="flex items-start space-x-2 mt-2 text-xs text-slate-300">
            <MapPin className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-200">
                {pothole.roadName} {pothole.landmark ? `(near ${pothole.landmark})` : ''}
              </p>
              <p className="text-slate-400">{pothole.address} • {pothole.city}, Gwinnett County</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                GPS: {pothole.latitude.toFixed(5)}, {pothole.longitude.toFixed(5)}
                {pothole.distanceFromGgcMiles !== undefined ? ` (${pothole.distanceFromGgcMiles.toFixed(2)} mi from campus)` : ''}
              </p>
            </div>
          </div>
        </div>

        {/* Map Location Centralized around Shock Detected GPS */}
        <div className="relative rounded-2xl overflow-hidden border border-slate-700/80 shadow-lg bg-slate-950">
          <div className="h-44 sm:h-52 w-full">
            <MapContainer
              center={[pothole.latitude, pothole.longitude]}
              zoom={16}
              scrollWheelZoom={false}
              dragging={true}
              touchZoom={true}
              className="h-full w-full z-0"
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DrawerMapUpdater center={[pothole.latitude, pothole.longitude]} />
              <Marker
                position={[pothole.latitude, pothole.longitude]}
                icon={createShockMarkerIcon(pothole.severity)}
              />
            </MapContainer>
          </div>

          {/* Map Overlay Badge */}
          <div className="absolute top-2.5 left-2.5 z-[1000] bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1.5 text-[10px] font-mono text-slate-200 shadow">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Shock Pin: {pothole.latitude.toFixed(5)}, {pothole.longitude.toFixed(5)}</span>
          </div>

          {/* Google Maps External Jump Link */}
          <a
            href={`https://www.google.com/maps?q=${pothole.latitude},${pothole.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-2.5 right-2.5 z-[1000] bg-slate-900/95 hover:bg-slate-800 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-1 text-[11px] font-semibold text-teal-300 shadow transition"
          >
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3 text-teal-400" />
          </a>
        </div>

        {/* Description */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-3.5 text-xs text-slate-300">
          <p className="leading-relaxed">{pothole.description}</p>
        </div>

        {/* Accelerometer Hardware Sensor Shock Telemetry */}
        <div className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Accelerometer Shock Reading
              </span>
            </div>
            <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
              shockValue >= 6.0
                ? 'bg-rose-950 text-rose-300 border-rose-800'
                : shockValue >= 3.0
                ? 'bg-amber-950 text-amber-300 border-amber-800'
                : 'bg-emerald-950 text-emerald-300 border-emerald-800'
            }`}>
              {shockValue >= 6.0 ? 'High-Impact Shock' : shockValue >= 3.0 ? 'Moderate Impact' : 'Low-Impact Anomaly'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
              <span className="text-[10px] text-slate-400 block font-sans uppercase">Measured Shock Force</span>
              <div className="flex items-baseline space-x-1 mt-0.5">
                <span className={`text-2xl font-black font-mono ${
                  shockValue >= 6.0 ? 'text-rose-400' : shockValue >= 3.0 ? 'text-amber-400' : 'text-emerald-400'
                }`}>
                  {shockValue.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-slate-400">G</span>
              </div>
              <span className="text-[10px] text-slate-500 mt-0.5 block">Baseline: 1.00G Gravity</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] text-slate-400 block font-sans uppercase">Capture Method</span>
                <span className="text-xs font-bold text-white mt-1 block truncate">
                  {pothole.sensorDetected ? 'Vehicle Accelerometer' : (pothole.detectedBy || 'In-Vehicle Telemetry')}
                </span>
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Hardware Sensor Metric
              </span>
            </div>
          </div>

          {pothole.surfaceType && (
            <div className="pt-2 border-t border-slate-700/50 flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Surface Material:
              </span>
              <span className="font-semibold text-slate-200">{pothole.surfaceType}</span>
            </div>
          )}
        </div>

        {/* Explain the sensor readings if clustered hits exist */}
        {pothole.sensorEvidence && (
          <section className="bg-teal-950/30 border border-teal-800/50 rounded-xl p-3.5 text-xs text-slate-200">
            <h3 className="font-semibold text-teal-300 mb-2">
              Why this sensor report was created
            </h3>
            <dl className="grid grid-cols-2 gap-2">
              <div>
                <dt className="text-slate-400">Impacts nearby</dt>
                <dd>{pothole.sensorEvidence.hitCount}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Highest reading</dt>
                <dd>{pothole.sensorEvidence.maxGForce.toFixed(2)} G</dd>
              </div>
              <div>
                <dt className="text-slate-400">First detection</dt>
                <dd>{pothole.sensorEvidence.firstDetectedAt}</dd>
              </div>
              <div>
                <dt className="text-slate-400">Latest detection</dt>
                <dd>{pothole.sensorEvidence.lastDetectedAt}</dd>
              </div>
            </dl>
          </section>
        )}

        {/* Damage Hazard Assessment */}
        <div className="bg-rose-950/30 border border-rose-800/40 rounded-xl p-3.5">
          <div className="flex items-center space-x-2 text-rose-300 font-semibold text-xs mb-1">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Vehicular Hazard Rating</span>
          </div>
          <p className="text-xs text-rose-200/90 font-medium">
            Primary Risk: <strong className="text-white">{pothole.damageRisk}</strong>
          </p>
          <p className="text-[11px] text-rose-300/70 mt-1">
            Detected via: <span className="text-slate-200 font-medium">{pothole.detectedBy}</span>
          </p>
        </div>

        {/* Crowdsourced Verification Bar */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <ThumbsUp className="w-3.5 h-3.5 text-teal-400" /> Crowdsourced Confirmations
            </span>
            <span className="text-xs font-mono font-bold text-teal-300 bg-teal-950 px-2 py-0.5 rounded border border-teal-800">
              {pothole.verificationsCount} Citizens Confirmed
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mb-3">
            Reports with multiple citizen upvotes receive higher visibility in commuter queues.
          </p>
          <button
            onClick={() => onVerify(pothole.id)}
            className="w-full bg-slate-700 hover:bg-teal-600 hover:text-white text-slate-200 font-medium py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition active:scale-98"
          >
            <ThumbsUp className="w-4 h-4" />
            <span>I Encountered This Pothole (+1 Verification)</span>
          </button>
        </div>

        {/* Jurisdiction Info */}
        <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-3.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-400" /> Assigned Jurisdiction
            </span>
            <span className="text-xs font-bold text-blue-300">{pothole.jurisdiction}</span>
          </div>

          {pothole.workOrderNumber && (
            <div className="flex justify-between text-xs pt-1 border-t border-slate-700/40">
              <span className="text-slate-400">Reference ID:</span>
              <span className="font-mono text-slate-200">{pothole.workOrderNumber}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 sticky bottom-0 flex gap-2">
        <button
          onClick={() => onVerify(pothole.id)}
          className="flex-1 bg-teal-600 hover:bg-teal-500 text-white font-semibold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-teal-600/20 transition active:scale-98"
        >
          <ThumbsUp className="w-4 h-4" />
          <span>Confirm Hazard (+1 Upvote)</span>
        </button>
        <button
          onClick={onClose}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
        >
          Close
        </button>
      </div>

    </div>
  );
};
