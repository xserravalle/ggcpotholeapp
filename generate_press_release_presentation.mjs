import pptxgen from 'pptxgenjs';
import path from 'path';

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9'; // 10.0 x 5.625 inches
pres.author = 'Peyton Holland';
pres.company = 'Georgia Gwinnett College - ITEC 4860 Senior Capstone';
pres.subject = 'GGC SansPotholes: Official 3-Slide Press Release';
pres.title = 'GGC SansPotholes: Official Press Release & Civic Innovation Showcase';

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

const SCREENSHOT_PATH = 'C:/Users/peyto/.gemini/antigravity/scratch/ggc-pothole-patrol/live_screencapture.png';

// Helper: Common Header
function addHeader(slide, category, title, subtitle) {
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6,
    y: 0.4,
    w: 2.8,
    h: 0.28,
    rectRadius: 0.14,
    fill: { color: '1E293B' },
    line: { color: ACCENT_TEAL, width: 1 }
  });
  slide.addText(category.toUpperCase(), {
    x: 0.6,
    y: 0.4,
    w: 2.8,
    h: 0.28,
    fontSize: 8.5,
    bold: true,
    color: ACCENT_TEAL,
    fontFace: FONT_COMIC,
    align: 'center',
    valign: 'middle'
  });

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

  slide.addText('GGC SansPotholes • Official Civic Press Release • Senior Capstone ITEC 4860', {
    x: 0.6,
    y: 5.2,
    w: 7.0,
    h: 0.3,
    fontSize: 8,
    color: TEXT_SUBTLE,
    fontFace: FONT_COMIC
  });

  slide.addText(`Slide ${slideNum} of 3`, {
    x: 7.8,
    y: 5.2,
    w: 1.6,
    h: 0.3,
    fontSize: 8,
    color: GGC_GOLD,
    fontFace: FONT_COMIC,
    align: 'right'
  });
}

