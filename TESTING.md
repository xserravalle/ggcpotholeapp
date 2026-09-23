# Testing Guide — GGC Pothole Patrol

Comprehensive testing framework for unit, integration, and end-to-end testing of the ggcpotholeapp.

---

## Quick Start

### Install Testing Dependencies
```bash
npm install
```

### Run Tests
```bash
# Run all tests once
npm run test

# Watch mode (re-run on file changes)
npm run test:watch

# UI dashboard
npm run test:ui

# Coverage report
npm run test:coverage

# E2E tests
npm run test:e2e
```

---

## Framework Overview

| Layer | Tool | Purpose | Location |
|-------|------|---------|----------|
| **Unit** | Vitest + React Testing Library | Test individual functions & components in isolation | `tests/unit/` |
| **Integration** | Vitest + mocked APIs | Test realistic user flows & multi-component interactions | `tests/integration/` |
| **E2E** | Playwright | Test entire app in real browser (headless or interactive) | `tests/e2e/` |

---

## Unit Tests

Test individual components and services in isolation.

### Running Unit Tests
```bash
npm run test -- tests/unit/
npm run test:watch -- tests/unit/
```

### File Structure
```
tests/unit/
├── components/
│   ├── App.test.tsx
│   └── Header.test.tsx
├── services/
│   ├── jurisdictionClassifier.test.ts
│   ├── pdfGenerator.test.ts
│   └── storageService.test.ts
└── helpers/
    ├── mockData.ts          # Mock factories for test data
    └── render.tsx           # Custom render with providers
```

### Example: Component Test

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '../helpers/render';
import Header from '@/components/Header';

describe('Header', () => {
  it('should switch between campus and county mode', () => {
    const setMode = vi.fn();
    render(<Header mode="campus" setMode={setMode} />);
    
    const countyButton = screen.getByText(/county/i);
    fireEvent.click(countyButton);
    
    expect(setMode).toHaveBeenCalledWith('county');
  });
});
```

### Example: Service Test

```typescript
import { describe, it, expect } from 'vitest';
import { classifyJurisdiction } from '@/services/jurisdictionClassifier';

describe('jurisdictionClassifier', () => {
  it('should classify GGC campus coordinates to GGC Facilities', () => {
    const result = classifyJurisdiction(33.9798, -84.0017);
    expect(result.id).toBe('GGC');
    expect(result.name).toBe('GGC Facilities');
  });
});
```

### Mock Data Helpers

Pre-built mock factories in `tests/helpers/mockData.ts`:

```typescript
import { mockPotholeReport, mockAuthorityContact, createMockPotholeReports } from '../helpers/mockData';

// Single mock
const pothole = mockPotholeReport({ severity: 'critical' });

// Multiple mocks
const potholes = createMockPotholeReports(10);

// All authority contacts
import { allAuthorityContacts } from '../helpers/mockData';
```

---

## Integration Tests

Test realistic user flows that combine multiple components and services.

### Running Integration Tests
```bash
npm run test -- tests/integration/
npm run test:watch -- tests/integration/
```

### File Structure
```
tests/integration/
├── sensorPipeline.test.ts      # DeviceMotionEvent → incident creation
├── geocodingFlow.test.ts       # Map click → reverse geocode → jurisdiction lookup
├── exportFlow.test.ts          # Incident → PDF/JSON/email/text generation
└── adminDashboard.test.ts      # Incident aggregation & KPI calculation
```

### Example: Sensor Pipeline Test

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../helpers/render';
import App from '@/App';
import { createMockPotholeReports } from '../helpers/mockData';

describe('Sensor Pipeline', () => {
  it('should detect a 5.2G spike and create incident', async () => {
    const { container } = render(<App />);
    
    // Simulate DeviceMotionEvent with 5.2G spike
    const event = new DeviceMotionEvent('devicemotion', {
      acceleration: { x: 0, y: 0, z: 51.2 }, // 5.2G = 51.2 m/s²
    });
    window.dispatchEvent(event);
    
    // Verify incident was created in storage
    await waitFor(() => {
      const incidents = JSON.parse(localStorage.getItem('incidents') || '[]');
      expect(incidents.length).toBe(1);
      expect(incidents[0].bumpIntensity).toBeCloseTo(5.2, 1);
    });
  });
});
```

### Example: Geocoding Flow Test

```typescript
describe('Geocoding Flow', () => {
  it('should reverse geocode map click and classify jurisdiction', async () => {
    const { container } = render(<App />);
    
    // Mock Nominatim API
    global.fetch = vi.fn().mockResolvedValueOnce({
      json: async () => ({
        address: { road: 'Main St', city: 'Lawrenceville', postcode: '30043' },
      }),
    });
    
    // Simulate map click
    const mapElement = container.querySelector('[data-testid="map"]');
    fireEvent.click(mapElement, { clientX: 500, clientY: 300 });
    
    // Verify form was populated
    await waitFor(() => {
      expect(screen.getByDisplayValue(/Main St/)).toBeInTheDocument();
      expect(screen.getByText(/GGC Facilities/)).toBeInTheDocument();
    });
  });
});
```

