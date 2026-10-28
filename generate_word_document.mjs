import * as docx from 'docx';
import fs from 'fs';

const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
  Header,
  Footer,
  PageNumber
} = docx;

const FONT_NAME = 'Comic Sans MS';
const COLOR_PRIMARY = '006747'; // GGC Grizzly Green
const COLOR_GOLD = 'C4A35A';    // GGC Grizzly Gold
const COLOR_DARK = '1E293B';    // Slate 800
const COLOR_MUTED = '475569';   // Slate 600
const COLOR_BG_LIGHT = 'F8FAFC';// Slate 50
const COLOR_BORDER = 'CBD5E1';  // Slate 300

function createHeading1(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    run: {
      font: FONT_NAME,
      size: 28, // 14pt
      bold: true,
      color: COLOR_PRIMARY
    }
  });
}

function createHeading2(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    run: {
      font: FONT_NAME,
      size: 24, // 12pt
      bold: true,
      color: COLOR_PRIMARY
    }
  });
}

function createHeading3(text) {
  return new Paragraph({
    text: text,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
    run: {
      font: FONT_NAME,
      size: 22, // 11pt
      bold: true,
      color: COLOR_DARK
    }
  });
}

function createBody(runs, options = {}) {
  const textRuns = Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    spacing: { after: 100, line: 276 },
    ...options,
    children: textRuns.map(r => {
      if (typeof r === 'string') {
        return new TextRun({ text: r, font: FONT_NAME, size: 21, color: COLOR_DARK });
      }
      return new TextRun({ font: FONT_NAME, size: 21, color: COLOR_DARK, ...r });
    })
  });
}

function createBullet(runs, level = 0) {
  const textRuns = Array.isArray(runs) ? runs : [runs];
  return new Paragraph({
    bullet: { level },
    spacing: { after: 60, line: 260 },
    children: textRuns.map(r => {
      if (typeof r === 'string') {
        return new TextRun({ text: r, font: FONT_NAME, size: 21, color: COLOR_DARK });
      }
      return new TextRun({ font: FONT_NAME, size: 21, color: COLOR_DARK, ...r });
    })
  });
}