// Helper: Card with accent border
function addCard(slide, { x, y, w, h, title, subtitle, items = [], badge = null, accentColor = GGC_EMERALD, titleColor = TEXT_WHITE }) {
  slide.addShape(pres.ShapeType.roundRect, {
    x,
    y,
    w,
    h,
    rectRadius: 0.12,
    fill: { color: CARD_BG },
    line: { color: CARD_BORDER, width: 1 }
  });

  slide.addShape(pres.ShapeType.roundRect, {
    x: x + 0.05,
    y: y + 0.05,
    w: w - 0.1,
    h: 0.06,
    rectRadius: 0.03,
    fill: { color: accentColor }
  });

  let currentY = y + 0.18;

  if (badge) {
    slide.addShape(pres.ShapeType.roundRect, {
      x: x + 0.18,
      y: currentY,
      w: 1.8,
      h: 0.22,
      rectRadius: 0.08,
      fill: { color: '0F172A' },
      line: { color: accentColor, width: 0.8 }
    });
    slide.addText(badge.toUpperCase(), {
      x: x + 0.18,
      y: currentY,
      w: 1.8,
      h: 0.22,
      fontSize: 7.5,
      bold: true,
      color: accentColor,
      fontFace: FONT_COMIC,
      align: 'center',
      valign: 'middle'
    });
    currentY += 0.28;
  }

  slide.addText(title, {
    x: x + 0.18,
    y: currentY,
    w: w - 0.36,
    h: 0.3,
    fontSize: 11.5,
    bold: true,
    color: titleColor,
    fontFace: FONT_COMIC
  });
  currentY += 0.32;

  if (subtitle) {
    slide.addText(subtitle, {
      x: x + 0.18,
      y: currentY,
      w: w - 0.36,
      h: 0.24,
      fontSize: 9,
      color: TEXT_MUTED,
      fontFace: FONT_COMIC
    });
    currentY += 0.28;
  }

  if (items.length > 0) {
    const textObjects = items.map((item, idx) => ({
      text: item,
      options: {
        fontSize: 8.5,
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
// SLIDE 1: PRESS RELEASE & ACTIVE APP SHOWCASE
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  // Decorative top banner
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.1, fill: { color: GGC_GREEN } });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.1, w: 10, h: 0.04, fill: { color: GGC_GOLD } });

  addHeader(slide, 'Official Press Release • Civic Tech', 'GGC SansPotholes: Visualizing Gwinnett, Sans Potholes', 'Georgia Gwinnett College senior capstone team debuts accessible, sensor-driven roadway hazard patrol.');

  // Left Column: Active Screencapture Showcase (Framed Device / Browser Canvas)
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.6,
    y: 1.55,
    w: 4.8,
    h: 3.45,
    rectRadius: 0.14,
    fill: { color: '111928' },
    line: { color: GGC_EMERALD, width: 1.5 }
  });

  // Browser Chrome bar header
  slide.addShape(pres.ShapeType.rect, {
    x: 0.61,
    y: 1.56,
    w: 4.78,
    h: 0.24,
    fill: { color: '1E293B' }
  });
  slide.addText('🔴 🟡 🟢  ggc-sanspotholes.app • Live Active Interface', {
    x: 0.7,
    y: 1.56,
    w: 4.6,
    h: 0.24,
    fontSize: 7.5,
    color: TEXT_MUTED,
    fontFace: FONT_COMIC,
    valign: 'middle'
  });

  // Embed Live Screencapture Image
  slide.addImage({
    path: SCREENSHOT_PATH,
    x: 0.64,
    y: 1.82,
    w: 4.72,
    h: 3.12
  });

  // Screencapture Overlay Caption Badge
  slide.addShape(pres.ShapeType.roundRect, {
    x: 0.75,
    y: 4.58,
    w: 4.5,
    h: 0.32,
    rectRadius: 0.08,
    fill: { color: '0A1120' },
    line: { color: ACCENT_TEAL, width: 0.8 }
  });
  slide.addText('📸 ACTIVE SCREENCAPTURE: Live Physical GPS Centering & Predominant Drive-Time Nav', {
    x: 0.75,
    y: 4.58,
    w: 4.5,
    h: 0.32,
    fontSize: 7.5,
    bold: true,
    color: GGC_EMERALD,
    fontFace: FONT_COMIC,
    align: 'center',
    valign: 'middle'
  });

  // Right Column: Press Release Briefing Cards
  addCard(slide, {
    x: 5.6,
    y: 1.55,
    w: 3.8,
    h: 1.65,
    badge: 'Civic Innovation',
    title: 'What GGC SansPotholes Does',
    subtitle: 'Hands-free sensor patrol for commuter safety',
    items: [
      'Eliminates Distracted Driving: Mount phone & start patrol—silently monitors road vibrations and logs shock spikes.',
      'Physical Telemetry: Uses device accelerometer (DeviceMotionEvent) measuring real G-forces (e.g. 7.80G to 8.80G).',
      'Reverse Geocoded Mapping: Traces GPS route breadcrumbs and auto-resolves nearest street addresses.'
    ],
    accentColor: GGC_EMERALD
  });

  addCard(slide, {
    x: 5.6,
    y: 3.32,
    w: 3.8,
    h: 1.68,
    badge: 'Municipal Readiness',
    title: 'Turnkey Public Works Dockets',
    subtitle: 'Automated civic dispatch to city engineers',
    items: [
      'End-of-Drive Readout: Immediate summary of trip mileage, duration, and detected shock incident ledger.',
      '1-Click Batch Promotion: Converts sensor detections into confirmed public road hazard dockets.',
      'Certified PDF Work Orders: Exports single-page municipal dockets featuring verified canvas map screenshots.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 1);

  slide.addNotes(
    "FOR IMMEDIATE RELEASE:\n\n" +
    "Today, Georgia Gwinnett College students unveil GGC SansPotholes, an accessible civic tech mobile utility engineered to protect student vehicles, eliminate distracted driving, and automate municipal work orders.\n\n" +
    "As showcased on the live screencapture on the left, the app combines real physical mobile accelerometer telemetry, live GPS path breadcrumbs, and instant reverse-geocoding. Commuters simply mount their smartphone and drive; the app silently monitors roadway vibrations, filters axle bounce, and logs genuine shock spikes.\n\n" +
    "Upon reaching campus or home, drivers receive an instant Drive Summary and can dispatch certified, geocoded PDF work order dockets with embedded map screenshots directly to municipal repair crews."
  );
}

// ==========================================
// SLIDE 2: SESSION-OVER-SESSION EVOLUTION
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.1, fill: { color: GGC_GREEN } });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.1, w: 10, h: 0.04, fill: { color: GGC_GOLD } });

  addHeader(slide, 'Architecture & Aesthetic Transformation', 'Evolution: From Baseline 10132026 to Modern 10202026', 'How we eliminated synthetic clutter, anchored to live physical GPS, and restored live telemetry.');

  // Card 1: Data Integrity & Telemetry
  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Empirical Pivot',
    title: 'Synthetic Purge ➔ Real Physics',
    subtitle: '100% empirical evidence model',
    items: [
      'Purged Synthetic Placeholders: Permanently retired fake road depth dials (3.5 in), cavity diameters, and placeholder stock photos.',
      'Real Hardware Sensor Telemetry: Wired DeviceMotionEvent to capture actual vehicular impact shocks against 3.0G threshold.',
      'Geospatial Map Snapshots: Automated HTML5 canvas tile-stitcher captures certified location screenshots embedded in reports.'
    ],
    accentColor: GGC_EMERALD
  });

  // Card 2: Viewport & Navigation
  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Ergonomic Redesign',
    title: 'Static Campus ➔ Live GPS Launch',
    subtitle: 'Instant driver orientation',
    items: [
      'Physical GPS Launch Default: Map automatically queries browser GPS on mount and centers smoothly at street zoom (16).',
      'Pulsing Radar Beacon: Displays animated blue location beacon with GPS accuracy perimeter circle.',
      'Predominant Drive-Time Nav: Elevated Drive-Time Mapping right next to Map & Hazards on desktop header, mobile bar, and map toolbar.'
    ],
    accentColor: ACCENT_BLUE
  });

  // Card 3: Bench & Universal Accessibility
  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: 'Visual Refinement',
    title: 'Hardware Bench & Usability',
    subtitle: 'Streamlined civic engineering',
    items: [
      '60fps Oscilloscope Waveform: Restored live physical waveform with self-contained mounting lifecycle and 7.5G capstone demo trigger.',
      'Decluttered Bench Header: Standardized to "Hardware Sensor Monitor", removing vendor-specific text.',
      'Universal Design: Dyslexia-friendly Comic Sans MS, Okabe-Ito colorblind palette, and Southern-cadence voice synthesis.'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 2);

  slide.addNotes(
    "Turning to Slide 2 of our release, we detail the strategic pivot executed between our October 13 baseline (pholland10132026) and our current release (pholland10202026):\n\n" +
    "1. Data Integrity: We permanently eliminated all synthetic measurements, fake dials, and generic stock images. Every report now reflects empirical G-force readings and stitched canvas map screenshots.\n\n" +
    "2. Viewport & Navigation: Instead of forcing drivers to manually find their location from a static GGC campus center, the app immediately defaults to their live physical GPS coordinates with a pulsing radar beacon, while Drive-Time Mapping is promoted to the primary navigation bar.\n\n" +
    "3. Hardware Bench: We resolved the waveform mounting bug, delivering a buttery-smooth 60fps oscilloscope that visualizes road shocks in real time."
  );
}

