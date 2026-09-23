# 🚗 Georgia Pothole Patrol & Smart-Commute Transportation Hub
### Georgia Gwinnett College (GGC) Campus Pilot, Gwinnett County & Statewide Regional Coverage

An application developed by students at **Georgia Gwinnett College** (Tina Ly, Hina Luna, Erick Vale, Peyton Holland) as part of the **ITEC 4860 Software Development Senior Capstone Project**.

The platform is a unified **smart-commute and civic infrastructure hub** that pairs automated in-vehicle road hazard detection with campus parking forecasting and cross-jurisdictional municipal work order routing across GGC Facilities, Gwinnett County DOT, GDOT District 1, and 16 municipal public works departments.

---

## 🌟 Key Highlights & Architecture

### 1. ⚡ Silent In-Vehicle Sensor & 3x Spot Hit Detection
* **Zero Driver Distraction**: Runs 100% silently in the background with **zero popups, zero sounds/chimes, and zero phone vibrations** while driving.
* **3-Hit Clustering Engine**: Single bumps or speed tables do not create instant public tickets. The system clusters shocks within a ~115-foot radius (`0.022` miles). Shocks 1 and 2 increment the strike counter quietly. On the **3rd strike**, the hazard is automatically confirmed, assigned an official tracking code, and promoted to an official report.
* **100 Hz Real-Time Waveform**: HTML5 canvas visualizer graphing vertical deceleration ($G$-forces), 3.0G impact threshold line, and 1.0G gravitational baseline.
* **Demo Simulation Controls**: Built-in *"Simulate Hit on Same Spot (Click 3x to Verify)"* control allowing instructors and evaluators to test multi-hit clustering on demand without driving.

### 2. 📋 "My Reports" Tracking & In-Place Edit/Review
* **Full Reports Inventory**: Displays the complete persistent list of hazards submitted from the user's device or verified via 3x sensor detections.
* **Optional In-Place Review & Editing**: Each report card features an **"Edit / Review"** button opening a dedicated modal to:
  * Customize report titles, landmark notes, and cross-street descriptions.
  * Adjust severity levels (`minor`, `moderate`, `severe`, `critical axle-risk`).
  * Modify pavement surface types and estimated dimensions (depth/width).
  * Attach or update site photos with automated canvas compression.
  * Delete or discard false alarms.
* **Persistent Storage & Quota Protection**: Uploaded camera photos are automatically scaled and compressed to compact JPEG Data URIs (~30–50 KB), preserving photos permanently across browser sessions and reloads without exceeding the 5 MB `localStorage` limit.

### 3. 🗺️ GGC Campus & Gwinnett Municipalities Mapping
* **Dual View Scope Switcher**:
  * `🎓 GGC Campus Focus`: Interactive Leaflet map centered on Georgia Gwinnett College (`33.9798, -84.0017`) with the official green & gold 1-mile search radius circle. Automatically calculates exact driving distance from the GGC Student Center for every hazard.
  * `🗺️ Full Gwinnett County`: Expands to cover all 16 Gwinnett municipalities, unincorporated county roads under Gwinnett County DOT (GCDOT), and state routes/interstates (GA-316, I-85, US-78) under GDOT District 1.
* **Municipal Quick-Jump Presets**: Jump directly to GGC Campus, Downtown Lawrenceville, Suwanee Town Center, Historic Duluth, Peachtree Corners (Curiosity Lab), Historic Norcross, Snellville, Buford, and GA-316/I-85.
* **Interactive Pinpoint & Reverse Geocoding**: Tap anywhere on the map to reverse-geocode street addresses via OpenStreetMap Nominatim with offline campus fallback.

### 4. 🏛️ Automated Multi-Agency Jurisdiction Routing
When a hazard is reported, the system automatically classifies the responsible agency using coordinate polygon containment, municipal bounding boxes, and roadway keywords:

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

### 5. 📄 Certified Incident Dockets & Work Order Dispatch
* **Certified PDF Incident Docket**: Generates an official, signed PDF document client-side with tracking code (`GAP-2026-XXXXXXXX`), GPS coordinates, Google Maps navigation link, responsible agency routing, and public works work order sign-off blocks.
* **Direct Email Dispatch (`mailto:`)**: Generates pre-formatted work orders directly to campus facilities, county DOT, GDOT dispatch, or municipal public works.
* **Sanitized CSV Export**: Exports work orders for road crews with OWASP formula injection protection (`=`, `+`, `-`, `@` prefix escaping).
* **Collision-Free Tracking IDs**: Uses native `crypto.randomUUID()` to generate unique database keys (`GW-POT-UUID`) and collision-free tracking numbers.

### 6. 🚗 Campus & Regional Parking Forecaster
* **Commute & Parking Intelligence**: Monitored parking capacity across GGC campus decks (Deck 1, Lot A, Lot B, Lonnie Harvel) and regional shopping hubs (Costco Duluth, Mall of GA, Sugarloaf Mills).
* **Predictive Rush Curves**: Models parking load based on simulated hour of day, weekend rush, weather factors, and GGC class-change turnover periods (10:45 AM, 12:15 PM, 1:45 PM).

---

## 🧭 Navigation & Tab Guide

1. **Dashboard (`UnifiedDashboard`)**: Executive overview combining live parking congestion indicators, urgent critical road hazard counters, and quick dispatch shortcuts.
2. **Hazard Map (`PotholeMapView`)**: Full-screen interactive OpenStreetMap view with custom severity pins, quick-jump municipal presets, and radius circles.
3. **Drive Sensor (`DriveSensorView`)**: In-vehicle monitoring screen showing live accelerometer readings, 3x spot hit clustering list, and demo simulator buttons.
4. **My Reports (`MyReportsView`)**: Complete list of user-submitted and 3x-verified reports with in-place review, editing, and photo attachment.
5. **Authority Hub (`AuthorityHubView`)**: Multi-agency dispatch desk for filtering work orders by city, updating repair status lifecycles, and exporting CSV work orders.
6. **Analytics (`PotholeAnalyticsView`)**: Pavement condition index (PCI) charts, severity breakdown graphs, and recurring corridor risk rankings.

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Launch the Development Server
```bash
npm run dev
```
Open your browser at [http://localhost:5173](http://localhost:5173).

### 3. Build for Production
```bash
npm run build
```
Compiles TypeScript and creates an optimized static bundle in the `dist/` directory.

---

## 📱 Mobile Web / Progressive Web App (PWA)

1. Open the web app on your phone's browser (Safari on iOS or Chrome on Android).
2. Tap **Share** (iOS Safari) or **Menu ⋮** (Android Chrome) and select **"Add to Home Screen"**.
3. The app will install directly as a standalone PWA with its own icon and splash screen.
4. When driving, tap **"Start Silent Drive Sensor"** in the Drive Sensor tab. The app will quietly monitor road shocks and auto-verify spots hit 3 times without distracting the driver.

---

## 👥 Development Team

* **Tina Ly**
* **Hina Luna**
* **Erick Vale**
* **Peyton Holland**

*Georgia Gwinnett College &bull; School of Science and Technology &bull; ITEC 4860 Senior Software Development Capstone*
