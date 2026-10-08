import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '../helpers/render';
import { DriveSensorView } from '../../src/components/sensor/DriveSensorView';
import * as audioAlertService from '../../src/services/audioAlertService';

// Mock canvas getContext
HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
  fillStyle: '',
  fillRect: vi.fn(),
  strokeStyle: '',
  lineWidth: 1,
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  stroke: vi.fn(),
  fillText: vi.fn(),
  font: ''
})) as any;

describe('DriveSensorView Audio Warnings & Visual Countdown', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders audio mute toggle button and toggles state without crashing', () => {
    render(<DriveSensorView />);

    const muteBtn = screen.getByRole('button', { name: /mute hazard alerts/i });
    expect(muteBtn).toBeInTheDocument();
    expect(muteBtn).toHaveTextContent(/audio alerts on/i);

    // Toggle mute
    fireEvent.click(muteBtn);
    expect(muteBtn).toHaveTextContent(/alerts muted/i);
    expect(localStorage.getItem('ggc-pothole-sensor-audio-muted')).toBe('true');

    // Toggle back
    fireEvent.click(muteBtn);
    expect(muteBtn).toHaveTextContent(/audio alerts on/i);
    expect(localStorage.getItem('ggc-pothole-sensor-audio-muted')).toBe('false');
  });

  it('triggers audio alert and visual countdown when simulating hazard approach', () => {
    vi.useFakeTimers();
    const playWarningSpy = vi.spyOn(audioAlertService, 'playHazardWarning');

    render(<DriveSensorView />);

    const simulateApproachBtn = screen.getByRole('button', { 
      name: /simulate hazard approach \(audio & countdown demo\)/i 
    });
    expect(simulateApproachBtn).toBeInTheDocument();

    // Trigger approach simulation
    act(() => {
      fireEvent.click(simulateApproachBtn);
    });

    // Step 1: 200ft approaching
    expect(screen.getByRole('region', { name: /hazard ahead warning/i })).toBeInTheDocument();
    expect(screen.getByTestId('countdown-200ft')).toHaveClass('ring-2');
    expect(playWarningSpy).toHaveBeenCalledTimes(1);
    expect(playWarningSpy).toHaveBeenCalledWith(210, { muted: false });

    // Advance 1.8s to Step 2: 100ft
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByTestId('countdown-100ft')).toHaveClass('ring-2');

    // Advance another 1.8s to Step 3: Pass
    act(() => {
      vi.advanceTimersByTime(1800);
    });
    expect(screen.getByTestId('countdown-pass')).toHaveClass('ring-2');

    vi.useRealTimers();
  });

  it('suppresses audio warning when muted while maintaining visual countdown', () => {
    vi.useFakeTimers();
    const playWarningSpy = vi.spyOn(audioAlertService, 'playHazardWarning');

    render(<DriveSensorView />);

    // Mute first
    const muteBtn = screen.getByRole('button', { name: /mute hazard alerts/i });
    fireEvent.click(muteBtn);
    expect(muteBtn).toHaveTextContent(/alerts muted/i);

    // Trigger approach simulation
    const simulateApproachBtn = screen.getByRole('button', { 
      name: /simulate hazard approach \(audio & countdown demo\)/i 
    });

    act(() => {
      fireEvent.click(simulateApproachBtn);
    });

    // Audio was NOT called
    expect(playWarningSpy).not.toHaveBeenCalled();

    // Visual countdown IS visible
    expect(screen.getByRole('region', { name: /hazard ahead warning/i })).toBeInTheDocument();
    expect(screen.getByText(/audio muted/i)).toBeInTheDocument();
    expect(screen.getByTestId('countdown-200ft')).toBeInTheDocument();

    vi.useRealTimers();
  });
});
