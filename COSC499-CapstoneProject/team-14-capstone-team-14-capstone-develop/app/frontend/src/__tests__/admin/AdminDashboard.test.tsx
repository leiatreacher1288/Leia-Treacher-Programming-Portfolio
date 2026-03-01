import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import DashboardPage from '../../pages/admin/adminDashboard';
import * as adminApi from '../../api/adminApi';

// Mock the admin API
vi.mock('../../api/adminApi', () => ({
  getStats: vi.fn(),
  recentActivity: {
    list: vi.fn(),
  },
}));

describe('AdminDashboard', () => {
  const mockStats = {
    total_users: 10,
    active_users: 8,
    pending_users: 2,
    total_exams: 5,
    total_questions: 50,
    total_results: 25,
    user_info: {
      username: 'admin@test.com',
      email: 'admin@test.com',
      name: 'Test Admin',
      is_superuser: true,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock recentActivity.list to return successful response
    vi.mocked(adminApi.recentActivity.list).mockResolvedValue({
      success: true,
      data: {
        activities: [
          {
            id: '1',
            user_name: 'Test User',
            user_email: 'test@example.com',
            action: 'User Login',
            description: 'User logged in successfully',
            timestamp: '2024-01-15T10:30:00Z',
            type: 'login',
            severity: 'info',
          },
        ],
        count: 1,
        last_updated: '2024-01-15T10:30:00Z',
      },
    });
  });

  test('renders admin dashboard with stats', async () => {
    vi.mocked(adminApi.getStats).mockResolvedValue(mockStats);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(
      () => {
        expect(screen.getByText('System Analytics')).toBeInTheDocument();
      },
      { timeout: 15000 }
    );

    expect(screen.getByText('Recent Activity')).toBeInTheDocument();
  });

  test('handles API error gracefully', async () => {
    vi.mocked(adminApi.getStats).mockRejectedValue(new Error('API Error'));

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    });
  });

  test('displays loading state', () => {
    vi.mocked(adminApi.getStats).mockImplementation(
      () => new Promise(() => {})
    );

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Loading dashboard data...')).toBeInTheDocument();
  });
});
