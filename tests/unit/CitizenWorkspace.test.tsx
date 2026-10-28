import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '../helpers/render';
import { UnifiedDashboard } from '@/components/dashboard/UnifiedDashboard';
import { MyReportsView } from '@/components/potholes/MyReportsView';
import { PotholeDetailDrawer } from '@/components/potholes/PotholeDetailDrawer';
import { Header } from '@/components/Header';
import { PotholeReport, NotificationMessage } from '@/domain/types';
import { canTransition } from '@/domain/status';
import { PARKING_LOTS } from '@/data/parkingLotsData';
import { CAMPUS_CENTER } from '@/data/jurisdictionsData';
import { ReportsContext, ReportsContextType } from '@/context/ReportsContext';

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

const createMockReport = (overrides: Partial<PotholeReport> = {}): PotholeReport => ({
  id: 'pot-test-1',
  trackingCode: 'GAP-2026-TEST0001',
  title: 'Pothole on Collins Hill',
  roadName: 'Collins Hill Rd',
  address: '1000 University Center Ln',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  authorityId: 'gwinnett-dot',
  authorityName: 'Gwinnett County DOT',
  authorityEmail: 'dot@gwinnettcounty.com',
  latitude: CAMPUS_CENTER.lat,
  longitude: CAMPUS_CENTER.lng,
  severity: 'high',
  hazardType: 'POTHOLE',
  status: 'reported',
  verificationsCount: 1,
  userConfirmed: true,
  reportedAt: new Date('2026-03-01T12:00:00Z').toISOString(),
  lastVerifiedAt: new Date('2026-03-01T12:00:00Z').toISOString(),
  source: 'user',
  priority: 'high',
  priorityScore: 85,
  timeline: [],
  ...overrides,
});

