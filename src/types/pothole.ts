export type SeverityLevel = 'minor' | 'moderate' | 'severe' | 'critical';
export type PotholeStatus = 'reported' | 'investigating' | 'scheduled' | 'repaired';
export type HazardType = 'POTHOLE' | 'ROAD_CRACK' | 'MANHOLE_COLLAPSE' | 'SINKHOLE_RISK';

export type Jurisdiction =
  | 'Georgia Gwinnett College (GGC Facilities)'
  | 'Gwinnett County DOT'
  | 'GDOT (State Route)'
  | 'City of Lawrenceville'
  | 'City of Duluth'
  | 'City of Suwanee'
  | 'City of Peachtree Corners'
  | 'City of Norcross'
  | 'City of Snellville'
  | 'City of Lilburn'
  | 'City of Buford'
  | 'City of Sugar Hill'
  | 'City of Dacula'
  | string;

export interface PotholeReport {
  id: string;
  trackingCode?: string; // e.g. GAP-2026-1002
  title: string;
  address: string;
  roadName: string;
  city: string;
  jurisdiction: Jurisdiction;
  authorityId?: string; // GGC, GWINNETT_COUNTY, GDOT, LAWRENCEVILLE, etc.
  authorityName?: string;
  authorityEmail?: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  hazardType?: HazardType;
  status: PotholeStatus;
  verificationsCount: number;
  userConfirmed: boolean;
  reportedAt: string; // ISO date or display string
  lastVerifiedAt: string;
  description: string;
  landmark?: string;
  reporterName?: string;
  reporterEmail?: string;
  estimatedDepthInches: number;
  estimatedWidthInches: number;
  surfaceType: 'Asphalt' | 'Concrete' | 'Composite';
  damageRisk: 'Tire / Rim Damage' | 'Suspension / Alignment' | 'Loss of Control Hazard' | 'Cosmetic';
  detectedBy: 'User Mobile Report' | 'Dashcam AI Vision' | 'Vehicle Accelerometer Telemetry' | 'City Inspector' | 'Student Campus Report';
  sensorDetected?: boolean;
  bumpIntensity?: number; // Acceleration in Gs (e.g. 7.4G)
  imageUrl?: string;
  workOrderNumber?: string;
  assignedCrew?: string;
  targetRepairDate?: string;
  distanceFromGgcMiles?: number;
  source?: 'known' | 'user' | 'sensor' | 'ai';
}

export interface RoadSegment {
  id: string;
  name: string;
  corridor: string;
  jurisdiction: Jurisdiction;
  coordinates: [number, number][]; // Leaflet LatLng polyline
  pci: number; // Pavement Condition Index (0-100)
  riskLevel: 'Low' | 'Moderate' | 'High' | 'Critical';
  potholeCount: number;
  dailyTrafficAADT: number;
  recurringIssue: string;
  lastResurfacedYear: number;
  nextScheduledResurfacing: string;
}

export interface MunicipalContact {
  jurisdiction: Jurisdiction;
  department: string;
  phone: string;
  email: string;
  portalUrl: string;
  dispatchLeadTime: string;
  activeWorkOrders: number;
  potholeHotline: string;
}
