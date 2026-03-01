// src/pages/CourseAnalytics.tsx
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CourseDataInsights } from '../components/Analytics/CourseDataInsights';
import { courseAPI } from '../api/courseAPI';
import type { Course } from '../types/course';
import { InstructorLayout } from '../components/Layouts/InstructorLayout';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export const CourseAnalytics = () => {
  const { id } = useParams();
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) loadCourse(parseInt(id, 10));
  }, [id]);

  const loadCourse = async (courseId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const courseData = await courseAPI.getCourseDetail(courseId);
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load course:', err);
      setError('Failed to load course analytics. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <InstructorLayout noSidebarPadding>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-gray-500">Loading course analytics...</div>
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
          {/* Header with back button */}
          <div className="flex items-center gap-4 mb-6">
            <Link
              to={`/courses/${course.id}`}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={20} />
              Back to Course
            </Link>
            <div className="h-6 w-px bg-gray-300" />
            <h1 className="text-2xl font-bold text-gray-900">
              {course.code} Analytics
            </h1>
          </div>

          {/* Course Analytics */}
          <CourseDataInsights course={course} />
        </div>
      </div>
    </InstructorLayout>
  );
};
