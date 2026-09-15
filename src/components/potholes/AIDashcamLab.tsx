import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, 
  Activity, 
  Upload, 
  Play, 
  Pause, 
  RefreshCw, 
  ShieldAlert, 
  Sparkles, 
  Zap, 
  Sliders, 
  CheckCircle2, 
  SlidersHorizontal,
  Layers
} from 'lucide-react';

const DASHCAM_FEEDS = [
  {
    id: 'pleasant-hill',
    name: 'Pleasant Hill Rd Westbound (Duluth)',
    corridor: 'Pleasant Hill Rd @ I-85 Ramp',
    image: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1000&q=80',
    boxes: [
      { x: 38, y: 56, width: 24, height: 18, label: 'Severe Cavity', conf: 95.4, depth: 5.2, widthInches: 26, color: '#ef4444' },
      { x: 68, y: 62, width: 14, height: 10, label: 'Minor Spall', conf: 82.1, depth: 1.8, widthInches: 12, color: '#eab308' }
    ],
    jurisdiction: 'City of Duluth'
  },
  {
    id: 'scenic-hwy',
    name: 'Scenic Hwy (SR 124) Commercial Corridor (Snellville)',
    corridor: 'SR 124 @ Sam\'s Club Entrance',
    image: 'https://images.unsplash.com/photo-1578991624414-276ef23a534f?auto=format&fit=crop&w=1000&q=80',
    boxes: [
      { x: 42, y: 52, width: 28, height: 22, label: 'Pothole Cluster', conf: 91.8, depth: 4.8, widthInches: 32, color: '#ef4444' }
    ],
    jurisdiction: 'City of Snellville'
  },
  {
    id: 'buford-hwy',
    name: 'Buford Hwy Freight Lane (Norcross)',
    corridor: 'US-23 @ Beaver Ruin Rd',
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1000&q=80',
    boxes: [
      { x: 30, y: 60, width: 26, height: 19, label: 'Alligator Rutting', conf: 88.6, depth: 3.5, widthInches: 20, color: '#f59e0b' }
    ],
    jurisdiction: 'City of Norcross'
  }
];

