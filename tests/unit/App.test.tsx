import React from 'react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }: any) => <div data-testid="map">{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  Circle: () => null,
  useMap: () => ({ on: vi.fn(), fitBounds: vi.fn() }),
  useMapEvent: () => null,
}));

vi.mock('@/components/potholes/PotholeMapView', () => ({
  PotholeMapView: () => <div data-testid="pothole-map">Map</div>,
}));

import { render } from '../helpers/render';
import App from '@/App';

describe('App Component', () => {
  it('should render without crashing', () => {
    const { container } = render(<App />);
    expect(container).toBeTruthy();
  });

  it('should render the main application structure', () => {
    const { container } = render(<App />);
    const header = container.querySelector('header');
    expect(header).toBeTruthy();
  });
});
