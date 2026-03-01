import { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../components/ui/StandardButton';
import {
  FiPlus,
  FiCheck,
  FiEdit2,
  FiX,
  FiActivity,
  FiPower,
  FiTrash2,
} from 'react-icons/fi';

// Import utilities and API
import { adminStyles } from '../../utils/adminStyles';
import {
  users as usersApi,
  type User,
  type UserApiResponse,
} from '../../api/adminApi';
import { adminHelpers } from '../../utils/adminHelpers';
import { useAuth } from '../../context/AuthContext';

// Fixed Status Badge Component with proper priority logic
const UserStatusBadge = ({ user }: { user: User }) => {
  // Priority 1: Check if user is deactivated by admin
  if (!user.is_active) {
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium flex items-center font-inter">
        <FiX className="w-3 h-3 mr-1" />
        Deactivated
      </span>
    );
  }

  // Priority 2: User is active - check online status
  if (user.is_online) {
    return (
      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center font-inter">
        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
        Online
      </span>
    );
  }

  // Priority 3: Check if they haven't logged in for 7+ days (but still active)
  if (user.is_inactive && user.days_since_login && user.days_since_login >= 7) {
    return (
      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium flex items-center font-inter">
        <FiActivity className="w-3 h-3 mr-1" />
        Inactive ({user.days_since_login}+ days)
      </span>
    );
  }

  // Priority 4: User is active but offline
  if (user.is_offline) {
    return (
      <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium flex items-center font-inter">
        <div className="w-2 h-2 bg-gray-500 rounded-full mr-2"></div>
        Offline
      </span>
    );
  }

  // Default: Active
  return (
    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium flex items-center font-inter">
      <FiCheck className="w-3 h-3 mr-1" />
      Active
    </span>
  );
};

const UserRoleBadge = ({ role }: { role: 'instructor' | 'admin' }) => (
  <span
    className={`px-2 py-1 rounded text-xs font-medium font-inter ${
      role === 'admin'
        ? 'bg-purple-100 text-purple-800'
        : 'bg-blue-100 text-blue-800'
    }`}
  >
    {role === 'admin' ? 'Admin' : 'Instructor'}
  </span>
);

