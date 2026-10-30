import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '../helpers/render';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { AuthModal } from '@/components/common/AuthModal';

describe('AuthContext and AuthModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should default to guest role and isAdmin false', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });

    expect(result.current.user.role).toBe('guest');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoggedIn).toBe(false);
  });

  it('should authenticate admin with valid passcode', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });

    act(() => {
      const authResult = result.current.loginAsAdmin('admin');
      expect(authResult.success).toBe(true);
    });

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.user.role).toBe('admin');
  });

  it('should reject admin login with invalid passcode', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });

    act(() => {
      const authResult = result.current.loginAsAdmin('wrong-passcode');
      expect(authResult.success).toBe(false);
    });

    expect(result.current.isAdmin).toBe(false);
  });

  it('should login commuter user and persist profile', () => {
    const { result } = renderHook(() => useAuth(), {
      wrapper: ({ children }) => <AuthProvider>{children}</AuthProvider>
    });

    act(() => {
      result.current.loginAsUser('student@ggc.edu', 'Alex Grizzly');
    });

    expect(result.current.user.role).toBe('user');
    expect(result.current.user.email).toBe('student@ggc.edu');
    expect(result.current.user.displayName).toBe('Alex Grizzly');
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.isLoggedIn).toBe(true);
  });

  it('should render AuthModal and allow switching tabs', () => {
    render(
      <AuthProvider>
        <AuthModal isOpen={true} onClose={vi.fn()} />
      </AuthProvider>
    );

    expect(screen.getByText('Sign In / Role Access')).toBeTruthy();
    expect(screen.getByText('Admin')).toBeTruthy();
    expect(screen.getByText('Citizen')).toBeTruthy();
    expect(screen.getByText('Agency Crew (Demo)')).toBeTruthy();

    // Switch to Citizen Tab
    fireEvent.click(screen.getByText('Citizen'));
    expect(screen.getByPlaceholderText('student@ggc.edu')).toBeTruthy();
  });
});
