import React, { useState, useEffect } from 'react';
import { PotholeReport, SeverityLevel, HazardType } from '../../types/pothole';
import { classifyJurisdiction } from '../../services/jurisdictionClassifier';
import { reverseGeocode } from '../../services/reverseGeocoding';
import { compressImageFile } from '../../utils/imageCompressor';
import { 
  Camera, 
  X, 
  Building2, 
  MapPin, 
  Crosshair, 
  Upload, 
  Sparkles, 
  Activity, 
  CheckCircle2, 
  Clock, 
  Mail,
  GraduationCap
} from 'lucide-react';

interface PotholeReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitReport: (newReport: Omit<PotholeReport, 'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt'>) => void;
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

const PRESETS = [
  { label: '🎓 GGC Campus Entrance (Collins Hill Rd)', lat: 33.9821, lng: -84.0048, road: 'Collins Hill Rd', city: 'Lawrenceville' },
  { label: '🏛️ Historic Lawrenceville Square', lat: 33.9565, lng: -83.9892, road: 'W Crogan St', city: 'Lawrenceville' },
  { label: '🛍️ Duluth (Pleasant Hill @ I-85)', lat: 33.9592, lng: -84.1338, road: 'Pleasant Hill Rd', city: 'Duluth' },
  { label: '💡 Peachtree Corners (Curiosity Lab)', lat: 33.9715, lng: -84.2238, road: 'Technology Pkwy', city: 'Peachtree Corners' },
  { label: '⚡ GA-316 Express @ Sugarloaf', lat: 33.9712, lng: -84.0320, road: 'SR 316 (University Pkwy)', city: 'Lawrenceville' }
];

// Hooks must run in the same order on every render, so the open check lives in this
// wrapper. The dialog mounts fresh each time it opens, exactly as before.
export const PotholeReportModal: React.FC<PotholeReportModalProps> = (props) =>
  props.isOpen ? <PotholeReportDialogBody {...props} /> : null;

