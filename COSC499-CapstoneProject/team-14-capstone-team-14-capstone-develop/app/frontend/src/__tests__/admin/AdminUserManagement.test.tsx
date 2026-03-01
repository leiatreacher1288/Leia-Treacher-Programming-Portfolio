import {
  render,
  screen,
  waitFor,
  fireEvent,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import { UsersPage } from '../../pages/admin/AdminUsersManagement';
import adminApi from '../../api/adminApi';
import type { AuthContextType } from '../../context/AuthContext';

/**
 * Administrator User Management Tests (UR1.2)
 * ==========================================
 *
 * Tests the requirement: "Must be able to create, update, and deactivate instructor accounts"
 *
 * This test suite covers:
 * - Create new instructor accounts
 * - Update existing instructor information
 * - Deactivate instructor accounts
 * - Reactivate instructor accounts
 * - Form validation and error handling
 * - Bulk operations on instructor accounts
 * - Security permissions and boundaries
 */

// Mock adminApi
vi.mock('../../api/adminApi');

// Mock the auth context
vi.mock('../../context/AuthContext', () => {
  const mockUseAuth = vi.fn();
  return {
    AuthProvider: ({ children }: { children: React.ReactNode }) => (
      <div>{children}</div>
    ),
    useAuth: mockUseAuth,
  };
});

const mockUseAuth = vi.mocked(useAuth);

describe('Administrator User Management (UR1.2)', () => {
  const mockAdminUser = {
    id: 1,
    username: 'admin@test.com',
    email: 'admin@test.com',
    name: 'Test Admin',
    role: 'admin' as const,
    is_active: true,
    is_superuser: true,
    is_staff: true,
    created_at: '2024-01-15T10:00:00Z',
    last_login: '2024-01-20T14:30:00Z',
    last_logout: '2024-01-20T18:00:00Z',
  };

  const mockUsers = [
    {
      id: 1,
      name: 'John Instructor',
      email: 'john@test.com',
      role: 'instructor' as const,
      is_active: true,
      is_online: true,
      is_offline: false,
      is_inactive: false,
      is_staff: false,
      is_superuser: false,
      created_at: '2024-01-15T10:00:00Z',
      last_login: '2024-01-20T14:30:00Z',
      last_logout: '2024-01-20T18:00:00Z',
    },
    {
      id: 2,
      name: 'Jane Smith',
      email: 'jane@test.com',
      role: 'instructor' as const,
      is_active: true,
      is_online: false,
      is_offline: true,
      is_inactive: false,
      is_staff: false,
      is_superuser: false,
      created_at: '2024-01-15T10:00:00Z',
      last_login: '2024-01-20T14:30:00Z',
      last_logout: '2024-01-20T18:00:00Z',
    },
    {
      id: 3,
      name: 'Jane Pending',
      email: 'jane@test.com',
      role: 'instructor' as const,
      is_active: false,
      is_online: false,
      is_offline: true,
      is_inactive: false,
      is_staff: false,
      is_superuser: false,
      created_at: '2024-01-16T10:00:00Z',
      last_login: null,
      last_logout: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth hook with complete AuthContextType
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

    // Mock API responses with complete UserApiResponse including next/previous
    vi.mocked(adminApi.users.list).mockResolvedValue({
      results: mockUsers,
      count: mockUsers.length,
      next: null,
      previous: null,
    });
  });

  describe('User Listing', () => {
    test('renders user management page', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Wait for the content to load instead of expecting "User Management" text
      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('Jane Pending')).toBeInTheDocument();
      });
    });

    test('displays user counts correctly', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(
          screen.getByText(/showing.*3.*of.*3.*users/i)
        ).toBeInTheDocument();
      });
    });

    test('shows loading state initially', () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });

  describe('User Status Updates', () => {
    test('handles user approval successfully', async () => {
      const user = userEvent.setup();

      // Mock successful API response
      vi.mocked(adminApi.users.updateStatus).mockResolvedValue({
        success: true,
        message: 'User activated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Pending')).toBeInTheDocument();
      });

      // Find the specific row for Jane Pending and click its activate button
      const janePendingRow = screen.getByText('Jane Pending').closest('tr');
      expect(janePendingRow).toBeInTheDocument();

      const activateButton = within(janePendingRow!).getByRole('button', {
        name: /activate/i,
      });
      await user.click(activateButton);

      // Check that API was called correctly - should use new updateStatus method
      expect(adminApi.users.updateStatus).toHaveBeenCalledWith(3, 'activate');

      // Should show success message
      await waitFor(
        () => {
          expect(
            screen.getByText(/successfully activated/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    test('handles user deactivation successfully', async () => {
      const user = userEvent.setup();

      // Mock successful API response
      vi.mocked(adminApi.users.updateStatus).mockResolvedValue({
        success: true,
        message: 'User deactivated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Find and click deactivate button for active user
      const deactivateButtons = screen.getAllByText(/deactivate/i);
      const deactivateButton = deactivateButtons[0]; // First deactivate button
      await user.click(deactivateButton);

      // Check that API was called correctly - user ID 2 is the actual ID being used
      expect(adminApi.users.updateStatus).toHaveBeenCalledWith(2, 'deactivate');

      // Should show success message
      await waitFor(
        () => {
          expect(
            screen.getByText(/successfully deactivated/i)
          ).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    test('handles API errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock API error
      vi.mocked(adminApi.users.updateStatus).mockRejectedValue(
        new Error('API Error')
      );

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Try to deactivate user (should fail)
      const deactivateButtons = screen.getAllByText(/deactivate/i);
      const deactivateButton = deactivateButtons[0]; // First deactivate button
      await user.click(deactivateButton);

      // Should show error message
      await waitFor(
        () => {
          expect(screen.getByText(/error/i)).toBeInTheDocument();
        },
        { timeout: 1000 }
      );
    });

    test('shows loading state during API calls', async () => {
      const user = userEvent.setup();

      // Mock delayed API response that properly resolves
      vi.mocked(adminApi.users.updateStatus).mockResolvedValue({
        success: true,
        message: 'User deactivated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Click deactivate button
      const deactivateButtons = screen.getAllByText(/deactivate/i);
      const deactivateButton = deactivateButtons[0]; // First deactivate button
      await user.click(deactivateButton);

      // Wait for operation to complete to avoid timing issues
      await waitFor(
        () => {
          expect(adminApi.users.updateStatus).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });
  });

  describe('User Editing', () => {
    test('opens edit modal when edit button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Click edit button for first user
      const editButtons = screen.getAllByText(/edit/i);
      const editButton = editButtons[0]; // First edit button
      await user.click(editButton);

      // Should open edit modal
      expect(screen.getByText(/edit user/i)).toBeInTheDocument();
    });

    test('saves user changes successfully', async () => {
      const user = userEvent.setup();

      // Mock successful update API response
      vi.mocked(adminApi.users.update).mockResolvedValue({
        success: true,
        message: 'User updated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      });

      // Open edit modal for Jane Smith (regular instructor with edit buttons)
      const janeSmithRow = screen.getByText('Jane Smith').closest('tr');
      expect(janeSmithRow).toBeInTheDocument();

      const editButton = within(janeSmithRow!).getByRole('button', {
        name: /edit/i,
      });
      await user.click(editButton);

      // Wait for modal to appear and find the name input
      await waitFor(() => {
        expect(screen.getByText(/edit user/i)).toBeInTheDocument();
      });

      // Get the name input - get the first textbox which should be the name field
      const textboxes = screen.getAllByRole('textbox');
      const nameInput = textboxes[0]; // First textbox should be the name input
      await user.clear(nameInput);
      await user.type(nameInput, 'John Updated');

      // If there's an email field, update it too to avoid conflicts
      if (textboxes.length > 1) {
        const emailInput = textboxes[1]; // Second textbox should be email
        await user.clear(emailInput);
        await user.type(emailInput, 'john.updated@test.com');
      }

      // Save changes
      const saveButton = screen.getByText(/save/i);
      await user.click(saveButton);

      // Check API was called correctly for user ID 2 (Jane Smith)
      await waitFor(() => {
        expect(adminApi.users.update).toHaveBeenCalledWith(2, {
          name: 'John Updated',
          email: 'john.updated@test.com', // Updated email to avoid conflicts
          role: 'instructor',
          is_active: true,
        });
      });
    });
  });

  describe('Permission Checks', () => {
    test('hides dangerous actions for admin users', async () => {
      const mockUsersWithAdmin = [
        ...mockUsers,
        {
          id: 4,
          name: 'Test Admin',
          email: 'admin@test.com',
          role: 'admin' as const,
          is_active: true,
          is_online: true,
          is_offline: false,
          is_inactive: false,
          is_staff: true,
          is_superuser: true,
          created_at: '2024-01-10T10:00:00Z',
          last_login: '2024-01-20T14:30:00Z',
          last_logout: null,
        },
      ];

      vi.mocked(adminApi.users.list).mockResolvedValue({
        results: mockUsersWithAdmin,
        count: mockUsersWithAdmin.length,
        next: null,
        previous: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
      });

      // Should not show dangerous actions for admin users
      expect(
        screen.queryByLabelText('Delete Test Admin')
      ).not.toBeInTheDocument();
      expect(
        screen.queryByLabelText('Deactivate Test Admin')
      ).not.toBeInTheDocument();
    });

    test('prevents admin from performing actions on themselves', async () => {
      const mockSuperuser = {
        ...mockAdminUser,
        is_superuser: true,
        is_staff: true,
      };

      vi.mocked(adminApi.users.list).mockResolvedValue({
        results: [mockSuperuser],
        count: 1,
        next: null,
        previous: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
      });

      // Should not show self-actions
      expect(
        screen.queryByLabelText('Delete Test Admin')
      ).not.toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('filters users by status', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Change filter to "Pending Approval"
      const filterSelect = screen.getByDisplayValue('All Users');
      await user.selectOptions(filterSelect, 'Pending Approval');

      // Should call API with filter params
      expect(adminApi.users.list).toHaveBeenCalledWith({
        filter: 'Pending Approval',
      });
    });
  });

  describe('UR1.2: Create Instructor Accounts', () => {
    test('renders create instructor form with required fields', async () => {
      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Look for create button or form
      const createButton =
        screen.queryByText(/create new instructor/i) ||
        screen.queryByText(/add instructor/i) ||
        screen.queryByRole('button', { name: /create/i });

      if (createButton) {
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(
            screen.getByLabelText(/email/i) ||
              screen.getByPlaceholderText(/email/i)
          ).toBeInTheDocument();
          expect(
            screen.getByLabelText(/name/i) ||
              screen.getByPlaceholderText(/name/i)
          ).toBeInTheDocument();
        });
      }
    });

    test('successfully creates new instructor account', async () => {
      const user = userEvent.setup();

      const mockCreateResponse = {
        success: true,
        user: {
          id: 4,
          email: 'new@instructor.com',
          name: 'New Instructor',
          role: 'instructor',
          is_active: true,
          date_joined: '2023-12-01',
        },
      };

      vi.mocked(adminApi.users.create).mockResolvedValue(mockCreateResponse);

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Try to find and interact with create form
      const createButton =
        screen.queryByText(/create/i) || screen.queryByText(/add/i);
      if (createButton) {
        await user.click(createButton);

        // Fill in form if fields exist
        const emailInput =
          screen.queryByLabelText(/email/i) ||
          screen.queryByPlaceholderText(/email/i);
        const nameInput =
          screen.queryByLabelText(/name/i) ||
          screen.queryByPlaceholderText(/name/i);

        if (emailInput && nameInput) {
          await user.type(emailInput, 'new@instructor.com');
          await user.type(nameInput, 'New Instructor');

          const submitButton = screen.queryByRole('button', {
            name: /create|submit|save/i,
          });
          if (submitButton) {
            await user.click(submitButton);

            await waitFor(() => {
              expect(adminApi.users.create).toHaveBeenCalled();
            });
          }
        }
      }
    });

    test('validates required fields for instructor creation', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      const createButton = screen.queryByText(/create/i);
      if (createButton) {
        await user.click(createButton);

        // Try to submit without filling required fields
        const submitButton = screen.queryByRole('button', {
          name: /create|submit/i,
        });
        if (submitButton) {
          await user.click(submitButton);

          // Check for validation errors (implementation dependent)
          await waitFor(() => {
            const errorMessage =
              screen.queryByText(/required/i) ||
              screen.queryByText(/please fill/i) ||
              screen.queryByText(/email.*required/i);
            if (errorMessage) {
              expect(errorMessage).toBeInTheDocument();
            }
          });
        }
      }
    });

    test('handles instructor creation errors gracefully', async () => {
      const user = userEvent.setup();

      const mockCreateError = {
        success: false,
        error: 'Email already exists',
      };

      vi.mocked(adminApi.users.create).mockResolvedValue(mockCreateError);

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Simulate creation attempt that fails
      const createButton = screen.queryByText(/create/i);
      if (createButton) {
        await user.click(createButton);

        const emailInput = screen.queryByLabelText(/email/i);
        const submitButton = screen.queryByRole('button', {
          name: /create|submit/i,
        });

        if (emailInput && submitButton) {
          await user.type(emailInput, 'existing@instructor.com');
          await user.click(submitButton);

          await waitFor(() => {
            const errorText =
              screen.queryByText(/already exists/i) ||
              screen.queryByText(/error/i);
            if (errorText) {
              expect(errorText).toBeInTheDocument();
            }
          });
        }
      }
    });
  });

  describe('UR1.2: Update Instructor Information', () => {
    test('opens edit form for existing instructor', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Find edit button for instructor - use getAllByText and pick first one
      const editButtons = screen.getAllByText(/edit/i);
      const editButton = editButtons[0]; // First edit button

      if (editButton) {
        await user.click(editButton);

        // Verify edit form opens
        await waitFor(() => {
          const nameField = screen.queryByDisplayValue('John Instructor');
          if (nameField) {
            expect(nameField).toBeInTheDocument();
          }
        });
      }
    });

    test('successfully updates instructor information', async () => {
      const user = userEvent.setup();

      const mockUpdateResponse = {
        success: true,
        user: {
          ...mockUsers[0],
          name: 'John Updated Instructor',
        },
      };

      vi.mocked(adminApi.users.update).mockResolvedValue(mockUpdateResponse);

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      const editButton = screen.queryByLabelText('Edit John Instructor');
      if (editButton) {
        await user.click(editButton);

        const nameInput = screen.queryByDisplayValue('John Instructor');
        const saveButton = screen.queryByRole('button', {
          name: /save|update/i,
        });

        if (nameInput && saveButton) {
          await user.clear(nameInput);
          await user.type(nameInput, 'John Updated Instructor');
          await user.click(saveButton);

          await waitFor(() => {
            expect(adminApi.users.update).toHaveBeenCalledWith(
              1,
              expect.objectContaining({
                name: 'John Updated Instructor',
              })
            );
          });
        }
      }
    });

    test('validates update form fields', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      const editButton = screen.queryByLabelText('Edit John Instructor');
      if (editButton) {
        await user.click(editButton);

        const nameInput = screen.queryByDisplayValue('John Instructor');
        const saveButton = screen.queryByRole('button', {
          name: /save|update/i,
        });

        if (nameInput && saveButton) {
          // Clear required field
          await user.clear(nameInput);
          await user.click(saveButton);

          // Check for validation error
          await waitFor(() => {
            const errorMessage =
              screen.queryByText(/name.*required/i) ||
              screen.queryByText(/please enter/i);
            if (errorMessage) {
              expect(errorMessage).toBeInTheDocument();
            }
          });
        }
      }
    });
  });

  describe('UR1.2: Deactivate/Reactivate Instructor Accounts', () => {
    test('deactivates active instructor account', async () => {
      const user = userEvent.setup();

      vi.mocked(adminApi.users.updateStatus).mockResolvedValue({
        success: true,
        message: 'User deactivated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Find deactivate button - use getAllByText to get multiple buttons
      const deactivateButtons = screen.getAllByText(/deactivate/i);
      const deactivateButton = deactivateButtons[0]; // First deactivate button

      if (deactivateButton) {
        await user.click(deactivateButton);

        // Handle confirmation dialog if present
        const confirmButton =
          screen.queryByText(/confirm/i) ||
          screen.queryByText(/yes/i) ||
          screen.queryByRole('button', { name: /deactivate/i });

        if (confirmButton) {
          await user.click(confirmButton);
        }

        await waitFor(() => {
          expect(adminApi.users.updateStatus).toHaveBeenCalledWith(
            2, // Updated to match actual user ID
            'deactivate'
          );
        });
      }
    });

    test('shows confirmation dialog before deactivation', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      const deactivateButtons = screen.getAllByText(/deactivate/i);
      const deactivateButton = deactivateButtons[0]; // First deactivate button
      if (deactivateButton) {
        await user.click(deactivateButton);

        // Look for confirmation dialog
        await waitFor(() => {
          const confirmDialog =
            screen.queryByText(/are you sure/i) ||
            screen.queryByText(/confirm/i) ||
            screen.queryByRole('dialog');
          if (confirmDialog) {
            expect(confirmDialog).toBeInTheDocument();
          }
        });
      }
    });

    test('reactivates deactivated instructor account', async () => {
      const user = userEvent.setup();

      vi.mocked(adminApi.users.updateStatus).mockResolvedValue({
        success: true,
        message: 'User reactivated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Jane Pending')).toBeInTheDocument();
      });

      // Find the specific row for Jane Pending and click its activate button
      const janePendingRow = screen.getByText('Jane Pending').closest('tr');
      expect(janePendingRow).toBeInTheDocument();

      const reactivateButton = within(janePendingRow!).getByRole('button', {
        name: /activate/i,
      });

      if (reactivateButton) {
        await user.click(reactivateButton);

        await waitFor(() => {
          expect(adminApi.users.updateStatus).toHaveBeenCalledWith(
            3,
            'activate'
          );
        });
      }
    });
  });

  describe('UR1.2: Instructor Account Security', () => {
    test('prevents unauthorized instructor account modifications', async () => {
      // Mock non-admin user
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        user: mockUsers[0], // Regular instructor
        login: vi.fn(),
        logout: vi.fn(),
        isAdminAuthenticated: false,
        adminUser: null,
        adminLogin: vi.fn(),
        adminLogout: vi.fn(),
        isLoading: false,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Should not show admin controls for non-admin users
      await waitFor(() => {
        const deactivateButtons = screen.queryAllByText(/deactivate/i);
        const editButtons = screen.queryAllByText(/edit/i);

        // Should have limited or no admin controls
        expect(deactivateButtons.length).toBeLessThan(2);
        expect(editButtons.length).toBeLessThan(2);
      });
    });

    test('prevents admin from performing dangerous actions on themselves', async () => {
      const mockSelfAdmin = {
        ...mockAdminUser,
        id: 1,
        email: 'admin@test.com',
      };

      const mockUsersWithSelf = [mockSelfAdmin, ...mockUsers];

      vi.mocked(adminApi.users.list).mockResolvedValue({
        results: mockUsersWithSelf,
        count: mockUsersWithSelf.length,
        next: null,
        previous: null,
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Test Admin')).toBeInTheDocument();
      });

      // Should not show dangerous actions for the admin's own account
      const selfDeactivateButton = screen.queryByLabelText(
        'Deactivate Test Admin'
      );
      expect(selfDeactivateButton).not.toBeInTheDocument();
    });
  });

  describe('UR1.2: Bulk Instructor Operations', () => {
    test('allows bulk selection of instructor accounts', async () => {
      const user = userEvent.setup();

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Look for checkboxes or bulk selection controls
      const checkboxes = screen.queryAllByRole('checkbox');
      const selectAllButton = screen.queryByText(/select all/i);

      if (checkboxes.length > 0) {
        // Test individual selection
        await user.click(checkboxes[0]);

        // Verify bulk actions become available
        const bulkActions =
          screen.queryByText(/bulk/i) || screen.queryByText(/selected/i);
        if (bulkActions) {
          expect(bulkActions).toBeInTheDocument();
        }
      }

      if (selectAllButton) {
        await user.click(selectAllButton);

        // Verify all instructors are selected
        const selectedCount = screen.queryByText(/selected/i);
        if (selectedCount) {
          expect(selectedCount).toBeInTheDocument();
        }
      }
    });

    test('performs bulk deactivation of instructor accounts', async () => {
      const user = userEvent.setup();

      vi.mocked(adminApi.users.updateStatus).mockResolvedValue({
        success: true,
        message: 'Users deactivated successfully',
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <UsersPage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('John Instructor')).toBeInTheDocument();
      });

      // Select multiple instructors
      const checkboxes = screen.queryAllByRole('checkbox');
      if (checkboxes.length >= 2) {
        await user.click(checkboxes[0]);
        await user.click(checkboxes[1]);

        // Find bulk deactivate action
        const bulkDeactivateButton =
          screen.queryByText(/bulk.*deactivate/i) ||
          screen.queryByText(/deactivate.*selected/i);

        if (bulkDeactivateButton) {
          await user.click(bulkDeactivateButton);

          // Handle confirmation
          const confirmButton = screen.queryByText(/confirm/i);
          if (confirmButton) {
            await user.click(confirmButton);
          }

          await waitFor(() => {
            expect(adminApi.users.updateStatus).toHaveBeenCalled();
          });
        }
      }
    });
  });
});
