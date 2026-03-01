import { FiX, FiShield, FiUser } from 'react-icons/fi';
import { adminStyles } from '../../utils/adminStyles';

interface User {
  is_active: boolean;
  is_superuser: boolean;
  is_staff: boolean;
  role: 'instructor' | 'admin';
}

export const UserStatusBadge = ({ user }: { user: User }) => {
  if (!user.is_active) {
    return (
      <span className={`${adminStyles.badgeBase} ${adminStyles.badgeInactive}`}>
        <FiX className="w-3 h-3 mr-1" />
        Inactive
      </span>
    );
  } else if (user.is_superuser) {
    return (
      <span
        className={`${adminStyles.badgeBase} ${adminStyles.badgeSuperuser}`}
      >
        <FiShield className="w-3 h-3 mr-1" />
        Superuser
      </span>
    );
  } else if (user.is_staff) {
    return (
      <span className={`${adminStyles.badgeBase} ${adminStyles.badgeAdmin}`}>
        <FiShield className="w-3 h-3 mr-1" />
        Admin
      </span>
    );
  } else {
    return (
      <span className={`${adminStyles.badgeBase} ${adminStyles.badgeActive}`}>
        <FiUser className="w-3 h-3 mr-1" />
        Active
      </span>
    );
  }
};

export const UserRoleBadge = ({ role }: { role: 'instructor' | 'admin' }) => (
  <span
    className={`${adminStyles.badgeRole} ${
      role === 'admin'
        ? adminStyles.badgeRoleAdmin
        : adminStyles.badgeRoleInstructor
    }`}
  >
    {role === 'admin' ? 'Admin' : 'Instructor'}
  </span>
);
