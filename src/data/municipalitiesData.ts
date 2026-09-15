import { MunicipalContact, Jurisdiction } from '../types/pothole';

export const MUNICIPAL_CONTACTS: Record<Jurisdiction, MunicipalContact> = {
  'Gwinnett County DOT': {
    jurisdiction: 'Gwinnett County DOT',
    department: 'Department of Transportation - Road Operations & Maintenance',
    phone: '(770) 822-7400',
    email: 'dotoperations@gwinnettcounty.com',
    portalUrl: 'https://www.gwinnettcounty.com/web/gwinnett/departments/transportation',
    dispatchLeadTime: '24 - 48 hours for arterial response',
    activeWorkOrders: 42,
    potholeHotline: '(770) 822-7474'
  },
  'City of Lawrenceville': {
    jurisdiction: 'City of Lawrenceville',
    department: 'Public Works - Street & Infrastructure Maintenance',
    phone: '(678) 407-6745',
    email: 'publicworks@lawrencevillega.org',
    portalUrl: 'https://www.lawrencevillega.org/191/Streets',
    dispatchLeadTime: '24 - 72 hours',
    activeWorkOrders: 14,
    potholeHotline: '(678) 407-6600'
  },
  'City of Duluth': {
    jurisdiction: 'City of Duluth',
    department: 'Public Works - Streets & Stormwater Division',
    phone: '(770) 476-2454',
    email: 'publicworks@duluthga.net',
    portalUrl: 'https://www.duluthga.net/departments/public_works',
    dispatchLeadTime: '12 - 48 hours',
    activeWorkOrders: 9,
    potholeHotline: '(770) 476-1808'
  },
  'City of Norcross': {
    jurisdiction: 'City of Norcross',
    department: 'Public Works & Utilities',
    phone: '(678) 421-2069',
    email: 'publicworks@norcrossga.net',
    portalUrl: 'https://www.norcrossga.net/148/Public-Works',
    dispatchLeadTime: '24 - 48 hours',
    activeWorkOrders: 8,
    potholeHotline: '(678) 421-2069'
  },
  'City of Snellville': {
    jurisdiction: 'City of Snellville',
    department: 'Public Works Department - Street Maintenance',
    phone: '(770) 985-3527',
    email: 'pwdispatch@snellville.org',
    portalUrl: 'https://www.snellville.org/public-works',
    dispatchLeadTime: '48 - 72 hours',
    activeWorkOrders: 11,
    potholeHotline: '(770) 985-3527'
  },
  'City of Suwanee': {
    jurisdiction: 'City of Suwanee',
    department: 'Public Works - Street Maintenance Division',
    phone: '(770) 945-8996',
    email: 'pwops@suwanee.com',
    portalUrl: 'https://www.suwanee.com/departments/public-works',
    dispatchLeadTime: '24 - 36 hours',
    activeWorkOrders: 7,
    potholeHotline: '(770) 945-8996'
  },
  'City of Peachtree Corners': {
    jurisdiction: 'City of Peachtree Corners',
    department: 'Public Works & Curiosity Lab Smart Infrastructure',
    phone: '(678) 691-1200',
    email: 'publicworks@peachtreecornersga.gov',
    portalUrl: 'https://peachtreecornersga.gov/public-works',
    dispatchLeadTime: '12 - 24 hours (IoT priority triage)',
    activeWorkOrders: 6,
    potholeHotline: '(678) 691-1200'
  },
  'GDOT (State Route)': {
    jurisdiction: 'GDOT (State Route)',
    department: 'Georgia DOT District 1 (Northeast Georgia) Maintenance',
    phone: '(770) 532-5500',
    email: 'District1Inquiries@dot.ga.gov',
    portalUrl: 'https://www.dot.ga.gov/GDOT/Pages/ReportDamage.aspx',
    dispatchLeadTime: '48 - 96 hours',
    activeWorkOrders: 31,
    potholeHotline: '511'
  }
};
