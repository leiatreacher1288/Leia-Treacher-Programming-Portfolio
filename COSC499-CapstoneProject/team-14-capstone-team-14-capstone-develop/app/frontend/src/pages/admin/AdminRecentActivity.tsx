import { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../components/ui/StandardButton';
import { RefreshButton } from '../../components/ui/RefreshButton';
import {
  FiUser,
  FiShield,
  FiAlertTriangle,
  FiBook,
  FiFileText,
} from 'react-icons/fi';
import { adminStyles } from '../../utils/adminStyles';
import { recentActivity } from '../../api/adminApi';

interface ActivityItem {
  id: string;
  user_name: string;
  user_email: string;
  action: string;
  description: string;
  timestamp: string;
  type: string;
  severity: string;
}

// Helper functions to get icon and color based on activity type
const getActivityIcon = (action: string, type: string) => {
  if (action === 'login') return <FiUser />;
  if (action === 'user_created') return <FiUser />;
  if (action === 'course_created') return <FiBook />;
  if (action === 'exam_created') return <FiFileText />;
  if (action === 'inactive_user') return <FiAlertTriangle />;
  if (type === 'authentication') return <FiShield />;
  if (type === 'user_management') return <FiUser />;
  if (type === 'course_management') return <FiBook />;
  if (type === 'exam_management') return <FiFileText />;
  if (type === 'security') return <FiAlertTriangle />;
  return <FiUser />;
};

const getActivityColor = (severity: string, action: string, type: string) => {
  if (severity === 'warning') return 'text-yellow-600';
  if (action === 'login') return 'text-green-600';
  if (action === 'user_created') return 'text-blue-600';
  if (action === 'course_created') return 'text-purple-600';
  if (action === 'exam_created') return 'text-indigo-600';
  if (action === 'inactive_user') return 'text-orange-600';
  if (type === 'security') return 'text-red-600';
  return 'text-gray-600';
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
  if (diffInMinutes < 1440)
    return `${Math.floor(diffInMinutes / 60)} hours ago`;
  if (diffInMinutes < 10080)
    return `${Math.floor(diffInMinutes / 1440)} days ago`;

  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getActivityTitle = (action: string) => {
  switch (action) {
    case 'login':
      return 'User Login';
    case 'user_created':
      return 'New User';
    case 'course_created':
      return 'Course Created';
    case 'exam_created':
      return 'Exam Created';
    case 'inactive_user':
      return 'Inactive User Alert';
    default:
      return action.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
  }
};

export const AdminRecentActivity = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('All Activities');

  const filterOptions = [
    'All Activities',
    'User Actions',
    'Course Management',
    'Exam Activities',
    'Security Alerts',
    'Authentication',
  ];

  const fetchActivities = useCallback(async () => {
    setLoading(true);
    try {
      const response = await recentActivity.list();
      if (response.success && response.data) {
        setActivities(response.data.activities || []);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const filteredActivities = activities.filter((activity) => {
    if (filter === 'All Activities') return true;
    if (filter === 'User Actions')
      return ['user_management'].includes(activity.type);
    if (filter === 'Course Management')
      return ['course_management'].includes(activity.type);
    if (filter === 'Exam Activities')
      return ['exam_management'].includes(activity.type);
    if (filter === 'Security Alerts')
      return (
        ['security'].includes(activity.type) || activity.severity === 'warning'
      );
    if (filter === 'Authentication')
      return ['authentication'].includes(activity.type);
    return true;
  });

  const getActivityTypeColor = (type: string, severity: string) => {
    if (severity === 'warning') return 'bg-yellow-100 border-yellow-200';

    const colors = {
      authentication: 'bg-green-100 border-green-200',
      user_management: 'bg-blue-100 border-blue-200',
      course_management: 'bg-purple-100 border-purple-200',
      exam_management: 'bg-indigo-100 border-indigo-200',
      security: 'bg-red-100 border-red-200',
      system: 'bg-gray-100 border-gray-200',
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 border-gray-200';
  };

  return (
    <div className={adminStyles.pageContainer}>
      {/* Action Buttons */}
      <div className="flex justify-end mb-6">
        <RefreshButton onClick={fetchActivities} loading={loading} />
      </div>

      {/* Filter */}
      <div className={adminStyles.filterContainer}>
        <div className={adminStyles.filterGroup}>
          <label className={adminStyles.filterLabel}>Filter:</label>
          <select
            className={adminStyles.filterSelect}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            {filterOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
        <span className={adminStyles.countLabel}>
          Showing {filteredActivities.length} of {activities.length} activities
        </span>
      </div>

      {/* Activity List */}
      {loading ? (
        <div className={adminStyles.loadingContainer}>
          <div className={adminStyles.loadingSpinner}></div>
          <p className={adminStyles.loadingText}>Loading activities...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className={`${getActivityTypeColor(activity.type, activity.severity)} border rounded-lg p-4 hover:shadow-md transition-shadow duration-200`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className={`${getActivityColor(activity.severity, activity.action, activity.type)} text-xl mt-1`}
                  >
                    {getActivityIcon(activity.action, activity.type)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-heading font-inter">
                      {getActivityTitle(activity.action)}
                    </h3>
                    <p className="text-card-info text-sm mt-1 font-inter">
                      {activity.description}
                    </p>
                    {activity.user_email && (
                      <p className="text-xs text-card-info mt-1 font-inter">
                        {activity.user_email}
                      </p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-card-info font-inter">
                    {formatTimestamp(activity.timestamp)}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className={adminStyles.emptyState}>
              No activities found matching the current filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
