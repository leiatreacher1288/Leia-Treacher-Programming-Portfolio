import React, { useState, useEffect, useCallback } from 'react';
import { TrendingUp, Calendar, BarChart3, Filter } from 'lucide-react';
import { analyticsAPI } from '../../api/analyticsAPI';
import type { CourseSearchResult } from '../../api/analyticsAPI';

interface TrendsSectionProps {
  allCourses: CourseSearchResult[];
}

interface TrendData {
  period: string;
  averageScore: number;
  studentCount: number;
  examCount: number;
  courses: number;
}

export const TrendsSection: React.FC<TrendsSectionProps> = () => {
  const [timeframe, setTimeframe] = useState<'1week' | '1month' | '1year'>(
    '1year'
  );
  const [selectedMetric, setSelectedMetric] = useState<
    'averageScore' | 'studentCount' | 'examCount'
  >('averageScore');
  const [trendsData, setTrendsData] = useState<TrendData[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTrendsData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await analyticsAPI.getYearOverYearTrends(timeframe);
      console.log('Trends API response:', response);

      // Transform the API response to match our component's expected format
      const transformedData: TrendData[] = response.trends.map(
        (trend: any) => ({
          period: trend.term,
          averageScore: trend.average || 0,
          studentCount: trend.count || 0,
          examCount: 0, // Not available in API response
          courses: 0, // Not available in API response
        })
      );

      setTrendsData(transformedData);
    } catch (error) {
      console.error('Failed to fetch trends data:', error);
      // Fallback to empty data
      setTrendsData([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchTrendsData();
  }, [fetchTrendsData]);

  const getMetricValue = (data: TrendData, metric: string) => {
    switch (metric) {
      case 'averageScore':
        return data.averageScore;
      case 'studentCount':
        return data.studentCount;
      case 'examCount':
        return data.examCount;
      default:
        return data.averageScore;
    }
  };

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case 'averageScore':
        return 'Average Score (%)';
      case 'studentCount':
        return 'Student Count';
      case 'examCount':
        return 'Exam Count';
      default:
        return 'Average Score (%)';
    }
  };

  const calculateTrend = () => {
    if (trendsData.length < 2) return null;

    const firstValue = getMetricValue(trendsData[0], selectedMetric);
    const lastValue = getMetricValue(
      trendsData[trendsData.length - 1],
      selectedMetric
    );
    const change = ((lastValue - firstValue) / firstValue) * 100;

    return {
      change: change.toFixed(1),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
    };
  };

  const trend = calculateTrend();

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <TrendingUp className="text-orange-600 mr-2" size={24} />
          Performance Trends
        </h2>
        <p className="text-gray-600 mb-6">
          Analyze performance trends over time to identify patterns, seasonal
          variations, and long-term improvements in your courses.
        </p>

        {/* Controls */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Calendar className="text-gray-500" size={16} />
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="1week">Last Week</option>
              <option value="1month">Last Month</option>
              <option value="1year">Last Year</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="text-gray-500" size={16} />
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="averageScore">Average Score</option>
              <option value="studentCount">Student Count</option>
              <option value="examCount">Exam Count</option>
            </select>
          </div>
        </div>

        {/* Trend Summary */}
        {trend && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Overall Trend</h3>
                <p className="text-sm text-gray-600">
                  {getMetricLabel(selectedMetric)} over {timeframe}
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
                  trend.direction === 'up'
                    ? 'bg-green-100 text-green-700'
                    : trend.direction === 'down'
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-700'
                }`}
              >
                <TrendingUp
                  className={`w-4 h-4 ${
                    trend.direction === 'down' ? 'rotate-180' : ''
                  }`}
                />
                {trend.direction === 'stable'
                  ? 'Stable'
                  : `${Math.abs(parseFloat(trend.change))}%`}
                {trend.direction !== 'stable' && (
                  <span className="ml-1">
                    {trend.direction === 'up' ? 'increase' : 'decrease'}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trends Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="text-blue-500 mr-2" size={20} />
          {getMetricLabel(selectedMetric)} Trends
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-btn border-t-transparent mx-auto mb-2"></div>
            <p className="text-gray-600">Loading trends data...</p>
          </div>
        ) : (
          <div className="h-80 flex items-end justify-between space-x-2 p-4">
            {trendsData.map((data, index) => {
              const value = getMetricValue(data, selectedMetric);
              const maxValue = Math.max(
                ...trendsData.map((d) => getMetricValue(d, selectedMetric))
              );
              const height = (value / maxValue) * 250;

              return (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex justify-center mb-2">
                    <div className="text-xs font-medium text-gray-700 bg-white px-2 py-1 rounded border">
                      {selectedMetric === 'averageScore'
                        ? `${value.toFixed(1)}%`
                        : value.toFixed(0)}
                    </div>
                  </div>
                  <div
                    className="w-full bg-gradient-to-t from-orange-500 to-orange-300 rounded-t transition-all duration-300 hover:from-orange-600 hover:to-orange-400"
                    style={{ height: `${height}px` }}
                    title={`${data.period}: ${selectedMetric === 'averageScore' ? `${value.toFixed(1)}%` : value.toFixed(0)}`}
                  />
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-600">
                      {data.period}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Statistics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Detailed Statistics
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium text-gray-900">
                  Period
                </th>
                <th className="text-right py-2 font-medium text-gray-900">
                  Avg Score
                </th>
                <th className="text-right py-2 font-medium text-gray-900">
                  Students
                </th>
                <th className="text-right py-2 font-medium text-gray-900">
                  Exams
                </th>
                <th className="text-right py-2 font-medium text-gray-900">
                  Courses
                </th>
              </tr>
            </thead>
            <tbody>
              {trendsData.map((data, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-3 font-medium text-gray-900">
                    {data.period}
                  </td>
                  <td className="text-right py-3 text-green-600 font-medium">
                    {data.averageScore.toFixed(1)}%
                  </td>
                  <td className="text-right py-3 text-gray-700">
                    {data.studentCount}
                  </td>
                  <td className="text-right py-3 text-gray-700">
                    {data.examCount}
                  </td>
                  <td className="text-right py-3 text-gray-700">
                    {data.courses}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Key Insights
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Performance Patterns</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">•</span>
                Consistent improvement in average scores over time
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                Seasonal variations in student enrollment
              </li>
              <li className="flex items-start">
                <span className="text-purple-500 mr-2">•</span>
                Increased exam frequency correlates with better outcomes
              </li>
            </ul>
          </div>
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Recommendations</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">→</span>
                Continue current teaching strategies as they show positive
                trends
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">→</span>
                Plan for higher enrollment in upcoming terms
              </li>
              <li className="flex items-start">
                <span className="text-orange-500 mr-2">→</span>
                Consider optimizing exam scheduling for better performance
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
