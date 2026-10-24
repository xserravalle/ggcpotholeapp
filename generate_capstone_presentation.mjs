import pptxgen from 'pptxgenjs';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches
pres.author = 'Peyton Holland';
pres.company = 'Georgia Gwinnett College - ITEC 4860 Senior Capstone';
pres.subject = 'GGC SansPotholes: Branch pholland10132026 vs pholland10202026';
pres.title = 'GGC SansPotholes: Architectural, Aesthetic & Functional Evolution';

// Color Palette
const BG_DARK = '090E1A';
const CARD_BG = '141E33';
const CARD_BORDER = '233352';
const TEXT_WHITE = 'FFFFFF';
const TEXT_MUTED = '94A3B8';
const TEXT_SUBTLE = '64748B';
const GGC_GREEN = '006747';
const GGC_EMERALD = '10B981';
const GGC_GOLD = 'C4A35A';
const ACCENT_TEAL = '14B8A6';
const ACCENT_BLUE = '3B82F6';
const ACCENT_ROSE = 'EF4444';
const ACCENT_AMBER = 'F59E0B';
const ACCENT_PURPLE = '8B5CF6';

const FONT_COMIC = 'Comic Sans MS';

// Helper: Common Header
function addHeader(slide, category, title, subtitle) {
  // Category Pill Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6,
    y: 0.4,
    w: 2.2,
    h: 0.28,
    rectRadius: 0.14,
    fill: { color: '1E293B' },
    line: { color: ACCENT_TEAL, width: 1 }
  });
  slide.addText(category.toUpperCase(), {
    x: 0.6,
    y: 0.4,
    w: 2.2,
    h: 0.28,
    fontSize: 9,
    bold: true,
    color: ACCENT_TEAL,
    fontFace: FONT_COMIC,
    align: 'center',
    valign: 'middle'
  });

  // Slide Title
  slide.addText(title, {
    x: 0.6,
    y: 0.75,
    w: 8.8,
    h: 0.42,
    fontSize: 18,
    bold: true,
    color: TEXT_WHITE,
    fontFace: FONT_COMIC
  });

  // Slide Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.6,
      y: 1.18,
      w: 8.8,
      h: 0.3,
      fontSize: 11,
      color: TEXT_MUTED,
      fontFace: FONT_COMIC
    });
  }
}

// Helper: Common Footer
function addFooter(slide, slideNum) {
  slide.addShape(pres.ShapeType.line, {
    x: 0.6,
    y: 5.15,
    w: 8.8,
    h: 0,
    line: { color: '1E293B', width: 0.8 }
  });

  slide.addText('GGC SansPotholes • ITEC 4860 Senior Capstone • Branch pholland10202026', {
    x: 0.6,
    y: 5.2,
    w: 7.0,
    h: 0.3,
    fontSize: 8,
    color: TEXT_SUBTLE,
    fontFace: FONT_COMIC
  });

  slide.addText(`Slide ${slideNum} of 12`, {
    x: 7.8,
    y: 5.2,
    w: 1.6,
    h: 0.3,
    fontSize: 8,
    color: ACCENT_TEAL,
    fontFace: FONT_COMIC,
    align: 'right'
  });
}

// Helper: Card with accent border
function addCard(slide, { x, y, w, h, title, subtitle, items = [], badge = null, accentColor = GGC_EMERALD, titleColor = TEXT_WHITE }) {
  // Card Container
  slide.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
  });

  // Top Accent Stripe
  slide.addShape(pres.ShapeType.roundRect, {
    x: x + 0.05,
    y: y + 0.05,
    w: w - 0.1,
    h: 0.06,
    rectRadius: 0.03,
    fill: { color: accentColor }
  });

  let currentY = y + 0.18;

  // Optional Badge
  if (badge) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.18,
      y: currentY,
      w: 1.5,
      h: 0.22,
      rectRadius: 0.08,
      fill: { color: '0F172A' },
      line: { color: accentColor, width: 0.8 }
    });
    slide.addText(badge.toUpperCase(), {
      x: x + 0.18,
      y: currentY,
      w: 1.5,
      h: 0.22,
      fontSize: 8,
      bold: true,
      color: accentColor,
      fontFace: FONT_COMIC,
      align: 'center',
      valign: 'middle'
    });
    currentY += 0.28;
  }

  // Card Title
  slide.addText(title, {
    x: x + 0.18,
    y: currentY,
    w: w - 0.36,
    h: 0.3,
    fontSize: 12,
    bold: true,
    color: titleColor,
    fontFace: FONT_COMIC
  });
  currentY += 0.32;

  // Optional Card Subtitle
  if (subtitle) {
    slide.addText(subtitle, {
      x: x + 0.18,
      y: currentY,
      w: w - 0.36,
      h: 0.26,
      fontSize: 9.5,
      color: TEXT_MUTED,
      fontFace: FONT_COMIC
    });
    currentY += 0.3;
  }

  // Card Bullet Items
  if (items.length > 0) {
    const textObjects = items.map((item, idx) => ({
      text: item,
      options: {
        fontSize: 9,
        color: TEXT_WHITE,
        fontFace: FONT_COMIC,
        bullet: true,
        breakLine: idx < items.length - 1,
        paraSpaceAfter: 4
      }
    }));

    slide.addText(textObjects, {
      x: x + 0.18,
      y: currentY,
      w: w - 0.36,
      h: h - (currentY - y) - 0.15,
      valign: 'top'
    });
  }
}

