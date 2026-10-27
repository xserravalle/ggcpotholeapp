# GGC SansPotholes: Post-Deployment Operations, Security & Strategic Roadmap
**Course**: Software Development 2 (ITEC 4860 Senior Capstone)  
**Project Team**: Peyton Holland, Erick Vale, Tina Ly, Hina Luna  
**Live Production URL**: [https://sanspotholes.pages.dev](https://sanspotholes.pages.dev)  
**Repository**: [github.com/xserravalle/ggcpotholeapp](https://github.com/xserravalle/ggcpotholeapp)  
**Date**: Fall 2026

---

## Executive Summary
Now that **GGC SansPotholes** is permanently deployed to production on **Cloudflare Pages** and connected directly to **GitHub**, our team has transitioned from active development to **software operations, maintenance, and community readiness**. 

This operational guide provides our Software Development 2 group, faculty reviewers, and classmates with a comprehensive, plain-English breakdown of:
1. **The GitHub-to-Cloudflare Maintenance Workflow**: How updates, bug fixes, and feature additions move into production.
2. **Automated Quality Assurance & Testing**: Tools and procedures to prevent regressions.
3. **App Privacy & Anti-Stalking Architecture**: How we ensure commuters are protected from surveillance and data exposure.
4. **Civic Marketing & Stakeholder Outreach**: High-value partnerships across GGC and Gwinnett County.

---

## 1. Maintenance & Upkeep: The GitHub & Cloudflare Pipeline

### 1.1 The Source of Truth vs. The Production Host
To understand maintenance, think of **GitHub** as the *kitchen and recipe book*, while **Cloudflare Pages** is the *restaurant table where food is served to customers*:
* **GitHub (`xserravalle/ggcpotholeapp`)**: Holds all raw source code, assets, commit history, and automated build instructions. It is the single source of truth.
* **Cloudflare Pages (`sanspotholes.pages.dev`)**: A global content delivery network (CDN) with 300+ edge data centers. It does not store code; instead, it listens for changes on GitHub, compiles the code using `npm run build`, and serves the resulting `dist/` bundle to the public over automatic HTTPS.

### 1.2 Which Version Does Cloudflare Deploy?
* Cloudflare Pages is configured to watch the **`main`** branch on GitHub.
* **Whatever commit sits at the tip of `main` is the exact version that the public sees on `https://sanspotholes.pages.dev`.**
* If someone pushes to a different branch (e.g. `feature/dark-mode` or `fix/sensor-bug`), Cloudflare **does not** touch the live public site. Instead, it generates a private **Preview Deployment URL** that only our team can view for testing.

```
[Developer Workstation]
       │
       ▼ (git push)
[Feature Branch on GitHub] ────► [Cloudflare Preview URL] (Team tests privately)
       │
       ▼ (Pull Request & Code Review)
[Merge into 'main' Branch]  ────► [Cloudflare Production Build] (Updates sanspotholes.pages.dev in ~45s)
```

### 1.3 Step-by-Step Workflow: Adding Features or Fixing Bugs
Moving forward, our team should adopt standard industry Git branching etiquette. **No developer should push experimental code directly to `main`.**

1. **Create an Isolated Branch**:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/audio-announcements  # or fix/map-popup
   ```
2. **Make & Test Changes Locally**:
   Run the local development server and run tests to ensure zero breakages:
   ```bash
   npm run dev    # Test interactively at http://localhost:5173
   npm test       # Run automated unit test suite
   npm run build  # Verify TypeScript compilation (0 errors)
   ```
3. **Commit & Push to GitHub**:
   ```bash
   git add -A
   git commit -m "feat(audio): add hazard chime alerts before Southern voice playback"
   git push origin feature/audio-announcements
   ```
4. **Open a GitHub Pull Request (PR)**:
   * Open a PR into `main` on GitHub.
   * Cloudflare will automatically build a **temporary preview link** directly on the PR. The team can test the feature on their actual phones before approving.
5. **Merge into `main`**:
   * Once approved, click **Merge pull request**.
   * Cloudflare automatically detects the new commit on `main`, runs `npm run build`, and deploys to `https://sanspotholes.pages.dev` within 45 seconds with **zero downtime**.

### 1.4 What Changes Are Needed Inside Cloudflare?
**Almost never anything.**  
Once Cloudflare Pages is linked to your GitHub repository and the environment variables (`NODE_VERSION: 20`) are set, the deployment pipeline is **100% automated**. You do not need to log into Cloudflare to deploy code; simply merging a PR on GitHub triggers the entire deployment lifecycle.

*The only rare exception*: If our app introduces a new external secret API key in the future (e.g., an enterprise GDOT API key), that key would be added under Cloudflare’s *Settings > Variables and secrets*.

---

## 2. Quality Assurance & Automated Testing Strategy

To ensure maintenance updates do not break existing mobile functionality (such as the accelerometer, reverse geocoding, or PDF generation), we employ a multi-tier testing strategy.

### 2.1 The Testing Pyramid
```
         / \
        / E2E \       Playwright (Full user workflows in real browser)
       /───────\
      / Component\    React Testing Library (Modals, map pins, theme preview)
     /─────────────\
    /  Unit Tests   \ Vitest (Distance math, G-force filters, axle bounce timers)
   /─────────────────\
```

1. **Unit Tests (Fast & Mathematical)**:
   * **Scope**: Pure logic functions that have no UI.
   * **Examples**: `distanceCalculator.ts` (Haversine formula for GGC perimeter), `jurisdictionClassifier.ts` (routing coordinates to Gwinnett DOT vs. Lawrenceville), and axle-bounce cooldown deduplication.
2. **Component & Integration Tests**:
   * **Scope**: Verifying that UI components respond correctly to user actions.
   * **Examples**: Verifying that clicking "+1 Confirm" increments the verification counter, checking that Comic Sans and Okabe-Ito theme toggles update the DOM, and confirming that the Admin Auth modal rejects invalid passwords.
3. **End-to-End (E2E) Browser Tests**:
   * **Scope**: Automated robotic testing of the live app in a real headless browser.
   * **Examples**: Simulating a user clicking "Start Drive Patrol", emitting synthetic `DeviceMotionEvent` shocks, clicking "End Patrol", and confirming that the Drive Summary readout displays the incident list.

### 2.2 Recommended Testing Stack (Already Configured in our App)
* **Vitest (`npm test`)**: A blazingly fast unit test runner natively integrated with Vite. Runs our unit test suite in milliseconds.
* **React Testing Library**: Allows us to simulate user clicks, text input, and screen reader announcements.
* **Playwright (`@playwright/test`)**: Already present in our `package.json`. Allows automated cross-browser testing across mobile Chrome, Firefox, and Safari viewports.

### 2.3 Automated GitHub Actions CI (Continuous Integration)
To ensure that broken code cannot be merged into `main`, we can enable a lightweight GitHub Actions workflow (`.github/workflows/ci.yml`). Every time a teammate submits a pull request, GitHub automatically runs:
```yaml
name: Test & Build Gate
on: [pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm test
      - run: npm run build
```
*If a test fails or TypeScript throws an error, GitHub blocks the merge button*, preventing bugs from reaching the production Cloudflare site.

---

## 3. Privacy, Data Security & Anti-Stalking Protections

Because **GGC SansPotholes** tracks vehicle movement, shock impacts, and geospatial coordinates, **privacy and driver safety are core ethical requirements**. If commuter data were poorly managed, location breadcrumbs could inadvertently reveal a student's home address, work schedule, or personal travel habits.

Our architecture enforces **Privacy-by-Design** across five distinct security barriers:

```
[Driver Commute]
      │
      ▼
[In-Memory Polyline] ──► NEVER sent to server; destroyed when session ends
      │
      ├─► Shock Detected (e.g. 7.80G at Collins Hill Rd)
      │
      ▼
[Isolated Point Incident] ──► Only [lat, lng, G-force] extracted
      │
      ▼
[Public Hazard Pin] ──► ZERO personal info (No student name, car, or route)
```

### 3.1 Ephemeral Route Trajectories (Zero Server Breadcrumbs)
* The GPS breadcrumb trail drawn during **Drive-Time Mapping** exists **exclusively in the browser's local RAM memory** for the duration of that single drive session.
* **No trip history or transit route is ever transmitted to a remote server or persistent database.**
* When the commuter closes the tab or ends the drive session, the route trajectory is discarded.

### 3.2 Decoupled Point-Source Evidence (No Start/End Tracking)
* When a severe shock occurs, the app isolates **only the single point-source coordinate** `[latitude, longitude]` where the impact happened.
* The system never records where the driver started their journey (e.g. their home driveway) or where they were heading.
* An outside observer viewing a pothole on the map has zero ability to determine who hit it, what vehicle they drove, or what path they traveled.

### 3.3 Zero Personally Identifiable Information (PII) on the Public Map
* Public map pins display only:
  1. The landmark or road name (*"Collins Hill Rd near Campus Loop"*).
  2. The reverse-geocoded municipal address.
  3. The physical shock magnitude (*"7.80G Shock"*).
  4. The community confirmation count (*"5 drivers confirmed"*).
* **No student names, student IDs, IP addresses, phone numbers, or account names are ever attached to hazard markers.**

### 3.4 Role-Based Administrative Gating
* Following our recent pull request (`hluna`), sensitive municipal actions—such as bulk public works dispatch and high-level pavement analytics—are gated behind an **Admin Authentication barrier** (`AuthContext`).
* General commuters can view hazards and log drives; only authorized administrators can trigger external dispatch workflows.

### 3.5 Local Storage Sanitization
* All user preferences, draft reports, and local verification tallies are stored in the user's private browser `localStorage`.
* Commuters have full agency to wipe their local history at any time using the clear data controls in the Settings modal.

---

## 4. Community Adoption, Marketing & Stakeholder Outreach

A civic technology application is only as valuable as the community that uses it. To transition GGC SansPotholes into a thriving campus and county utility, we have mapped out three high-impact target stakeholder groups:

### 4.1 Target Stakeholder Groups

| Stakeholder Group | Why They Care | How They Can Harness the App |
| :--- | :--- | :--- |
| **GGC Student Government Association (SGA)** | Campus safety, student vehicle damage prevention, commuter advocacy. | Can sponsor campus-wide awareness campaigns and present road condition reports directly to the GGC President’s Cabinet. |
| **GGC Campus Police & Facilities Management** | Campus roadway safety, pedestrian crosswalk integrity, parking deck maintenance. | Can use the app to monitor potholes on campus-owned roads (University Center Ln, Lonnie Harvel Way, Parking Lots 1000–3000). |
| **Gwinnett County Department of Transportation (Gwinnett DOT)** | Countywide road maintenance prioritization, citizen reporting accuracy. | Can ingest our certified, geocoded PDF work order dockets with embedded map screenshots for crew dispatch. |
| **City of Lawrenceville Public Works** | Local municipal streets surrounding GGC campus (Collins Hill Rd, Hwy 29). | Can receive verified work order notices routed specifically to their municipal authority. |
| **Gwinnett County Public Schools (GCPS Bus Operations)** | Largest school bus fleet in Georgia; vehicle suspension damage prevention. | Bus drivers and route supervisors could utilize Drive-Time Mapping during morning route checks to log road hazards before student transit. |
| **Local Delivery & Rideshare Drivers (DoorDash, Uber, Amazon)** | Commercial drivers whose livelihood depends on vehicle preservation. | Grassroots user base who drive thousands of miles weekly across Gwinnett County corridors. |

### 4.2 Practical Distribution & Marketing Tactics

1. **The Progressive Web App (PWA) QR Code Campaign**:
   * Because GGC SansPotholes is hosted on Cloudflare Pages with full PWA manifest support, **users do not need to download it from an App Store**.
   * We can print posters with QR codes and place them at high-traffic commuter choke points:
     * GGC Student Center information desks and commuter lockers.
     * Stairwells and elevator lobbies in the Student Parking Decks.
     * Digital signage boards across the ITEC building (Building W).
   * Commuters scan the QR code and tap **"Add to Home Screen"** on their phone for an instant native app experience.

2. **The "Protect Your Ride" Student Outreach Initiative**:
   * Market the app around a direct student pain point: **"Avoid an $800 wheel and suspension repair bill."**
   * Partner with the GGC Student News / The Grizzly Gazette for an editorial feature on student-engineered civic computing.

3. **Academic Capstone Showcase & Municipal Demo Day**:
   * Present the 12-slide Capstone Evaluation and 3-slide Press Release decks to faculty evaluators, local industry advisory boards, and Gwinnett municipal representatives.
   * Provide live demonstrations showing a phone running the app over the Cloudflare production URL while hitting simulated road bumps.

4. **Civic Tech Open Source Alliances**:
   * Connect with **Code for America (Atlanta Brigade)** and local open-data civic tech hackathons to showcase GGC SansPotholes as a model for university-municipal collaboration.

---

## 5. Summary Checklist for Classroom Presentation

When presenting our post-deployment plan to our Software Development 2 classmates, use this 60-second summary:

* **Deployment**: GitHub is our development workbench; Cloudflare Pages is our automated production host. Merging code into `main` automatically updates `sanspotholes.pages.dev` in 45 seconds with 0 downtime.
* **Testing**: We use Vitest for lightning-fast unit tests, React Testing Library for UI components, and Playwright for automated mobile browser simulation.
* **Privacy**: Drive trajectories are kept 100% ephemeral in local device memory. Only isolated, anonymous shock coordinates are shared; commuters can never be tracked or stalked.
* **Civic Value**: The app solves the distracted driving dilemma by replacing manual forms with automated hands-free patrol, empowering GGC students, Gwinnett DOT, and municipal crews to keep local roads safe.
