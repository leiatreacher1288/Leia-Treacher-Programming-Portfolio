// src/components/Analytics/CourseStatisticsDisplay.tsx
import React from 'react';
import { TrendingUp, Users, BookOpen, Award, Calendar } from 'lucide-react';
import { ResponsiveLine } from '@nivo/line';
import type { Point } from '@nivo/line';
import type { CourseStatistics } from '../../api/analyticsAPI';

interface CourseStatisticsDisplayProps {
  statistics: CourseStatistics;
}

export const CourseStatisticsDisplay: React.FC<
  CourseStatisticsDisplayProps
> = ({ statistics }) => {
  // Defensive check for statistics data
  if (!statistics) {
    return (
      <div className="flex items-center justify-center p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="text-center">
          <div className="text-gray-400 mb-2">
            <BookOpen size={48} className="mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">
            No Data Available
          </h3>
          <p className="text-gray-500">
            Course statistics are not available at this time.
          </p>
        </div>
      </div>
    );
  }

  // Safely access historicalData with fallback to empty array
  const historicalData = statistics.historicalData ?? [];

  // Prepare data for Nivo Line chart with safe defaults
  const chartData = [
    {
      id: 'performance',
      color: '#3B82F6',
      data: historicalData.map((item) => ({
        x: `${item?.term ?? 'Unknown'} ${item?.year ?? 'N/A'}`,
        y: item?.average ?? 0,
        // Store additional data for tooltip with safe defaults
        term: item?.term ?? 'Unknown',
        year: item?.year ?? 'N/A',
        semester: item?.semester ?? 'Unknown',
        studentCount: item?.studentCount ?? 0,
        professor: item?.professor ?? 'Unknown',
        ta: item?.ta ?? 'Unknown',
      })),
    },
  ];

  // Custom tooltip component for Nivo
  const CustomTooltip = ({ point }: { point: Point<any> }) => {
    const data = point.data as any;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg text-sm">
        <div className="font-semibold text-gray-900 mb-2">
          {data.term} {data.year} ({data.semester})
        </div>
        <div className="space-y-1">
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Average:</span>
            <span className="font-medium">{data.y}%</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Students:</span>
            <span className="font-medium">{data.studentCount}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">Professor:</span>
            <span className="font-medium">{data.professor}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-gray-600">TA:</span>
            <span className="font-medium">{data.ta}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Course Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <BookOpen className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {statistics.courseCode ?? 'Unknown Course'}
            </h2>
            <p className="text-gray-600 text-lg">
              {statistics.courseName ?? 'Course Name Not Available'}
            </p>
            <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Calendar size={14} />
                {statistics.totalSections ?? 0} sections analyzed
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="text-green-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Average (All Years)</h3>
          </div>
          <div className="text-3xl font-bold text-green-600 mb-1">
            {statistics.averageAllYears ?? 'N/A'}%
          </div>
          <p className="text-sm text-gray-500">
            Across all {statistics.totalSections ?? 0} sections
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="text-blue-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">
              Average (Last 5 Years)
            </h3>
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-1">
            {statistics.averageLast5Years ?? 'N/A'}%
          </div>
          <p className="text-sm text-gray-500">Recent performance trend</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Award className="text-purple-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Max Section Average</h3>
          </div>
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {statistics.maxSectionAverage ?? 'N/A'}%
          </div>
          <p className="text-sm text-gray-500">Best performing section</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="text-orange-600" size={20} />
            </div>
            <h3 className="font-semibold text-gray-900">Min Section Average</h3>
          </div>
          <div className="text-3xl font-bold text-orange-600 mb-1">
            {statistics.minSectionAverage ?? 'N/A'}%
          </div>
          <p className="text-sm text-gray-500">Lowest performing section</p>
        </div>
      </div>

      {/* Historical Performance Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Historical Average Performance Trend
        </h3>
        {historicalData.length > 0 ? (
          <>
            <div style={{ height: '400px' }}>
              <ResponsiveLine
                data={chartData}
                margin={{ top: 50, right: 60, bottom: 100, left: 60 }}
                xScale={{ type: 'point' }}
                yScale={{
                  type: 'linear',
                  min: 'auto',
                  max: 'auto',
                  stacked: false,
                  reverse: false,
                }}
                yFormat=" >-.1f"
                axisTop={null}
                axisRight={null}
                axisBottom={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: -45,
                  legend: 'Term',
                  legendOffset: 80,
                  legendPosition: 'middle',
                }}
                axisLeft={{
                  tickSize: 5,
                  tickPadding: 5,
                  tickRotation: 0,
                  legend: 'Average Score (%)',
                  legendOffset: -45,
                  legendPosition: 'middle',
                }}
                pointSize={8}
                pointColor="#3B82F6"
                pointBorderWidth={2}
                pointBorderColor="#1e3a8a"
                pointLabelYOffset={-12}
                useMesh={true}
                enableGridX={false}
                enableGridY={true}
                gridYValues={5}
                colors={['#3B82F6']}
                lineWidth={3}
                enablePoints={true}
                enableArea={false}
                curve="monotoneX"
                animate={true}
                motionConfig={{
                  mass: 1,
                  tension: 120,
                  friction: 14,
                }}
                tooltip={CustomTooltip}
                theme={{
                  background: 'transparent',
                  text: {
                    fontSize: 11,
                    fill: '#6B7280',
                    fontFamily: 'Inter, sans-serif',
                  },
                  axis: {
                    domain: {
                      line: {
                        stroke: '#E5E7EB',
                        strokeWidth: 1,
                      },
                    },
                    legend: {
                      text: {
                        fontSize: 12,
                        fill: '#374151',
                        fontWeight: 600,
                      },
                    },
                    ticks: {
                      line: {
                        stroke: '#E5E7EB',
                        strokeWidth: 1,
                      },
                      text: {
                        fontSize: 11,
                        fill: '#6B7280',
                      },
                    },
                  },
                  grid: {
                    line: {
                      stroke: '#F3F4F6',
                      strokeWidth: 1,
                    },
                  },
                  crosshair: {
                    line: {
                      stroke: '#3B82F6',
                      strokeWidth: 1,
                      strokeOpacity: 0.5,
                    },
                  },
                }}
              />
            </div>
            <p className="text-sm text-gray-500 mt-4">
              Hover over data points to see detailed information about each term
              including professor, TA, and student count.
            </p>
          </>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <TrendingUp size={48} className="mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-1">
                No Historical Data
              </h4>
              <p className="text-gray-500">
                No performance trend data is available for this course.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Professor and TA Information by Year */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">
          Instructors and TAs by Year
        </h3>
        {historicalData.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Year
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Term
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Semester
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Professor
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    TA
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Students
                  </th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">
                    Average
                  </th>
                </tr>
              </thead>
              <tbody>
                {[...historicalData]
                  .sort(
                    (a, b) =>
                      (b?.year ?? 0) - (a?.year ?? 0) ||
                      (a?.term ?? '').localeCompare(b?.term ?? '')
                  )
                  .map((item, index) => (
                    <tr
                      key={`${item?.year ?? 'unknown'}-${item?.term ?? 'unknown'}-${index}`}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                      }`}
                    >
                      <td className="py-3 px-4 text-gray-900">
                        {item?.year ?? 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item?.term ?? 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            (item?.semester ?? '') === 'Winter'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {item?.semester ?? 'Unknown'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-900">
                        {item?.professor ?? 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {item?.ta ?? 'Unknown'}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        <div className="flex items-center gap-1">
                          <Users size={14} />
                          {item?.studentCount ?? 0}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`font-semibold ${
                            (item?.average ?? 0) >= 80
                              ? 'text-green-600'
                              : (item?.average ?? 0) >= 70
                                ? 'text-blue-600'
                                : (item?.average ?? 0) >= 60
                                  ? 'text-orange-600'
                                  : 'text-red-600'
                          }`}
                        >
                          {item?.average ?? 'N/A'}%
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 mb-2">
                <Users size={48} className="mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-1">
                No Instructor Data
              </h4>
              <p className="text-gray-500">
                No instructor and TA information is available for this course.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
