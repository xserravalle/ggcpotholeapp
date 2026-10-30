import React, { useState, useEffect, useRef } from 'react';
import { canRecordImpact } from '../../services/impactCooldown';
import { 
  Activity, 
  Zap, 
  Play, 
  Square, 
  MapPin, 
  Sparkles,
  RotateCcw,
  Target,
  Cpu,
  CheckCircle2,
  AlertCircle,
  Route,
  Navigation,
  Clock,
  Gauge,
  FileText,
  AlertTriangle,
  History,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  Volume2,
  VolumeX,
  Radio
} from 'lucide-react';
import { PotholeReport } from '../../types/pothole';
import { INITIAL_POTHOLES } from '../../data/potholesData';
import { TrackedHazardSpot } from '../../types/sensorQueue';
import { DriveSession, DriveBreadcrumb, DriveShockIncident } from '../../types/driveSession';
import { 
  calculatePathDistanceMiles, 
  formatDuration, 
  loadDriveSessions, 
  saveDriveSession, 
  generateDriveTrackingCode 
} from '../../services/driveSessionService';
import { reverseGeocode } from '../../services/reverseGeocoding';
import { generateMapSnapshot } from '../../services/mapSnapshotService';
import { DriveRouteMap } from './DriveRouteMap';
import { DriveReportModal } from './DriveReportModal';
import { PermissionRationaleModal } from '../common/PermissionRationaleModal';
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
  onPromoteDriveIncidents?: (incidents: DriveShockIncident[]) => void;
  onNavigateToMyReports?: () => void;
}

const CLUSTER_DISTANCE_MILES = 0.022;
const AUDIO_MUTED_STORAGE_KEY = 'ggc-pothole-sensor-audio-muted';

export interface ActiveHazardAlert {
  id: string;
  title: string;
  roadName: string;
  distanceFeet: number;
  phase: '200ft' | '100ft' | 'pass';
}

/**
 * Dedicated Live Waveform Canvas component.
 * Self-contained so it always initializes and starts animating immediately
 * whenever mounted into the DOM, eliminating tab-switch null ref issues.
 */
