import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { type ReactNode } from 'react';

interface PrivateRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export const PrivateRoute = ({
  children,
  requireAdmin = false,
}: PrivateRouteProps) => {
  const { isAuthenticated, isAdminAuthenticated, adminUser, isLoading } =
    useAuth();
  const location = useLocation();

  // Show loading while auth state is being restored
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (requireAdmin) {
    // Admin routes require admin authentication
    if (!isAdminAuthenticated || !adminUser) {
      return (
        <Navigate to="/admin-panel/login" state={{ from: location }} replace />
      );
    }

    // Additional check for staff status (if adminUser exists but is not staff/superuser)
    if (!adminUser.is_staff && !adminUser.is_superuser) {
      return (
        <Navigate to="/admin-panel/login" state={{ from: location }} replace />
      );
    }
  } else {
    // Regular routes require user authentication
    if (!isAuthenticated) {
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  return <>{children}</>;
};
