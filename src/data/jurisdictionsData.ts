import { AuthorityContact } from '../types/jurisdiction';
import { MunicipalContact } from '../types/pothole';

export const CAMPUS_CENTER = {
  name: 'Georgia Gwinnett College',
  address: '1000 University Center Ln, Lawrenceville, GA 30043',
  lat: 33.9798,
  lng: -84.0017,
  radiusMiles: 1,
  radiusMeters: 1609.34,
};

// GGC Campus Polygon (accurate to campus boundaries)
export const GGC_CAMPUS_POLYGON: [number, number][] = [
  [33.9855, -84.0090], // North-west (near Collins Hill / GGC North)
  [33.9860, -84.0005], // North-east (near University Center Ln ext)
  [33.9805, -83.9960], // East (near Athletics / Tennis Complex)
  [33.9740, -84.0000], // South-east (near Residence Halls)
  [33.9740, -84.0125], // South-west (near Building A / Parking Lot A)
  [33.9810, -84.0135], // West (along Collins Hill Rd campus side)
];

// State highways and interstates routed directly to GDOT
export const GDOT_HIGHWAY_KEYWORDS = [
  'ga-316', 'ga 316', 'sr-316', 'sr 316', 'highway 316', 'university pkwy',
  'i-85', 'i 85', 'interstate 85', 'i-985', 'i 985', 'interstate 985',
  'ga-20', 'ga 20', 'sr-20', 'sr 20', 'highway 20',
  'ga-120', 'ga 120', 'sr-120',
  'ga-124', 'ga 124', 'sr-124',
  'ga-141', 'ga 141', 'sr-141',
  'us-78', 'us 78', 'stone mountain fwy',
  'us-29', 'us 29'
];

export const MUNICIPAL_BOUNDS: Record<string, {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
  keywords: string[];
}> = {
  DULUTH: {
    minLat: 33.9950, maxLat: 34.0350, minLng: -84.1800, maxLng: -84.1200,
    keywords: ['duluth', 'historic duluth', 'peachtree industrial blvd']
  },
  SUWANEE: {
    minLat: 34.0300, maxLat: 34.0800, minLng: -84.1100, maxLng: -84.0300,
    keywords: ['suwanee', 'suwanee town center', 'mcginnis ferry']
  },
  PEACHTREE_CORNERS: {
    minLat: 33.9450, maxLat: 34.0000, minLng: -84.2600, maxLng: -84.1850,
    keywords: ['peachtree corners', 'technology pkwy', 'peachtree corners town center', 'spalding dr']
  },
  NORCROSS: {
    minLat: 33.9200, maxLat: 33.9450, minLng: -84.2300, maxLng: -84.1800,
    keywords: ['norcross', 'historic norcross', 'holcomb bridge']
  },
  SNELLVILLE: {
    minLat: 33.8400, maxLat: 33.8900, minLng: -84.0500, maxLng: -83.9700,
    keywords: ['snellville', 'scenic hwy', 'wisteria dr']
  },
  LILBURN: {
    minLat: 33.8750, maxLat: 33.9150, minLng: -84.1600, maxLng: -84.1000,
    keywords: ['lilburn', 'main st lilburn', 'rockbridge rd']
  },
  BUFORD: {
    minLat: 34.0900, maxLat: 34.1500, minLng: -84.0300, maxLng: -83.9600,
    keywords: ['buford', 'historic buford', 'mall of georgia']
  },
  SUGAR_HILL: {
    minLat: 34.0800, maxLat: 34.1300, minLng: -84.0800, maxLng: -84.0200,
    keywords: ['sugar hill', 'sugar hill town bowl', 'altona']
  },
  DACULA: {
    minLat: 33.9700, maxLat: 34.0300, minLng: -83.9200, maxLng: -83.8400,
    keywords: ['dacula', 'hebron', 'harbins', 'dacula rd']
  },
  LAWRENCEVILLE: {
    minLat: 33.9400, maxLat: 33.9750, minLng: -84.0200, maxLng: -83.9700,
    keywords: ['lawrenceville', 'crogan', 'pike st', 'perry st', 'lawrenceville square']
  }
};

