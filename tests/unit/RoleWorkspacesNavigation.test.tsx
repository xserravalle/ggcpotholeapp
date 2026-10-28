import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, renderHook, act } from '../helpers/render';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Header } from '@/components/Header';
import { MobileNavBar } from '@/components/common/MobileNavBar';
import { canAccessTab } from '@/domain/permissions';
import { DEMO_OFFICERS } from '@/data/officersData';
import { 
  StatCard, 
  StatusBadge, 
  PriorityBadge, 
  EmptyState, 
  SectionHeader, 
  InfoRow, 
  ReportCard 
} from '@/components/kit';
import { 
  TriageWorkspaceView, 
  PerformanceWorkspaceView, 
  OfficerAssignmentsView 
} from '@/components/workspaces';
import { PotholeReport } from '@/domain/types';

describe('Task 3: Role Workspaces, Shell Navigation & Auth', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('1. Officer Authentication & Admin Security', () => {
    it('authenticates demo officer correctly and sets agency profile', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });

      const officer = DEMO_OFFICERS[0];
      act(() => {
        const loginRes = result.current.loginAsOfficer(officer.id);
        expect(loginRes.success).toBe(true);
      });

      expect(result.current.isOfficer).toBe(true);
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isLoggedIn).toBe(true);
      expect(result.current.user.role).toBe('officer');
      expect(result.current.user.officerId).toBe(officer.id);
      expect(result.current.user.agencyId).toBe(officer.agencyId);
      expect(result.current.user.displayName).toBe(officer.name);
    });

    it('rejects invalid officer id gracefully', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });

      act(() => {
        const loginRes = result.current.loginAsOfficer('non-existent-officer-id');
        expect(loginRes.success).toBe(false);
        expect(loginRes.error).toContain('not found');
      });

      expect(result.current.isOfficer).toBe(false);
      expect(result.current.user.role).toBe('guest');
    });

    it('does not leak passcode hint in admin login error message', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>,
      });

      act(() => {
        const authResult = result.current.loginAsAdmin('invalid-secret');
        expect(authResult.success).toBe(false);
        expect(authResult.error).toBe('Invalid staff passcode.');
        expect(authResult.error).not.toContain('admin');
        expect(authResult.error).not.toContain('hint');
      });
    });
  });

  describe('2. Navigation per Role in Header and MobileNavBar', () => {
    it('renders citizen navigation: Home, Map, Report, My Reports', () => {
      render(
        <AuthProvider>
          <Header
            activeTab="dashboard"
            setActiveTab={vi.fn()}
            potholeCount={10}
          />
          <MobileNavBar
            activeTab="dashboard"
            setActiveTab={vi.fn()}
          />
        </AuthProvider>
      );

      // Header Citizen tabs
      expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Map').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Report').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('My Reports').length).toBeGreaterThanOrEqual(1);

      // Should NOT show admin or officer tabs
      expect(screen.queryByText('Admin Overview')).toBeNull();
      expect(screen.queryByText('Triage')).toBeNull();
      expect(screen.queryByText('Dispatch Board')).toBeNull();
      expect(screen.queryByText('My Assignments')).toBeNull();
    });

    it('renders admin navigation: Admin Overview, Triage, Dispatch Board, Performance, Analytics', () => {
      localStorage.setItem('ggc-auth-user', JSON.stringify({
        id: 'staff-admin',
        role: 'admin',
        displayName: 'Staff Administrator',
      }));

      render(
        <AuthProvider>
          <Header
            activeTab="admin-overview"
            setActiveTab={vi.fn()}
            potholeCount={10}
          />
          <MobileNavBar
            activeTab="admin-overview"
            setActiveTab={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getAllByText('Admin Overview').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Triage').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Dispatch Board').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Performance').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Analytics').length).toBeGreaterThanOrEqual(1);

      // Admin does NOT have citizen or officer tabs in header
      expect(screen.queryByText('Home')).toBeNull();
      expect(screen.queryByText('My Assignments')).toBeNull();
    });

    it('renders officer navigation: My Assignments, Map', () => {
      const officer = DEMO_OFFICERS[0];
      localStorage.setItem('ggc-auth-user', JSON.stringify({
        id: officer.id,
        officerId: officer.id,
        agencyId: officer.agencyId,
        role: 'officer',
        displayName: officer.name,
      }));

      render(
        <AuthProvider>
          <Header
            activeTab="my-assignments"
            setActiveTab={vi.fn()}
            potholeCount={10}
          />
          <MobileNavBar
            activeTab="my-assignments"
            setActiveTab={vi.fn()}
          />
        </AuthProvider>
      );

      expect(screen.getAllByText('My Assignments').length).toBeGreaterThanOrEqual(1);
      expect(screen.getAllByText('Map').length).toBeGreaterThanOrEqual(1);

      // Officer does NOT see admin triage, dispatch board, or citizen tabs in header
      expect(screen.queryByText('Admin Overview')).toBeNull();
      expect(screen.queryByText('Triage')).toBeNull();
      expect(screen.queryByText('Dispatch Board')).toBeNull();
      expect(screen.queryByText('Home')).toBeNull();
    });
  });

  describe('3. Tab Protection and Route Permissions', () => {
    it('enforces route permission matrix via canAccessTab', () => {
      // Citizen
      expect(canAccessTab('dashboard', 'user')).toBe(true);
      expect(canAccessTab('potholes', 'user')).toBe(true);
      expect(canAccessTab('report', 'user')).toBe(true);
      expect(canAccessTab('my-reports', 'user')).toBe(true);
      expect(canAccessTab('triage', 'user')).toBe(false);
      expect(canAccessTab('admin-overview', 'user')).toBe(false);
      expect(canAccessTab('dispatch-board', 'user')).toBe(false);
      expect(canAccessTab('performance', 'user')).toBe(false);
      expect(canAccessTab('my-assignments', 'user')).toBe(false);

      // Officer
      expect(canAccessTab('my-assignments', 'officer')).toBe(true);
      expect(canAccessTab('potholes', 'officer')).toBe(true);
      expect(canAccessTab('dashboard', 'officer')).toBe(false);
      expect(canAccessTab('my-reports', 'officer')).toBe(false);
      expect(canAccessTab('admin-overview', 'officer')).toBe(false);
      expect(canAccessTab('triage', 'officer')).toBe(false);
      expect(canAccessTab('dispatch-board', 'officer')).toBe(false);
      expect(canAccessTab('performance', 'officer')).toBe(false);

      // Admin
      expect(canAccessTab('admin-overview', 'admin')).toBe(true);
      expect(canAccessTab('triage', 'admin')).toBe(true);
      expect(canAccessTab('dispatch-board', 'admin')).toBe(true);
      expect(canAccessTab('performance', 'admin')).toBe(true);
      expect(canAccessTab('analytics', 'admin')).toBe(true);
      expect(canAccessTab('potholes', 'admin')).toBe(true);
      expect(canAccessTab('my-assignments', 'admin')).toBe(false);
      expect(canAccessTab('dashboard', 'admin')).toBe(false);
      expect(canAccessTab('my-reports', 'admin')).toBe(false);
    });
  });

  describe('4. Placeholder Workspaces and Design Kit Components', () => {
    it('renders TriageWorkspaceView with coming in a later task notice', () => {
      render(<TriageWorkspaceView />);
      expect(screen.getByText('Road Hazard Triage Queue')).toBeTruthy();
      expect(screen.getByText(/coming in a later task/i)).toBeTruthy();
    });

    it('renders PerformanceWorkspaceView with dashboard title', () => {
      render(<PerformanceWorkspaceView />);
      expect(screen.getByText('Agency Performance & SLA Dashboard')).toBeTruthy();
      expect(screen.getByText(/Agency Benchmarks & Charts/i)).toBeTruthy();
    });

    it('renders OfficerAssignmentsView with empty state notice when no tickets', () => {
      render(
        <AuthProvider>
          <OfficerAssignmentsView potholes={[]} />
        </AuthProvider>
      );
      expect(screen.getByText('My Field Assignments')).toBeTruthy();
      expect(screen.getByText(/No Field Assignments Found/i)).toBeTruthy();
    });

    it('renders Kit components: StatusBadge, PriorityBadge, StatCard, SectionHeader, InfoRow', () => {
      render(
        <div>
          <StatusBadge status="in_progress" />
          <PriorityBadge priority="critical" score={92} />
          <StatCard label="Assigned Tickets" value="14" variant="purple" />
          <SectionHeader title="Section Test" badge="Beta" />
          <InfoRow label="Location" value="Buford Highway" />
          <EmptyState title="No Items" description="Nothing to display here" />
        </div>
      );

      expect(screen.getByText('In Progress')).toBeTruthy();
      expect(screen.getByText(/critical/i)).toBeTruthy();
      expect(screen.getByText('Assigned Tickets')).toBeTruthy();
      expect(screen.getByText('Section Test')).toBeTruthy();
      expect(screen.getByText('Buford Highway')).toBeTruthy();
      expect(screen.getByText('No Items')).toBeTruthy();
    });

    it('renders ReportCard with overdue indicator when overdue', () => {
      const overdueReport: PotholeReport = {
        id: 'rep-overdue-1',
        title: 'Deep Pit on Highway 29',
        description: 'Dangerous pothole',
        latitude: 33.95,
        longitude: -84.00,
        address: '1000 Highway 29, Lawrenceville',
        roadName: 'Highway 29',
        severity: 'critical',
        status: 'assigned',
        reportedAt: '2026-09-01T10:00:00.000Z',
        lastVerifiedAt: '2026-09-01T10:00:00.000Z',
        verificationsCount: 5,
        priority: 'critical',
        priorityScore: 90,
        slaDueAt: '2026-09-03T10:00:00.000Z',
        timeline: [],
      };

      render(<ReportCard report={overdueReport} />);
      expect(screen.getByText('Deep Pit on Highway 29')).toBeTruthy();
      expect(screen.getByText(/overdue/i)).toBeTruthy();
    });
  });
});
