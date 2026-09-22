# CLAUDE.md — GGC Pothole Patrol & Transportation Dispatch Hub

This file provides guidance to Claude Code when working with the ggcpotholeapp repository.

## Project Overview

**Purpose:** A web-based mobile application for detecting, mapping, and reporting potholes across Georgia Gwinnett College (GGC) campus and Gwinnett County jurisdictions.

**Tech Stack:** 
- **Frontend:** React 19, TypeScript 6.0, Vite 8.3
- **Styling:** Tailwind CSS 4.3, PostCSS 8.5
- **Mapping:** Leaflet 1.9.4, react-leaflet 5.0
- **PDF Generation:** jsPDF 4.2.1
- **Charts:** Recharts 3.10
- **Linting:** OXlint 1.81
- **Icons:** Lucide React 1.45

**Project Type:** Progressive Web App (PWA) — mobile-first responsive web application with offline capability, camera access, GPS, and device motion sensors.

---

## Development Setup

### Prerequisites
- Node.js 18.x or higher
- npm 9.x or higher
- Modern browser with PWA support (iOS Safari 16+, Chrome 90+)

### Installation
```bash
npm install
```

### Environment Configuration
No secrets required. All APIs are client-side or public:
- OpenStreetMap Nominatim (reverse geocoding, no key)
- Leaflet (mapping, self-hosted)

---

## Common Commands

### Development
```bash
npm run dev
```
Starts Vite dev server at `http://localhost:5173` with HMR.

### Building
```bash
npm run build
```
Compiles TypeScript and creates optimized static bundle in `dist/`.

### Testing
```bash
npm run test
npm run test:watch
npm run test:ui
npm run test:coverage
```
Runs Vitest suite with React Testing Library. See `vitest.config.ts` and `tests/` directory.

### Linting & Formatting
```bash
npm run lint
npm run lint:fix
```
OXlint for static analysis + Prettier for code formatting.

---

## Architecture Overview

### Directory Structure
```
src/
├── App.tsx                      # Root component with routing
├── main.tsx                     # Entry point
├── App.css, index.css           # Styles (Tailwind)
├── components/
│   ├── Header.tsx               # Navigation & mode switcher
│   └── __tests__/               # Component tests
├── types/
│   ├── jurisdiction.ts          # Authority data structures
│   ├── parking.ts               # Parking forecast models
│   └── pothole.ts               # Incident model & lifecycle
├── data/
│   ├── municipalitiesData.ts    # GGC + 16 cities
│   ├── roadSegmentsData.ts      # State/county/municipal roads
│   ├── parkingLotsData.ts       # Campus & regional parking
│   ├── potholesData.ts          # Sample incidents (mock)
│   └── jurisdictionsData.ts     # Authority routing
├── services/
│   ├── pdfGenerator.ts          # Certified PDF dockets
│   ├── textReportGenerator.ts   # Plain-text reports
│   ├── storageService.ts        # LocalStorage persistence
│   ├── jurisdictionClassifier.ts # Route to correct authority
│   └── __tests__/               # Service tests
└── assets/                      # Images, icons

tests/
├── setup.ts                     # Vitest + JSDOM config
├── unit/                        # Unit test suites
└── integration/                 # Integration tests
```

### Key Components & Design Patterns

**State Management:** React hooks + localStorage. Flat hierarchy — no Redux/Zustand needed at current scale.

**Data Flow:**
1. Incident trigger (sensor, map, form) → localStorage via storageService
2. Jurisdiction classifier routes to GGC/GCDOT/GDOT/city
3. Multi-format generators (PDF, email, JSON, text)
4. Admin dashboard aggregates for dispatcher view

**Key Patterns:**
- **Sensor Pipeline:** DeviceMotionEvent → G-force check → haptic + GPS → auto-populate form
- **Reverse Geocoding:** Map click → Nominatim → address → jurisdiction lookup
- **Multi-Tier Reporting:** Single incident → 4 output formats → agency routing
- **Mobile-First Responsiveness:** Tailwind breakpoints

### Data Flow
```
Incident Trigger → LocalStorage → Jurisdiction Classifier 
    ↓
   ┌───┬──────┬──────┐
   ↓   ↓      ↓      ↓
  PDF Email  CRM  Text
```

---

## Important Notes

### Code Style & Conventions
- **TypeScript:** Strict mode enabled
- **Components:** PascalCase (Header.tsx)
- **Services/Utils:** camelCase (jurisdictionClassifier.ts)
- **Types:** camelCase files (pothole.ts)
- **Constants:** SCREAMING_SNAKE_CASE
- **Imports:** Relative paths (no aliases configured)

### Known Limitations or Gotchas
1. **Mobile Sensor APIs:**
   - `DeviceMotionEvent` requires HTTPS or localhost
   - iOS requires Motion & Fitness permission in Settings
   - Desktop simulator button for testing without device

2. **Reverse Geocoding:**
   - Nominatim requires network; fallback uses hardcoded GGC coords
   - No offline geocoding library yet

3. **LocalStorage:**
   - ~5MB quota per origin
   - Not synced cross-tab
   - Clearing browser data wipes all incidents

4. **Admin Dashboard:**
   - Currently no authentication/authorization
   - TODO: Add RBAC before production

5. **PDF Generation:**
   - Client-side only
   - Large incidents may be slow
   - Embedded fonts increase file size

### Testing Strategy
**Unit Tests:** Vitest + React Testing Library for components & services  
**Integration Tests:** Sensor simulation, geocoding, PDF generation  
**E2E (Future):** Playwright for critical flows  
**Coverage Target:** 70%+ for core services  
**Sensor Testing:** Mock DeviceMotionEvent in tests; desktop simulator for manual  

---

## External Resources
- **README.md** — Features, quickstart, jurisdiction directory
- **GitHub:** https://github.com/xserravalle/ggcpotholeapp
- **Nominatim API:** https://nominatim.org/
- **Leaflet Docs:** https://leafletjs.com/
- **React 19:** https://react.dev/
- **Tailwind 4:** https://tailwindcss.com/docs
- **TypeScript:** https://www.typescriptlang.org/docs/
- **Vitest:** https://vitest.dev/

---

## Model Routing

**Haiku-first.** Opus summoned via `deep` subagent for:
- Architectural decisions (component splits, state management redesign)
- Security-sensitive work (auth, permissions, sensor validation)
- Testing strategy validation
- Cross-file consistency checks
- Hard-to-reverse changes (deletion, force-push, major refactors)

### Escalation Triggers
**Always escalate when:**
1. Architecture decision required (hooks vs context, localStorage vs IndexedDB)
2. Security/auth/permissions involved
3. Two fix attempts have failed (include exact error output from both)
4. Test gate is ambiguous
5. Hard-to-reverse operation (delete, force-push, major refactor)

**Handle directly:**
- File reads, grep, find, directory listings
- Mechanical edits (rename, format, apply existing patterns)
- Running tests and reporting results
- Documentation for completed work
- Bug fixes with clear root cause

### Reporting
Never skip escalation. If trigger fires: "**ESCALATION TRIGGER FIRED:** [reason]. Escalating to deep."

---

## Build Plan — Multi-Phase Reliability

See `BUILD_PLAN.md` for multi-phase validation gates, acceptance criteria, and phase-by-phase clearance.

**Current Phase:** Phase 0 (Framework Setup)

---

**Last Updated:** 2026-09-22  
**Branch:** evale  
**Maintained By:** Claude Code + GGC Team
