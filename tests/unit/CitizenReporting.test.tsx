import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/render';
import { PotholeReportModal } from '@/components/potholes/PotholeReportModal';
import { DocketSuccessModal } from '@/components/potholes/DocketSuccessModal';
import { UnifiedDashboard } from '@/components/dashboard/UnifiedDashboard';
import { 
  CLUSTER_DISTANCE_MILES, 
  CLUSTER_DISTANCE_FEET, 
  isWithinClusterDistance, 
  milesBetween 
} from '@/services/distanceCalculator';
import { isOpenStatus } from '@/domain/status';
import { applyAction } from '@/domain/actions';
import { migrateReport } from '@/services/storageService';
import { PotholeReport, Actor } from '@/domain/types';
import { PARKING_LOTS } from '@/data/parkingLotsData';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Circle: () => null,
  useMap: () => ({
    setView: vi.fn(),
    invalidateSize: vi.fn(),
    on: vi.fn(),
  }),
  useMapEvents: () => null,
  useMapEvent: () => null,
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

vi.mock('@/services/reverseGeocoding', () => ({
  reverseGeocode: vi.fn().mockResolvedValue({
    address: '1000 University Center Ln, Lawrenceville, GA',
    road: 'University Center Ln',
    city: 'Lawrenceville',
  }),
}));

const baseMockReport: PotholeReport = {
  id: 'rep-nearby-01',
  trackingCode: 'GAP-2026-NEARBY1',
  title: 'Pothole on Collins Hill Rd',
  address: '1000 University Center Ln, Lawrenceville, GA',
  roadName: 'Collins Hill Rd',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  authorityId: 'GWINNETT_COUNTY',
  authorityName: 'Gwinnett County DOT',
  latitude: 33.9798,
  longitude: -84.0017,
  severity: 'moderate',
  status: 'reported',
  priority: 'medium',
  priorityScore: 40,
  timeline: [],
  verificationsCount: 2,
  userConfirmed: true,
  reportedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(), // 2 hours ago
  lastVerifiedAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
  description: 'Moderate cavity in right lane',
  reporterName: 'Jordan Commuter',
  reporterEmail: 'jordan@example.com',
  estimatedDepthInches: 3,
  estimatedWidthInches: 18,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
};

