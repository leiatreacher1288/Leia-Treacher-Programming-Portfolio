// src/pages/CourseDetail.tsx
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { OverviewTab } from '../components/CourseConfig/OverviewTab';
import { QuestionBanksTab } from '../components/CourseConfig/QuestionBanksTab';
import { ExamsTab } from '../components/CourseConfig/ExamsTab';
import { StudentsTab } from '../components/CourseConfig/StudentsTab';
import { CourseSettings } from '../components/CourseConfig/CourseSettings';
import { TabSwitcher } from '../components/navigation/TabSwitcher';
import { courseAPI } from '../api/courseAPI';
import type { Course } from '../types/course';
import { CourseHeader } from '../components/cards/CourseHeader';
import { InstructorLayout } from '../components/Layouts/InstructorLayout';
import { AlertTriangle, ChevronRight, Home } from 'lucide-react';

type Tab = 'overview' | 'questionbanks' | 'exams' | 'students' | 'settings';

export const CourseDetail = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user was redirected from exam creation
  const fromExamCreation = searchParams.get('fromExamCreation') === 'true';

  // Check for tab parameter in URL
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (id) loadCourse(parseInt(id, 10));
  }, [id]);

  // Handle tab parameter from URL
  useEffect(() => {
    if (
      tabParam &&
      ['overview', 'questionbanks', 'exams', 'students', 'settings'].includes(
        tabParam
      )
    ) {
      setActiveTab(tabParam as Tab);
    }
  }, [tabParam]);

  // Handle hash navigation for exam creation redirect
  useEffect(() => {
    if (fromExamCreation && window.location.hash === '#question-banks') {
      setActiveTab('questionbanks');
    }
  }, [fromExamCreation]);

  const loadCourse = async (courseId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const courseData = await courseAPI.getCourseDetail(courseId);
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load course:', err);
      setError('Failed to load course. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCourseUpdate = async (courseData: {
    code: string;
    name: string;
    description: string;
    term: string;
    banner?: string;
  }) => {
    if (!course) return;

    try {
      // Map the data to match the API expectations
      const updateData = {
        code: courseData.code,
        name: courseData.name, // API expects 'name' for the course title
        description: courseData.description,
        term: courseData.term,
        ...(courseData.banner && { banner: courseData.banner }),
      };

      // Update the course via API
      const updatedCourse = await courseAPI.updateCourse(course.id, updateData);
      setCourse(updatedCourse);
    } catch (err) {
      console.error('Failed to update course:', err);
      throw err; // Re-throw to let the modal handle the error
    }
  };

  if (isLoading) {
    return (
      <InstructorLayout noSidebarPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading course...</div>
        </div>
      </InstructorLayout>
    );
  }

  if (error || !course) {
    return (
      <InstructorLayout noSidebarPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-red-600 text-2xl font-bold mb-4">
              {error || 'Course Not Found'}
            </h1>
            <button
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover"
            >
              Go Back
            </button>
          </div>
        </div>
      </InstructorLayout>
    );
  }

  return (
    <InstructorLayout noSidebarPadding>
      <div className="w-full p-6">
        <div className="w-full space-y-6">
          {/* Course Header */}
          <CourseHeader course={course} onCourseUpdate={handleCourseUpdate} />

          {/* Breadcrumbs */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4 ml-3">
            <Link
              to="/dashboard"
              className="flex items-center hover:text-primary-btn transition-colors"
            >
              <Home size={16} className="mr-1" />
              Dashboard
            </Link>
            <ChevronRight size={16} />
            <Link
              to="/courses"
              className="hover:text-primary-btn transition-colors"
            >
              Courses
            </Link>
            <ChevronRight size={16} />
            <span className="text-gray-900 font-medium">
              {course.code} - {course.title}
            </span>
          </nav>

          {/* Banner for exam creation redirect */}
          {fromExamCreation && activeTab === 'questionbanks' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle
                  className="text-yellow-600 mt-0.5 flex-shrink-0"
                  size={20}
                />
                <div className="flex-1">
                  <h3 className="text-yellow-800 font-medium mb-1">
                    Question Banks Required
                  </h3>
                  <p className="text-yellow-700 text-sm mb-3">
                    You need at least one Question Bank before you can create an
                    exam. Once you add a question bank, you'll be able to launch
                    the exam creation wizard.
                  </p>
                  <button
                    onClick={() => {
                      // Navigate to exam wizard with course ID
                      window.location.href = `/exam-wizard?courseId=${id}`;
                    }}
                    className="text-yellow-800 hover:text-yellow-900 text-sm font-medium underline"
                  >
                    Back to Exam Creation
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tab Switcher */}
          <TabSwitcher
            tabs={[
              { label: 'Overview', value: 'overview' },
              { label: 'Question Banks', value: 'questionbanks' },
              { label: 'Exams', value: 'exams' },
              { label: 'Students', value: 'students' },
              { label: 'Instructors', value: 'settings' },
            ]}
            activeTab={activeTab}
            onTabChange={(tab) => setActiveTab(tab as Tab)}
          />
          {/* Tab Content */}
          <div className="mt-6">
            {activeTab === 'overview' && <OverviewTab courseId={course.id} />}
            {activeTab === 'questionbanks' && (
              <QuestionBanksTab courseId={course.id} />
            )}
            {activeTab === 'exams' && <ExamsTab courseId={course.id} />}
            {activeTab === 'students' && <StudentsTab courseId={course.id} />}
            {activeTab === 'settings' && (
              <CourseSettings courseId={course.id} />
            )}
          </div>
        </div>
      </div>
    </InstructorLayout>
  );
};
