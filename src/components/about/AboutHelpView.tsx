import React from 'react';
import { 
  Info, 
  MapPin, 
  LayoutDashboard, 
  Activity, 
  CheckCircle2, 
  Volume2, 
  Type, 
  ShieldAlert, 
  Database, 
  Car, 
  GraduationCap, 
  Users, 
  ExternalLink,
  ArrowRight,
  Camera,
  FileDown,
  Mail,
  Smartphone,
  Navigation,
  ShieldCheck
} from 'lucide-react';
import { ActiveTab } from '../Header';

interface AboutHelpViewProps {
  onNavigateTab: (tab: ActiveTab) => void;
  onOpenReportModal?: () => void;
}

export const AboutHelpView: React.FC<AboutHelpViewProps> = ({ 
  onNavigateTab,
  onOpenReportModal 
}) => {
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
            GGC SansPotholes is an accessible civic roadway hazard detection and commuter utility built by Georgia Gwinnett College students. The application blends dyslexia-friendly typography (Comic Sans MS), universal colorblind design (Okabe-Ito), Southern-cadence voice synthesis, hardware-accelerated mobile accelerometer telemetry, and verified geographic map screenshot capture to help students and commuters report road hazards accurately without distracted driving.
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

      {/* Capstone PowerPoint Presentation Download Card */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase tracking-wide">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Capstone Deliverable • 12 Slides (.pptx)</span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">
            GGC SansPotholes: Branch Evolution Presentation
          </h2>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Download the official 12-slide PowerPoint presentation formatted entirely in <strong>Comic Sans MS</strong> with GGC branding, comparing <code>pholland10132026</code> vs. <code>pholland10202026</code> with full presenter speaker notes.
          </p>
        </div>

        <a
          href="/GGC_SansPotholes_Branch_Evolution_Presentation.pptx"
          download="GGC_SansPotholes_Branch_Evolution_Presentation.pptx"
          className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg transition active:scale-95 whitespace-nowrap shrink-0 border border-teal-400/40"
        >
          <FileDown className="w-4 h-4" />
          <span>Download Presentation (.pptx)</span>
        </a>
      </div>

      {/* Data Transparency & Real Evidence Policy Notice */}
      <div className="bg-amber-950/30 border border-amber-600/40 rounded-3xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-300 font-bold text-sm sm:text-base">
          <Database className="w-5 h-5 text-amber-400 shrink-0" />
          <span>Data Integrity & Real-Evidence Model</span>
        </div>
        <p className="text-xs sm:text-sm text-amber-200/90 leading-relaxed">
          To maintain rigorous data integrity, all <strong>synthetic stock photos, artificial cavity diameters, and synthetic pavement depths have been retired</strong>. Instead, the application exclusively captures and displays <strong>real physical hardware sensor metrics</strong> and <strong>verified geospatial evidence</strong>:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
          <div className="bg-slate-900/80 border border-emerald-500/40 rounded-2xl p-3.5 space-y-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-emerald-400">
              <Activity className="w-4 h-4 text-emerald-400" /> Physical Hardware Telemetry
            </span>
            <p className="text-slate-300 leading-relaxed">
              Real G-force impact readings measured directly by your device's physical accelerometer (<code className="text-emerald-300">DeviceMotionEvent</code>). Baseline gravity is automatically filtered, registering actual vehicular shock spikes (e.g. <strong>7.80G</strong> or <strong>8.80G</strong>) against calibrated impact thresholds.
            </p>
          </div>

          <div className="bg-slate-900/80 border border-teal-500/40 rounded-2xl p-3.5 space-y-1.5">
            <span className="inline-flex items-center gap-1 font-bold text-teal-400">
              <Camera className="w-4 h-4 text-teal-400" /> Verified Map Screenshots
            </span>
            <p className="text-slate-300 leading-relaxed">
              Rather than attaching placeholder stock imagery, the report system uses an HTML5 canvas tile-stitcher to generate a <strong>verified visual screenshot of the centralized map location</strong> centered around the shock coordinates, directly embedded into reports and PDF work order dockets.
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
            A comprehensive breakdown of how each tool works and how data is processed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* 1. Drive Sensor (Hardware Accelerometer) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold">
                    <Activity className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Drive-Time Mapping & Sensor</h3>
                    <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                      Turnkey Route Patrol & Incident Readout
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Real Hardware Sensor
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Full-featured drive session patrol combining physical mobile accelerometer telemetry with GPS path mapping. Safely start at the beginning of a commute and terminate upon arrival: automatically maps the driven route polyline, detects and logs significant pothole shocks with reverse-geocoded addresses, and generates a turnkey Drive Patrol Summary Report with certified PDF download.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1.5 border border-slate-700/50">
                <span className="font-semibold text-slate-200 flex items-center gap-1">
                  <Smartphone className="w-3.5 h-3.5 text-teal-400" /> Mobile Hardware Compatibility & Waveform:
                </span>
                <p>
                  Optimized for mobile browsers including Android flagships (such as the <strong>Samsung Galaxy S25 Ultra</strong> on Firefox and Chrome) and iOS over secure HTTPS. Features a live real-time oscilloscope waveform, sensitivity calibrator, axle bounce cooldown, and instant 1-tap test shock generator.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('sensor')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm"
            >
              <span>Launch Drive-Time Mapping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 2. Road Hazard Reporting & Location Snapshot Engine */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Hazard Reporting & Map Snapshot</h3>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
                      Geocoded Intake & Evidence Capture
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/10 text-teal-300 border border-teal-500/30">
                  Automated Evidence
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Streamlined intake modal designed for quick field triage on any screen:
              </p>

              <ul className="text-[11px] text-slate-300 space-y-1.5 pl-3 list-disc">
                <li>
                  <strong>Nearest Street Address</strong>: Auto-resolves specific street and building numbers (e.g. <em>1000 University Center Ln, Lawrenceville, GA</em>) via reverse geocoding, hiding raw GPS coordinates.
                </li>
                <li>
                  <strong>Centralized Mini-Map</strong>: Live interactive map centered around the exact shock location with tap-to-reposition fine-tuning.
                </li>
                <li>
                  <strong>Automated Map Snapshot</strong>: Stitches canvas tiles and exports a certified screenshot image with pulsing radar pin and GPS overlay.
                </li>
                <li>
                  <strong>Direct Testing Dispatch</strong>: Dispatches reports directly to <code className="text-teal-300 font-mono">peyton.holland@gmail.com</code>.
                </li>
              </ul>
            </div>

            {onOpenReportModal ? (
              <button
                onClick={onOpenReportModal}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Report a Road Hazard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => onNavigateTab('potholes')}
                className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
              >
                <span>Explore Map & Report</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* 3. Certified Incident PDF Dockets */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">
                    <FileDown className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Incident PDF Docket Generator</h3>
                    <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider">
                      Municipal Public Works Export
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                  Certified Export
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Generates a clean, single-page official municipal work order notice formatted for public works departments (Gwinnett County DOT, Lawrenceville Public Works, and GDOT).
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Docket Components:</span>
                <p>
                  Includes unique incident tracking codes (<code className="text-slate-300 font-mono">GAP-2026-*</code>), assigned jurisdiction routing, digital Google Maps coordinates, measured shock telemetry, citizen notes, supervisor signoff blocks, and <strong>Section 4: Verified Geospatial Location Map Snapshot</strong> embedding the captured map image.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('my-reports')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-blue-600 hover:text-white text-blue-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>View Reports & Download Dockets</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 4. Map & Hazards Viewer */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Map & Hazards</h3>
                    <span className="text-[10px] font-semibold text-teal-400 uppercase tracking-wider">
                      Interactive Geographic Viewer
                    </span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Hybrid Data
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                Full-screen interactive OpenStreetMap view that automatically defaults to your physical GPS location on launch (with quick toggles for GGC Campus and All Gwinnett). Features a predominant 1-click launcher for <strong>Drive-Time Mapping</strong>, a pulsing live user GPS radar beacon, landmark-first hazard titles (*Collins Hill Rd*, *Campus Loop*), dual-coded severity markers (<span className="text-red-400 font-bold">▲ Critical</span>, <span className="text-amber-400 font-bold">◆ Moderate</span>, <span className="text-emerald-400 font-bold">● Minor</span>), one-click citizen confirmations, and drop-pin reporting.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Hazard Inspector Drawer:</span>
                <p>
                  Clicking any hazard opens the inspection drawer containing a centralized Leaflet mini-map, Google Maps external jump link, hardware sensor shock telemetry readings, and instant PDF docket generation.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('potholes')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-teal-600 hover:text-white text-teal-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>Explore Hazard Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5. Dashboard & Parking Telematics */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Parking & Hazards</h3>
                    <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-wider">
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
              className="mt-3 w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-emerald-600 hover:text-white text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>View Parking & Hazards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 6. Accessibility & Southern Voice Suite */}
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
                Includes the Comic Sans MS typography toggle (enhancing readability for dyslexia), 4-step font size scaling (<code className="text-slate-300 font-mono">A−</code> to <code className="text-slate-300 font-mono">A++</code>), Okabe-Ito colorblind-safe palettes, High Contrast mode with auto-inverted map tiles, and browser Web Speech API voice synthesis in a relaxed Southern cadence.
              </p>

              <div className="bg-slate-800/50 rounded-xl p-2.5 text-[11px] text-slate-400 space-y-1 border border-slate-700/50">
                <span className="font-semibold text-slate-200 block">Privacy Guarantee:</span>
                <p>
                  These accessibility features run entirely on your browser's native CSS variables and HTML5 SpeechSynthesis engine without transmitting user audio or preferences to external servers.
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