describe('Task 4: Citizen Reporting Features', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Duplicate Radius Boundary & isOpenStatus Rules', () => {
    const center = { lat: 33.9798, lng: -84.0017 };

    it('exports cluster distance matching approximately 115-116 ft', () => {
      expect(CLUSTER_DISTANCE_MILES).toBe(0.022);
      expect(CLUSTER_DISTANCE_FEET).toBeCloseTo(116.16, 1);
    });

    it('identifies coordinates within cluster distance boundary', () => {
      // 50 feet away (~0.00947 miles)
      const nearbyPoint = { lat: 33.9799, lng: -84.0017 };
      const dist = milesBetween(center, nearbyPoint);
      expect(dist).toBeLessThanOrEqual(CLUSTER_DISTANCE_MILES);
      expect(isWithinClusterDistance(center, nearbyPoint)).toBe(true);
    });

    it('identifies coordinates strictly outside cluster distance boundary', () => {
      // ~0.05 miles away (~264 feet)
      const distantPoint = { lat: 33.9806, lng: -84.0017 };
      const dist = milesBetween(center, distantPoint);
      expect(dist).toBeGreaterThan(CLUSTER_DISTANCE_MILES);
      expect(isWithinClusterDistance(center, distantPoint)).toBe(false);
    });

    it('correctly discriminates active open statuses vs resolved/closed/rejected', () => {
      expect(isOpenStatus('reported')).toBe(true);
      expect(isOpenStatus('verified')).toBe(true);
      expect(isOpenStatus('assigned')).toBe(true);
      expect(isOpenStatus('in_progress')).toBe(true);

      expect(isOpenStatus('resolved')).toBe(false);
      expect(isOpenStatus('closed')).toBe(false);
      expect(isOpenStatus('rejected')).toBe(false);
    });
  });

  describe('2. Duplicate Check in PotholeReportModal', () => {
    it('shows "Already reported nearby" alert when open reports exist within cluster radius', () => {
      render(
        <PotholeReportModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmitReport={vi.fn()}
          initialCoords={{ lat: 33.9798, lng: -84.0017 }}
          existingReports={[baseMockReport]}
        />
      );

      expect(screen.getByText(/Already reported nearby/i)).toBeInTheDocument();
      expect(screen.getByText('Pothole on Collins Hill Rd')).toBeInTheDocument();
      expect(screen.getByText(/2 confirmations/i)).toBeInTheDocument();
      expect(screen.getByText('Confirm this one instead')).toBeInTheDocument();
    });

    it('does not show duplicate warning if reports nearby are resolved or closed', () => {
      const resolvedReport: PotholeReport = {
        ...baseMockReport,
        id: 'rep-resolved-01',
        status: 'resolved',
      };

      render(
        <PotholeReportModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmitReport={vi.fn()}
          initialCoords={{ lat: 33.9798, lng: -84.0017 }}
          existingReports={[resolvedReport]}
        />
      );

      expect(screen.queryByText(/Already reported nearby/i)).not.toBeInTheDocument();
      expect(screen.queryByText('Confirm this one instead')).not.toBeInTheDocument();
    });

    it('does not show duplicate warning if reports are outside cluster distance', () => {
      const farReport: PotholeReport = {
        ...baseMockReport,
        id: 'rep-far-01',
        latitude: 33.9900, // ~0.7 miles away
        longitude: -84.0100,
      };

      render(
        <PotholeReportModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmitReport={vi.fn()}
          initialCoords={{ lat: 33.9798, lng: -84.0017 }}
          existingReports={[farReport]}
        />
      );

      expect(screen.queryByText(/Already reported nearby/i)).not.toBeInTheDocument();
    });

    it('clicking "Confirm this one instead" invokes confirmation callback and closes modal', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined);
      const onClose = vi.fn();

      render(
        <PotholeReportModal
          isOpen={true}
          onClose={onClose}
          onSubmitReport={vi.fn()}
          initialCoords={{ lat: 33.9798, lng: -84.0017 }}
          existingReports={[baseMockReport]}
          onConfirmExistingReport={onConfirm}
        />
      );

      const confirmBtn = screen.getByText('Confirm this one instead');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(onConfirm).toHaveBeenCalledWith(
          baseMockReport.id,
          expect.stringContaining('duplicate check')
        );
        expect(onClose).toHaveBeenCalled();
      });
    });

    it('still allows user to submit a brand new report when duplicates exist', async () => {
      const onSubmit = vi.fn();

      render(
        <PotholeReportModal
          isOpen={true}
          onClose={vi.fn()}
          onSubmitReport={onSubmit}
          initialCoords={{ lat: 33.9798, lng: -84.0017 }}
          existingReports={[baseMockReport]}
        />
      );

      // Verify submit button is available
      const submitBtn = screen.getByRole('button', { name: /Submit Road Report/i });
      expect(submitBtn).toBeInTheDocument();

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalled();
      });
    });
  });

  describe('3. Submission Success Screen (DocketSuccessModal)', () => {
    it('displays big tracking code, copy button, routed agency, and target response time', async () => {
      // Mock clipboard writeText
      const writeTextMock = vi.fn().mockResolvedValue(undefined);
      Object.assign(navigator, {
        clipboard: {
          writeText: writeTextMock,
        },
      });

      render(
        <DocketSuccessModal
          isOpen={true}
          onClose={vi.fn()}
          report={baseMockReport}
        />
      );

      // 1. Tracking code big display
      const codeElement = screen.getByText('GAP-2026-NEARBY1');
      expect(codeElement).toBeInTheDocument();
      expect(codeElement.className).toContain('text-2xl');

      // 2. Routed agency and response time
      expect(screen.getByText('Gwinnett County DOT usually responds within 5 days')).toBeInTheDocument();

      // 3. Copy button
      const copyBtn = screen.getByTitle(/Copy tracking code/i);
      expect(copyBtn).toBeInTheDocument();
      fireEvent.click(copyBtn);

      await waitFor(() => {
        expect(writeTextMock).toHaveBeenCalledWith('GAP-2026-NEARBY1');
        expect(screen.getByText('Copied!')).toBeInTheDocument();
      });
    });

    it('displays campus turnaround time (2 days) for GGC routed hazards', () => {
      const ggcReport: PotholeReport = {
        ...baseMockReport,
        id: 'rep-ggc-01',
        trackingCode: 'GAP-2026-GGC001',
        authorityId: 'GGC',
        authorityName: 'Georgia Gwinnett College (GGC Facilities)',
        jurisdiction: 'Georgia Gwinnett College (GGC Facilities)',
      };

      render(
        <DocketSuccessModal
          isOpen={true}
          onClose={vi.fn()}
          report={ggcReport}
        />
      );

      expect(
        screen.getByText('Georgia Gwinnett College (GGC Facilities) usually responds within 2 days')
      ).toBeInTheDocument();
    });
  });

  describe('4. Track by Code on Citizen Home (UnifiedDashboard)', () => {
    it('finds report by exact tracking code and opens its detail drawer', () => {
      const onSelect = vi.fn();
      render(
        <UnifiedDashboard
          parkingLots={PARKING_LOTS}
          simulationParams={{
            dayOfWeek: 'Monday',
            hourOfDay: 12,
            minuteOfDay: 0,
            isWeekendRush: false,
            isHolidaySurge: false,
            isGgcClassChange: false,
            isRainWeather: false,
          }}
          onChangeSimulationParams={vi.fn()}
          onSelectLot={vi.fn()}
          potholes={[baseMockReport]}
          onSelectPothole={onSelect}
        />
      );

      const input = screen.getByPlaceholderText('GAP-2026-XXXXXXXX');
      fireEvent.change(input, { target: { value: 'GAP-2026-NEARBY1' } });

      const trackBtn = screen.getByRole('button', { name: /Track/i });
      fireEvent.click(trackBtn);

      expect(onSelect).toHaveBeenCalledWith(baseMockReport);
    });

    it('matches tracking codes case-insensitively and with trimmed whitespace', () => {
      const onSelect = vi.fn();
      render(
        <UnifiedDashboard
          parkingLots={PARKING_LOTS}
          simulationParams={{
            dayOfWeek: 'Monday',
            hourOfDay: 12,
            minuteOfDay: 0,
            isWeekendRush: false,
            isHolidaySurge: false,
            isGgcClassChange: false,
            isRainWeather: false,
          }}
          onChangeSimulationParams={vi.fn()}
          onSelectLot={vi.fn()}
          potholes={[baseMockReport]}
          onSelectPothole={onSelect}
        />
      );

      const input = screen.getByPlaceholderText('GAP-2026-XXXXXXXX');
      fireEvent.change(input, { target: { value: '  gap-2026-nearby1  ' } });

      const trackBtn = screen.getByRole('button', { name: /Track/i });
      fireEvent.click(trackBtn);

      expect(onSelect).toHaveBeenCalledWith(baseMockReport);
    });

    it('displays error message when tracking code is not found', () => {
      const onSelect = vi.fn();
      render(
        <UnifiedDashboard
          parkingLots={PARKING_LOTS}
          simulationParams={{
            dayOfWeek: 'Monday',
            hourOfDay: 12,
            minuteOfDay: 0,
            isWeekendRush: false,
            isHolidaySurge: false,
            isGgcClassChange: false,
            isRainWeather: false,
          }}
          onChangeSimulationParams={vi.fn()}
          onSelectLot={vi.fn()}
          potholes={[baseMockReport]}
          onSelectPothole={onSelect}
        />
      );

      const input = screen.getByPlaceholderText('GAP-2026-XXXXXXXX');
      fireEvent.change(input, { target: { value: 'GAP-2026-NOTFOUND' } });

      const trackBtn = screen.getByRole('button', { name: /Track/i });
      fireEvent.click(trackBtn);

      expect(onSelect).not.toHaveBeenCalled();
      expect(screen.getByText(/No hazard report found for tracking code "GAP-2026-NOTFOUND"/i)).toBeInTheDocument();
    });
  });

  describe('5. Sensor Auto-Reports & System Role Verification', () => {
    it('initializes migrated sensor reports with status reported, actorRole system, and sensor note', () => {
      const rawSensorReport = {
        id: 'GW-POT-sensor-test',
        trackingCode: 'GAP-2026-SENS01',
        title: 'Sensor Spike on Collins Hill',
        roadName: 'Collins Hill Rd',
        latitude: 33.98,
        longitude: -84.00,
        severity: 'severe',
        source: 'sensor',
        sensorDetected: true,
      };

      const migrated = migrateReport(rawSensorReport);
      expect(migrated.status).toBe('reported');
      expect(migrated.timeline).toHaveLength(1);
      expect(migrated.timeline[0].actorRole).toBe('system');
      expect(migrated.timeline[0].actorName).toBe('Vehicle Sensor System');
      expect(migrated.timeline[0].message).toContain('accelerometer sensor');
    });

    it('supports custom timeline note when confirming a report', () => {
      const actor: Actor = {
        name: 'Taylor Citizen',
        role: 'user',
      };
      const customMsg = 'Confirmed via duplicate check (+1) instead of filing a new report.';

      const result = applyAction(baseMockReport, 'confirm', actor, {
        message: customMsg,
      });

      expect(result.report.verificationsCount).toBe((baseMockReport.verificationsCount || 0) + 1);
      expect(result.timelineEntry.action).toBe('CONFIRMED');
      expect(result.timelineEntry.message).toBe(customMsg);
    });
  });
});
