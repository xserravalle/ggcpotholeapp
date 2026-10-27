import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { PotholeReport, SeverityLevel, HazardType } from '../../types/pothole';
import { classifyJurisdiction } from '../../services/jurisdictionClassifier';
import { reverseGeocode } from '../../services/reverseGeocoding';
import { generateMapSnapshot } from '../../services/mapSnapshotService';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  X, 
  MapPin, 
  Activity, 
  CheckCircle2, 
  Mail,
  AlertTriangle,
  RefreshCw,
  Camera,
  Building2,
  GraduationCap
} from 'lucide-react';

interface PotholeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (newReport: Omit<PotholeReport, 'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt' | 'priority' | 'priorityScore' | 'timeline'>) => void;
  initialTelemetry?: {
    sensorDetected: boolean;
    bumpIntensity: number;
    severity?: SeverityLevel;
  };
  initialCoords?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

// Controller to keep mini map centered when GPS coordinates change
const ReportMapUpdater: React.FC<{ center: [number, number] }> = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 16, { animate: true });
    }, 150);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
};

// Allow clicking on map to fine-tune the exact shock / hazard pin
const MapClickToReposition: React.FC<{ onPositionChange: (lat: number, lng: number) => void }> = ({ onPositionChange }) => {
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    }
  });
  return null;
};