export const UsersPage = () => {
  const { adminUser } = useAuth();
  const [filter, setFilter] = useState<string>('All Users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [totalCount, setTotalCount] = useState<number>(0);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editFormData, setEditFormData] = useState<{
    role: 'instructor' | 'admin';
    is_active: boolean;
    name: string;
    email: string;
  }>({ role: 'instructor', is_active: true, name: '', email: '' });
  const [loadingUsers, setLoadingUsers] = useState<Set<number>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string>('');

  const filterOptions = [
    'All Users',
    'Pending Approval',
    'Active',
    'Inactive',
    'Admins',
    'Instructors',
    'Superusers',
  ];

  // Helper function to check if an action is allowed on a user
  const canPerformAction = (
    user: User,
    action: 'edit' | 'delete' | 'toggle'
  ): boolean => {
    if (!adminUser) return false;

    // Can't perform actions on yourself
    if (user.id === adminUser.id) return false;

    // Can't delete admins or superusers (only instructors can be deleted)
    if (action === 'delete' && (user.is_staff || user.is_superuser)) {
      return false;
    }

    return true;
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const params = adminHelpers.buildFilterParams(filter);
      const data: UserApiResponse = await usersApi.list(params);
      setUsers(data.results);
      setTotalCount(data.count);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const toggleUserStatus = async (userId: number, currentIsActive: boolean) => {
    // Add user to loading state
    setLoadingUsers((prev) => new Set([...prev, userId]));
    setError('');
    setSuccessMessage('');

    const action = currentIsActive ? 'deactivate' : 'activate';

    // Optimistic update - update UI immediately
    const optimisticUser = users.find((u) => u.id === userId);
    if (optimisticUser) {
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_active: !currentIsActive,
                // When activating, reset inactive status and update login time
                is_inactive: !currentIsActive ? false : user.is_inactive,
                last_login: !currentIsActive
                  ? new Date().toISOString()
                  : user.last_login,
                // Reset online/offline status appropriately
                is_online: false,
                is_offline: true,
                days_since_login: !currentIsActive ? 0 : user.days_since_login,
              }
            : user
        )
      );
    }

    try {
      // Call the API
      const response = await usersApi.updateStatus(userId, action);

      // Show success message
      const actionText = currentIsActive ? 'deactivated' : 'activated';
      setSuccessMessage(`User successfully ${actionText}!`);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      console.error(`❌ Error ${action} user:`, error);

      // Revert optimistic update on error
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? {
                ...user,
                is_active: currentIsActive,
                is_inactive: optimisticUser?.is_inactive || false,
                last_login: optimisticUser?.last_login || null,
                is_online: optimisticUser?.is_online || false,
                is_offline: optimisticUser?.is_offline || true,
                days_since_login: optimisticUser?.days_since_login || null,
              }
            : user
        )
      );

      const errorMessage =
        (
          error as {
            response?: { data?: { error?: string; message?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (
          error as {
            response?: { data?: { error?: string; message?: string } };
            message?: string;
          }
        )?.response?.data?.message ||
        (error as { message?: string })?.message ||
        `Failed to ${action} user. Please try again.`;
      setError(errorMessage);
    } finally {
      // Remove user from loading state
      setLoadingUsers((prev) => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      role: user.role,
      is_active: user.is_active,
      name: user.name,
      email: user.email,
    });
  };

  const handleSaveUser = async () => {
    if (!editingUser) return;

    // Validate form data
    if (!editFormData.name || !editFormData.name.trim()) {
      setError('Name is required and cannot be empty.');
      return;
    }

    if (!editFormData.email || !editFormData.email.trim()) {
      setError('Email is required and cannot be empty.');
      return;
    }

    // Character length validation
    const trimmedName = editFormData.name.trim();
    const trimmedEmail = editFormData.email.trim();

    if (trimmedName.length < 6) {
      setError('Name must be at least 6 characters long.');
      return;
    }

    if (trimmedName.length > 25) {
      setError('Name cannot exceed 25 characters.');
      return;
    }

    if (trimmedEmail.length > 50) {
      setError('Email cannot exceed 50 characters.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    // Check for duplicate names (excluding the current user being edited)
    const existingUserWithName = users.find(
      (user) => user.name === trimmedName && user.id !== editingUser.id
    );
    if (existingUserWithName) {
      setError('A user with this name already exists.');
      return;
    }

    // Check for duplicate emails (excluding the current user being edited)
    const existingUserWithEmail = users.find(
      (user) => user.email === trimmedEmail && user.id !== editingUser.id
    );
    if (existingUserWithEmail) {
      setError('A user with this email already exists.');
      return;
    }

    try {
      await usersApi.update(editingUser.id, editFormData);
      setSuccessMessage('User updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setEditingUser(null);
      fetchUsers();
    } catch (error: unknown) {
      console.error('Error updating user:', error);
      const errorMessage =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        'Failed to update user';
      setError(errorMessage);
    }
  };

  const deleteUser = async (userId: number) => {
    if (!adminHelpers.confirmDelete('user')) {
      return;
    }

    // Optimistic update
    const deletedUser = users.find((u) => u.id === userId);
    setUsers((prev) => prev.filter((user) => user.id !== userId));
    setTotalCount((prev) => prev - 1);

    try {
      await usersApi.delete(userId);
      setSuccessMessage('User deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error: unknown) {
      // Revert on error
      if (deletedUser) {
        setUsers((prev) =>
          [...prev, deletedUser].sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          )
        );
        setTotalCount((prev) => prev + 1);
      }

      console.error('Error deleting user:', error);
      const errorMessage =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        'Failed to delete user';
      setError(errorMessage);
    }
  };

  return (
    <div className={adminStyles.pageContainer}>
      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        <StandardButton to="/admin-panel/recent-activity" color="secondary-btn">
          <FiActivity />
          Recent Activity
        </StandardButton>
        <StandardButton to="/admin-panel/users/create" color="primary-btn">
          <FiPlus />
          New User
        </StandardButton>
      </div>

      {/* Error/Success Messages */}
      <div className="mb-6">
        {error && (
          <div className={`${adminStyles.errorMessage} animate-shake`}>
            {error}
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center animate-slideIn">
            <FiCheck className="mr-2 flex-shrink-0" />
            {successMessage}
          </div>
        )}
      </div>

      {/* Filter */}
      <div className={adminStyles.filterContainer}>
        <div className={adminStyles.filterGroup}>
          <label className={adminStyles.filterLabel}>Filter:</label>
          <select
            className={adminStyles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {filterOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <span className={adminStyles.countLabel}>
          Showing {users.length} of {totalCount} users
        </span>
      </div>

      {/* Loading or Table */}
      {loading ? (
        <div className={adminStyles.loadingContainer}>
          <div className={adminStyles.loadingSpinner}></div>
          <p className={adminStyles.loadingText}>Loading users...</p>
        </div>
      ) : (
        <div className={adminStyles.tableContainer}>
          <table className={adminStyles.table}>
            <thead className={adminStyles.tableHeader}>
              <tr>
                <th className={adminStyles.tableHeaderCell}>Name</th>
                <th className={adminStyles.tableHeaderCell}>Email</th>
                <th className={adminStyles.tableHeaderCell}>Role</th>
                <th className={adminStyles.tableHeaderCell}>Status</th>
                <th className={adminStyles.tableHeaderCell}>Created</th>
                <th className={adminStyles.tableHeaderCell}>Last Login</th>
                <th className={adminStyles.tableHeaderCell}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className={`${adminStyles.tableRow} transition-all duration-300`}
                >
                  <td className={adminStyles.tableCellMedium}>{user.name}</td>
                  <td className={adminStyles.tableCellInfo}>{user.email}</td>
                  <td className={adminStyles.tableCell}>
                    <UserRoleBadge role={user.role} />
                  </td>
                  <td className={adminStyles.tableCell}>
                    <div className="transition-all duration-300">
                      <UserStatusBadge user={user} />
                    </div>
                  </td>
                  <td className={adminStyles.tableCellInfo}>
                    {adminHelpers.formatDate(user.created_at)}
                  </td>
                  <td className={adminStyles.tableCellInfo}>
                    {adminHelpers.formatDateTime(user.last_login)}
                  </td>
                  <td className={adminStyles.tableCell}>
                    <div className={adminStyles.actionGroup}>
                      {canPerformAction(user, 'toggle') && (
                        <StandardButton
                          color={
                            user.is_active ? 'secondary-btn' : 'success-btn'
                          }
                          className={`${adminStyles.actionButton} transition-all duration-200`}
                          onClick={() =>
                            toggleUserStatus(user.id, user.is_active)
                          }
                          disabled={loadingUsers.has(user.id)}
                        >
                          {loadingUsers.has(user.id) ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              {user.is_active
                                ? 'Deactivating...'
                                : 'Activating...'}
                            </>
                          ) : (
                            <>
                              <FiPower className="text-xs" />
                              {user.is_active ? 'Deactivate' : 'Activate'}
                            </>
                          )}
                        </StandardButton>
                      )}
                      {canPerformAction(user, 'edit') && (
                        <StandardButton
                          color="info-outline"
                          className={adminStyles.actionButton}
                          onClick={() => handleEditUser(user)}
                        >
                          <FiEdit2 className="text-xs" />
                          Edit
                        </StandardButton>
                      )}
                      {canPerformAction(user, 'delete') && (
                        <StandardButton
                          color="danger-btn"
                          className={adminStyles.actionButton}
                          onClick={() => deleteUser(user.id)}
                          disabled={loadingUsers.has(user.id)}
                        >
                          {loadingUsers.has(user.id) ? (
                            <>
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-1"></div>
                              Deleting...
                            </>
                          ) : (
                            <>
                              <FiTrash2 className="text-xs" />
                              Delete
                            </>
                          )}
                        </StandardButton>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className={adminStyles.emptyState}>
              No users found matching the current filter.
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-card dark:bg-card-dark rounded-lg p-6 w-96 max-w-90vw animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-heading dark:text-heading-dark">
                Edit User
              </h3>
              <button
                className="text-card-info dark:text-card-info-dark hover:text-heading dark:hover:text-heading-dark transition-colors"
                onClick={() => setEditingUser(null)}
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-heading dark:text-heading-dark">
                  Name * (6-25 characters)
                </label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  required
                  minLength={6}
                  maxLength={25}
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  placeholder="Enter user's full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-heading dark:text-heading-dark mb-1">
                  Email * (Max 50 characters)
                </label>
                <input
                  type="email"
                  value={editFormData.email}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  required
                  maxLength={50}
                  className="mt-1 block w-full p-3 border border-input-border dark:border-input-border-dark bg-card dark:bg-card-dark text-heading dark:text-heading-dark rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  placeholder="Enter user's email address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-heading dark:text-heading-dark">
                  Role
                </label>
                <select
                  className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-opacity-50"
                  value={editFormData.role}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      role: e.target.value as 'instructor' | 'admin',
                    }))
                  }
                >
                  <option value="instructor">Instructor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                <input
                  type="checkbox"
                  id="active-checkbox"
                  checked={editFormData.is_active}
                  onChange={(e) =>
                    setEditFormData((prev) => ({
                      ...prev,
                      is_active: e.target.checked,
                    }))
                  }
                  className="w-4 h-4 text-primary-btn bg-gray-100 border-gray-300 rounded focus:ring-primary-btn dark:focus:ring-primary-btn dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                />
                <label
                  htmlFor="active-checkbox"
                  className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Active User
                </label>
                {!editFormData.is_active && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (User will be deactivated)
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <StandardButton
                color="secondary-btn"
                onClick={() => setEditingUser(null)}
              >
                Cancel
              </StandardButton>
              <StandardButton color="primary-btn" onClick={handleSaveUser}>
                Save Changes
              </StandardButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
