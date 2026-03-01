import React, { useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import { StandardButton } from '../components/ui/StandardButton';

import { Mail, CircleUserRound, UserRound, KeyRound } from 'lucide-react';

// Type definition for the user profile data
interface profileField {
  name: string;
  email: string;
  is_staff: boolean;
}

// Profile component to display user info and change password
export const Profile = () => {
  const [profile, setProfile] = useState<profileField>(); // Stores profile data
  const [loading, setLoading] = useState(false); // Tracks loading state

  // Password input state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Feedback message state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetches the user profile data from the backend
  const GetUserProfile = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`auth/profile/`);
      setProfile(res.data);
    } catch (error) {
      alert(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch profile on initial render
  useEffect(() => {
    GetUserProfile();
  }, []);

  // Handles password update form submission
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Basic validation rules
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required.');
      return;
    }
    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    // Placeholder for actual password change request
    setSuccess('Password updated successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Render loading message while data is being fetched
  if (loading) {
    return <h1 className="text-center text-lg font-medium">Loading...</h1>;
  }

  return (
    <main className="min-h-screen bg-page text-gray-800 font-inter px-8 py-10">
      <div className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        {/* Profile header */}
        <h1 className="text-heading text-2xl font-bold mb-6">Profile</h1>

        {/* Display user name and email with icons */}
        <div className="flex items-center gap-4">
          <CircleUserRound size={80} className="text-gray-800" />
          <div>
            <div className="flex items-center gap-2">
              <UserRound size={18} className="text-gray-500" />
              <span className="text-md text-gray-800 font-medium">
                {profile?.name}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Mail size={18} className="text-gray-500" />
              <span className="text-md text-gray-800 font-medium">
                {profile?.email}
              </span>
            </div>
          </div>
        </div>

        {/* Password change form */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 flex items-center gap-2">
            <KeyRound className="text-gray-600" size={20} /> Change Password
          </h2>

          {/* Display feedback messages */}
          {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
          {success && <p className="text-green-600 text-sm mb-2">{success}</p>}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            {/* Old Password Input */}
            <div>
              <label
                htmlFor="old-password"
                className="block text-sm font-medium text-gray-700"
              >
                Old Password
              </label>
              <input
                type="password"
                id="old-password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter current password"
              />
            </div>

            {/* New Password Input */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-sm font-medium text-gray-700"
              >
                New Password
              </label>
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter new password"
              />
            </div>

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-sm font-medium text-gray-700"
              >
                Confirm Password
              </label>
              <input
                type="password"
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Confirm new password"
              />
            </div>

            {/* Submit button */}
            <div className="pt-2">
              <StandardButton
                icon={<KeyRound size={16} />}
                color="primary-btn"
                className="px-4 py-2"
                type="submit"
              >
                Reset Password
              </StandardButton>
            </div>
          </form>
        </div>
      </div>
    </main>
  );
};
