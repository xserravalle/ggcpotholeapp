import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/render';
import { getReportsForOfficer, can } from '@/domain/permissions';
import { applyAction } from '@/domain/actions';
import { PotholeReport, Actor } from '@/domain/types';
import { OfficerAssignmentsView } from '@/components/workspaces/OfficerAssignmentsView';
import { PotholeDetailDrawer } from '@/components/potholes/PotholeDetailDrawer';
import { ReportsContext, ReportsContextType } from '@/context/ReportsContext';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }: any) => <div data-testid="leaflet-marker">{children}</div>,
  Popup: ({ children }: any) => <div data-testid="leaflet-popup">{children}</div>,
  Circle: () => null,
  Polyline: () => null,
  useMap: () => ({ on: vi.fn(), fitBounds: vi.fn(), flyTo: vi.fn() }),
  useMapEvent: () => null,
  useMapEvents: () => null,
}));

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
  },
}));

vi.mock('@/services/pdfGenerator', () => ({
  generatePotholePdf: vi.fn(),
}));

const mockOfficerActor: Actor = {
  id: 'off-mendez',
  name: 'Carlos Mendez',
  role: 'officer',
  email: 'carlos.mendez@gwinnettcounty.com',
  agencyId: 'GWINNETT_COUNTY',
};

const otherOfficerActor: Actor = {
  id: 'off-sterling',
  name: 'Marcus Sterling',
  role: 'officer',
  email: 'marcus.sterling@ggc.edu',
  agencyId: 'GGC',
};

const createMockReport = (overrides: Partial<PotholeReport> = {}): PotholeReport => ({
  id: 'pot-test-1',
  trackingCode: 'GAP-2026-TEST001',
  title: 'Hazard on Sugarloaf Pkwy',
  roadName: 'Sugarloaf Pkwy',
  address: '1500 Sugarloaf Pkwy',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  authorityId: 'GWINNETT_COUNTY',
  authorityName: 'Gwinnett County DOT',
  latitude: 33.95,
  longitude: -84.02,
  severity: 'severe',
  status: 'assigned',
  priority: 'high',
  priorityScore: 75,
  verificationsCount: 2,
  userConfirmed: true,
  reportedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  lastVerifiedAt: new Date().toISOString(),
  timeline: [],
  estimatedDepthInches: 4,
  estimatedWidthInches: 18,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
  description: 'Deep road hazard requiring immediate patching',
  assignedAgencyId: 'GWINNETT_COUNTY',
  assignedOfficerId: 'off-mendez',
  ...overrides,
});

