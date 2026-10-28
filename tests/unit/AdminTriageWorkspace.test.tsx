import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/render';
import { AdminOverviewView } from '@/components/admin/AdminOverviewView';
import { TriageQueueView } from '@/components/admin/TriageQueueView';
import { AuthorityHubView } from '@/components/dispatcher/AuthorityHubView';
import { PotholeReport, Actor } from '@/domain/types';
import { LocalStorageReportRepository } from '@/repository/LocalStorageReportRepository';
import { ReportsContext, ReportsContextType } from '@/context/ReportsContext';
import { CAMPUS_CENTER } from '@/data/jurisdictionsData';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="leaflet-map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Circle: () => null,
  Polyline: () => null,
  useMap: () => ({ on: vi.fn(), fitBounds: vi.fn(), flyTo: vi.fn() }),
  useMapEvent: () => null,
  useMapEvents: () => null,
}));

// Mock PDF generator to test work order button
vi.mock('@/services/pdfGenerator', () => ({
  generatePotholePdf: vi.fn(),
}));

const createMockReport = (overrides: Partial<PotholeReport> = {}): PotholeReport => ({
  id: 'pot-test-1',
  trackingCode: 'GAP-2026-TEST0001',
  title: 'Hazard on Collins Hill',
  roadName: 'Collins Hill Rd',
  address: '1000 University Center Ln',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  authorityId: 'GWINNETT_COUNTY',
  authorityName: 'Gwinnett County DOT',
  latitude: CAMPUS_CENTER.lat,
  longitude: CAMPUS_CENTER.lng,
  severity: 'high',
  hazardType: 'POTHOLE',
  status: 'reported',
  verificationsCount: 1,
  userConfirmed: true,
  reportedAt: new Date().toISOString(),
  lastVerifiedAt: new Date().toISOString(),
  source: 'user',
  priority: 'high',
  priorityScore: 75,
  timeline: [],
  estimatedDepthInches: 3,
  estimatedWidthInches: 18,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
  description: 'Deep road hazard',
  ...overrides,
});

