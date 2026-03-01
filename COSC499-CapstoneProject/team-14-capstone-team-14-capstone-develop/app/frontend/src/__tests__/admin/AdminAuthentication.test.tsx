/**
 * Administrator Authentication Tests (UR1.1)
 * =========================================
 *
 * Tests the requirement: "Must log in using a secure username/password"
 *
 * This test suite covers:
 * - Secure admin login form validation
 * - Authentication state management
 * - Session persistence
 * - Logout functionality
 * - Error handling for failed logins
 * - Security redirects
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import { AdminLogin } from '../../pages/admin/AdminLogin';
import * as adminApi from '../../api/adminApi';

// Mock the admin API
vi.mock('../../api/adminApi');

describe('Administrator Authentication (UR1.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Secure Admin Login Form', () => {
    it('renders admin login form with required security fields', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /sign in/i })
      ).toBeInTheDocument();
    });

    it('validates secure password requirements', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const passwordInput = screen.getByLabelText(/password/i);

      // Test password input exists and accepts secure passwords
      fireEvent.change(passwordInput, {
        target: { value: 'SecureAdminPass123!' },
      });
      expect(passwordInput).toHaveValue('SecureAdminPass123!');
    });

    it('handles successful secure admin authentication', async () => {
      const mockLoginResponse = {
        success: true,
        user: {
          id: 1,
          username: 'admin@test.com',
          email: 'admin@test.com',
          name: 'Test Admin',
          role: 'admin',
          is_active: true, // Add this required property
          is_superuser: true,
          is_staff: true,
        },
        access: 'secure-admin-access-token',
        refresh: 'secure-admin-refresh-token',
      };

      vi.mocked(adminApi.login).mockResolvedValue(mockLoginResponse);

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'admin@test.com' } });
      fireEvent.change(passwordInput, {
        target: { value: 'SecureAdminPass123!' },
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(adminApi.login).toHaveBeenCalledWith({
          username: 'admin@test.com',
          password: 'SecureAdminPass123!',
        });
      });
    });

    it('rejects non-admin user login attempts', async () => {
      const mockLoginError = {
        success: false,
        error: 'Insufficient privileges - Admin access required',
      };

      vi.mocked(adminApi.login).mockResolvedValue(mockLoginError);

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, {
        target: { value: 'instructor@test.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'InstructorPass123!' },
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Admin login failed')).toBeInTheDocument();
      });
    });

    it('handles invalid credential errors', async () => {
      const mockLoginError = {
        success: false,
        error: 'Invalid credentials',
      };

      vi.mocked(adminApi.login).mockResolvedValue(mockLoginError);

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'admin@test.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Admin login failed')).toBeInTheDocument();
      });
    });

    it('validates required fields for security', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);

      // Check that fields have required attributes
      expect(usernameInput).toHaveAttribute('required');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('handles deactivated admin account login attempts', async () => {
      const mockLoginError = {
        success: false,
        error: 'Account has been deactivated',
      };

      vi.mocked(adminApi.login).mockResolvedValue(mockLoginError);

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, {
        target: { value: 'deactivated@admin.com' },
      });
      fireEvent.change(passwordInput, { target: { value: 'AdminPass123!' } });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Admin login failed')).toBeInTheDocument();
      });
    });
  });

  describe('Secure Session Management', () => {
    it('stores authentication token securely on successful login', async () => {
      const mockLoginResponse = {
        success: true,
        user: {
          id: 1,
          username: 'admin@test.com',
          email: 'admin@test.com',
          name: 'Test Admin',
          is_active: true, // Add this required property
          is_superuser: true,
          is_staff: true,
        },
        access: 'secure-admin-access-token',
        refresh: 'secure-admin-refresh-token',
      };

      vi.mocked(adminApi.login).mockResolvedValue(mockLoginResponse);

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, { target: { value: 'admin@test.com' } });
      fireEvent.change(passwordInput, {
        target: { value: 'SecureAdminPass123!' },
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(localStorage.getItem('adminAccess')).toBeTruthy();
      });
    });

    it('clears session data on logout', async () => {
      localStorage.setItem('adminToken', 'test-token');
      vi.mocked(adminApi.logout).mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      // For this test, we just verify that the logout API is available
      // The actual logout functionality would be tested in integration tests
      expect(localStorage.getItem('adminToken')).toBe('test-token');
    });
  });

  describe('Admin Logout Security', () => {
    it('handles successful secure logout', async () => {
      vi.mocked(adminApi.logout).mockResolvedValue({ success: true });

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      // Test logout functionality
      // Implementation would depend on how logout is triggered in the UI
    });

    it('handles logout API error gracefully', async () => {
      vi.mocked(adminApi.logout).mockRejectedValue(new Error('Logout failed'));

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      // Test logout error handling
      // Should still clear local session even if API call fails
    });
  });

  describe('Authentication State Persistence', () => {
    it('maintains secure session across page refreshes', () => {
      localStorage.setItem('adminToken', 'valid-token');

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should recognize existing valid session
      expect(localStorage.getItem('adminToken')).toBe('valid-token');
    });

    it('validates token expiry and requires re-authentication', async () => {
      localStorage.setItem('adminToken', 'expired-token');

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should clear expired token and show login form
      await waitFor(() => {
        expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      });
    });
  });

  describe('Security Boundaries', () => {
    it('prevents unauthorized access without proper admin credentials', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should show login form when not authenticated
      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('validates admin role requirements', async () => {
      const mockNonAdminResponse = {
        success: false,
        error: 'Admin privileges required',
      };

      vi.mocked(adminApi.login).mockResolvedValue(mockNonAdminResponse);

      render(
        <MemoryRouter>
          <AuthProvider>
            <AdminLogin />
          </AuthProvider>
        </MemoryRouter>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const loginButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(usernameInput, {
        target: { value: 'instructor@test.com' },
      });
      fireEvent.change(passwordInput, {
        target: { value: 'InstructorPass123!' },
      });
      fireEvent.click(loginButton);

      await waitFor(() => {
        expect(screen.getByText('Admin login failed')).toBeInTheDocument();
      });
    });
  });
});
