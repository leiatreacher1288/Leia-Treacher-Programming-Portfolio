import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { CourseStatisticsDisplay } from '../components/Analytics/CourseStatisticsDisplay';
import { AnalyticsErrorBoundary } from '../components/Analytics/AnalyticsErrorBoundary';
// Analytics Section Components (we'll create these)
import DashboardSection from '../components/Analytics/DashboardSection';
import { StudentReportSection } from '../components/Analytics/StudentReportSection';
import { CompareCoursesSection } from '../components/Analytics/CompareCoursesSection';
import { TrendsSection } from '../components/Analytics/TrendsSection';
import { SimilarityFlagsSection } from '../components/Analytics/SimilarityFlagsSection';
import {
  analyticsAPI,
  type CourseStatistics,
  type CourseSearchResult,
} from '../api/analyticsAPI';
import {
  TrendingUp,
  Home,
  Flag,
  Users,
  GitCompare,
  RefreshCw,
} from 'lucide-react';

export const Analytics = () => {
  // we call the hook so it can redirect if unauthenticated,
  // but we don't destructure anything from it yet.
  useAuth();

  // Tab state for switching between sections
  const [selectedTab, setSelectedTab] = useState<string>('dashboard');

  const [selectedCourse, setSelectedCourse] = useState<string | null>(null);
  const [courseStatistics, setCourseStatistics] =
    useState<CourseStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Course data state
  const [allCourses, setAllCourses] = useState<CourseSearchResult[]>([]);

  // Add refresh trigger state
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  // Real-time data refresh function
  const refreshData = useCallback(async () => {
    try {
      const courses = await analyticsAPI.getAllCoursesForAnalytics();
      // Ensure we always set an array, even if API returns unexpected format
      if (Array.isArray(courses)) {
        setAllCourses(courses);
      } else {
        console.warn('API returned non-array courses data:', courses);
        setAllCourses([]);
      }
      // Update refresh key to trigger re-render of child components
      setRefreshKey(Date.now());

      // Trigger dashboard refresh if on dashboard tab
      if (selectedTab === 'dashboard') {
        setDashboardRefreshTrigger(Date.now());
      }
    } catch (error) {
      console.error('Failed to load all courses:', error);
      setAllCourses([]);
    }
  }, [selectedTab]); // Add selectedTab as dependency

  // Add refresh key state for forcing component updates
  const [refreshKey, setRefreshKey] = useState(0);

  // Load all courses on component mount and set up auto-refresh
  useEffect(() => {
    refreshData();
  }, [refreshData]); // Now refreshData is stable due to useCallback

  const handleCourseSelect = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    setIsLoading(true);
    setError(null);

    try {
      const statistics = await analyticsAPI.getCourseStatistics(courseCode);
      setCourseStatistics(statistics);
    } catch (err) {
      console.error('Failed to load course statistics:', err);
      setError('Failed to load course statistics. Please try again.');
      setCourseStatistics(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Tab configuration
  const tabs = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      color: 'bg-primary-btn hover:bg-primary-btn-hover',
    },
    {
      id: 'student-reports',
      label: 'Student Reports',
      icon: Users,
      color: 'bg-info-btn hover:bg-info-btn-hover',
    },
    {
      id: 'compare-courses',
      label: 'Compare Courses',
      icon: GitCompare,
      color: 'bg-accent-indigo hover:bg-primary-btn-hover',
    },
    {
      id: 'trends',
      label: 'View Trends',
      icon: TrendingUp,
      color: 'bg-warning-btn hover:bg-warning-btn-hover',
    },
    {
      id: 'similarity-flags',
      label: 'Similarity Flags',
      icon: Flag,
      color: 'bg-danger-btn hover:bg-danger-btn-hover',
    },
  ];

  return (
    <div
      className="fixed top-0 right-0 bottom-0 bg-white text-gray-800 font-inter overflow-y-auto"
      style={{ left: '16rem', width: 'calc(100vw - 16rem)' }}
    >
      <div className="px-8 py-10">
        {/* Title and Navigation Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-heading text-3xl font-bold">Analytics</h1>
            <button
              onClick={refreshData}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Refresh data"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          <div className="flex items-center gap-3 mb-6 flex-wrap">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = selectedTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`
                    flex items-center gap-2 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors
                    ${isActive ? tab.color : 'bg-gray-400 hover:bg-gray-500'}
                  `}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Conditional Section Rendering */}
        {selectedTab === 'dashboard' && (
          <div>
            {/* Loading State */}
            {isLoading && (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-btn border-t-transparent mr-3"></div>
                <span className="text-gray-600">
                  Loading course statistics...
                </span>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-6">
                <div className="flex items-center">
                  <div className="text-red-600">
                    <svg
                      className="w-5 h-5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <span className="ml-3 text-red-800">{error}</span>
                  <button
                    onClick={() =>
                      selectedCourse && handleCourseSelect(selectedCourse)
                    }
                    className="ml-4 text-red-600 hover:text-red-800 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {/* Course Statistics Display */}
            {courseStatistics && !isLoading && !error && (
              <AnalyticsErrorBoundary
                fallbackMessage="Failed to display course statistics. The data might be incomplete or there was an error processing the course analytics."
                onRetry={() => {
                  if (selectedCourse) {
                    handleCourseSelect(selectedCourse);
                  }
                }}
              >
                <CourseStatisticsDisplay statistics={courseStatistics} />
              </AnalyticsErrorBoundary>
            )}

            {/* Always show the Dashboard Section when on dashboard tab */}
            {!isLoading && !error && (
              <div className="space-y-6">
                <DashboardSection refreshTrigger={dashboardRefreshTrigger} />
              </div>
            )}
          </div>
        )}

        {selectedTab === 'student-reports' && (
          <StudentReportSection
            key={refreshKey}
            allCourses={allCourses || []}
          />
        )}

        {selectedTab === 'compare-courses' && (
          <CompareCoursesSection allCourses={allCourses || []} />
        )}

        {selectedTab === 'trends' && (
          <TrendsSection allCourses={allCourses || []} />
        )}

        {selectedTab === 'similarity-flags' && (
          <SimilarityFlagsSection allCourses={allCourses || []} />
        )}
      </div>
    </div>
  );
};