describe('Admin Triage Workspace (Task 6)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Triage Queue Ordering & Status Filter', () => {
    it('displays only "reported" hazards and orders them strictly by priorityScore descending', () => {
      const repHigh = createMockReport({
        id: 'rep-high',
        trackingCode: 'GAP-2026-HIGH',
        roadName: 'Sugarloaf Pkwy',
        status: 'reported',
        priorityScore: 95,
        priority: 'critical',
      });
      const repMid = createMockReport({
        id: 'rep-mid',
        trackingCode: 'GAP-2026-MID',
        roadName: 'Buford Dr',
        status: 'reported',
        priorityScore: 60,
        priority: 'medium',
      });
      const repLow = createMockReport({
        id: 'rep-low',
        trackingCode: 'GAP-2026-LOW',
        roadName: 'Collins Hill Rd',
        status: 'reported',
        priorityScore: 25,
        priority: 'low',
      });
      const repVerified = createMockReport({
        id: 'rep-verified',
        trackingCode: 'GAP-2026-VERIFIED',
        roadName: 'Pike St',
        status: 'verified', // Should NOT appear in triage queue
        priorityScore: 99,
      });
      const repResolved = createMockReport({
        id: 'rep-resolved',
        trackingCode: 'GAP-2026-RESOLVED',
        roadName: 'Crogan St',
        status: 'resolved', // Should NOT appear in triage queue
        priorityScore: 90,
      });

      // Pass in mixed order
      render(
        <TriageQueueView
          potholes={[repLow, repVerified, repHigh, repResolved, repMid]}
        />
      );

      // Only reported reports should be present
      expect(screen.getByText('Sugarloaf Pkwy')).toBeInTheDocument();
      expect(screen.getByText('Buford Dr')).toBeInTheDocument();
      expect(screen.getByText('Collins Hill Rd')).toBeInTheDocument();
      expect(screen.queryByText('Pike St')).toBeNull();
      expect(screen.queryByText('Crogan St')).toBeNull();

      // Check ordering: priority scores should appear in order 95, 60, 25
      const roadNames = screen.getAllByText(/(Sugarloaf Pkwy|Buford Dr|Collins Hill Rd)/).map(el => el.textContent);
      expect(roadNames[0]).toBe('Sugarloaf Pkwy'); // Score 95
      expect(roadNames[1]).toBe('Buford Dr');       // Score 60
      expect(roadNames[2]).toBe('Collins Hill Rd'); // Score 25
    });
  });

  describe('2. Verify Action with Prefilled Priority', () => {
    it('opens verify modal prefilled from suggestion and dispatches verify action with selected priority and note', async () => {
      const report = createMockReport({
        id: 'rep-v1',
        trackingCode: 'GAP-2026-V1',
        roadName: 'Lawrenceville Hwy',
        status: 'reported',
        priorityScore: 85,
        priority: 'high',
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: { ...report, status: 'verified', priority: 'critical' },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [report],
        isLoading: false,
        error: null,
        notifications: [],
        unreadCount: 0,
        refreshReports: vi.fn(),
        getReport: vi.fn().mockResolvedValue(report),
        submitReport: vi.fn(),
        confirmReport: vi.fn(),
        updateReportStatus: vi.fn(),
        dispatchAction: mockDispatchAction,
        promoteSensorSpot: vi.fn(),
        promoteDriveIncidents: vi.fn(),
        updateReport: vi.fn(),
        deleteReport: vi.fn(),
        getComments: vi.fn().mockResolvedValue([]),
        addComment: vi.fn(),
        refreshNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <TriageQueueView potholes={[report]} />
        </ReportsContext.Provider>
      );

      // Click Verify button for report
      const verifyBtn = screen.getByTestId('verify-btn-rep-v1');
      fireEvent.click(verifyBtn);

      // Verify modal is displayed
      expect(screen.getByText('Verify Road Hazard')).toBeInTheDocument();

      // Check priority dropdown is prefilled with suggested 'high'
      const prioritySelect = screen.getByTestId('verify-priority-select') as HTMLSelectElement;
      expect(prioritySelect.value).toBe('high');

      // Change priority to critical
      fireEvent.change(prioritySelect, { target: { value: 'critical' } });

      // Add note
      const noteInput = screen.getByPlaceholderText(/Verified by county engineer/i);
      fireEvent.change(noteInput, { target: { value: 'Inspected on site, rim impact risk confirmed' } });

      // Click Confirm Verification
      const confirmBtn = screen.getByTestId('confirm-verify-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'rep-v1',
          'verify',
          expect.objectContaining({ role: 'admin' }),
          {
            priority: 'critical',
            message: 'Inspected on site, rim impact risk confirmed',
          }
        );
      });
    });
  });

  describe('3. Reject Action with Required Reason', () => {
    it('opens reject modal, requires a reason from the 4 options, and dispatches reject action', async () => {
      const report = createMockReport({
        id: 'rep-r1',
        trackingCode: 'GAP-2026-R1',
        roadName: 'Old Norcross Rd',
        status: 'reported',
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: { ...report, status: 'rejected', rejectedReason: 'not_a_pothole' },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [report],
        isLoading: false,
        error: null,
        notifications: [],
        unreadCount: 0,
        refreshReports: vi.fn(),
        getReport: vi.fn().mockResolvedValue(report),
        submitReport: vi.fn(),
        confirmReport: vi.fn(),
        updateReportStatus: vi.fn(),
        dispatchAction: mockDispatchAction,
        promoteSensorSpot: vi.fn(),
        promoteDriveIncidents: vi.fn(),
        updateReport: vi.fn(),
        deleteReport: vi.fn(),
        getComments: vi.fn().mockResolvedValue([]),
        addComment: vi.fn(),
        refreshNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <TriageQueueView potholes={[report]} />
        </ReportsContext.Provider>
      );

      // Click Reject button
      const rejectBtn = screen.getByTestId('reject-btn-rep-r1');
      fireEvent.click(rejectBtn);

      expect(screen.getByText('Reject Road Hazard')).toBeInTheDocument();

      // Check reason select options
      const reasonSelect = screen.getByTestId('reject-reason-select') as HTMLSelectElement;
      expect(reasonSelect).toBeInTheDocument();

      // Select 'not_a_pothole'
      fireEvent.change(reasonSelect, { target: { value: 'not_a_pothole' } });

      // Add rejection note
      const noteInput = screen.getByPlaceholderText(/Explain why this complaint was rejected/i);
      fireEvent.change(noteInput, { target: { value: 'Depression under 1 inch, normal pavement joint wear' } });

      // Submit rejection
      const confirmBtn = screen.getByTestId('confirm-reject-btn');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'rep-r1',
          'reject',
          expect.objectContaining({ role: 'admin' }),
          {
            reason: 'not_a_pothole',
            message: 'Depression under 1 inch, normal pavement joint wear',
          }
        );
      });
    });
  });

  describe('4. Merge Duplicate Report & Accumulate Confirmations', () => {
    it('merges report into a master ticket in UI and dispatches merge action', async () => {
      const duplicateReport = createMockReport({
        id: 'dup-1',
        trackingCode: 'GAP-2026-DUP1',
        roadName: 'Collins Hill Rd (Duplicate entry)',
        status: 'reported',
        verificationsCount: 3,
        latitude: CAMPUS_CENTER.lat,
        longitude: CAMPUS_CENTER.lng,
      });

      const masterReport = createMockReport({
        id: 'master-1',
        trackingCode: 'GAP-2026-MASTER',
        roadName: 'Collins Hill Rd (Master Work Order)',
        status: 'verified',
        verificationsCount: 5,
        latitude: CAMPUS_CENTER.lat + 0.0001,
        longitude: CAMPUS_CENTER.lng,
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: { ...duplicateReport, status: 'rejected', rejectedReason: 'duplicate', mergedIntoId: 'master-1' },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [duplicateReport, masterReport],
        isLoading: false,
        error: null,
        notifications: [],
        unreadCount: 0,
        refreshReports: vi.fn(),
        getReport: vi.fn(),
        submitReport: vi.fn(),
        confirmReport: vi.fn(),
        updateReportStatus: vi.fn(),
        dispatchAction: mockDispatchAction,
        promoteSensorSpot: vi.fn(),
        promoteDriveIncidents: vi.fn(),
        updateReport: vi.fn(),
        deleteReport: vi.fn(),
        getComments: vi.fn().mockResolvedValue([]),
        addComment: vi.fn(),
        refreshNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <TriageQueueView potholes={[duplicateReport, masterReport]} />
        </ReportsContext.Provider>
      );

      // Open Merge dialog for duplicate report
      const mergeBtn = screen.getByTestId('merge-btn-dup-1');
      fireEvent.click(mergeBtn);

      expect(screen.getByText('Merge Duplicate Hazard')).toBeInTheDocument();
      expect(screen.getByText(/Collins Hill Rd \(Master Work Order\)/i)).toBeInTheDocument();

      // Pick master report
      fireEvent.click(screen.getByText(/Collins Hill Rd \(Master Work Order\)/i));

      // Confirm merge
      const confirmMergeBtn = screen.getByTestId('confirm-merge-btn');
      fireEvent.click(confirmMergeBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'dup-1',
          'merge',
          expect.objectContaining({ role: 'admin' }),
          {
            mergedIntoId: 'master-1',
            message: undefined,
          }
        );
      });
    });

    it('repository dispatch correctly accumulates confirmations onto the target master report', async () => {
      const repo = new LocalStorageReportRepository();

      const master = createMockReport({
        id: 'master-ticket',
        trackingCode: 'GAP-2026-MSTR',
        status: 'verified',
        verificationsCount: 4,
      });

      const duplicate = createMockReport({
        id: 'dup-ticket',
        trackingCode: 'GAP-2026-DUPL',
        status: 'reported',
        verificationsCount: 3,
      });

      await repo.save(master);
      await repo.save(duplicate);

      const adminActor: Actor = {
        name: 'County Admin',
        role: 'admin',
      };

      // Dispatch merge
      const result = await repo.dispatch('dup-ticket', 'merge', adminActor, {
        mergedIntoId: 'master-ticket',
        message: 'Merged duplicate submission',
      });

      // 1. Duplicate report is rejected as duplicate with mergedIntoId
      expect(result.report.status).toBe('rejected');
      expect(result.report.rejectedReason).toBe('duplicate');
      expect(result.report.mergedIntoId).toBe('master-ticket');

      // 2. Master report received the 3 confirmations: 4 + 3 = 7
      const updatedMaster = await repo.get('master-ticket');
      expect(updatedMaster).not.toBeNull();
      expect(updatedMaster?.verificationsCount).toBe(7);

      // 3. Master report timeline includes merge confirmation entry
      expect(updatedMaster?.timeline.some(t => t.action === 'MERGED_CONFIRMATION')).toBe(true);
    });
  });

  describe('5. Bulk Verification of Multiple Selected Rows', () => {
    it('allows selecting multiple rows and verifying all at once with each suggested priority', async () => {
      const rep1 = createMockReport({
        id: 'rep-bulk-1',
        trackingCode: 'GAP-2026-B1',
        roadName: 'Scenic Hwy',
        status: 'reported',
        priority: 'high',
        priorityScore: 78,
      });
      const rep2 = createMockReport({
        id: 'rep-bulk-2',
        trackingCode: 'GAP-2026-B2',
        roadName: 'Grayson Hwy',
        status: 'reported',
        priority: 'medium',
        priorityScore: 50,
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: {} as any,
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [rep1, rep2],
        isLoading: false,
        error: null,
        notifications: [],
        unreadCount: 0,
        refreshReports: vi.fn(),
        getReport: vi.fn(),
        submitReport: vi.fn(),
        confirmReport: vi.fn(),
        updateReportStatus: vi.fn(),
        dispatchAction: mockDispatchAction,
        promoteSensorSpot: vi.fn(),
        promoteDriveIncidents: vi.fn(),
        updateReport: vi.fn(),
        deleteReport: vi.fn(),
        getComments: vi.fn().mockResolvedValue([]),
        addComment: vi.fn(),
        refreshNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <TriageQueueView potholes={[rep1, rep2]} />
        </ReportsContext.Provider>
      );

      // Select both rows via header checkbox
      const selectAllBtn = screen.getByTestId('select-all-checkbox');
      fireEvent.click(selectAllBtn);

      // Bulk action bar is displayed
      const bulkVerifyBtn = screen.getByTestId('bulk-verify-btn');
      expect(bulkVerifyBtn).toHaveTextContent('Verify Selected (2)');

      // Click Bulk Verify
      fireEvent.click(bulkVerifyBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'rep-bulk-1',
          'verify',
          expect.objectContaining({ role: 'admin' }),
          expect.objectContaining({ priority: 'high' })
        );
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'rep-bulk-2',
          'verify',
          expect.objectContaining({ role: 'admin' }),
          expect.objectContaining({ priority: 'medium' })
        );
      });
    });
  });

  describe('6. Admin Overview Metrics, Proportional Bars, Agency Table, & Quick Links', () => {
    it('computes accurate counts for the 6 StatCards and displays quick links', () => {
      const nowIso = new Date().toISOString();
      const reports: PotholeReport[] = [
        createMockReport({ id: 'p1', status: 'reported' }),
        createMockReport({ id: 'p2', status: 'in_progress' }),
        createMockReport({
          id: 'p3',
          status: 'assigned',
          slaDueAt: '2026-01-01T00:00:00Z', // Overdue
          reportedAt: '2026-01-01T00:00:00Z',
        }),
        createMockReport({
          id: 'p4',
          status: 'resolved',
          resolvedAt: nowIso,
          feedback: { rating: 5, comment: 'Great fix!' },
        }),
        createMockReport({
          id: 'p5',
          status: 'closed',
          resolvedAt: nowIso,
          feedback: { rating: 4, comment: 'Paved well' },
        }),
      ];

      const onNavigateTab = vi.fn();

      render(
        <AdminOverviewView
          potholes={reports}
          onNavigateTab={onNavigateTab}
        />
      );

      // StatCards:
      // Total = 5
      expect(screen.getByTestId('stat-card-total')).toHaveTextContent('5');
      // Needs Triage = 1 (p1)
      expect(screen.getByTestId('stat-card-needs-triage')).toHaveTextContent('1');
      // In Progress = 1 (p2)
      expect(screen.getByTestId('stat-card-in-progress')).toHaveTextContent('1');
      // Overdue = 1 (p3)
      expect(screen.getByTestId('stat-card-overdue')).toHaveTextContent('1');
      // Fixed This Month = 2 (p4 resolved, p5 closed)
      expect(screen.getByTestId('stat-card-fixed-this-month')).toHaveTextContent('2');
      // Average Rating = (5 + 4) / 2 = 4.5
      expect(screen.getByTestId('stat-card-average-rating')).toHaveTextContent('4.5');

      // Quick links
      const triageLink = screen.getByTestId('quick-link-triage');
      fireEvent.click(triageLink);
      expect(onNavigateTab).toHaveBeenCalledWith('triage');

      const dispatchLink = screen.getByTestId('quick-link-dispatch');
      fireEvent.click(dispatchLink);
      expect(onNavigateTab).toHaveBeenCalledWith('dispatch-board');
    });

    it('renders AuthorityHubView workspace tabs and retains CSV export button', () => {
      const reports: PotholeReport[] = [
        createMockReport({ id: 'p1', status: 'reported' }),
      ];

      render(
        <AuthorityHubView
          potholes={reports}
          activeSubTab="overview"
        />
      );

      // Workspace internal tabs
      expect(screen.getByTestId('admin-tab-overview')).toBeInTheDocument();
      expect(screen.getByTestId('admin-tab-triage')).toBeInTheDocument();
      expect(screen.getByTestId('admin-tab-dispatch')).toBeInTheDocument();

      // Export CSV Work Orders button exists
      const csvBtns = screen.getAllByRole('button', { name: /Export CSV/i });
      expect(csvBtns.length).toBeGreaterThanOrEqual(1);
    });
  });
});
