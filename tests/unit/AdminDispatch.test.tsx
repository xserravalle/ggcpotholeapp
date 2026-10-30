import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '../helpers/render';
import { DispatchBoardView } from '@/components/dispatcher/DispatchBoardView';
import { MunicipalDispatcherModal } from '@/components/potholes/MunicipalDispatcherModal';
import { PotholeReport, Actor } from '@/domain/types';
import { ReportsContext, ReportsContextType } from '@/context/ReportsContext';
import { CAMPUS_CENTER } from '@/data/jurisdictionsData';
import {
  formatDispatchMailto,
  DEMO_DISPATCH_EMAIL,
  isDemoDispatch,
} from '@/config/dispatch';

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
  status: 'verified',
  verificationsCount: 2,
  userConfirmed: true,
  reportedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
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

describe('Admin Dispatch Board & Work Order Routing (Task 7)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('1. Assigning Sets the Deadline and Filters Officers to That Agency', () => {
    it('filters the officer dropdown when changing agency and calculates SLA deadline', async () => {
      const verifiedReport = createMockReport({
        id: 'rep-v1',
        trackingCode: 'GAP-2026-V1',
        roadName: 'Collins Hill Rd',
        status: 'verified',
        reportedAt: '2026-03-01T12:00:00.000Z',
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: { ...verifiedReport, status: 'assigned' },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [verifiedReport],
        loading: false,
        error: null,
        unreadNotificationCount: 0,
        notifications: [],
        createReport: vi.fn(),
        confirmReport: vi.fn(),
        addComment: vi.fn(),
        listComments: vi.fn().mockResolvedValue([]),
        dispatchAction: mockDispatchAction,
        markNotificationRead: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        refresh: vi.fn(),
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <DispatchBoardView potholes={[verifiedReport]} />
        </ReportsContext.Provider>
      );

      // Card is in Verified column
      expect(screen.getAllByText('Collins Hill Rd')[0]).toBeInTheDocument();
      const assignBtn = screen.getAllByRole('button', { name: /Assign Crew/i })[0];
      expect(assignBtn).toBeInTheDocument();

      // Open Assign Dialog
      fireEvent.click(assignBtn);
      expect(screen.getByText('Assign Work Order')).toBeInTheDocument();

      // Check agency selector
      const agencySelect = screen.getByTestId('assign-agency-select') as HTMLSelectElement;
      expect(agencySelect).toBeInTheDocument();

      // Change agency to GGC Facilities
      fireEvent.change(agencySelect, { target: { value: 'GGC' } });

      // Officers dropdown must now contain GGC officers and NOT Gwinnett County officers
      const officerSelect = screen.getByTestId('assign-officer-select') as HTMLSelectElement;
      expect(officerSelect).toBeInTheDocument();
      expect(screen.getByText(/Marcus Sterling/i)).toBeInTheDocument();
      expect(screen.getByText(/Elena Rostova/i)).toBeInTheDocument();
      expect(screen.queryByText(/Carlos Mendez/i)).not.toBeInTheDocument();

      // GGC SLA target days is 2 days. From 2026-03-01, +2 days is March 3, 2026.
      const deadlinePreview = screen.getByTestId('calculated-deadline-preview');
      expect(deadlinePreview).toBeInTheDocument();
      expect(deadlinePreview.textContent).toMatch(/Mar 3, 2026/);

      // Now switch agency to GWINNETT_COUNTY (5 days target)
      fireEvent.change(agencySelect, { target: { value: 'GWINNETT_COUNTY' } });

      // Officers dropdown must now contain Gwinnett County officers and NOT GGC officers
      expect(screen.getByText(/Carlos Mendez/i)).toBeInTheDocument();
      expect(screen.getByText(/Aaliyah Washington/i)).toBeInTheDocument();
      expect(screen.queryByText(/Marcus Sterling/i)).not.toBeInTheDocument();

      // Gwinnett SLA is 5 days. From 2026-03-01, +5 days is March 6, 2026.
      expect(deadlinePreview.textContent).toMatch(/Mar 6, 2026/);

      // Confirm assignment
      const confirmBtn = screen.getByTestId('confirm-assignment-button');
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'rep-v1',
          'assign',
          expect.objectContaining({ role: 'admin' }),
          expect.objectContaining({
            assignedAgencyId: 'GWINNETT_COUNTY',
            assignedOfficerId: 'gcd-off-1',
            assignedCrew: 'Carlos Mendez',
            slaDueAt: expect.stringMatching(/2026-03-06/),
          })
        );
      });
    });
  });

  describe('2. Officer Workload Counts ("3 open")', () => {
    it('calculates open workload (assigned + in_progress) and displays "3 open" in dropdown', () => {
      // 3 open tickets for Carlos Mendez (2 assigned, 1 in_progress)
      const r1 = createMockReport({ id: 'r-1', status: 'assigned', assignedOfficerId: 'gcd-off-1', assignedCrew: 'Carlos Mendez' });
      const r2 = createMockReport({ id: 'r-2', status: 'assigned', assignedOfficerId: 'gcd-off-1', assignedCrew: 'Carlos Mendez' });
      const r3 = createMockReport({ id: 'r-3', status: 'in_progress', assignedOfficerId: 'gcd-off-1', assignedCrew: 'Carlos Mendez' });
      // 1 closed ticket for Carlos Mendez (should NOT count towards open workload)
      const r4 = createMockReport({ id: 'r-4', status: 'closed', assignedOfficerId: 'gcd-off-1', assignedCrew: 'Carlos Mendez' });

      // 1 open ticket for Elena Rostova (GGC)
      const r5 = createMockReport({ id: 'r-5', status: 'assigned', assignedOfficerId: 'ggc-off-2', assignedCrew: 'Elena Rostova' });

      // 1 target verified report to assign
      const targetReport = createMockReport({ id: 'r-target', status: 'verified', authorityId: 'GWINNETT_COUNTY' });

      const allReports = [r1, r2, r3, r4, r5, targetReport];

      render(<DispatchBoardView potholes={allReports} />);

      // Open assign dialog on the target report
      const assignBtn = screen.getAllByRole('button', { name: /Assign Crew/i })[0];
      fireEvent.click(assignBtn);

      // Agency is GWINNETT_COUNTY by default
      const carlosOption = screen.getByRole('option', { name: /Carlos Mendez \(3 open\)/i });
      expect(carlosOption).toBeInTheDocument();

      // Check another officer with 0 open
      const trevorOption = screen.getByRole('option', { name: /Trevor Vance \(0 open\)/i });
      expect(trevorOption).toBeInTheDocument();

      // Switch agency to GGC
      const agencySelect = screen.getByTestId('assign-agency-select');
      fireEvent.change(agencySelect, { target: { value: 'GGC' } });

      // Elena Rostova has 1 open, Marcus Sterling has 0 open
      expect(screen.getByRole('option', { name: /Elena Rostova \(1 open\)/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /Marcus Sterling \(0 open\)/i })).toBeInTheDocument();
    });
  });

  describe('3. Overdue Detection on Cards', () => {
    it('shows red Overdue badge for active reports past their deadline and hides it for normal or resolved reports', () => {
      const now = Date.now();
      const pastDeadline = new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(); // 3 days ago
      const futureDeadline = new Date(now + 4 * 24 * 60 * 60 * 1000).toISOString(); // in 4 days

      // Overdue assigned report
      const repOverdue = createMockReport({
        id: 'rep-overdue-1',
        trackingCode: 'GAP-2026-OVERDUE',
        roadName: 'Overdue Expressway',
        status: 'assigned',
        reportedAt: new Date(now - 8 * 24 * 60 * 60 * 1000).toISOString(), // 8 days open
        slaDueAt: pastDeadline,
      });

      // On-time assigned report
      const repOnTime = createMockReport({
        id: 'rep-ontime-1',
        trackingCode: 'GAP-2026-ONTIME',
        roadName: 'Smooth Boulevard',
        status: 'assigned',
        reportedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
        slaDueAt: futureDeadline,
      });

      // Resolved report past initial deadline (must NOT be overdue)
      const repResolved = createMockReport({
        id: 'rep-resolved-1',
        trackingCode: 'GAP-2026-RESOLVED',
        roadName: 'Repaired Lane',
        status: 'resolved',
        reportedAt: new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString(),
        slaDueAt: pastDeadline,
        resolvedAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(),
      });

      render(<DispatchBoardView potholes={[repOverdue, repOnTime, repResolved]} />);

      // Find cards by test id
      const overdueCard = screen.getAllByTestId('dispatch-card-rep-overdue-1')[0];
      const onTimeCard = screen.getAllByTestId('dispatch-card-rep-ontime-1')[0];
      const resolvedCard = screen.getAllByTestId('dispatch-card-rep-resolved-1')[0];

      // 1. Overdue card has the red Overdue badge
      expect(overdueCard).toHaveTextContent('Overdue');
      expect(overdueCard.querySelector('[data-testid="overdue-badge"]')).toBeInTheDocument();

      // 2. On-time card does not have the overdue badge
      expect(onTimeCard.querySelector('[data-testid="overdue-badge"]')).not.toBeInTheDocument();

      // 3. Resolved card is not overdue even though deadline was in the past
      expect(resolvedCard.querySelector('[data-testid="overdue-badge"]')).not.toBeInTheDocument();

      // 4. Days open is displayed
      expect(overdueCard.querySelector('[data-testid="card-days-open"]')?.textContent).toMatch(/8 days open/);
    });
  });

  describe('4. Admin Close Action', () => {
    it('closes a resolved report without rating with an admin note', async () => {
      const resolvedReport = createMockReport({
        id: 'rep-res-1',
        trackingCode: 'GAP-2026-RES1',
        roadName: 'University Center Ln',
        status: 'resolved',
      });

      const mockDispatchAction = vi.fn().mockResolvedValue({
        report: { ...resolvedReport, status: 'closed' },
        timelineEntry: {} as any,
        notifications: [],
      });

      const mockContext: ReportsContextType = {
        potholes: [resolvedReport],
        loading: false,
        error: null,
        unreadNotificationCount: 0,
        notifications: [],
        createReport: vi.fn(),
        confirmReport: vi.fn(),
        addComment: vi.fn(),
        listComments: vi.fn().mockResolvedValue([]),
        dispatchAction: mockDispatchAction,
        markNotificationRead: vi.fn(),
        markAllNotificationsRead: vi.fn(),
        refresh: vi.fn(),
        resetDemoData: vi.fn(),
        loadSampleWorkflow: vi.fn(),
      };

      render(
        <ReportsContext.Provider value={mockContext}>
          <DispatchBoardView potholes={[resolvedReport]} />
        </ReportsContext.Provider>
      );

      // Click "Admin Close"
      const closeBtn = screen.getAllByRole('button', { name: /Admin Close/i })[0];
      expect(closeBtn).toBeInTheDocument();
      fireEvent.click(closeBtn);

      expect(screen.getByText('Admin Close Work Order')).toBeInTheDocument();

      // Enter close note
      const noteInput = screen.getByTestId('close-note-input');
      fireEvent.change(noteInput, {
        target: { value: 'Asphalt cold patch inspected and verified level by inspector.' },
      });

      // Confirm close
      const confirmCloseBtn = screen.getByTestId('confirm-close-button');
      fireEvent.click(confirmCloseBtn);

      await waitFor(() => {
        expect(mockDispatchAction).toHaveBeenCalledWith(
          'rep-res-1',
          'close',
          expect.objectContaining({ role: 'admin' }),
          {
            message: 'Asphalt cold patch inspected and verified level by inspector.',
          }
        );
      });
    });
  });

  describe('5. Demo-Mode Email Rewriting', () => {
    it('rewrites email recipient to demo address, adds [DEMO] in subject, and names the real agency in body', () => {
      const mail = formatDispatchMailto({
        realEmail: 'dotcustomerservice@gwinnettcounty.com',
        agencyName: 'Gwinnett County DOT',
        subject: 'Pothole Work Order #1042',
        body: 'Repair coordinates: 33.9798, -84.0017',
      });

      // Default DISPATCH_MODE is demo
      expect(isDemoDispatch()).toBe(true);
      expect(mail.isDemo).toBe(true);
      expect(mail.recipient).toBe(DEMO_DISPATCH_EMAIL);
      expect(mail.subject).toContain('[DEMO]');
      expect(mail.subject).toContain('Pothole Work Order #1042');

      // The url contains the demo recipient
      expect(mail.url).toContain(`mailto:${DEMO_DISPATCH_EMAIL}`);

      // The url body contains [DEMO MODE: Intended for Gwinnett County DOT ...]
      const decodedUrl = decodeURIComponent(mail.url);
      expect(decodedUrl).toContain('[DEMO MODE: Intended for Gwinnett County DOT (dotcustomerservice@gwinnettcounty.com)]');
      expect(decodedUrl).toContain('Repair coordinates: 33.9798, -84.0017');
    });

    it('MunicipalDispatcherModal displays Send Work Order Email title, demo notice, and routed mailto', () => {
      const mockReport = createMockReport({
        id: 'rep-modal-1',
        roadName: 'Sugarloaf Pkwy',
        severity: 'high',
      });

      render(
        <MunicipalDispatcherModal
          isOpen={true}
          onClose={vi.fn()}
          pothole={mockReport}
          allPotholes={[mockReport]}
          onSelectPothole={vi.fn()}
          onUpdateStatus={vi.fn()}
        />
      );

      // Title must be Send Work Order Email
      expect(screen.getByText('Send Work Order Email')).toBeInTheDocument();

      // Does not contain "updates the live status in the central GIS"
      expect(screen.queryByText(/updates the live status in the central GIS/i)).not.toBeInTheDocument();

      // Displays visible demo notice next to or in footer
      expect(screen.getByText(/Demo Mode: sends to/i)).toBeInTheDocument();
      expect(screen.getByText(DEMO_DISPATCH_EMAIL)).toBeInTheDocument();

      // Email dispatch button is pre-filled with demo recipient and [DEMO]
      const emailLink = screen.getByRole('link', { name: /Launch Pre-Filled Direct Email/i });
      expect(emailLink).toBeInTheDocument();
      expect(emailLink.getAttribute('href')).toContain(`mailto:${DEMO_DISPATCH_EMAIL}`);
      expect(emailLink.getAttribute('href')).toContain('%5BDEMO%5D');
    });
  });
});
