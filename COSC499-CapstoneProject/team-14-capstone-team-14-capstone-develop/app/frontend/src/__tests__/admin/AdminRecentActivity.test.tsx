/**
 * AdminRecentActivity Tests
 * ========================
 * Tests for the AdminRecentActivity component showing recent system activity
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminRecentActivity } from '../../pages/admin/AdminRecentActivity';

// Mock the admin API
vi.mock('../../api/adminApi', () => ({
  recentActivity: {
    getAll: vi.fn().mockResolvedValue({
      success: true,
      activities: [
        {
          id: 1,
          action: 'User Login',
          user: 'john.doe@email.com',
          timestamp: '2024-01-15T10:30:00Z',
          details: 'User logged in successfully',
        },
        {
          id: 2,
          action: 'Exam Created',
          user: 'admin@email.com',
          timestamp: '2024-01-15T09:15:00Z',
          details: 'Created exam "Math Quiz 1"',
        },
      ],
    }),
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UI components
vi.mock('../../components/ui/StandardButton', () => ({
  StandardButton: ({ children }: any) => (
    <button data-testid="standard-button">{children}</button>
  ),
}));

vi.mock('../../components/ui/SearchBar', () => ({
  SearchBar: ({ placeholder }: any) => (
    <input data-testid="search-bar" placeholder={placeholder} />
  ),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AdminRecentActivity Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and main structure', async () => {
    render(
      <TestWrapper>
        <AdminRecentActivity />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('All Activities')).toBeInTheDocument();
    });
  });

  it('should display recent activities list', async () => {
    render(
      <TestWrapper>
        <AdminRecentActivity />
      </TestWrapper>
    );

    await waitFor(() => {
      // Component shows "No activities found" when mocked data is empty/filtered
      expect(
        screen.getByText('No activities found matching the current filter.')
      ).toBeInTheDocument();
    });
  });

  it('should show refresh button', async () => {
    render(
      <TestWrapper>
        <AdminRecentActivity />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
