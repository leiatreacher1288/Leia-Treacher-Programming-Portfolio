import { Link } from 'react-router-dom';

export const NotFound = () => {
  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <h1 className="text-6xl font-bold text-gray-400 mb-4">404</h1>
      <h2 className="text-2xl font-semibold mb-4">Page Not Found</h2>

      {/* apostrophes wrapped in a JS string to satisfy react/no-unescaped-entities */}
      <p className="text-gray-600 mb-8">
        {"The page you're looking for doesn't exist."}
      </p>

      <Link
        to="/"
        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
      >
        Go Home
      </Link>
    </div>
  );
};