function createCallout(title, text) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: COLOR_PRIMARY }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({ text: title, font: FONT_NAME, size: 22, bold: true, color: COLOR_PRIMARY })
                ]
              }),
              new Paragraph({
                spacing: { after: 0 },
                children: [
                  new TextRun({ text: text, font: FONT_NAME, size: 20, color: COLOR_MUTED, italics: true })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

const doc = new Document({
  styles: {
    default: {
      document: {
        run: { font: FONT_NAME, size: 21, color: COLOR_DARK }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1000, bottom: 1000, left: 1000, right: 1000 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              spacing: { after: 120 },
              children: [
                new TextRun({
                  text: 'GGC SansPotholes • Software Development 2 (ITEC 4860)',
                  font: FONT_NAME,
                  size: 16,
                  color: COLOR_MUTED
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.SPACE_BETWEEN,
              children: [
                new TextRun({
                  text: 'Georgia Gwinnett College • Senior Capstone',
                  font: FONT_NAME,
                  size: 16,
                  color: COLOR_MUTED
                }),
                new TextRun({
                  children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
                  font: FONT_NAME,
                  size: 16,
                  color: COLOR_PRIMARY,
                  bold: true
                })
              ]
            })
          ]
        })
      },
      children: [
        // Title Block
        new Paragraph({
          spacing: { after: 60 },
          children: [
            new TextRun({
              text: 'GGC SansPotholes',
              font: FONT_NAME,
              size: 40, // 20pt
              bold: true,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          spacing: { after: 120 },
          children: [
            new TextRun({
              text: 'Post-Deployment Operations, Security & Strategic Roadmap',
              font: FONT_NAME,
              size: 26, // 13pt
              bold: true,
              color: COLOR_GOLD
            })
          ]
        }),

        // Metadata box
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            left: { style: BorderStyle.NONE },
            right: { style: BorderStyle.NONE }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 80, right: 80 },
                  children: [
                    createBody([
                      { text: 'Course: ', bold: true, color: COLOR_PRIMARY },
                      'Software Development 2 (ITEC 4860 Senior Capstone)   |   ',
                      { text: 'Date: ', bold: true, color: COLOR_PRIMARY },
                      'Fall 2026'
                    ]),
                    createBody([
                      { text: 'Project Team: ', bold: true, color: COLOR_PRIMARY },
                      'Peyton Holland, Erick Vale, Tina Ly, Hina Luna'
                    ]),
                    createBody([
                      { text: 'Live Production URL: ', bold: true, color: COLOR_PRIMARY },
                      'https://sanspotholes.pages.dev   |   ',
                      { text: 'GitHub: ', bold: true, color: COLOR_PRIMARY },
                      'github.com/xserravalle/ggcpotholeapp'
                    ])
                  ]
                })
              ]
            })
          ]
        }),

        new Paragraph({ spacing: { after: 160 } }),

        // Executive Summary
        createHeading1('Executive Summary'),
        createBody(
          'Now that GGC SansPotholes is permanently deployed to production on Cloudflare Pages and connected directly to GitHub, our team has transitioned from initial active development to software operations, maintenance, quality assurance, and community readiness. This operational guide provides our Software Development 2 group, faculty reviewers, and classmates with a comprehensive, plain-English breakdown of:'
        ),
        createBullet([{ text: 'The GitHub-to-Cloudflare Maintenance Workflow: ', bold: true }, 'How updates, bug fixes, and feature additions move into production.']),
        createBullet([{ text: 'Automated Quality Assurance & Testing: ', bold: true }, 'Tools and procedures to prevent regressions.']),
        createBullet([{ text: 'App Privacy & Anti-Stalking Architecture: ', bold: true }, 'How we ensure commuters are protected from surveillance and data exposure.']),
        createBullet([{ text: 'Civic Marketing & Stakeholder Outreach: ', bold: true }, 'High-value partnerships across GGC and Gwinnett County.']),

        createCallout(
          'The Core Project Thesis',
          '“Visualizing Gwinnett County, sans potholes: Empowering student commuters to safely patrol roadway hazards hands-free, while providing municipal public works authorities with empirically verified work orders.”'
        ),

        // Section 1
        createHeading1('1. Maintenance & Upkeep: The GitHub & Cloudflare Pipeline'),

        createHeading2('1.1 The Source of Truth vs. The Production Host'),
        createBody([
          'To understand maintenance in simple English, think of ',
          { text: 'GitHub as the kitchen and recipe book', bold: true },
          ', and ',
          { text: 'Cloudflare Pages as the dining table where food is served to customers:', bold: true }
        ]),
        createBullet([
          { text: 'GitHub (xserravalle/ggcpotholeapp): ', bold: true },
          'Holds all raw source code, assets, commit history, and automated build instructions. It is our team’s single source of truth.'
        ]),
        createBullet([
          { text: 'Cloudflare Pages (sanspotholes.pages.dev): ', bold: true },
          'A global edge delivery network spanning over 300 data centers worldwide. It does not store code; instead, it listens for changes on GitHub, compiles the code using npm run build, and serves the resulting dist/ bundle to the public over automatic HTTPS.'
        ]),

        createHeading2('1.2 Which Version Does Cloudflare Deploy?'),
        createBody([
          'Cloudflare Pages is configured to watch the ',
          { text: 'main', bold: true },
          ' branch on GitHub. Whatever commit sits at the tip of main is the exact version that the public sees on https://sanspotholes.pages.dev.'
        ]),
        createBody(
          'If a developer works on an experimental branch (e.g. feature/dark-mode), Cloudflare does not touch the live public site. Instead, it generates a private, temporary Preview Deployment URL that only our team can view for testing.'
        ),

        createHeading2('1.3 Step-by-Step Workflow: Adding Features or Fixing Bugs'),
        createBody('Moving forward, our team follows standard industry Git branching etiquette. No developer pushes experimental code directly to main:'),
        createBullet([{ text: 'Step 1: Create an Isolated Branch: ', bold: true }, 'git checkout main && git pull origin main && git checkout -b feature/audio-chime']),
        createBullet([{ text: 'Step 2: Develop & Test Locally: ', bold: true }, 'Run npm run dev to test interactively, npm test to run unit tests, and npm run build to verify TypeScript compilation (0 errors).']),
        createBullet([{ text: 'Step 3: Commit & Push to GitHub: ', bold: true }, 'git add -A && git commit -m "feat: add hazard chime" && git push origin feature/audio-chime']),
        createBullet([{ text: 'Step 4: Open a GitHub Pull Request (PR): ', bold: true }, 'Open a PR on GitHub into main. Cloudflare will automatically build a temporary preview link directly on the PR so the team can test on their actual phones before approving.']),
        createBullet([{ text: 'Step 5: Merge into main: ', bold: true }, 'Once reviewed, click Merge pull request. Cloudflare automatically detects the new commit on main, runs npm run build, and deploys to https://sanspotholes.pages.dev within 45 seconds with zero downtime.']),

        createHeading2('1.4 What Changes Are Needed Inside Cloudflare?'),
        createBody([
          { text: 'Almost never anything. ', bold: true },
          'Once Cloudflare Pages is linked to your GitHub repository and the environment variables (NODE_VERSION: 20) are set, the deployment pipeline is 100% automated. You do not need to log into Cloudflare to deploy code; merging a PR on GitHub triggers the entire deployment lifecycle.'
        ]),
        createBody(
          'The only rare exception: If our app introduces a new external secret API key in the future (e.g., an enterprise GDOT API key), that key would be added under Cloudflare’s Settings > Variables and secrets.'
        ),

        // Section 2
        createHeading1('2. Quality Assurance & Automated Testing Strategy'),
        createBody(
          'To ensure maintenance updates do not break existing mobile functionality (such as the accelerometer, reverse geocoding, or PDF generation), we employ a multi-tier testing strategy across three distinct layers:'
        ),

        createHeading2('2.1 The Three Testing Layers'),
        createBullet([
          { text: 'Unit Testing (Logic & Math): ', bold: true },
          'Tests isolated algorithms without UI. (e.g., verifying that the Haversine formula calculates campus radius accurately, and that the axle-bounce cooldown timer ignores shock bounces within 1.2 seconds).'
        ]),
        createBullet([
          { text: 'Component Testing (UI & State): ', bold: true },
          'Tests React components in isolation. (e.g., verifying that clicking "+1 Confirm" increments the verification counter and that the Admin Login modal rejects wrong passwords).'
        ]),
        createBullet([
          { text: 'End-to-End (E2E) Browser Testing: ', bold: true },
          'Automated bots running our app in real browser engines (Chrome, Firefox, Safari) to verify the entire user journey from starting a drive patrol to generating a PDF docket.'
        ]),

        createHeading2('2.2 Recommended Automated Tools (Already Configured!)'),
        createBullet([
          { text: 'Vitest (npm test): ', bold: true },
          'A blazingly fast unit test runner natively integrated with Vite. Runs our test suite in milliseconds.'
        ]),
        createBullet([
          { text: 'React Testing Library: ', bold: true },
          'Industry-standard library for testing user clicks, form submissions, and accessibility screen-reader announcements.'
        ]),
        createBullet([
          { text: 'Playwright (@playwright/test): ', bold: true },
          'Already included in our devDependencies. Allows automated cross-browser testing across mobile Chrome, Firefox, and Safari viewports.'
        ]),

        createHeading2('2.3 Automated GitHub Actions CI (The "Bouncer")'),
        createBody(
          'To ensure that broken code cannot be merged into main, we can enable a lightweight GitHub Actions workflow (.github/workflows/ci.yml). Every time a team member opens a Pull Request, GitHub automatically boots an Ubuntu runner and executes:'
        ),
        createBullet(['npm ci && npm test && npm run build']),
        createBody([
          { text: 'If a test fails or TypeScript throws an error, GitHub blocks the merge button', bold: true },
          ', guaranteeing that broken code cannot accidentally reach our live Cloudflare site.'
        ]),

        // Section 3
        createHeading1('3. Privacy, Data Security & Anti-Stalking Protections'),
        createBody(
          'Because GGC SansPotholes tracks vehicle movement, shock impacts, and geospatial coordinates, privacy and driver safety are core ethical requirements. If commuter data were poorly managed, location breadcrumbs could inadvertently reveal a student’s home address, work schedule, or personal travel habits.'
        ),
        createBody(
          'Our architecture enforces Privacy-by-Design across five distinct security barriers:'
        ),

        createHeading2('3.1 Ephemeral Route Trajectories (Zero Server Breadcrumbs)'),
        createBody(
          'The GPS polyline path drawn during Drive-Time Mapping exists exclusively in the phone’s temporary RAM memory for the duration of that single drive session. No travel routes are ever saved to a database or sent across the internet. When the driver closes the app or taps "End Patrol", the route trajectory is permanently erased.'
        ),

        createHeading2('3.2 Decoupled Point-Source Evidence (No Start or End Points)'),
        createBody(
          'When a severe road shock is detected, the app extracts only the isolated GPS point [lat, lng] of the pothole. It completely discards the driver’s point of origin (e.g., their home address), destination, vehicle speed, and transit route. An observer looking at a pothole pin has zero mathematical way of knowing where the driver came from or where they were going.'
        ),

        createHeading2('3.3 Zero Personally Identifiable Information (PII) on the Map'),
        createBody('Public map markers display only:'),
        createBullet(['The landmark or road name ("Collins Hill Rd near Campus Loop").']),
        createBullet(['The reverse-geocoded municipal address.']),
        createBullet(['The physical shock magnitude ("7.80G Shock").']),
        createBullet(['The community confirmation count ("5 drivers confirmed").']),
        createBody([
          { text: 'No student names, student IDs, email addresses, vehicle types, or IP addresses are ever attached to public hazard markers.', bold: true }
        ]),

        createHeading2('3.4 Role-Based Administrative Gating'),
        createBody(
          'Following our recent pull request (hluna), sensitive operations—such as batch municipal work order dispatch and internal pavement diagnostics—are locked behind Admin Authentication (AuthContext). Regular drivers can view hazards, but cannot trigger administrative dispatches.'
        ),

        createHeading2('3.5 Local Data Agency'),
        createBody(
          'All report drafts and settings are stored locally in the user’s private browser localStorage. Drivers can wipe their local history at any time with one tap in Settings.'
        ),

        // Section 4
        createHeading1('4. Community Adoption, Marketing & Stakeholder Outreach'),
        createBody(
          'A civic technology application is only as powerful as the community that uses it. To transition GGC SansPotholes into a thriving campus and county utility, we have mapped out three high-impact target stakeholder groups:'
        ),

        // Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 6, color: COLOR_BORDER },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            insideVertical: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
          },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Stakeholder Group', font: FONT_NAME, bold: true, color: 'FFFFFF' })] })]
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'Why They Care', font: FONT_NAME, bold: true, color: 'FFFFFF' })] })]
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [new Paragraph({ children: [new TextRun({ text: 'How They Harness the App', font: FONT_NAME, bold: true, color: 'FFFFFF' })] })]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody([{ text: 'GGC Student Government Association (SGA)', bold: true }])]
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Commuter safety, protecting student bank accounts from $800 wheel/suspension damage.')]
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Can sponsor campus awareness campaigns and present road condition reports directly to the College President’s Cabinet.')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody([{ text: 'GGC Campus Police & Facilities Management', bold: true }])]
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Campus roadway safety, pedestrian safety, parking deck upkeep.')]
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Can use our map to prioritize repairs on college-owned corridors (University Center Ln, Lonnie Harvel Way, Lots 1000–3000).')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody([{ text: 'Gwinnett County DOT & City of Lawrenceville', bold: true }])]
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Prioritizing road repairs with empirical sensor data rather than angry subjective calls.')]
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Can ingest our single-page certified PDF work order dockets with embedded map screenshots for crew dispatch.')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody([{ text: 'Gwinnett County Public Schools (GCPS Bus Fleet)', bold: true }])]
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Largest school bus fleet in Georgia; vehicle maintenance and pupil transit safety.')]
                }),
                new TableCell({
                  shading: { type: ShadingType.CLEAR, fill: COLOR_BG_LIGHT },
                  children: [createBody('Route supervisors can use Drive-Time Mapping on morning trial runs to identify severe road damage before student buses depart.')]
                })
              ]
            }),
            new TableRow({
              children: [
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody([{ text: 'Gig Delivery & Rideshare Drivers (DoorDash, Uber)', bold: true }])]
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Full-time drivers whose income depends on avoiding vehicle damage.')]
                }),
                new TableCell({
                  margins: { top: 80, bottom: 80, left: 100, right: 100 },
                  children: [createBody('Grassroots user base who drive thousands of miles across Gwinnett County corridors every week.')]
                })
              ]
            })
          ]
        }),

        createHeading2('4.2 Practical Distribution & Marketing Tactics'),
        createBullet([
          { text: 'Progressive Web App (PWA) QR Code Campaign: ', bold: true },
          'Because the app is hosted on Cloudflare Pages as a Progressive Web App, commuters do not need an App Store download. We can place laminated QR code posters in campus parking decks and student center bulletin boards: "Scan to Patrol Your Commute". Commuters scan the QR code and tap "Add to Home Screen" on their phone for an instant native app icon.'
        ]),
        createBullet([
          { text: 'The "Protect Your Ride" Student Campaign: ', bold: true },
          'Market the app around a direct student pain point: "Avoid an $800 wheel and suspension repair bill on your commute to GGC." Feature the app in The Grizzly Gazette (GGC Student News) as a student-built engineering triumph.'
        ]),
        createBullet([
          { text: 'Capstone Demo Day & Municipal Outreach: ', bold: true },
          'Use our 12-slide Capstone Evaluation and 3-slide Press Release decks (both available on the site in Comic Sans MS) to present directly to GGC leadership and Gwinnett municipal leaders.'
        ]),
        createBullet([
          { text: 'Civic Tech Open Source Alliances: ', bold: true },
          'Connect with Code for America (Atlanta Brigade) to showcase GGC SansPotholes as an open-source model for student-led municipal innovation.'
        ]),

        // Section 5
        createHeading1('5. Summary Checklist for Classroom Presentation'),
        createBody('When presenting our post-deployment plan to our Software Development 2 classmates, use this 60-second summary:'),
        createBullet([
          { text: 'The Pipeline: ', bold: true },
          'GitHub is our development workbench; Cloudflare Pages is our automated global host. Merging code into main automatically updates sanspotholes.pages.dev in 45 seconds with 0 downtime.'
        ]),
        createBullet([
          { text: 'Testing: ', bold: true },
          'We use Vitest for lightning-fast unit tests, React Testing Library for UI components, and Playwright for cross-browser mobile automation.'
        ]),
        createBullet([
          { text: 'Privacy: ', bold: true },
          'Drive trajectories are kept 100% ephemeral in local device memory. Only isolated, anonymous shock coordinates are shared; commuters can never be tracked or stalked.'
        ]),
        createBullet([
          { text: 'Civic Value: ', bold: true },
          'The app solves the distracted driving dilemma by replacing manual forms with automated hands-free patrol, empowering GGC students, Gwinnett DOT, and municipal crews to keep local roads safe.'
        ])
      ]
    }
  ]
});

const OUTPUT_DOCX = 'GGC_SansPotholes_Maintenance_and_Operations_Guide.docx';
Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync(OUTPUT_DOCX, buffer);
  console.log(`Successfully generated Word document: ${OUTPUT_DOCX}`);
  process.exit(0);
}).catch(err => {
  console.error('Error generating docx:', err);
  process.exit(1);
});
