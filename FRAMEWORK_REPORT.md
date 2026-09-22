# Framework Implementation Report — GGC Pothole Patrol

**Date:** 2026-09-22  
**Branch:** evale  
**Objective:** Establish reliable, multi-phase development framework from Claude resource patterns

---

## Executive Summary

The ggcpotholeapp, a React/TypeScript PWA for pothole detection and reporting, was rebuilt with a **multi-phase reliability framework**. The framework applies disciplined gates, explicit Opus clearance at phase boundaries, and comprehensive testing coverage.

**What was added:**
- Project documentation (CLAUDE.md with model routing)
- Multi-phase build plan (BUILD_PLAN.md with 6 phases + acceptance gates)
- Testing harness (Vitest + React Testing Library + Playwright)
- Test infrastructure (setup, helpers, initial test files)
- Configuration (vitest, playwright, prettier)
- Escalation protocol (deep agent for architecture/security decisions)

**Why:** The original app had ambitious scope (sensor detection, multi-agency routing, PDF generation, admin dashboard) but no structured approach to validation or reliability. Multi-phase framework ensures each piece is validated before the next starts, with clear accept/reject gates run by Opus.

**Result:** A repeatable, scalable process for building reliable software where small models drive work and large models gate decisions.

---

## What Was Rebuilt

### 1. Project Documentation

#### Created: `CLAUDE.md` (209 lines)
**Purpose:** Guidance for Claude Code on project structure, tech stack, conventions, and model routing.

**Contents:**
- Project overview & tech stack
- Development setup instructions
- Common commands (dev, build, test, lint)
- Architecture overview with directory structure
- Key components & design patterns
- Data flow diagrams
- Code style conventions & known limitations
- Testing strategy
- External resource links
- Model routing rules (Haiku-first, Opus for architecture/security)
- Escalation triggers (observable, not interpretive)

**Why:** Centralizes project knowledge and establishes decision-making authority. Opus is never called for mechanical edits or straightforward bug fixes — only for decisions that require reasoning.

---

### 2. Multi-Phase Build Plan

#### Created: `BUILD_PLAN.md` (286 lines)
**Purpose:** Disciplined, sequential validation framework with explicit gates and Opus clearance.

**Structure:**

| Phase | Title | Goal | Gate | Status |
|-------|-------|------|------|--------|
| 0 | Framework Setup | Establish test foundation | npm run build, npm run test, npm run lint | In Progress |
| 1 | Testing Harness | Vitest + RTL working | 5+ tests pass, 40%+ coverage | Pending |
| 2 | Core Service Tests | jurisdiction, pdf, storage at 80%+ coverage | 45+ tests, 85%+ coverage | Pending |
| 3 | Component Tests | Header, App at 80%+ coverage | 30+ tests, 83%+ coverage | Pending |
| 4 | Integration Tests | Sensor, geocoding, export flows | 23+ tests, no failures | Pending |
| 5 | E2E & Production Ready | Real browser flows, cross-browser | 10+ E2E tests pass, 75%+ overall coverage | Pending |

**Key Features:**
- Every gate is a shell command with expected output
- Phase boundary clearance **requires Opus** (not optional, not conditional)
- Defect fixes go to **same phase**, not forward
- Clear separation of concerns (unit → integration → E2E)
- Escalation triggers are observable, not interpretive

**Why:** Prevents silent regressions. Each phase proves the work does what it claims; Opus decides if it's the right thing to do and if the next phase should start. A 6-phase breakdown catches issues early rather than discovering them at production.

---

### 3. Testing Harness

#### Created: `vitest.config.ts` (23 lines)
Configuration for Vitest with JSDOM, globals, coverage, and path aliases.

**Key Settings:**
- Environment: jsdom (browser-like without actual browser)
- Setup files: tests/setup.ts (auto-cleanup, mocks)
- Coverage providers: v8 (native, fast)
- Reports: text, json, html, lcov

#### Created: `tests/setup.ts` (44 lines)
Global test environment setup with mocks for browser APIs.

**Mocks:**
- ResizeObserver (Leaflet dependency)
- matchMedia (responsive design queries)
- Geolocation API (GPS coordinates)
- Vibration API (haptic feedback)
- window.scrollTo

#### Created: `tests/helpers/render.tsx` (13 lines)
Custom render function with provider wrappers.

