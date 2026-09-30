# 🚗 Georgia Pothole Patrol & Smart-Commute Transportation Hub
### Georgia Gwinnett College (GGC) Campus Pilot & Gwinnett County Coverage

An application developed by students at **Georgia Gwinnett College** (Tina Ly, Hina Luna, Erick Vale, Peyton Holland), designed with Google Antigravity as part of the **ITEC 4860 Software Development Capstone Project**.

The platform is a unified **smart-commute and civic infrastructure hub** that pairs automated in-vehicle road hazard detection with simulated campus parking forecasting and cross-jurisdictional municipal work order routing across GGC Facilities, Gwinnett County DOT, GDOT District 1, and 8 Gwinnett municipal public works departments.

---

## 🏗️ Architecture: Browser App + Mobile Sensor (Local Demo)

The system is architected as a lightweight, client-side **browser application + mobile sensor demo** designed for single-user evaluation:

* **Frontend SPA**: Built with React 19, TypeScript, and Tailwind CSS bundled via Vite. Provides a responsive desktop dispatcher hub and mobile-friendly view.
* **Mobile Sensor Client**: Utilizes the mobile browser's HTML5 `DeviceMotionEvent` accelerometer API. When mounted inside a vehicle, it samples vertical $G$-forces in real time to capture road impacts. (Note: physical mobile browsers require a secure HTTPS context to grant accelerometer permissions).
* **Single-User Local Demo**: All hazard reports, tracked spot counters, and review edits are persisted directly in browser `localStorage`. No centralized cloud backend or multi-tenant database is currently running.
* **Simulated Models & Client-Side Engine**: Incorporates simulated parking occupancy load curves, on-device reverse geocoding via OpenStreetMap Nominatim, interactive mapping via Leaflet, and client-side PDF incident docket generation via `jspdf`.

---

## 🌟 Key Highlights & System Features

### 1. ⚡ Silent In-Vehicle Sensor & 3x Spot Hit Detection
* **Zero Driver Distraction**: Runs 100% silently in the background with **zero popups, zero sounds/chimes, and zero phone vibrations** while driving.
* **3-Hit Proximity Clustering**: Single bumps or speed tables do not create instant public tickets. The system clusters shocks within a **~115-foot radius (`0.022` miles)** based on coordinate distance. Shocks 1 and 2 increment the strike counter quietly. On the **3rd strike**, the hazard is promoted to an official report.
* **10-Second Cooldown & GPS Serialization**: To prevent multi-axle bounces from a single pothole from registering as multiple hits, the sensor enforces a 10-second cooldown and restricts the device to a single in-flight GPS request at a time. Failed GPS lookups do not log a hit or consume the cooldown.
* **"Possible Road Hazard" Labeling & Sensor Evidence**: Reports created via sensor strikes are labeled as *"Possible Road Hazard"* (rather than treating motion data as definitive proof of a pothole) and raw sensor strikes are kept separate from citizen confirmations (`verificationsCount`). Each report captures an attached `SensorEvidence` record (number of nearby impacts, highest $G$-force recorded, and first & latest detection timestamps) displayed in the incident details drawer.
* **100 Hz Real-Time Waveform**: HTML5 canvas visualizer graphing vertical deceleration ($G$-forces), 3.0G impact threshold line, and 1.0G gravitational baseline.
* **Demo Simulation Controls**: Built-in *"Simulate Hit on Same Spot (Click 3x to Verify)"* control allowing instructors and evaluators to test multi-hit clustering on demand without driving or configuring HTTPS sensors.

### 2. 📋 "My Reports" Tracking & In-Place Edit/Review
* **Full Reports Inventory**: Displays the complete persistent list of hazards, including both citizen submissions and 3x-verified sensor reports.
* **Optional In-Place Review & Editing**: Each report card features an **"Edit / Review"** button opening a dedicated modal to:
  * Customize report titles, landmark notes, and cross-street descriptions.
  * Adjust severity levels (`minor`, `moderate`, `severe`, `critical axle-risk`).
  * Modify pavement surface types and estimated dimensions (depth/width).
  * Attach or update site photos with automated canvas compression.
  * Delete or discard false alarms.
