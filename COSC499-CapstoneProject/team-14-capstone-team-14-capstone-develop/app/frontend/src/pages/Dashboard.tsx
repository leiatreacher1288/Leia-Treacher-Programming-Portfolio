import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { QuickActions } from '../components/QuickActions';
import { RecentlyAccessedExams } from '../components/Exams/RecentlyAccessedExams';
import { DataInsights } from '../components/Analytics/DataInsights';
import { Toaster } from 'react-hot-toast';
import { courseAPI, type Course } from '../api/courseAPI';
import { examAPI, type Exam as ExamAPI } from '../api/examAPI';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  useAuth();
  const navigate = useNavigate();

  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<ExamAPI[]>([]);

  // Add missing handleExamCreated function
  const handleExamCreated = (exam: {
    id: string | number;
    title: string;
    course?: number;
    courseId?: string | number;
  }) => {
    // Convert to Exam format for dashboard
    const examForState: ExamAPI = {
      id: typeof exam.id === 'string' ? parseInt(exam.id, 10) : exam.id,
      title: exam.title,
      description: '',
      exam_type: 'quiz',
      course_code: '',
      course_term: '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by_name: 'Current User',
      question_count: 0,
      variant_count: 0,
      weight: 100,
      required_to_pass: false,
      lastOpened: new Date().toISOString(),
      canExport: false,
    };
    setExams((prevExams) => [...prevExams, examForState]);
  };

  useEffect(() => {
    // Fetch courses and exams for the user
    const fetchData = async () => {
      try {
        const userCourses = await courseAPI.getCourses();
        const userExams = await examAPI.getExams();
        setCourses(userCourses);
        setExams(userExams);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchData();
  }, []);

  // Add missing return statement and proper JSX structure
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-heading mb-2">Dashboard</h1>
          <p className="text-card-info">
            Welcome back! Here&apos;s an overview of your recent exam activity.
          </p>
        </div>

        {/* Quick Actions */}
        <QuickActions
          courses={courses}
          exams={exams}
          onNavigate={navigate}
          onExamCreated={handleExamCreated}
        />

        {/* Recently Accessed Exams */}
        <RecentlyAccessedExams />

        {/* Toast Notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            className: 'font-inter text-sm',
            success: {
              iconTheme: {
                primary: '#10B981',
                secondary: '#FFFFFF',
              },
            },
            error: {
              iconTheme: {
                primary: '#EF4444',
                secondary: '#FFFFFF',
              },
            },
          }}
        />
      </div>
    </div>
  );
}
