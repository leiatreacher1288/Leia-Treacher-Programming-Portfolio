import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

export const AdminHome = () => {
  const { isAdminAuthenticated } = useAuth();

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-800 dark:bg-[#0D1B1E] dark:text-white"
      style={{ minWidth: '100vw' }}
    >
      {/* Header */}
      <header className="w-full bg-white dark:bg-[#15202B] shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-screen-xl mx-auto px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 p-3 rounded-full">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">ExamVault</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Administration Portal
              </p>
            </div>
          </div>
          <nav>
            <a
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Back to Main Site
            </a>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full px-6 py-20 max-w-screen-md mx-auto">
        <div className="bg-white dark:bg-[#15202B] rounded-lg shadow-md border border-gray-200 dark:border-gray-700 p-8 flex flex-col items-center mb-10">
          <div className="inline-block bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300 p-4 rounded-full mb-6">
            <svg
              className="w-8 h-8"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold mb-3 text-center">
            Welcome to <span className="text-blue-600">ExamVault</span> Admin
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-8 text-center">
            {isAdminAuthenticated
              ? 'You are already logged in. Access your admin dashboard to manage the platform.'
              : 'Sign in with your administrator credentials to access the management dashboard.'}
          </p>
          <div>
            {/* Replace button navigation with Link */}
            {isAdminAuthenticated ? (
              <Link
                to="/admin-panel/dashboard"
                className="bg-primary-btn hover:bg-primary-btn-hover text-white px-6 py-3 rounded-lg"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                to="/admin-panel/login"
                className="bg-secondary-btn hover:bg-secondary-btn-hover text-gray-800 px-6 py-3 rounded-lg"
              >
                Sign In to Admin
              </Link>
            )}
          </div>
        </div>
        <div className="bg-gray-100 dark:bg-[#1B2930] rounded-lg p-8 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 p-3 rounded-full">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z"
                />
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-semibold text-center mb-4">
            Administrative Features
          </h3>
          <ul className="space-y-3">
            {[
              'User Management & Permissions',
              'Exam Creation & Management',
              'Question Bank Administration',
              'Results & Analytics Dashboard',
              'System Health Monitoring',
            ].map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-200"
              >
                <svg
                  className="w-5 h-5 text-green-500 dark:text-green-400"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} ExamVault. All rights reserved.
      </footer>
    </div>
  );
};
