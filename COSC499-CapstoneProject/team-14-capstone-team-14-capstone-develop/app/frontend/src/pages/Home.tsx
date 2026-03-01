import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-800 dark:bg-[#0D1B1E] dark:text-white"
      style={{ minWidth: '100vw' }}
    >
      {/* Main content */}
      <main className="w-full px-6 py-24 max-w-screen-xl mx-auto">
        {/* Hero section */}
        <div className="text-center mb-20">
          <div className="inline-block bg-blue-100 text-blue-600 p-4 rounded-full mb-6">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h6m2 0a2 2 0 012 2v4a2 2 0 01-2 2H7a2 2 0 01-2-2v-4a2 2 0 012-2m4-4h.01M5 12V6a2 2 0 012-2h10a2 2 0 012 2v6"
              />
            </svg>
          </div>
          <h1 className="text-5xl font-bold mb-4">
            Welcome to <span className="text-blue-600">ExamVault</span>
          </h1>
          <p className="text-lg max-w-2xl mx-auto mb-6">
            Streamline your exam management process with our intuitive platform.
            Create, manage, and analyze exams with ease and precision.
          </p>
          {isAuthenticated && (
            <Link
              to="/dashboard"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          )}

          {!isAuthenticated && (
            <Link
              to="/signup"
              className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700"
            >
              Create an account to get started
            </Link>
          )}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              title: 'Easy Creation',
              desc: 'Quickly design and deploy exams with a user-friendly interface.',
              icon: '📝',
            },
            {
              title: 'Secure Storage',
              desc: 'Your exams are safe with robust security and backup measures.',
              icon: '🔒',
            },
            {
              title: 'Insightful Analytics',
              desc: 'Gain valuable insights from detailed performance reports.',
              icon: '📊',
            },
          ].map(({ title, desc, icon }) => (
            <div
              key={title}
              className="bg-white dark:bg-[#15202B] p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <div className="text-blue-600 text-2xl mb-2">{icon}</div>
              <h3 className="font-semibold text-lg">{title}</h3>
              <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
        © {new Date().getFullYear()} ExamVault. All rights reserved.
      </footer>
    </div>
  );
};
