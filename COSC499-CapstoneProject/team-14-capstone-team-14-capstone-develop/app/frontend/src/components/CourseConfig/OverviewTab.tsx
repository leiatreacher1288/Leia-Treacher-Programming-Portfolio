// src/components/CourseConfig/OverviewTab.tsx
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { courseAPI } from '../../api/courseAPI';
import { examAPI } from '../../api/examAPI';
import { studentAPI } from '../../api/studentAPI';
import type { Course, CourseActivity } from '../../api/courseAPI';
import type { Exam } from '../../api/examAPI';
import {
  Users,
  FileText,
  Clock,
  Award,
  UserPlus,
  UserMinus,
  Settings,
} from 'lucide-react';

interface OverviewTabProps {
  courseId: number;
}

interface ActivityItem {
  type: 'exam' | 'student' | 'instructor' | 'course';
  action: string;
  date: string;
  details: string;
  user: string;
}

interface CourseStats {
  totalStudents: number;
  totalExams: number;
  upcomingExams: number;
  completedExams: number;
  averageScore: number | null;
  recentActivity: ActivityItem[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ courseId }) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [stats, setStats] = useState<CourseStats>({
    totalStudents: 0,
    totalExams: 0,
    upcomingExams: 0,
    completedExams: 0,
    averageScore: null,
    recentActivity: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper function to determine activity type from backend activity_type
  const getActivityType = (
    activityType: string
  ): 'exam' | 'student' | 'instructor' | 'course' => {
    if (activityType.includes('exam') || activityType.includes('variant')) {
      return 'exam';
    }
    if (activityType.includes('student')) {
      return 'student';
    }
    if (activityType.includes('instructor')) {
      return 'instructor';
    }
    return 'course';
  };

  // Helper function to format activity description
  const formatActivityDescription = (activity: CourseActivity): string => {
    // The backend already provides a nice description like "John added student 'Jane Doe'"
    // We can extract just the action part if needed
    const description = activity.description;

    // Remove the username from the beginning since we show it separately
    const userPattern = new RegExp(`^${activity.user}\\s+`);
    return (
      description.replace(userPattern, '').charAt(0).toUpperCase() +
      description.replace(userPattern, '').slice(1)
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1) Fetch course details
        const courseData = await courseAPI.getCourseDetail(courseId);
        setCourse(courseData);

        // 2) Fetch exams, students, and activity in parallel
        const [examsData, studentsData, activityData] = await Promise.all([
          examAPI.getExams(courseId),
          studentAPI.getStudents(courseId),
          courseAPI.getCourseActivity(courseId),
        ]);

        // 3) Calculate course average from exam results
        let totalScore = 0;
        let totalResultCount = 0;

        // Fetch results for each exam
        const examResultsPromises = examsData.map((exam) =>
          examAPI.getExamResults(exam.id).catch(() => null)
        );

        const allExamResults = await Promise.all(examResultsPromises);

        // Calculate average across all exam results
        allExamResults.forEach((examResult) => {
          if (
            examResult &&
            examResult.results &&
            examResult.results.length > 0
          ) {
            examResult.results.forEach((result) => {
              if (typeof result.percentage_score === 'number') {
                totalScore += result.percentage_score;
                totalResultCount++;
              }
            });
          }
        });

        const courseAverage =
          totalResultCount > 0
            ? Math.round((totalScore / totalResultCount) * 10) / 10
            : null;

        // 4) Compute basic stats
        const now = new Date();
        const upcoming = examsData.filter((exam: Exam) =>
          exam.scheduled_date ? new Date(exam.scheduled_date) > now : false
        ).length;
        const completed = examsData.filter((exam: Exam) =>
          exam.scheduled_date ? new Date(exam.scheduled_date) <= now : false
        ).length;

        // 5) Transform real activity data from backend
        const recentActivity: ActivityItem[] = activityData
          .slice(0, 10)
          .map((activity) => ({
            type: getActivityType(activity.activity_type),
            action: formatActivityDescription(activity),
            date: new Date(activity.created_at).toLocaleDateString(),
            details: activity.description,
            user: activity.user,
          }));

        // 6) Write to state
        setStats({
          totalStudents: studentsData.length,
          totalExams: examsData.length,
          upcomingExams: upcoming,
          completedExams: completed,
          averageScore: courseAverage,
          recentActivity: recentActivity,
        });
      } catch (err) {
        console.error(err);
        setError('Failed to load overview data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId]);

  if (loading) {
    return (
      <div className="w-full bg-card p-6 rounded-xl shadow-sm mb-10">
        <div className="flex items-center justify-center py-20 text-gray-500">
          Loading overview...
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="w-full bg-card p-6 rounded-xl shadow-sm mb-10">
        <div className="flex items-center justify-center py-20 text-red-500">
          {error || 'No overview data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-card p-6 rounded-xl shadow-sm mb-10">
      {/* Course Description */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-900">
          Course Description
        </h3>
        <p className="text-gray-700">
          {course.description || 'No description available.'}
        </p>
      </div>

      {/* Course Information */}
      <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900">
          Course Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-medium text-gray-900">Course Code</p>
            <p>{course.code}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Term</p>
            <p>{course.term}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Created On</p>
            <p>{new Date(course.created_at).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Main Instructor</p>
            <p>{course.instructor || 'Not specified'}</p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Users className="text-blue-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats.totalStudents}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Students</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <FileText className="text-green-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats.totalExams}
            </span>
          </div>
          <p className="text-sm text-gray-600">Total Exams</p>
        </div>

        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <Award className="text-orange-500" size={24} />
            <span className="text-2xl font-bold text-gray-900">
              {stats.averageScore !== null ? `${stats.averageScore}%` : 'N/A'}
            </span>
          </div>
          <p className="text-sm text-gray-600">Course Average</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-5 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-4 text-gray-900 flex items-center gap-2">
          <Clock size={20} />
          Recent Activity
        </h3>
        {stats.recentActivity.length > 0 ? (
          <div className="max-h-96 overflow-y-auto space-y-3 pr-2">
            {stats.recentActivity.map((activity, idx) => {
              // Determine colors and icons based on activity type
              let bgColor = 'bg-gray-100';
              let iconColor = 'text-gray-600';
              let Icon = Settings;

              if (activity.type === 'exam') {
                bgColor = 'bg-blue-100';
                iconColor = 'text-blue-600';
                Icon = FileText;
              } else if (activity.type === 'student') {
                bgColor = 'bg-green-100';
                iconColor = 'text-green-600';
                Icon = Users;

                // Use different icon for student removal
                if (activity.details.toLowerCase().includes('removed')) {
                  Icon = UserMinus;
                  bgColor = 'bg-red-100';
                  iconColor = 'text-red-600';
                } else {
                  Icon = UserPlus;
                }
              } else if (activity.type === 'instructor') {
                bgColor = 'bg-yellow-100';
                iconColor = 'text-yellow-600';
                Icon = Users;
              } else if (activity.type === 'course') {
                bgColor = 'bg-purple-100';
                iconColor = 'text-purple-600';
                Icon = Settings;
              }

              return (
                <div
                  key={idx}
                  className="flex items-start gap-3 pb-3 border-b border-gray-100 last:border-0"
                >
                  <div className={`p-2 rounded-full ${bgColor}`}>
                    <Icon size={16} className={iconColor} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.details}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.date} • by {activity.user}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500">No recent activity</p>
        )}
      </div>
    </div>
  );
};

OverviewTab.propTypes = {
  courseId: PropTypes.number.isRequired,
};
