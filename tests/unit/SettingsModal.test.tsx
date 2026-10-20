import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../helpers/render';
import { SettingsModal } from '@/components/common/SettingsModal';
import { AccessibilityProvider } from '@/context/AccessibilityContext';

describe('SettingsModal Component', () => {
  it('should render when open', () => {
    render(
      <AccessibilityProvider>
        <SettingsModal isOpen={true} onClose={vi.fn()} />
      </AccessibilityProvider>
    );

    expect(screen.getByText('Settings & Accessibility')).toBeTruthy();
    expect(screen.getByText('Done')).toBeTruthy();
    expect(screen.getByText('Cancel')).toBeTruthy();
  });

  it('should not render when isOpen is false', () => {
    const { container } = render(
      <AccessibilityProvider>
        <SettingsModal isOpen={false} onClose={vi.fn()} />
      </AccessibilityProvider>
    );

    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should revert previewed font changes when Cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <AccessibilityProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </AccessibilityProvider>
    );

    // Click 'A++' (huge font)
    const hugeButton = screen.getByText('A++');
    fireEvent.click(hugeButton);
    expect(document.documentElement.style.fontSize).toBe('24px');

    // Click 'Cancel'
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
    // Default was '16px' (normal)
    expect(document.documentElement.style.fontSize).toBe('16px');
  });

  it('should commit changes when Done is clicked', () => {
    const onClose = vi.fn();
    render(
      <AccessibilityProvider>
        <SettingsModal isOpen={true} onClose={onClose} />
      </AccessibilityProvider>
    );

    // Click 'Dark Modern' theme
    const darkThemeButton = screen.getByText('Dark Modern');
    fireEvent.click(darkThemeButton);

    // Click 'Done'
    const doneButton = screen.getByText('Done');
    fireEvent.click(doneButton);

    expect(onClose).toHaveBeenCalled();
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
  });
});
