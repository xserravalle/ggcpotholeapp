import { PotholeReport } from '@/types/pothole';
import { AuthorityContact } from '@/types/jurisdiction';

export const mockPotholeReport = (overrides?: Partial<PotholeReport>): PotholeReport => ({
  id: 'mock-pothole-1',
  title: 'Pothole on University Way',
  address: '1000 University Way',
  roadName: 'University Way',
  city: 'Lawrenceville',
  jurisdiction: 'Georgia Gwinnett College (GGC Facilities)',
  authorityId: 'GGC',
  authorityName: 'GGC Facilities',
  authorityEmail: 'facilities@ggc.edu',
  latitude: 33.9798,
  longitude: -84.0017,
  severity: 'moderate',
  status: 'reported',
  verificationsCount: 0,
  userConfirmed: false,
  reportedAt: new Date().toISOString(),
  lastVerifiedAt: new Date().toISOString(),
  description: 'Test pothole',
  estimatedDepthInches: 3,
  estimatedWidthInches: 8,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
  ...overrides,
});

export const mockAuthorityContact = (overrides?: Partial<AuthorityContact>): AuthorityContact => ({
  id: 'GGC',
  category: 'Campus',
  name: 'GGC Facilities',
  jurisdictionType: 'Campus',
  department: 'Campus Operations',
  contactEmail: 'facilities@ggc.edu',
  phone: '(678) 407-5000',
  website: 'https://www.ggc.edu',
  badgeColor: 'emerald',
  slaTurnaround: '24-48 hours',
  description: 'Georgia Gwinnett College',
  potholeHotline: '(678) 407-5000',
  portalUrl: 'https://www.ggc.edu',
  activeWorkOrders: 5,
  dispatchLeadTime: '2-4 hours',
  ...overrides,
});

export const createMockPotholeReports = (count: number): PotholeReport[] => {
  const baseLat = 33.9798;
  const baseLon = -84.0017;
  const reports: PotholeReport[] = [];

  for (let i = 0; i < count; i++) {
    reports.push(
      mockPotholeReport({
        id: `pothole-${i}`,
        trackingCode: `GAP-2026-${1000 + i}`,
        latitude: baseLat + (Math.random() - 0.5) * 0.05,
        longitude: baseLon + (Math.random() - 0.5) * 0.05,
        reportedAt: new Date(Date.now() - i * 3600000).toISOString(),
      })
    );
  }

  return reports;
};

export const allAuthorityContacts: AuthorityContact[] = [
  {
    id: 'GGC',
    category: 'Campus',
    name: 'GGC Facilities',
    jurisdictionType: 'Campus',
    department: 'Campus Operations',
    contactEmail: 'facilities@ggc.edu',
    phone: '(678) 407-5000',
    website: 'https://www.ggc.edu',
    badgeColor: 'emerald',
    slaTurnaround: '24-48 hours',
    description: 'Georgia Gwinnett College',
    potholeHotline: '(678) 407-5000',
    portalUrl: 'https://www.ggc.edu',
    activeWorkOrders: 5,
    dispatchLeadTime: '2-4 hours',
  },
  {
    id: 'GWINNETT_COUNTY',
    category: 'County',
    name: 'Gwinnett County DOT',
    jurisdictionType: 'County',
    department: 'Road Maintenance',
    contactEmail: 'dotcustomerservice@gwinnettcounty.com',
    phone: '(770) 822-7980',
    website: 'https://www.gwinnettcounty.com',
    badgeColor: 'blue',
    slaTurnaround: '3-5 days',
    description: 'Unincorporated Gwinnett County',
    potholeHotline: '311',
    portalUrl: 'https://www.gwinnettcounty.com',
    activeWorkOrders: 45,
    dispatchLeadTime: '1-2 days',
  },
  {
    id: 'GDOT',
    category: 'State',
    name: 'GDOT District 1',
    jurisdictionType: 'State',
    department: 'Highway Maintenance',
    contactEmail: 'District1Dispatch@dot.ga.gov',
    phone: '511',
    website: 'https://www.dot.ga.gov',
    badgeColor: 'amber',
    slaTurnaround: '3-5 days',
    description: 'State Routes & Interstates',
    potholeHotline: '511',
    portalUrl: 'https://www.dot.ga.gov',
    activeWorkOrders: 32,
    dispatchLeadTime: '1-3 days',
  },
];