const PotholeReportDialogBody: React.FC<PotholeReportModalProps> = ({
  onClose,
  onSubmitReport,
  initialTelemetry,
  initialCoords
}) => {

  const [title, setTitle] = useState('');
  const [address, setAddress] = useState(initialCoords?.address || '1000 University Center Ln, Lawrenceville, GA 30043');
  const [roadName, setRoadName] = useState('University Center Ln');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Lawrenceville');
  const [latitude, setLatitude] = useState(initialCoords?.lat || 33.9798);
  const [longitude, setLongitude] = useState(initialCoords?.lng || -84.0017);
  const [severity, setSeverity] = useState<SeverityLevel>(initialTelemetry?.severity || (initialTelemetry?.sensorDetected ? 'critical' : 'moderate'));
  const [hazardType, setHazardType] = useState<HazardType>('POTHOLE');
  const [estimatedDepthInches, setEstimatedDepthInches] = useState(3.5);
  const [estimatedWidthInches, setEstimatedWidthInches] = useState(18);
  const [surfaceType, setSurfaceType] = useState<'Asphalt' | 'Concrete' | 'Composite'>('Asphalt');
  const [damageRisk, setDamageRisk] = useState<PotholeReport['damageRisk']>('Tire / Rim Damage');
  const [description, setDescription] = useState(
    initialTelemetry?.sensorDetected
      ? `[Auto-Sensor Triggered] Vertical impact spike of ${initialTelemetry.bumpIntensity}G captured while driving.`
      : ''
  );
  const [reporterName, setReporterName] = useState('');
  const [reporterEmail, setReporterEmail] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // Dynamic automated classification
  const classification = classifyJurisdiction(latitude, longitude, `${roadName} ${address}`);
  const assignedAuth = classification.authority;

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

  // GPS Device Locator
  const handleGpsPinpoint = () => {
    if ('geolocation' in navigator) {
      setIsResolvingAddress(true);
      navigator.geolocation.getCurrentPosition(
        async pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setLatitude(lat);
          setLongitude(lng);
          const geo = await reverseGeocode(lat, lng);
          setAddress(geo.address);
          setRoadName(geo.road);
          setCity(geo.city);
          setIsResolvingAddress(false);
        },
        err => {
          setIsResolvingAddress(false);
          alert('GPS location permission denied or timed out.');
        },
        { enableHighAccuracy: true }
      );
    }
  };

  // Handle Preset Selection
  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setLatitude(p.lat);
    setLongitude(p.lng);
    setRoadName(p.road);
    setCity(p.city);
    setAddress(`${p.road}, ${p.city}, GA`);
    setTitle(`Pavement Void on ${p.road}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || `Road Hazard on ${roadName || 'Corridor'}`;

    onSubmitReport({
      title: finalTitle,
      address: address || `${roadName}, ${city}, GA`,
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
      description: description || `Reported ${severity} hazard on ${roadName}. Requires inspection by ${assignedAuth.name}.`,
      landmark,
      reporterName: reporterName || 'Anonymous Reporter',
      reporterEmail,
      imageUrl: photoPreview || 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=600&q=80',
      source: initialTelemetry?.sensorDetected ? 'sensor' : 'user'
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl relative my-6 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Report Road Hazard / Pothole</h2>
                {initialTelemetry?.sensorDetected && (
                  <span className="bg-rose-950 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-800 flex items-center gap-1">
                    <Activity className="w-3 h-3" /> Auto-Shock Captured ({initialTelemetry.bumpIntensity}G)
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Geotagged hazard docket routed directly to GGC Facilities, GCDOT, or City Maintenance
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets for fast testing */}
        <div className="mb-4 bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between mb-1.5 text-slate-300 font-medium">
            <span className="flex items-center gap-1 text-teal-400 text-[11px]">
              <Sparkles className="w-3.5 h-3.5" /> Gwinnett & GGC Quick Locations:
            </span>
            <button
              type="button"
              onClick={handleGpsPinpoint}
              className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-bold transition"
            >
              <Crosshair className="w-3 h-3" /> Pinpoint via Phone GPS
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className="bg-slate-700/70 hover:bg-emerald-600 hover:text-white text-[11px] text-slate-200 px-2 py-1 rounded transition"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* Photo Evidence (Mobile Camera Shutter) */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1">
              Photo Evidence (Camera Shutter / Upload)
            </label>
            <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl p-3 bg-slate-950/60 transition text-center relative group">
              <input
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoChange}
                className="hidden"
                id="camera-photo-input"
              />
              
              {!photoPreview ? (
                <label htmlFor="camera-photo-input" className="cursor-pointer py-3 block">
                  <Camera className="w-8 h-8 mx-auto text-slate-400 group-hover:text-emerald-400 transition" />
                  <span className="text-xs font-semibold text-slate-200 block mt-1">
                    Tap to Launch Camera or Upload Image
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Works directly on iOS Safari and Android Chrome (no app store required)
                  </span>
                </label>
              ) : (
                <div className="relative">
                  <img
                    src={photoPreview}
                    alt="Captured Pothole"
                    className="w-full h-32 object-cover rounded-lg border border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => setPhotoPreview(null)}
                    className="absolute top-2 right-2 p-1 bg-rose-600 hover:bg-rose-500 text-white rounded-full shadow"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Dynamic Automated Dispatch Authority Badge Card */}
          <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-3 flex items-start space-x-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
              {assignedAuth.id === 'GGC' ? <GraduationCap className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Automated Dispatch Routing
                </span>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  {assignedAuth.slaTurnaround} Turnaround
                </span>
              </div>
              <div className="text-sm font-bold text-white mt-0.5 truncate">
                {assignedAuth.name}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {classification.matchReason}
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-300 font-mono">
                <span className="flex items-center gap-1">
                  <Mail className="w-3 h-3 text-teal-400" /> {assignedAuth.contactEmail}
                </span>
                <span>☎ {assignedAuth.potholeHotline}</span>
              </div>
            </div>
          </div>

          {/* Severity & Hazard Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Severity Rating</label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['minor', 'moderate', 'severe', 'critical'] as SeverityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setSeverity(lvl)}
                    className={`py-1.5 rounded-lg font-bold text-[11px] capitalize transition border ${
                      severity === lvl
                        ? lvl === 'critical'
                          ? 'bg-rose-700 text-white border-rose-500 shadow'
                          : lvl === 'severe'
                          ? 'bg-red-600 text-white border-red-500 shadow'
                          : lvl === 'moderate'
                          ? 'bg-amber-600 text-white border-amber-500 shadow'
                          : 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Hazard Category</label>
              <select
                value={hazardType}
                onChange={(e) => setHazardType(e.target.value as HazardType)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-white font-medium focus:ring-1 focus:ring-teal-500 outline-none"
              >
                <option value="POTHOLE">Pothole / Pavement Crater</option>
                <option value="ROAD_CRACK">Alligator Fatigue Cracking</option>
                <option value="MANHOLE_COLLAPSE">Sunken Drain / Manhole</option>
                <option value="SINKHOLE_RISK">Sinkhole Warning Void</option>
              </select>
            </div>
          </div>

          {/* Street Address & Corridor */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-semibold">Street / Road Address</label>
                {isResolvingAddress && <span className="text-[10px] text-teal-400">Resolving GPS...</span>}
              </div>
              <input
                type="text"
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="1000 University Center Ln, Lawrenceville, GA"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Landmark / Specific Location</label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="Near GGC Student Center / Entrance / Lane 2"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none"
              />
            </div>
          </div>

          {/* Coordinates & Damage Risk */}
          <div className="grid grid-cols-3 gap-2 font-mono">
            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-sans">Latitude</label>
              <input
                type="number"
                step="0.0001"
                value={latitude}
                onChange={(e) => setLatitude(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-sans">Longitude</label>
              <input
                type="number"
                step="0.0001"
                value={longitude}
                onChange={(e) => setLongitude(parseFloat(e.target.value))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[10px] mb-1 font-sans">Damage Risk</label>
              <select
                value={damageRisk}
                onChange={(e) => setDamageRisk(e.target.value as any)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs font-sans"
              >
                <option value="Tire / Rim Damage">Tire/Rim Damage</option>
                <option value="Suspension / Alignment">Suspension Risk</option>
                <option value="Loss of Control Hazard">Axle/Control Risk</option>
                <option value="Cosmetic">Cosmetic</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1">Notes & Driver Hazard Details</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Approx width/depth, right/left lane, rainwater pooling, cars bottoming out..."
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:ring-1 focus:ring-teal-500 outline-none resize-none"
            />
          </div>

          {/* Optional Reporter Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-slate-400 text-[11px] mb-0.5">Your Name (Optional)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="Citizen or Student Name"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-white text-xs"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-[11px] mb-0.5">Your Email for Updates</label>
              <input
                type="email"
                value={reporterEmail}
                onChange={(e) => setReporterEmail(e.target.value)}
                placeholder="student@ggc.edu or citizen@email.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-white text-xs"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-bold shadow-lg shadow-emerald-600/25 transition active:scale-95 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Submit & Route Incident</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
