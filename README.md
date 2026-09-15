# 🚗 Georgia Pothole Patrol & Transportation Dispatch Hub
### Georgia Gwinnett College (GGC) Campus Pilot & Full Gwinnett County Coverage

An app in very early development by a group of four students at Georgia Gwinnett College (Tina Ly, Hina Luna, Erick Vale, Peyton Holland), designed with Google Antigravity as part of Georgia Gwinnett College
Software Development Capstone Class ITEC4860. This app is designed to allow for the detection of potholes by utilizing the gyroscopic capabilities of a stationary mobile device to detect when potholes are struck,
allowing for the mapping of those incidences centered to GPS coordinates, and an avenue with which to report them to the relevant departmental authorities for resolution. This is the first iteration of this project,
uploaded 9/15/2026. We are actively working to maintain, develop, and focus the scope of this app as a viable utility.

---

## 🌟 Key Highlights & Unified Capabilities

### 1. 🎓 GGC Campus & 16 Gwinnett Municipalities Mapping
- **Dual View Scope Switcher**:
  - `🎓 GGC Campus Focus`: Interactive Leaflet map centered on Georgia Gwinnett College (`33.9798, -84.0017`) with the official green & gold 1-mile search radius boundary circle. Automatically calculates the exact distance in miles from the GGC student center for every hazard.
  - `🗺️ Full Gwinnett County`: Expands to cover all 16 Gwinnett municipalities, unincorporated county roads under Gwinnett County DOT (GCDOT), and state routes/interstates (GA-316, I-85, US-78) under GDOT District 1.
- **Municipal Quick Jump Presets**: Jump directly to GGC Campus, Downtown Lawrenceville, Suwanee Town Center, Historic Duluth, Peachtree Corners (Curiosity Lab), Historic Norcross, Snellville, Buford, and GA-316/I-85.
- **Interactive Pinpoint & Reverse Geocoding**: Click anywhere on the map or drag pins to reverse geocode the street address via OpenStreetMap Nominatim with offline campus fallback.

### 2. ⚡ In-Vehicle Sensor Mode & Mobile Pothole Detection (No Expo Go Needed!)
- **Hardware Telemetry via HTML5 Sensor APIs**:
  - Uses `DeviceMotionEvent` directly in iOS Safari and Android Chrome to monitor real-time 3-axis accelerometer shock profiles at 100 Hz.
  - Detects sudden vertical deceleration spikes ($G$-force $> 3.5G - 8.8G$) caused by hitting road cavities or potholes while driving.
  - Triggers haptic phone vibration (`navigator.vibrate`), automatically queries current GPS coordinates, and opens the reporting docket pre-filled with the impact telemetry and marked as `CRITICAL` axle-risk severity.
- **Desktop Simulator Button**: Includes a `Simulate Spike (8.8G)` button to immediately test sensor mode without being in a moving vehicle.
- **Direct Camera Capture**: Uses `<input type="file" accept="image/*" capture="environment">` to activate the smartphone's native camera shutter without requiring an app store download.
- **PWA Ready**: Can be installed to the phone's home screen ("Add to Home Screen"), opening in full-screen standalone mode without any browser URL bars.

### 3. 📄 Certified Incident Dockets & Multi-Tier Reporting
- **Certified PDF Incident Docket**: Generates an official, signed PDF document client-side with tracking code (e.g., `GAP-2026-1042`), GPS coordinates, Google Maps navigation link, responsible agency routing, and public works work order sign-off blocks.
- **GGC Plain-Text Report Generator**: Generates formatted text inventory with mileage distances from campus center and student prototype notice, downloadable as `.txt`.
- **SeeClickFix / Cityworks CRM JSON**: Structured JSON payload compatible with municipal CRM and 311 systems.
- **Direct Email Dispatch (`mailto:`)**: Generates pre-formatted work orders directly to `facilities@ggc.edu`, `dotcustomerservice@gwinnettcounty.com`, `District1Dispatch@dot.ga.gov`, or municipal public works.