// ==========================================
// SLIDE 3: USER VALUE & CIVIC IMPACT
// ==========================================
{
  const slide = pres.addSlide();
  slide.background = { color: BG_DARK };

  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: 10, h: 0.1, fill: { color: GGC_GREEN } });
  slide.addShape(pres.ShapeType.rect, { x: 0, y: 0.1, w: 10, h: 0.04, fill: { color: GGC_GOLD } });

  addHeader(slide, 'Civic Impact & User Value', 'Uncompromising Safety, Accessibility & Municipal Value', 'How GGC SansPotholes delivers tangible, real-world benefits to students, commuters, and city crews.');

  // Card 1: Commuter Safety & Vehicle Protection
  addCard(slide, {
    x: 0.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '1. Commuter Protection',
    title: 'Zero Distraction & Savings',
    subtitle: 'Protecting lives and vehicles',
    items: [
      'Zero Distracted Driving: Complete elimination of in-drive manual reporting forms—mount, drive, and review upon arrival.',
      'Tire & Suspension Preservation: Alerts student commuters to severe hazards across Lawrenceville and Gwinnett corridors.',
      'Financial Defense: Prevents hundreds of dollars in alignment and rim repair costs common to college commuters.'
    ],
    accentColor: GGC_EMERALD
  });

  // Card 2: Universal Design
  addCard(slide, {
    x: 3.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '2. Inclusive Engineering',
    title: 'Universal Accessibility',
    subtitle: 'Serving 100% of Gwinnett citizens',
    items: [
      'Dyslexia-Friendly Comic Sans MS: Proven asymmetrical letterforms prevent symbol flipping and enhance legibility.',
      'Okabe-Ito Colorblind Safety: High-contrast Vermilion, Sky Blue, and Bluish Green paired with dual-coded geometric glyphs (▲, ◆, ●).',
      'Hands-Free Voice Synthesis: Southern-cadence voice assistant reads hazard alerts aloud so drivers keep their eyes on the road.'
    ],
    accentColor: ACCENT_TEAL
  });

  // Card 3: Municipal Efficiency
  addCard(slide, {
    x: 6.6,
    y: 1.6,
    w: 2.8,
    h: 3.35,
    badge: '3. Municipal Action',
    title: 'Actionable Public Works',
    subtitle: 'Direct pipeline to city maintenance',
    items: [
      'Empirical Chain of Custody: Supplies public works departments with verified G-forces, exact GPS, and map images.',
      'Turnkey PDF Work Orders: Clean, single-page printable dockets with supervisor signoff blocks for immediate crew dispatch.',
      'Automated Civic Routing: Correctly classifies jurisdictions (Gwinnett County DOT, City of Lawrenceville, GDOT).'
    ],
    accentColor: GGC_GOLD
  });

  addFooter(slide, 3);

  slide.addNotes(
    "Slide 3 highlights the ultimate value proposition of GGC SansPotholes across three constituencies:\n\n" +
    "First, for Commuters: It solves the safety paradox. Drivers no longer endanger themselves by pulling out phones in traffic. The app preserves vehicle health, saves students hundreds in repair bills, and promotes safer transit.\n\n" +
    "Second, for All Citizens: By grounding the system in Universal Design—Comic Sans MS for dyslexia, Okabe-Ito for colorblindness, and Southern voice audio synthesis—the app leaves no driver behind.\n\n" +
    "Third, for Municipalities: Public works departments receive certified, verifiable evidence rather than subjective complaints, accelerating repair cycles across Gwinnett County roadway infrastructure."
  );
}

// Write Presentation File
const OUTPUT_FILE = 'GGC_SansPotholes_Press_Release.pptx';
pres.writeFile({ fileName: OUTPUT_FILE })
  .then(fileName => {
    console.log(`Successfully generated Press Release presentation: ${fileName}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error generating press release presentation:', err);
    process.exit(1);
  });