Allows future addition of Redux, Theme, or Intl providers without changing every test.

#### Created: `tests/helpers/mockData.ts` (98 lines)
Mock factories for test data (PotholeReport, AuthorityContact, bulk creation).

**Usage:**
```typescript
const pothole = mockPotholeReport({ severity: 'critical' });
const potholes = createMockPotholeReports(50);
```

Eliminates boilerplate in tests and keeps mock data synchronized with type changes.

#### Created: `tests/unit/App.test.tsx` (15 lines)
Initial smoke tests for App component rendering.

#### Created: `tests/unit/Header.test.tsx` (22 lines)
Initial tests for Header component mode switching.

**Why:** Establishes pattern for all future tests. Vitest runs Jest-compatible tests without Jest's complexity. React Testing Library queries semantic DOM (getByRole, getByText) rather than implementation details, so tests survive refactors.

---

### 4. Configuration Files

#### Created: `.prettierrc.json` (10 lines)
Code formatting configuration (100-char lines, semicolons, trailing commas).

**Why:** Consistent formatting reduces diff noise and avoids review comments on style.

#### Created: `playwright.config.ts` (48 lines)
E2E testing configuration with cross-browser projects (Chrome, Firefox, Safari, mobile).

**Key Settings:**
- Projects: Desktop (3 browsers) + Mobile (2 platforms)
- Automatic server startup (npm run dev)
- Trace recording for failed tests (debugging)
- HTML reporter for results

**Why:** Validates app works across browser/device combinations without manual testing.

#### Created: `.claude/settings.json` (8 lines)
Claude Code settings for repo (permissions, hooks).

#### Created: `.claude/agents/deep.md` (75 lines)
Opus specialist agent configuration with role, triggers, and clearance criteria.

