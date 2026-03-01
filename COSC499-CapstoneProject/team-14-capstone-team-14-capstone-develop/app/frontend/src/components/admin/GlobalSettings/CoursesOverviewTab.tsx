import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StandardButton } from '../../ui/StandardButton';
import { SearchBar } from '../../ui/SearchBar';
import { StatusBadge } from '../../ui/StatusBadge';
import { StatsCard } from '../../ui/StatCard';
import { FiSearch, FiRefreshCw, FiUser, FiBook } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { globalSettings } from '../../../api/adminApi';
import type { CourseOverview } from '../../../types/globalSettings';

export const CoursesOverviewTab: React.FC = () => {
  const [courses, setCourses] = useState<CourseOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    creator: '',
    term: '',
  });
  const [statistics] = useState({
    total_courses: 0,
    active_courses: 0,
    filtered_count: 0,
  });

  const loadCourses = useCallback(async () => {
    try {
      setLoading(true);
      const response = await globalSettings.coursesOverview.getAll();
      if (response.success) {
        setCourses(response.courses || []);
      }
    } catch (error) {
      toast.error('Failed to load courses');
      console.error('Error loading courses:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Filter and search courses
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchesSearch =
        searchTerm === '' ||
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.creator_name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesTerm =
        filters.term === 'all' || course.term === filters.term;

      return matchesSearch && matchesTerm;
    });
  }, [courses, searchTerm, filters]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    // Listen for refresh events
    const handleRefresh = () => loadCourses();
    window.addEventListener('refresh-global-settings', handleRefresh);
    return () =>
      window.removeEventListener('refresh-global-settings', handleRefresh);
  }, [loadCourses]);

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilters({ creator: '', term: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading">
            Courses Overview
          </h2>
          <p className="text-card-info text-sm mt-1">
            Comprehensive view of all courses with creator information and
            statistics
          </p>
        </div>
        <StandardButton
          onClick={loadCourses}
          disabled={loading}
          className="flex items-center gap-2"
          size="sm"
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </StandardButton>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Courses"
          value={statistics.total_courses}
          icon={<FiBook className="w-5 h-5" />}
        />
        <StatsCard
          title="Active Courses"
          value={statistics.active_courses}
          icon={<FiBook className="w-5 h-5" />}
        />
        <StatsCard
          title="Filtered Results"
          value={statistics.filtered_count}
          icon={<FiSearch className="w-5 h-5" />}
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-lg border space-y-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <SearchBar
              placeholder="Search courses by code or name..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <StandardButton onClick={clearFilters} variant="outline" size="sm">
            Clear Filters
          </StandardButton>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Creator
            </label>
            <select
              value={filters.creator}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, creator: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Creators</option>
              {/* Add unique creators from courses */}
              {Array.from(
                new Set(courses.map((course) => course.creator_id))
              ).map((creatorId) => {
                const course = courses.find((c) => c.creator_id === creatorId);
                return course ? (
                  <option key={creatorId} value={creatorId}>
                    {course.creator_name}
                  </option>
                ) : null;
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Term
            </label>
            <select
              value={filters.term}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, term: e.target.value }))
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Terms</option>
              {Array.from(new Set(courses.map((course) => course.term)))
                .sort()
                .map((term) => (
                  <option key={term} value={term}>
                    {term}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      {/* Courses List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-card-info">Loading courses...</div>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-card-info">
            {searchTerm || filters.creator || filters.term
              ? 'No courses match the current filters.'
              : 'No courses found.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-heading">
                      {course.code}
                    </h3>
                    <StatusBadge status="valid">{course.term}</StatusBadge>
                  </div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    {course.name}
                  </h4>
                  {course.description && (
                    <p className="text-card-info text-sm mb-3">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-card-info">
                    <div className="flex items-center gap-2">
                      <FiUser className="w-4 h-4" />
                      <span>
                        {course.creator_name} ({course.creator_email})
                      </span>
                    </div>
                    <div>
                      Created:{' '}
                      {new Date(course.created_at).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-sm">
                    <div className="font-medium text-heading">
                      {course.student_count} Students
                    </div>
                    <div className="text-card-info">
                      {course.exam_count} Exams
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination would go here if needed */}
      {filteredCourses.length > 0 && (
        <div className="text-center text-sm text-card-info">
          Showing {filteredCourses.length} of {courses.length} courses
        </div>
      )}
    </div>
  );
};
