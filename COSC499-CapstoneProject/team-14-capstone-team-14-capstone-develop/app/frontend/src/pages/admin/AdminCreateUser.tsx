import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { StandardButton } from '../../components/ui/StandardButton';
import { FiSave, FiArrowLeft } from 'react-icons/fi';
import { adminStyles } from '../../utils/adminStyles';
import { users as usersApi } from '../../api/adminApi';

export const AdminCreateUser = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    password: '',
    role: 'instructor',
    is_active: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Enhanced validation for required fields
      if (!formData.email || !formData.email.trim()) {
        setError('Email is required and cannot be empty.');
        return;
      }

      if (!formData.name || !formData.name.trim()) {
        setError('Name is required and cannot be empty.');
        return;
      }

      if (!formData.password || !formData.password.trim()) {
        setError('Password is required and cannot be empty.');
        return;
      }

      // Length validation
      if (formData.name.trim().length < 6) {
        setError('Name must be at least 6 characters long.');
        return;
      }

      if (formData.name.trim().length > 25) {
        setError('Name cannot exceed 25 characters.');
        return;
      }

      if (formData.email.trim().length > 50) {
        setError('Email cannot exceed 50 characters.');
        return;
      }

      if (formData.password.length > 50) {
        setError('Password cannot exceed 50 characters.');
        return;
      }

      // Additional validation
      if (formData.password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        setError('Please enter a valid email address.');
        return;
      }

      // Create the user via API
      const result = await usersApi.create({
        ...formData,
        email: formData.email.trim(),
        name: formData.name.trim(),
      });

      if (result.success) {
        // Navigate back to users list
        navigate('/admin-panel/users');
      } else {
        setError(result.error || 'Failed to create user. Please try again.');
      }
    } catch (error: unknown) {
      console.error('Error creating user:', error);
      const errorMessage =
        (
          error as {
            response?: { data?: { error?: string } };
            message?: string;
          }
        )?.response?.data?.error ||
        (error as { message?: string })?.message ||
        'Failed to create user. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  return (
    <div className={adminStyles.pageContainer}>
      {/* Page Header */}
      <div className={adminStyles.pageHeader}>
        <div>
          <h2 className={adminStyles.pageTitle}>Create New User</h2>
          <p className={adminStyles.pageSubtitle}>
            Add a new instructor or administrator to the system
          </p>
        </div>
        <StandardButton
          color="secondary-btn"
          onClick={() => navigate('/admin-panel/users')}
        >
          <FiArrowLeft />
          Back to Users
        </StandardButton>
      </div>

      {/* Error Message */}
      {error && <div className={adminStyles.errorMessage}>{error}</div>}

      {/* Create User Form */}
      <div className="bg-card rounded-lg p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address * (Max 50 characters)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                placeholder="user@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name * (6-25 characters)
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                minLength={6}
                maxLength={25}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                placeholder="John Doe"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password * (8-50 characters)
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                minLength={8}
                maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
                placeholder="Enter password"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role *
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent"
              >
                <option value="instructor">Instructor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="mr-2 h-4 w-4 text-primary-btn focus:ring-primary-btn border-gray-300 rounded"
                />
                <span className="text-sm text-gray-700">Active User</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <StandardButton
              type="button"
              color="secondary-btn"
              onClick={() => navigate('/admin-panel/users')}
              disabled={loading}
            >
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              color="primary-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creating...
                </>
              ) : (
                <>
                  <FiSave />
                  Create User
                </>
              )}
            </StandardButton>
          </div>
        </form>
      </div>
    </div>
  );
};
