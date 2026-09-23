# Component Guide — GGC Pothole Patrol

Comprehensive reference for key React components, their props, internal state, and data flows.

---

## PotholeReportModal

**File:** `src/components/potholes/PotholeReportModal.tsx`

**Purpose:** Modal dialog for creating and submitting pothole incident reports. Handles photo capture, GPS location, jurisdiction routing, and multi-format export.

### Props

```typescript
interface PotholeReportModalProps {
  isOpen: boolean;                    // Controls modal visibility
  onClose: () => void;                // Callback to close modal
  onSubmitReport: (report: Omit<PotholeReport, 'id' | 'verificationsCount' | 'userConfirmed' | 'reportedAt' | 'lastVerifiedAt'>) => void;
  initialTelemetry?: {                // Optional auto-sensor data
    sensorDetected: boolean;
    bumpIntensity: number;            // G-force (e.g., 5.2G)
    severity?: SeverityLevel;         // Override severity if sensor triggered
  };
  initialCoords?: {                   // Optional pre-filled location
    lat: number;
    lng: number;
    address?: string;
  };
}
```

### Internal State

| State Variable | Type | Purpose |
|---|---|---|
| `title` | string | User-entered incident title |
| `address` | string | Full street address |
| `roadName` | string | Road/corridor name for routing |
| `landmark` | string | Nearby landmark (e.g., "Near Student Center") |
| `city` | string | Municipality for jurisdiction lookup |
| `latitude`, `longitude` | number | Decimal coordinates for mapping |
| `severity` | SeverityLevel | One of: minor, moderate, severe, critical |
| `hazardType` | HazardType | One of: POTHOLE, ROAD_CRACK, MANHOLE_COLLAPSE, SINKHOLE_RISK |
| `estimatedDepthInches` | number | Pothole depth estimate |
| `estimatedWidthInches` | number | Pothole width estimate |
| `surfaceType` | 'Asphalt' \| 'Concrete' \| 'Composite' | Road surface material |
| `damageRisk` | string | Vehicle damage risk category |
| `description` | string | Free-form notes and hazard details |
| `reporterName` | string | Reporter identity (optional, defaults to "Anonymous") |
| `reporterEmail` | string | Reporter email for follow-up |
| `photoPreview` | string \| null | Base64 or blob URL of captured/uploaded photo |
| `isResolvingAddress` | boolean | Loading state for GPS reverse geocoding |

### Key Methods

#### `handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>)`
- Triggered when user selects photo from camera or upload
- Creates object URL for preview display
- Stores as base64 in form submission

#### `handleGpsPinpoint()`
- Calls browser Geolocation API
- Reverse geocodes coordinates via Nominatim (OpenStreetMap)
- Updates address, roadName, city, latitude, longitude
- Sets `isResolvingAddress` to true during request

#### `handleApplyPreset(p: typeof PRESETS[0])`
- Pre-fills form with GGC + Gwinnett County landmark locations
- Used for testing and quick access to common report sites
- Presets: GGC Campus Entrance, Historic Lawrenceville Square, Duluth Pleasant Hill, Peachtree Corners, GA-316 Express

#### `handleSubmit(e: React.FormEvent)`
- Validates required fields (address, severity, hazardType)
- Calls `jurisdictionClassifier()` to route to correct authority
- Constructs PotholeReport object with all metadata
- Invokes `onSubmitReport()` callback
- Closes modal

### Data Flow

```
User Input (form fields)
    ↓
Jurisdiction Classifier (routes to GGC/GCDOT/GDOT/City)
    ↓
Report Object Construction
    ↓
onSubmitReport() → storageService.addReport()
    ↓
localStorage update
    ↓
Modal closes, map refreshes
```

### UI Sections

1. **Header** — Title, close button, sensor badge (if auto-triggered)
2. **Quick Presets** — GGC + Gwinnett County shortcut buttons + GPS pinpoint
3. **Photo Upload** — Camera shutter / file input with preview
4. **Dispatch Routing Badge** — Shows which authority will receive report + SLA turnaround time
5. **Severity & Hazard Type** — 4-button severity selector + hazard category dropdown
6. **Location Fields** — Address, landmark, latitude/longitude inputs
7. **Damage Risk** — Dropdown selecting vehicle risk category (Tire/Rim, Suspension, Axle/Control, Cosmetic)
8. **Dimensions & Notes** — Estimated depth/width, surface type, free-form description
9. **Reporter Info** — Optional name and email
10. **Actions** — Cancel and Submit buttons

### Styling Notes

- **Dark theme** — Uses Tailwind slate-900/slate-950 backgrounds
- **Responsive** — Full-width on mobile, max-w-2xl on desktop
- **Accessibility** — Form labels linked to inputs, button focus states
- **Animations** — Fade-in and zoom-in on modal open

### Known Limitations

1. **Photo Storage** — Only client-side preview; photo sent as base64 or Unsplash fallback in current implementation
2. **GPS Timeout** — Nominatim reverse geocoding can be slow on poor connectivity
3. **No Validation Tooltips** — Required fields silently use defaults if empty
4. **Hazard Type Dropdown** — All 4 hazard types always available; no filtering based on severity or location

---

## Header Component

**File:** `src/components/Header.tsx`

**Purpose:** Navigation bar with mode switcher (Campus vs. County), links to sub-views, and branding.

### Props

```typescript
interface HeaderProps {
  mode: 'campus' | 'county';
  setMode: (mode: 'campus' | 'county') => void;
  onOpenReport: () => void;           // Callback to open PotholeReportModal
}
```

### Rendered Sections

1. **Logo/Branding** — GGC Pothole Patrol title
2. **Mode Switcher** — Campus (GGC-only) vs. County (multi-jurisdiction) toggle
3. **Navigation Links** — Map, My Reports, Admin Dashboard
4. **Action Buttons** — Report Incident, Sensor Start/Stop

