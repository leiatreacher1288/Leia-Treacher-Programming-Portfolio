import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiBarChart2,
  FiBook,
  FiFileText,
  FiHome,
  FiLogOut,
} from 'react-icons/fi';
import { CiBoxList } from 'react-icons/ci';
import { StandardButton } from '../components/ui/StandardButton';
import clsx from 'clsx';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;
}

export const Navigation: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems: NavItem[] = [
    { label: 'Dashboard', path: '/dashboard', icon: <FiHome /> },
    { label: 'Courses', path: '/courses', icon: <FiBook /> },
    { label: 'Analytics', path: '/analytics', icon: <FiBarChart2 /> },
    { label: 'Question Banks', path: '/question-bank', icon: <CiBoxList /> },
    { label: 'Support', path: '/Help', icon: <FiFileText /> },

    /*Add Sidebar Buttons here */
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const { isAuthenticated, logout } = useAuth();
  if (!isAuthenticated) return null;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-sidebar-bg text-sidebar-text w-64 min-h-screen flex flex-col shadow-lg fixed left-0 top-0 z-10">
      <div className="p-6 border-b border-select-border">
        <h1 className="text-2xl font-bold text-logo-indigo font-inter">
          ExamVault
        </h1>
      </div>

      <div className="flex-1 py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link
                to={item.path}
                className={clsx(
                  'flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 font-inter',
                  'hover:bg-nav-hover hover:text-sidebar-text group',
                  isActive(item.path)
                    ? 'bg-primary-btn text-sidebar-text shadow-md'
                    : 'text-nav-link hover:text-sidebar-text'
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

      <div className="p-4 border-t border-select-border">
        <StandardButton
          type="button"
          color="secondary-btn"
          onClick={handleLogout}
          className="w-full justify-center mb-2"
        >
          <FiLogOut />
          Logout
        </StandardButton>
        <p className="text-nav-link text-xs text-center font-inter">
          ExamVault v1.0.0
        </p>
      </div>
    </nav>
  );
};