* **Persistent Storage & Quota Protection**: Uploaded camera photos are automatically scaled and compressed to compact JPEG Data URIs (~30–50 KB), preserving photos permanently across browser sessions and reloads without exceeding the 5 MB `localStorage` limit.

### 3. 🗺️ GGC Campus & 8 Gwinnett Municipalities Mapping
* **Dual View Scope Switcher**:
  * `🎓 GGC Campus Focus`: Interactive Leaflet map centered on Georgia Gwinnett College (`33.9798, -84.0017`) with the official green & gold 1-mile search radius circle. Automatically calculates exact driving distance from the GGC Student Center for every hazard.
  * `🗺️ Full Gwinnett County`: Expands to cover 8 Gwinnett municipalities, unincorporated county roads under Gwinnett County DOT (GCDOT), and state routes/interstates (GA-316, I-85, US-78) under GDOT District 1.
* **Municipal Quick-Jump Presets**: Jump directly to GGC Campus, Downtown Lawrenceville, Suwanee Town Center, Historic Duluth, Peachtree Corners (Curiosity Lab), Historic Norcross, Snellville, Buford, and GA-316/I-85.
* **Interactive Pinpoint & Reverse Geocoding**: Tap anywhere on the map to reverse-geocode street addresses via OpenStreetMap Nominatim with offline campus fallback.

### 4. 🏛️ Automated Multi-Agency Jurisdiction Routing
When a hazard is reported, the system automatically classifies the responsible agency using coordinate polygon containment, municipal bounding boxes, and roadway keywords across 8 Gwinnett cities, Gwinnett County DOT, GDOT, and GGC:

| Agency / Tier | Coverage Area | Department / Contact | SLA Turnaround |
| :--- | :--- | :--- | :--- |
| **GGC Facilities** | GGC campus roads, parking decks/lots, Lonnie Harvel Way | Campus Operations (`facilities@ggc.edu`) | 24 to 48 hours |
| **Gwinnett County DOT** | All unincorporated county roads & bridges | Road Maintenance (`dotcustomerservice@gwinnettcounty.com`) | 3 to 5 days |
| **GDOT District 1** | I-85, I-985, GA-316, US-78, GA-120, GA-20 | Highway Maintenance (`District1Dispatch@dot.ga.gov` / 511) | 3 to 5 days |
| **Lawrenceville Public Works** | City of Lawrenceville municipal streets & square | Public Works (`publicworks@lawrencevillega.org`) | 48 to 72 hours |
| **Duluth Public Works** | City of Duluth municipal roads & Main St | Public Works (`publicworks@duluthga.net`) | 48 to 72 hours |
| **Suwanee Public Works** | City of Suwanee municipal roads & Town Center | Public Works (`publicworks@suwanee.com`) | 48 to 72 hours |
| **Peachtree Corners Public Works**| Town Center & Curiosity Lab autonomous corridor | Public Works (`publicworks@peachtreecornersga.gov`) | 48 to 72 hours |
| **Norcross Public Works** | Historic Norcross & Buford Hwy corridors | Public Works (`publicworks@norcrossga.net`) | 48 to 72 hours |
| **Snellville Public Works** | City of Snellville municipal roads & Scenic Hwy | Public Works (`publicworks@snellville.org`) | 48 to 72 hours |
| **Lilburn Public Works** | City of Lilburn municipal streets & Main St | Public Works (`publicworks@cityoflilburn.com`) | 48 to 72 hours |
| **Buford Public Works** | City of Buford municipal roadways & Mall of GA | Public Works (`publicworks@cityofbuford.com`) | 48 to 72 hours |

### 5. 📄 Incident Dockets & Work Order Dispatch
* **PDF Incident Docket**: Generates a formatted work order PDF document client-side using `jspdf` containing tracking codes (`GAP-2026-XXXXXXXX`), GPS coordinates, Google Maps navigation links, responsible agency routing, and public works work order sign-off blocks.
* **Direct Email Dispatch (`mailto:`)**: Generates pre-formatted work orders directly to campus facilities, county DOT, GDOT dispatch, or municipal public works.
* **Sanitized CSV Export**: Exports work orders for road crews with OWASP formula injection protection (`=`, `+`, `-`, `@` prefix escaping).
* **Collision-Free Tracking IDs**: Uses native `crypto.randomUUID()` to generate unique database keys (`GW-POT-UUID`) and collision-free tracking numbers.