---

## End-to-End Tests (Playwright)

Test the entire app in a real browser environment with realistic user interactions.

### Running E2E Tests

```bash
# Run all E2E tests (headless)
npm run test:e2e

# Run in UI mode (interactive)
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/incidentCreation.spec.ts

# Run in specific browser
npx playwright test --project=chromium
```

### File Structure
```
tests/e2e/
├── incidentCreation.spec.ts    # User creates incident via sensor/map/form
├── adminDashboard.spec.ts      # Admin views dashboard & exports CSV
└── mobileResponsive.spec.ts    # Mobile viewport & touch interactions
```

### Example: Incident Creation E2E Test

```typescript
import { test, expect } from '@playwright/test';

test('user should create pothole incident and export PDF', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Start sensor monitoring
  await page.click('text=Start Drive Sensor');
  
  // Simulate pothole impact
  await page.evaluate(() => {
    const event = new DeviceMotionEvent('devicemotion', {
      acceleration: { x: 0, y: 0, z: 88 }, // 8.8G
    });
    window.dispatchEvent(event);
  });
  
  // Verify incident form opened
  await expect(page.locator('text=Report Pothole')).toBeVisible();
  
  // Fill form
  await page.fill('input[name="description"]', 'Large pothole on Main St');
  await page.selectOption('select[name="severity"]', 'severe');
  
  // Export as PDF
  await page.click('text=Export PDF');
  
  // Verify PDF download
  const downloadPromise = page.waitForEvent('download');
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/GAP-\d+\.pdf/);
});
```

### Debugging E2E Tests

```bash
# Run with debug mode (opens browser, pauses at breakpoints)
npx playwright test --debug

# Generate trace for failed test
npx playwright test --trace on

# View trace after failure
npx playwright show-trace trace.zip
```

---

## Coverage Reports

Generate and view code coverage metrics.

### Generate Coverage Report
```bash
npm run test:coverage
```

### View Coverage Report
```bash
# Open in browser
open coverage/index.html

# View in terminal
npm run test:coverage -- --reporter=verbose
```

### Coverage Targets

| Category | Target | Current |
|----------|--------|---------|
| Lines | 75%+ | ⏳ Phase 1 pending |
| Statements | 75%+ | ⏳ Phase 1 pending |
| Branches | 65%+ | ⏳ Phase 1 pending |
| Functions | 80%+ | ⏳ Phase 1 pending |

---

## Mocking Strategies

### Mocking External APIs

```typescript
import { vi } from 'vitest';

// Mock Nominatim API
global.fetch = vi.fn().mockResolvedValue({
  json: async () => ({
    address: { road: 'Main St', city: 'Lawrenceville' },
  }),
});

// Mock localStorage
const store = {};
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => { store[key] = value; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
  },
});

// Mock DeviceMotionEvent
const event = new DeviceMotionEvent('devicemotion', {
  acceleration: { x: 0, y: 0, z: 51.2 },
});
window.dispatchEvent(event);
```

### Mocking Components

```typescript
import { vi } from 'vitest';

// Mock child component
vi.mock('@/components/MapView', () => ({
  default: () => <div data-testid="mock-map">Mock Map</div>,
}));
```

---

## Best Practices

### Do's
✅ Test user behavior, not implementation  
✅ Use semantic queries (getByRole, getByLabelText)  
✅ Mock external dependencies (APIs, storage, sensors)  
✅ Keep tests focused on one behavior  
✅ Use descriptive test names  
✅ Keep mock data factories DRY  

### Don'ts
❌ Test internal state or props directly  
❌ Test React internals (hooks, rendering cycles)  
❌ Use brittle queries (getByTestId everywhere)  
❌ Mock everything (test real behavior where possible)  
❌ Create deeply nested test structures  
❌ Skip testing error paths  

---

## Troubleshooting

### Tests failing with "Cannot find module" error
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Vitest not finding JSDOM globals
Verify `tests/setup.ts` is referenced in `vitest.config.ts`:
```typescript
test: {
  setupFiles: ['./tests/setup.ts'],
}
```

### React Testing Library queries not working
Use semantic queries (getByRole, getByLabelText) instead of getByTestId.  
Verify elements have accessible attributes (role, aria-label, etc.).

### E2E tests timing out
Increase timeout in `playwright.config.ts`:
```typescript
use: {
  navigationTimeout: 30000,
  actionTimeout: 10000,
}
```

---

## Resources

- **Vitest Docs:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react/
- **Playwright Docs:** https://playwright.dev/
- **Testing Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library/

---

**Last Updated:** 2026-09-22  
**Framework Version:** Vitest 2.1 + React Testing Library 16 + Playwright 1.48
