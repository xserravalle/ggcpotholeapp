import React, { useState, useEffect, useRef } from 'react';
import { canRecordImpact } from '../../services/impactCooldown';
import { 
  Activity, 
  Zap, 
  Play, 
  Pause, 
  MapPin, 
  Sparkles,
  RotateCcw,
  Target,
  Cpu,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { TrackedHazardSpot } from '../../types/sensorQueue';
import { milesBetween } from '../../services/distanceCalculator';
import { loadTrackedSpots, saveTrackedSpots } from '../../services/storageService';

interface DriveSensorViewProps {
  onPromoteSpotToReport?: (spot: TrackedHazardSpot) => void;
  onNavigateToMyReports?: () => void;
}

// Clustering radius: ~115 feet (0.022 miles)
const CLUSTER_DISTANCE_MILES = 0.022;

export const DriveSensorView: React.FC<DriveSensorViewProps> = ({ 
  onPromoteSpotToReport,
  onNavigateToMyReports
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveG, setLiveG] = useState(1.00);
  const [peakG, setPeakG] = useState(1.00);
  const [recentSpike, setRecentSpike] = useState<number | null>(null);
  const [simulatedSpike, setSimulatedSpike] = useState(1.0);

  // Hardware Diagnostics State (for Samsung Galaxy & Mobile Browsers)
  const [eventCount, setEventCount] = useState(0);
  const [rawAcc, setRawAcc] = useState({ x: 0, y: 0, z: 9.81 });
  const [sensorSource, setSensorSource] = useState<string>('Detecting...');

  // Tracked spots with 3x hit threshold
  const [trackedSpots, setTrackedSpots] = useState<TrackedHazardSpot[]>(() => loadTrackedSpots());
  const [quietStatusMessage, setQuietStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakResetTimer = useRef<number | null>(null);
  const statusTimer = useRef<number | null>(null);

  // Refs to eliminate React closure staleness
  const liveGRef = useRef(1.00);
  const peakGRef = useRef(1.00);
  const gpsRequestPending = useRef(false);
  const lastAcceptedImpactAt = useRef<number | null>(null);

  // Auto-save tracked spots
  useEffect(() => {
    saveTrackedSpots(trackedSpots);
  }, [trackedSpots]);

  // Record an impact silently: check clustering for 3x hits
  const silentlyRecordImpact = (gVal: number, latOverride?: number, lngOverride?: number, roadOverride?: string) => {
    const roundedG = parseFloat(gVal.toFixed(2));
    setRecentSpike(roundedG);

    // Real impacts require real GPS coordinates.
    if (latOverride == null || lngOverride == null) return;

    const lat = latOverride;
    const lng = lngOverride;
    const road = roadOverride || 'GPS-detected road (name unverified)';
    const city = roadOverride ? 'Lawrenceville' : 'Unknown (GPS coordinates only)';
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let spotToPromote: TrackedHazardSpot | null = null;
    let statusMsg: string | null = null;

    setTrackedSpots(prevSpots => {
      // Find matching spot within cluster radius
      const existingIndex = prevSpots.findIndex(s => 
        milesBetween({ lat: s.latitude, lng: s.longitude }, { lat, lng }) <= CLUSTER_DISTANCE_MILES
      );

      let updatedList = [...prevSpots];

      if (existingIndex >= 0) {
        const spot = updatedList[existingIndex];
        const newHitCount = spot.hitCount + 1;
        const newMaxG = Math.max(spot.maxGForce, roundedG);

        const updatedSpot: TrackedHazardSpot = {
          ...spot,
          hitCount: newHitCount,
          maxGForce: newMaxG,
          severity: newMaxG >= 6.0 ? 'critical' : 'moderate',
          lastHitAt: timeStr,
          hits: [
            ...spot.hits,
            { id: `HIT-${crypto.randomUUID()}`, timestamp: timeStr, gForce: roundedG }
          ]
        };

        // Check 3x threshold
        if (newHitCount >= 3 && !updatedSpot.promotedToReportId) {
          updatedSpot.promotedToReportId = `GW-POT-${crypto.randomUUID()}`;
          spotToPromote = updatedSpot;
          statusMsg = `🎯 Spot hit 3x: Auto-promoted to My Reports! (${updatedSpot.roadName})`;
        } else {
          statusMsg = `📍 Road spot registered ${newHitCount}/3 hits (${updatedSpot.roadName})`;
        }

        updatedList[existingIndex] = updatedSpot;
      } else {
        // First time hitting this spot (1/3)
        const newSpot: TrackedHazardSpot = {
          id: `SPOT-${crypto.randomUUID()}`,
          latitude: lat,
          longitude: lng,
          roadName: road,
          city,
          hitCount: 1,
          maxGForce: roundedG,
          severity: roundedG >= 6.0 ? 'critical' : 'moderate',
          createdAt: timeStr,
          lastHitAt: timeStr,
          hits: [
            { id: `HIT-${crypto.randomUUID()}`, timestamp: timeStr, gForce: roundedG }
          ]
        };
        updatedList = [newSpot, ...updatedList];
        statusMsg = `📍 New road spot detected (1/3 hits). Needs 3 strikes to generate report.`;
      }

      return updatedList;
    });

    if (spotToPromote && onPromoteSpotToReport) {
      onPromoteSpotToReport(spotToPromote);
    }
    if (statusMsg) {
      setQuietStatusMessage(statusMsg);
      if (statusTimer.current) clearTimeout(statusTimer.current);
      statusTimer.current = window.setTimeout(() => setQuietStatusMessage(null), 5000);
    }

    setTimeout(() => {
      setRecentSpike(null);
    }, 2500);
  };

  // Robust Hardware Motion Listener with zero stale closures
  useEffect(() => {
    if (!isMonitoring) {
      return;
    }

    let isListenerActive = true;

    const onDeviceMotion = (e: DeviceMotionEvent) => {
      if (!isListenerActive) return;

      // Check both accelerationIncludingGravity (standard G-force) and acceleration (linear)
      const acc = (e.accelerationIncludingGravity && e.accelerationIncludingGravity.x !== null)
        ? e.accelerationIncludingGravity
        : e.acceleration;

      if (!acc || acc.x === null) return;

      setEventCount(prev => prev + 1);
      setSensorSource('Hardware Accelerometer (Active)');

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      setRawAcc({
        x: parseFloat(x.toFixed(2)),
        y: parseFloat(y.toFixed(2)),
        z: parseFloat(z.toFixed(2))
      });

      // Calculate total G-Force magnitude (1.00G = Earth gravity baseline)
      const rawMag = Math.sqrt(x * x + y * y + z * z) / 9.80665;
      const magnitude = parseFloat(rawMag.toFixed(2));

      liveGRef.current = magnitude;
      setLiveG(magnitude);

      if (magnitude > peakGRef.current) {
        peakGRef.current = magnitude;
        setPeakG(magnitude);
        if (peakResetTimer.current) clearTimeout(peakResetTimer.current);
        peakResetTimer.current = window.setTimeout(() => {
          peakGRef.current = 1.0;
          setPeakG(1.0);
        }, 2500);
      }

      // Check impact threshold (>= 3.0 G shock)
      if (
        magnitude >= 3.0 &&
        !gpsRequestPending.current &&
        canRecordImpact(lastAcceptedImpactAt.current, Date.now()) &&
        'geolocation' in navigator
      ) {
        gpsRequestPending.current = true;

        navigator.geolocation.getCurrentPosition(
          pos => {
            gpsRequestPending.current = false;
            const now = Date.now();
            if (!canRecordImpact(lastAcceptedImpactAt.current, now)) return;

            lastAcceptedImpactAt.current = now;
            silentlyRecordImpact(
              magnitude,
              pos.coords.latitude,
              pos.coords.longitude
            );
          },
          () => {
            gpsRequestPending.current = false;
          },
          { enableHighAccuracy: true, timeout: 3000 }
        );
      }
    };

    // Attach to window directly
    window.addEventListener('devicemotion', onDeviceMotion, true);

    // Also support Generic Sensor API as modern Android fallback if available
    let genericSensor: any = null;
    if (typeof (window as any).Accelerometer === 'function') {
      try {
        genericSensor = new (window as any).Accelerometer({ frequency: 60 });
        genericSensor.addEventListener('reading', () => {
          if (!isListenerActive) return;
          const x = genericSensor.x || 0;
          const y = genericSensor.y || 0;
          const z = genericSensor.z || 0;
          setEventCount(prev => prev + 1);
          setSensorSource('Generic Sensor API (Active)');
          setRawAcc({
            x: parseFloat(x.toFixed(2)),
            y: parseFloat(y.toFixed(2)),
            z: parseFloat(z.toFixed(2))
          });
          const mag = Math.sqrt(x * x + y * y + z * z) / 9.80665;
          liveGRef.current = mag;
          setLiveG(mag);
        });
        genericSensor.start();
      } catch (err) {
        // Fall back entirely to devicemotion
      }
    }

    return () => {
      isListenerActive = false;
      window.removeEventListener('devicemotion', onDeviceMotion, true);
      if (genericSensor) {
        try { genericSensor.stop(); } catch (e) { /* ignore */ }
      }
    };
  }, [isMonitoring]);

  // Toggle monitoring on/off
  const toggleMonitoring = async () => {
    if (isMonitoring) {
      setIsMonitoring(false);
      return;
    }

    // Reset event counter on starting
    setEventCount(0);
    setSensorSource('Initializing sensor stream...');

    // Request iOS permission if on iOS (safe no-op on Android Galaxy)
    const deviceMotion = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof deviceMotion?.requestPermission === 'function') {
      try {
        const res = await deviceMotion.requestPermission();
        if (res === 'granted') {
          setIsMonitoring(true);
        } else {
          alert('Motion sensor permission was denied in your browser settings.');
        }
      } catch (err) {
        setIsMonitoring(true);
      }
    } else {
      // Direct activation on Android / Samsung Galaxy
      setIsMonitoring(true);
    }
  };

  // Fixed coordinates for Capstone Presentation simulator
  const fixedDemoLocation = {
    lat: 33.9821,
    lng: -84.0048,
    road: 'Collins Hill Rd @ GGC Campus Entrance'
  };

  const handleSimulateDemoHit = () => {
    const spike = parseFloat((6.8 + Math.random() * 1.8).toFixed(2));
    setSimulatedSpike(spike);
    liveGRef.current = spike;
    setLiveG(spike);
    silentlyRecordImpact(spike, fixedDemoLocation.lat, fixedDemoLocation.lng, fixedDemoLocation.road);
  };

  const handleClearTrackedSpots = () => {
    setTrackedSpots([]);
    saveTrackedSpots([]);
  };

  // Live Canvas Waveform driven by REAL liveG sensor readings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const points: number[] = new Array(80).fill(1.0);

    const render = () => {
      let currentG = 1.0;

      if (isMonitoring) {
        // Feed the real sensor reading directly into the waveform!
        currentG = liveGRef.current;
      }

      if (simulatedSpike > 1.2) {
        currentG = simulatedSpike;
        setSimulatedSpike(prev => Math.max(1.0, prev * 0.85));
      }

      points.shift();
      points.push(currentG);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();

      // Threshold line at 3.0G
      const thresholdY = canvas.height - (3.0 / 4.5) * canvas.height;
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(canvas.width, thresholdY);
      ctx.strokeStyle = '#ef444466';
      ctx.stroke();

      // 1.0G Nominal Baseline
      const baseY = canvas.height - (1.0 / 4.5) * canvas.height;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(canvas.width, baseY);
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Live Waveform line
      ctx.beginPath();
      ctx.strokeStyle = isMonitoring ? (liveGRef.current >= 3.0 ? '#ef4444' : '#10b981') : '#64748b';
      ctx.lineWidth = 2.5;

      points.forEach((val, idx) => {
        const x = (idx / (points.length - 1)) * canvas.width;
        const y = canvas.height - (Math.min(val, 4.5) / 4.5) * canvas.height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Text labels
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('3.0G Impact Threshold', 10, thresholdY - 4);
      ctx.fillStyle = '#64748b';
      ctx.fillText('1.0G Gravity Baseline', 10, baseY - 4);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [isMonitoring]);

  useEffect(() => {
    return () => {
      if (peakResetTimer.current) clearTimeout(peakResetTimer.current);
      if (statusTimer.current) clearTimeout(statusTimer.current);
    };
  }, []);

  const displayG = recentSpike || Math.max(liveG, peakG);
  const isSpike = displayG >= 3.0;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Info */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <span>Silent In-Vehicle Drive Sensor</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Leverages your phone's built-in accelerometer to register roadway shocks. Spots hit 3 times are automatically clustered and verified.
        </p>
      </div>

      {/* Passive On-Screen Status Notification */}
      {quietStatusMessage && (
        <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-700/60 rounded-2xl p-3.5 shadow-lg flex items-center justify-between text-xs text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
            <span className="font-semibold">{quietStatusMessage}</span>
          </div>
          {onNavigateToMyReports && (
            <button
              onClick={onNavigateToMyReports}
              className="text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-500 px-3 py-1 rounded-lg transition"
            >
              View in My Reports
            </button>
          )}
        </div>
      )}

      {/* Main Sensor Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
        
        {/* Top Controls Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className={`w-3.5 h-3.5 rounded-full ${
              isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'
            }`} />
            <div>
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                {isMonitoring ? 'Sensor Active & Streaming' : 'Sensor Idle / Paused'}
              </span>
              <span className="text-[11px] text-slate-400">
                Zero audio • Zero vibrations • Automatic shock logging
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMonitoring}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-lg active:scale-95 ${
                isMonitoring
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20'
              }`}
            >
              {isMonitoring ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause Sensor</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Start Silent Drive Sensor</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live G-Meter & Telemetry Canvas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* Gauge Readout */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-center items-center text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Total G-Force Load
            </span>
            <div className={`text-4xl font-black font-mono mt-1 ${
              isSpike ? 'text-rose-400' : isMonitoring ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {displayG.toFixed(2)} <span className="text-sm font-sans font-bold text-slate-400">G</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Baseline: ~1.00G Gravity
            </span>
          </div>

          {/* Real-time Oscilloscope Waveform */}
          <div className="sm:col-span-2 bg-slate-950 rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">
                Live Physical Shock Waveform
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {isMonitoring ? `${eventCount} Ticks` : 'STANDBY'}
              </span>
            </div>
            <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-950">
              <canvas
                ref={canvasRef}
                width={400}
                height={96}
                className="w-full h-full block"
              />
            </div>
          </div>

        </div>

        {/* LIVE HARDWARE TELEMETRY READOUT (Direct proof of Samsung Hardware Sensors) */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-teal-400" />
              <span className="text-xs font-bold text-white">
                Samsung Galaxy Hardware Sensor Monitor
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`w-2 h-2 rounded-full ${
                isMonitoring && eventCount > 0 ? 'bg-emerald-400 animate-pulse' : isMonitoring ? 'bg-amber-400' : 'bg-slate-600'
              }`} />
              <span className="text-[11px] font-mono font-bold text-teal-300">
                {isMonitoring ? `${eventCount} Events Streamed` : 'Awaiting Start'}
              </span>
            </div>
          </div>

          {isMonitoring && (
            <div className="space-y-2 pt-1 animate-in fade-in duration-200">
              <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
                <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">X-Axis</span>
                  <span className="text-white font-bold">{rawAcc.x} m/s²</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Y-Axis</span>
                  <span className="text-white font-bold">{rawAcc.y} m/s²</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 p-2 rounded-xl text-center">
                  <span className="text-[9px] text-slate-500 uppercase block font-sans">Z-Axis</span>
                  <span className="text-white font-bold">{rawAcc.z} m/s²</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 pt-1">
                <span>Driver: <strong className="text-slate-300">{sensorSource}</strong></span>
                {eventCount > 0 ? (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3 h-3" /> Hardware Verified
                  </span>
                ) : (
                  <span className="text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Listening for physical jolt...
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Demo Simulation Controls for Capstone Presentation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Capstone Demo: 3x Hit Threshold Simulator</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Target: <strong className="text-teal-300">Collins Hill Rd @ GGC</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={handleSimulateDemoHit}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow active:scale-95"
            >
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              <span>Simulate Hit on Same Spot (Click 3x to Verify)</span>
            </button>

            {trackedSpots.length > 0 && (
              <button
                onClick={handleClearTrackedSpots}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 text-xs font-semibold transition flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Demo Hits</span>
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Currently Tracked Spots (3x Threshold Progress) */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-teal-400" />
            <h3 className="text-base font-bold text-white">
              Tracked Road Spots & Hit Count
            </h3>
          </div>
          <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
            {trackedSpots.length} Locations Monitored
          </span>
        </div>

        {trackedSpots.length === 0 ? (
          <div className="bg-slate-950/60 rounded-2xl p-6 text-center border border-slate-800/80 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">No road impacts registered yet</p>
            <p>When you strike road shocks while driving (or click the test button above), spots will cluster here until reaching 3 strikes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {trackedSpots.map((spot) => {
              const isPromoted = spot.hitCount >= 3;

              return (
                <div 
                  key={spot.id}
                  className={`bg-slate-950 border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition ${
                    isPromoted 
                      ? 'border-emerald-700/80 bg-emerald-950/10' 
                      : 'border-slate-800'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isPromoted 
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-700' 
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}>
                        {isPromoted ? '✓ 3x Confirmed Report' : `Strikes: ${spot.hitCount} of 3`}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Peak: {spot.maxGForce}G
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {spot.roadName}
                    </h4>

                    <p className="text-slate-400 text-[11px] flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{spot.latitude.toFixed(5)}, {spot.longitude.toFixed(5)} ({spot.city})</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="flex space-x-1">
                      {[1, 2, 3].map((step) => (
                        <div 
                          key={step} 
                          className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs ${
                            spot.hitCount >= step 
                              ? 'bg-teal-500 text-slate-950' 
                              : 'bg-slate-800 text-slate-500 border border-slate-700'
                          }`}
                        >
                          {spot.hitCount >= step ? '✓' : step}
                        </div>
                      ))}
                    </div>

                    {isPromoted && onNavigateToMyReports && (
                      <button
                        onClick={onNavigateToMyReports}
                        className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-bold rounded-xl text-xs transition"
                      >
                        View Report
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
