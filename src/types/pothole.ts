import { ReportStatus } from '../domain/status';
import {
  PotholeReport as DomainPotholeReport,
  TimelineEntry,
  CitizenFeedback,
  ReportPriority,
  RejectedReason,
  SeverityLevel,
  HazardType,
  Jurisdiction,
  SensorEvidence,
} from '../domain/types';

export type {
  ReportStatus,
  TimelineEntry,
  CitizenFeedback,
  ReportPriority,
  RejectedReason,
  SeverityLevel,
  HazardType,
  Jurisdiction,
  SensorEvidence,
};

export type PotholeStatus = ReportStatus;
export type PotholeReport = DomainPotholeReport;

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
