import React, { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../components/ui/StandardButton';
import { SearchBar } from '../../components/ui/SearchBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { StatsCard } from '../../components/ui/StatCard';
import { TabSwitcher } from '../../components/navigation/TabSwitcher';
import { RefreshButton } from '../../components/ui/RefreshButton';
import { FiFileText, FiBook, FiUsers } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { globalSettings } from '../../api/adminApi';
import type { CourseOverview, ExamOverview } from '../../types/globalSettings';
import { TemplateManagement } from '../../components/admin/TemplateManagement';

type GlobalSettingsTab = 'templates' | 'courses-overview' | 'exams-overview';

export const AdminGlobalConfig = () => {
  const [activeTab, setActiveTab] = useState<GlobalSettingsTab>('templates');
  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Data states
  const [courses, setCourses] = useState<CourseOverview[]>([]);
  const [exams, setExams] = useState<ExamOverview[]>([]);
  const [statistics, setStatistics] = useState({
    total_courses: 0,
    active_courses: 0,
    total_exams: 0,
    active_exams: 0,
    upcoming_exams: 0,
    total_templates: 0,
    default_templates: 0,
  });

  // Search states
  const [searchTerm, setSearchTerm] = useState('');

  // Load data based on active tab
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'templates': {
          const templatesResponse = await globalSettings.templates.getAll();
          if (templatesResponse.success) {
            setStatistics((prev) => ({
              ...prev,
              ...templatesResponse.statistics,
            }));
          }
          break;
        }
        case 'courses-overview': {
          const coursesResponse = await globalSettings.coursesOverview.getAll({
            search: searchTerm,
          });
          if (coursesResponse.success) {
            setCourses(coursesResponse.courses || []);
            setStatistics((prev) => ({
              ...prev,
              ...coursesResponse.statistics,
            }));
          }
          break;
        }
        case 'exams-overview': {
          const examsResponse = await globalSettings.examsOverview.getAll({
            search: searchTerm,
          });
          if (examsResponse.success) {
            setExams(examsResponse.exams || []);
            setStatistics((prev) => ({
              ...prev,
              ...examsResponse.statistics,
            }));
          }
          break;
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Prevent navigation with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleTabChange = (newTab: string) => {
    if (hasUnsavedChanges) {
      const confirmLeave = window.confirm(
        'You have unsaved changes. Are you sure you want to leave this tab?'
      );
      if (!confirmLeave) return;
      setHasUnsavedChanges(false);
    }
    setActiveTab(newTab as GlobalSettingsTab);
    setSearchTerm(''); // Clear search when switching tabs
  };

  const handleRefreshData = async () => {
    await loadData();
    toast.success('Data refreshed successfully');
  };

  const renderTemplates = () => <TemplateManagement />;

  const renderCoursesOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading dark:text-heading-dark">
            Courses Overview
          </h2>
          <p className="text-card-info dark:text-card-info-dark text-sm mt-1">
            Comprehensive view of all courses with creator information and
            statistics
          </p>
        </div>
        <div className="w-80">
          <SearchBar
            placeholder="Search courses by code or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
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
          title="Total Instructors"
          value={
            courses.length > 0
              ? new Set(courses.map((c) => c.creator_id)).size
              : 0
          }
          icon={<FiUsers className="w-5 h-5" />}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-card-info dark:text-card-info-dark">
            Loading courses...
          </div>
        </div>
      ) : courses.length === 0 ? (
        <div className="bg-card dark:bg-card-dark p-8 rounded-lg border border-input-border dark:border-input-border-dark text-center">
          <div className="text-card-info dark:text-card-info-dark">
            {searchTerm
              ? 'No courses match the current search.'
              : 'No courses found.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="bg-card dark:bg-card-dark p-6 rounded-lg border border-input-border dark:border-input-border-dark hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-heading dark:text-heading-dark">
                      {course.code}
                    </h3>
                    <StatusBadge status="valid">{course.term}</StatusBadge>
                  </div>
                  <h4 className="text-md font-medium text-heading dark:text-heading-dark mb-2">
                    {course.name}
                  </h4>
                  {course.description && (
                    <p className="text-card-info dark:text-card-info-dark text-sm mb-3">
                      {course.description}
                    </p>
                  )}
                  <div className="flex items-center gap-6 text-sm text-card-info dark:text-card-info-dark">
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
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
                    <div className="font-medium text-heading dark:text-heading-dark">
                      {course.student_count} Students
                    </div>
                    <div className="text-card-info dark:text-card-info-dark">
                      {course.exam_count} Exams
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderExamsOverview = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading dark:text-heading-dark">
            Exams Overview
          </h2>
          <p className="text-card-info dark:text-card-info-dark text-sm mt-1">
            Comprehensive view of all exams with course and creator information
          </p>
        </div>
        <div className="w-80">
          <SearchBar
            placeholder="Search exams by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatsCard
          title="Total Exams"
          value={statistics.total_exams}
          icon={<FiFileText className="w-5 h-5" />}
        />
        <StatsCard
          title="Active Exams"
          value={statistics.active_exams}
          icon={<FiFileText className="w-5 h-5" />}
        />
        <StatsCard
          title="Upcoming Exams"
          value={statistics.upcoming_exams}
          icon={<FiFileText className="w-5 h-5" />}
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-card-info dark:text-card-info-dark">
            Loading exams...
          </div>
        </div>
      ) : exams.length === 0 ? (
        <div className="bg-card dark:bg-card-dark p-8 rounded-lg border border-input-border dark:border-input-border-dark text-center">
          <div className="text-card-info dark:text-card-info-dark">
            {searchTerm
              ? 'No exams match the current search.'
              : 'No exams found.'}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {exams.map((exam) => (
            <div
              key={exam.id}
              className="bg-card dark:bg-card-dark p-6 rounded-lg border border-input-border dark:border-input-border-dark hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-heading dark:text-heading-dark">
                      {exam.title}
                    </h3>
                    <StatusBadge
                      status={exam.status === 'active' ? 'valid' : 'issues'}
                    >
                      {exam.status}
                    </StatusBadge>
                  </div>
                  <h4 className="text-md font-medium text-heading dark:text-heading-dark mb-2">
                    {exam.course_code} - {exam.course_name}
                  </h4>
                  <div className="flex items-center gap-6 text-sm text-card-info dark:text-card-info-dark">
                    <div className="flex items-center gap-2">
                      <FiUsers className="w-4 h-4" />
                      <span>{exam.creator_name}</span>
                    </div>
                    <div>
                      Start: {new Date(exam.start_time).toLocaleString()}
                    </div>
                    <div>Duration: {exam.duration_minutes} minutes</div>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <div className="text-sm">
                    <div className="font-medium text-heading dark:text-heading-dark">
                      {exam.total_questions} Questions
                    </div>
                    <div className="text-card-info dark:text-card-info-dark">
                      {exam.total_marks} Points
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {/* Tab Navigation with Refresh Button */}
      <div className="flex items-center justify-between mb-6">
        <TabSwitcher
          tabs={[
            {
              label: 'Exam Templates',
              value: 'templates',
              icon: <FiFileText className="w-4 h-4" />,
            },
            {
              label: 'Courses Overview',
              value: 'courses-overview',
              icon: <FiBook className="w-4 h-4" />,
            },
            {
              label: 'Exams Overview',
              value: 'exams-overview',
              icon: <FiFileText className="w-4 h-4" />,
            },
          ]}
          activeTab={activeTab}
          onTabChange={handleTabChange}
          className="flex-1"
        />
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <div className="flex items-center text-amber-600 text-sm">
              <div className="w-2 h-2 bg-amber-600 rounded-full mr-2"></div>
              Unsaved changes
            </div>
          )}
          <RefreshButton onClick={handleRefreshData} loading={loading} />
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'templates' && renderTemplates()}
        {activeTab === 'courses-overview' && renderCoursesOverview()}
        {activeTab === 'exams-overview' && renderExamsOverview()}
      </div>
    </div>
  );
};
