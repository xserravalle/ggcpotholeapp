import { describe, it, expect } from 'vitest';
import { can, isOwnReport, isAssignedOfficer, CivicAction } from '@/domain/permissions';
import { PotholeReport, Actor, UserRole } from '@/domain/types';

const mockReport: PotholeReport = {
  id: 'rep-101',
  trackingCode: 'GAP-2026-TEST01',
  title: 'Test Pothole on Collins Hill',
  address: '1000 University Center Ln',
  roadName: 'Collins Hill Rd',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  latitude: 33.98,
  longitude: -84.00,
  severity: 'severe',
  status: 'reported',
  priority: 'high',
  priorityScore: 70,
  timeline: [],
  verificationsCount: 3,
  userConfirmed: true,
  reportedAt: '2026-09-01T10:00:00Z',
  lastVerifiedAt: '2026-09-01T10:00:00Z',
  description: 'Test pothole',
  reporterName: 'Jordan Commuter',
  reporterEmail: 'jordan.commuter@example.com',
  estimatedDepthInches: 4,
  estimatedWidthInches: 20,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report',
};

const citizenOwner: Actor = {
  id: 'act-jordan',
  name: 'Jordan Commuter',
  email: 'jordan.commuter@example.com',
  role: 'user',
};

const otherCitizen: Actor = {
  id: 'act-taylor',
  name: 'Taylor Resident',
  email: 'taylor.resident@example.com',
  role: 'user',
};

const adminActor: Actor = {
  id: 'act-admin',
  name: 'Morgan Admin',
  role: 'admin',
};

const assignedOfficer: Actor = {
  id: 'off-casey',
  name: 'Officer Casey Crew',
  role: 'officer',
};

const otherOfficer: Actor = {
  id: 'off-riley',
  name: 'Officer Riley Patrol',
  role: 'officer',
};

describe('domain/permissions: can(role, action, report, actor)', () => {
  it('correctly identifies report ownership', () => {
    expect(isOwnReport(mockReport, citizenOwner)).toBe(true);
    expect(isOwnReport(mockReport, otherCitizen)).toBe(false);
    expect(isOwnReport(mockReport, undefined)).toBe(false);
  });

  it('correctly identifies assigned officer', () => {
    const assignedReport: PotholeReport = {
      ...mockReport,
      assignedOfficerId: 'off-casey',
    };
    expect(isAssignedOfficer(assignedReport, assignedOfficer)).toBe(true);
    expect(isAssignedOfficer(assignedReport, otherOfficer)).toBe(false);
    expect(isAssignedOfficer(assignedReport, undefined)).toBe(false);
  });

  describe('Citizen permissions (guest & user)', () => {
    it('allows basic reporting and community engagement', () => {
      const citizenRoles: UserRole[] = ['guest', 'user'];
      for (const role of citizenRoles) {
        expect(can(role, 'create')).toBe(true);
        expect(can(role, 'confirm')).toBe(true);
        expect(can(role, 'comment')).toBe(true);
      }
    });

    it('allows rateFix only on own report and only when resolved or closed', () => {
      const openReport: PotholeReport = { ...mockReport, status: 'reported' };
      const inProgressReport: PotholeReport = { ...mockReport, status: 'in_progress' };
      const resolvedReport: PotholeReport = { ...mockReport, status: 'resolved' };
      const closedReport: PotholeReport = { ...mockReport, status: 'closed' };

      // Non-owner cannot rate fix
      expect(can('user', 'rateFix', resolvedReport, otherCitizen)).toBe(false);

      // Owner cannot rate un-resolved report
      expect(can('user', 'rateFix', openReport, citizenOwner)).toBe(false);
      expect(can('user', 'rateFix', inProgressReport, citizenOwner)).toBe(false);

      // Owner can rate resolved or closed report
      expect(can('user', 'rateFix', resolvedReport, citizenOwner)).toBe(true);
      expect(can('user', 'rateFix', closedReport, citizenOwner)).toBe(true);
    });

    it('allows reopen only on own report within allowed transition rules', () => {
      const resolvedReport: PotholeReport = {
        ...mockReport,
        status: 'resolved',
        resolvedAt: '2026-09-01T12:00:00Z',
      };

      // Owner can reopen resolved report
      expect(can('user', 'reopen', resolvedReport, citizenOwner)).toBe(true);

      // Other citizen cannot reopen
      expect(can('user', 'reopen', resolvedReport, otherCitizen)).toBe(false);

      // Unresolved report cannot be reopened
      expect(can('user', 'reopen', mockReport, citizenOwner)).toBe(false);
    });

    it('denies citizen from performing admin/crew actions', () => {
      const restrictedActions: CivicAction[] = [
        'verify',
        'reject',
        'merge',
        'setPriority',
        'assign',
        'reassign',
        'close',
        'exportData',
        'dispatchEmail',
        'startWork',
        'resolve',
      ];

      for (const act of restrictedActions) {
        expect(can('guest', act, mockReport, citizenOwner)).toBe(false);
        expect(can('user', act, mockReport, citizenOwner)).toBe(false);
      }
    });
  });

  describe('Admin permissions', () => {
    it('authorizes all management and triage actions', () => {
      const adminActions: CivicAction[] = [
        'verify',
        'reject',
        'merge',
        'setPriority',
        'assign',
        'reassign',
        'close',
        'exportData',
        'dispatchEmail',
        'comment',
        'create',
        'confirm',
      ];

      for (const act of adminActions) {
        expect(can('admin', act, mockReport, adminActor)).toBe(true);
      }
    });

    it('disallows admin from field work actions (startWork, resolve) or rating fix', () => {
      expect(can('admin', 'startWork', mockReport, adminActor)).toBe(false);
      expect(can('admin', 'resolve', mockReport, adminActor)).toBe(false);
      expect(can('admin', 'rateFix', mockReport, adminActor)).toBe(false);
    });
  });

  describe('Officer permissions', () => {
    it('allows comment, startWork, and resolve ONLY on reports assigned to them', () => {
      const assignedReport: PotholeReport = {
        ...mockReport,
        assignedOfficerId: 'off-casey',
        status: 'assigned',
      };

      const inProgressReport: PotholeReport = {
        ...mockReport,
        assignedOfficerId: 'off-casey',
        status: 'in_progress',
      };

      // Comment
      expect(can('officer', 'comment', assignedReport, assignedOfficer)).toBe(true);
      expect(can('officer', 'comment', assignedReport, otherOfficer)).toBe(false);

      // startWork (requires status === 'assigned')
      expect(can('officer', 'startWork', assignedReport, assignedOfficer)).toBe(true);
      expect(can('officer', 'startWork', inProgressReport, assignedOfficer)).toBe(false);
      expect(can('officer', 'startWork', assignedReport, otherOfficer)).toBe(false);

      // resolve (requires status === 'in_progress')
      expect(can('officer', 'resolve', inProgressReport, assignedOfficer)).toBe(true);
      expect(can('officer', 'resolve', assignedReport, assignedOfficer)).toBe(false);
      expect(can('officer', 'resolve', inProgressReport, otherOfficer)).toBe(false);
    });

    it('disallows officer from admin triage/assignment actions', () => {
      const adminActions: CivicAction[] = [
        'verify',
        'reject',
        'merge',
        'setPriority',
        'assign',
        'reassign',
        'close',
        'exportData',
        'dispatchEmail',
      ];

      for (const act of adminActions) {
        expect(can('officer', act, mockReport, assignedOfficer)).toBe(false);
      }
    });
  });
});