describe('Crew Workspace & Field Operations (Task 8)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // --- 1. OFFICER SCOPING ---
  describe('1. Officer Scoping & Assignment Isolation', () => {
    it('scopes reports strictly to those assigned to the officer via getReportsForOfficer', () => {
      const reports: PotholeReport[] = [
        createMockReport({ id: 'r1', assignedOfficerId: 'off-mendez' }), // Match by ID
        createMockReport({ id: 'r2', assignedOfficerId: 'Carlos Mendez' }), // Match by Name
        createMockReport({ id: 'r3', assignedCrew: 'Carlos Mendez Field Team' }), // Match by Crew
        createMockReport({ id: 'r4', assignedOfficerId: 'off-sterling' }), // Other officer
        createMockReport({ id: 'r5', assignedOfficerId: undefined }), // Unassigned
      ];

      const scopedForMendez = getReportsForOfficer(reports, mockOfficerActor);
      expect(scopedForMendez.map((r) => r.id)).toEqual(['r1', 'r2', 'r3']);

      const scopedForSterling = getReportsForOfficer(reports, otherOfficerActor);
      expect(scopedForSterling.map((r) => r.id)).toEqual(['r4']);
    });

    it('works when actor is passed as a string officer id', () => {
      const reports: PotholeReport[] = [
        createMockReport({ id: 'r1', assignedOfficerId: 'off-mendez' }),
        createMockReport({ id: 'r2', assignedOfficerId: 'off-other' }),
      ];

      const scoped = getReportsForOfficer(reports, 'off-mendez');
      expect(scoped.length).toBe(1);
      expect(scoped[0].id).toBe('r1');
    });

    it('denies viewAssignments permission to non-officers or unassigned officers', () => {
      const report = createMockReport({ id: 'r1', assignedOfficerId: 'off-mendez' });

      expect(can('officer', 'viewAssignments', report, mockOfficerActor)).toBe(true);
      expect(can('officer', 'viewAssignments', report, otherOfficerActor)).toBe(false);
      expect(can('user', 'viewAssignments', report, { name: 'Citizen', role: 'user' })).toBe(false);
      expect(can('admin', 'viewAssignments', report, { name: 'Admin', role: 'admin' })).toBe(false);
    });
  });

  // --- 2. ACTIONS AVAILABLE IN EACH STATUS ---
  describe('2. Actions Available in Each Lifecycle Status', () => {
    it('allows "startWork" only on "assigned" status for the assigned officer', () => {
      const assigned = createMockReport({ status: 'assigned' });
      const inProgress = createMockReport({ status: 'in_progress' });
      const resolved = createMockReport({ status: 'resolved' });
      const verified = createMockReport({ status: 'verified' });

      // Assigned report
      expect(can('officer', 'startWork', assigned, mockOfficerActor)).toBe(true);
      expect(can('officer', 'startWork', assigned, otherOfficerActor)).toBe(false);

      // Other statuses
      expect(can('officer', 'startWork', inProgress, mockOfficerActor)).toBe(false);
      expect(can('officer', 'startWork', resolved, mockOfficerActor)).toBe(false);
      expect(can('officer', 'startWork', verified, mockOfficerActor)).toBe(false);
    });

    it('allows "resolve" only on "in_progress" status for the assigned officer', () => {
      const inProgress = createMockReport({ status: 'in_progress' });
      const assigned = createMockReport({ status: 'assigned' });
      const resolved = createMockReport({ status: 'resolved' });
      const verified = createMockReport({ status: 'verified' });

      // In Progress report
      expect(can('officer', 'resolve', inProgress, mockOfficerActor)).toBe(true);
      expect(can('officer', 'resolve', inProgress, otherOfficerActor)).toBe(false);

      // Other statuses
      expect(can('officer', 'resolve', assigned, mockOfficerActor)).toBe(false);
      expect(can('officer', 'resolve', resolved, mockOfficerActor)).toBe(false);
      expect(can('officer', 'resolve', verified, mockOfficerActor)).toBe(false);
    });

    it('executes startWork transition and generates timeline entry and notification', () => {
      const assigned = createMockReport({ status: 'assigned' });
      const result = applyAction(assigned, 'startWork', mockOfficerActor, {
        message: 'Hot asphalt trailer stationed at site. Cones deployed.',
      });

      expect(result.report.status).toBe('in_progress');
      expect(result.timelineEntry.action).toBe('WORK_STARTED');
      expect(result.timelineEntry.message).toContain('Hot asphalt trailer');
      expect(result.notifications.length).toBeGreaterThan(0);
    });
  });

  // --- 3. REQUIRED RESOLVE NOTE ---
  describe('3. Required Resolve Note Validation', () => {
    it('throws domain error when resolve note is omitted or empty', () => {
      const inProgress = createMockReport({ status: 'in_progress' });

      expect(() => {
        applyAction(inProgress, 'resolve', mockOfficerActor, { message: '' });
      }).toThrow(/resolution note describing what was done is required/i);

      expect(() => {
        applyAction(inProgress, 'resolve', mockOfficerActor, { message: '    ' });
      }).toThrow(/resolution note describing what was done is required/i);

      expect(() => {
        applyAction(inProgress, 'resolve', mockOfficerActor, undefined);
      }).toThrow(/resolution note describing what was done is required/i);
    });

    it('successfully resolves when note is provided and stores afterImageUrl', () => {
      const inProgress = createMockReport({ status: 'in_progress' });
      const result = applyAction(inProgress, 'resolve', mockOfficerActor, {
        message: 'Excavated cavity, filled with hot-mix asphalt, leveled with plate compactor.',
        imageUrl: 'data:image/jpeg;base64,compacted_asphalt_photo',
      });

      expect(result.report.status).toBe('resolved');
      expect(result.report.resolvedAt).toBeTruthy();
      expect(result.report.afterImageUrl).toBe('data:image/jpeg;base64,compacted_asphalt_photo');
      expect(result.timelineEntry.action).toBe('WORK_RESOLVED');
      expect(result.timelineEntry.message).toBe(
        'Excavated cavity, filled with hot-mix asphalt, leveled with plate compactor.'
      );
    });
  });

  // --- 4. BLOCKED COMMENT ON SOMEONE ELSE'S REPORT ---
  describe('4. Comment Scoping: Blocked on Unassigned Reports', () => {
    it('denies comment permission to officers on reports not assigned to them', () => {
      const assignedToMendez = createMockReport({ assignedOfficerId: 'off-mendez' });
      const assignedToSterling = createMockReport({ assignedOfficerId: 'off-sterling' });
      const unassigned = createMockReport({ assignedOfficerId: undefined });

      // Mendez can comment on own assignment
      expect(can('officer', 'comment', assignedToMendez, mockOfficerActor)).toBe(true);

      // Mendez CANNOT comment on Sterling's or unassigned reports
      expect(can('officer', 'comment', assignedToSterling, mockOfficerActor)).toBe(false);
      expect(can('officer', 'comment', unassigned, mockOfficerActor)).toBe(false);
    });

    it('throws Permission Denied when officer attempts applyAction comment on unassigned report', () => {
      const otherReport = createMockReport({ assignedOfficerId: 'off-sterling' });

      expect(() => {
        applyAction(otherReport, 'comment', mockOfficerActor, {
          message: 'Trying to comment on another officer work order',
        });
      }).toThrow(/Permission Denied.*is not permitted to perform "comment"/i);
    });

    it('hides drawer details and blocks comments when officer opens an unassigned report in UI', () => {
      // Set logged in user as Carlos Mendez
      localStorage.setItem(
        'ggc-auth-user',
        JSON.stringify({
          id: 'off-mendez',
          officerId: 'off-mendez',
          displayName: 'Carlos Mendez',
          role: 'officer',
          agencyId: 'GWINNETT_COUNTY',
        })
      );

      const unassignedReport = createMockReport({
        id: 'unassigned-1',
        title: 'Highway Pothole in Duluth',
        assignedOfficerId: 'off-sterling',
      });

      render(
        <PotholeDetailDrawer
          pothole={unassignedReport}
          onClose={vi.fn()}
          onVerify={vi.fn()}
        />
      );

      // Should show Access Restricted screen
      expect(screen.getByText('Access Restricted')).toBeTruthy();
      expect(
        screen.getByText(/Work Order Restricted to Assigned Crew/i)
      ).toBeTruthy();

      // Comment input should not be available
      expect(screen.queryByPlaceholderText(/Post a civic update/i)).toBeNull();
    });
  });

  // --- 5. OFFICER ASSIGNMENTS VIEW UI WORKFLOW ---
  describe('5. OfficerAssignmentsView UI Workflow', () => {
    beforeEach(() => {
      localStorage.setItem(
        'ggc-auth-user',
        JSON.stringify({
          id: 'off-mendez',
          officerId: 'off-mendez',
          displayName: 'Carlos Mendez',
          role: 'officer',
          agencyId: 'GWINNETT_COUNTY',
        })
      );
    });

    it('renders greeting with officer name and agency badge, plus 4 stat cards', () => {
      const reports = [
        createMockReport({ id: 'r1', status: 'assigned' }),
        createMockReport({ id: 'r2', status: 'in_progress' }),
        createMockReport({ id: 'r3', status: 'resolved' }),
      ];

      render(<OfficerAssignmentsView potholes={reports} />);

      // Greeting & Agency
      expect(screen.getByText(/Welcome, Carlos Mendez/i)).toBeTruthy();
      expect(screen.getAllByText(/Gwinnett County DOT/i).length).toBeGreaterThan(0);

      // Stat Cards
      expect(screen.getByTestId('stat-card-assigned')).toBeTruthy();
      expect(screen.getByTestId('stat-card-pending-start')).toBeTruthy();
      expect(screen.getByTestId('stat-card-in-progress')).toBeTruthy();
      expect(screen.getByTestId('stat-card-resolved')).toBeTruthy();
    });

    it('sorts overdue reports first, then by priority (critical before high)', () => {
      const reports: PotholeReport[] = [
        createMockReport({
          id: 'card-normal-high',
          title: 'Normal High Priority',
          priority: 'high',
          status: 'assigned',
          slaDueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Not overdue
        }),
        createMockReport({
          id: 'card-overdue-medium',
          title: 'Overdue Medium Priority',
          priority: 'medium',
          status: 'assigned',
          slaDueAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Overdue!
        }),
        createMockReport({
          id: 'card-normal-critical',
          title: 'Normal Critical Priority',
          priority: 'critical',
          status: 'assigned',
          slaDueAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // Not overdue
        }),
      ];

      render(<OfficerAssignmentsView potholes={reports} />);

      const titles = screen.getAllByRole('heading', { level: 4 }).map((h) => h.textContent);
      // Overdue item must come first, followed by critical, then high
      expect(titles[0]).toBe('Overdue Medium Priority');
      expect(titles[1]).toBe('Normal Critical Priority');
      expect(titles[2]).toBe('Normal High Priority');
    });

    it('renders Google Maps directions link on cards and route stops', () => {
      const report = createMockReport({
        latitude: 33.9512,
        longitude: -84.0234,
      });

      render(<OfficerAssignmentsView potholes={[report]} />);

      const directionsLink = screen.getByTitle(/Open navigation directions in Google Maps/i);
      expect(directionsLink).toBeTruthy();
      expect(directionsLink.getAttribute('href')).toBe(
        'https://www.google.com/maps/dir/?api=1&destination=33.9512,-84.0234'
      );
    });

    it('opens Start Work modal on assigned report and submits action', async () => {
      const mockDispatch = vi.fn().mockResolvedValue({
        report: createMockReport({ status: 'in_progress' }),
        timelineEntry: { action: 'WORK_STARTED' },
        notifications: [],
      });

      const report = createMockReport({ status: 'assigned' });

      render(
        <ReportsContext.Provider
          value={
            {
              potholes: [report],
              isLoading: false,
              error: null,
              notifications: [],
              unreadCount: 0,
              refreshReports: vi.fn(),
              dispatchAction: mockDispatch,
            } as unknown as ReportsContextType
          }
        >
          <OfficerAssignmentsView potholes={[report]} />
        </ReportsContext.Provider>
      );

      // Click Start Work button on card
      const startWorkBtn = screen.getByRole('button', { name: /Start Work/i });
      fireEvent.click(startWorkBtn);

      // Start Work modal appears
      expect(screen.getByText('Start Field Work')).toBeTruthy();

      // Submit
      const confirmBtn = screen.getByRole('button', { name: /Confirm & Start Work/i });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          report.id,
          'startWork',
          expect.objectContaining({ role: 'officer' }),
          expect.objectContaining({ message: expect.any(String) })
        );
      });
    });

    it('requires note to resolve in UI modal and warns if empty', async () => {
      const mockDispatch = vi.fn().mockResolvedValue({
        report: createMockReport({ status: 'resolved' }),
        timelineEntry: { action: 'WORK_RESOLVED' },
        notifications: [],
      });

      const report = createMockReport({ status: 'in_progress' });

      render(
        <ReportsContext.Provider
          value={
            {
              potholes: [report],
              isLoading: false,
              error: null,
              notifications: [],
              unreadCount: 0,
              refreshReports: vi.fn(),
              dispatchAction: mockDispatch,
            } as unknown as ReportsContextType
          }
        >
          <OfficerAssignmentsView potholes={[report]} />
        </ReportsContext.Provider>
      );

      // Click Mark Resolved button
      const resolveBtn = screen.getByRole('button', { name: /Mark Resolved/i });
      fireEvent.click(resolveBtn);

      // Modal appears
      expect(screen.getByText('Mark Work Order Resolved')).toBeTruthy();

      // Submit without entering note
      const confirmBtn = screen.getByRole('button', { name: /Complete & Mark Resolved/i });
      fireEvent.click(confirmBtn);

      // Warning message displayed, dispatch not called
      expect(
        screen.getByText(/A resolution note describing what was done is required/i)
      ).toBeTruthy();
      expect(mockDispatch).not.toHaveBeenCalled();

      // Enter required note
      const textarea = screen.getByPlaceholderText(/Describe repair actions/i);
      fireEvent.change(textarea, { target: { value: 'Excavated and paved with asphalt.' } });

      // Submit with valid note
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(
          report.id,
          'resolve',
          expect.objectContaining({ role: 'officer' }),
          expect.objectContaining({ message: 'Excavated and paved with asphalt.' })
        );
      });
    });

    it('switches to Crew Route Map view and displays active stops sequence', () => {
      const reports = [
        createMockReport({ id: 's1', title: 'Stop 1 Hazard', status: 'assigned' }),
        createMockReport({ id: 's2', title: 'Stop 2 Hazard', status: 'in_progress' }),
        createMockReport({ id: 's3', title: 'Done Hazard', status: 'resolved' }),
      ];

      render(<OfficerAssignmentsView potholes={reports} />);

      // Switch to route tab
      const routeTabBtn = screen.getByRole('button', { name: /Crew Route Map/i });
      fireEvent.click(routeTabBtn);

      // Shows route sequence header
      expect(screen.getByText('Crew Repair Route Sequence')).toBeTruthy();
      expect(screen.getByText('2 Active Waypoints')).toBeTruthy();

      // Leaflet map rendered
      expect(screen.getByTestId('leaflet-map')).toBeTruthy();
    });
  });
});
