import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FiUsers,
  FiMonitor,
  FiSettings,
  FiHome,
  FiShield,
  FiLogOut,
  FiUser,
} from 'react-icons/fi';
import { StandardButton } from '../ui/StandardButton';
import { ThemeToggleCompact } from '../ui/ThemeToggle';
import clsx from 'clsx';

// Define types for navigation items
interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation items
  const navItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/admin-panel/dashboard',
      icon: <FiHome />,
    },
    {
      label: 'User Management',
      path: '/admin-panel/users',
      icon: <FiUsers />,
    },
    {
      label: 'System Configuration',
      path: '/admin-panel/global-config',
      icon: <FiSettings />,
    },
    {
      label: 'System Health',
      path: '/admin-panel/health',
      icon: <FiMonitor />,
    },
    {
      label: 'Privacy Compliance',
      path: '/admin-panel/privacy',
      icon: <FiShield />,
    },
  ];

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('dashboard')) return 'Dashboard';
    if (path.includes('users')) return 'User Management';
    if (path.includes('global-config')) return 'System Configuration';
    if (path.includes('health')) return 'System Health / Analytics';
    if (path.includes('privacy')) return 'Privacy Compliance';
    if (path.includes('activity')) return 'Recent Activity';
    return 'Administration';
  };

  const getPageSubtitle = () => {
    const path = location.pathname;
    if (path.includes('users'))
      return 'Manage instructors, administrators, and user permissions';
    if (path.includes('global-config'))
      return 'Manage system-wide configuration settings, marking schemes, and exam formats';
    if (path.includes('health'))
      return 'Monitor system performance, health metrics, and analytics';
    if (path.includes('privacy'))
      return 'Manage data privacy, GDPR compliance, and user data protection';
    if (path.includes('recent-activity'))
      return 'Monitor user actions, course creation, exams, and system events';
    return '';
  };

  const handleLogout = () => {
    navigate('/admin-panel/logout');
  };

  return (
    <div className="min-h-screen min-w-[100vw] w-full bg-page dark:bg-page-dark flex">
      {/* Sidebar - Fixed on left */}
      <nav className="bg-sidebar-bg dark:bg-sidebar-bg-dark text-sidebar-text dark:text-sidebar-text-dark w-64 min-h-screen flex flex-col shadow-lg fixed left-0 top-0 z-10">
        {/* Logo/Brand */}
        <div className="p-6 border-b border-select-border dark:border-select-border-dark">
          <h1 className="text-2xl font-bold text-logo-indigo font-inter">
            ExamVault
          </h1>
          <p className="text-nav-link dark:text-nav-link-dark text-sm mt-1 font-inter">
            Administration Panel
          </p>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 py-4">
          <ul className="space-y-1 px-2">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  to={item.path}
                  className={clsx(
                    'flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 font-inter',
                    'hover:bg-nav-hover dark:hover:bg-nav-hover-dark hover:text-sidebar-text dark:hover:text-sidebar-text-dark group',
                    isActive(item.path)
                      ? 'bg-primary-btn text-sidebar-text dark:text-sidebar-text-dark shadow-md'
                      : 'text-nav-link dark:text-nav-link-dark hover:text-sidebar-text dark:hover:text-sidebar-text-dark'
                  )}
                >
                  <div className="flex items-center">
                    <span className="mr-3 text-lg">{item.icon}</span>
                    <span className="font-medium">{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="bg-accent-emerald text-sidebar-text text-xs px-2 py-1 rounded-full font-medium">
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer with theme toggle and logout */}
        <div className="p-4 border-t border-select-border dark:border-select-border-dark space-y-3">
          {/* Theme Toggle */}
          <div className="flex justify-center">
            <ThemeToggleCompact />
          </div>

          <StandardButton
            onClick={handleLogout}
            className="w-full justify-center"
          >
            <FiLogOut />
            Logout
          </StandardButton>
          <p className="text-sidebar-text dark:text-sidebar-text-dark text-xs text-center font-inter">
            ExamVault v1.0.0
          </p>
        </div>
      </nav>

      {/* Main content area */}
      <div className="flex-1 ml-64 flex flex-col w-full">
        {/* Header - Full Width */}
        <header className="bg-card dark:bg-card-dark border-b border-gray-200 dark:border-gray-700 shadow-sm w-full">
          <div className="px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-heading dark:text-heading-dark text-xl font-semibold font-inter">
                {getPageTitle()}
              </h1>
              {getPageSubtitle() && (
                <p className="text-card-info dark:text-card-info-dark text-sm font-inter mt-1">
                  {getPageSubtitle()}
                </p>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center space-x-2 text-card-info dark:text-card-info-dark">
              <FiUser className="text-lg" />
              <div className="text-right">
                <p className="text-sm font-medium text-heading dark:text-heading-dark font-inter">
                  Admin User
                </p>
                <p className="text-xs font-inter">System Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-8 py-6 overflow-auto w-full bg-page dark:bg-page-dark">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
