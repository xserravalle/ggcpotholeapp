import { SeverityLevel } from './pothole';

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