// ==========================================
// SLIDE 1: TITLE SLIDE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  // Decorative Glow & Top Border
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0,
    w: 10,
    h: 0.12,
    fill: { color: GGC_GREEN }
  });
  slide.addShape(pres.ShapeType.rect, {
    x: 0,
    y: 0.12,
    w: 10,
    h: 0.04,
    fill: { color: GGC_GOLD }
  });

  // Capstone Banner
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 1.1,
    w: 4.5,
    h: 0.36,
    rectRadius: 0.18,
    fill: { color: '132A20' },
    line: { color: GGC_GOLD, width: 1.2 }
  });
  slide.addText('GEORGIA GWINNETT COLLEGE • ITEC 4860 SENIOR CAPSTONE', {
    x: 0.8,
    y: 1.1,
    w: 4.5,
    h: 0.36,
    fontSize: 9.5,
    bold: true,
    color: GGC_GOLD,
    fontFace: FONT_COMIC,
    align: 'center',
    valign: 'middle'
  });

  // Main Title
  slide.addText('GGC SansPotholes', {
    x: 0.8,
    y: 1.6,
    w: 8.4,
    h: 0.8,
    fontSize: 34,
    bold: true,
    color: GGC_EMERALD,
    fontFace: FONT_COMIC
  });

  // Subtitle
  slide.addText('Architectural, Aesthetic & Functional Evolution', {
    x: 0.8,
    y: 2.45,
    w: 8.4,
    h: 0.45,
    fontSize: 18,
    bold: true,
    color: TEXT_WHITE,
    fontFace: FONT_COMIC
  });

  slide.addText('A Comprehensive Comparative Analysis: Branch pholland10132026 ➔ pholland10202026', {
    x: 0.8,
    y: 2.95,
    w: 8.4,
    h: 0.35,
    fontSize: 12,
    color: ACCENT_TEAL,
    fontFace: FONT_COMIC
  });

  // Highlight Box: Project Authors & Date
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.8,
    y: 3.65,
    w: 8.4,
    h: 1.2,
    rectRadius: 0.12,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
  });

  slide.addText([
    { text: 'PROJECT TEAM / AUTHORS:\n', options: { bold: true, color: GGC_GOLD, fontSize: 10 } },
    { text: 'Peyton Holland  •  Erick Vale  •  Tina Ly  •  Hina Luna\n\n', options: { color: TEXT_WHITE, fontSize: 11, bold: true } },
    { text: 'EVALUATION DATE: ', options: { bold: true, color: TEXT_MUTED, fontSize: 9.5 } },
    { text: 'October 20, 2026  |  ', options: { color: TEXT_WHITE, fontSize: 9.5 } },
    { text: 'TARGET PLATFORM: ', options: { bold: true, color: TEXT_MUTED, fontSize: 9.5 } },
    { text: 'Samsung Galaxy S25 Ultra (Android 15) & Progressive Web App', options: { color: ACCENT_TEAL, fontSize: 9.5 } }
  ], {
    x: 1.0,
    y: 3.75,
    w: 8.0,
    h: 1.0,
    fontFace: FONT_COMIC
  });

  slide.addNotes(
    "Good morning/afternoon, committee members and colleagues. Welcome to our ITEC 4860 Senior Capstone presentation for GGC SansPotholes.\n\n" +
    "Today, we will walk through the rigorous evolution of our civic hazard detection application, specifically tracking the architectural, aesthetic, and functional transformation between our October 13 baseline branch (pholland10132026) and our modern production release (pholland10202026).\n\n" +
    "We will demonstrate how we systematically eliminated synthetic mock data, integrated genuine mobile accelerometer telemetry, built hands-free Drive-Time Mapping, and engineered universal accessibility—all powered by dyslexia-friendly Comic Sans MS typography."
  );
}

