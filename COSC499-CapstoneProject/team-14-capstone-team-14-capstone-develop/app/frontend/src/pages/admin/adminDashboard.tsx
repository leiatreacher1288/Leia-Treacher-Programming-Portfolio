import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiTrendingUp } from 'react-icons/fi';
import { StandardButton } from '../../components/ui/StandardButton';
import { getStats, recentActivity } from '../../api/adminApi';

interface AdminStats {
  total_users: number;
  total_exams: number;
  total_questions: number;
  total_results: number;
  user_info: {
    username: string;
    email: string;
    name: string;
    is_superuser: boolean;
  };
  system_health?: {
    system_status: {
      memory_usage: number;
      cpu_usage: number;
      disk_usage: number;
    };
    metrics: Array<{
      timestamp: string;
      memory_usage: number;
      cpu_usage: number;
      disk_usage: number;
    }>;
  };
  // Optional fields for future use
  pending_approvals?: number;
  active_exams?: number;
}

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

export const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch stats
        const statsData = await getStats();

        if (statsData) {
          setStats(statsData);
        } else {
          setStats(null);
          setError('No dashboard data available');
        }

        // Fetch recent activities
        try {
          const activityResponse = await recentActivity.list();
          if (activityResponse.success && activityResponse.data) {
            // Get the first 5 activities for the dashboard
            setActivities(activityResponse.data.activities.slice(0, 5) || []);
          }
        } catch (activityError) {
          console.error('Failed to load recent activities:', activityError);
          // Don't show error for activities, just use empty array
        }

        setLoading(false);
      } catch {
        setError('Failed to load dashboard data');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const getActivityIcon = (action: string, type: string) => {
    if (action === 'login') return '🔑';
    if (action === 'user_created') return '👤';
    if (action === 'course_created') return '📚';
    if (action === 'exam_created') return '📝';
    if (action === 'inactive_user') return '⚠️';
    if (type === 'authentication') return '🔐';
    if (type === 'user_management') return '👥';
    if (type === 'course_management') return '📚';
    if (type === 'exam_management') return '📝';
    if (type === 'security') return '🔒';
    return '📄';
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

    return date.toLocaleDateString();
  };

  const renderAnalyticsChart = () => {
    if (
      !stats?.system_health?.metrics ||
      stats.system_health.metrics.length === 0
    ) {
      return (
        <div className="h-64 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600">
          <div className="text-center text-gray-500 dark:text-gray-400">
            <FiTrendingUp className="mx-auto text-4xl mb-3 text-primary-btn" />
            <p className="text-lg font-medium text-heading dark:text-heading-dark">
              Analytics Chart
            </p>
            <p className="text-sm text-card-info dark:text-card-info-dark">
              No metrics data available
            </p>
          </div>
        </div>
      );
    }

    const metrics = stats.system_health.metrics;
    const recentMetrics = metrics.slice(-12); // Last 12 data points

    return (
      <div className="space-y-4">
        {/* System Metrics Overview */}
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <div className="text-sm text-blue-600 dark:text-blue-400 font-medium">
              CPU Usage
            </div>
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-300">
              {stats.system_health.system_status.cpu_usage.toFixed(1)}%
            </div>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
            <div className="text-sm text-green-600 dark:text-green-400 font-medium">
              Memory Usage
            </div>
            <div className="text-2xl font-bold text-green-700 dark:text-green-300">
              {stats.system_health.system_status.memory_usage.toFixed(1)}%
            </div>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
            <div className="text-sm text-purple-600 dark:text-purple-400 font-medium">
              Disk Usage
            </div>
            <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">
              {stats.system_health.system_status.disk_usage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Simple Bar Chart */}
        <div className="h-48 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            System Performance (Last 12 readings)
          </div>
          <div className="flex items-end justify-between h-32 space-x-1">
            {recentMetrics.map((metric, index) => {
              const maxValue = Math.max(
                ...recentMetrics.map((m) => m.cpu_usage)
              );
              const height = (metric.cpu_usage / maxValue) * 100;

              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full bg-gradient-to-t from-blue-500 to-blue-400 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metric.cpu_usage.toFixed(0)}%
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Metrics Legend */}
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded mr-1"></div>
            CPU Usage
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded mr-1"></div>
            Memory Usage
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-purple-500 rounded mr-1"></div>
            Disk Usage
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mb-4"></div>
          <p className="text-card-info dark:text-card-info-dark">
            Loading dashboard data...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <div className="flex items-center">
          <div className="text-red-400 mr-3">⚠️</div>
          <div>
            <h3 className="text-red-800 dark:text-red-300 font-medium">
              Error Loading Dashboard
            </h3>
            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Upper Section: Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading dark:text-heading-dark text-xl font-semibold">
              System Analytics
            </h3>
            <div className="flex items-center space-x-2 text-card-info dark:text-card-info-dark">
              <FiTrendingUp />
              <span className="text-sm">Real-time metrics</span>
            </div>
          </div>

          {renderAnalyticsChart()}
        </div>

        {/* Recent Activity */}
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-heading dark:text-heading-dark text-xl font-semibold">
              Recent Activity
            </h3>
            <StandardButton
              onClick={() => navigate('/admin-panel/recent-activity')}
              color="info-outline"
              className="text-sm"
            >
              View All
            </StandardButton>
          </div>

          <div className="space-y-4">
            {activities.length > 0 ? (
              activities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start space-x-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0"
                >
                  <div className="text-lg flex-shrink-0 mt-0.5">
                    {getActivityIcon(activity.action, activity.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-heading dark:text-heading-dark font-medium leading-snug">
                      {activity.description}
                    </p>
                    <p className="text-xs text-card-info dark:text-card-info-dark mt-1">
                      {formatTimestamp(activity.timestamp)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-card-info dark:text-card-info-dark">
                <p className="text-sm">No recent activity to display</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Section: System Status & Admin Links */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Status */}
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-heading dark:text-heading-dark text-xl font-semibold mb-4">
            System Status
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-card-info dark:text-card-info-dark">
                Database
              </span>
              <span className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-info dark:text-card-info-dark">
                API Services
              </span>
              <span className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-card-info dark:text-card-info-dark">
                File Storage
              </span>
              <span className="flex items-center text-green-600 dark:text-green-400">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Operational
              </span>
            </div>
            <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
              <StandardButton
                onClick={() => navigate('/admin-panel/health')}
                color="secondary-btn"
                className="w-full justify-center"
              >
                View Detailed Status
              </StandardButton>
            </div>
          </div>
        </div>

        {/* Django Admin Access */}
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-heading dark:text-heading-dark text-xl font-semibold mb-4">
            Django Admin Access
          </h3>
          <p className="text-card-info dark:text-card-info-dark text-sm mb-4">
            Access the traditional Django admin interface for advanced model
            management.
          </p>

          <div className="space-y-3">
            <a
              href="/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center shadow-sm"
            >
              Open Django Admin
              <svg
                className="w-4 h-4 ml-2"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
            </a>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md p-3">
              <p className="text-blue-800 dark:text-blue-200 text-xs">
                <strong>Note:</strong> Django Admin opens in a new tab. You may
                need to authenticate again.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
