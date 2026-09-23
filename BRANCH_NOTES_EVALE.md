# Branch Notes — Evale Branch (2026-09-22)

Personal documentation of codebase exploration, key learnings, and next steps on the evale branch.

---

## Overview

This branch is dedicated to documentation improvements and preparation for the hazard button refactoring work discussed in the team chat (2026-09-22, ~9:00 PM). Goal: provide teammates with clear guides and a concrete refactoring plan before diving into code changes.

---

## What I Learned About the Codebase

### Architecture

The app is a **single-page React application (SPA)** with:
- **No URL routing** — Views controlled by state toggles (mode, view flags)
- **Local-first data** — All incidents stored in browser localStorage via storageService
- **Flat component hierarchy** — No Redux/Zustand; just React hooks and prop drilling
- **Service-oriented** — Business logic isolated in `/src/services/` (jurisdictionClassifier, pdfGenerator, storageService)
- **Dark-mode only** — All CSS uses Tailwind dark palette; light mode not yet implemented

### Key Components

**PotholeReportModal** (`src/components/potholes/PotholeReportModal.tsx`)
- 467 lines, handles entire incident form submission flow
- State management: 18+ useState hooks (could be refactored into useReducer for clarity)
- Interesting patterns:
  - Conditional rendering based `props.isOpen` (prevents mounting on close)
  - Preset locations hardcoded for GGC + Gwinnett County landmarks
  - GPS reverse geocoding via Nominatim API (with fallback to hardcoded GGC coords)
  - Dynamic jurisdiction routing on every render (classifyJurisdiction called inline)
  - Photo preview using object URLs (not base64; cleaner)

**Header** (`src/components/Header.tsx`)
- Navigation + mode switcher (Campus vs. County)
- Directly opens/closes PotholeReportModal via callback

**PotholeMapView** (`src/components/potholes/PotholeMapView.tsx`)
- Leaflet-based interactive map
- Click-to-report: reverse geocode + pre-fill form
- Incident pins color-coded by severity
- No clustering (future optimization)

**App.tsx**
- Root component with global state: `mode`, `incidents`, `selectedIncident`, `reportModalOpen`
- Incidents loaded from localStorage on mount
- No error boundaries (potential crash point)
- Views rendered conditionally (not URL-routed)

### Services

**jurisdictionClassifier.ts**
- Routes incidents by coordinates + road name
- Rules: GGC campus, GA-316 (GDOT), Gwinnett County (GCDOT), cities (municipal)
- ~40 lines; could be unit-tested comprehensively