// ==========================================
// SLIDE 2: EXECUTIVE SUMMARY & VISION
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Project Trajectory', 'Executive Summary: The Road to Empirical Telemetry', 'Transforming a conceptual civic prototype into a verifiable, hands-free municipal telemetry system.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '1. Empirical Rigor',
    title: 'Purge of Fake Data',
    subtitle: 'Replacing mock data with real physics',
    items: [
      'Eliminated synthetic road cavity depth (e.g. 3.5 in) and diameter dials.',
      'Removed non-empirical placeholder stock photos from public work orders.',
      'Transitioned exclusively to physical accelerometer G-force telemetry (DeviceMotionEvent).'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '2. Driver Safety',
    title: 'Turnkey Drive-Time Patrol',
    subtitle: 'Eliminating distracted driving',
    items: [
      'Replaced manual pull-over reporting with continuous automated GPS path mapping.',
      'Automatic shock spike logging at calibrated thresholds (≥3.0G to 8.8G).',
      'End-of-drive incident ledger with reverse-geocoded street addresses.'
    ],
    accentColor: ACCENT_BLUE
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '3. Inclusive Civic Design',
    title: 'Universal Accessibility',
    subtitle: 'Serving 100% of Gwinnett commuters',
    items: [
      'Dyslexia-friendly Comic Sans MS typography throughout all UI layers.',
      'Okabe-Ito colorblind-safe palette (Vermilion, Sky Blue, Bluish Green).',
      'Dual-coded geometric markers paired with Southern-cadence voice synthesis.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 2);

  slide.addNotes(
    "Slide 2 establishes the core thesis of our project: 'Visualizing Gwinnett County, sans potholes.'\n\n" +
    "When we evaluated branch pholland10132026, we recognized that while our concept was ambitious, it relied on simulated placeholders that compromised municipal credibility. Over the course of this development session, we executed three strategic transformations:\n\n" +
    "1. Empirical Rigor: We purged all fake data, replacing it with real physical sensor readings.\n" +
    "2. Driver Safety: We engineered hands-free Drive-Time Mapping so commuters never have to interact with their screen while operating a vehicle.\n" +
    "3. Universal Design: We established an uncompromising accessibility framework using dyslexia-friendly typography and colorblind-safe visual dual coding."
  );
}

// ==========================================
// SLIDE 3: BRANCH 10132026 - AESTHETIC BREAKDOWN
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Baseline Architecture', 'Branch pholland10132026: Aesthetic Breakdown', 'Examining the initial visual interface, design conventions, and layout friction points.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 4.25,
    h: 3.35,
    badge: 'Visual Design Strengths',
    title: 'Foundational Aesthetic Identity',
    subtitle: 'Initial styling established on October 13, 2026',
    items: [
      'Dark-mode palette with high-contrast slate-900 background.',
      'Early integration of dyslexia-friendly Comic Sans MS typography for increased character distinction.',
      'Green/Yellow/Red traffic light color cues representing minor, moderate, and critical pothole severity.',
      'Clean Leaflet mapping canvas with standard OpenStreetMap cartographic tiles.'
    ],
    accentColor: ACCENT_TEAL
  });

  addCard(slide, {
    x: 5.15,
    y: 1.6,
    w: 4.25,
    h: 3.35,
    badge: 'Visual Friction & Clutter',
    title: 'Aesthetic Limitations & Noise',
    subtitle: 'Identified areas diminishing UI clarity and trust',
    items: [
      'Synthetic Placeholder Imagery: Generic stock photos attached to reports gave the app a prototype-like, unverified appearance.',
      'Artificial Metric Dials: Displayed cavity depth gauges and diameter circles that occupied valuable card space with non-empirical values.',
      'Static Campus Viewport: Forced map center at GGC campus (33.9798, -84.0017), disorienting commuters launching the app from home.',
      'Desktop-Biased Navigation: Header tabs caused visual wrapping on narrower smartphone screens.'
    ],
    accentColor: ACCENT_ROSE
  });

  addFooter(slide, 3);

  slide.addNotes(
    "Turning to Slide 3, let us analyze the aesthetic state of branch pholland10132026 as it existed on October 13.\n\n" +
    "On the positive side, the baseline established a solid dark-mode aesthetic and embraced Comic Sans MS for dyslexia accommodation. However, from a visual design perspective, the interface suffered from significant clutter:\n\n" +
    "First, placeholder stock photos of potholes made every report look generic. Second, artificial gauges showing 3.5-inch depths and 20-inch cavity diameters consumed prime screen real estate with synthetic numbers. Finally, the viewport was statically locked to the GGC Student Center, meaning commuters opening the app anywhere else in Lawrenceville saw an irrelevant geographic anchor."
  );
}

