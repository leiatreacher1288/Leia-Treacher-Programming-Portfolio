import React, { useState } from 'react';
import { GitCompare, Trophy, TrendingUp, BarChart3 } from 'lucide-react';
import { analyticsAPI } from '../../api/analyticsAPI';
import type { CourseSearchResult } from '../../api/analyticsAPI';

interface CompareCoursesProps {
  allCourses: CourseSearchResult[];
}

interface CourseComparison {
  course1: CourseSearchResult;
  course2: CourseSearchResult;
  metrics: {
    averageScore: { course1: number; course2: number };
    studentCount: { course1: number; course2: number };
    examCount: { course1: number; course2: number };
    passRate: { course1: number; course2: number };
    difficultyIndex: { course1: number; course2: number };
  };
  trends: Array<{
    term: string;
    course1Score: number;
    course2Score: number;
  }>;
}

export const CompareCoursesSection: React.FC<CompareCoursesProps> = ({
  allCourses,
}) => {
  const [selectedCourse1, setSelectedCourse1] = useState<string>('');
  const [selectedCourse2, setSelectedCourse2] = useState<string>('');
  const [comparison, setComparison] = useState<CourseComparison | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCompare = async () => {
    if (!selectedCourse1 || !selectedCourse2) return;

    setLoading(true);

    try {
      const course1 = allCourses.find((c) => c.code === selectedCourse1);
      const course2 = allCourses.find((c) => c.code === selectedCourse2);

      if (!course1 || !course2) return;

      // Call the real comparison API
      const response = await analyticsAPI.compareCourses([
        course1.id,
        course2.id,
      ]);
      console.log('Compare courses API response:', response);

      if (response && response.length >= 2) {
        const course1Data = response.find(
          (c: any) => c.course.id === course1.id
        );
        const course2Data = response.find(
          (c: any) => c.course.id === course2.id
        );

        if (course1Data && course2Data) {
          setComparison({
            course1,
            course2,
            metrics: {
              averageScore: {
                course1: course1Data.metrics.averageScore,
                course2: course2Data.metrics.averageScore,
              },
              studentCount: {
                course1: course1Data.metrics.studentCount,
                course2: course2Data.metrics.studentCount,
              },
              examCount: {
                course1: course1Data.metrics.examCount,
                course2: course2Data.metrics.examCount,
              },
              passRate: {
                course1: course1Data.metrics.passRate,
                course2: course2Data.metrics.passRate,
              },
              difficultyIndex: { course1: 0, course2: 0 }, // Not available in API
            },
            trends: [], // Not available in API
          });
        }
      }
    } catch (error) {
      console.error('Failed to compare courses:', error);
      // Show error state
      setComparison(null);
    } finally {
      setLoading(false);
    }
  };

  const renderMetricComparison = (
    label: string,
    value1: number,
    value2: number,
    unit: string = '',
    format: 'number' | 'percentage' = 'number'
  ) => {
    const formattedValue1 =
      format === 'percentage'
        ? `${value1.toFixed(1)}%`
        : `${value1.toFixed(1)}${unit}`;
    const formattedValue2 =
      format === 'percentage'
        ? `${value2.toFixed(1)}%`
        : `${value2.toFixed(1)}${unit}`;

    const winner =
      value1 > value2 ? 'course1' : value2 > value1 ? 'course2' : 'tie';

    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">{label}</h4>
        <div className="grid grid-cols-2 gap-4">
          <div
            className={`text-center p-3 rounded ${winner === 'course1' ? 'bg-green-100 border-2 border-green-300' : 'bg-white border'}`}
          >
            <p className="text-sm text-gray-600">{comparison?.course1.code}</p>
            <p
              className={`text-xl font-bold ${winner === 'course1' ? 'text-green-600' : 'text-gray-900'}`}
            >
              {formattedValue1}
            </p>
            {winner === 'course1' && (
              <Trophy className="w-4 h-4 text-yellow-500 mx-auto mt-1" />
            )}
          </div>
          <div
            className={`text-center p-3 rounded ${winner === 'course2' ? 'bg-green-100 border-2 border-green-300' : 'bg-white border'}`}
          >
            <p className="text-sm text-gray-600">{comparison?.course2.code}</p>
            <p
              className={`text-xl font-bold ${winner === 'course2' ? 'text-green-600' : 'text-gray-900'}`}
            >
              {formattedValue2}
            </p>
            {winner === 'course2' && (
              <Trophy className="w-4 h-4 text-yellow-500 mx-auto mt-1" />
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border">
        <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <GitCompare className="text-purple-600 mr-2" size={24} />
          Compare Courses
        </h2>
        <p className="text-gray-600 mb-6">
          Compare performance across different courses and terms to identify
          trends, difficulties, and improvement opportunities.
        </p>

        {/* Course Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Course
            </label>
            <select
              value={selectedCourse1}
              onChange={(e) => setSelectedCourse1(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="">Select first course...</option>
              {allCourses &&
                Array.isArray(allCourses) &&
                allCourses.map((course) => (
                  <option key={`course1-${course.id}`} value={course.code}>
                    {course.code} - {course.title}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Second Course
            </label>
            <select
              value={selectedCourse2}
              onChange={(e) => setSelectedCourse2(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="">Select second course...</option>
              {allCourses &&
                Array.isArray(allCourses) &&
                allCourses
                  .filter((course) => course.code !== selectedCourse1)
                  .map((course) => (
                    <option key={`course2-${course.id}`} value={course.code}>
                      {course.code} - {course.title}
                    </option>
                  ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleCompare}
          disabled={!selectedCourse1 || !selectedCourse2 || loading}
          className="w-full py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Comparing...' : 'Compare Courses'}
        </button>
      </div>

      {/* Comparison Results */}
      {comparison && (
        <div className="space-y-6">
          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {renderMetricComparison(
              'Average Score',
              comparison.metrics.averageScore.course1,
              comparison.metrics.averageScore.course2,
              '',
              'percentage'
            )}
            {renderMetricComparison(
              'Student Count',
              comparison.metrics.studentCount.course1,
              comparison.metrics.studentCount.course2
            )}
            {renderMetricComparison(
              'Pass Rate',
              comparison.metrics.passRate.course1,
              comparison.metrics.passRate.course2,
              '',
              'percentage'
            )}
          </div>

          {/* Trends Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="text-blue-500 mr-2" size={20} />
              Performance Trends Over Time
            </h3>
            <div className="h-64 flex items-end justify-between space-x-2">
              {comparison.trends.map((trend, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full flex gap-1">
                    <div
                      className="flex-1 bg-blue-500 rounded-t"
                      style={{
                        height: `${(trend.course1Score / 100) * 200}px`,
                      }}
                      title={`${comparison.course1.code}: ${trend.course1Score.toFixed(1)}%`}
                    />
                    <div
                      className="flex-1 bg-purple-500 rounded-t"
                      style={{
                        height: `${(trend.course2Score / 100) * 200}px`,
                      }}
                      title={`${comparison.course2.code}: ${trend.course2Score.toFixed(1)}%`}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <p className="text-xs font-medium text-gray-600">
                      {trend.term}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-center space-x-6">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">
                  {comparison.course1.code}
                </span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                <span className="text-sm text-gray-600">
                  {comparison.course2.code}
                </span>
              </div>
            </div>
          </div>

          {/* Detailed Analysis */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="text-green-500 mr-2" size={20} />
              Detailed Analysis
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Key Insights</h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {comparison.metrics.averageScore.course1 >
                    comparison.metrics.averageScore.course2
                      ? `${comparison.course1.code} shows better overall performance`
                      : `${comparison.course2.code} shows better overall performance`}
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2">•</span>
                    Both courses show improvement trends over time
                  </li>
                  <li className="flex items-start">
                    <span className="text-purple-500 mr-2">•</span>
                    Class sizes are comparable for meaningful comparison
                  </li>
                  <li className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    Consider sharing best practices between courses
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">
                  Recommendations
                </h4>
                <ul className="space-y-2 text-sm text-gray-700">
                  <li className="flex items-start">
                    <span className="text-primary-btn mr-2">→</span>
                    Review assessment strategies from higher-performing course
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-btn mr-2">→</span>
                    Analyze content difficulty and pacing differences
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-btn mr-2">→</span>
                    Consider standardizing successful teaching methods
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary-btn mr-2">→</span>
                    Monitor trends for early intervention opportunities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {!comparison && !loading && (
        <div className="text-center py-12 text-gray-500">
          <GitCompare size={48} className="mx-auto mb-4 text-gray-300" />
          <p>Select two courses to compare their performance metrics</p>
        </div>
      )}
    </div>
  );
};
