import { SeverityLevel } from './pothole';

export interface DriveBreadcrumb {
  lat: number;
  lng: number;
  timestamp: number;
  speedMph?: number | null;
  accuracy?: number;
}

export interface DriveShockIncident {
  id: string;
  timestamp: number;
  elapsedSeconds: number;
  latitude: number;
  longitude: number;
  peakG: number;
  severity: SeverityLevel;
  roadName: string;
  address: string;
  city: string;
  imageUrl?: string;
  promotedToReportId?: string;
}

export interface DriveSession {
  id: string;
  trackingCode: string;
  startTime: number;
  endTime?: number;
  durationSeconds: number;
  totalDistanceMiles: number;
  averageSpeedMph?: number;
  maxSpeedMph?: number;
  peakG: number;
  path: DriveBreadcrumb[];
  incidents: DriveShockIncident[];
  status: 'active' | 'completed';
}