// ==========================================
// SLIDE 4: BRANCH 10132026 - FUNCTIONAL BREAKDOWN
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Baseline Capabilities', 'Branch pholland10132026: Functional Breakdown', 'How the original application processed hazard intake, verification, and parking telematics.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Map & Geofencing',
    title: 'Static Campus Radius',
    subtitle: '1.8-mile boundary restriction',
    items: [
      'Hardcoded 1.8-mile radius filter from GGC Student Center.',
      'Any road hazard beyond 1.8 miles was automatically hidden from map view.',
      'Static preset quick-jump bar with regional municipal anchors.'
    ],
    accentColor: ACCENT_PURPLE
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Report Intake',
    title: 'Manual Multi-Field Form',
    subtitle: 'Driver-initiated submissions',
    items: [
      'Multi-field modal asking users to specify estimated depth, width, and surface type.',
      'Required manual pin drops or simulated GPS capture.',
      'Community +1 confirmation upvoting system for reported hazards.'
    ],
    accentColor: ACCENT_AMBER
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Commuter Dashboard',
    title: 'Simulated Lot Telematics',
    subtitle: 'Parking availability models',
    items: [
      'Simulated lot occupancy models driven by class schedule heuristics.',
      'High-risk road segment lists for corridors near Collins Hill and Hwy 316.',
      'Basic PDF work order export with textual summary fields.'
    ],
    accentColor: GGC_GREEN
  });

  addFooter(slide, 4);

  slide.addNotes(
    "Slide 4 reviews the functional architecture of branch pholland10132026.\n\n" +
    "Functionally, the app was organized around three pillars:\n" +
    "1. A static map engine that strictly filtered out hazards beyond 1.8 miles from campus.\n" +
    "2. A manual report intake modal requiring users to fill out forms, guess cavity depth, and manually confirm coordinates.\n" +
    "3. A commuter dashboard with parking lot occupancy forecasts based on class schedule heuristics.\n\n" +
    "While this proved our basic concept, it had a fatal workflow flaw: it required drivers to actively stop, open a form, and estimate road dimensions while traveling."
  );
}

// ==========================================
// SLIDE 5: LIMITATIONS & CATALYSTS FOR CHANGE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Critical Assessment', 'Why We Pivoted: The Catalysts for Branch 10202026', 'Identifying the real-world liabilities of synthetic data, driver distraction, and regional scope.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Liability #1',
    title: 'Data Credibility Void',
    subtitle: 'Synthetic data lacks municipal legal weight',
    items: [
      'Municipal public works departments (Gwinnett DOT, GDOT) reject synthetic estimates.',
      'Stock photos fail chain-of-custody verification required for repair prioritization.',
      'Empirical evidence is mandatory for public expenditure authorization.'
    ],
    accentColor: ACCENT_ROSE
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Liability #2',
    title: 'The Distracted Driving Risk',
    subtitle: 'Manual UI compromises safety',
    items: [
      'Expecting a student driver to pull out a phone, drop a map pin, and type notes violates roadway safety standards.',
      'True civic utility requires 100% hands-free background operation.',
      'The app needed an automated "Set It and Forget It" patrol mode.'
    ],
    accentColor: ACCENT_AMBER
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Liability #3',
    title: 'Regional Disconnection',
    subtitle: 'GGC is a commuter institution',
    items: [
      'Over 85% of GGC students commute across Gwinnett County (Duluth, Suwanee, Snellville, Buford).',
      'Anchoring solely to campus alienated students encountering severe potholes on major commuter arteries.',
      'Default viewport needed to center on the driver\'s live location.'
    ],
    accentColor: ACCENT_TEAL
  });

  addFooter(slide, 5);

  slide.addNotes(
    "Slide 5 outlines the three critical catalysts that dictated our development sprint in branch pholland10202026.\n\n" +
    "First: Data Credibility. Municipal road crews cannot dispatch asphalt trucks based on synthetic cavity estimates or stock images. They need empirical telemetry.\n\n" +
    "Second: Distracted Driving. An app designed to improve road safety cannot encourage distracted driving. Manual reporting forms in a vehicle represent a severe usability hazard.\n\n" +
    "Third: Regional Commuter Reality. GGC is a commuter campus. Students face hazardous road conditions miles away from campus on Highway 316, I-85, and Peachtree Industrial Boulevard. Locking the map to GGC campus ignored their everyday commute."
  );
}

