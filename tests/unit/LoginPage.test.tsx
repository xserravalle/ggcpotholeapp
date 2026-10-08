import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '../helpers/render';
import { LoginPage } from '../../src/components/auth/LoginPage';

describe('LoginPage Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders login form inputs and submit button', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    expect(screen.getByLabelText(/official email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in to operations hub/i })).toBeInTheDocument();
  });

  it('displays error if submitted with empty fields', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    const submitBtn = screen.getByRole('button', { name: /sign in to operations hub/i });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/email address is required/i);
  });

  it('displays error if email format is invalid', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    const emailInput = screen.getByLabelText(/official email address/i);
    const passInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in to operations hub/i });

    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.change(passInput, { target: { value: 'validPassword123' } });
    fireEvent.click(submitBtn);

    expect(screen.getByRole('alert')).toHaveTextContent(/please enter a valid email address/i);
  });

  it('calls onLoginSuccess with session on valid login', () => {
    const onLoginSuccess = vi.fn();
    render(<LoginPage onLoginSuccess={onLoginSuccess} />);

    const emailInput = screen.getByLabelText(/official email address/i);
    const passInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in to operations hub/i });

    fireEvent.change(emailInput, { target: { value: 'dispatcher@ggc.edu' } });
    fireEvent.change(passInput, { target: { value: 'correctPass123' } });
    fireEvent.click(submitBtn);

    expect(onLoginSuccess).toHaveBeenCalledTimes(1);
    expect(onLoginSuccess).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'dispatcher@ggc.edu',
        role: 'Dispatcher'
      })
    );
  });

  it('populates fields when clicking quick fill demo buttons', () => {
    render(<LoginPage onLoginSuccess={vi.fn()} />);

    const quickFillDispatcher = screen.getByRole('button', { name: /quick fill: dispatcher demo/i });
    fireEvent.click(quickFillDispatcher);

    const emailInput = screen.getByLabelText(/official email address/i) as HTMLInputElement;
    expect(emailInput.value).toBe('dispatcher@ggc.edu');
  });
});
