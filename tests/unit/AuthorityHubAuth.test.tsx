import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/render';
import { AuthorityHubView } from '../../src/components/dispatcher/AuthorityHubView';
import { PotholeReport } from '../../src/types/pothole';
import { AuthSession } from '../../src/services/authService';

const mockPotholes: PotholeReport[] = [
  {
    id: 'POT-1',
    trackingCode: 'GAP-2026-TEST1',
    title: 'Severe Test Pothole',
    roadName: 'Collins Hill Rd',
    address: '1000 University Center Ln',
    city: 'Lawrenceville',
    jurisdiction: 'Georgia Gwinnett College',
    authorityId: 'GGC',
    authorityEmail: 'facilities@ggc.edu',
    latitude: 33.982,
    longitude: -84.004,
    severity: 'critical',
    hazardType: 'POTHOLE',
    status: 'reported',
    verificationsCount: 3,
    userConfirmed: true,
    reportedAt: new Date().toISOString(),
    description: 'Test description',
    detectedBy: 'User'
  }
];

describe('AuthorityHubView Auth & Roles', () => {
  const dispatcherSession: AuthSession = {
    email: 'dispatcher@ggc.edu',
    token: 'token_disp_123',
    expiresAt: Date.now() + 100000,
    role: 'Dispatcher'
  };

  const viewerSession: AuthSession = {
    email: 'citizen@viewer.org',
    token: 'token_view_123',
    expiresAt: Date.now() + 100000,
    role: 'Viewer'
  };

  it('renders logged in user email and role badge for Dispatcher', () => {
    const onLogout = vi.fn();
    render(
      <AuthorityHubView
        potholes={mockPotholes}
        onUpdateStatus={vi.fn()}
        onOpenDispatcherModal={vi.fn()}
        onSelectPotholeForMap={vi.fn()}
        currentUser={dispatcherSession}
        onLogout={onLogout}
      />
    );

    expect(screen.getByText(/logged in as/i)).toBeInTheDocument();
    expect(screen.getByText('dispatcher@ggc.edu')).toBeInTheDocument();
    expect(screen.getByText('Dispatcher')).toBeInTheDocument();

    const logoutBtn = screen.getByRole('button', { name: /log out/i });
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });

  it('allows Dispatcher to change status and open dispatcher modal', () => {
    const onUpdateStatus = vi.fn();
    const onOpenDispatcherModal = vi.fn();

    render(
      <AuthorityHubView
        potholes={mockPotholes}
        onUpdateStatus={onUpdateStatus}
        onOpenDispatcherModal={onOpenDispatcherModal}
        onSelectPotholeForMap={vi.fn()}
        currentUser={dispatcherSession}
      />
    );

    // Status select is interactive
    const statusSelect = screen.getByLabelText(/update work order status/i);
    fireEvent.change(statusSelect, { target: { value: 'investigating' } });
    expect(onUpdateStatus).toHaveBeenCalledWith('POT-1', 'investigating');

    // Dispatch modal button is active
    const dispatchBtn = screen.getByTitle(/open municipal work order dispatcher/i);
    expect(dispatchBtn).not.toBeDisabled();
    fireEvent.click(dispatchBtn);
    expect(onOpenDispatcherModal).toHaveBeenCalledWith(mockPotholes[0]);
  });

  it('restricts Viewer from changing status or dispatching work orders', () => {
    const onUpdateStatus = vi.fn();
    const onSelectPotholeForMap = vi.fn();

    render(
      <AuthorityHubView
        potholes={mockPotholes}
        onUpdateStatus={onUpdateStatus}
        onOpenDispatcherModal={vi.fn()}
        onSelectPotholeForMap={onSelectPotholeForMap}
        currentUser={viewerSession}
      />
    );

    expect(screen.getByText('Viewer')).toBeInTheDocument();
    expect(screen.getByText(/viewer mode \(read-only\)/i)).toBeInTheDocument();

    // Work order status dropdown should NOT be editable
    expect(screen.queryByRole('combobox', { name: /reported/i })).not.toBeInTheDocument();
    expect(screen.getByTitle(/viewers cannot change work order status/i)).toBeInTheDocument();

    // Dispatch button is disabled
    const disabledDispatchBtn = screen.getByTitle(/work order routing restricted to dispatchers/i);
    expect(disabledDispatchBtn).toBeDisabled();

    // Map inspect button is still active
    const mapBtn = screen.getByTitle(/inspect pin on map/i);
    expect(mapBtn).not.toBeDisabled();
    fireEvent.click(mapBtn);
    expect(onSelectPotholeForMap).toHaveBeenCalledWith(mockPotholes[0]);
  });
});
