// src/__tests__/VerifyEmail.test.tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import * as authApi from '../api/auth';
import { AuthProvider } from '../context/AuthContext';
import { TooltipProvider } from '../components/ui/Tooltip';
import { VerifyEmail } from '../pages/VerifyEmail';

vi.mock('../api/auth');

describe('VerifyEmail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function renderPage(token: string | null) {
    // build the path (with or without the ?token=… query)
    const path = `/verify-email${token ? `?token=${token}` : ''}`;

    render(
      <AuthProvider>
        <TooltipProvider delayDuration={100} skipDelayDuration={200}>
          <MemoryRouter initialEntries={[path]}>
            <Routes>
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Routes>
          </MemoryRouter>
        </TooltipProvider>
      </AuthProvider>
    );
  }

  it('shows error if no token in URL', async () => {
    renderPage(null);
    expect(
      await screen.findByText(/verification token required/i)
    ).toBeInTheDocument();
  });

  it('shows invalid error on bad token', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: false,
      error: 'Invalid verification token',
    });

    renderPage('bad-token');
    expect(
      await screen.findByText(/invalid verification token/i)
    ).toBeInTheDocument();
  });

  it('shows success and “go to login” button on good token', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: true,
      data: { message: 'Email verified successfully!' },
    });

    renderPage('good-token');
    expect(
      await screen.findByText(/email verified successfully!/i)
    ).toBeInTheDocument();

    // Verify your UI shows a “Go to Login” button (adjust the text if yours differs)
    expect(screen.getByRole('button', { name: /go to login/i })).toBeEnabled();
  });

  it('shows expired error when token is expired', async () => {
    vi.mocked(authApi.verifyEmail).mockResolvedValue({
      success: false,
      error: 'Verification link has expired',
    });

    renderPage('expired-token');
    expect(
      await screen.findByText(/verification link has expired/i)
    ).toBeInTheDocument();
  });
});
