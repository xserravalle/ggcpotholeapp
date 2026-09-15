import { RoadSegment } from '../types/pothole';

export const HIGH_RISK_ROAD_SEGMENTS: RoadSegment[] = [
  {
    id: 'SEG-PL-01',
    name: 'Pleasant Hill Rd Corridor (Commercial Arterial)',
    corridor: 'Pleasant Hill Rd',
    jurisdiction: 'City of Duluth',
    coordinates: [
      [33.9450, -84.1480],
      [33.9520, -84.1410],
      [33.9592, -84.1338],
      [33.9660, -84.1250],
      [33.9720, -84.1160]
    ],
    pci: 48, // Poor
    riskLevel: 'Critical',
    potholeCount: 19,
    dailyTrafficAADT: 64500,
    recurringIssue: 'High freight turning shear + heavy intersection braking failure',
    lastResurfacedYear: 2017,
    nextScheduledResurfacing: 'Spring 2027 (SPLOST Funded)'
  },
  {
    id: 'SEG-BUF-02',
    name: 'Buford Hwy (US-23) Norcross-to-Duluth',
    corridor: 'Buford Hwy (US-23)',
    jurisdiction: 'City of Norcross',
    coordinates: [
      [33.9350, -84.2250],
      [33.9421, -84.2144],
      [33.9580, -84.1920],
      [33.9820, -84.1620],
      [34.0020, -84.1450]
    ],
    pci: 54, // Poor/Fair
    riskLevel: 'High',
    potholeCount: 14,
    dailyTrafficAADT: 38200,
    recurringIssue: 'Stormwater sub-base saturation along Yellow River basin drainage',
    lastResurfacedYear: 2018,
    nextScheduledResurfacing: 'Fall 2026'
  },
  {
    id: 'SEG-SCE-03',
    name: 'Scenic Hwy (SR 124) Snellville Retail Corridor',
    corridor: 'Scenic Hwy (SR 124)',
    jurisdiction: 'City of Snellville',
    coordinates: [
      [33.8480, -84.0280],
      [33.8584, -84.0152],
      [33.8740, -84.0050],
      [33.8950, -83.9980],
      [33.9180, -83.9910]
    ],
    pci: 52, // Poor
    riskLevel: 'Critical',
    potholeCount: 16,
    dailyTrafficAADT: 47800,
    recurringIssue: 'Curb cut density & frequent utility trench cut settlements',
    lastResurfacedYear: 2019,
    nextScheduledResurfacing: 'Summer 2027'
  },
  {
    id: 'SEG-316-04',
    name: 'SR 316 (University Pkwy) High-Speed Trunk',
    corridor: 'SR 316 / University Pkwy',
    jurisdiction: 'GDOT (State Route)',
    coordinates: [
      [33.9550, -84.0720],
      [33.9640, -84.0510],
      [33.9712, -84.0320],
      [33.9780, -84.0120],
      [33.9870, -83.9750]
    ],
    pci: 62, // Fair
    riskLevel: 'High',
    potholeCount: 11,
    dailyTrafficAADT: 78900,
    recurringIssue: 'High-speed wheel-path fatigue cracking & joint spalling',
    lastResurfacedYear: 2020,
    nextScheduledResurfacing: 'Winter 2027'
  },
  {
    id: 'SEG-SUG-05',
    name: 'Sugarloaf Pkwy / Mall & Transit Segment',
    corridor: 'Sugarloaf Pkwy',
    jurisdiction: 'Gwinnett County DOT',
    coordinates: [
      [33.9920, -84.1120],
      [33.9850, -84.0880],
      [33.9785, -84.0645],
      [33.9710, -84.0410],
      [33.9620, -84.0150]
    ],
    pci: 69, // Fair/Good
    riskLevel: 'Moderate',
    potholeCount: 8,
    dailyTrafficAADT: 52400,
    recurringIssue: 'Heavy transit bus axle loading around Sugarloaf Mills terminals',
    lastResurfacedYear: 2021,
    nextScheduledResurfacing: 'Spring 2028'
  },
  {
    id: 'SEG-SAT-06',
    name: 'Satellite Blvd Commercial Spine',
    corridor: 'Satellite Blvd',
    jurisdiction: 'Gwinnett County DOT',
    coordinates: [
      [33.9520, -84.1350],
      [33.9620, -84.1210],
      [33.9680, -84.1120],
      [33.9790, -84.0980],
      [33.9940, -84.0820]
    ],
    pci: 58, // Fair
    riskLevel: 'Moderate',
    potholeCount: 7,
    dailyTrafficAADT: 34100,
    recurringIssue: 'Red clay soil shifting and edge thermal shrinkage cracks',
    lastResurfacedYear: 2018,
    nextScheduledResurfacing: 'Summer 2027'
  },
  {
    id: 'SEG-PTC-07',
    name: 'Peachtree Industrial Blvd & Smart Corridor',
    corridor: 'Peachtree Industrial Blvd',
    jurisdiction: 'City of Peachtree Corners',
    coordinates: [
      [33.9450, -84.2480],
      [33.9610, -84.2380],
      [33.9750, -84.2250],
      [33.9920, -84.2080],
      [34.0150, -84.1850]
    ],
    pci: 76, // Good
    riskLevel: 'Moderate',
    potholeCount: 5,
    dailyTrafficAADT: 46000,
    recurringIssue: 'Longitudinal joint weathering and bridge abutment settlement',
    lastResurfacedYear: 2022,
    nextScheduledResurfacing: '2029'
  },
  {
    id: 'SEG-LAW-08',
    name: 'Collins Hill Rd @ Georgia Gwinnett College (GGC)',
    corridor: 'Collins Hill Rd',
    jurisdiction: 'City of Lawrenceville',
    coordinates: [
      [33.9650, -84.0150],
      [33.9740, -84.0110],
      [33.9825, -84.0072],
      [33.9910, -84.0020]
    ],
    pci: 50, // Poor
    riskLevel: 'High',
    potholeCount: 9,
    dailyTrafficAADT: 29500,
    recurringIssue: 'High-frequency student stop-and-go braking ripple corrugation',
    lastResurfacedYear: 2017,
    nextScheduledResurfacing: 'Winter 2026'
  }
];
