import React from 'react';
import { 
  Info, 
  MapPin, 
  LayoutDashboard, 
  Activity, 
  CheckCircle2, 
  BarChart3, 
  Volume2, 
  Type, 
  Palette, 
  ShieldAlert, 
  Database, 
  Car, 
  GraduationCap, 
  Users, 
  ExternalLink,
  ArrowRight
} from 'lucide-react';
import { ActiveTab } from '../Header';

interface AboutHelpViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const AboutHelpView: React.FC<AboutHelpViewProps> = ({ onNavigateTab }) => {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-300">
      
      {/* Hero Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
            <GraduationCap className="w-4 h-4 text-teal-400" />
            <span>Georgia Gwinnett College &bull; ITEC 4860 Senior Capstone</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            About <span className="text-teal-400">GGC SansPotholes</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 font-medium max-w-3xl leading-relaxed">
            &ldquo;Visualizing Gwinnett County, sans potholes.&rdquo;
          </p>

          <p className="text-xs sm:text-sm text-slate-400 max-w-3xl leading-relaxed">
            GGC SansPotholes is an accessible civic roadway hazard detection and commuter utility built by Georgia Gwinnett College students. The application blends dyslexia-friendly typography (Comic Sans MS), universal colorblind design (Okabe-Ito), Southern-cadence voice synthesis, and in-vehicle accelerometer telemetry to help students and commuters report road hazards without distracted driving.
          </p>

          {/* Project Team */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
            <span className="font-bold text-teal-300 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-teal-400" /> Project Authors:
            </span>
            <span className="font-medium text-slate-200">Erick Vale</span>
            <span>&bull;</span>
            <span className="font-medium text-slate-200">Tina Ly</span>
            <span>&bull;</span>
            <span className="font-medium text-slate-200">Hina Luna</span>
            <span>&bull;</span>
            <span className="font-medium text-slate-200">Peyton Holland</span>
          </div>
        </div>
      </div>

      {/* Synthetic vs Real Data Transparency Disclosure */}
      <div className="bg-amber-950/30 border border-amber-600/40 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
          <Database className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Academic Demonstration & Data Transparency Notice</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
          Because municipal public works departments (Gwinnett County DOT, City of Lawrenceville, and GDOT) do not expose public, writeable dispatch APIs or live automated camera feeds to academic student projects, this application operates on a <strong>hybrid model</strong>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-3.5 space-y-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Real Device & Client Data
            </span>
            <p className="text-slate-300 leading-relaxed">
              When using a phone or laptop with a built-in accelerometer, the <strong>Drive Sensor</strong> captures real live <code className="text-emerald-300">DeviceMotionEvent</code> hardware shock readings and actual GPS coordinates. Citizen submissions and upvotes made in the session are stored in your browser's persistent <code className="text-emerald-300">localStorage</code>.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/40 rounded-2xl p-3.5 space-y-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> Synthetic / Simulated Academic Data
            </span>
            <p className="text-slate-300 leading-relaxed">
              Seed pothole dockets and campus parking deck live occupancies are <strong>artificially generated and simulated</strong> based on real Lawrenceville road coordinates and typical traffic conditions for functional demonstration.
            </p>
          </div>
        </div>
      </div>

      {/* Feature-by-Feature Guide */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Functionality & Feature Guide
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            A comprehensive breakdown of how each tool works and how data is handled.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Map & Hazards */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Map & Hazards</h3>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Interactive Geographic Viewer
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Hybrid Data
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Full-screen interactive OpenStreetMap view centered on Georgia Gwinnett College and surrounding Lawrenceville arteries. Features landmark-first hazard titles (*Collins Hill Rd*, *Campus Loop*), dual-coded severity markers (<span className="text-red-400 font-bold">▲ Critical</span>, <span className="text-amber-400 font-bold">◆ Moderate</span>, <span className="text-emerald-400 font-bold">● Minor</span>), one-click citizen confirmations, and drop-pin reporting.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Data Disclosure:</span>
                <p>
                  Road geometry is rendered via live OpenStreetMap tiles. Seed hazards (<code className="text-slate-300 font-mono">GW-POT-*</code>) are synthetic sample incidents placed along real GGC roadways. New reports submitted by you appear immediately on your live map.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('potholes')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>Explore Hazard Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Dashboard & Parking */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Parking & Hazards</h3>
                    <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                      Commuter Telematics & Forecasts
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Simulated Data
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Consolidated overview showing high-priority road risks, community upvote counts, and real-time occupancy estimates for campus parking structures (Deck 1000, Deck 2000, Deck 3000, surface lots, and regional park-and-rides). Includes a what-if simulation engine adjusting for weather and class change rush hours.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Data Disclosure:</span>
                <p>
                  Because GGC parking decks do not provide public live gate sensor data, deck capacities and occupancy percentages are <strong>artificially modeled</strong> based on university class schedules and simulation algorithms.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('dashboard')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-teal-600 hover:text-white text-teal-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>View Parking & Hazards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3. Drive Sensor */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Drive Sensor</h3>
                    <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
                      Hands-Free Auto-Logger
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Real Hardware Sensor
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Hands-free roadway shock logger designed to eliminate distracted driving. When running on a phone in your vehicle mount, it silently captures G-force impact spikes, GPS coordinates, and jurisdiction. Impact cooldown filters out duplicate axle bounces. When you arrive safely, the <strong>Park & Review Queue</strong> lets you verify hits, add photos, or discard bumps.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Data Disclosure:</span>
                <p>
                  Uses your mobile device's physical accelerometer via the HTML5 <code className="text-slate-300 font-mono">DeviceMotionEvent</code> API and live geolocation. On desktop laptops without motion sensors, test impacts can be manually triggered via the shock generator.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('sensor')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-purple-600 hover:text-white text-purple-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>Open Drive Sensor</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. My Reports */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">My Reports</h3>
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                      User Submission Manager
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  User Client Data
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Your personal submission docket. Review all hazards you have auto-logged or submitted manually. Edit hazard details, attach camera pavement captures, observe community confirmation counts (+1 upvotes), or delete resolved road reports.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Data Disclosure:</span>
                <p>
                  All reports created in your session are saved directly to your browser's local client storage (<code className="text-slate-300 font-mono">localStorage</code>), keeping your personal submissions private on your device.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('my-reports')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>Manage My Reports</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5. Accessibility & Southern Voice Suite */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold">
                    <Type className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Accessibility & Voice Suite</h3>
                    <span className="text-[10px] font-semibold text-pink-400 uppercase tracking-wider">
                      Universal Design Tools
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Fully Functional Native
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Includes the Comic Sans MS typography toggle (enhancing readability for dyslexia), 4-step font size scaling (<code className="text-slate-300 font-mono">A−</code> to <code className="text-slate-300 font-mono">A++</code>), Okabe-Ito colorblind-safe palettes, High Contrast mode with auto-inverted map tiles, and browser Web Speech API voice synthesis in a relaxed Southern drawl.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Data Disclosure:</span>
                <p>
                  These features run entirely on your browser's native CSS variables and HTML5 SpeechSynthesis engine, without communicating with external AI servers.
                </p>
              </div>
            </div>

            <div className="mt-3 py-2 px-3 rounded-xl bg-slate-800/50 text-slate-400 text-xs text-center border border-slate-700/50">
              Controlled via the persistent top bar beneath the header
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};
