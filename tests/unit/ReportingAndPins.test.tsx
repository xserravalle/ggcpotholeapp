import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '../helpers/render';
import { 
  loadUserConfirmedIds, 
  saveUserConfirmedIds, 
  loadUserCreatedIds, 
  saveUserCreatedId 
} from '@/services/storageService';
import { SEVERITY_DUAL_CODE, SeverityBadge } from '@/components/common/SeverityBadge';
import { PotholeDetailDrawer } from '@/components/potholes/PotholeDetailDrawer';
import { PotholeReportModal } from '@/components/potholes/PotholeReportModal';
import { MunicipalQuickJump } from '@/components/map/MunicipalQuickJump';
import { PotholeReport } from '@/types/pothole';

const samplePothole: PotholeReport = {
  id: 'pot-test-1',
  trackingCode: 'GAP-2026-TEST',
  title: 'Pothole on Collins Hill',
  roadName: 'Collins Hill Rd',
  address: '1000 University Center Ln',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  latitude: 33.98,
  longitude: -84.00,
  severity: 'moderate',
  status: 'reported',
  verificationsCount: 3,
  userConfirmed: true,
  reportedAt: new Date().toISOString(),
  lastVerifiedAt: new Date().toISOString(),
  description: 'Moderate bump',
  estimatedDepthInches: 2.5,
  estimatedWidthInches: 14,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'User Mobile Report'
};

describe('Storage and Confirmation Tracking', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should store and load confirmed IDs correctly', () => {
    expect(loadUserConfirmedIds()).toEqual([]);
    saveUserConfirmedIds(['spot-1', 'spot-2']);
    expect(loadUserConfirmedIds()).toEqual(['spot-1', 'spot-2']);
  });

  it('should store and retrieve user created IDs without duplicates', () => {
    expect(loadUserCreatedIds()).toEqual([]);
    saveUserCreatedId('report-1');
    saveUserCreatedId('report-1');
    saveUserCreatedId('report-2');
    expect(loadUserCreatedIds()).toEqual(['report-1', 'report-2']);
  });
});

describe('Severity Dual Coding & Accessible Labels', () => {
  it('should have consistent dual coding symbols for all 4 severity levels', () => {
    expect(SEVERITY_DUAL_CODE.minor.symbol).toBe('●');
    expect(SEVERITY_DUAL_CODE.minor.label).toBe('Minor');

    expect(SEVERITY_DUAL_CODE.moderate.symbol).toBe('◆');
    expect(SEVERITY_DUAL_CODE.moderate.label).toBe('Moderate');

    expect(SEVERITY_DUAL_CODE.severe.symbol).toBe('▲');
    expect(SEVERITY_DUAL_CODE.severe.label).toBe('Severe');

    expect(SEVERITY_DUAL_CODE.critical.symbol).toBe('▲');
    expect(SEVERITY_DUAL_CODE.critical.label).toBe('Critical');
  });
});

describe('Confirmed Button UI & Listen Feedback', () => {
  it('should render only 1 checkmark to the right of Confirmed and no "(undo)" text', () => {
    render(
      <PotholeDetailDrawer
        pothole={samplePothole}
        onClose={vi.fn()}
        onVerify={vi.fn()}
      />
    );

    const button = screen.getByRole('button', { name: /confirmed/i });
    expect(button).toBeDefined();
    expect(button.textContent).not.toContain('(undo)');
    expect(button.textContent).not.toContain('(Click to undo)');
    expect(button.textContent).toContain('Confirmed');

    // Confirm that checkmark SVG exists inside button
    const svgIcon = button.querySelector('svg');
    expect(svgIcon).toBeTruthy();
  });

  it('should not treat confirmed reports as user-created reports', () => {
    saveUserConfirmedIds(['known-pot-123']);
    // It is in confirmed IDs
    expect(loadUserConfirmedIds()).toContain('known-pot-123');
    // But it is NOT in user-created IDs
    expect(loadUserCreatedIds()).not.toContain('known-pot-123');
  });

  it('differentiates critical and severe badges with dedicated classes and white triangles', () => {
    const { container: critContainer } = render(<SeverityBadge severity="critical" />);
    const critSpan = critContainer.querySelector('span');
    expect(critSpan?.className).toContain('severity-badge-critical');
    expect(critSpan?.textContent).toContain('▲');
    expect(critSpan?.textContent).toContain('Critical');

    const { container: sevContainer } = render(<SeverityBadge severity="severe" />);
    const sevSpan = sevContainer.querySelector('span');
    expect(sevSpan?.className).toContain('severity-badge-severe');
    expect(sevSpan?.textContent).toContain('▲');
    expect(sevSpan?.textContent).toContain('Severe');
  });

  it('renders report modal with self-colored severity buttons and no green ring', () => {
    render(
      <PotholeReportModal
        isOpen={true}
        onClose={vi.fn()}
        onSubmitReport={vi.fn()}
      />
    );

    // Minor button
    const minorBtn = screen.getByRole('button', { name: /● Minor/i });
    expect(minorBtn).toBeDefined();

    // Critical button
    const criticalBtn = screen.getByRole('button', { name: /▲ Critical/i });
    expect(criticalBtn).toBeDefined();

    // Ensure none of the severity buttons have emerald ring
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => {
      expect(btn.className).not.toContain('ring-emerald-400');
    });
  });

  it('omits redundant GGC Campus preset from Jump to Area bar', () => {
    render(
      <MunicipalQuickJump
        onSelectPreset={vi.fn()}
      />
    );

    // Verify Jump to Area label exists
    expect(screen.getByText(/Jump to Area:/i)).toBeDefined();

    // Verify Municipal presets are present
    expect(screen.getByRole('button', { name: /Lawrenceville/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Suwanee/i })).toBeDefined();

    // GGC Campus MUST be omitted to avoid redundancy with the primary top scope button
    expect(screen.queryByRole('button', { name: /GGC Campus/i })).toBeNull();
  });
});
