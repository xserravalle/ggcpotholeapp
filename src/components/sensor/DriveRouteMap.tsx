import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { DriveBreadcrumb, DriveShockIncident } from '../../types/driveSession';

interface DriveRouteMapProps {
  path: DriveBreadcrumb[];
  incidents: DriveShockIncident[];
  isLive?: boolean;
  onSelectIncident?: (incident: DriveShockIncident) => void;
  heightClass?: string;
}

// Controller to auto-center when live driving or fit bounds on summary
const RouteMapController: React.FC<{
  path: DriveBreadcrumb[];
  isLive?: boolean;
}> = ({ path, isLive }) => {
  const map = useMap();

  useEffect(() => {
    if (path.length === 0) return;

    const timer = setTimeout(() => {
      map.invalidateSize();

      if (isLive) {
        // In live driving mode: center smoothly on latest position
        const latest = path[path.length - 1];
        map.setView([latest.lat, latest.lng], 16, { animate: true });
      } else if (path.length >= 2) {
        // In post-drive summary: fit the entire route bounding box
        const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
        map.fitBounds(bounds, { padding: [35, 35], maxZoom: 17 });
      } else {
        map.setView([path[0].lat, path[0].lng], 16);
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [path, isLive, map]);

  return null;
};

// Start Point Icon (Green Flag)
const createStartIcon = () => {
  return L.divIcon({
    className: 'custom-drive-start-pin',
    html: `
      <div style="background: #10b981; border: 2.5px solid #ffffff; color: #ffffff; border-radius: 9999px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        ▶
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Finish Point Icon (Checkered Flag)
const createFinishIcon = () => {
  return L.divIcon({
    className: 'custom-drive-finish-pin',
    html: `
      <div style="background: #0f172a; border: 2.5px solid #ffffff; color: #ffffff; border-radius: 9999px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 900; box-shadow: 0 4px 10px rgba(0,0,0,0.5);">
        🏁
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13]
  });
};

// Current Vehicle Beacon (Live Driving)
const createVehicleBeaconIcon = () => {
  return L.divIcon({
    className: 'custom-vehicle-beacon',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 34px; height: 34px; border-radius: 50%; background: rgba(56, 189, 248, 0.4); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></span>
        <span style="position: relative; width: 18px; height: 18px; border-radius: 50%; background: #0284c7; border: 3px solid #ffffff; box-shadow: 0 4px 10px rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center;">
          <span style="width: 4px; height: 4px; border-radius: 50%; background: #ffffff;"></span>
        </span>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17]
  });
};

// Shock Incident Marker on Route Path
const createIncidentMarkerIcon = (number: number, peakG: number, severity: string) => {
  const color = 
    severity === 'critical' ? '#f43f5e' : 
    severity === 'severe' ? '#ef4444' : 
    severity === 'moderate' ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: `custom-incident-pin-${number}`,
    html: `
      <div style="position: relative; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center;">
        <span style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${color}33;"></span>
        <div style="position: relative; width: 24px; height: 24px; border-radius: 50%; background: ${color}; border: 2px solid #ffffff; color: #ffffff; font-weight: 900; font-size: 11px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 8px rgba(0,0,0,0.5); font-family: monospace;">
          ${number}
        </div>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

export const DriveRouteMap: React.FC<DriveRouteMapProps> = ({
  path,
  incidents,
  isLive = false,
  onSelectIncident,
  heightClass = 'h-64 sm:h-80'
}) => {
  // Default to Lawrenceville / GGC if path is empty
  const defaultCenter: [number, number] = path.length > 0 
    ? [path[path.length - 1].lat, path[path.length - 1].lng]
    : [33.9798, -84.0017];

  const polylineCoords: [number, number][] = path.map(p => [p.lat, p.lng]);

  return (
    <div className={`relative w-full rounded-2xl overflow-hidden border border-slate-700/80 shadow-xl bg-slate-950 ${heightClass}`}>
      <MapContainer
        center={defaultCenter}
        zoom={16}
        scrollWheelZoom={true}
        dragging={true}
        touchZoom={true}
        className="h-full w-full z-0"
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RouteMapController path={path} isLive={isLive} />

        {/* Driving Route Polyline */}
        {polylineCoords.length >= 2 && (
          <>
            {/* Outer glow line */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#0d9488',
                weight: 6,
                opacity: 0.45,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
            {/* Inner vibrant route line */}
            <Polyline
              positions={polylineCoords}
              pathOptions={{
                color: '#14b8a6',
                weight: 3.5,
                opacity: 0.95,
                lineCap: 'round',
                lineJoin: 'round'
              }}
            />
          </>
        )}

        {/* Start Point Marker */}
        {path.length > 0 && (
          <Marker
            position={[path[0].lat, path[0].lng]}
            icon={createStartIcon()}
          >
            <Popup className="text-xs">
              <strong>Drive Activation Point</strong>
              <div className="text-[10px] text-slate-500 font-mono">
                {path[0].lat.toFixed(5)}, {path[0].lng.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Vehicle Beacon (While Driving) */}
        {isLive && path.length > 0 && (
          <Marker
            position={[path[path.length - 1].lat, path[path.length - 1].lng]}
            icon={createVehicleBeaconIcon()}
          />
        )}

        {/* Finish Point Marker (When Completed) */}
        {!isLive && path.length > 1 && (
          <Marker
            position={[path[path.length - 1].lat, path[path.length - 1].lng]}
            icon={createFinishIcon()}
          >
            <Popup className="text-xs">
              <strong>Drive Termination Point</strong>
              <div className="text-[10px] text-slate-500 font-mono">
                {path[path.length - 1].lat.toFixed(5)}, {path[path.length - 1].lng.toFixed(5)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Pothole Shock Incident Markers */}
        {incidents.map((incident, idx) => (
          <Marker
            key={incident.id}
            position={[incident.latitude, incident.longitude]}
            icon={createIncidentMarkerIcon(idx + 1, incident.peakG, incident.severity)}
            eventHandlers={{
              click: () => {
                if (onSelectIncident) {
                  onSelectIncident(incident);
                }
              }
            }}
          >
            <Popup className="text-xs">
              <div className="space-y-1 font-sans">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <span>Incident #{idx + 1}</span>
                  <span className="uppercase text-[10px] px-1 rounded bg-rose-100 text-rose-700">
                    {incident.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-700 font-semibold">
                  {incident.roadName || incident.address}
                </div>
                <div className="text-[10px] font-mono text-slate-500">
                  Shock: <strong className="text-rose-600 font-bold">{incident.peakG}G</strong> &bull; GPS: {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-2 left-2 z-[1000] bg-slate-900/90 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-700/80 flex items-center gap-2.5 text-[10px] text-slate-300 font-mono shadow">
        <span className="flex items-center gap-1">
          <span className="w-2.5 h-1 bg-teal-400 rounded-full inline-block"></span>
          <span>Drive Route</span>
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
          <span>{incidents.length} Shocks</span>
        </span>
      </div>
    </div>
  );
};