// ==========================================
// SLIDE 6: REVIEW OF SESSION CHANGES
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Development Sprint', 'Session Review: The Six Transformational Milestones', 'A chronological overview of the strategic enhancements engineered in this session.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 4.25,
    h: 1.6,
    badge: 'Milestone 1 & 2',
    title: 'Synthetic Data Purge & Hardware Telemetry',
    items: [
      'Completely removed synthetic depth, diameter, and stock photos.',
      'Directly wired mobile DeviceMotionEvent to register true G-force shock readings (e.g. 7.80G, 8.80G).'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 5.15,
    y: 1.6,
    w: 4.25,
    h: 1.6,
    badge: 'Milestone 3 & 4',
    title: 'Map Screenshot Engine & Drive-Time Mapping',
    items: [
      'Built an HTML5 canvas tile-stitcher capturing certified map screenshots centered on shock GPS coordinates.',
      'Architected end-to-end Drive-Time Mapping: path breadcrumbs, shock detection, and automated session readout.'
    ],
    accentColor: ACCENT_BLUE
  });

  addCard(slide, {
    x: 0.6,
    y: 3.35,
    w: 4.25,
    h: 1.65,
    badge: 'Milestone 5',
    title: 'Sensor Hardware Bench & Oscilloscope Waveform',
    items: [
      'Restored the self-contained 60fps physical oscilloscope waveform with 3.0G threshold & 1.0G gravity baseline.',
      'Cleaned up bench header, standardized title, and added 7.5G capstone demo shock trigger.'
    ],
    accentColor: ACCENT_PURPLE
  });

  addCard(slide, {
    x: 5.15,
    y: 3.35,
    w: 4.25,
    h: 1.65,
    badge: 'Milestone 6',
    title: 'GPS Default Launch & Predominant Navigation',
    items: [
      'Main screen defaults immediately to user\'s physical GPS location on mount with pulsing radar beacon.',
      'Placed "Drive-Time Mapping" prominently next to "Map & Hazards" across desktop, mobile bar, and map toolbar.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 6);

  slide.addNotes(
    "Slide 6 presents our chronological development sprint log for this session. We tackled six major milestones:\n\n" +
    "1. We removed all synthetic measurements and stock photos.\n" +
    "2. We integrated real hardware accelerometer telemetry, calibrated against vehicle baseline gravity.\n" +
    "3. We built a canvas tile-stitching engine that captures real geospatial map screenshots of the hazard location.\n" +
    "4. We engineered complete Drive-Time Mapping with automated route polyline tracing.\n" +
    "5. We restored the 60fps oscilloscope waveform on the hardware monitor bench for live demonstrations.\n" +
    "6. We defaulted the main map directly to the user's physical GPS coordinates and repositioned Drive-Time Mapping as a primary first-class navigation option."
  );
}

// ==========================================
// SLIDE 7: BRANCH 10202026 - FUNCTIONAL BREAKDOWN
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Modern Architecture', 'Branch pholland10202026: Functional Breakdown', 'Hands-free route mapping, empirical shock detection, reverse geocoding, and municipal dockets.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Patrol Engine',
    title: 'Turnkey Drive-Time Patrol',
    subtitle: 'Zero-distraction road mapping',
    items: [
      'Mount phone & tap "Start Drive Patrol": silently traces GPS polyline breadcrumbs.',
      'Monitors accelerometer spikes against 3.0G threshold with axle bounce cooldown (prevents double counting).',
      'Reverse geocodes nearest street address (e.g. 1000 University Center Ln) automatically.'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Telemetry Bench',
    title: 'Hardware Sensor Monitor',
    subtitle: 'Empirical hardware bench',
    items: [
      'Self-contained LiveWaveformCanvas rendering 60fps real-time physics oscilloscope.',
      'Displays 3.0G impact threshold line and 1.0G gravity baseline.',
      'Interactive 7.5G demo spike generator and multi-strike spot aggregation table (3 strikes auto-promote).'
    ],
    accentColor: ACCENT_BLUE
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Municipal Output',
    title: 'Certified Municipal Docket',
    subtitle: 'Verified public works exports',
    items: [
      'Turnkey Drive Summary modal with drive duration, mileage, and shock incident ledger.',
      '1-click batch promotion to confirmed public hazard reports.',
      'Official single-page PDF work order docket generated with embedded map snapshot, routed to peyton.holland@gmail.com.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 7);

  slide.addNotes(
    "Slide 7 breaks down the functional architecture of branch pholland10202026.\n\n" +
    "The core breakthrough is our Turnkey Drive-Time Patrol. When a student enters their car, they tap 'Start Drive Patrol' and mount their device. The app traces their route polyline in real time, monitors sensor spikes, filters out normal engine vibration, and logs significant pothole shocks.\n\n" +
    "Upon reaching their destination, tapping 'End Drive Patrol' presents a comprehensive Drive Summary Readout detailing total drive time, mileage, peak impact force, and reverse-geocoded addresses. From there, one tap batch-promotes those incidents to official reports and exports certified PDF work order dockets with embedded map screenshots."
  );
}

// ==========================================
// SLIDE 8: UNIVERSAL ACCESSIBILITY & DESIGN
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Inclusive Engineering', 'Universal Design: Accessibility in Branch 10202026', 'Dyslexia-friendly typography, Okabe-Ito colorblind palette, dual coding, and Southern voice synthesis.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Dyslexia Accommodation',
    title: 'Comic Sans MS Typography',
    subtitle: 'Evidence-based character clarity',
    items: [
      'Asymmetrical letterforms (such as b/d, p/q) eliminate symbol inversion and visual flipping.',
      'Systemwide implementation across all titles, buttons, badges, forms, and PDF exports.',
      'Dynamic font-scaling bar supporting small, standard, large, and extra-large viewport adjustments.'
    ],
    accentColor: ACCENT_TEAL
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Visual Accessibility',
    title: 'Okabe-Ito & Dual Coding',
    subtitle: 'Colorblind-safe visual system',
    items: [
      'Standardized on the scientific Okabe-Ito colorblind palette (Vermilion, Sky Blue, Bluish Green).',
      'Dual Coding Architecture: Every severity level is paired with a distinct geometric glyph (▲ Critical, ◆ Moderate, ● Low/Resolved).',
      'Never relies on color alone; includes high-contrast borders and text labels.'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Auditory Triage',
    title: 'Southern Voice Synthesis',
    subtitle: 'Hands-free road hazard alerts',
    items: [
      'Integrated Web Speech API synthesis engine configured with natural Southern-cadence tuning.',
      'One-tap "Listen" button reads hazard title, landmark, severity, and confirmation tally aloud.',
      'Allows commuters to absorb road condition updates safely without looking away from traffic.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 8);

  slide.addNotes(
    "Slide 8 highlights our commitment to Universal Design. In academic capstone evaluation, accessibility is often treated as an afterthought; in GGC SansPotholes, it is central to our architecture.\n\n" +
    "First, Comic Sans MS was chosen intentionally for its heavy base weighting and non-mirrored letter stems, which proven research shows aids readers with dyslexia.\n\n" +
    "Second, our visual system uses the Okabe-Ito colorblind-safe palette, paired with dual-coded geometric glyphs: triangles for critical hazards, diamonds for moderate, and circles for resolved, ensuring instant comprehension regardless of color vision deficiency.\n\n" +
    "Third, our Southern voice synthesis reads hazard dockets aloud hands-free, reinforcing our zero-distraction mandate."
  );
}

// ==========================================
// SLIDE 9: AESTHETIC & UX ENHANCEMENTS
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Interface Refinement', 'Branch pholland10202026: Aesthetic & UX Polish', 'Physical GPS centering, pulsing radar beacon, predominant navigation, and decluttered bench.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Geospatial Context',
    title: 'Default Physical GPS Launch',
    subtitle: 'Instant commuter orientation',
    items: [
      'App mounts directly to user\'s physical GPS location at street level (zoom 16).',
      'Displays a pulsing blue radar beacon marker with accuracy perimeter circle.',
      'Live "📍 My Location" chip dynamically added to the municipal jump bar for instant re-centering.'
    ],
    accentColor: ACCENT_BLUE
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Information Hierarchy',
    title: 'Predominant Drive-Time Nav',
    subtitle: 'First-class navigation ranking',
    items: [
      'Positioned "Drive-Time Mapping" immediately next to "Map & Hazards" in the desktop header.',
      'Mobile navigation prioritized to Map ➔ Drive-Time ➔ (+) Report ➔ Parking ➔ Reports.',
      'Elevated "Drive-Time Mapping" gradient action button directly in the map screen toolbar.'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Visual Streamlining',
    title: 'Decluttered Hardware Bench',
    subtitle: 'Focused engineering interface',
    items: [
      'Purged redundant hardware vendor text and running motion counter.',
      'Standardized title to "Hardware Sensor Monitor".',
      'Restored physical 60fps oscilloscope waveform with live 3.0G threshold and 1.0G gravity baseline.'
    ],
    accentColor: ACCENT_PURPLE
  });

  addFooter(slide, 9);

  slide.addNotes(
    "Slide 9 illustrates the visual and ergonomic refinement realized in branch pholland10202026.\n\n" +
    "By defaulting the map directly to the user's GPS coordinates, commuters opening the app immediately see their local street grid with a pulsing blue radar beacon. They can toggle to GGC Campus or All Gwinnett in a single tap.\n\n" +
    "Furthermore, we restructured the visual navigation hierarchy. Instead of burying Drive-Time Mapping inside secondary menus, it now sits right next to Map & Hazards as a prominent gradient button across the header, mobile nav bar, and map toolbar.\n\n" +
    "Finally, we decluttered the Hardware Sensor Monitor, removing hardware-specific text to create a clean, professional oscilloscope bench."
  );
}

// ==========================================
// SLIDE 10: COMPARATIVE MATRIX (10132026 vs 10202026)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Systematic Evaluation', 'Comparative Matrix: Branch 10132026 vs. 10202026', 'Side-by-side technical evaluation illustrating measurable architectural advancements.');

  // Formatted Comparison Table
  const tableData = [
    [
      { text: 'EVALUATION CRITERIA', options: { bold: true, color: GGC_GOLD, fill: { color: '1A2640' }, align: 'left' } },
      { text: 'BRANCH pholland10132026 (OCT 13)', options: { bold: true, color: ACCENT_ROSE, fill: { color: '1A2640' }, align: 'left' } },
      { text: 'BRANCH pholland10202026 (OCT 20)', options: { bold: true, color: GGC_EMERALD, fill: { color: '1A2640' }, align: 'left' } }
    ],
    [
      { text: 'Data & Evidence Model', options: { bold: true, color: TEXT_WHITE, fill: { color: CARD_BG } } },
      { text: 'Synthetic cavity depths, diameters & placeholder stock photos', options: { color: TEXT_MUTED, fill: { color: CARD_BG } } },
      { text: '100% empirical G-force telemetry & stitched canvas map screenshots', options: { color: GGC_EMERALD, bold: true, fill: { color: CARD_BG } } }
    ],
    [
      { text: 'Driver Interaction & Safety', options: { bold: true, color: TEXT_WHITE, fill: { color: '11192C' } } },
      { text: 'Manual pull-over reporting modal with multi-field inputs', options: { color: TEXT_MUTED, fill: { color: '11192C' } } },
      { text: 'Hands-free Turnkey Drive-Time Patrol with automated logging', options: { color: ACCENT_BLUE, bold: true, fill: { color: '11192C' } } }
    ],
    [
      { text: 'Default Map Centering', options: { bold: true, color: TEXT_WHITE, fill: { color: CARD_BG } } },
      { text: 'Static GGC Campus coordinates (33.9798, -84.0017)', options: { color: TEXT_MUTED, fill: { color: CARD_BG } } },
      { text: 'Live physical user GPS location on mount with pulsing radar beacon', options: { color: GGC_EMERALD, bold: true, fill: { color: CARD_BG } } }
    ],
    [
      { text: 'Geographic Filtering', options: { bold: true, color: TEXT_WHITE, fill: { color: '11192C' } } },
      { text: 'Hardcoded 1.8-mile radius filter (hides non-campus hazards)', options: { color: TEXT_MUTED, fill: { color: '11192C' } } },
      { text: 'Dynamic scopes: My Location, GGC Campus, and All Gwinnett', options: { color: ACCENT_TEAL, bold: true, fill: { color: '11192C' } } }
    ],
    [
      { text: 'Sensor Telemetry Visuals', options: { bold: true, color: TEXT_WHITE, fill: { color: CARD_BG } } },
      { text: 'Lifecycle mounting bug disabled canvas oscilloscope loop', options: { color: TEXT_MUTED, fill: { color: CARD_BG } } },
      { text: 'Self-contained 60fps oscilloscope with threshold lines & demo spike', options: { color: GGC_EMERALD, bold: true, fill: { color: CARD_BG } } }
    ],
    [
      { text: 'Municipal Docket Output', options: { bold: true, color: TEXT_WHITE, fill: { color: '11192C' } } },
      { text: 'Basic text report without verified geospatial evidence', options: { color: TEXT_MUTED, fill: { color: '11192C' } } },
      { text: 'Certified single-page PDF with embedded map screenshot & signoffs', options: { color: GGC_GOLD, bold: true, fill: { color: '11192C' } } }
    ]
  ];

  slide.addTable(tableData, {
    x: 0.6,
    y: 1.6,
    w: 8.8,
    h: 3.35,
    fontFace: FONT_COMIC,
    fontSize: 8.5,
    border: { pt: 0.5, color: CARD_BORDER },
    autoPage: false
  });

  addFooter(slide, 10);

  slide.addNotes(
    "Slide 10 provides our formal Comparative Matrix, benchmarking both branches across six fundamental technical criteria.\n\n" +
    "Notice the definitive shift from synthetic estimates to physical G-forces, from manual form-filling to hands-free patrol, from static campus anchoring to live user GPS, and from basic text summaries to certified PDF work orders containing verified map snapshots.\n\n" +
    "This matrix clearly demonstrates how branch pholland10202026 evolved from an exploratory capstone concept into a production-caliber civic platform."
  );
}

// ==========================================
// SLIDE 11: OVERALL ASSESSMENT (LOOK, FEEL, FUNCTIONALITY)
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Holistic Appraisal', 'Overall Assessment: Look, Feel & Usability', 'Evaluating aesthetic harmony, mobile touch responsiveness, and practical municipal impact.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '1. The Look',
    title: 'Visual Cohesion',
    subtitle: 'Modern, high-trust civic tech',
    items: [
      'GGC Grizzly Green and Gold branding balanced with dark slate-900 surfaces.',
      'Dyslexia-friendly Comic Sans MS typography brings warmth and high legibility without amateurish clutter.',
      'Dual-coded geometric badges (▲, ◆, ●) provide immediate visual clarity across light, dark, and colorblind modes.'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '2. The Feel',
    title: 'Ergonomic Fluidity',
    subtitle: 'Mobile-first responsiveness',
    items: [
      'Tested and tuned on flagship mobile hardware (Samsung Galaxy S25 Ultra on Firefox & Chrome).',
      'Buttery-smooth 60fps hardware accelerometer waveform with zero touch lag.',
      'Intuitive thumb-zone navigation: bottom mobile bar with elevated (+) report action button.'
    ],
    accentColor: ACCENT_BLUE
  });

  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '3. Functionality',
    title: 'Civic Utility',
    subtitle: 'Field-ready municipal workflow',
    items: [
      'Solves the critical commuter safety paradox: zero distracted driving while capturing accurate road hazard data.',
      'Empowers citizens to deliver verified, geocoded work order dockets directly to municipal authorities.',
      'Production build: 0 TypeScript errors, hot-reload active, and 100% verified.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 11);

  slide.addNotes(
    "Slide 11 delivers our holistic appraisal of the look, feel, and functionality of GGC SansPotholes in its current release.\n\n" +
    "In terms of 'Look': The application presents a polished, high-trust civic tech identity. The pairing of GGC Grizzly Green and Gold against dark slate creates professional contrast, while Comic Sans MS delivers proven dyslexia legibility.\n\n" +
    "In terms of 'Feel': The application feels exceptionally responsive on physical mobile hardware. Testing on the Samsung Galaxy S25 Ultra demonstrated zero lag during 60fps sensor plotting.\n\n" +
    "In terms of 'Functionality': The app achieves its core civic mission: protecting student vehicles, eliminating distracted driving, and providing municipal public works agencies with certified evidence."
  );
}

