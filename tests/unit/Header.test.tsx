import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../helpers/render';
import { Header } from '@/components/Header';

describe('Header Component', () => {
  const mockProps = {
    activeTab: 'potholes' as const,
    setActiveTab: vi.fn(),
    onOpenReportModal: vi.fn(),
    potholeCount: 42,
    criticalPotholeCount: 3,
    campusPotholeCount: 15,
    congestedLotsCount: 2,
    simulationTime: '2026-09-22 14:30',
  };

  it('should render without crashing', () => {
    const { container } = render(<Header {...mockProps} />);
    expect(container).toBeTruthy();
  });

  it('should render header element', () => {
    const { container } = render(<Header {...mockProps} />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });

  it('should render primary navigation tabs', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('Home')).toBeTruthy();
    expect(screen.getByText('Map')).toBeTruthy();
    expect(screen.getByText('Report')).toBeTruthy();
    expect(screen.getByText('My Reports')).toBeTruthy();
  });
});
