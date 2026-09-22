# Build Plan — GGC Pothole Patrol Reliability Framework

Multi-phase validation and reliability framework for ggcpotholeapp. Every phase boundary requires explicit Opus (`deep` agent) clearance before proceeding.

---

## Phase Overview

| Phase | Title | Status | Gate | Cleared |
|-------|-------|--------|------|---------|
| 0 | Framework Setup | In Progress | Dependencies install, CLAUDE.md + tests/ exist | ⏳ Pending |
| 1 | Testing Harness | Not Started | Vitest runs, 5+ tests pass, coverage report | ⏳ Pending |
| 2 | Core Service Tests | Not Started | jurisdictionClassifier, pdfGenerator, storageService at 80%+ coverage | ⏳ Pending |
| 3 | Component Tests | Not Started | Header, App routing at 80%+ coverage | ⏳ Pending |
| 4 | Integration Tests | Not Started | Sensor pipeline, geocoding, multi-format export flows | ⏳ Pending |
| 5 | E2E & Production Ready | Not Started | Critical user flows via Playwright, production build passes all tests | ⏳ Pending |

---

## Phase 0 — Framework Setup

**Goal:** Establish reliable foundation for multi-phase validation.

**Scope:**
- Add CLAUDE.md with project documentation and model routing
- Create `tests/` directory with Vitest configuration
- Add testing dependencies to package.json
- Create test setup & helpers
- Verify project builds and dev server starts

**Key Files Created/Modified:**
- ✅ `CLAUDE.md` — guidance for Claude Code
- `vitest.config.ts` — Vitest configuration with jsdom environment
- `tests/setup.ts` — Test environment setup (JSDOM, globals)
- `tests/helpers/` — Test utilities (render, mock factories)
- `package.json` — Add vitest, @testing-library/react, jsdom

**Acceptance Gate:**
```bash
# All commands must succeed:
npm install                           # No errors
npm run build                         # Compiles to dist/
npm run dev &                         # Dev server starts
sleep 3 && curl http://localhost:5173 # Returns HTML
npm run test -- --run                 # Tests execute
npm run lint                          # No errors
```

**Expected Output:**
```
✓ npm install
✓ npm run build — compiled successfully
✓ Dev server listening at http://localhost:5173
✓ Tests: 5+ passing (no failures)
✓ OXlint: no errors
```

**Clearance Criteria:**
- ✅ Gate output pasted verbatim
- ✅ No build errors
- ✅ No test failures
- ✅ Dev server starts without warnings
- Opus decision: Proceed to Phase 1?

---

## Phase 1 — Testing Harness

**Goal:** Establish Vitest + React Testing Library as foundation for all future tests.

**Scope:**
- Create test setup with JSDOM environment
- Add test utilities (render helpers, mock factories)
- Write 5+ simple passing tests (smoke tests)
- Verify coverage reporting works
- Document testing conventions

**Key Files Created:**
- `vitest.config.ts` — Vitest config (jsdom, globals, aliases)
- `tests/setup.ts` — JSDOM setup, global mocks (localStorage, navigator)
- `tests/helpers/render.tsx` — Custom render with providers
- `tests/helpers/mockData.ts` — Mock pothole, jurisdiction, parking objects
- `tests/unit/App.test.tsx` — Basic render + routing test
- `tests/unit/Header.test.tsx` — Header component smoke test

**Acceptance Gate:**
```bash
npm run test -- --run
npm run test:coverage
```

**Expected Output:**
```
✓ App.test.tsx (2 tests)
✓ Header.test.tsx (2 tests)
✓ ... (1+ additional tests)
────────────────────────
Tests:  5 passed
Coverage: 40%+ overall
```

**Clearance Criteria:**
- ✅ 5+ tests passing
- ✅ Coverage report generated without errors
- ✅ No test warnings or deprecations
- Opus decision: Core testing infra sound. Proceed to Phase 2?

---

## Phase 2 — Core Service Tests

**Goal:** Achieve 80%+ coverage on critical business logic services.