### 6. 🚗 Simulated Campus & Regional Parking Forecaster
* **Commute & Parking Intelligence**: Algorithmic load modeling across GGC campus decks (Deck 1, Lot A, Lot B, Lonnie Harvel) and regional hubs (Costco Duluth, Mall of GA, Sugarloaf Mills).
* **Predictive Rush Curves**: Simulated parking load curves based on hour of day, weekend rush, weather factors, and GGC class-change turnover periods (10:45 AM, 12:15 PM, 1:45 PM).

---

## 🤖 AI Got Wrong: Design Iteration Case Study

During development, our team utilized AI assistants (Google Antigravity and Claude) for rapid prototyping and architecture. A critical design iteration occurred around driver safety and hazard detection:

### 1. The Original AI Mistake: A Modal on Every Bump
The AI assistant's initial implementation opened an interactive popup modal **on every single bump detected while driving**. Popping up an interactive form while a driver is moving at 50 mph introduced an immediate, dangerous distraction hazard.

### 2. Our Prompt Attempt (9/22, via Antigravity)
To eliminate the in-drive popup, we prompted the AI:
> *"For purposes of a fix to better gather data, we would like the app to have the capability to run silently in the background and auto-log hazard events. After the drive, it should compile all the reports and show for review or editing. When a bump occurs while driving, the app silently captures the telemetry (G-force, time, GPS location, and jurisdiction) in the background with a subtle audio chime or haptic vibration..."*

However, our prompt introduced its own flaws: asking for an audio chime/vibration on bumps and a post-drive queue.

### 3. What Was Wrong: The Skeptical PM Critique
The AI turned the post-drive queue into a forced daily review pop-up each morning, while retaining chime/vibration alerts on every hit. A skeptical PM critique (from Claude) challenged the entire premise:
> *"You identified the right problem—popping up a modal while someone is driving at 50 mph is dangerous. However, your proposed solution trades a driving safety problem for a technical impossibility and an unrealistic user burden."*

* **Daily pop-ups = another distraction hazard**: Forcing drivers through a mandatory morning modal queue creates friction, cognitive burden, and alert fatigue.
* **Chime/vibration on every bump = noise overload and battery drain**: Firing audio or haptic feedback on every road bump drains device batteries and startles drivers—*"hitting the pothole is already noise enough."*

### 4. How We Fixed It
* **Zero Audio & Zero Vibration**: Eliminated all chimes and vibrations during driving.
* **3-Hit Proximity Threshold (~115 ft / 0.022 mi)**: Clusters impacts within a ~115 ft radius. Shocks 1 and 2 increment strike counters silently; only the 3rd strike promotes the hazard to a report.
* **10-Second Cooldown & Serialized GPS**: Added a 10-second cooldown and restricted the sensor to one GPS lookup at a time to prevent multiple axle bounces from registering as separate hits. Failed GPS calls do not log hits or waste the cooldown.
* **Labeled as "Possible Road Hazard" with Sensor Evidence**: Distinguishes motion telemetry from citizen confirmations, tagging reports with impact counts, highest $G$-force, and detection timestamps.
* **Optional Review in "My Reports"**: No forced daily pop-up queues, morning modals, or push notifications. Users review, edit, or discard reports at their leisure.
* **Logged 9/29 as Formal GitHub Test Issue**: Documented edge cases covering the ~115 ft radius clustering, cooldown window, boundary conditions, sensitivity thresholds, and invalid input handling.

---

## 🧭 Navigation & Tab Guide

1. **Dashboard (`UnifiedDashboard`)**: Executive overview combining simulated parking congestion indicators, urgent critical road hazard counters, and quick dispatch shortcuts.
2. **Hazard Map (`PotholeMapView`)**: Full-screen interactive OpenStreetMap view with custom severity pins, quick-jump municipal presets, and radius circles.
3. **Drive Sensor (`DriveSensorView`)**: In-vehicle monitoring screen showing live accelerometer readings, 3x spot hit clustering list, and demo simulator buttons.
4. **My Reports (`MyReportsView`)**: Complete list of user-submitted and 3x-verified reports with in-place review, editing, and photo attachment.
5. **Authority Hub (`AuthorityHubView`)**: Multi-agency dispatch desk for filtering work orders by city, updating repair status lifecycles, and exporting CSV work orders.
6. **Analytics (`PotholeAnalyticsView`)**: Pavement condition index (PCI) charts, severity breakdown graphs, and recurring corridor risk rankings.

