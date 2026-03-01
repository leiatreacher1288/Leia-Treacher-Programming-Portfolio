import React, { useState, useEffect } from 'react';
import {
  FiActivity,
  FiDatabase,
  FiServer,
  FiHardDrive,
  FiCpu,
  FiWifi,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
} from 'react-icons/fi';
import { ResponsivePie } from '@nivo/pie';
import { ResponsiveLine } from '@nivo/line';
import { adminApi } from '../../api/adminApi';
import { RefreshButton } from '../../components/ui/RefreshButton';

interface SystemStatus {
  database: 'operational' | 'degraded' | 'down';
  api_services: 'operational' | 'degraded' | 'down';
  file_storage: 'operational' | 'degraded' | 'down';
  memory_usage: number;
  cpu_usage: number;
  disk_usage: number;
  active_users: number;
  total_requests: number;
  error_rate: number;
  response_time: number;
}

interface HealthMetrics {
  timestamp: string;
  memory_usage: number;
  cpu_usage: number;
  active_users: number;
  requests_per_minute: number;
}

export const AdminHealth = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [healthMetrics, setHealthMetrics] = useState<HealthMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getHealth();

      if (response.success) {
        const data = response.data as {
          system_status: SystemStatus;
          metrics: HealthMetrics[];
        };
        setSystemStatus(data.system_status);
        setHealthMetrics(data.metrics || []);
      } else {
        setError('Failed to fetch health data');
      }
    } catch (err) {
      setError('Error fetching health data');
      console.error('Health data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();

    // Refresh every 30 seconds
    const interval = setInterval(fetchHealthData, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <FiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'degraded':
        return <FiAlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'down':
        return <FiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return <FiAlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return 'text-green-600 dark:text-green-400';
      case 'degraded':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getUsageColor = (usage: number) => {
    if (usage < 60) return 'text-green-600 dark:text-green-400';
    if (usage < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  // Prepare chart data
  const systemUsageData = systemStatus
    ? [
        { id: 'Memory', value: systemStatus.memory_usage, color: '#3B82F6' },
        { id: 'CPU', value: systemStatus.cpu_usage, color: '#10B981' },
        { id: 'Disk', value: systemStatus.disk_usage, color: '#F59E0B' },
      ]
    : [];

  const performanceData = healthMetrics.map((metric) => ({
    x: new Date(metric.timestamp).toLocaleTimeString(),
    y: metric.requests_per_minute,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-btn"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <FiAlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-heading dark:text-heading-dark mb-2">
            System Health Unavailable
          </h2>
          <p className="text-card-info dark:text-card-info-dark">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Action Buttons */}
      <div className="flex justify-end">
        <RefreshButton onClick={fetchHealthData} loading={loading} />
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiDatabase className="w-6 h-6 text-primary-btn" />
              <h3 className="text-lg font-semibold text-heading dark:text-heading-dark">
                Database
              </h3>
            </div>
            {systemStatus && getStatusIcon(systemStatus.database)}
          </div>
          <p
            className={`text-sm font-medium ${getStatusColor(systemStatus?.database || 'unknown')}`}
          >
            {systemStatus?.database || 'Unknown'}
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiServer className="w-6 h-6 text-primary-btn" />
              <h3 className="text-lg font-semibold text-heading dark:text-heading-dark">
                API Services
              </h3>
            </div>
            {systemStatus && getStatusIcon(systemStatus.api_services)}
          </div>
          <p
            className={`text-sm font-medium ${getStatusColor(systemStatus?.api_services || 'unknown')}`}
          >
            {systemStatus?.api_services || 'Unknown'}
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <FiHardDrive className="w-6 h-6 text-primary-btn" />
              <h3 className="text-lg font-semibold text-heading dark:text-heading-dark">
                File Storage
              </h3>
            </div>
            {systemStatus && getStatusIcon(systemStatus.file_storage)}
          </div>
          <p
            className={`text-sm font-medium ${getStatusColor(systemStatus?.file_storage || 'unknown')}`}
          >
            {systemStatus?.file_storage || 'Unknown'}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* System Usage Chart */}
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
            <FiCpu />
            System Resource Usage
          </h3>
          <div className="h-64">
            <ResponsivePie
              data={systemUsageData}
              margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              innerRadius={0.5}
              padAngle={0.7}
              cornerRadius={3}
              activeOuterRadiusOffset={8}
              colors={{ scheme: 'nivo' }}
              borderWidth={1}
              borderColor={{ from: 'color', modifiers: [['darker', 0.2]] }}
              arcLinkLabelsSkipAngle={10}
              arcLinkLabelsTextColor="#333"
              arcLinkLabelsThickness={2}
              arcLinkLabelsColor={{ from: 'color' }}
              arcLabelsSkipAngle={10}
              arcLabelsTextColor={{ from: 'color', modifiers: [['darker', 2]] }}
              legends={[
                {
                  anchor: 'bottom',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#999',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                },
              ]}
            />
          </div>
        </div>

        {/* Performance Chart */}
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-heading dark:text-heading-dark mb-4 flex items-center gap-2">
            <FiActivity />
            Request Performance
          </h3>
          <div className="h-64">
            <ResponsiveLine
              data={[
                {
                  id: 'Requests per Minute',
                  data: performanceData,
                },
              ]}
              margin={{ top: 20, right: 20, bottom: 40, left: 40 }}
              xScale={{ type: 'point' }}
              yScale={{ type: 'linear', min: 'auto', max: 'auto' }}
              axisTop={null}
              axisRight={null}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Time',
                legendOffset: 36,
                legendPosition: 'middle',
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'Requests/min',
                legendOffset: -40,
                legendPosition: 'middle',
              }}
              pointSize={10}
              pointColor={{ theme: 'background' }}
              pointBorderWidth={2}
              pointBorderColor={{ from: 'serieColor' }}
              pointLabelYOffset={-12}
              useMesh={true}
              legends={[
                {
                  anchor: 'top',
                  direction: 'row',
                  justify: false,
                  translateX: 0,
                  translateY: -20,
                  itemsSpacing: 0,
                  itemDirection: 'left-to-right',
                  itemWidth: 80,
                  itemHeight: 20,
                  itemOpacity: 0.75,
                  symbolSize: 12,
                  symbolShape: 'circle',
                },
              ]}
            />
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FiWifi className="w-5 h-5 text-primary-btn" />
            <h4 className="text-sm font-medium text-card-info dark:text-card-info-dark">
              Active Users
            </h4>
          </div>
          <p className="text-2xl font-bold text-heading dark:text-heading-dark">
            {systemStatus?.active_users || 0}
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FiActivity className="w-5 h-5 text-primary-btn" />
            <h4 className="text-sm font-medium text-card-info dark:text-card-info-dark">
              Total Requests
            </h4>
          </div>
          <p className="text-2xl font-bold text-heading dark:text-heading-dark">
            {systemStatus?.total_requests || 0}
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FiAlertCircle className="w-5 h-5 text-primary-btn" />
            <h4 className="text-sm font-medium text-card-info dark:text-card-info-dark">
              Error Rate
            </h4>
          </div>
          <p
            className={`text-2xl font-bold ${getUsageColor(systemStatus?.error_rate || 0)}`}
          >
            {(systemStatus?.error_rate || 0).toFixed(2)}%
          </p>
        </div>

        <div className="bg-card dark:bg-card-dark p-6 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-2">
            <FiCpu className="w-5 h-5 text-primary-btn" />
            <h4 className="text-sm font-medium text-card-info dark:text-card-info-dark">
              Response Time
            </h4>
          </div>
          <p className="text-2xl font-bold text-heading dark:text-heading-dark">
            {(systemStatus?.response_time || 0).toFixed(0)}ms
          </p>
        </div>
      </div>
    </div>
  );
};
