import React, { useState, useEffect, useRef } from 'react';
import { Activity, Zap, AlertTriangle, ShieldCheck, Volume2 } from 'lucide-react';

interface SensorBannerProps {
  onImpactDetected: (gForce: number) => void;
}

export const SensorBanner: React.FC<SensorBannerProps> = ({ onImpactDetected }) => {
  const [isActive, setIsActive] = useState(false);
  const [currentG, setCurrentG] = useState(1.0);
  const [peakG, setPeakG] = useState(1.0);
  const [hasImpact, setHasImpact] = useState(false);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const peakResetTimerRef = useRef<number | null>(null);

  const BUMP_THRESHOLD_G = 3.5; // Threshold for road vibration spike

  const handleMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc) return;

    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;

    // Magnitude normalized to Earth gravity (9.80665 m/s^2)
    const total = Math.sqrt(x * x + y * y + z * z) / 9.80665;
    setCurrentG(total);

    if (total > peakG) {
      setPeakG(total);
      if (peakResetTimerRef.current) clearTimeout(peakResetTimerRef.current);
      peakResetTimerRef.current = window.setTimeout(() => setPeakG(1.0), 3000);
    }

    if (total >= BUMP_THRESHOLD_G) {
      triggerImpactAlert(total);
    }
  };

  const triggerImpactAlert = (gForce: number) => {
    setHasImpact(true);
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 100, 200]);
      } catch {
        // Haptics not allowed
      }
    }

    onImpactDetected(parseFloat(gForce.toFixed(2)));
    setTimeout(() => setHasImpact(false), 4000);
  };

  // handleMotion is a new function on every render (about 100 a second while sensing),
  // so add and remove must use one stable listener. Before, "Pause Sensor" removed a
  // different copy than the one added: the banner said STANDBY while impacts still fired.
  const latestHandleMotion = useRef(handleMotion);
  useEffect(() => {
    latestHandleMotion.current = handleMotion;
  });
  const [motionListener] = useState(() => (event: DeviceMotionEvent) => latestHandleMotion.current(event));

  const toggleSensor = async () => {
    if (isActive) {
      window.removeEventListener('devicemotion', motionListener);
      setIsActive(false);
      return;
    }

    // iOS 13+ permission request
    const deviceMotion = window.DeviceMotionEvent as unknown as {
      requestPermission?: () => Promise<'granted' | 'denied'>;
    };

    if (typeof deviceMotion?.requestPermission === 'function') {
      try {
        const res = await deviceMotion.requestPermission();
        if (res === 'granted') {
          setPermissionState('granted');
          window.addEventListener('devicemotion', motionListener);
          setIsActive(true);
        } else {
          setPermissionState('denied');
          alert('Device motion sensor access was denied. You can still test sensor mode using the simulation button below.');
        }
      } catch (err) {
        console.error(err);
      }
    } else if ('ondevicemotion' in window) {
      window.addEventListener('devicemotion', motionListener);
      setIsActive(true);
    } else {
      setIsActive(true);
    }
  };

  useEffect(() => {
    return () => {
      window.removeEventListener('devicemotion', motionListener);
      if (peakResetTimerRef.current) clearTimeout(peakResetTimerRef.current);
    };
  }, [motionListener]);

  return (
    <div className={`transition-all duration-300 border-b ${
      hasImpact
        ? 'bg-rose-950/90 border-rose-600 text-white animate-pulse'
        : isActive
        ? 'bg-emerald-950/40 border-emerald-800/60 text-slate-200'
        : 'bg-slate-900/80 border-slate-800 text-slate-300'
    } px-4 py-2.5`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs">
        
        {/* Left: Indicator & Info */}
        <div className="flex items-center space-x-3">
          <div className="relative flex h-3 w-3 shrink-0">
            {isActive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            )}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${
              isActive ? (hasImpact ? 'bg-rose-500' : 'bg-emerald-500') : 'bg-slate-600'
            }`}></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-teal-400" />
                In-Vehicle Shock & Vibration Telemetry
              </span>
              <span className={`px-2 py-0.2 text-[10px] font-semibold rounded-full border ${
                isActive
                  ? 'bg-emerald-950 text-emerald-300 border-emerald-700'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isActive ? 'ACTIVE (MONITORING 100Hz)' : 'STANDBY'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
              Continuous accelerometer sampling. Striking a pothole while driving triggers auto-pinpoint GPS and flags critical severity.
            </p>
          </div>
        </div>

        {/* Right: Metrics & Controls */}
        <div className="flex items-center space-x-3">
          {/* Live G-Meter */}
          <div className="flex items-center space-x-2 bg-slate-950/80 border border-slate-800 px-3 py-1.5 rounded-lg font-mono">
            <span className="text-[10px] text-slate-400">Live Z-Spike:</span>
            <span className={`font-bold text-xs ${
              hasImpact ? 'text-rose-400 animate-bounce' : currentG > 2.0 ? 'text-amber-400' : 'text-teal-400'
            }`}>
              {Math.max(currentG, peakG).toFixed(2)} G
            </span>
          </div>

          {/* Desktop Simulator Button */}
          <button
            onClick={() => triggerImpactAlert(8.4 + Math.random() * 1.2)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white font-semibold transition active:scale-95 shadow shadow-amber-600/20"
            title="Simulate a sudden vertical pothole shock spike"
          >
            <Zap className="w-3.5 h-3.5 text-yellow-200" />
            <span>Simulate Spike (8.8G)</span>
          </button>

          {/* Toggle Sensor Button */}
          <button
            onClick={toggleSensor}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              isActive
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <span>{isActive ? 'Pause Sensor' : 'Start Drive Sensor'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
