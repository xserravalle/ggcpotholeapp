import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/render';
import { MyReportsView } from '@/components/potholes/MyReportsView';
import { PotholeReport } from '@/types/pothole';

const mockReports: PotholeReport[] = Array.from({ length: 8 }, (_, i) => ({
  id: `test-pot-${i + 1}`,
  trackingCode: `GAP-2026-TEST0${i + 1}`,
  title: `Hazard #${i + 1} on Collins Hill Rd`,
  roadName: 'Collins Hill Rd',
  address: '1000 University Center Ln',
  city: 'Lawrenceville',
  jurisdiction: 'Gwinnett County DOT',
  authorityId: 'gwinnett-dot',
  authorityName: 'Gwinnett County DOT',
  authorityEmail: 'dot@gwinnettcounty.com',
  latitude: 33.981,
  longitude: -84.005,
  severity: 'high',
  hazardType: 'POTHOLE',
  status: 'reported',
  verificationsCount: 2,
  userConfirmed: true,
  reportedAt: new Date().toISOString(),
  lastVerifiedAt: new Date().toISOString(),
  description: 'Test hazard description',
  estimatedDepthInches: 3,
  estimatedWidthInches: 18,
  surfaceType: 'Asphalt',
  damageRisk: 'Tire / Rim Damage',
  detectedBy: 'Citizen Mobile Web Docket',
  workOrderNumber: `DISP-TEST0${i + 1}`,
  source: 'user'
}));

describe('MyReportsView Component', () => {
  it('should render with internal scroll container and prevent outer page scrolling', () => {
    const { container } = render(
      <MyReportsView
        potholes={mockReports}
        onSelectPothole={vi.fn()}
        onOpenReportModal={vi.fn()}
        onNavigateToMap={vi.fn()}
      />
    );

    // Root wrapper must have h-full and overflow-hidden
    const rootElement = container.firstElementChild as HTMLElement;
    expect(rootElement.className).toContain('overflow-hidden');
    expect(rootElement.className).toContain('h-full');

    // The scrollable list container must have overflow-y-auto and overscroll-contain
    const scrollContainer = container.querySelector('.overflow-y-auto') as HTMLElement;
    expect(scrollContainer).toBeTruthy();
    expect(scrollContainer.className).toContain('overscroll-contain');
  });

  it('should toggle Show All inside the scrollable container', () => {
    render(
      <MyReportsView
        potholes={mockReports}
        onSelectPothole={vi.fn()}
        onOpenReportModal={vi.fn()}
        onNavigateToMap={vi.fn()}
      />
    );

    // Default initial count is 3 for normal font
    expect(screen.getByText('Hazard #1 on Collins Hill Rd')).toBeTruthy();
    expect(screen.getByText('Hazard #3 on Collins Hill Rd')).toBeTruthy();
    expect(screen.queryByText('Hazard #7 on Collins Hill Rd')).toBeNull();

    // Click Show All
    const showAllButton = screen.getByText(/Show All/i);
    fireEvent.click(showAllButton);

    // Now all 8 reports are rendered within the internal scroll container
    expect(screen.getByText('Hazard #7 on Collins Hill Rd')).toBeTruthy();
    expect(screen.getByText(/Show Recent/i)).toBeTruthy();
  });
});