**Target Services:**
1. `jurisdictionClassifier.ts` — Routes incidents to correct authority
2. `pdfGenerator.ts` — Generates certified PDF dockets
3. `storageService.ts` — LocalStorage persistence layer

**Scope:**
- Write unit tests for each service (happy path + edge cases)
- Test error handling (network failures, invalid input)
- Mock dependencies (Nominatim API, jsPDF)
- Achieve 80%+ line coverage per service

**Key Test Files to Create:**
- `tests/unit/services/jurisdictionClassifier.test.ts`
  - Happy paths for GGC, GCDOT, GDOT, municipal routing
  - Edge cases (invalid coordinates, missing jurisdiction)
- `tests/unit/services/pdfGenerator.test.ts`
  - PDF generation without actual file output
  - Formatting correctness for incident fields
- `tests/unit/services/storageService.test.ts`
  - CRUD operations (add, get, update, delete incidents)
  - Persistence verification

**Acceptance Gate:**
```bash
npm run test:coverage -- tests/unit/services/
```

**Expected Output:**
```
jurisdictionClassifier.ts:  ✓ 18 tests pass, 82% coverage
pdfGenerator.ts:            ✓ 15 tests pass, 85% coverage
storageService.ts:          ✓ 12 tests pass, 88% coverage
────────────────────────────
Total:                      45 tests, 85% coverage
```

**Clearance Criteria:**
- ✅ All service tests passing
- ✅ 80%+ coverage on each service
- ✅ Error paths tested (invalid input, API failures)
- Opus decision: Core business logic solid. Ready for component tests?

---

## Phase 3 — Component Tests

**Goal:** Achieve 80%+ coverage on React components with integrated service tests.

**Target Components:**
1. `App.tsx` — Main component, routing, incident creation flow
2. `Header.tsx` — Navigation, mode switching (GGC/County)

**Scope:**
- Test component rendering with various props
- Test user interactions (clicks, form submission)
- Test integration with services (storageService, jurisdictionClassifier)
- Mock child components and external dependencies

**Key Test Files to Create:**
- `tests/unit/components/App.test.tsx`
  - Campus vs County mode switching
  - Incident form submission
  - Map interactions
  - Report export (PDF, email, text)
- `tests/unit/components/Header.test.tsx`
  - Navigation links render
  - Mode switcher updates app state
  - Responsive behavior

**Acceptance Gate:**
```bash
npm run test:coverage -- tests/unit/components/
```

**Expected Output:**
```
App.tsx:        ✓ 22 tests pass, 81% coverage
Header.tsx:     ✓ 8 tests pass, 90% coverage
────────────────────
Total:          30 tests, 83% coverage
```

**Clearance Criteria:**
- ✅ All component tests passing
- ✅ 80%+ coverage per component
- ✅ User interactions tested
- ✅ Service integration verified
- Opus decision: Components reliable. Ready for integration tests?

---

## Phase 4 — Integration Tests

**Goal:** Validate end-to-end user flows with realistic data and timing.

**Scope:**
- Sensor detection pipeline (mock DeviceMotionEvent → incident creation → storage)
- Map interaction flow (click → reverse geocode → jurisdiction lookup → populate form)
- Multi-format export (single incident → PDF + email + JSON + text)
- Admin dashboard aggregation (incidents → KPI counters)
- Error recovery (network timeout, geocoding failure, storage full)

**Key Test Files to Create:**
- `tests/integration/sensorPipeline.test.ts`
  - Mock DeviceMotionEvent with 5.2G spike
  - Verify incident auto-created with timestamp, coordinates
  - Verify haptic callback triggered
- `tests/integration/geocodingFlow.test.ts`
  - Map click at coordinates → Nominatim lookup → address
  - Jurisdiction classifier routes correctly
  - Form pre-populated with address
- `tests/integration/exportFlow.test.ts`
  - Single incident → PDF generation
  - Email payload formatted correctly
  - JSON matches CRM spec
  - Text report includes all fields
