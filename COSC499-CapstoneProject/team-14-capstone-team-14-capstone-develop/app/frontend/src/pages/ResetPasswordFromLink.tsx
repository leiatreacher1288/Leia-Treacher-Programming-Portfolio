// src/pages/ResetPasswordFromLink.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { validateResetToken, resetPassword } from '../api/auth';

/* ─── password helpers ──────────────────────────────────────────────── */
const validatePassword = (pwd: string) =>
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]).{8,}$/.test(
    pwd
  );
const hasUppercase = (s: string) => /[A-Z]/.test(s);
const hasLowercase = (s: string) => /[a-z]/.test(s);
const hasNumber = (s: string) => /\d/.test(s);
const hasSpecialChar = (s: string) =>
  /[!@#$%^&*()_+\-[\]{};':"\\|,.<>/?]/.test(s);
const isLongEnough = (s: string) => s.length >= 8;

/* ─── component ─────────────────────────────────────────────────────── */
export const ResetPasswordFromLink = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const uid = searchParams.get('uid');

  /* ── local state ──────────────────────────────────────────────── */
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [redirectCd, setRedirectCd] = useState(10); // countdown

  /* ── validate token on mount ───────────────────────────────────── */
  useEffect(() => {
    const run = async () => {
      if (!token || !uid) {
        setError('Invalid reset link');
        setValidating(false);
        return;
      }

      const res = await validateResetToken(uid, token);
      if (res.success) {
        setTokenValid(true);
        setUserEmail(res.data.email ?? '');
      } else {
        setError(res.error ?? 'Invalid or expired reset link');
      }
      setValidating(false);
    };
    run();
  }, [token, uid]);

  /* ── redirect countdown (10->0) ─────────────────────────────────── */
  useEffect(() => {
    if (success && redirectCd > 0) {
      const id = setTimeout(() => setRedirectCd((n) => n - 1), 1_000);
      return () => clearTimeout(id);
    }
  }, [success, redirectCd]);

  /* ⚡ immediate redirect for tests (and UX) ─────────────────────── */
  useEffect(() => {
    if (success) {
      // show the success screen for one paint, then queue navigation
      const id = setTimeout(() => navigate('/login'), 10000);
      return () => clearTimeout(id);
    }
  }, [success, navigate]);

  /* ── submit handler ────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    if (!validatePassword(password)) {
      setError('Password must meet all requirements');
      return;
    }

    setLoading(true);
    const res = await resetPassword(uid!, token!, password);
    setLoading(false);

    if (res.success) setSuccess(true);
    else setError(res.error ?? 'An error occurred. Please try again.');
  };

  /* ── render branches ───────────────────────────────────────────── */
  if (validating) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#E4F6F8] dark:bg-[#0D1B1E] p-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">
            Validating reset link…
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#E4F6F8] dark:bg-[#0D1B1E] p-4">
        <div className="w-full max-w-md rounded-lg bg-blue-100 p-8 text-black shadow-xl ring-4 ring-blue-300 dark:bg-[#15202B] dark:text-white dark:ring-cyan-400">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mb-4 text-2xl font-bold">
              Password Reset Successfully!
            </h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              Your password has been reset. You will be redirected to login in{' '}
              {redirectCd} seconds…
            </p>
            <button
              onClick={() => navigate('/login')}
              className="rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Go to Login Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#E4F6F8] dark:bg-[#0D1B1E] p-4">
        <div className="w-full max-w-md rounded-lg bg-blue-100 p-8 text-black shadow-xl ring-4 ring-red-300 dark:bg-[#15202B] dark:text-white dark:ring-red-400">
          <div className="text-center">
            <svg
              className="mx-auto mb-4 h-12 w-12 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="mb-4 text-2xl font-bold">Invalid Reset Link</h2>
            <p className="mb-6 text-gray-600 dark:text-gray-300">
              {error || 'This password reset link is invalid or has expired.'}
            </p>
            <button
              onClick={() => navigate('/forgot-password')}
              className="rounded bg-blue-600 px-6 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Request New Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ── main form ─────────────────────────────────────────────────── */
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#E4F6F8] dark:bg-[#0D1B1E] p-4">
      <div className="w-full max-w-md rounded-lg bg-blue-100 p-8 text-black shadow-xl ring-4 ring-blue-300 dark:bg-[#15202B] dark:text-white dark:ring-cyan-400">
        <h1 className="mb-2 text-center text-3xl font-bold">
          Reset Your Password
        </h1>
        <p className="mb-2 text-center text-gray-600 dark:text-gray-300">
          Enter a new password for:
        </p>
        <p className="mb-6 text-center font-medium">{userEmail}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="password"
              className="mb-1 block text-sm font-medium"
            >
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoFocus
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            />
            {password && !validatePassword(password) && (
              <ul className="mt-2 space-y-1 text-sm">
                <li
                  className={
                    isLongEnough(password) ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {isLongEnough(password) ? '✓' : '✗'} At least 8 characters
                </li>
                <li
                  className={
                    hasUppercase(password) ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {hasUppercase(password) ? '✓' : '✗'} 1 uppercase letter
                </li>
                <li
                  className={
                    hasLowercase(password) ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {hasLowercase(password) ? '✓' : '✗'} 1 lowercase letter
                </li>
                <li
                  className={
                    hasNumber(password) ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {hasNumber(password) ? '✓' : '✗'} 1 number
                </li>
                <li
                  className={
                    hasSpecialChar(password) ? 'text-green-600' : 'text-red-500'
                  }
                >
                  {hasSpecialChar(password) ? '✓' : '✗'} 1 special character
                </li>
              </ul>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="mb-1 block text-sm font-medium"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full rounded border border-gray-300 bg-white px-3 py-2 text-black focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:text-white"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
