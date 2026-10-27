import { ReportStatus } from './status';

export type UserRole = 'guest' | 'user' | 'admin' | 'officer';

export type ReportPriority = 'low' | 'medium' | 'high' | 'critical';

export type RejectedReason =
  | 'duplicate'
  | 'not_a_pothole'
  | 'out_of_area'
  | 'insufficient_info';

export interface TimelineEntry {
  id: string;
  status: ReportStatus;
  action: string;
  message: string;
  actorName: string;
  actorRole: UserRole;
  timestamp: string;
}

export interface CitizenFeedback {
  rating: number; // 1 to 5
  comment?: string;
}

export interface Actor {
  id?: string;
  name: string;
  role: UserRole;
  email?: string;
  agencyId?: string;
}

export interface Comment {
  id: string;
  reportId: string;
  authorName: string;
  authorRole: UserRole;
  text: string; // max 1000 characters
  timestamp: string;
}

export interface NotificationMessage {
  id: string;
  recipientRole: UserRole;
  recipientName?: string;
  recipientEmail?: string;
  title: string;
  message: string;
  reportId: string;
  trackingCode?: string;
  timestamp: string;
  read?: boolean;
}

export type SeverityLevel = 'minor' | 'moderate' | 'severe' | 'critical';
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

export interface SensorEvidence {
  hitCount: number;
  maxGForce: number;
  firstDetectedAt: string;
  lastDetectedAt: string;
}

export interface PotholeReport {
  id: string;
  trackingCode?: string; // e.g. GAP-2026-XXXXXXXX
  title: string;
  address: string;
  roadName: string;
  city: string;
  jurisdiction: Jurisdiction;
  authorityId?: string;
  authorityName?: string;
  authorityEmail?: string;
  latitude: number;
  longitude: number;
  severity: SeverityLevel;
  hazardType?: HazardType;
  status: ReportStatus;
  priority: ReportPriority;
  priorityScore: number; // 0 to 100
  assignedAgencyId?: string;
  assignedOfficerId?: string;
  timeline: TimelineEntry[];
  rejectedReason?: RejectedReason;
  mergedIntoId?: string;
  resolvedAt?: string;
  reopenCount?: number;
  feedback?: CitizenFeedback;
  slaDueAt?: string;
  verificationsCount: number;
  userConfirmed: boolean;
  reportedAt: string; // ISO date string
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
  sensorEvidence?: SensorEvidence;
  bumpIntensity?: number;
  imageUrl?: string;
  workOrderNumber?: string;
  assignedCrew?: string;
  targetRepairDate?: string;
  distanceFromGgcMiles?: number;
  source?: 'known' | 'user' | 'sensor' | 'ai';
}