### 4. 🏛️ Authority & Dispatcher Hub (`/admin` capabilities)
- **Live Operations Dashboard**: Real-time KPI counters for Total Reports, Pending Review, Dispatched, Scheduled, Repaired, GGC Campus Queue, and Axle-Risk Criticals.
- **Status Lifecycle Management**: Update work order lifecycles (`REPORTED` -> `INVESTIGATING` -> `SCHEDULED` -> `REPAIRED`).
- **Multi-Agency Filtering**: Filter by GGC Campus, Gwinnett County DOT, GDOT Highway, or Municipal Cities.
- **CSV Export**: Export all active work orders for municipal maintenance road crews.

### 5. 🔬 AI Dashcam Defect Vision Lab & Waveform Stream
- **YOLO Road Defect Edge Inference**: Computer vision bounding box simulator with confidence threshold slider, estimated depth/width, laser sweep animation, and custom photo upload.
- **Real-Time 100 Hz Canvas Waveform**: Interactive HTML5 canvas visualizer showing live Z-axis gravity, 2.2G pothole threshold line, and 1.0G baseline.

### 6. 🚗 Campus & Regional Parking Forecaster
- **Commute & Parking Intelligence**: Monitored parking capacity across GGC campus decks and regional shopping hubs with class-change surge and weather impact modeling.

---

## 🏛️ Gwinnett Jurisdictions & Routing Directory

| Agency / Tier | Coverage Area | Department / Contact | SLA Turnaround |
| :--- | :--- | :--- | :--- |
| **GGC Facilities** | GGC campus roads, parking decks/lots, Lonnie Harvel Way | Campus Operations (`facilities@ggc.edu`) | 24 to 48 hours |
| **Gwinnett County DOT** | All unincorporated county roads & bridges | Road Maintenance (`dotcustomerservice@gwinnettcounty.com`) | 3 to 5 days |
| **GDOT District 1** | I-85, I-985, GA-316, US-78, GA-120, GA-20 | Highway Maintenance (`District1Dispatch@dot.ga.gov` / 511) | 3 to 5 days |
| **Lawrenceville Public Works** | City of Lawrenceville municipal streets & square | Public Works (`publicworks@lawrencevillega.org`) | 48 to 72 hours |
| **Duluth Public Works** | City of Duluth municipal roads & Main St | Public Works (`publicworks@duluthga.net`) | 48 to 72 hours |
| **Suwanee Public Works** | City of Suwanee municipal roads & Town Center | Public Works (`publicworks@suwanee.com`) | 48 to 72 hours |
| **Peachtree Corners Public Works**| Town Center & Curiosity Lab autonomous test corridor | Public Works (`publicworks@peachtreecornersga.gov`) | 48 to 72 hours |
| **Norcross Public Works** | Historic Norcross & Buford Hwy corridors | Public Works (`publicworks@norcrossga.net`) | 48 to 72 hours |
| **Snellville Public Works** | City of Snellville municipal roads & Scenic Hwy | Public Works (`publicworks@snellville.org`) | 48 to 72 hours |
| **Lilburn Public Works** | City of Lilburn municipal streets & Main St | Public Works (`publicworks@cityoflilburn.com`) | 48 to 72 hours |
| **Buford Public Works** | City of Buford municipal roadways & Mall of GA | Public Works (`publicworks@cityofbuford.com`) | 48 to 72 hours |

---

## 🚀 Quickstart Guide

### 1. Launch the Development Server
```bash
cd C:\Users\peyto\.gemini\antigravity\scratch\ggc-pothole-patrol

# Start the interactive app
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### 2. Build for Production
```bash
npm run build
```
Creates an optimized static bundle in the `dist/` directory ready for deployment to any static host (Netlify, Vercel, GitHub Pages, Firebase, AWS S3).

---

## 📱 Mobile Web / Smartphone Use (No App Store / No Expo Go)

1. Open the app link on your phone's browser (Safari on iPhone or Chrome on Android).
2. Tap **Share** (iOS Safari) or **Menu ⋮** (Android Chrome) and select **"Add to Home Screen"**.
3. The app will install directly as a standalone PWA with its own icon and splash screen.
4. When driving or riding around campus or Gwinnett County, tap **"Start Drive Sensor"** in the top banner. The app will monitor vertical shocks in real time and automatically prompt you to log hazardous potholes upon impact.