// Pulsing Shock Pin Marker for Report Modal
const createReportMarkerIcon = (severity: SeverityLevel) => {
  const color = 
    severity === 'critical' ? '#f43f5e' : 
    severity === 'severe' ? '#ef4444' : 
    severity === 'moderate' ? '#f59e0b' : '#10b981';

  return L.divIcon({
    className: 'custom-report-pin',
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

export const PotholeReportModal: React.FC<PotholeReportModalProps> = (props) =>
  props.isOpen ? <PotholeReportDialogBody {...props} /> : null;

const PotholeReportDialogBody: React.FC<PotholeReportModalProps> = ({
  onClose,
  onSubmitReport,
  initialTelemetry,
  initialCoords
}) => {
  const [title, setTitle] = useState('');
  const [address, setAddress] = useState(initialCoords?.address || 'Locating nearest street address...');
  const [roadName, setRoadName] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Lawrenceville');
  const [latitude, setLatitude] = useState(initialCoords?.lat || 33.9798);
  const [longitude, setLongitude] = useState(initialCoords?.lng || -84.0017);
  const [severity, setSeverity] = useState<SeverityLevel>(initialTelemetry?.severity || (initialTelemetry?.sensorDetected ? 'critical' : 'moderate'));
  const [hazardType, setHazardType] = useState<HazardType>('POTHOLE');
  const [estimatedDepthInches] = useState(3.5);
  const [estimatedWidthInches] = useState(18);
  const [surfaceType] = useState<'Asphalt' | 'Concrete' | 'Composite'>('Asphalt');
  const [damageRisk, setDamageRisk] = useState<PotholeReport['damageRisk']>('Tire / Rim Damage');
  const [description, setDescription] = useState(
    initialTelemetry?.sensorDetected
      ? `[Auto-Sensor Triggered] Hardware shock spike of ${initialTelemetry.bumpIntensity}G captured while driving.`
      : ''
  );
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic jurisdiction classification
  const classification = classifyJurisdiction(latitude, longitude, `${roadName} ${address}`);
  const assignedAuth = classification.authority;

  // Auto-populate nearest closest address on open
  useEffect(() => {
    if (initialCoords?.lat && initialCoords?.lng) {
      setIsResolvingAddress(true);
      reverseGeocode(initialCoords.lat, initialCoords.lng).then(geo => {
        setAddress(geo.address);
        setRoadName(geo.road);
        setCity(geo.city);
        setIsResolvingAddress(false);
      });
    } else if ('geolocation' in navigator) {
      setIsResolvingAddress(true);
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          const geo = await reverseGeocode(lat, lng);
          if (geo && geo.address) {
            setAddress(geo.address);
            setRoadName(geo.road);
            setCity(geo.city);
          }
          setIsResolvingAddress(false);
        },
        async () => {
          const geo = await reverseGeocode(latitude, longitude);
          setAddress(geo.address);
          setRoadName(geo.road);
          setCity(geo.city);
          setIsResolvingAddress(false);
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 }
      );
    } else {
      reverseGeocode(latitude, longitude).then(geo => {
        setAddress(geo.address);
        setRoadName(geo.road);
        setCity(geo.city);
      });
    }
  }, []);

  // Handle Photo Capture / Upload
  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedDataUrl = await compressImageFile(file);
        setPhotoPreview(compressedDataUrl);
      } catch (err) {
        console.error('Failed to compress image:', err);
      }
    }
  };

  // Manual trigger to re-pinpoint via GPS if desired
  const handleRefreshLocation = () => {
    if ('geolocation' in navigator) {
      setIsResolvingAddress(true);
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          const geo = await reverseGeocode(lat, lng);
          if (geo && geo.address) {
            setAddress(geo.address);
            setRoadName(geo.road);
            setCity(geo.city);
          }
          setIsResolvingAddress(false);
        },
        () => {
          setIsResolvingAddress(false);
          alert('Could not update GPS location. Please check browser location permissions.');
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 10000 }
      );
    }
  };

  // Re-position when user clicks on the mini map
  const handleMapPinMove = async (newLat: number, newLng: number) => {
    setLatitude(newLat);
    setLongitude(newLng);
    setIsResolvingAddress(true);
    const geo = await reverseGeocode(newLat, newLng);
    if (geo && geo.address) {
      setAddress(geo.address);
      setRoadName(geo.road);
      setCity(geo.city);
    }
    setIsResolvingAddress(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    let finalImageUrl = photoPreview || undefined;
    if (!finalImageUrl) {
      try {
        finalImageUrl = await generateMapSnapshot(latitude, longitude, {
          severity,
          roadName: roadName || address.split(',')[0],
          landmark
        });
      } catch (err) {
        console.warn('Failed to capture map snapshot:', err);
      }
    }

    const finalTitle = title.trim() || `Road Hazard on ${roadName || address.split(',')[0] || 'Corridor'}`;

    onSubmitReport({
      title: finalTitle,
      address: address || 'Lawrenceville, GA',
      roadName: roadName || 'Local Roadway',
      city: city || 'Lawrenceville',
      jurisdiction: assignedAuth.name,
      authorityId: assignedAuth.id,
      authorityName: assignedAuth.name,
      authorityEmail: assignedAuth.contactEmail,
      latitude,
      longitude,
      severity,
      hazardType,
      status: 'reported',
      estimatedDepthInches,
      estimatedWidthInches,
      surfaceType,
      damageRisk,
      detectedBy: initialTelemetry?.sensorDetected ? 'Vehicle Accelerometer Telemetry' : 'User Mobile Report',
      sensorDetected: initialTelemetry?.sensorDetected || false,
      bumpIntensity: initialTelemetry?.bumpIntensity || 0,
      description: description || `Reported ${severity} hazard on ${address}.`,
      landmark,
      reporterName: reporterName || 'Anonymous Reporter',
      reporterEmail,
      imageUrl: finalImageUrl,
      source: initialTelemetry?.sensorDetected ? 'sensor' : 'user'
    });

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-start sm:items-center justify-center p-3 pt-14 sm:pt-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-5 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 text-xs max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-md">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white">Report Road Hazard</h2>
                {initialTelemetry?.sensorDetected && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950 text-rose-300 border border-rose-800 flex items-center gap-1 animate-pulse">
                    <Activity className="w-2.5 h-2.5" />
                    <span>{initialTelemetry.bumpIntensity}G Shock</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                Official Incident Intake • Dispatched directly to municipal routing
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form onSubmit={handleSubmit} className="space-y-3 overflow-y-auto pr-1">
          
          {/* Map Location Centralized around Detected Shock / GPS */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px] text-slate-300 font-semibold mb-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-teal-400" />
                <span>Shock Location Center</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">
                Tap map to adjust pin
              </span>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-700/80 shadow-md bg-slate-950">
              <div className="h-36 sm:h-40 w-full">
                <MapContainer
                  center={[latitude, longitude]}
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
                  <ReportMapUpdater center={[latitude, longitude]} />
                  <MapClickToReposition onPositionChange={handleMapPinMove} />
                  <Marker
                    position={[latitude, longitude]}
                    icon={createReportMarkerIcon(severity)}
                  />
                </MapContainer>
              </div>

              {/* Coordinates Pill */}
              <div className="absolute top-2 left-2 z-[1000] bg-slate-900/90 backdrop-blur px-2 py-0.5 rounded border border-slate-700 text-[10px] font-mono text-slate-200 shadow">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1 animate-pulse"></span>
                <span>{latitude.toFixed(5)}, {longitude.toFixed(5)}</span>
              </div>
            </div>
          </div>

          {/* Photo Evidence (Mobile Camera Shutter / Upload) */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1">
              Photo Evidence (Camera / Upload or Map Snapshot)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-2.5 bg-slate-950/60 transition text-center relative group">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="camera-photo-input"
              />
              
              {!photoPreview ? (
                <label htmlFor="camera-photo-input" className="cursor-pointer py-2 block">
                  <Camera className="w-6 h-6 mx-auto text-slate-400 group-hover:text-emerald-400 transition" />
                  <span className="text-xs font-semibold text-slate-200 block mt-1">
                    Tap to Launch Camera or Upload Image (Optional)
                  </span>
                  <span className="text-[10px] text-slate-400">
                    If omitted, verified OpenStreetMap incident snapshot will be attached
                  </span>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Captured Pothole"
                    className="w-full h-28 object-cover rounded-lg border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-full text-xs shadow"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Street Address (Auto-Populated with Closest Specific Address) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-slate-300 font-semibold text-[11px] flex items-center gap-1">
                <span>Nearest Street Address</span>
              </label>
              <button
                type="button"
                onClick={handleRefreshLocation}
                disabled={isResolvingAddress}
                className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-bold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-2.5 h-2.5 ${isResolvingAddress ? 'animate-spin' : ''}`} />
                <span>{isResolvingAddress ? 'Resolving GPS...' : 'Refresh Address'}</span>
              </button>
            </div>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. 1000 University Center Ln, Lawrenceville, GA 30043"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs font-medium"
            />
          </div>

          {/* Hazard Title */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Hazard Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`Road Hazard on ${roadName || address.split(',')[0] || 'Corridor'}`}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs"
            />
          </div>

          {/* Severity & Damage Risk */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Severity</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="low">Low - Minor Surface Dip</option>
                <option value="moderate">Moderate - Noticeable Bump</option>
                <option value="severe">Severe - Heavy Jar / Rim Impact</option>
                <option value="critical">Critical - Immediate Hazard</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1 text-[11px]">Damage Risk</label>
              <select
                value={damageRisk}
                onChange={(e) => setDamageRisk(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="Tire / Rim Damage">Tire / Rim Damage</option>
                <option value="Suspension / Alignment">Suspension Risk</option>
                <option value="Loss of Control Hazard">Axle / Control Hazard</option>
                <option value="Cosmetic">Cosmetic Damage</option>
              </select>
            </div>
          </div>

          {/* Landmark / Specific Location */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Landmark / Specific Location
            </label>
            <input
              type="text"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
              placeholder="e.g. Near GGC Student Center / Right Lane / Turn In"
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none text-xs"
            />
          </div>

          {/* Dynamic Automated Dispatch Authority Badge Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              {assignedAuth.id === 'GGC' ? <GraduationCap className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-300 tracking-wider">
                  Automated Dispatch Routing
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {assignedAuth.slaTurnaround} Turnaround
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5 truncate">
                {assignedAuth.name}
              </div>
              <div className="text-[11px] text-slate-300 mt-0.5">
                {classification.matchReason}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-200 font-mono">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-emerald-400" /> {assignedAuth.contactEmail}
                </span>
                <span>☎ {assignedAuth.potholeHotline}</span>
              </div>
            </div>
          </div>

          {/* Notes & Driver Details */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-[11px]">
              Notes & Driver Details
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Right lane dip, approx 4 inches deep, water pooling..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none text-xs"
            />
          </div>

          {/* Optional Reporter Name */}
          <div className="grid grid-cols-2 gap-2 pt-0.5">
            <div>
              <label className="block text-slate-400 text-[10px] mb-0.5">Your Name (Optional)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Student / Driver Name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px]"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] mb-0.5">Your Email (Optional)</label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="For status updates"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-white text-[11px]"
              />
            </div>
          </div>

          {/* Fixed Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-2.5 border-t border-slate-800 shrink-0 mt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-md shadow-emerald-600/25 transition active:scale-95 flex items-center gap-1.5 disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting Road Report...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Submit Road Report</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
