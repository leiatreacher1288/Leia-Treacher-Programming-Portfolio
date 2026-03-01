// src/data/mockAnalyticsData.ts
// Mock data for analytics testing and development

import type {
  CourseStatistics,
  CourseSearchResult,
  InstructorOverview,
  QuestionStatistics,
  GradeDistribution,
  PerformanceMetrics,
} from '../api/analyticsAPI';

export const mockCourseStatistics = (courseCode: string): CourseStatistics => {
  // Generate realistic historical data
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 8 }, (_, i) => currentYear - i).reverse();

  return {
    courseCode,
    courseName: `Sample Course for ${courseCode}`,
    totalSections: 3,
    averageAllYears: 76.8,
    averageLast5Years: 78.2,
    maxSectionAverage: 84.5,
    minSectionAverage: 71.2,

    historicalData: years.map((year, index) => ({
      year,
      term: index % 2 === 0 ? 'W1' : 'W2',
      semester: (index % 2 === 0 ? 'Winter' : 'Summer') as 'Winter' | 'Summer',
      average: 75 + Math.floor(Math.random() * 15),
      studentCount: 140 + Math.floor(Math.random() * 30),
      professor: 'Dr. Sample',
      ta: 'TA Sample',
    })),
  };
};

export const mockAllCourses = (): CourseSearchResult[] => [
  {
    id: 1,
    code: 'COSC 101',
    title: 'Digital Citizenship',
    description: 'Introduction to responsible technology use',
    term: 'W1 2025',
  },
  {
    id: 2,
    code: 'COSC 111',
    title: 'Computer Programming I',
    description: 'Introduction to programming using Python',
    term: 'W1 2025',
  },
  {
    id: 3,
    code: 'COSC 121',
    title: 'Computer Programming II',
    description: 'Object-oriented programming concepts',
    term: 'W1 2025',
  },
  {
    id: 4,
    code: 'MATH 101',
    title: 'Calculus I',
    description: 'Differential and integral calculus',
    term: 'W1 2025',
  },
  {
    id: 5,
    code: 'STAT 230',
    title: 'Probability and Statistics',
    description: 'Introduction to statistical methods',
    term: 'W1 2025',
  },
];

export const mockInstructorOverview = (): InstructorOverview => ({
  overview: {
    total_courses: 5,
    total_students: 517,
    total_exams: 23,
    average_grade: 76.8,
  },
  top_performing_courses: [
    {
      id: 1,
      code: 'COSC 121',
      name: 'Computer Programming II',
      avg_score: 82.1,
      student_count: 76,
      exam_count: 4,
    },
    {
      id: 2,
      code: 'STAT 230',
      name: 'Probability and Statistics',
      avg_score: 79.3,
      student_count: 98,
      exam_count: 5,
    },
  ],
  recent_activity: [
    {
      type: 'exam',
      action: 'Created exam: Final Exam',
      course: 'COSC 121',
      date: '2025-01-20',
      relative_date: '8 days ago',
    },
    {
      type: 'exam',
      action: 'Created exam: Midterm',
      course: 'MATH 101',
      date: '2025-01-15',
      relative_date: '13 days ago',
    },
  ],
  grade_trends: [
    { month: 'Jan', average: 73.8 },
    { month: 'Feb', average: 74.8 },
    { month: 'Mar', average: 75.8 },
    { month: 'Apr', average: 77.8 },
    { month: 'May', average: 78.8 },
    { month: 'Jun', average: 76.8 },
  ],
});

export const mockQuestionAnalytics = () => ({
  questionStatistics: Array.from(
    { length: 20 },
    (_, i): QuestionStatistics => ({
      questionNumber: i + 1,
      difficulty: 0.1 + i * 0.04,
      discrimination: 0.2 + i * 0.03,
      pointBiserial: 0.1 + i * 0.025,
      missedCount: Math.max(5, 85 - i * 3),
      correctPercent: Math.max(20, 95 - i * 3),
      averageTime: 60 + i * 10,
      examId: 1,
      examTitle: 'Mock Exam',
    })
  ),
  totalQuestions: 20,
  examCount: 8,
});

export const mockGradeDistribution = () => ({
  distribution: [
    { range: 'A (90-100%)', count: 28, percentage: 11.4 },
    { range: 'B (80-89%)', count: 67, percentage: 27.3 },
    { range: 'C (70-79%)', count: 89, percentage: 36.3 },
    { range: 'D (60-69%)', count: 45, percentage: 18.4 },
    { range: 'F (0-59%)', count: 16, percentage: 6.5 },
  ] as GradeDistribution[],
  totalResults: 245,
});

export const mockPerformanceMetrics = (): PerformanceMetrics => ({
  mean: 74.2,
  median: 76.5,
  standardDeviation: 12.8,
  skewness: -0.3,
  reliability: 0.847,
  totalResults: 245,
});

// Development flag to enable/disable mock data
export const USE_MOCK_DATA = false; // Use real analytics data when available
// process.env.NODE_ENV === 'development' &&
// localStorage.getItem('use-mock-analytics') === 'true';

export const toggleMockData = () => {
  const current = localStorage.getItem('use-mock-analytics') === 'true';
  localStorage.setItem('use-mock-analytics', (!current).toString());
  window.location.reload();
};
