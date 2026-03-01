import { useNavigate, useLocation } from 'react-router-dom';
import { StandardButton } from '../ui/StandardButton';
import { FiLogOut, FiUser, FiBell, FiHome } from 'react-icons/fi';
import { adminStyles } from '../../utils/adminStyles';
import { logout } from '../../api/adminApi';

export const HeaderBar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we're on admin login page
  const isAdminLoginPage = location.pathname === '/admin-panel/login';

  // Handle back to admin home (for login page)
  const handleBackToHome = () => {
    navigate('/admin-panel'); // Changed from '/admin-panel/home' to '/admin-panel'
  };

  // Handle logout (for dashboard pages)
  const handleLogout = async () => {
    const confirmLogout = window.confirm('Are you sure you want to logout?');
    if (!confirmLogout) return;

    try {
      // Use the proper API logout
      await logout();
      // Clear any stored tokens
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('adminToken');
      sessionStorage.clear();
      // Redirect to login
      navigate('/admin-panel/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Clear storage and redirect anyway
      localStorage.clear();
      sessionStorage.clear();
      navigate('/admin-panel/login');
    }
  };

  // Get page title from current route
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('login')) return 'Admin Sign In';
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('users')) return 'User Management';
    if (path.includes('courses')) return 'Courses & Terms';
    if (path.includes('exams')) return 'Exams & Questions';
    if (path.includes('analytics')) return 'Analytics';
    if (path.includes('health')) return 'System Health';
    if (path.includes('settings')) return 'Settings';
    return 'Administration';
  };

  const getPageSubtitle = () => {
    if (isAdminLoginPage) {
      return 'Secure administrator access portal';
    }
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <header
      className={`${adminStyles.navbar} border-b border-gray-200 px-6 py-4`}
    >
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>{getPageTitle()}</h1>
          <p className={adminStyles.pageSubtitle}>{getPageSubtitle()}</p>
        </div>

        <div className="flex items-center space-x-4">
          {isAdminLoginPage ? (
            // Show "Back to Home" button on login page
            <StandardButton color="secondary-btn" onClick={handleBackToHome}>
              <FiHome />
              Back to Home
            </StandardButton>
          ) : (
            // Show normal dashboard header content on other admin pages
            <>
              {/* Notifications */}
              <button className="relative p-2 text-card-info hover:text-heading transition-colors">
                <FiBell className="text-lg" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  3
                </span>
              </button>

              {/* User Info */}
              <div className="flex items-center space-x-2 text-card-info">
                <FiUser className="text-lg" />
                <div className="text-right">
                  <p className="text-sm font-medium text-heading">Admin User</p>
                  <p className="text-xs">System Administrator</p>
                </div>
              </div>

              {/* Logout */}
              <StandardButton color="secondary-btn" onClick={handleLogout}>
                <FiLogOut />
                Logout
              </StandardButton>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
