// src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { loginUser } from '../api/auth';
import adminApi from '../api/adminApi';

type AdminUser = {
  id: number;
  username: string;
  email: string;
  name: string;
  is_superuser: boolean;
  is_staff: boolean;
  is_active: boolean;
};

interface AuthContextType {
  // Regular user auth
  isAuthenticated: boolean;
  user: { email: string } | null;
  login: (
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;

  // Admin auth
  isAdminAuthenticated: boolean;
  adminUser: AdminUser | null;
  adminLogin: (
    username: string,
    password: string
  ) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => void;

  // Loading state
  isLoading: boolean;
}

export type { AuthContextType };

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

// Utility to decode JWT and check expiry
function isTokenValid(token: string | null): boolean {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds since epoch
    if (!payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now;
  } catch {
    return false;
  }
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  // Regular user state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<{ email: string } | null>(null);

  // Admin state
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

  // Loading state to prevent redirects during initialization
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check regular user auth
    const token = localStorage.getItem('access');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser && isTokenValid(token)) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    } else {
      // If token is missing or invalid/expired, clear everything
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('access');
      localStorage.removeItem('refresh');
      localStorage.removeItem('user');
    }

    // Check admin auth
    const adminToken = localStorage.getItem('adminToken');
    const savedAdminUser = localStorage.getItem('adminUser');
    if (adminToken && savedAdminUser) {
      setIsAdminAuthenticated(true);
      setAdminUser(JSON.parse(savedAdminUser));
    }

    // Listen for admin session expiration events
    const handleAdminSessionExpired = () => {
      setIsAdminAuthenticated(false);
      setAdminUser(null);
    };

    window.addEventListener('admin-session-expired', handleAdminSessionExpired);

    setIsLoading(false);

    // Cleanup event listener
    return () => {
      window.removeEventListener(
        'admin-session-expired',
        handleAdminSessionExpired
      );
    };
  }, []);

  // Regular user login
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await loginUser({ email, password });
      if (response.success) {
        const { access, refresh } = response.data;
        localStorage.setItem('access', access);
        localStorage.setItem('refresh', refresh);
        localStorage.setItem('user', JSON.stringify({ email }));
        setIsAuthenticated(true);
        setUser({ email });
        return { success: true };
      } else {
        return { success: false, error: response.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setUser(null);
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    localStorage.removeItem('user');
  };

  // Admin login
  const adminLogin = async (
    username: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await adminApi.login({ username, password });

      if (response.success && response.user && response.access) {
        setIsAdminAuthenticated(true);
        setAdminUser(response.user);
        // Store real JWT tokens
        localStorage.setItem('adminAccess', response.access);
        localStorage.setItem(
          'adminRefresh',
          response.refresh || response.access
        );
        localStorage.setItem('adminUser', JSON.stringify(response.user));
        return { success: true };
      }

      return {
        success: false,
        error: response.message || 'Admin login failed',
      };
    } catch (err) {
      console.error('❌ adminLogin error:', err);
      return { success: false, error: 'Admin login failed' };
    }
  };

  const adminLogout = async () => {
    console.log('🚪 AdminLogout: Starting logout process...');

    // Clear local state first
    setIsAdminAuthenticated(false);
    setAdminUser(null);
    localStorage.removeItem('adminAccess');
    localStorage.removeItem('adminRefresh');
    localStorage.removeItem('adminUser');

    try {
      // Try to call API logout but don't wait or block
      await adminApi.logout();
      console.log('✅ Admin API logout successful');
    } catch (error) {
      console.warn(
        '⚠️ Admin API logout failed, but local logout completed',
        error
      );
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        logout,
        isAdminAuthenticated,
        adminUser,
        adminLogin,
        adminLogout,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