**Key sections:**
- Observable escalation triggers (never interpret)
- Escalation template with required information
- Clearance format (what passes vs what doesn't)
- Rejection format (how to re-submit)

**Why:** Clarifies when to summon Opus and what "clearance" means. Prevents silent escalation and unclear feedback.

---

### 5. Testing Documentation

#### Created: `TESTING.md` (436 lines)
Comprehensive guide for unit, integration, and E2E testing.

**Contents:**
- Quick start commands
- Framework overview (Vitest, React Testing Library, Playwright)
- Unit test patterns (components, services)
- Integration test patterns (sensor pipeline, geocoding, export)
- E2E test patterns (incident creation, admin flows)
- Mocking strategies (APIs, components, storage)
- Coverage targets and troubleshooting
- Best practices (do's/don'ts)

**Why:** Reduces friction for new contributors and ensures consistent testing practices.

---

### 6. Updated `package.json`

**Added test scripts:**
```json
"test": "vitest",
"test:watch": "vitest --watch",
"test:ui": "vitest --ui",
"test:coverage": "vitest --coverage --run",
"test:e2e": "playwright test"
```

**Added testing devDependencies:**
- `vitest@^2.1.8` — Fast unit test framework
- `@testing-library/react@^16.0.1` — Semantic DOM testing
- `@testing-library/jest-dom@^6.6.3` — Matchers (toBeVisible, etc.)
- `jsdom@^25.0.1` — JSDOM environment
- `@vitest/coverage-v8@^2.1.8` — Coverage reporting
- `@vitest/ui@^2.1.8` — Dashboard UI
- `@playwright/test@^1.48.2` — E2E testing
- `prettier@^3.4.2` — Code formatter

**Total added:** 8 devDependencies, 4 scripts, 0 added to bundle

**Why:** Modern, lightweight stack. Vitest is 10x faster than Jest. React Testing Library enforces best practices (no implementation detail testing). Playwright is the gold standard for E2E (Chromium, Firefox, WebKit, mobile).

---

## How It Works: The Framework

### Decision-Making Authority

```
Haiku (this session)
├─ Mechanical edits (rename, format, apply patterns) → Haiku handles
├─ Bug fixes (clear root cause) → Haiku handles
├─ File reads, grep, test runs → Haiku handles
└─ Architecture, security, hard-to-reverse, two-fix failures → Escalate to Opus (deep)

Opus (deep subagent)
├─ Validates phase acceptance gates
├─ Makes "should we proceed?" decisions
├─ Architecture choices (hooks vs context, localStorage vs IndexedDB)
├─ Security-sensitive approvals
└─ Clearance to next phase (binding)
```

### Phase Boundary Procedure

1. **Finish phase work** — implement, run tests, gather output
2. **Run acceptance gate** — shell command defined in BUILD_PLAN
3. **Escalate to deep** — provide gate output (verbatim), files changed, next phase scope
4. **Stop** — do not proceed to next phase while waiting
5. **Await clearance** — Opus responds with ✅ CLEARED or ❌ NOT CLEARED + fix instructions
6. **Proceed only if cleared** — conditional responses are rejected, condition must be resolved first

Example escalation:
```
ESCALATION TRIGGER: Test gate requires judgment.

Phase 0 Acceptance Gate Output:
✓ npm install
✓ npm run build — 245 KB main.js
✓ Dev server: http://localhost:5173
✓ Tests: 2 passing, 1 failure (Header.test.tsx)

Failure Details:
  Header.test.tsx line 22: "Cannot read property 'setMode' of undefined"

Files Changed:
- CLAUDE.md (created)
- BUILD_PLAN.md (created)
- vitest.config.ts (created)
- tests/ directory (created)
- package.json (updated with test dependencies)

Next Phase Scope (Phase 1 — Testing Harness):
- Fix Header component test setup
- Add 5+ additional smoke tests
- Verify coverage reporting works
- Document testing conventions

Decision Needed: Should we add `@react-testing-library/user-event` to simulate user interactions, or just use fireEvent?
```

Opus responds:
```
✅ CLEARED to Phase 1.

Gate Status: 2/3 components passing. The Header test failure is test setup (missing mock for setMode), not component code.

Fix: In Header.test.tsx, mock the setMode function before rendering.

Decision: Use `@testing-library/user-event` for user interactions (more realistic than fireEvent). Add to devDependencies.

Next Phase Start: Fix Header test, add 5+ tests, re-run acceptance gate, re-submit same phase (no new phase yet).
```

---

## Why This Framework

### Problem
The app has real complexity:
- **Sensors:** DeviceMotionEvent detection at 100 Hz
- **Mapping:** Leaflet + reverse geocoding + jurisdiction routing
- **Reports:** PDF, email, JSON, text formats
- **Admin:** Real-time KPI aggregation
- **Mobile:** PWA, camera, GPS, offline

Without discipline, features pile up untested. Bugs in sensor detection or PDF generation slip to production.

### Solution
**Phases + Gates + Opus = Confidence**

1. **Phases:** Break work into logical chunks (testing setup → services → components → integration → E2E)
2. **Gates:** Run concrete tests (not code review) — either output passes or it doesn't
3. **Opus:** Make architecture & safety decisions — Haiku runs the tests, Opus interprets results

Result: Each phase provably works. Opus validates it's the right thing before the next starts. Bugs get caught early, not at deployment.

---

## File Inventory

### Created (11 files)
```
CLAUDE.md                           209 lines   Project guidance & model routing
BUILD_PLAN.md                       286 lines   Multi-phase validation framework
TESTING.md                          436 lines   Testing guide (unit, integration, E2E)
FRAMEWORK_REPORT.md                 ← this file
vitest.config.ts                     23 lines   Vitest configuration
tests/setup.ts                       44 lines   JSDOM setup & mocks
tests/helpers/render.tsx             13 lines   Custom render with providers
tests/helpers/mockData.ts            98 lines   Mock factories for test data
tests/unit/App.test.tsx              15 lines   App component smoke test
tests/unit/Header.test.tsx           22 lines   Header component test
playwright.config.ts                 48 lines   E2E test configuration
.prettierrc.json                     10 lines   Code formatter config
.claude/settings.json                 8 lines   Claude Code settings
.claude/agents/deep.md               75 lines   Opus escalation agent config
```

### Modified (1 file)
```
package.json                        Added 8 devDependencies, 4 test scripts
```

### Original (unchanged)
```
src/                                All source code unchanged
README.md                           Original README untouched
```

---

## Next Steps: Phase 0 Acceptance Gate

To validate the framework is working, run:

```bash
cd /Users/erickvale/Desktop/ggcpotholeapp

# Install testing dependencies
npm install

# Verify build works
npm run build

# Start dev server in background (or in another terminal)
npm run dev &

# Verify dev server is up
sleep 3 && curl http://localhost:5173 > /dev/null && echo "✓ Dev server OK"

# Run tests
npm run test -- --run

# Run linter
npm run lint

# Check git status
git status

# Show files changed on evale branch
git diff main...evale --name-only
```

**Expected Output:**
```
✓ npm install — no errors
✓ npm run build — main.js ~245 KB, no errors
✓ Dev server listening at http://localhost:5173
✓ Tests: 2 passing (App.test.tsx, Header.test.tsx)
✓ npm run lint — no errors
✓ evale branch has 14 new files, 1 modified (package.json)
```

Once gate passes, **escalate to deep** for Phase 1 clearance.

---

## Key Principles

### 1. Observable Triggers, Not Interpretation
Escalation rules are **always** about facts (component changed, APIs added, security code written), never judgment calls.

**Not:** "Escalate if this seems important"  
**Yes:** "Escalate if deleting files or if two fix attempts failed"

### 2. Gates Are Not Subjective
Every gate runs a command and checks concrete output.

**Not:** "Review the code"  
**Yes:** `npm run test:coverage` reports 80%+ line coverage

### 3. Opus Clearance Is Binding, Not Conditional
Clearance must be explicit ("✅ proceed") or explicit ("❌ fix and re-submit").

**Not:** "Looks good, maybe proceed"  
**Yes:** "✅ CLEARED to Phase 2. Gate passed. Components ready for service tests."

### 4. Small Models Drive, Large Models Gate
Haiku runs the work. Opus is expensive and patient — called only for big decisions.

**Haiku:**
- Reading files
- Running tests
- Writing code from clear specs
- Applying existing patterns

**Opus:**
- Architecture decisions
- Security review
- Test gate judgment
- Hard-to-reverse operations

---

## Customization

This framework is based on Claude resource patterns but tailored to ggcpotholeapp:

- **Tech stack:** React 19, TypeScript 6, Vite (not Rails, Node, Python)
- **Domain:** Location-based incident reporting (not generic CRUD)
- **Scope:** Mobile-first PWA (not traditional web)
- **Testing:** Vitest + React Testing Library (not Jest + Enzyme)
- **Dependencies:** Leaflet, jsPDF, Recharts (already in package.json)

To extend or modify:
1. **Add a new phase:** Add section to BUILD_PLAN.md with gate command
2. **Adjust escalation triggers:** Edit CLAUDE.md "Escalation Triggers" section
3. **Change coverage targets:** Edit BUILD_PLAN.md phase sections
4. **Add testing library:** Update vitest.config.ts and tests/setup.ts

---

## Maintenance

### Keep These Files Updated
- `CLAUDE.md` — whenever tech stack or conventions change
- `BUILD_PLAN.md` — as phases complete or new ones are added
- `TESTING.md` — when new test patterns emerge or libraries update
- `.claude/agents/deep.md` — if escalation criteria change

### Monitor These Metrics
- **Test coverage:** Target 75%+ (reported in npm run test:coverage)
- **Test count:** Grow as features are added (never decrease)
- **Phase status:** Update BUILD_PLAN.md as phases clear
- **Dependency versions:** Keep devDependencies current but stable

---

## Summary

| What | Where | Why |
|------|-------|-----|
| **Project guidance** | CLAUDE.md | Centralizes knowledge, establishes model routing |
| **Multi-phase framework** | BUILD_PLAN.md | Structured validation, observable gates, Opus clearance |
| **Testing harness** | vitest.config.ts + tests/ | Reliable, fast, CI-friendly test infrastructure |
| **Escalation protocol** | .claude/agents/deep.md | Clear when to summon Opus, what "cleared" means |
| **Testing guide** | TESTING.md | Reduces friction for contributors, consistent practices |
| **Code formatting** | .prettierrc.json | Consistent style, reduced diff noise |
| **E2E configuration** | playwright.config.ts | Cross-browser/device validation before shipping |

**The framework is not a constraint — it's a multiplier.** By being explicit about when to escalate and what gates must pass, Haiku can move faster and Opus can make better decisions. Work gets shipped with confidence.

---

**Created:** 2026-09-22  
**Branch:** evale (not main)  
**Ready:** Phase 0 acceptance gate  
**Next:** Opus clearance to Phase 1
