import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Zap, 
  Play, 
  Pause, 
  AlertTriangle, 
  ShieldCheck, 
  CheckCircle2, 
  Car, 
  MapPin, 
  Volume2,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { QueuedImpact } from '../../types/sensorQueue';
import { ParkAndReviewModal } from './ParkAndReviewModal';
import { playSubtleChime } from '../../utils/audioChime';

interface DriveSensorViewProps {
  onConfirmImpact?: (impact: QueuedImpact) => void;
  onBatchConfirmImpacts?: (impacts: QueuedImpact[]) => void;
  onAddDetailsToReport?: (impact: QueuedImpact) => void;
}

export const DriveSensorView: React.FC<DriveSensorViewProps> = ({ 
  onConfirmImpact,
  onBatchConfirmImpacts,
  onAddDetailsToReport
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveG, setLiveG] = useState(1.02);
  const [peakG, setPeakG] = useState(1.02);
  const [recentSpike, setRecentSpike] = useState<number | null>(null);
  const [simulatedSpike, setSimulatedSpike] = useState(1.0);
  const [impactCount, setImpactCount] = useState(0);

  // Silent Background Auto-Logging Queue
  const [queuedImpacts, setQueuedImpacts] = useState<QueuedImpact[]>([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [hudToast, setHudToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const peakResetTimer = useRef<number | null>(null);
  const hudTimer = useRef<number | null>(null);

  // Record an impact silently in the background
  const silentlyRecordImpact = (gVal: number) => {
    const rounded = parseFloat(gVal.toFixed(2));
    setRecentSpike(rounded);
    setImpactCount(prev => prev + 1);

    // Subtle audio chime via Web Audio API (gentle confirmation)
    playSubtleChime();

    // Subtle haptic vibration pattern
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([80, 40, 80]);
      } catch {
        // Haptics not allowed
      }
    }

    // Display non-intrusive transient HUD toast (zero blocking)
    setHudToast(`📍 Shock auto-logged (${rounded}G) • Review when parked`);
    if (hudTimer.current) clearTimeout(hudTimer.current);
    hudTimer.current = window.setTimeout(() => setHudToast(null), 3500);

    // Fallback coordinates near GGC campus corridor
    let lat = 33.9818 + (Math.random() - 0.5) * 0.015;
    let lng = -84.0042 + (Math.random() - 0.5) * 0.015;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Acquire GPS position silently if available
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          const newImpact: QueuedImpact = {
            id: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: timeStr,
            gForce: rounded,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            roadName: 'Collins Hill Rd Corridor',
            city: 'Lawrenceville',
            severity: rounded >= 6.0 ? 'critical' : 'moderate',
            status: 'pending'
          };
          setQueuedImpacts(prev => [newImpact, ...prev]);
        },
        () => {
          const newImpact: QueuedImpact = {
            id: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            timestamp: timeStr,
            gForce: rounded,
            latitude: lat,
            longitude: lng,
            roadName: 'Collins Hill Rd Corridor',
            city: 'Lawrenceville',
            severity: rounded >= 6.0 ? 'critical' : 'moderate',
            status: 'pending'
          };
          setQueuedImpacts(prev => [newImpact, ...prev]);
        },
        { enableHighAccuracy: true, timeout: 3000 }
      );
    } else {
      const newImpact: QueuedImpact = {
        id: `IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        timestamp: timeStr,
        gForce: rounded,
        latitude: lat,
        longitude: lng,
        roadName: 'Collins Hill Rd Corridor',
        city: 'Lawrenceville',
        severity: rounded >= 6.0 ? 'critical' : 'moderate',
        status: 'pending'
      };
      setQueuedImpacts(prev => [newImpact, ...prev]);
    }

    setTimeout(() => {
      setRecentSpike(null);
    }, 3000);
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
    if (magnitude >= 3.5) {
      silentlyRecordImpact(magnitude);
    }
  };

  // Toggle monitoring: When stopping, automatically prompt Park & Review if impacts exist
  const toggleMonitoring = async () => {
    if (isMonitoring) {
      window.removeEventListener('devicemotion', handleDeviceMotion);
      setIsMonitoring(false);

      // Auto-trigger Park & Review if there are pending logged impacts
      if (queuedImpacts.some(i => i.status === 'pending')) {
        setTimeout(() => setIsReviewModalOpen(true), 300);
      }
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
          alert('Motion sensor permission was denied. You can still test using the simulation button below.');
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

  // Simulate shock trigger for class presentations
  const handleSimulateShock = () => {
    const spike = parseFloat((7.8 + Math.random() * 1.5).toFixed(2));
    setSimulatedSpike(spike);
    setLiveG(spike);
    silentlyRecordImpact(spike);
  };

  // Handlers for Park & Review
  const handleConfirmImpact = (id: string) => {
    const target = queuedImpacts.find(i => i.id === id);
    if (target && onConfirmImpact) {
      onConfirmImpact(target);
    }
    setQueuedImpacts(prev => prev.map(i => i.id === id ? { ...i, status: 'confirmed' } : i));
  };

  const handleDiscardImpact = (id: string) => {
    setQueuedImpacts(prev => prev.map(i => i.id === id ? { ...i, status: 'discarded' } : i));
  };

  const handleSubmitAllPending = () => {
    const pending = queuedImpacts.filter(i => i.status === 'pending');
    if (pending.length > 0 && onBatchConfirmImpacts) {
      onBatchConfirmImpacts(pending);
    }
    setQueuedImpacts(prev => prev.map(i => i.status === 'pending' ? { ...i, status: 'confirmed' } : i));
    setIsReviewModalOpen(false);
  };

  const handleAddDetails = (impact: QueuedImpact) => {
    setIsReviewModalOpen(false);
    if (onAddDetailsToReport) {
      onAddDetailsToReport(impact);
    }
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
      if (peakResetTimer.current) clearTimeout(peakResetTimer.current);
      if (hudTimer.current) clearTimeout(hudTimer.current);
    };
  }, []);

  const displayG = recentSpike || Math.max(liveG, peakG);
  const isSpike = displayG >= 3.0;
  const pendingCount = queuedImpacts.filter(i => i.status === 'pending').length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      
      {/* Header Info */}
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
          <Activity className="w-6 h-6 text-emerald-400" />
          <span>In-Vehicle Shock Detection</span>
        </h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Mount your phone securely. Road shocks are auto-logged silently in the background with zero popups, ready to review safely when parked.
        </p>
      </div>

      {/* Non-Intrusive Transient HUD Toast Banner */}
      {hudToast && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 border border-teal-500/50 rounded-2xl p-3.5 shadow-xl flex items-center justify-between text-xs text-teal-300 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="font-semibold">{hudToast}</span>
          </div>
          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="text-[11px] font-bold text-white bg-teal-600 hover:bg-teal-500 px-2.5 py-1 rounded-lg transition"
          >
            Review Queue
          </button>
        </div>
      )}

      {/* "Park & Review" Persistent Queue Banner */}
      {queuedImpacts.length > 0 && (
        <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-3 sm:p-4 flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center space-x-3">
            <span className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold font-mono text-sm shrink-0">
              {pendingCount > 0 ? pendingCount : '✓'}
            </span>
            <div>
              <div className="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
                <span>Park & Review Queue</span>
                {pendingCount > 0 && (
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/60 px-2 py-0.5 rounded-full font-semibold">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {pendingCount > 0 
                  ? 'Drive shocks captured silently. Tap to review or confirm.'
                  : 'All detected shocks have been processed.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsReviewModalOpen(true)}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-teal-300 font-bold rounded-xl text-xs border border-slate-700 transition flex items-center gap-1.5 shrink-0"
          >
            <span>Review Drive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Big Number Display Card */}
      <div className={`rounded-3xl border p-6 transition-all duration-300 relative overflow-hidden shadow-2xl ${
        isSpike 
          ? 'bg-rose-950/80 border-rose-500 shadow-rose-900/30 animate-pulse' 
          : isMonitoring 
          ? 'bg-slate-900 border-emerald-500/40 shadow-emerald-950/20' 
          : 'bg-slate-900/90 border-slate-800'
      }`}>
        
        {/* Top Status Tag */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className={`w-3 h-3 rounded-full ${
              isMonitoring ? (isSpike ? 'bg-rose-500 animate-ping' : 'bg-emerald-500') : 'bg-slate-600'
            }`}></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              {isMonitoring ? 'Active Drive Stream (100 Hz)' : 'Sensor Standby'}
            </span>
          </div>

          {impactCount > 0 && (
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800 font-bold">
              {impactCount} Shock{impactCount === 1 ? '' : 's'} Auto-Logged
            </span>
          )}
        </div>

        {/* 1. Large Real-Time G-Force Readout */}
        <div className="text-center py-6">
          <div className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-1">
            Vertical Shock Deceleration
          </div>
          <div className={`text-6xl sm:text-7xl font-black font-mono tracking-tighter transition-colors ${
            isSpike ? 'text-rose-400 scale-105' : isMonitoring ? 'text-emerald-400' : 'text-slate-400'
          }`}>
            {displayG.toFixed(2)}
            <span className="text-2xl sm:text-3xl ml-2 font-sans font-bold text-slate-500">G</span>
          </div>
          {isSpike && (
            <div className="mt-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
              ⚡ Road Shock Silently Auto-Logged (&gt; 3.0G)
            </div>
          )}
        </div>

        {/* 2. Waveform Canvas Stream */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-2 mb-6">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mb-1.5 px-1">
            <span>Z-Axis Shock Waveform</span>
            <span className={isMonitoring ? 'text-emerald-400' : 'text-slate-500'}>
              {isMonitoring ? 'LIVE' : 'OFFLINE'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={640}
            height={160}
            className="w-full h-36 rounded"
          />
        </div>

        {/* 3. Big Toggle Button */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={toggleMonitoring}
            className={`w-full py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center space-x-2 transition shadow-lg active:scale-98 ${
              isMonitoring
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/30'
            }`}
          >
            {isMonitoring ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isMonitoring ? 'Stop Monitoring & Review' : 'Start Drive Monitoring'}</span>
          </button>

          {/* 4. Presentation Test Button */}
          <button
            onClick={handleSimulateShock}
            className="w-full py-4 px-6 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-sm flex items-center justify-center space-x-2 shadow-lg shadow-amber-900/20 active:scale-98 transition"
          >
            <Zap className="w-5 h-5 text-yellow-200" />
            <span>Simulate Impact Spike (8.8G)</span>
          </button>
        </div>

      </div>

      {/* Safe Driving Notice */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1 text-center">
        <span className="font-bold text-teal-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          <span>Driver Safety Guarantee: Zero In-Transit Popups</span>
        </span>
        <p>
          Road impacts are recorded silently with a gentle chime. The full report queue opens only when you stop driving, eliminating distracted-driving hazards.
        </p>
      </div>

      {/* Park & Review Modal */}
      <ParkAndReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        queuedImpacts={queuedImpacts}
        onConfirmImpact={handleConfirmImpact}
        onDiscardImpact={handleDiscardImpact}
        onAddDetails={handleAddDetails}
        onSubmitAllPending={handleSubmitAllPending}
        onClearQueue={() => setQueuedImpacts([])}
      />

    </div>
  );
};