const LiveWaveformCanvas: React.FC<{
  liveGRef: React.RefObject<number>;
  simulatedSpikeRef: React.RefObject<number>;
  isStreaming?: boolean;
}> = ({ liveGRef, simulatedSpikeRef, isStreaming = true }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const points: number[] = new Array(80).fill(1.0);

    const render = () => {
      let currentG = liveGRef.current ?? 1.0;

      // Handle simulated demonstration spike decaying smoothly
      if (simulatedSpikeRef.current && simulatedSpikeRef.current > 1.05) {
        currentG = simulatedSpikeRef.current;
        simulatedSpikeRef.current = Math.max(1.0, simulatedSpikeRef.current * 0.90);
      }

      points.shift();
      points.push(currentG);

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid line: 3.0G Impact Threshold
      const thresholdY = canvas.height - (3.0 / 4.5) * canvas.height;
      ctx.strokeStyle = '#ef444466';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(canvas.width, thresholdY);
      ctx.stroke();

      // Grid line: 1.0G Nominal Baseline (Earth Gravity)
      const baseY = canvas.height - (1.0 / 4.5) * canvas.height;
      ctx.strokeStyle = '#334155';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(canvas.width, baseY);
      ctx.stroke();

      // Waveform trace line
      ctx.beginPath();
      ctx.strokeStyle = currentG >= 3.0 ? '#ef4444' : '#10b981';
      ctx.lineWidth = 2.5;

      points.forEach((val, idx) => {
        const x = (idx / (points.length - 1)) * canvas.width;
        const y = canvas.height - (Math.min(val, 4.5) / 4.5) * canvas.height;
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Text labels
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('3.0G Impact Threshold', 10, thresholdY - 4);

      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('1.0G Gravity Baseline', 10, baseY - 4);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [liveGRef, simulatedSpikeRef]);

  return (
    <canvas
      ref={canvasRef}
      width={400}
      height={96}
      className="w-full h-full block"
    />
  );
};

export const DriveSensorView: React.FC<DriveSensorViewProps> = ({ 
  potholes,
  onPromoteSpotToReport,
  onPromoteDriveIncidents,
  onNavigateToMyReports
}) => {
  // Navigation / Mode: 'patrol' (Drive-Time Mapping) or 'stationary' (Hardware Bench Test)
  const [activeMode, setActiveMode] = useState<'patrol' | 'stationary'>('patrol');

  // Active Drive Session State
  const [isDriving, setIsDriving] = useState(false);
  const [driveSession, setDriveSession] = useState<DriveSession | null>(null);
  const [activeReadoutSession, setActiveReadoutSession] = useState<DriveSession | null>(null);
  const [pastSessions, setPastSessions] = useState<DriveSession[]>(() => loadDriveSessions());
  const [currentSpeedMph, setCurrentSpeedMph] = useState<number>(0);

  // Live G-Force & Sensor State
  const [liveG, setLiveG] = useState(1.00);
  const [peakG, setPeakG] = useState(1.00);
  const [recentSpike, setRecentSpike] = useState<number | null>(null);
  const [latestIncidentAlert, setLatestIncidentAlert] = useState<{ road: string; peakG: number; count: number } | null>(null);

  // Hardware Diagnostics (for Samsung Galaxy S25 Ultra & Mobile Browsers)
  const [eventCount, setEventCount] = useState(0);
  const [rawAcc, setRawAcc] = useState({ x: 0, y: 0, z: 9.81 });
  const [sensorSource, setSensorSource] = useState<string>('Detecting...');

  // Tracked spots with 3x hit threshold (for stationary bench test)
  const [trackedSpots, setTrackedSpots] = useState<TrackedHazardSpot[]>(() => loadTrackedSpots());
  const [quietStatusMessage, setQuietStatusMessage] = useState<string | null>(null);

  // Refs for zero-closure-staleness
  const liveGRef = useRef(1.00);
  const peakGRef = useRef(1.00);
  const driveSessionRef = useRef<DriveSession | null>(null);
  const isDrivingRef = useRef(false);
  const watchIdRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const lastAcceptedImpactAt = useRef<number | null>(null);
  const simulatedSpikeRef = useRef<number>(1.0);

  // Audio hazard warnings: mute toggle (persisted) and approaching-hazard countdown
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUDIO_MUTED_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [activeHazardAlert, setActiveHazardAlert] = useState<ActiveHazardAlert | null>(null);
  const isMutedRef = useRef(isMuted);
  const potholesRef = useRef<PotholeReport[] | undefined>(potholes);
  // Hazard IDs already announced this drive (alert once per pothole)
  const alertedHazardIds = useRef<Set<string>>(new Set());
  const simulationTimerRef = useRef<number | null>(null);
  const [showMotionRationale, setShowMotionRationale] = useState(false);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  useEffect(() => {
    potholesRef.current = potholes;
  }, [potholes]);

  // Synchronize refs
  useEffect(() => {
    driveSessionRef.current = driveSession;
  }, [driveSession]);

  useEffect(() => {
    isDrivingRef.current = isDriving;
  }, [isDriving]);

  // Auto-save tracked spots
  useEffect(() => {
    saveTrackedSpots(trackedSpots);
  }, [trackedSpots]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && 'geolocation' in navigator) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (simulationTimerRef.current) {
        clearTimeout(simulationTimerRef.current);
      }
      cancelHazardWarning();
    };
  }, []);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    isMutedRef.current = next;
    try {
      localStorage.setItem(AUDIO_MUTED_STORAGE_KEY, String(next));
    } catch (err) {
      console.error(err);
    }
    if (next) {
      cancelHazardWarning();
    }
  };

  /**
   * Checks the current GPS position against reported potholes. Shows a visual
   * countdown for the nearest hazard ahead and announces each hazard once.
   * Reads from refs because it runs inside the long-lived GPS watch callback.
   */
  const checkPotholeProximity = (
    currentLat: number,
    currentLng: number,
    currentHeading?: number | null
  ) => {
    const provided = potholesRef.current;
    const list = provided && provided.length > 0 ? provided : loadStoredPotholes(INITIAL_POTHOLES);
    let nearest: { pothole: PotholeReport; distanceFeet: number } | null = null;

    for (const p of list) {
      const here = { lat: currentLat, lng: currentLng };
      const there = { lat: p.latitude, lng: p.longitude };
      const distMiles = milesBetween(here, there);
      if (distMiles > HAZARD_WARNING_DISTANCE_MILES) continue;
      if (!isHazardAhead(currentHeading, here, there)) continue;

      const distFeet = distMiles * 5280;
      if (!nearest || distFeet < nearest.distanceFeet) {
        nearest = { pothole: p, distanceFeet: distFeet };
      }
    }

    if (!nearest) {
      setActiveHazardAlert(null);
      return;
    }

    const { pothole, distanceFeet } = nearest;
    const phase: ActiveHazardAlert['phase'] =
      distanceFeet <= 50 ? 'pass' : distanceFeet <= 150 ? '100ft' : '200ft';

    setActiveHazardAlert({
      id: pothole.id,
      title: pothole.title,
      roadName: pothole.roadName || pothole.address,
      distanceFeet,
      phase
    });

    if (!alertedHazardIds.current.has(pothole.id)) {
      alertedHazardIds.current.add(pothole.id);
      if (!isMutedRef.current) {
        playHazardWarning(distanceFeet, { muted: false });
      }
    }
  };

  // Record an incident during an active drive
  const recordDriveShockIncident = async (magnitude: number, lat: number, lng: number) => {
    const roundedG = parseFloat(magnitude.toFixed(2));
    setRecentSpike(roundedG);

    const currentSession = driveSessionRef.current;
    if (!currentSession) return;

    // Resolve nearest address and map snapshot
    const geo = await reverseGeocode(lat, lng);
    const roadName = geo.road || 'Local Roadway';
    const address = geo.address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    const city = geo.city || 'Lawrenceville';

    const severity = roundedG >= 6.0 ? 'critical' : roundedG >= 4.5 ? 'severe' : 'moderate';

    let snapshot = '';
    try {
      snapshot = await generateMapSnapshot(lat, lng, { severity, roadName });
    } catch {
      // fallback handled gracefully
    }

    const newIncident: DriveShockIncident = {
      id: `INC-${crypto.randomUUID()}`,
      timestamp: Date.now(),
      elapsedSeconds: currentSession.durationSeconds,
      latitude: lat,
      longitude: lng,
      peakG: roundedG,
      severity,
      roadName,
      address,
      city,
      imageUrl: snapshot || undefined
    };

    setDriveSession(prev => {
      if (!prev) return null;
      const updatedIncidents = [...prev.incidents, newIncident];
      const newPeak = Math.max(prev.peakG, roundedG);
      return {
        ...prev,
        incidents: updatedIncidents,
        peakG: newPeak
      };
    });

    setLatestIncidentAlert({
      road: roadName,
      peakG: roundedG,
      count: currentSession.incidents.length + 1
    });

    setTimeout(() => {
      setLatestIncidentAlert(null);
    }, 4500);

    setTimeout(() => {
      setRecentSpike(null);
    }, 2500);
  };

  // Record an impact silently on the Hardware Bench (check clustering for 3x hits)
  const silentlyRecordBenchImpact = (gVal: number, lat: number, lng: number, road: string) => {
    const roundedG = parseFloat(gVal.toFixed(2));
    setRecentSpike(roundedG);
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let spotToPromote: TrackedHazardSpot | null = null;
    let statusMsg: string | null = null;

    setTrackedSpots(prevSpots => {
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

        if (newHitCount >= 3 && !updatedSpot.promotedToReportId) {
          updatedSpot.promotedToReportId = `GW-POT-${crypto.randomUUID()}`;
          spotToPromote = updatedSpot;
          statusMsg = `🎯 Spot hit 3x: Auto-promoted to My Reports! (${updatedSpot.roadName})`;
        } else {
          statusMsg = `📍 Road spot registered ${newHitCount}/3 hits (${updatedSpot.roadName})`;
        }

        updatedList[existingIndex] = updatedSpot;
      } else {
        const newSpot: TrackedHazardSpot = {
          id: `SPOT-${crypto.randomUUID()}`,
          latitude: lat,
          longitude: lng,
          roadName: road,
          city: 'Lawrenceville',
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
      setTimeout(() => setQuietStatusMessage(null), 5000);
    }

    setTimeout(() => {
      setRecentSpike(null);
    }, 2500);
  };

  // Start Active Drive-Time Patrol (prompts rationale first, requests permission on gesture tap)
  const handleStartDrive = () => {
    setShowMotionRationale(true);
  };

  const executeStartDrive = async () => {
    setShowMotionRationale(false);
    const deviceMotion = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };
    if (typeof deviceMotion?.requestPermission === 'function') {
      try {
        await deviceMotion.requestPermission();
      } catch (e) {
        console.warn('DeviceMotionEvent permission error:', e);
      }
    }

    const now = Date.now();
    const newSession: DriveSession = {
      id: `DRV-${crypto.randomUUID()}`,
      trackingCode: generateDriveTrackingCode(),
      startTime: now,
      durationSeconds: 0,
      totalDistanceMiles: 0,
      peakG: 1.0,
      path: [],
      incidents: [],
      status: 'active'
    };

    setDriveSession(newSession);
    driveSessionRef.current = newSession;
    setIsDriving(true);
    isDrivingRef.current = true;
    setRecentSpike(null);
    setLatestIncidentAlert(null);

    // Initial GPS seed coordinate
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const firstPoint: DriveBreadcrumb = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            timestamp: Date.now(),
            speedMph: pos.coords.speed ? Math.round(pos.coords.speed * 2.23694) : 0,
            accuracy: pos.coords.accuracy
          };
          setDriveSession(prev => prev ? { ...prev, path: [firstPoint] } : null);
        },
        () => {
          const defaultFirst: DriveBreadcrumb = {
            lat: 33.9798,
            lng: -84.0017,
            timestamp: Date.now()
          };
          setDriveSession(prev => prev ? { ...prev, path: [defaultFirst] } : null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );

      // Continuous GPS tracking throughout drive
      watchIdRef.current = navigator.geolocation.watchPosition(
        pos => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const speed = pos.coords.speed ? Math.max(0, Math.round(pos.coords.speed * 2.23694)) : 0;
          setCurrentSpeedMph(speed);
          checkPotholeProximity(lat, lng, pos.coords.heading);

          const newPoint: DriveBreadcrumb = {
            lat,
            lng,
            timestamp: Date.now(),
            speedMph: speed,
            accuracy: pos.coords.accuracy
          };

          setDriveSession(prev => {
            if (!prev) return null;
            const updatedPath = [...prev.path, newPoint];
            const dist = calculatePathDistanceMiles(updatedPath);
            return {
              ...prev,
              path: updatedPath,
              totalDistanceMiles: dist,
              maxSpeedMph: Math.max(prev.maxSpeedMph || 0, speed)
            };
          });
        },
        err => console.warn('Drive watchPosition error:', err),
        { enableHighAccuracy: true, maximumAge: 1500, timeout: 6000 }
      );
    }

    // Drive duration timer (ticks every 1s)
    timerIntervalRef.current = window.setInterval(() => {
      setDriveSession(prev => {
        if (!prev) return null;
        return {
          ...prev,
          durationSeconds: prev.durationSeconds + 1
        };
      });
    }, 1000);
  };

  // End Active Drive-Time Patrol & Generate Readout
  const handleEndDrive = () => {
    if (watchIdRef.current !== null && 'geolocation' in navigator) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    cancelHazardWarning();
    setActiveHazardAlert(null);
    alertedHazardIds.current.clear();

    const current = driveSessionRef.current;
    if (!current) {
      setIsDriving(false);
      return;
    }

    const completedSession: DriveSession = {
      ...current,
      status: 'completed',
      endTime: Date.now(),
      totalDistanceMiles: calculatePathDistanceMiles(current.path)
    };

    saveDriveSession(completedSession);
    setPastSessions(prev => [completedSession, ...prev.filter(s => s.id !== completedSession.id)]);
    setIsDriving(false);
    isDrivingRef.current = false;
    setDriveSession(null);
    driveSessionRef.current = null;
    setCurrentSpeedMph(0);

    setActiveReadoutSession(completedSession);
  };

  // Hardware Motion Listener (Always listens to hardware accelerometer)
  useEffect(() => {
    let isListenerActive = true;

    const onDeviceMotion = (e: DeviceMotionEvent) => {
      if (!isListenerActive) return;

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

      const rawMag = Math.sqrt(x * x + y * y + z * z) / 9.80665;
      const magnitude = parseFloat(rawMag.toFixed(2));

      liveGRef.current = magnitude;
      setLiveG(magnitude);

      if (magnitude > peakGRef.current) {
        peakGRef.current = magnitude;
        setPeakG(magnitude);
        setTimeout(() => {
          peakGRef.current = 1.0;
          setPeakG(1.0);
        }, 2500);
      }

      // Check impact threshold (>= 3.0G)
      if (
        magnitude >= 3.0 &&
        canRecordImpact(lastAcceptedImpactAt.current, Date.now())
      ) {
        lastAcceptedImpactAt.current = Date.now();

        // If in active drive: record along the drive route
        if (isDrivingRef.current && driveSessionRef.current) {
          const currentPath = driveSessionRef.current.path;
          const latestCoord = currentPath.length > 0 
            ? currentPath[currentPath.length - 1] 
            : { lat: 33.9821, lng: -84.0048 };

          recordDriveShockIncident(magnitude, latestCoord.lat, latestCoord.lng);
        }
      }
    };

    window.addEventListener('devicemotion', onDeviceMotion, true);

    return () => {
      isListenerActive = false;
      window.removeEventListener('devicemotion', onDeviceMotion, true);
    };
  }, []);

  // Demo simulation advance helpers (for test drives or capstone presentation)
  const handleSimulateDriveAdvance = () => {
    if (!isDriving || !driveSession) return;

    const currentPath = driveSession.path;
    const baseLat = currentPath.length > 0 ? currentPath[currentPath.length - 1].lat : 33.9798;
    const baseLng = currentPath.length > 0 ? currentPath[currentPath.length - 1].lng : -84.0017;

    const nextLat = baseLat + 0.0018 + (Math.random() - 0.5) * 0.0004;
    const nextLng = baseLng + 0.0012 + (Math.random() - 0.5) * 0.0004;
    const speed = 35 + Math.round((Math.random() - 0.5) * 8);

    const newPoint: DriveBreadcrumb = {
      lat: nextLat,
      lng: nextLng,
      timestamp: Date.now(),
      speedMph: speed
    };

    setCurrentSpeedMph(speed);

    setDriveSession(prev => {
      if (!prev) return null;
      const updatedPath = [...prev.path, newPoint];
      const dist = calculatePathDistanceMiles(updatedPath);
      return {
        ...prev,
        path: updatedPath,
        totalDistanceMiles: dist,
        maxSpeedMph: Math.max(prev.maxSpeedMph || 0, speed)
      };
    });
  };

  const handleSimulateDriveShock = () => {
    const spike = parseFloat((6.4 + Math.random() * 2.2).toFixed(2));
    liveGRef.current = spike;
    setLiveG(spike);
    simulatedSpikeRef.current = spike;

    if (isDriving && driveSession) {
      const currentPath = driveSession.path;
      const curLat = currentPath.length > 0 ? currentPath[currentPath.length - 1].lat : 33.9821;
      const curLng = currentPath.length > 0 ? currentPath[currentPath.length - 1].lng : -84.0048;
      recordDriveShockIncident(spike, curLat, curLng);
    }
  };

  /**
   * Capstone demo: simulates approaching a reported pothole
   * (200 ft -> 100 ft -> pass) with the audio warning and visual countdown.
   */
  const handleSimulateHazardApproach = () => {
    if (simulationTimerRef.current) {
      window.clearTimeout(simulationTimerRef.current);
    }

    const provided = potholesRef.current;
    const list = provided && provided.length > 0 ? provided : loadStoredPotholes(INITIAL_POTHOLES);
    const demo = list[0];
    const id = demo?.id ?? 'DEMO-POT-1';
    const title = demo?.title ?? 'Deep Asphalt Crater';
    const roadName = demo?.roadName || 'Collins Hill Rd';

    const showPhase = (distanceFeet: number, phase: ActiveHazardAlert['phase']) =>
      setActiveHazardAlert({ id, title, roadName, distanceFeet, phase });

    showPhase(210, '200ft');
    if (!isMutedRef.current) {
      playHazardWarning(210, { muted: false });
    }

    simulationTimerRef.current = window.setTimeout(() => {
      showPhase(110, '100ft');
      simulationTimerRef.current = window.setTimeout(() => {
        showPhase(20, 'pass');
        simulationTimerRef.current = window.setTimeout(() => {
          setActiveHazardAlert(null);
        }, 2500);
      }, 1800);
    }, 1800);
  };

  // Demonstration shock spike for the Hardware Bench test
  const handleSimulateBenchShock = () => {
    const spike = parseFloat((6.8 + Math.random() * 1.8).toFixed(2));
    liveGRef.current = spike;
    setLiveG(spike);
    setPeakG(spike);
    simulatedSpikeRef.current = spike;
    silentlyRecordBenchImpact(spike, 33.9821, -84.0048, 'Collins Hill Rd @ GGC Campus Entrance');
  };

  const handleClearTrackedSpots = () => {
    setTrackedSpots([]);
    saveTrackedSpots([]);
  };

  const displayG = recentSpike || Math.max(liveG, peakG);
  const isSpike = displayG >= 3.0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      
      {/* Top Navigation Tabs: Drive Patrol vs Hardware Bench */}
      <div className="flex items-center justify-between bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-lg">
        <button
          onClick={() => setActiveMode('patrol')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            activeMode === 'patrol'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Route className="w-4 h-4" />
          <span>Drive-Time Mapping & Patrol</span>
        </button>

        <button
          onClick={() => setActiveMode('stationary')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
            activeMode === 'stationary'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Cpu className="w-4 h-4" />
          <span>Sensor Hardware Bench</span>
        </button>
      </div>

      {/* MODE 1: DRIVE-TIME PATROL (ACTIVE ROUTE MAPPING) */}
      {activeMode === 'patrol' && (
        <div className="space-y-5 animate-in fade-in duration-300">

          {/* Audio Hazard Alerts: mute toggle + approach demo */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-300 text-[11px] font-semibold flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-teal-400" />
              <span>Hazard-ahead alerts within 0.1 mi of reported potholes</span>
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
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
              <button
                type="button"
                onClick={handleSimulateHazardApproach}
                className="px-3.5 py-2 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5 text-teal-200" />
                <span>Simulate Hazard Approach (Audio & Countdown Demo)</span>
              </button>
            </div>
          </div>

          {/* Visual Hazard Alert & Distance Countdown Banner */}
          {activeHazardAlert && (
            <div
              role="region"
              aria-label="Hazard ahead warning"
              className="bg-gradient-to-r from-amber-950/90 via-slate-900 to-rose-950/90 border border-amber-500/80 rounded-3xl p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-300"
            >
              <div className="flex items-center justify-between gap-2">
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
                {isMuted ? (
                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full border border-slate-700 flex items-center gap-1 font-semibold shrink-0">
                    <VolumeX className="w-3 h-3 text-slate-400" /> Audio Muted
                  </span>
                ) : (
                  <span className="text-[10px] bg-emerald-950 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-800 flex items-center gap-1 font-semibold shrink-0">
                    <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> Audio Active
                  </span>
                )}
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-400">Proximity Countdown:</span>
                  <span className="text-xl font-black text-rose-400 font-mono">
                    {Math.round(activeHazardAlert.distanceFeet)} ft
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold pt-1">
                  {([
                    { phase: '200ft', label: '200 ft', sub: 'Approaching', on: 'bg-amber-600/30 text-amber-300 border-amber-500 ring-2 ring-amber-500/40 shadow' },
                    { phase: '100ft', label: '100 ft', sub: 'Caution', on: 'bg-rose-600/30 text-rose-300 border-rose-500 ring-2 ring-rose-500/40 shadow' },
                    { phase: 'pass', label: 'Pass', sub: 'Passing Hazard', on: 'bg-emerald-600/30 text-emerald-300 border-emerald-500 ring-2 ring-emerald-500/40 shadow' }
                  ] as const).map(step => (
                    <div
                      key={step.phase}
                      data-testid={`countdown-${step.phase}`}
                      className={`p-2.5 rounded-xl border transition ${
                        activeHazardAlert.phase === step.phase
                          ? step.on
                          : 'bg-slate-900 text-slate-500 border-slate-800'
                      }`}
                    >
                      <div className="text-sm">{step.label}</div>
                      <div className="text-[10px] font-normal">{step.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          {/* Active Drive Cockpit */}
          {isDriving && driveSession ? (
            <div className="bg-slate-900 border-2 border-teal-500/80 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4 relative overflow-hidden">
              
              {/* Pulsing Live Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="w-3.5 h-3.5 rounded-full bg-emerald-400 animate-ping" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                        Active Drive Patrol in Progress
                      </span>
                      <span className="font-mono text-[10px] bg-teal-950 text-teal-300 border border-teal-800 px-2 py-0.5 rounded-full font-bold">
                        {driveSession.trackingCode}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Silent accelerometer mapping active • Driving hands-free
                    </span>
                  </div>
                </div>

                {/* Big Termination Button */}
                <button
                  type="button"
                  onClick={handleEndDrive}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition active:scale-95 shrink-0"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>End Drive & Generate Report</span>
                </button>
              </div>

              {/* Real-time Shock Incident Flash Alert */}
              {latestIncidentAlert && (
                <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-rose-950 border border-rose-600/80 rounded-2xl p-3 shadow-xl flex items-center justify-between text-xs text-rose-200 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping"></span>
                    <span className="font-bold text-white">
                      Road Hazard Detected: {latestIncidentAlert.peakG.toFixed(2)}G
                    </span>
                    <span className="text-rose-300">on {latestIncidentAlert.road}</span>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-[11px]">
                    Logged as #{latestIncidentAlert.count}
                  </span>
                </div>
              )}

              {/* Driving HUD Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Drive Length</span>
                  <span className="text-2xl font-black font-mono text-teal-400 mt-0.5 block">
                    {driveSession.totalDistanceMiles.toFixed(2)} <span className="text-xs font-sans text-slate-400">mi</span>
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Elapsed Time</span>
                  <span className="text-2xl font-black font-mono text-blue-400 mt-0.5 block">
                    {formatDuration(driveSession.durationSeconds)}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Potholes Logged</span>
                  <span className="text-2xl font-black font-mono text-rose-400 mt-0.5 block">
                    {driveSession.incidents.length}
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl text-center">
                  <span className="text-[9px] uppercase font-bold text-slate-400 block tracking-wider">Vehicle Speed</span>
                  <span className="text-2xl font-black font-mono text-emerald-400 mt-0.5 block">
                    {currentSpeedMph} <span className="text-xs font-sans text-slate-400">mph</span>
                  </span>
                </div>
              </div>

              {/* Live Driving Route Map */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Navigation className="w-3.5 h-3.5 text-teal-400" />
                    <span>Live Drive-Time Map (Point of Activation to Current)</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Live GPS Stream
                  </span>
                </div>

                <DriveRouteMap
                  path={driveSession.path}
                  incidents={driveSession.incidents}
                  isLive={true}
                  heightClass="h-56 sm:h-72"
                />
              </div>

              {/* Demo Drive Simulator Helpers */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-slate-400 text-[11px] font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-teal-400" />
                  <span>Capstone Drive Controls:</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSimulateDriveAdvance}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-teal-300 text-xs font-semibold transition"
                  >
                    + Drive Forward (+0.15 mi)
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateDriveShock}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1 shadow"
                  >
                    <Zap className="w-3 h-3 text-amber-200" />
                    <span>Simulate Pothole Shock (7.2G)</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            /* Standby Pre-Drive Activation Card */
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl text-center space-y-5">
              <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center mx-auto shadow-inner">
                <Route className="w-8 h-8" />
              </div>

              <div className="max-w-lg mx-auto space-y-1.5">
                <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Start Drive-Time Pothole Patrol
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Safely activate before beginning your trip. The app automatically tracks your drive length from start to finish, listens for roadway shock impacts, and generates a complete incident readout at destination.
                </p>
              </div>

              {/* Start Patrol Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleStartDrive}
                  className="py-3.5 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white font-extrabold text-sm shadow-xl shadow-teal-500/25 transition active:scale-95 inline-flex items-center gap-2.5"
                >
                  <Play className="w-5 h-5 fill-white" />
                  <span>Begin Drive-Time Mapping Session</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 text-left max-w-xl mx-auto text-xs">
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Navigation className="w-3.5 h-3.5 text-teal-400" /> Route Tracking
                  </span>
                  <p className="text-[11px] text-slate-400">Continuous GPS breadcrumb path recording.</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-rose-400" /> Shock Telemetry
                  </span>
                  <p className="text-[11px] text-slate-400">Silent mobile accelerometer threshold logging.</p>
                </div>
                <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 space-y-1">
                  <span className="font-bold text-white flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-400" /> Incident Readout
                  </span>
                  <p className="text-[11px] text-slate-400">Full trip summary & certified PDF docket.</p>
                </div>
              </div>
            </div>
          )}

          {/* Past Drive Patrol Sessions History */}
          {pastSessions.length > 0 && !isDriving && (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <History className="w-5 h-5 text-teal-400" />
                  <h3 className="text-base font-bold text-white">
                    Previous Drive Patrol Sessions ({pastSessions.length})
                  </h3>
                </div>
              </div>

              <div className="space-y-2.5">
                {pastSessions.slice(0, 5).map(session => (
                  <div
                    key={session.id}
                    onClick={() => setActiveReadoutSession(session)}
                    className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs cursor-pointer transition group"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-teal-400">
                          {session.trackingCode}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                        <span>Distance: <strong className="text-white">{session.totalDistanceMiles.toFixed(2)} mi</strong></span>
                        <span>&bull;</span>
                        <span>Duration: <strong className="text-white">{formatDuration(session.durationSeconds)}</strong></span>
                        <span>&bull;</span>
                        <span className="text-rose-400 font-semibold">{session.incidents.length} Hazards Logged</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400 group-hover:text-teal-400 transition shrink-0">
                      <span className="font-semibold text-[11px] hidden sm:inline">View Readout</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* MODE 2: HARDWARE BENCH TEST (PHYSICAL ACCELEROMETER DIAGNOSTICS & WAVEFORM) */}
      {activeMode === 'stationary' && (
        <div className="space-y-5 animate-in fade-in duration-300">
          
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-5">
            
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">Hardware Sensor Monitor</h3>
              <p className="text-[11px] text-slate-400">Physical mobile accelerometer streaming & live shock telemetry</p>
            </div>

            {/* G-Force Readout & Live Physical Waveform */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800/80 flex flex-col justify-center items-center text-center">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Total G-Force Load
                </span>
                <div className={`text-4xl font-black font-mono mt-1 ${
                  isSpike ? 'text-rose-400' : 'text-emerald-400'
                }`}>
                  {displayG.toFixed(2)} <span className="text-sm font-sans font-bold text-slate-400">G</span>
                </div>
                <span className="text-[10px] text-slate-500 mt-1 font-mono">
                  Baseline: ~1.00G Gravity
                </span>
              </div>

              {/* The Live Physical Waveform Canvas */}
              <div className="sm:col-span-2 bg-slate-950 rounded-2xl p-3 border border-slate-800/80 flex flex-col justify-between overflow-hidden">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400">
                    Live Physical Waveform
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>STREAMING</span>
                  </span>
                </div>
                <div className="w-full h-24 rounded-lg overflow-hidden bg-slate-950">
                  <LiveWaveformCanvas 
                    liveGRef={liveGRef} 
                    simulatedSpikeRef={simulatedSpikeRef} 
                    isStreaming={true}
                  />
                </div>
              </div>
            </div>

            {/* Raw XYZ Axes */}
            <div className="grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[9px] text-slate-500 uppercase block font-sans">X-Axis</span>
                <span className="text-white font-bold">{rawAcc.x} m/s²</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[9px] text-slate-500 uppercase block font-sans">Y-Axis</span>
                <span className="text-white font-bold">{rawAcc.y} m/s²</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center">
                <span className="text-[9px] text-slate-500 uppercase block font-sans">Z-Axis</span>
                <span className="text-white font-bold">{rawAcc.z} m/s²</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <span>Sensor Stream: <strong className="text-slate-200">{sensorSource}</strong></span>
              <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" /> Hardware Active
              </span>
            </div>

            {/* Demonstration Shock Controls for Capstone Bench */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                  <span>Capstone Demonstration Controls</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  Target: <strong className="text-teal-300">Collins Hill Rd @ GGC</strong>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSimulateBenchShock}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-200" />
                  <span>Simulate Demo Shock Spike (7.5G)</span>
                </button>

                {trackedSpots.length > 0 && (
                  <button
                    type="button"
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
                  Tracked Road Spots & Hit Count (3 Strikes Verification)
                </h3>
              </div>
              <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full border border-slate-700">
                {trackedSpots.length} Locations Monitored
              </span>
            </div>

            {trackedSpots.length === 0 ? (
              <div className="bg-slate-950/60 rounded-2xl p-6 text-center border border-slate-800/80 text-xs text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">No stationary road impacts registered yet</p>
                <p>When you shake the device or click the test button above, impacts will cluster here until reaching 3 strikes.</p>
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
      )}

      {/* Post-Drive Readout Modal */}
      {activeReadoutSession && (
        <DriveReportModal
          isOpen={true}
          onClose={() => setActiveReadoutSession(null)}
          session={activeReadoutSession}
          onPromoteIncidentsToReports={onPromoteDriveIncidents}
        />
      )}

      <PermissionRationaleModal
        isOpen={showMotionRationale}
        type="motion"
        title="Motion & Accelerometer Access"
        rationale="SansPotholes needs motion sensor access to measure road shocks and vehicular impact spikes during your drive."
        confirmLabel="Allow & Start Drive"
        onConfirm={executeStartDrive}
        onCancel={() => setShowMotionRationale(false)}
      />
    </div>
  );
};
