// src/pages/ChangePassword.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { changePassword } from '../api/auth';
import { useAuth } from '../context/AuthContext';

// Validator functions (same as Signup)
const validatePassword = (password: string) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,}$/.test(
    password
  );
const hasUppercase = (str: string) => /[A-Z]/.test(str);
const hasLowercase = (str: string) => /[a-z]/.test(str);
const hasNumber = (str: string) => /\d/.test(str);
const hasSpecialChar = (str: string) =>
  /[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(str);
const isLongEnough = (str: string) => str.length >= 8;

export const ChangePassword = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    // Validate password strength
    if (!validatePassword(newPassword)) {
      setError('Password must meet all requirements');
      return;
    }

    // Check new password is different
    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    setLoading(true);

    const response = await changePassword(currentPassword, newPassword);

    if (response.success) {
      setSuccess('Password changed successfully! Redirecting...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } else {
      setError(response.error || 'Failed to change password');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#E4F6F8] dark:bg-[#0D1B1E] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-blue-100 dark:bg-[#15202B] text-black dark:text-white rounded-lg shadow-xl ring-4 ring-blue-300 dark:ring-cyan-400 dark:shadow-cyan-500/20 p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">
          Change Your Password
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={user?.email || ''}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              disabled
            />
          </div>

          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium mb-1"
            >
              Current Password
            </label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="mt-1 text-s text-red-600 text-right">
              <span
                onClick={() => navigate('/forgot-password')}
                className="cursor-pointer hover:underline"
              >
                Forgot current password?
              </span>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium mb-1"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            {newPassword && !validatePassword(newPassword) && (
              <ul className="text-sm mt-2 space-y-1">
                <li
                  className={
                    isLongEnough(newPassword)
                      ? 'text-green-600'
                      : 'text-red-500'
                  }
                >
                  {isLongEnough(newPassword) ? '✓' : '✗'} At least 8 characters
                </li>
                <li
                  className={
                    hasUppercase(newPassword)
                      ? 'text-green-600'
                      : 'text-red-500'
                  }
                >
                  {hasUppercase(newPassword) ? '✓' : '✗'} 1 uppercase letter
                </li>
                <li
                  className={
                    hasLowercase(newPassword)
                      ? 'text-green-600'
                      : 'text-red-500'
                  }
                >
                  {hasLowercase(newPassword) ? '✓' : '✗'} 1 lowercase letter
                </li>
                <li
                  className={
                    hasNumber(newPassword) ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {hasNumber(newPassword) ? '✓' : '✗'} 1 number
                </li>
                <li
                  className={
                    hasSpecialChar(newPassword)
                      ? 'text-green-600'
                      : 'text-red-500'
                  }
                >
                  {hasSpecialChar(newPassword) ? '✓' : '✗'} 1 special character
                </li>
              </ul>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium mb-1"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Changing...' : 'Change Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-blue-600 hover:underline"
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
};
