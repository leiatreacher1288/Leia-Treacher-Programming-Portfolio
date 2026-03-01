// src/__tests__/ForgotPassword.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as authApi from '../api/auth';
import { ForgotPassword } from '../pages/ForgotPassword';

// ---- Mock the auth module ----
vi.mock('../api/auth');
const forgotPassword = vi.mocked(authApi.forgotPassword);

// ---- Mock react-router-dom useNavigate ----
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('ForgotPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () =>
    render(
      <BrowserRouter>
        <ForgotPassword />
      </BrowserRouter>
    );

  it('renders forgot password form', () => {
    renderComponent();
    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send Reset Link' })
    ).toBeInTheDocument();
    expect(screen.getByText('← Back to Login')).toBeInTheDocument();
  });

  it('successfully sends reset email', async () => {
    forgotPassword.mockResolvedValueOnce({ success: true });

    renderComponent();
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(forgotPassword).toHaveBeenCalledWith('test@example.com');
      expect(
        screen.getByText(/A password reset link has been sent/)
      ).toBeInTheDocument();
      expect(emailInput).toHaveValue('');
    });
  });

  it('shows error when API fails', async () => {
    forgotPassword.mockResolvedValueOnce({
      success: false,
      error: 'User not found',
    });

    renderComponent();
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    fireEvent.change(emailInput, {
      target: { value: 'nonexistent@example.com' },
    });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument();
    });
  });

  it('shows loading state while sending', async () => {
    forgotPassword.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ success: true }), 100)
        )
    );

    renderComponent();
    const emailInput = screen.getByLabelText('Email Address');
    const submitButton = screen.getByRole('button', {
      name: 'Send Reset Link',
    });

    fireEvent.change(emailInput, {
      target: { value: 'test@example.com' },
    });
    fireEvent.click(submitButton);

    // loading state
    expect(
      screen.getByRole('button', { name: 'Sending...' })
    ).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: 'Send Reset Link' })
      ).toBeInTheDocument();
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('navigates back to login when clicking back link', () => {
    renderComponent();
    const backLink = screen.getByText('← Back to Login');
    fireEvent.click(backLink);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });
});