---

## 🚀 Quickstart & Setup Guide

### Prerequisites
* **Node.js**: v18.0.0 or higher
* **npm**: v9.0.0 or higher
* Modern web browser (Chrome, Edge, Safari, Firefox)

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch Local Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### 3. Phone Testing & HTTPS Sensor Requirements
When testing on a mobile device, please note:
* **Standard Vite Environment**: Vite runs an HTTP development server. It does not output mobile QR codes in the terminal and cannot be opened via Expo Go (which is intended for React Native applications).
* **HTTPS Requirement for Motion Sensors**: Modern mobile browsers (iOS Safari and Android Chrome) **restrict the HTML5 `DeviceMotionEvent` accelerometer API to secure contexts (`HTTPS`)** or `localhost`. Accessing the dev server via plain `http://<local-ip>:5173` on a mobile device will block sensor access.
* **How to Test on Mobile**:
  1. To test physical accelerometer hardware, serve the app over an HTTPS tunnel (e.g., using `ngrok http 5173` or local SSL certificates).
  2. Alternatively, use the built-in **simulation controls** (*"Simulate Hit on Same Spot"*) on either desktop or mobile in the **Drive Sensor** tab. This allows full evaluation of the 100 Hz visualizer, 10-second cooldown, and 3x spot clustering logic without physical driving or HTTPS configuration.

### 4. Build for Production
```bash
npm run build
```
Compiles TypeScript and creates an optimized static bundle in the `dist/` directory.

---

## 📱 Mobile Web / Progressive Web App (PWA)

1. Open the web app on your phone's browser (Safari on iOS or Chrome on Android).
2. Tap **Share** (iOS Safari) or **Menu ⋮** (Android Chrome) and select **"Add to Home Screen"**.
3. The app installs directly as a standalone PWA with its own icon and splash screen.
4. When driving (under HTTPS), tap **"Start Silent Drive Sensor"** in the Drive Sensor tab to quietly monitor road shocks.

---

## ⚠️ Current Limitations

* **No Real Municipal Dispatch**: The platform generates client-side PDF incident dockets, formatted `mailto:` links, and sanitized CSV files, but does not interface directly with live municipal CAD or 311 enterprise dispatch software.
* **No Live Multi-Device Sync**: The current implementation operates as a single-user local client demo with state persisted in browser `localStorage`. Hazards logged on one phone do not automatically sync across multiple drivers in real time.
* **Sensor Accuracy Unproven in Field**: The drive sensor relies on browser-level `DeviceMotionEvent` accelerometer data. Due to variations in vehicle suspension, phone mount firmness, and pavement textures, real-world sensor accuracy and the 3.0G threshold remain unproven without physical road calibration trials.
* **Simulated Parking Data**: Parking occupancy metrics and rush curves are simulated models, not live sensor feeds from campus parking decks.
* **Municipal Coverage Scope**: Models 8 Gwinnett cities (Lawrenceville, Duluth, Suwanee, Peachtree Corners, Norcross, Snellville, Lilburn, Buford) plus GGC Facilities, GCDOT, and GDOT District 1.
* **PDF Dockets are Client-Generated**: PDFs are generated client-side via `jspdf` for work order export; they are not legally certified documents.

---

## 🧪 Testing Status

* **First Test Issue Logged (9/29)**: The team logged a formal GitHub test issue specifying critical edge cases:
  * **Clustering Radius**: Proximity grouping within ~115 ft (`0.022` mi) radius across multiple drive passes.
  * **10-Second Cooldown & GPS Lock**: Preventing multi-axle bounces from double-counting and handling in-flight GPS timeouts.
  * **Boundary Conditions**: Testing edge coordinates along municipal borders and unincorporated Gwinnett borders.
  * **Sensitivity Thresholds**: Calibrating 3.0G impact threshold against normal engine rumble and speed tables.
  * **Invalid Input Handling**: Ensuring invalid GPS fixes, missing telemetry, or quota exhaustion fail gracefully.
