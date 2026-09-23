import { SeverityLevel } from './pothole';

export interface SpotHitRecord {
  id: string;
  timestamp: string;
  gForce: number;
}

export interface TrackedHazardSpot {
  id: string;
  latitude: number;
  longitude: number;
  roadName: string;
  city: string;
  hitCount: number; // e.g. 1, 2, 3
  maxGForce: number;
  severity: SeverityLevel;
  hits: SpotHitRecord[];
  promotedToReportId?: string; // Set once it reaches 3 hits
  createdAt: string;
  lastHitAt: string;
}

export interface QueuedImpact {
  id: string;
  timestamp: string;
  gForce: number;
  latitude: number;
  longitude: number;
  roadName?: string;
  city?: string;
  severity: SeverityLevel;
  status: 'pending' | 'confirmed' | 'discarded';
}
