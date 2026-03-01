// src/pages/ForgotPassword.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { forgotPassword } from '../api/auth';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    const response = await forgotPassword(email.trim().toLowerCase());

    if (response.success) {
      setSuccess(
        'A password reset link has been sent to your email address. Please check your email and follow the instructions.'
      );
      setEmail(''); // Clear the form

      // Hide success message after 30 seconds
      setTimeout(() => {
        setSuccess('');
      }, 30000);
    } else {
      setError(response.error || 'An error occurred. Please try again.');
    }

    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-[#E4F6F8] dark:bg-[#0D1B1E] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-blue-100 dark:bg-[#15202B] text-black dark:text-white rounded-lg shadow-xl ring-4 ring-blue-300 dark:ring-cyan-400 dark:shadow-cyan-500/20 p-8">
        <h1 className="text-3xl font-bold mb-2 text-center">Forgot Password</h1>
        <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
          Enter your email address and we&apos;ll send you a link to reset your
          password.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded bg-white dark:bg-gray-900 text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              autoFocus
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}
          {success && <div className="text-green-600 text-sm">{success}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-blue-600 hover:underline text-sm"
          >
            ← Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};