* **Framework Status**: No automated test framework is active in CI yet. Multi-phase Vitest and Playwright test harness plans have been drafted (see `TESTING.md` and `BUILD_PLAN.md`) for upcoming sprints.

---

## 🔮 Next Steps & Roadmap

1. **Jules Automation**: Integrate GitHub automated workflows / CI agents (Jules) for automated pull request checks, code style enforcement, and test issue verification.
2. **Shared Cloud Backend**: Transition from client-side `localStorage` to a centralized backend (API + database) for live crowdsourced telemetry and multi-driver hit synchronization.
3. **Field Validation**: Conduct controlled, physical driving runs on GGC campus roads (e.g., Lonnie Harvel Way) and county routes to validate real-world sensor accuracy and tune hit-detection algorithms.

---

## 👥 Development Team & Commit History

Developed by the **Georgia Gwinnett College** Capstone Team (School of Science and Technology &bull; ITEC 4860):

| Team Member | Core Focus & Contributions | Key Git Commits / Deliverables |
| :--- | :--- | :--- |
| **Tina Ly** | • Impact Cooldown & GPS Request Serialization<br>• Sensor Evidence Metadata & Impact Tracking<br>• "Possible Road Hazard" Distinction Logic<br>• Requirements Analysis & Feature Consolidation<br>• User Flow Design & Capstone Prototyping | `8543a77` fix(sensor): limit repeated impacts with GPS cooldown<br>`60f7b2f` Add impact cooldown logic for event recording<br>`91374fb` Update myReports filter to include sensor reports<br>`fe13d7d` Enhance PotholeDetailDrawer with sensor evidence details<br>`62a8ee6` Update report promotion logic and descriptions<br>`2599ab6` Add SensorEvidence interface for pothole reports<br>`27b2a8d` Refactor DriveSensorView by cleaning up comments<br>`4e94374` Refactor DriveSensorView to use real GPS coordinates<br>• Feature Consolidation & App Analyzation Research |
| **Hina Luna** | • Silent 3x Sensor Detection Engine & Waveform<br>• Tracked Hazard Spot Telemetry & Clustering<br>• "My Reports" Inventory & In-Place Edit Modal<br>• Image Compression & Quota Protection<br>• Cryptographic UUIDs & CSV Formula Injection Sanitization | `21fc735` feat: silent 3x spot hit detection<br>`2ceaabc` feat: TrackedHazardSpot & persistence<br>`e1e8816` feat: MyReportsView edit/review modal<br>`64488a0` fix: compressed photo persistence<br>`62a4efd` fix: crypto.randomUUID collision fix<br>`0c1664e` fix: CSV formula injection security<br>`bb06367` fix: pure React state updater transitions<br>`5040cf6` docs: update README for 3x sensor |
| **Erick Vale** | • Codebase Portability & Cross-Platform Quickstart<br>• OpenStreetMap Tile Integration & Map Layers<br>• Modal Z-Index Stacking & Dialog Hook Refactoring<br>• Sensor Pause Logic & FAB De-duplication<br>• Testing Framework Architecture & Build Plans<br>• PR Reviews & Merge Conflict Resolution | `4265e76` Make quickstart work on any machine<br>`12d4149` Use OpenStreetMap tiles (no API key needed)<br>`09fa99c` Keep map underneath open dialogs<br>`7de1c8c` Call dialog hooks unconditionally (22 lints to 0)<br>`5fbb2a8` Make Pause Sensor stop pothole detection<br>`2d4b456` fix: remove duplicate floating action button<br>`7275829` framework: Add multi-phase reliability framework<br>`59f3841` docs: component guide & hazard refactor plan |
| **Peyton Holland** | • Project Foundation & Core Application Setup<br>• Leaflet Mapping & Multi-Agency Routing Engine<br>• Gwinnett County & GGC Municipal Datasets<br>• Silent Auto-Logging Concept & Park/Review Queue | `ed0573d` Initial commit: Unified GGC & Gwinnett Hub<br>`f47dc14` Update README.md<br>`d0ef81c` feat: streamline Gwinnett P3 & auto-logging |

---

*Georgia Gwinnett College &bull; School of Science and Technology &bull; ITEC 4860 Software Development Capstone*
