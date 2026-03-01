// src/pages/VerifyEmail.tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyEmail as apiVerifyEmail } from '../api/auth';

export function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate(); // ← import & call useNavigate()
  const token = searchParams.get('token');

  const [status, setStatus] = useState<
    'loading' | 'no-token' | 'error' | 'success'
  >('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('no-token');
      setMessage('Verification token required');
      return;
    }

    // Fire the API
    apiVerifyEmail(token)
      .then((res) => {
        if (res.success) {
          setStatus('success');
          setMessage(res.data.message || 'Email verified successfully!');
          // redirect in 10s
          setTimeout(() => navigate('/login'), 10_000);
        } else {
          setStatus('error');
          setMessage(res.error || 'Invalid verification token');
        }
      })
      .catch((err) => {
        console.error(err);
        setStatus('error');
        setMessage('Something went wrong');
      });
  }, [token, navigate]);

  return (
    <div className="fixed inset-0 bg-[#E4F6F8] dark:bg-[#0D1B1E] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-blue-100 dark:bg-[#15202B] text-black dark:text-white rounded-lg shadow-xl ring-4 ring-blue-300 dark:ring-cyan-400 p-8 text-center">
        <h1 className="text-3xl font-bold mb-6">Email Verification</h1>
        <div className="space-y-4">
          {status === 'loading' && <p>Verifying…</p>}

          {(status === 'no-token' || status === 'error') && (
            <>
              <div className="text-red-600 text-6xl mb-4">✗</div>
              <p className="text-red-600 text-lg">{message}</p>
              <button
                onClick={() => navigate('/signup')}
                className="mt-4 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
              >
                Back to Signup
              </button>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 text-6xl mb-4">✓</div>
              <p className="text-green-600 text-xl font-semibold">{message}</p>
              <p className="text-gray-600 dark:text-gray-400">
                Redirecting to login in 10 seconds…
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-4 bg-blue-600 text-white py-2 px-6 rounded hover:bg-blue-700 transition-colors"
              >
                Go to Login Now
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
