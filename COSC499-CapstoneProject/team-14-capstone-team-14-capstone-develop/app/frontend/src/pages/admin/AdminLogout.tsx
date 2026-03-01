import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import adminApi from '../../api/adminApi';

export const AdminLogout = () => {
  const { adminLogout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      console.log('🚪 Starting admin logout process...');

      try {
        // Call API logout
        await adminApi.logout();
        console.log('✅ Admin logout API call successful');
      } catch (error) {
        console.error('❌ Admin logout API call error:', error);
        console.warn('⚠️ Admin logout API call failed, but continuing...');
      }

      // Clear context state regardless of API call result
      adminLogout();

      // Redirect to login
      setTimeout(() => {
        console.log('⏰ Auto-redirecting to login page...');
        navigate('/admin-panel/login', { replace: true });
      }, 2000);
    };

    performLogout();
  }, [adminLogout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Logging you out...
        </h2>
        <p className="text-gray-600">
          Please wait while we securely log you out.
        </p>
      </div>
    </div>
  );
};
