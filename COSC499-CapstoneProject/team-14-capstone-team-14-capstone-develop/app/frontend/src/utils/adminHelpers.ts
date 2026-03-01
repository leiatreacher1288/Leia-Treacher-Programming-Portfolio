// Common utility functions for admin components
export const adminHelpers = {
  // Date formatting
  formatDate: (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },

  // Date and time formatting for last login
  formatDateTime: (dateString: string | null): string => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  },

  // Confirmation dialogs
  confirmDelete: (resourceName: string = 'item'): boolean => {
    return confirm(
      `Are you sure you want to delete this ${resourceName}? This action cannot be undone.`
    );
  },

  // Filter helpers
  applyUserFilter: (
    users: Array<Record<string, unknown>>,
    filter: string
  ): Array<Record<string, unknown>> => {
    switch (filter) {
      case 'Pending Approval':
        return users.filter((user) => !user.is_active);
      case 'Admins':
        return users.filter((user) => user.is_staff);
      case 'Instructors':
        return users.filter((user) => user.role === 'instructor');
      case 'Superusers':
        return users.filter((user) => user.is_superuser);
      case 'Active':
        return users.filter((user) => user.is_active);
      case 'Inactive':
        return users.filter((user) => !user.is_active);
      default:
        return users;
    }
  },

  // Build query parameters
  buildFilterParams: (filter: string): Record<string, string> => {
    const params: Record<string, string> = {};

    // Pass the filter directly to backend since it handles filtering
    if (filter !== 'All Users') {
      params.filter = filter;
    }

    return params;
  },

  // Error handling
  handleApiError: (error: unknown): string => {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    return 'An unknown error occurred';
  },
};
