/*  src/__tests__/ResetPasswordFromLink.test.tsx
    ───────────────────────────────────────────── */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as authApi from '../api/auth';
import { ResetPasswordFromLink } from '../pages/ResetPasswordFromLink';
import { AuthProvider } from '../context/AuthContext';

/* ─── Mock API ──────────────────────────────────────────────────────────── */
vi.mock('../api/auth');
const { validateResetToken, resetPassword } = vi.mocked(authApi);

/* ─── Mock navigate ─────────────────────────────────────────────────────── */
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

/* ─── Helper: render page at /reset-password?uid=…&token=… ──────────────── */
function renderPage(uid: string, token: string) {
  const url = `/reset-password?uid=${uid}&token=${token}`;

  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          {/* route *without* params – query-string is enough */}
          <Route path="/reset-password" element={<ResetPasswordFromLink />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
}

/* ─── Tests ─────────────────────────────────────────────────────────────── */
describe('ResetPasswordFromLink', () => {
  beforeEach(() => vi.clearAllMocks());

  it('validates token on mount', async () => {
    validateResetToken.mockResolvedValueOnce({
      success: true,
      data: { valid: true, email: 'test@example.com' },
    });

    renderPage('u123', 'abc123');

    await waitFor(() =>
      expect(validateResetToken).toHaveBeenCalledWith('u123', 'abc123')
    );
  }, 10_000);

  it('shows error for invalid token', async () => {
    validateResetToken.mockResolvedValueOnce({
      success: false,
      error: 'Invalid reset link',
    });

    renderPage('badUID', 'badtoken');

    /* target the heading so we match a single element */
    const heading = await screen.findByRole('heading', {
      name: /invalid reset link/i,
    });
    expect(heading).toBeInTheDocument();
  }, 10_000);

  it('successfully resets password', async () => {
    validateResetToken.mockResolvedValueOnce({
      success: true,
      data: { valid: true, email: 'test@example.com' },
    });
    resetPassword.mockResolvedValueOnce({
      success: true,
      data: { message: 'Password reset successfully' },
    });

    renderPage('uidOK', 'tokOK');

    const newPwdInput = await screen.findByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);

    fireEvent.change(newPwdInput, { target: { value: 'BrandNew123!' } });
    fireEvent.change(confirmInput, { target: { value: 'BrandNew123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() =>
      expect(resetPassword).toHaveBeenCalledWith(
        'uidOK',
        'tokOK',
        'BrandNew123!'
      )
    );

    expect(
      await screen.findByText(/password reset successfully!/i)
    ).toBeInTheDocument();
  }, 11_000);

  it('shows error when passwords do not match', async () => {
    validateResetToken.mockResolvedValueOnce({
      success: true,
      data: { valid: true, email: 'test@example.com' },
    });

    renderPage('uidXYZ', 'tokXYZ');

    const newPwdInput = await screen.findByLabelText(/^new password$/i);
    const confirmInput = screen.getByLabelText(/^confirm new password$/i);

    fireEvent.change(newPwdInput, { target: { value: 'BrandNew123!' } });
    fireEvent.change(confirmInput, { target: { value: 'Mismatch123!' } });
    fireEvent.click(screen.getByRole('button', { name: /reset password/i }));

    expect(
      await screen.findByText(/passwords? do not match/i)
    ).toBeInTheDocument();
  }, 10_000);
});
