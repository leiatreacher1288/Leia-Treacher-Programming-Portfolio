import { NavLink } from 'react-router-dom';
import {
  FiUsers,
  FiMonitor,
  FiSettings,
  FiHome,
  FiShield,
} from 'react-icons/fi';
import clsx from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Sidebar = () => {
  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin-panel/dashboard', icon: <FiHome /> },
    { label: 'User Management', path: '/admin-panel/users', icon: <FiUsers /> },
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

  return (
    <nav className="bg-sidebar-bg text-sidebar-text w-64 min-h-screen flex flex-col shadow-lg">
      {/* Logo/Brand */}
      <div className="p-6 border-b border-select-border">
        <h1 className="text-2xl font-bold text-logo-indigo font-inter">
          ExamVault
        </h1>
        <p className="text-nav-link text-sm mt-1 font-inter">
          Administration Panel
        </p>
      </div>

      {/* Navigation Items */}
      <ul className="flex-1 py-4">
        {navItems.map((item) => (
          <li key={item.label}>
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                clsx(
                  'flex items-center justify-between px-4 py-3 mx-2 rounded-lg transition-all duration-200 font-inter',
                  'hover:bg-nav-hover hover:text-sidebar-text group',
                  isActive
                    ? 'bg-primary-btn text-sidebar-text shadow-md'
                    : 'text-nav-link hover:text-sidebar-text'
                )
              }
            >
              <div className="flex items-center">
                <span className="mr-3 text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </div>

              {/* Badge for notifications/counts */}
              {item.badge && (
                <span className="bg-accent-emerald text-sidebar-text text-xs px-2 py-1 rounded-full font-medium">
                  {item.badge}
                </span>
              )}
            </NavLink>
          </li>
        ))}
      </ul>

      {/* Footer */}
      <div className="p-4 border-t border-select-border">
        <p className="text-nav-link text-xs text-center font-inter">
          ExamVault v1.0.0
        </p>
      </div>
    </nav>
  );
};
