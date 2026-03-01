/**
 * AdminUserCreate Tests
 * ====================
 * Tests for the AdminUserCreate component for creating new users
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AdminCreateUser } from '../../pages/admin/AdminCreateUser';

// Mock the admin API
vi.mock('../../api/adminApi', () => ({
  users: {
    create: vi.fn().mockResolvedValue({
      success: true,
      user: {
        id: 1,
        username: 'newuser',
        email: 'newuser@email.com',
        first_name: 'New',
        last_name: 'User',
      },
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

vi.mock('../../components/forms/FormInput', () => ({
  FormInput: ({ label, name }: any) => (
    <div>
      <label>{label}</label>
      <input data-testid={`input-${name}`} name={name} />
    </div>
  ),
}));

// Test wrapper component
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('AdminUserCreate Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render page title and form structure', async () => {
    render(
      <TestWrapper>
        <AdminCreateUser />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Create New User')).toBeInTheDocument();
    });
  });

  it('should display user creation form fields', async () => {
    render(
      <TestWrapper>
        <AdminCreateUser />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('user@example.com')
      ).toBeInTheDocument();
      expect(screen.getByPlaceholderText('John Doe')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter password')).toBeInTheDocument();
      // Role select field - find by option text content
      expect(screen.getByText('Instructor')).toBeInTheDocument();
    });
  });

  it('should show create user button', async () => {
    render(
      <TestWrapper>
        <AdminCreateUser />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Create User')).toBeInTheDocument();
    });
  });
});
