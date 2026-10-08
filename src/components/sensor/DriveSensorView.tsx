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
  Volume2,
  VolumeX,
  AlertTriangle,
  Radio
} from 'lucide-react';
import { PotholeReport } from '../../types/pothole';
import { TrackedHazardSpot } from '../../types/sensorQueue';
import { INITIAL_POTHOLES } from '../../data/potholesData';
import { 
  milesBetween, 
  isHazardAhead, 
  HAZARD_WARNING_DISTANCE_MILES 
} from '../../services/distanceCalculator';
import { loadTrackedSpots, saveTrackedSpots, loadStoredPotholes } from '../../services/storageService';
import { playHazardWarning, cancelHazardWarning } from '../../services/audioAlertService';

interface DriveSensorViewProps {
  potholes?: PotholeReport[];
  onPromoteSpotToReport?: (spot: TrackedHazardSpot) => void;
  onNavigateToMyReports?: () => void;
}

// Clustering radius: ~115 feet (0.022 miles)
const CLUSTER_DISTANCE_MILES = 0.022;

export interface ActiveHazardAlert {
  id: string;
  title: string;
  roadName: string;
  distanceFeet: number;
  phase: '200ft' | '100ft' | 'pass';
}

export const DriveSensorView: React.FC<DriveSensorViewProps> = ({ 
  potholes,
  onPromoteSpotToReport,
  onNavigateToMyReports
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveG, setLiveG] = useState(1.02);
  const [peakG, setPeakG] = useState(1.02);
  const [recentSpike, setRecentSpike] = useState<number | null>(null);
  const [simulatedSpike, setSimulatedSpike] = useState(1.0);

  // Audio Warning User Controls (Mute toggle, persists in localStorage)
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('ggc-pothole-sensor-audio-muted') === 'true';
    } catch {
      return false;
    }
  });

  // Approaching Hazard State (Visual Countdown)
  const [activeHazardAlert, setActiveHazardAlert] = useState<ActiveHazardAlert | null>(null);

  // Tracked spots with 3x hit threshold
  const [trackedSpots, setTrackedSpots] = useState<TrackedHazardSpot[]>(() => loadTrackedSpots());
  const [quietStatusMessage, setQuietStatusMessage] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakResetTimer = useRef<number | null>(null);
  const statusTimer = useRef<number | null>(null);
  const simulationTimerRef = useRef<number | null>(null);

  // Track hazard IDs already announced to prevent sound spam (alert once per pothole)
  const alertedHazardIds = useRef<Set<string>>(new Set());

  // Reserve one GPS lookup at a time; accept at most one real hit per cooldown.
  const gpsRequestPending = useRef(false);
  const lastAcceptedImpactAt = useRef<number | null>(null);

  // Auto-save tracked spots
  useEffect(() => {
    saveTrackedSpots(trackedSpots);
  }, [trackedSpots]);

  // Toggle Mute handler (preserves sensor state)
  const handleToggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ggc-pothole-sensor-audio-muted', String(next));
      } catch (err) {
        console.error(err);
      }
      if (next) {
        cancelHazardWarning();
      }
      return next;
    });
  };

  /**
   * Continuous hazard detection:
   * Checks current GPS coordinates against all reported potholes.
   * Plays audio only once per hazard and displays a visual countdown.
   */
  const checkPotholeProximity = (
    currentLat: number,
    currentLng: number,
    currentHeading?: number | null
  ) => {
    // Offline support: use prop list or fall back to local storage / initial data
    const list = (potholes && potholes.length > 0) ? potholes : loadStoredPotholes(INITIAL_POTHOLES);
    let nearest: { pothole: PotholeReport; distanceFeet: number } | null = null;

    for (const p of list) {
      const distMiles = milesBetween(
        { lat: currentLat, lng: currentLng },
        { lat: p.latitude, lng: p.longitude }
      );

      // Warning threshold: < 0.1 miles (528 feet)
      if (distMiles <= HAZARD_WARNING_DISTANCE_MILES) {
        const ahead = isHazardAhead(
          currentHeading,
          { lat: currentLat, lng: currentLng },
          { lat: p.latitude, lng: p.longitude }
        );

        if (ahead) {
          const distFeet = distMiles * 5280;
          if (!nearest || distFeet < nearest.distanceFeet) {
            nearest = { pothole: p, distanceFeet: distFeet };
          }
        }
      }
    }

    if (nearest) {
      const { pothole, distanceFeet } = nearest;
      let phase: ActiveHazardAlert['phase'] = '200ft';
      if (distanceFeet <= 50) {
        phase = 'pass';
      } else if (distanceFeet <= 150) {
        phase = '100ft';
      }

      setActiveHazardAlert({
        id: pothole.id,
        title: pothole.title,
        roadName: pothole.roadName || pothole.address,
        distanceFeet,
        phase
      });

      // Play audio warning ONLY ONCE per hazard
      if (!alertedHazardIds.current.has(pothole.id)) {
        alertedHazardIds.current.add(pothole.id);
        if (!isMuted) {
          playHazardWarning(distanceFeet, { muted: isMuted });
        }
      }
    } else {
      setActiveHazardAlert(null);
    }
  };

  // Record an impact silently: check clustering for 3x hits
  const silentlyRecordImpact = (gVal: number, latOverride?: number, lngOverride?: number, roadOverride?: string) => {
    const roundedG = parseFloat(gVal.toFixed(2));
    setRecentSpike(roundedG);

    // Real impacts require real GPS coordinates. The demo supplies its own location.
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

    // Execute side-effects safely outside the React state updater
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

  // Motion sensor listener
  const handleDeviceMotion = (e: DeviceMotionEvent) => {
    if (!isMonitoring) return;
    const acc = e.accelerationIncludingGravity || e.acceleration;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    const magnitude = Math.sqrt(x * x + y * y + z * z) / 9.80665;

    setLiveG(magnitude);
    if (magnitude > peakG) {
      setPeakG(magnitude);
      if (peakResetTimer.current) clearTimeout(peakResetTimer.current);
      peakResetTimer.current = window.setTimeout(() => setPeakG(1.0), 2500);
    }

    // Significant pothole or bump threshold
    if (
      magnitude >= 3.5 &&
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

  // Continuous GPS watch position when monitoring is active
  useEffect(() => {
    if (!isMonitoring) return;

    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      try {
        watchId = navigator.geolocation.watchPosition(
          pos => {
            checkPotholeProximity(
              pos.coords.latitude,
              pos.coords.longitude,
              pos.coords.heading
            );
          },
          () => {
            // Geolocation fallback
          },
          { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
        );
      } catch (err) {
        console.error('watchPosition failed', err);
      }
    }

    return () => {
      if (watchId !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [isMonitoring, potholes, isMuted]);

  // Toggle monitoring
  const toggleMonitoring = async () => {
    if (isMonitoring) {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      cancelHazardWarning();
      setIsMonitoring(false);
      setActiveHazardAlert(null);
      return;
    }

    const deviceMotion = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof deviceMotion?.requestPermission === 'function') {
      try {
        const res = await deviceMotion.requestPermission();
        if (res === 'granted') {
          window.addEventListener('devicemotion', handleDeviceMotion);
          setIsMonitoring(true);
        } else {
          alert('Motion sensor permission was denied. You can still test sensor mode using the simulation buttons below.');
        }
      } catch (err) {
        console.error(err);
      }
    } else if ('ondevicemotion' in window) {
      window.addEventListener('devicemotion', handleDeviceMotion);
      setIsMonitoring(true);
    } else {
      setIsMonitoring(true);
    }
  };

  // Simulation handlers for class demo of 3x threshold
  const fixedDemoLocation = {
    lat: 33.9821,
    lng: -84.0048,
    road: 'Collins Hill Rd @ GGC Campus Entrance'
  };

  const handleSimulateDemoHit = () => {
    const spike = parseFloat((6.8 + Math.random() * 1.8).toFixed(2));
    setSimulatedSpike(spike);
    setLiveG(spike);
    silentlyRecordImpact(spike, fixedDemoLocation.lat, fixedDemoLocation.lng, fixedDemoLocation.road);
  };

  /**
   * Desktop Audio Warning & Visual Countdown Simulator
   * Simulates approach towards a pothole: 200 ft -> 100 ft -> Pass
   */
  const handleSimulateHazardApproach = () => {
    if (simulationTimerRef.current) {
      window.clearTimeout(simulationTimerRef.current);
    }

    const targetList = (potholes && potholes.length > 0) ? potholes : loadStoredPotholes(INITIAL_POTHOLES);
    const demoHazard = targetList[0] || {
      id: 'DEMO-POT-1',
      title: 'Deep Asphalt Crater',
      roadName: 'Collins Hill Rd @ GGC Entrance'
    };

    // Step 1: 200 ft approaching (Trigger audio)
    setActiveHazardAlert({
      id: demoHazard.id,
      title: demoHazard.title,
      roadName: demoHazard.roadName || 'Collins Hill Rd',
      distanceFeet: 210,
      phase: '200ft'
    });

    // Play sound once
    if (!isMuted) {
      playHazardWarning(210, { muted: false });
    }

    // Step 2: 100 ft after 1.8s
    simulationTimerRef.current = window.setTimeout(() => {
      setActiveHazardAlert({
        id: demoHazard.id,
        title: demoHazard.title,
        roadName: demoHazard.roadName || 'Collins Hill Rd',
        distanceFeet: 110,
        phase: '100ft'
      });

      // Step 3: Pass after another 1.8s
      simulationTimerRef.current = window.setTimeout(() => {
        setActiveHazardAlert({
          id: demoHazard.id,
          title: demoHazard.title,
          roadName: demoHazard.roadName || 'Collins Hill Rd',
          distanceFeet: 20,
          phase: 'pass'
        });

        // Step 4: Clear after 2.5s
        simulationTimerRef.current = window.setTimeout(() => {
          setActiveHazardAlert(null);
        }, 2500);
      }, 1800);
    }, 1800);
  };

  const handleClearTrackedSpots = () => {
    setTrackedSpots([]);
    saveTrackedSpots([]);
    alertedHazardIds.current.clear();
  };

  // Live Canvas Waveform Render
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const points: number[] = new Array(80).fill(1.0);

    const render = () => {
      time += 0.08;

      let newPoint = 1.0;
      if (isMonitoring) {
        newPoint = 1.0 + Math.sin(time * 3) * 0.08 + Math.cos(time * 7) * 0.04;
      }

      if (simulatedSpike > 1.2) {
        newPoint = simulatedSpike;
        setSimulatedSpike(prev => Math.max(1.0, prev * 0.82));
      }

      points.shift();
      points.push(newPoint);

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
      ctx.strokeStyle = isMonitoring ? '#10b981' : '#64748b';
      ctx.lineWidth = 2.5;

      points.forEach((val, idx) => {
        const x = (idx / (points.length - 1)) * canvas.width;
        const y = canvas.height - (val / 4.5) * canvas.height;
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
  }, [isMonitoring, simulatedSpike]);

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      cancelHazardWarning();
      if (peakResetTimer.current) clearTimeout(peakResetTimer.current);
      if (statusTimer.current) clearTimeout(statusTimer.current);
      if (simulationTimerRef.current) clearTimeout(simulationTimerRef.current);
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
          <span>In-Vehicle Drive Sensor & Audio Hazard Alerts</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-lg mx-auto">
          Continuously senses road impacts at 100Hz and announces approaching potholes ahead within 0.1 miles with visual countdown warnings.
        </p>
      </div>

      {/* Visual Hazard Alert & Distance Countdown Banner */}
      {activeHazardAlert && (
        <div 
          role="region"
          aria-label="Hazard ahead warning"
          className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-rose-950/90 border border-amber-500/80 rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <AlertTriangle className="w-6 h-6 text-amber-400 animate-pulse shrink-0" />
              <div>
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-300 block">
                  Hazard Ahead Reported
                </span>
                <span className="text-sm font-bold text-white">
                  {activeHazardAlert.roadName} ({activeHazardAlert.title})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isMuted ? (
                <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1 font-semibold">
                  <VolumeX className="w-3 h-3 text-slate-400" /> Audio Muted
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1 font-semibold">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Audio Active
                </span>
              )}
            </div>
          </div>

          {/* Visual Progression: 200 ft → 100 ft → Pass */}
          <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Proximity Countdown:</span>
              <span className="text-xl font-black text-rose-400 font-mono">
                {Math.round(activeHazardAlert.distanceFeet)} ft
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-1">
              <div 
                data-testid="countdown-200ft"
                className={`p-2.5 rounded-xl border transition ${
                  activeHazardAlert.phase === '200ft'
                    ? 'bg-amber-600/30 text-amber-300 border-amber-500 ring-2 ring-amber-500/40 shadow'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <div className="text-sm">200 ft</div>
                <div className="text-[10px] font-normal">Approaching</div>
              </div>
              
              <div 
                data-testid="countdown-100ft"
                className={`p-2.5 rounded-xl border transition ${
                  activeHazardAlert.phase === '100ft'
                    ? 'bg-rose-600/30 text-rose-300 border-rose-500 ring-2 ring-rose-500/40 shadow'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <div className="text-sm">100 ft</div>
                <div className="text-[10px] font-normal">Caution</div>
              </div>

              <div 
                data-testid="countdown-pass"
                className={`p-2.5 rounded-xl border transition ${
                  activeHazardAlert.phase === 'pass'
                    ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/40 shadow'
                    : 'bg-slate-900 text-slate-500 border-slate-800'
                }`}
              >
                <div className="text-sm">Pass</div>
                <div className="text-[10px] font-normal">Passing Hazard</div>
              </div>
            </div>
          </div>
        </div>
      )}

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
                {isMonitoring ? 'Sensor Active (Monitoring 100Hz & Proximity)' : 'Sensor Idle / Paused'}
              </span>
              <span className="text-[11px] text-slate-400">
                Automatic GPS proximity check • 3x shock confirmation
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Audio Mute Toggle Switch */}
            <button
              onClick={handleToggleMute}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition border ${
                isMuted
                  ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  : 'bg-teal-950 text-teal-300 border-teal-700 hover:bg-teal-900'
              }`}
              title={isMuted ? 'Hazard audio is muted (visual warnings only)' : 'Hazard audio is enabled'}
              aria-label="Mute Hazard Alerts"
            >
              {isMuted ? (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span>Alerts Muted</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-teal-400" />
                  <span>Audio Alerts On</span>
                </>
              )}
            </button>

            {/* Monitoring Play/Pause Button */}
            <button
              onClick={toggleMonitoring}
              className={`px-5 py-2 rounded-xl font-bold text-xs flex items-center space-x-2 transition shadow-lg ${
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
              Current Z-Axis Shock
            </span>
            <div className={`text-4xl font-black font-mono mt-1 ${
              isSpike ? 'text-rose-400' : isMonitoring ? 'text-emerald-400' : 'text-slate-500'
            }`}>
              {displayG.toFixed(2)} <span className="text-sm font-sans font-bold text-slate-400">G</span>
            </div>
            <span className="text-[10px] text-slate-500 mt-1 font-mono">
              Baseline: 1.00G Earth Gravity
            </span>
          </div>

          {/* Real-time Oscilloscope Waveform */}
          <div className="sm:col-span-2 bg-slate-950 rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between overflow-hidden">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] uppercase font-mono text-slate-400">
                100Hz Shock Waveform
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-bold">
                {isMonitoring ? 'LIVE' : 'STANDBY'}
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

        {/* Demo Simulation Controls for Capstone Presentation */}
        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              <span>Capstone Demo: Simulator Controls</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Target: <strong className="text-teal-300">Collins Hill Rd @ GGC</strong>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* Audio & Countdown Simulator Button */}
            <button
              onClick={handleSimulateHazardApproach}
              className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow active:scale-95"
            >
              <Volume2 className="w-3.5 h-3.5 text-teal-200" />
              <span>Simulate Hazard Approach (Audio & Countdown Demo)</span>
            </button>

            {/* 3x Strike Simulator */}
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