### Interaction Model

- Mode switcher is sticky; choice persists in localStorage
- Incident report button directly opens PotholeReportModal
- Sensor toggle enables DeviceMotionEvent listener

---

## PotholeMapView Component

**File:** `src/components/potholes/PotholeMapView.tsx`

**Purpose:** Leaflet-based interactive map showing reported incidents, click-to-report, and jurisdiction boundaries.

### Key Features

- Click on map → reverse geocode → pre-fill PotholeReportModal
- Color-coded pins by severity (critical=red, severe=orange, moderate=yellow, minor=green)
- Incident detail drawer on pin click
- Jurisdiction boundary overlays (GGC, GCDOT, municipal)
- Heatmap mode (optional) showing incident density

### Data Sources

- Incidents from localStorage (storageService)
- Boundaries from hardcoded jurisdiction coordinates
- OpenStreetMap tiles (Leaflet default)

---

## MyReportsView Component

**File:** `src/components/potholes/MyReportsView.tsx`

**Purpose:** User's personal incident history and export interface.

### Features

- Filter by status (reported, acknowledged, in-progress, resolved)
- Filter by severity
- Search by address or road name
- Export single report as PDF or email
- Bulk export as CSV

---

## App.tsx Root Component

**File:** `src/App.tsx`

**Purpose:** Main app shell, routing logic, and global state management.

### State Management

- `mode` — Campus or County view
- `reportModalOpen` — PotholeReportModal visibility
- `incidents` — Array of all reported incidents (loaded from localStorage on mount)
- `selectedIncident` — Currently viewed incident in detail drawer

### Routing

No URL-based routing yet; modes and views controlled by state toggles. Views rendered conditionally:

```
App (root)
├── Header (always visible)
├── Conditional Content:
│   ├── Mode === 'campus' → PotholeMapView (GGC only)
│   ├── Mode === 'county' → PotholeMapView (multi-jurisdiction)
│   ├── View === 'my-reports' → MyReportsView
│   ├── View === 'admin' → UnifiedDashboard
│   └── View === 'sensor' → DriveSensorView
└── PotholeReportModal (when reportModalOpen === true)
```

### Incident Lifecycle

```
New Report
    ↓
storageService.addReport() → localStorage
    ↓
App incident state updates (via state setter)
    ↓
Map re-renders with new pin
    ↓
Incident detail drawer can be opened
    ↓
Export as PDF/email/text
    ↓
Router notified (eventually)
```

---

## Type Definitions

**File:** `src/types/pothole.ts`

### PotholeReport

```typescript
export interface PotholeReport {
  id: string;
  title: string;
  address: string;
  roadName: string;
  city: string;
  jurisdiction: string;
  authorityId: string;
  authorityName: string;
  authorityEmail: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  hazardType: HazardType;
  status: 'reported' | 'acknowledged' | 'in-progress' | 'resolved';
  estimatedDepthInches: number;
  estimatedWidthInches: number;
  surfaceType: 'Asphalt' | 'Concrete' | 'Composite';
  damageRisk: string;
  detectedBy: 'Vehicle Accelerometer Telemetry' | 'User Mobile Report';
  sensorDetected: boolean;
  bumpIntensity: number;
  description: string;
  landmark: string;
  reporterName: string;
  reporterEmail: string;
  imageUrl: string;
  source: 'sensor' | 'user';
  reportedAt: Date;
  lastVerifiedAt: Date;
  verificationsCount: number;
  userConfirmed: boolean;
}
```

### SeverityLevel

```typescript
type SeverityLevel = 'minor' | 'moderate' | 'severe' | 'critical';
```

### HazardType

```typescript
type HazardType = 'POTHOLE' | 'ROAD_CRACK' | 'MANHOLE_COLLAPSE' | 'SINKHOLE_RISK';
```

---

## Service Layer

### jurisdictionClassifier

**File:** `src/services/jurisdictionClassifier.ts`

Routes an incident to the correct authority based on coordinates and road name.

```typescript
export function classifyJurisdiction(
  lat: number, 
  lng: number, 
  address: string
): { 
  id: string;
  name: string;
  contactEmail: string;
  potholeHotline: string;
  slaTurnaround: string;
}
```

**Routing Logic:**
- GGC Campus (33.9798, -84.0017 ± 0.005) → GGC Facilities
- GA-316 / SR 316 → GDOT (Georgia DOT)
- Gwinnett County roads → GCDOT (Gwinnett DOT)
- Municipal roads → City maintenance (Lawrenceville, Duluth, Peachtree Corners, etc.)

### storageService

**File:** `src/services/storageService.ts`

localStorage wrapper for incident CRUD operations.

```typescript
export const storageService = {
  addReport: (report: Omit<PotholeReport, 'id' | 'reportedAt'>) => PotholeReport,
  getReports: () => PotholeReport[],
  getReportById: (id: string) => PotholeReport | null,
  updateReport: (id: string, updates: Partial<PotholeReport>) => PotholeReport,
  deleteReport: (id: string) => void,
  clearAll: () => void
};
```

### pdfGenerator

**File:** `src/services/pdfGenerator.ts`

Generates certified PDF dockets for incident reports.

```typescript
export function generatePdf(report: PotholeReport): jsPDF;
```

---

## Next Steps for Contributors

1. **Read this guide** to understand component boundaries and state flow
2. **Check TESTING.md** for testing conventions
3. **Review HAZARD_REFACTOR_PLAN.md** if refactoring UI tabs
4. **Run dev server** and explore each view in browser
5. **Check BUILD_PLAN.md** for multi-phase validation gates

---

**Last Updated:** 2026-09-22  
**Author:** Erick (evale branch)