**storageService.ts**
- localStorage wrapper: addReport, getReports, updateReport, deleteReport
- Stores incidents as JSON, keyed by 'pothole-reports'
- No quota management (localStorage is ~5MB; app doesn't track usage)

**pdfGenerator.ts**
- Uses jsPDF to generate certified PDF dockets
- Embeds incident details, photo, authority contact
- No server-side rendering; client-side only

### Data Model

**PotholeReport**
- 30+ fields capturing incident metadata
- Types: SeverityLevel (4 levels), HazardType (4 types), Status (4 states)
- `verificationsCount` and `userConfirmed` fields suggest planned community verification feature (not yet implemented)

---

## What Needs Work

### High Priority

1. **Form Organization** — PotholeReportModal is 467 lines with scattered state. Tabs would help (see HAZARD_REFACTOR_PLAN.md)
2. **No Error Boundaries** — App can crash on bad data; needs try/catch in storageService and graceful fallbacks
3. **No Validation** — Form accepts empty addresses, silently defaults to GGC coords if GPS fails
4. **Testing** — BUILD_PLAN.md outlines multi-phase testing framework; Phase 0 setup in progress

### Medium Priority

5. **URL Routing** — No deep links; can't bookmark or share specific views (e.g., `/admin`, `/my-reports`)
6. **Reverse Geocoding Fallback** — Nominatim timeouts cause silent failures; hardcoded fallback is confusing
7. **No Offline Mode** — App can't sync incidents when back online; web storage is one-way
8. **Photo Storage** — Uses Unsplash fallback; no real photo upload pipeline

### Low Priority (Future)

9. **Authentication** — No user accounts; anyone can report (spam risk)
10. **Cloud Backend** — Incidents not synced across devices
11. **Real-Time Updates** — Dashboard doesn't auto-refresh
12. **Accessibility** — No WCAG audit yet; dark mode only

---

## Documentation Created This Session

### 1. COMPONENT_GUIDE.md
Comprehensive reference for key components (PotholeReportModal, Header, PotholeMapView, App.tsx, MyReportsView). Includes:
- Props interfaces
- Internal state breakdown
- Methods and data flow diagrams
- Type definitions
- Service layer reference

**Use:** Onboarding new teammates, understanding component boundaries before refactoring.

### 2. HAZARD_REFACTOR_PLAN.md
Detailed step-by-step plan for reorganizing PotholeReportModal into a tabbed interface:
- Current problems identified
- Proposed tab structure (Location & Photo | Hazard Details | Reporter Info)
- Code changes needed
- Testing checklist
- Rollback plan

**Use:** Concrete reference for implementing hazard button refactoring (mentioned in team chat).

### 3. BRANCH_NOTES_EVALE.md (this file)
Captures learnings, codebase state, and next steps. Personal documentation for future context.

---

## Code Quality Observations

### Strengths
- **Type Safety** — Full TypeScript strict mode; no `any` types I've seen
- **Component Isolation** — Services and components well-separated
- **Tailwind Consistency** — Uniform dark theme, responsive design
- **No External State Management** — Keeps bundle size small, no Redux complexity

### Improvement Opportunities
- **State Explosion** — 18+ useState hooks in PotholeReportModal; refactor to useReducer?
- **Inline Business Logic** — jurisdictionClassifier called in render; memoize?
- **No Linting Tests** — OXlint runs but no pre-commit hook mentioned
- **Magic Numbers** — 5.0G sensor threshold, coordinate bounds hardcoded; consider constants file
- **Comment Debt** — Minimal comments; code is readable but some functions could use "why" notes

---

## Next Steps for This Branch

### Before Merging to Main

- [ ] Run `npm run lint` and `npm run build` to ensure no regressions
- [ ] Review COMPONENT_GUIDE.md for accuracy (spot-check 3+ components)
- [ ] Verify HAZARD_REFACTOR_PLAN.md addresses team's discussion points
- [ ] Commit all docs with clear message: "docs: add component guide, hazard refactor plan, branch notes"
- [ ] Push to origin/evale

### For Teammates Reviewing This Branch

- Use COMPONENT_GUIDE.md as a reference while reading source code
- HAZARD_REFACTOR_PLAN.md provides the roadmap for the hazard button work
- If contributing to PotholeReportModal, consider suggesting useReducer refactor

### For Future Work (On This Branch or Follow-up)

1. **Implement Hazard Refactor** — See HAZARD_REFACTOR_PLAN.md for step-by-step
2. **Add Error Boundaries** — Wrap App.tsx and key components in error boundary
3. **Form Validation** — Add required field checks + user feedback before submit
4. **Testing Setup** — Phase 0 of BUILD_PLAN.md (Vitest, React Testing Library)
5. **Reverse Geocoding Improvements** — Better error messages, retry logic

---

## Codebase Statistics

| Metric | Value |
|--------|-------|
| **Total TypeScript/TSX files** | ~30 |
| **Largest component** | PotholeReportModal.tsx (467 lines) |
| **Services** | 7 (jurisdictionClassifier, pdfGenerator, storageService, reverseGeocoding, distanceCalculator, textReportGenerator, predictiveParking) |
| **Data files** | 5 (jurisdictionsData, municipalitiesData, roadSegmentsData, parkingLotsData, potholesData) |
| **Components** | 12+ (distributed across potholes/, sensor/, parking/, dispatcher/, dashboard/ subdirs) |
| **External dependencies** | 25+ (React, TypeScript, Tailwind, Vite, Leaflet, jsPDF, Recharts, Lucide) |

---

## Communication Notes

### From Team Chat (2026-09-22, ~9:00 PM)

**Erick (your username):**
> "When you say everyone does a commit you're saying to the main branch? I don't have antigravity rn so let me know how I can be of help while relying only on Claude lol. I think taking care of the hazard buttons should be easy enough"

**Response Strategy:**
- Documentation is a solid contribution that doesn't require external tools (antigravity)
- Hazard button refactoring is scoped and feasible with just Claude
- Teammates agreed: "you should still be able to push something to the repo with claude" + "just upload some documentation to your branch, that might be good"

**Dr. IM Spying:**
> "Dr. IM wants us to all commit something and will give us a grade just for making em"

**Implication:**
- Documentation commits count as contributions
- Screen sharing shows collaborative work to professor
- Quality matters; comprehensive docs add credibility

---

## Commit Message Template

When committing docs:

```
docs: add component guide, hazard refactor plan, and branch notes

- COMPONENT_GUIDE.md: comprehensive reference for key components, props, state, and data flows
- HAZARD_REFACTOR_PLAN.md: detailed plan for reorganizing form into tabbed interface
- BRANCH_NOTES_EVALE.md: codebase learnings and next steps

This documentation provides teammates with clear guides for understanding the codebase
and a concrete roadmap for the discussed hazard button refactoring work.
```

---

## Quick Reference

**To understand a component:** Start with COMPONENT_GUIDE.md  
**To implement hazard refactor:** Follow HAZARD_REFACTOR_PLAN.md  
**To remember what you learned:** Re-read this file  
**To run tests:** `npm run test` (Phase 0 setup in progress)  
**To start dev server:** `npm run dev` → http://localhost:5173  
**To build for production:** `npm run build` → `dist/` folder  

---

**Author:** Erick (evale branch)  
**Date:** 2026-09-22  
**Session:** Claude Code + Claude Haiku 4.5  
**Files Modified:** 3 (COMPONENT_GUIDE.md, HAZARD_REFACTOR_PLAN.md, BRANCH_NOTES_EVALE.md created)  
**Next Session:** Implement hazard refactor or continue with testing setup