- `tests/integration/adminDashboard.test.ts`
  - 50 sample incidents → KPI counters correct
  - Filter by agency → correct subset

**Acceptance Gate:**
```bash
npm run test:coverage -- tests/integration/
```

**Expected Output:**
```
sensorPipeline.test.ts:     ✓ 6 tests pass
geocodingFlow.test.ts:      ✓ 5 tests pass
exportFlow.test.ts:         ✓ 8 tests pass
adminDashboard.test.ts:     ✓ 4 tests pass
────────────────────────────
Total:                      23 tests, no failures
Coverage:                   72% (integration only)
```

**Clearance Criteria:**
- ✅ All integration tests passing
- ✅ Sensor pipeline flow validated
- ✅ Geocoding + routing flow validated
- ✅ Export formats validated
- ✅ Admin aggregations correct
- Opus decision: Critical user flows solid. Ready for E2E?

---

## Phase 5 — E2E & Production Ready

**Goal:** Validate user-facing flows in real browser environment before production.

**Scope:**
- Playwright tests for critical paths (incident creation, PDF export, admin view)
- Production build validation (bundle size, performance)
- Security check (no sensitive data exposed, CSP headers)
- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsiveness verification (iPhone, Android breakpoints)

**Key Test Files to Create:**
- `tests/e2e/incidentCreation.spec.ts`
  - User opens app → clicks "Start Drive Sensor"
  - Simulates pothole impact → incident auto-created
  - User exports as PDF → file downloads
- `tests/e2e/adminDashboard.spec.ts`
  - Admin opens /admin → sees dashboard
  - Filters incidents → correct KPIs
  - Exports CSV → file correct
- `tests/e2e/mobileResponsive.spec.ts`
  - iPhone SE viewport → buttons clickable
  - Map touch interactions work
  - Camera capture functional

**Acceptance Gate:**
```bash
npm run build                    # Production build succeeds
npm run preview &                # Preview server starts
npm run test:e2e                 # All E2E tests pass
npm run test:coverage            # Final coverage report
```

**Expected Output:**
```
✓ Production build: 245 KB (main.js + vendors)
✓ Dev server starts on http://localhost:4173
✓ E2E Tests: 10 passed, 0 failed
✓ Coverage Summary:
  Lines:       82%
  Statements:  82%
  Branches:    75%
  Functions:   88%
✓ Chrome, Firefox, Safari pass
✓ Mobile (iPhone SE, Pixel 5) responsive
```

**Clearance Criteria:**
- ✅ Production build succeeds
- ✅ All E2E tests passing
- ✅ 75%+ overall coverage
- ✅ Bundle size reasonable (~250 KB main.js)
- ✅ No security warnings
- ✅ Cross-browser passes
- ✅ Mobile responsive verified
- Opus decision: Production ready for deployment?

---

## Clearance Procedure

**At every phase boundary:**

1. **Run acceptance gate** — copy/paste output
2. **Escalate to `deep`** — provide:
   - What was built in this phase
   - Gate output (verbatim)
   - Files changed (git diff summary)
   - What next phase would do
3. **Stop** — do not proceed to next phase while waiting
4. **Await explicit clearance** from `deep`
5. **Proceed only if cleared** — any conditional is not clearance

**If `deep` declines:**
- Fix the named defect
- Re-run acceptance gate
- Re-submit same phase (do not argue forward)

---

## Escalation Triggers

**Observable — do not interpret. Always escalate if ANY fires:**
1. Architecture decision needed
2. Test gate ambiguous or borderline pass
3. Two fix attempts failed
4. Security-sensitive code
5. Hard-to-reverse operation (delete, force-push, major refactor)

---

## Current Status

- **Phase 0:** In Progress (CLAUDE.md created, testing setup next)
- **Phase 1–5:** Not Started
- **Branch:** evale
- **Last Updated:** 2026-09-22

**Next Step:** Create vitest.config.ts and tests/setup.ts, then run Phase 0 acceptance gate.
