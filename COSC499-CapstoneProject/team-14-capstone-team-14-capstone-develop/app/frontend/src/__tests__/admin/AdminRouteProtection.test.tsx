import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import AdminDashboard from '../../pages/admin/adminDashboard';
import type { AuthContextType } from '../../context/AuthContext';
import { getStats, recentActivity } from '../../api/adminApi';

// Mock the admin API
vi.mock('../../api/adminApi', () => ({
  getStats: vi.fn(),
  recentActivity: {
    list: vi.fn(),
  },
  default: {
    getStats: vi.fn(),
    recentActivity: {
      list: vi.fn(),
    },
  },
}));

// Mock the auth context
vi.mock('../../context/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  useAuth: vi.fn(),
}));

const mockUseAuth = vi.mocked(useAuth);
const mockGetStats = vi.mocked(getStats);
const mockRecentActivityList = vi.mocked(recentActivity.list);

describe('AdminRouteProtection', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock recentActivity.list to return an empty response
    mockRecentActivityList.mockResolvedValue({
      success: true,
      data: {
        activities: [],
        count: 0,
        last_updated: new Date().toISOString(),
      },
    });
  });

  describe('Unauthenticated Access', () => {
    test('redirects to login when accessing admin routes without authentication', () => {
      // Mock unauthenticated state
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: false,
        adminUser: null,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: false,
      } as AuthContextType);

      render(
        <MemoryRouter initialEntries={['/admin-panel/dashboard']}>
          <AuthProvider>
            <AdminDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should redirect to login or show unauthorized message
      expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    });

    test('shows loading state during authentication check', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: false,
        adminUser: null,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: true,
      } as AuthContextType);

      render(
        <MemoryRouter initialEntries={['/admin-panel/dashboard']}>
          <AuthProvider>
            <AdminDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('Authenticated Access', () => {
    test('allows access to admin routes when authenticated as admin', async () => {
      const mockAdminUser = {
        id: 1,
        username: 'admin@test.com',
        email: 'admin@test.com',
        name: 'Test Admin',
        is_superuser: true,
        is_staff: true,
        is_active: true,
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: true,
        adminUser: mockAdminUser,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: false,
      } as AuthContextType);

      mockGetStats.mockResolvedValue({
        total_users: 10,
        total_exams: 5,
        total_questions: 50,
        total_results: 25,
        user_info: {
          username: 'admin@test.com',
          email: 'admin@test.com',
          name: 'Test Admin',
          is_superuser: true,
        },
      });

      render(
        <MemoryRouter initialEntries={['/admin-panel/dashboard']}>
          <AuthProvider>
            <AdminDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/system analytics/i)).toBeInTheDocument();
      });
    });

    test('denies access to admin routes for non-admin users', () => {
      const mockRegularUser = {
        id: 2,
        username: 'instructor@test.com',
        email: 'instructor@test.com',
        name: 'Test Instructor',
        is_superuser: false,
        is_staff: false,
        is_active: true,
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: false,
        adminUser: mockRegularUser,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: false,
      } as AuthContextType);

      render(
        <MemoryRouter initialEntries={['/admin-panel/dashboard']}>
          <AuthProvider>
            <AdminDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
    });

    test('allows superuser access to admin dashboard', async () => {
      const mockSuperUser = {
        id: 1,
        username: 'superuser@test.com',
        email: 'superuser@test.com',
        name: 'Super Admin',
        is_superuser: true,
        is_staff: true,
        is_active: true,
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: true,
        adminUser: mockSuperUser,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: false,
      } as AuthContextType);

      mockGetStats.mockResolvedValue({
        total_users: 10,
        total_exams: 5,
        total_questions: 50,
        total_results: 25,
        user_info: {
          username: 'superuser@test.com',
          email: 'superuser@test.com',
          name: 'Super Admin',
          is_superuser: true,
        },
      });

      // Test access to admin dashboard
      render(
        <MemoryRouter initialEntries={['/admin-panel/dashboard']}>
          <AuthProvider>
            <AdminDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should not be blocked for superuser
      await waitFor(() => {
        expect(screen.getByText(/system analytics/i)).toBeInTheDocument();
      });
    });

    test('allows staff user access to admin dashboard', async () => {
      const mockStaffUser = {
        id: 2,
        username: 'staff@test.com',
        email: 'staff@test.com',
        name: 'Staff Admin',
        is_superuser: false,
        is_staff: true,
        is_active: true,
      };

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: true,
        adminUser: mockStaffUser,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: false,
      } as AuthContextType);

      mockGetStats.mockResolvedValue({
        total_users: 5,
        total_exams: 2,
        total_questions: 20,
        total_results: 10,
        user_info: {
          username: 'staff@test.com',
          email: 'staff@test.com',
          name: 'Staff Admin',
          is_superuser: false,
        },
      });

      render(
        <MemoryRouter initialEntries={['/admin-panel/dashboard']}>
          <AuthProvider>
            <AdminDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      // Staff should have access to dashboard but may have limited features
      await waitFor(() => {
        expect(screen.getByText(/system analytics/i)).toBeInTheDocument();
      });
    });
  });
});