export const AUTHORITIES_DIRECTORY: Record<string, AuthorityContact> = {
  GGC: {
    id: 'GGC',
    category: 'Campus Infrastructure',
    name: 'Georgia Gwinnett College (GGC Facilities)',
    jurisdictionType: 'Campus Roadway / Parking Deck',
    department: 'Campus Operations & Facilities Maintenance',
    contactEmail: 'facilities@ggc.edu',
    phone: '(678) 407-5533',
    website: 'https://www.ggc.edu/about-ggc/directory/facilities-management',
    badgeColor: 'emerald',
    slaTurnaround: '24 to 48 hours',
    description: 'Internal campus roadway, student parking lot/deck, or walkway on Georgia Gwinnett College property.',
    potholeHotline: '(678) 407-5533',
    portalUrl: 'https://www.ggc.edu/about-ggc/directory/facilities-management',
    activeWorkOrders: 14,
    dispatchLeadTime: '24-48 Hours'
  },
  GWINNETT_COUNTY: {
    id: 'GWINNETT_COUNTY',
    category: 'County Highway & Roadways',
    name: 'Gwinnett County DOT',
    jurisdictionType: 'Unincorporated County Roadway',
    department: 'Road Maintenance & Bridge Operations Division',
    contactEmail: 'dotcustomerservice@gwinnettcounty.com',
    phone: '(770) 822-7400',
    website: 'https://www.gwinnettcounty.com/web/gwinnett/departments/transportation',
    badgeColor: 'purple',
    slaTurnaround: '3 to 5 business days',
    description: 'County-maintained arterial, collector road, or unincorporated Gwinnett right-of-way.',
    potholeHotline: '(770) 822-7400',
    portalUrl: 'https://www.gwinnettcounty.com/web/gwinnett/departments/transportation',
    activeWorkOrders: 42,
    dispatchLeadTime: '3-5 Business Days'
  },
  GDOT: {
    id: 'GDOT',
    category: 'State Highway & Interstates',
    name: 'GDOT (State Route)',
    jurisdictionType: 'Interstate Highway / State Route',
    department: 'Highway Maintenance & Operations (District 1)',
    contactEmail: 'District1Dispatch@dot.ga.gov',
    phone: '511 / (888) 425-1178',
    website: 'https://www.dot.ga.gov',
    badgeColor: 'amber',
    slaTurnaround: '3 to 5 business days',
    description: 'State route, interstate highway (I-85, GA-316, US-78), or ramp under GDOT jurisdiction.',
    potholeHotline: 'Dial 511',
    portalUrl: 'https://511ga.org',
    activeWorkOrders: 19,
    dispatchLeadTime: '3-5 Business Days'
  },
  LAWRENCEVILLE: {
    id: 'LAWRENCEVILLE',
    category: 'City Municipal Streets',
    name: 'City of Lawrenceville',
    jurisdictionType: 'Municipal Street',
    department: 'Street & Infrastructure Maintenance',
    contactEmail: 'publicworks@lawrencevillega.org',
    phone: '(770) 963-2414',
    website: 'https://www.lawrencevillega.org/168/Public-Works',
    badgeColor: 'blue',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Lawrenceville maintained municipal street and downtown historic district.',
    potholeHotline: '(770) 963-2414',
    portalUrl: 'https://www.lawrencevillega.org/168/Public-Works',
    activeWorkOrders: 18,
    dispatchLeadTime: '48-72 Hours'
  },
  DULUTH: {
    id: 'DULUTH',
    category: 'City Municipal Streets',
    name: 'City of Duluth',
    jurisdictionType: 'Municipal Street',
    department: 'Streets & Maintenance Division',
    contactEmail: 'publicworks@duluthga.net',
    phone: '(770) 476-2454',
    website: 'https://www.duluthga.net/departments/public_works',
    badgeColor: 'cyan',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Duluth municipal road or downtown street.',
    potholeHotline: '(770) 476-2454',
    portalUrl: 'https://www.duluthga.net',
    activeWorkOrders: 12,
    dispatchLeadTime: '48-72 Hours'
  },
  SUWANEE: {
    id: 'SUWANEE',
    category: 'City Municipal Streets',
    name: 'City of Suwanee',
    jurisdictionType: 'Municipal Street',
    department: 'Public Works & Street Operations',
    contactEmail: 'publicworks@suwanee.com',
    phone: '(770) 945-8996',
    website: 'https://www.suwanee.com/departments/public-works',
    badgeColor: 'teal',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Suwanee municipal street or Town Center access road.',
    potholeHotline: '(770) 945-8996',
    portalUrl: 'https://www.suwanee.com',
    activeWorkOrders: 9,
    dispatchLeadTime: '48-72 Hours'
  },
  PEACHTREE_CORNERS: {
    id: 'PEACHTREE_CORNERS',
    category: 'City Municipal Streets',
    name: 'City of Peachtree Corners',
    jurisdictionType: 'Municipal Street',
    department: 'Public Works & Infrastructure',
    contactEmail: 'publicworks@peachtreecornersga.gov',
    phone: '(678) 691-1200',
    website: 'https://www.peachtreecornersga.gov',
    badgeColor: 'indigo',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Peachtree Corners municipal corridor, Curiosity Lab test track, or Town Center roadway.',
    potholeHotline: '(678) 691-1200',
    portalUrl: 'https://www.peachtreecornersga.gov',
    activeWorkOrders: 8,
    dispatchLeadTime: '48-72 Hours'
  },
  NORCROSS: {
    id: 'NORCROSS',
    category: 'City Municipal Streets',
    name: 'City of Norcross',
    jurisdictionType: 'Municipal Street',
    department: 'Public Works & Utilities',
    contactEmail: 'publicworks@norcrossga.net',
    phone: '(770) 448-2122',
    website: 'https://www.norcrossga.net/141/Public-Works',
    badgeColor: 'sky',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Norcross municipal street or Historic District corridor.',
    potholeHotline: '(770) 448-2122',
    portalUrl: 'https://www.norcrossga.net',
    activeWorkOrders: 11,
    dispatchLeadTime: '48-72 Hours'
  },
  SNELLVILLE: {
    id: 'SNELLVILLE',
    category: 'City Municipal Streets',
    name: 'City of Snellville',
    jurisdictionType: 'Municipal Street',
    department: 'Street Maintenance Division',
    contactEmail: 'publicworks@snellville.org',
    phone: '(770) 985-3527',
    website: 'https://www.snellville.org/public-works',
    badgeColor: 'orange',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Snellville municipal street or town roadway.',
    potholeHotline: '(770) 985-3527',
    portalUrl: 'https://www.snellville.org',
    activeWorkOrders: 15,
    dispatchLeadTime: '48-72 Hours'
  },
  LILBURN: {
    id: 'LILBURN',
    category: 'City Municipal Streets',
    name: 'City of Lilburn',
    jurisdictionType: 'Municipal Street',
    department: 'Streets & Maintenance',
    contactEmail: 'publicworks@cityoflilburn.com',
    phone: '(770) 921-2211',
    website: 'https://www.cityoflilburn.com/152/Public-Works',
    badgeColor: 'violet',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Lilburn municipal roadway.',
    potholeHotline: '(770) 921-2211',
    portalUrl: 'https://www.cityoflilburn.com',
    activeWorkOrders: 7,
    dispatchLeadTime: '48-72 Hours'
  },
  BUFORD: {
    id: 'BUFORD',
    category: 'City Municipal Streets',
    name: 'City of Buford',
    jurisdictionType: 'Municipal Street',
    department: 'Street & City Maintenance',
    contactEmail: 'publicworks@cityofbuford.com',
    phone: '(770) 945-6761',
    website: 'https://www.cityofbuford.com',
    badgeColor: 'blue',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Buford municipal roadway and downtown district.',
    potholeHotline: '(770) 945-6761',
    portalUrl: 'https://www.cityofbuford.com',
    activeWorkOrders: 10,
    dispatchLeadTime: '48-72 Hours'
  },
  SUGAR_HILL: {
    id: 'SUGAR_HILL',
    category: 'City Municipal Streets',
    name: 'City of Sugar Hill',
    jurisdictionType: 'Municipal Street',
    department: 'Street Maintenance Operations',
    contactEmail: 'publicworks@cityofsugarhill.com',
    phone: '(770) 945-6716',
    website: 'https://cityofsugarhill.com/departments/public-works',
    badgeColor: 'amber',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Sugar Hill municipal street.',
    potholeHotline: '(770) 945-6716',
    portalUrl: 'https://cityofsugarhill.com',
    activeWorkOrders: 6,
    dispatchLeadTime: '48-72 Hours'
  },
  DACULA: {
    id: 'DACULA',
    category: 'City Municipal Streets',
    name: 'City of Dacula',
    jurisdictionType: 'Municipal Street',
    department: 'Public Works & Maintenance',
    contactEmail: 'dacula@daculaga.gov',
    phone: '(770) 963-7451',
    website: 'https://daculaga.gov/public-works',
    badgeColor: 'emerald',
    slaTurnaround: '48 to 72 hours',
    description: 'City of Dacula municipal street.',
    potholeHotline: '(770) 963-7451',
    portalUrl: 'https://daculaga.gov',
    activeWorkOrders: 5,
    dispatchLeadTime: '48-72 Hours'
  }
};

// Also maintain compatibility map for MunicipalContacts
export const MUNICIPAL_CONTACTS: Record<string, MunicipalContact> = Object.entries(AUTHORITIES_DIRECTORY).reduce(
  (acc, [key, auth]) => {
    acc[auth.name] = {
      jurisdiction: auth.name,
      department: auth.department,
      phone: auth.phone,
      email: auth.contactEmail,
      portalUrl: auth.portalUrl,
      dispatchLeadTime: auth.dispatchLeadTime,
      activeWorkOrders: auth.activeWorkOrders,
      potholeHotline: auth.potholeHotline
    };
    acc[key] = acc[auth.name];
    return acc;
  },
  {} as Record<string, MunicipalContact>
);
