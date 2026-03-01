// src/__tests__/Signup.test.tsx
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Signup } from '../pages/Signup';
import { renderWithProviders } from '../test/test-utils';
import * as authApi from '../api/auth';

// Mock the API call
vi.mock('../api/auth');

describe('Signup page', () => {
  it('shows error when email is already registered', async () => {
    // Mock duplicate email error
    vi.mocked(authApi.registerInstructor).mockResolvedValue({
      success: false,
      error: 'Email already registered',
    });

    renderWithProviders(<Signup />);

    await screen.findByLabelText(/first name/i);
    /* ――― fill in the form ――― */
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'existing@demo.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Password1!');
    await userEvent.type(
      screen.getByLabelText(/confirm password/i),
      'Password1!'
    );

    /* ――― submit ――― */
    await userEvent.click(screen.getByRole('button', { name: /sign up/i }));

    /* ――― error message appears ――― */
    expect(
      await screen.findByText(/this email is already registered/i)
    ).toBeInTheDocument();
  }, 15000);

  it('shows password validation criteria', async () => {
    renderWithProviders(<Signup />);

    await screen.findByLabelText(/first name/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    // Type a weak password
    await userEvent.type(passwordInput, 'weak');

    // Check that validation criteria appear
    expect(screen.getByText(/at least 8 characters long/i)).toBeInTheDocument();
    expect(
      screen.getByText(/at least 1 uppercase letter/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/at least 1 lowercase letter/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/at least 1 number/i)).toBeInTheDocument();
    expect(
      screen.getByText(/at least 1 special character/i)
    ).toBeInTheDocument();
  });
});