export const AIDashcamLab: React.FC = () => {
  const [selectedFeedIndex, setSelectedFeedIndex] = useState(0);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(true);
  const [detectionThreshold, setDetectionThreshold] = useState(75);
  const [showHeatOverlay, setShowHeatOverlay] = useState(true);

  // Accelerometer Telemetry state
  const [vehicleSpeed, setVehicleSpeed] = useState(42); // MPH
  const [telemetryLogs, setTelemetryLogs] = useState<{ id: string; time: string; gForce: number; location: string; status: string }[]>([
    { id: 'TEL-101', time: '14:15:22', gForce: 2.8, location: 'Pleasant Hill Rd MM 2.4', status: 'Severe Bump Tagged' },
    { id: 'TEL-102', time: '14:12:04', gForce: 2.3, location: 'Collins Hill Rd @ GGC', status: 'Moderate Impact' }
  ]);
  const [simulatedZSpike, setSimulatedZSpike] = useState(1.0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const currentFeed = DASHCAM_FEEDS[selectedFeedIndex];

  // Canvas drawing for real-time accelerometer stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;
    const points: number[] = new Array(80).fill(1.0);

    const render = () => {
      time += 0.08;
      
      // Calculate new point: normal road noise ~ 1.0G +- 0.15G
      let newPoint = 1.0 + (Math.sin(time * 3) * 0.1) + (Math.cos(time * 7) * 0.05);

      // If a bump was triggered recently
      if (simulatedZSpike > 1.2) {
        newPoint = simulatedZSpike;
        setSimulatedZSpike(prev => Math.max(1.0, prev * 0.85)); // Dampen
      }

      points.shift();
      points.push(newPoint);

      // Draw Waveform
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grid lines
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      // Threshold line at 2.2G
      const thresholdY = canvas.height - ((2.2 / 3.5) * canvas.height);
      ctx.moveTo(0, thresholdY);
      ctx.lineTo(canvas.width, thresholdY);
      ctx.strokeStyle = '#ef444488';
      ctx.stroke();

      // Baseline line at 1.0G
      const baseY = canvas.height - ((1.0 / 3.5) * canvas.height);
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      ctx.lineTo(canvas.width, baseY);
      ctx.strokeStyle = '#334155';
      ctx.stroke();

      // Waveform line
      ctx.beginPath();
      ctx.strokeStyle = '#00f5d4';
      ctx.lineWidth = 2;
      points.forEach((val, idx) => {
        const x = (idx / (points.length - 1)) * canvas.width;
        const y = canvas.height - ((val / 3.5) * canvas.height);
        if (idx === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      // Render text
      ctx.font = '10px monospace';
      ctx.fillStyle = '#ef4444';
      ctx.fillText('2.2G Pothole Threshold', 10, thresholdY - 4);
      ctx.fillStyle = '#64748b';
      ctx.fillText('1.0G Nominal Gravity', 10, baseY - 4);

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [simulatedZSpike]);

  // Handler to simulate sudden pothole bump
  const handleTriggerImpact = () => {
    const spike = 2.7 + Math.random() * 0.6; // 2.7 - 3.3 G
    setSimulatedZSpike(spike);

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const newLog = {
      id: `TEL-${Math.floor(100 + Math.random() * 900)}`,
      time: timeStr,
      gForce: parseFloat(spike.toFixed(2)),
      location: currentFeed.corridor,
      status: 'Pothole Impact Detected (> 2.2G)'
    };

    setTelemetryLogs(prev => [newLog, ...prev.slice(0, 4)]);
  };

  // User upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setCustomImage(url);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Title & Introduction */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-white">AI Dashcam Vision & Sensor Telemetry Lab</h2>
            <span className="bg-purple-950 text-purple-300 text-xs px-2.5 py-0.5 rounded-full border border-purple-800 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> Automated Pavement Edge Inference
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Demonstrates real-time computer vision bounding-box defect classification and in-vehicle 3-axis accelerometer shock profiling.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsScanning(!isScanning)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              isScanning 
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500' 
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            {isScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isScanning ? 'AI Engine Active' : 'AI Engine Paused'}</span>
          </button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dashcam Vision Video / Canvas (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
            
            {/* Feed Selector Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center space-x-1.5">
                <Camera className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-bold text-slate-200">Select Dashcam Road Sample:</span>
              </div>

              {/* Upload custom image */}
              <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-700 flex items-center gap-1 transition">
                <Upload className="w-3 h-3 text-teal-400" />
                <span>Upload Custom Photo</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            <div className="flex space-x-2 overflow-x-auto pb-2 mb-3">
              {DASHCAM_FEEDS.map((feed, idx) => (
                <button
                  key={feed.id}
                  onClick={() => {
                    setSelectedFeedIndex(idx);
                    setCustomImage(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition border ${
                    selectedFeedIndex === idx && !customImage
                      ? 'bg-purple-600/30 text-purple-200 border-purple-500'
                      : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {feed.name}
                </button>
              ))}
            </div>

            {/* Video / Image Display Area with AI Overlays */}
            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video select-none group">
              <img
                src={customImage || currentFeed.image}
                alt="Dashcam Road Surface"
                className="w-full h-full object-cover filter brightness-95"
              />

              {/* HUD / Telemetry Watermark */}
              <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="font-bold text-white">YOLOv11-GwinnettRoadNet</span>
                  <span className="text-teal-400">14.2 ms / 60 FPS</span>
                </div>
                <div className="text-slate-400 text-[10px]">
                  Corridor: {currentFeed.corridor}
                </div>
              </div>

              {/* Bounding Box Inferences */}
              {isScanning && !customImage && currentFeed.boxes.map((box, bIdx) => (
                box.conf >= detectionThreshold && (
                  <div
                    key={bIdx}
                    className="absolute border-2 rounded transition-all animate-pulse"
                    style={{
                      left: `${box.x}%`,
                      top: `${box.y}%`,
                      width: `${box.width}%`,
                      height: `${box.height}%`,
                      borderColor: box.color,
                      backgroundColor: `${box.color}20`
                    }}
                  >
                    {/* Bounding Box Label Tag */}
                    <div 
                      className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md flex items-center gap-1.5 whitespace-nowrap"
                      style={{ backgroundColor: box.color }}
                    >
                      <span>{box.label}</span>
                      <span className="font-mono">{box.conf}%</span>
                      <span className="opacity-90 font-normal">({box.depth}" depth)</span>
                    </div>

                    {/* Crosshair Target in center */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-2.5 h-2.5 border border-white/60 rounded-full"></div>
                    </div>
                  </div>
                )
              ))}

              {/* Custom Upload Simulated Box */}
              {isScanning && customImage && (
                <div
                  className="absolute border-2 border-red-500 bg-red-500/20 rounded animate-pulse"
                  style={{ left: '35%', top: '48%', width: '30%', height: '25%' }}
                >
                  <div className="absolute -top-6 left-0 bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-md flex items-center gap-1 font-mono">
                    <span>Severe Cavity: 96.1% (est. 5.0" depth)</span>
                  </div>
                </div>
              )}

              {/* Scanning Laser Sweep Effect */}
              {isScanning && (
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-teal-400/80 to-transparent top-1/2 -translate-y-1/2 animate-bounce pointer-events-none shadow-[0_0_15px_#00f5d4]"></div>
              )}
            </div>

            {/* AI Control Sliders */}
            <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <div className="flex justify-between text-slate-300 font-medium mb-1">
                  <span>Confidence Threshold:</span>
                  <span className="font-mono text-teal-400 font-bold">{detectionThreshold}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={detectionThreshold}
                  onChange={(e) => setDetectionThreshold(parseInt(e.target.value))}
                  className="w-full accent-teal-400 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60">
                <div>
                  <span className="text-slate-300 font-medium block">Auto-Dispatch Flagging:</span>
                  <span className="text-slate-400 text-[10px]">High confidence (&gt;90%) auto-generates municipal queue item</span>
                </div>
                <span className="text-emerald-400 font-bold text-xs bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                  ENABLED
                </span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Column: Accelerometer Telemetry Stream (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-full">
            
            <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-teal-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Vehicle Accelerometer Telemetry
                </h3>
              </div>
              <span className="text-[10px] bg-teal-950 text-teal-300 px-2 py-0.5 rounded border border-teal-800 font-mono">
                100 Hz IMU Stream
              </span>
            </div>

            {/* Speed & Gauge Bar */}
            <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Driving Speed</span>
                <div className="text-base font-bold text-white font-mono flex items-baseline gap-1 mt-0.5">
                  <span>{vehicleSpeed}</span>
                  <span className="text-xs text-slate-400 font-normal">MPH</span>
                </div>
              </div>

              <div className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700/60">
                <span className="text-slate-400 text-[10px] block">Live Z-Axis Force</span>
                <div className="text-base font-bold text-teal-400 font-mono flex items-baseline gap-1 mt-0.5">
                  <span>{simulatedZSpike > 1.2 ? simulatedZSpike.toFixed(2) : '1.04'}</span>
                  <span className="text-xs text-slate-400 font-normal">G-force</span>
                </div>
              </div>
            </div>

            {/* Live Waveform Canvas */}
            <div className="bg-slate-950 rounded-xl p-2 border border-slate-800 relative">
              <div className="text-[10px] text-slate-400 font-mono mb-1 flex justify-between">
                <span>Z-Axis Acceleration Waveform</span>
                <span className="text-teal-400">Live Telemetry</span>
              </div>
              <canvas
                ref={canvasRef}
                width={360}
                height={140}
                className="w-full h-36 rounded"
              />
            </div>

            {/* Interactive Bump Trigger Button */}
            <div className="mt-3">
              <button
                onClick={handleTriggerImpact}
                className="w-full bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/20 active:scale-98 transition"
              >
                <Zap className="w-4 h-4 text-yellow-300" />
                <span>Simulate Striking Pothole (Trigger Z-Axis Spike)</span>
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Spikes exceeding 2.2G trigger automated geofenced hazard alerts to Gwinnett DOT.
              </p>
            </div>

            {/* Real-time Telemetry Event Logs */}
            <div className="mt-4 flex-1">
              <span className="text-[11px] font-semibold text-slate-300 block mb-2">
                Recent Telemetry Anomaly Detections:
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                {telemetryLogs.map((log) => (
                  <div 
                    key={log.id} 
                    className="bg-slate-800/70 border border-slate-700/60 p-2 rounded-lg flex items-center justify-between"
                  >
                    <div>
                      <div className="text-slate-200 font-bold flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                        <span>{log.gForce}G Impact</span>
                        <span className="text-[10px] text-slate-400">({log.time})</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans">{log.location}</div>
                    </div>
                    <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/80 px-1.5 py-0.5 rounded">
                      Auto-Logged
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

    </div>
  );
};