// ==========================================
// SLIDE 12: CONCLUSION & CAPSTONE IMPACT
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };
  addHeader(slide, 'Senior Capstone Summary', 'Conclusion & Project Significance', 'Synthesizing technical achievements, civic contributions, and future roadway horizons.');

  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 4.25,
    h: 3.35,
    badge: 'Capstone Significance',
    title: 'Technical & Civic Contributions',
    subtitle: 'Key milestones achieved by our team',
    items: [
      'Demonstrated advanced mastery of mobile device hardware telemetry (DeviceMotionEvent) and real-time canvas visualization.',
      'Architected a full-lifecycle geospatial pipeline combining OpenStreetMap, Leaflet, Nominatim reverse geocoding, and canvas tile-stitching.',
      'Championed universal accessibility as an engineering requirement rather than an optional feature.',
      'Created an actionable municipal integration pipeline capable of generating certified PDF work orders for Gwinnett DOT and GDOT.'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 5.15,
    y: 1.6,
    w: 4.25,
    h: 3.35,
    badge: 'Commuter Impact',
    title: 'Final Capstone Takeaway',
    subtitle: '"Visualizing Gwinnett County, Sans Potholes"',
    items: [
      'GGC SansPotholes proves that accessible, commuter-driven civic technology can protect student vehicles without endangering drivers.',
      'By replacing synthetic estimates with verifiable physical sensor data, the app bridges the communication gap between citizens and municipal repair crews.',
      'Production code is completely compiled, documented, and published on branch pholland10202026.',
      'Thank you to our faculty mentors, committee members, and peer researchers. We now welcome questions and discussion.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 12);

  slide.addNotes(
    "In conclusion on Slide 12, GGC SansPotholes stands as a testament to what student-led civic engineering can achieve.\n\n" +
    "Through branch pholland10202026, we demonstrated advanced mastery across mobile sensor integration, geospatial mapping, and inclusive design. Most importantly, we transformed an exploratory prototype into a verifiable, safety-first civic utility that protects GGC commuters and streamlines municipal repair workflows.\n\n" +
    "On behalf of Peyton Holland, Erick Vale, Tina Ly, and Hina Luna, thank you for your time and guidance. We are now open for committee questions."
  );
}

// Write the Presentation File
const OUTPUT_FILE = 'GGC_SansPotholes_Branch_Evolution_Presentation.pptx';
pres.writeFile({ fileName: OUTPUT_FILE })
  .then(fileName => {
    console.log(`Successfully generated PowerPoint presentation: ${fileName}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error generating presentation:', err);
    process.exit(1);
  });