describe('Citizen Workspace (Task 5)', () => {
  describe('1. Citizen Home Stats Math & Nearby Hazards', () => {
    it('computes accurate counts for My Reports, Waiting for Review, Being Fixed, and Fixed', () => {
      const reports: PotholeReport[] = [
        createMockReport({ id: 'p1', status: 'reported', source: 'user' }),
        createMockReport({ id: 'p2', status: 'verified', source: 'sensor' }),
        createMockReport({ id: 'p3', status: 'assigned', source: 'user' }),
        createMockReport({ id: 'p4', status: 'in_progress', source: 'user', userConfirmed: true }),
        createMockReport({ id: 'p5', status: 'resolved', source: 'user' }),
        createMockReport({ id: 'p6', status: 'closed', source: 'user' }),
        // External report that should not be counted under myReports
        createMockReport({ id: 'p7', status: 'reported', source: 'system', userConfirmed: false }),
      ];

      render(
        <UnifiedDashboard
          potholes={reports}
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
        />
      );

      // Total My Reports = 6 (p1, p2, p3, p4, p5, p6)
      expect(screen.getByTestId('stat-card-my-reports')).toHaveTextContent('6');

      // Waiting for Review = 1 (p1 reported)
      expect(screen.getByTestId('stat-card-waiting-for-review')).toHaveTextContent('1');

      // Being Fixed = 3 (p2 verified, p3 assigned, p4 in_progress)
      expect(screen.getByTestId('stat-card-being-fixed')).toHaveTextContent('3');

      // Fixed = 2 (p5 resolved, p6 closed)
      expect(screen.getByTestId('stat-card-fixed')).toHaveTextContent('2');
    });

    it('renders "Report a Pothole" and "Track a Report" buttons', () => {
      const onOpenReportModal = vi.fn();
      render(
        <UnifiedDashboard
          potholes={[]}
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
          onOpenReportModal={onOpenReportModal}
        />
      );

      const reportBtns = screen.getAllByRole('button', { name: /Report a Pothole/i });
      expect(reportBtns.length).toBeGreaterThanOrEqual(1);
      fireEvent.click(reportBtns[0]);
      expect(onOpenReportModal).toHaveBeenCalledTimes(1);

      expect(screen.getByText('Track a Report')).toBeInTheDocument();
    });

    it('filters Open Hazards Near Me by 1.0 mile radius and open status', () => {
      const nearOpen = createMockReport({
        id: 'near-1',
        title: 'Immediate Campus Pothole',
        latitude: CAMPUS_CENTER.lat + 0.002, // ~0.14 miles
        longitude: CAMPUS_CENTER.lng,
        status: 'reported',
      });
      const farOpen = createMockReport({
        id: 'far-1',
        title: 'Distant County Pothole',
        latitude: 34.250, // > 15 miles away
        longitude: -84.300,
        status: 'reported',
      });
      const nearResolved = createMockReport({
        id: 'near-resolved',
        title: 'Repaired Campus Pothole',
        latitude: CAMPUS_CENTER.lat + 0.001,
        longitude: CAMPUS_CENTER.lng,
        status: 'resolved',
      });

      render(
        <UnifiedDashboard
          potholes={[nearOpen, farOpen, nearResolved]}
          parkingLots={PARKING_LOTS}
          userLocation={CAMPUS_CENTER}
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
        />
      );

      // Section header exists
      const nearbySection = screen.getByTestId('open-hazards-near-me');
      expect(within(nearbySection).getByText('Open Hazards Near Me')).toBeInTheDocument();

      // Only nearOpen should appear in the nearby list
      expect(within(nearbySection).getByText('Immediate Campus Pothole')).toBeInTheDocument();
      expect(within(nearbySection).queryByText('Distant County Pothole')).toBeNull();
      expect(within(nearbySection).queryByText('Repaired Campus Pothole')).toBeNull();
    });
  });

  describe('2. My Reports View Filters & Sorting', () => {
    it('filters reports when status filter chips are clicked', () => {
      const r1 = createMockReport({ id: 'r1', title: 'Cavity on Lawrenceville Hwy', status: 'reported' });
      const r2 = createMockReport({ id: 'r2', title: 'Cavity on Buford Dr', status: 'verified' });
      const r3 = createMockReport({ id: 'r3', title: 'Cavity on Sugarloaf Pkwy', status: 'resolved' });

      render(
        <MyReportsView
          potholes={[r1, r2, r3]}
          onSelectPothole={vi.fn()}
          onOpenReportModal={vi.fn()}
          onNavigateToMap={vi.fn()}
        />
      );

      // Initially all are present
      expect(screen.getByText('Cavity on Lawrenceville Hwy')).toBeInTheDocument();
      expect(screen.getByText('Cavity on Buford Dr')).toBeInTheDocument();
      expect(screen.getByText('Cavity on Sugarloaf Pkwy')).toBeInTheDocument();

      // Click "Resolved" filter chip
      const resolvedChip = screen.getByTestId('filter-chip-resolved');
      fireEvent.click(resolvedChip);

      expect(screen.queryByText('Cavity on Lawrenceville Hwy')).toBeNull();
      expect(screen.queryByText('Cavity on Buford Dr')).toBeNull();
      expect(screen.getByText('Cavity on Sugarloaf Pkwy')).toBeInTheDocument();
    });

    it('sorts reports by most confirmed and overdue', () => {
      const nowIso = new Date().toISOString();
      const lowConfirmed = createMockReport({
        id: 'r1',
        title: 'Low Confirmed Hazard',
        verificationsCount: 1,
        reportedAt: nowIso,
      });
      const highConfirmed = createMockReport({
        id: 'r2',
        title: 'High Confirmed Hazard',
        verificationsCount: 25,
        reportedAt: nowIso,
      });
      const overdueReport = createMockReport({
        id: 'r3',
        title: 'Critical Overdue Hazard',
        verificationsCount: 2,
        status: 'assigned',
        slaDueAt: '2026-01-01T00:00:00Z', // Overdue
        reportedAt: '2026-01-01T00:00:00Z',
      });

      const { container } = render(
        <MyReportsView
          potholes={[lowConfirmed, highConfirmed, overdueReport]}
          onSelectPothole={vi.fn()}
          onOpenReportModal={vi.fn()}
          onNavigateToMap={vi.fn()}
        />
      );

      const sortSelect = container.querySelector('select');
      expect(sortSelect).toBeTruthy();

      // Sort by Most Confirmed
      fireEvent.change(sortSelect!, { target: { value: 'most_confirmed' } });
      const titlesAfterConfirmedSort = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(titlesAfterConfirmedSort[0]).toBe('High Confirmed Hazard');

      // Sort by Overdue
      fireEvent.change(sortSelect!, { target: { value: 'overdue' } });
      const titlesAfterOverdueSort = screen.getAllByRole('heading', { level: 4 }).map(h => h.textContent);
      expect(titlesAfterOverdueSort[0]).toBe('Critical Overdue Hazard');
    });
  });

  describe('3. Closing the Loop: Rating Fix transitions to Closed', () => {
    it('submits 5-star rating and comment, invoking dispatchAction with rateFix', async () => {
      const resolvedReport = createMockReport({
        id: 'resolved-1',
        trackingCode: 'GAP-2026-RES001',
        title: 'Completed Repair on Pike St',
        status: 'resolved',
        resolvedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: {
          ...resolvedReport,
          status: 'closed',
          feedback: { rating: 5, comment: 'Smooth asphalt surface' },
        },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [resolvedReport],
        isLoading: false,
        error: null,
        notifications: [],
        unreadCount: 0,
        refreshReports: vi.fn(),
        getReport: vi.fn().mockResolvedValue(resolvedReport),
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
          <PotholeDetailDrawer
            pothole={resolvedReport}
            onClose={vi.fn()}
            onVerify={vi.fn()}
          />
        </ReportsContext.Provider>
      );

      // Section is displayed
      expect(screen.getByText(/Rate this Fix/i)).toBeInTheDocument();

      // Click 5 star button
      const fiveStarBtn = screen.getByLabelText('5 star');
      fireEvent.click(fiveStarBtn);

      // Type comment
      const commentInput = screen.getByPlaceholderText(/Was the patch leveled smoothly/i);
      fireEvent.change(commentInput, { target: { value: 'Smooth asphalt surface' } });

      // Click Submit Rating & Close
      const submitBtn = screen.getByRole('button', { name: /Submit Rating & Close/i });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          resolvedReport.id,
          'rateFix',
          expect.objectContaining({ role: expect.any(String) }),
          { rating: 5, comment: 'Smooth asphalt surface' }
        );
      });
    });
  });

  describe('4. Closing the Loop: 14-day Reopen Rule', () => {
    it('allows reopening within 14 days and requires a reason', async () => {
      const now = Date.now();
      const within14Days = new Date(now - 4 * 86400000).toISOString();
      expect(canTransition('resolved', 'verified', { resolvedAt: within14Days, now })).toBe(true);
      expect(canTransition('closed', 'verified', { resolvedAt: within14Days, now })).toBe(true);

      const recentResolvedReport = createMockReport({
        id: 'recent-res',
        status: 'resolved',
        resolvedAt: within14Days,
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: { ...recentResolvedReport, status: 'verified', reopenCount: 1 },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [recentResolvedReport],
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
          <PotholeDetailDrawer
            pothole={recentResolvedReport}
            onClose={vi.fn()}
            onVerify={vi.fn()}
          />
        </ReportsContext.Provider>
      );

      // Reopen button should be present
      const reopenToggleBtn = screen.getByRole('button', { name: /Still Broken\? Reopen/i });
      fireEvent.click(reopenToggleBtn);

      // Form appears
      const reasonInput = screen.getByPlaceholderText(/Describe why this repair is still broken/i);
      fireEvent.change(reasonInput, { target: { value: 'Asphalt cavity sunken 2 inches again' } });

      const submitReopenBtn = screen.getByRole('button', { name: /Confirm & Reopen Work Order/i });
      fireEvent.click(submitReopenBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          recentResolvedReport.id,
          'reopen',
          expect.objectContaining({ role: expect.any(String) }),
          { message: 'Asphalt cavity sunken 2 inches again' }
        );
      });
    });

    it('blocks reopening after 14 days have elapsed', () => {
      const now = Date.now();
      const past14Days = new Date(now - 18 * 86400000).toISOString();
      expect(canTransition('resolved', 'verified', { resolvedAt: past14Days, now })).toBe(false);
      expect(canTransition('closed', 'verified', { resolvedAt: past14Days, now })).toBe(false);

      const oldResolvedReport = createMockReport({
        id: 'old-res',
        status: 'resolved',
        resolvedAt: past14Days,
      });

      render(
        <PotholeDetailDrawer
          pothole={oldResolvedReport}
          onClose={vi.fn()}
          onVerify={vi.fn()}
        />
      );

      expect(screen.getByText(/14-day reopen window expired/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Still Broken\? Reopen/i })).toBeNull();
    });
  });

  describe('5. Header Notification Bell & Interactions', () => {
    it('displays unread count badge, opens popover, marks read and opens report on click', async () => {
      const mockNotif: NotificationMessage = {
        id: 'notif-1',
        title: 'Repair Crew Assigned',
        message: 'Gwinnett Road Crew #3 dispatched to Collins Hill Rd.',
        reportId: 'pot-test-1',
        trackingCode: 'GAP-2026-TEST0001',
        recipientRole: 'user',
        timestamp: new Date().toISOString(),
        read: false,
      };

      const markNotificationRead = vi.fn();
      const markAllNotificationsRead = vi.fn();
      const onSelectReport = vi.fn();

      const mockContext: ReportsContextType = {
        potholes: [],
        isLoading: false,
        error: null,
        notifications: [mockNotif],
        unreadCount: 1,
        refreshReports: vi.fn(),
        getReport: vi.fn(),
        submitReport: vi.fn(),
        confirmReport: vi.fn(),
        updateReportStatus: vi.fn(),
        dispatchAction: vi.fn(),
        promoteSensorSpot: vi.fn(),
        promoteDriveIncidents: vi.fn(),
        updateReport: vi.fn(),
        deleteReport: vi.fn(),
        getComments: vi.fn().mockResolvedValue([]),
        addComment: vi.fn(),
        refreshNotifications: vi.fn(),
        markNotificationRead,
        markAllNotificationsRead,
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <Header
            activeTab="dashboard"
            setActiveTab={vi.fn()}
            potholeCount={1}
            onSelectReport={onSelectReport}
          />
        </ReportsContext.Provider>
      );

      // Verify unread badge shows "1"
      const badge = screen.getByTestId('unread-notification-badge');
      expect(badge).toHaveTextContent('1');

      // Click the bell button
      const bellBtn = screen.getByTitle('Notifications');
      fireEvent.click(bellBtn);

      // Popover is displayed
      const popover = screen.getByTestId('notifications-popover');
      expect(popover).toBeInTheDocument();
      expect(screen.getByText('Repair Crew Assigned')).toBeInTheDocument();

      // Click the notification
      fireEvent.click(screen.getByText('Repair Crew Assigned'));

      await waitFor(() => {
        expect(markNotificationRead).toHaveBeenCalledWith('notif-1');
        expect(onSelectReport).toHaveBeenCalledWith('pot-test-1');
      });
    });

    it('marks all notifications read when "Mark all read" is clicked', () => {
      const mockNotif: NotificationMessage = {
        id: 'notif-1',
        title: 'Hazard Triaged',
        message: 'Your report was verified by county engineer.',
        reportId: 'pot-test-1',
        recipientRole: 'user',
        timestamp: new Date().toISOString(),
        read: false,
      };

      const markAllNotificationsRead = vi.fn();

      const mockContext: ReportsContextType = {
        potholes: [],
        isLoading: false,
        error: null,
        notifications: [mockNotif],
        unreadCount: 1,
        refreshReports: vi.fn(),
        getReport: vi.fn(),
        submitReport: vi.fn(),
        confirmReport: vi.fn(),
        updateReportStatus: vi.fn(),
        dispatchAction: vi.fn(),
        promoteSensorSpot: vi.fn(),
        promoteDriveIncidents: vi.fn(),
        updateReport: vi.fn(),
        deleteReport: vi.fn(),
        getComments: vi.fn().mockResolvedValue([]),
        addComment: vi.fn(),
        refreshNotifications: vi.fn(),
        markNotificationRead: vi.fn(),
        markAllNotificationsRead,
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <Header
            activeTab="dashboard"
            setActiveTab={vi.fn()}
            potholeCount={1}
          />
        </ReportsContext.Provider>
      );

      // Open popover
      fireEvent.click(screen.getByTitle('Notifications'));

      // Click "Mark all read"
      const markAllBtn = screen.getByText(/Mark all read/i);
      fireEvent.click(markAllBtn);

      expect(markAllNotificationsRead).toHaveBeenCalledTimes(1);
    });
  });
});
