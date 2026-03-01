import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import * as authApi from '../api/auth';
import { ChangePassword } from '../pages/ChangePassword';

/* ─── Mocks ──────────────────────────────────────────────────────────────── */
vi.mock('../api/auth');
const changePassword = vi.mocked(authApi.changePassword);

const mockUser = { email: 'test@example.com', name: 'Test User' };
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
    loading: false,
  }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom'
    );
  return { ...actual, useNavigate: () => mockNavigate };
});

/* ─── Helpers ────────────────────────────────────────────────────────────── */
const renderComponent = () =>
  render(
    <BrowserRouter>
      <ChangePassword />
    </BrowserRouter>
  );

/* ─── Tests ──────────────────────────────────────────────────────────────── */
describe('ChangePassword', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders change password form with user email', () => {
    renderComponent();
    expect(screen.getByDisplayValue('test@example.com')).toBeDisabled();
  });

  it('successfully changes password', async () => {
    changePassword.mockResolvedValueOnce({
      success: true,
      data: { message: 'Password changed successfully' },
    });

    renderComponent();
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'OldPass123!' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    await waitFor(() =>
      expect(changePassword).toHaveBeenCalledWith('OldPass123!', 'NewPass123!')
    );

    expect(
      await screen.findByText('Password changed successfully! Redirecting...')
    ).toBeInTheDocument();

    await waitFor(
      () => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'),
      { timeout: 3000 }
    );
  }, 10000);

  it('shows error when current password is incorrect', async () => {
    changePassword.mockResolvedValueOnce({
      success: false,
      error: 'Current password is incorrect',
    });

    renderComponent();
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'WrongPass123!' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      await screen.findByText('Current password is incorrect')
    ).toBeInTheDocument();
  }, 10000);

  it('shows error when passwords do not match', () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'OldPass123!' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'NewPass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'DifferentPass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(screen.getByText('New passwords do not match')).toBeInTheDocument();
  });

  it('shows error when new password same as current', () => {
    renderComponent();
    fireEvent.change(screen.getByLabelText('Current Password'), {
      target: { value: 'SamePass123!' },
    });
    fireEvent.change(screen.getByLabelText('New Password'), {
      target: { value: 'SamePass123!' },
    });
    fireEvent.change(screen.getByLabelText('Confirm New Password'), {
      target: { value: 'SamePass123!' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));

    expect(
      screen.getByText('New password must be different from current password')
    ).toBeInTheDocument();
  });

  it('navigates to forgot password when link clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('Forgot current password?'));
    expect(mockNavigate).toHaveBeenCalledWith('/forgot-password');
  });

  it('navigates back when back button clicked', () => {
    renderComponent();
    fireEvent.click(screen.getByText('← Back'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
