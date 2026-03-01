// src/mock/mockAnalyticsComponents.ts
// Mock data specifically for analytics components

export interface StudentReport {
  student: {
    id: number;
    name: string;
    studentId: string;
    email: string;
    section: string;
    overallScore?: number;
    examsTaken: number;
    lastActivity: string;
  };
  coursePerformance: Array<{
    courseCode: string;
    courseName: string;
    examCount: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    improvement: number;
  }>;
  examDetails: Array<{
    examId: number;
    examTitle: string;
    score: number;
    maxScore: number;
    percentile: number;
    timeTaken: string;
    date: string;
  }>;
  recommendations: string[];
}

export interface CourseComparison {
  course1: {
    id: number;
    code: string;
    title: string;
    description?: string;
    term: string;
  };
  course2: {
    id: number;
    code: string;
    title: string;
    description?: string;
    term: string;
  };
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

export interface TrendData {
  period: string;
  averageScore: number;
  studentCount: number;
  examCount: number;
  courses: number;
}

export interface SimilarityFlag {
  id: number;
  type: 'high' | 'medium' | 'low';
  course: string;
  exam: string;
  studentPair: {
    student1: { name: string; id: string };
    student2: { name: string; id: string };
  };
  similarityScore: number;
  flaggedQuestions: number[];
  dateDetected: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  reviewer?: string;
  notes?: string;
}

export interface ExportConfig {
  format: 'pdf' | 'csv' | 'excel';
  scope: 'all' | 'course' | 'custom';
  selectedCourses: string[];
  dateRange: {
    start: string;
    end: string;
  };
  includeCharts: boolean;
  includeRawData: boolean;
  includeAnalysis: boolean;
  includeSummary: boolean;
}

// Mock data generators
export const generateMockStudentReports = (
  courseCode: string
): StudentReport[] => [
  {
    student: {
      id: 1,
      name: 'Alice Johnson',
      studentId: 'A123456',
      email: 'alice.johnson@student.ubc.ca',
      section: 'L01',
      overallScore: 87.5,
      examsTaken: 3,
      lastActivity: '2 days ago',
    },
    coursePerformance: [
      {
        courseCode,
        courseName: 'Selected Course',
        examCount: 3,
        averageScore: 87.5,
        bestScore: 95.0,
        worstScore: 76.0,
        improvement: 8.5,
      },
    ],
    examDetails: [
      {
        examId: 1,
        examTitle: 'Midterm Exam 1',
        score: 85,
        maxScore: 100,
        percentile: 78,
        timeTaken: '45 minutes',
        date: '2024-02-15',
      },
      {
        examId: 2,
        examTitle: 'Quiz 1',
        score: 92,
        maxScore: 100,
        percentile: 85,
        timeTaken: '20 minutes',
        date: '2024-03-01',
      },
      {
        examId: 3,
        examTitle: 'Final Exam',
        score: 88,
        maxScore: 100,
        percentile: 82,
        timeTaken: '2 hours',
        date: '2024-04-20',
      },
    ],
    recommendations: [
      'Focus on conceptual understanding in chapters 3-5',
      'Practice more time management during exams',
      'Review mathematical foundations',
      'Consider attending office hours for clarification',
    ],
  },
  {
    student: {
      id: 2,
      name: 'Bob Smith',
      studentId: 'B234567',
      email: 'bob.smith@student.ubc.ca',
      section: 'L01',
      overallScore: 92.1,
      examsTaken: 3,
      lastActivity: '1 day ago',
    },
    coursePerformance: [
      {
        courseCode,
        courseName: 'Selected Course',
        examCount: 3,
        averageScore: 92.1,
        bestScore: 98.0,
        worstScore: 84.0,
        improvement: 12.3,
      },
    ],
    examDetails: [
      {
        examId: 1,
        examTitle: 'Midterm Exam 1',
        score: 94,
        maxScore: 100,
        percentile: 92,
        timeTaken: '40 minutes',
        date: '2024-02-15',
      },
      {
        examId: 2,
        examTitle: 'Quiz 1',
        score: 98,
        maxScore: 100,
        percentile: 98,
        timeTaken: '15 minutes',
        date: '2024-03-01',
      },
      {
        examId: 3,
        examTitle: 'Final Exam',
        score: 84,
        maxScore: 100,
        percentile: 75,
        timeTaken: '1.5 hours',
        date: '2024-04-20',
      },
    ],
    recommendations: [
      'Excellent overall performance',
      'Consider peer tutoring opportunities',
      'Focus on time management for longer exams',
      'Maintain consistent study habits',
    ],
  },
];

export const generateMockCourseComparison = (
  course1: {
    id: number;
    code: string;
    title: string;
    description?: string;
    term: string;
  },
  course2: {
    id: number;
    code: string;
    title: string;
    description?: string;
    term: string;
  }
): CourseComparison => ({
  course1,
  course2,
  metrics: {
    averageScore: {
      course1: 78.5 + Math.random() * 15,
      course2: 78.5 + Math.random() * 15,
    },
    studentCount: {
      course1: Math.floor(50 + Math.random() * 100),
      course2: Math.floor(50 + Math.random() * 100),
    },
    examCount: {
      course1: Math.floor(2 + Math.random() * 4),
      course2: Math.floor(2 + Math.random() * 4),
    },
    passRate: {
      course1: 85 + Math.random() * 10,
      course2: 85 + Math.random() * 10,
    },
    difficultyIndex: {
      course1: 3.2 + Math.random() * 1.5,
      course2: 3.2 + Math.random() * 1.5,
    },
  },
  trends: [
    { term: 'W1 2023', course1Score: 76.2, course2Score: 81.4 },
    { term: 'S1 2023', course1Score: 78.9, course2Score: 79.2 },
    { term: 'S2 2023', course1Score: 82.1, course2Score: 83.7 },
    { term: 'W1 2024', course1Score: 79.8, course2Score: 78.9 },
    { term: 'S1 2024', course1Score: 84.3, course2Score: 85.1 },
    { term: 'S2 2024', course1Score: 86.7, course2Score: 84.2 },
  ],
});

export const generateMockTrendsData = (
  timeframe: '6months' | '1year' | '2years'
): TrendData[] => {
  let periods: TrendData[] = [];

  if (timeframe === '6months') {
    periods = [
      {
        period: 'Jan 2024',
        averageScore: 78.2,
        studentCount: 245,
        examCount: 18,
        courses: 6,
      },
      {
        period: 'Feb 2024',
        averageScore: 79.8,
        studentCount: 238,
        examCount: 22,
        courses: 6,
      },
      {
        period: 'Mar 2024',
        averageScore: 81.5,
        studentCount: 251,
        examCount: 19,
        courses: 7,
      },
      {
        period: 'Apr 2024',
        averageScore: 83.1,
        studentCount: 267,
        examCount: 25,
        courses: 7,
      },
      {
        period: 'May 2024',
        averageScore: 80.7,
        studentCount: 223,
        examCount: 16,
        courses: 5,
      },
      {
        period: 'Jun 2024',
        averageScore: 85.3,
        studentCount: 189,
        examCount: 14,
        courses: 4,
      },
    ];
  } else if (timeframe === '1year') {
    periods = [
      {
        period: 'Q1 2023',
        averageScore: 76.8,
        studentCount: 782,
        examCount: 58,
        courses: 18,
      },
      {
        period: 'Q2 2023',
        averageScore: 79.3,
        studentCount: 695,
        examCount: 45,
        courses: 15,
      },
      {
        period: 'Q3 2023',
        averageScore: 77.1,
        studentCount: 523,
        examCount: 32,
        courses: 12,
      },
      {
        period: 'Q4 2023',
        averageScore: 81.6,
        studentCount: 892,
        examCount: 67,
        courses: 22,
      },
      {
        period: 'Q1 2024',
        averageScore: 83.2,
        studentCount: 934,
        examCount: 71,
        courses: 24,
      },
    ];
  } else {
    // 2years data
    periods = [
      {
        period: '2022',
        averageScore: 75.4,
        studentCount: 2840,
        examCount: 198,
        courses: 45,
      },
      {
        period: '2023',
        averageScore: 78.7,
        studentCount: 2892,
        examCount: 202,
        courses: 48,
      },
      {
        period: '2024',
        averageScore: 82.1,
        studentCount: 1834,
        examCount: 134,
        courses: 31,
      },
    ];
  }

  return periods;
};

export const generateMockSimilarityFlags = (): SimilarityFlag[] => [
  {
    id: 1,
    type: 'high',
    course: 'MATH 101',
    exam: 'Midterm Exam 1',
    studentPair: {
      student1: { name: 'Alice Johnson', id: 'A123456' },
      student2: { name: 'Bob Smith', id: 'B234567' },
    },
    similarityScore: 95.2,
    flaggedQuestions: [3, 7, 12, 15, 18],
    dateDetected: '2024-03-15',
    status: 'pending',
  },
  {
    id: 2,
    type: 'medium',
    course: 'PHYS 111',
    exam: 'Quiz 2',
    studentPair: {
      student1: { name: 'Carol Davis', id: 'C345678' },
      student2: { name: 'David Wilson', id: 'D456789' },
    },
    similarityScore: 78.6,
    flaggedQuestions: [2, 5, 9],
    dateDetected: '2024-03-14',
    status: 'reviewed',
    reviewer: 'Dr. Smith',
    notes: 'Reviewed - appears to be coincidental similar answers',
  },
  {
    id: 3,
    type: 'high',
    course: 'CSCI 261',
    exam: 'Programming Assignment 1',
    studentPair: {
      student1: { name: 'Emma Brown', id: 'E567890' },
      student2: { name: 'Frank Miller', id: 'F678901' },
    },
    similarityScore: 92.8,
    flaggedQuestions: [1, 4, 6, 8, 10, 11],
    dateDetected: '2024-03-13',
    status: 'pending',
  },
  {
    id: 4,
    type: 'low',
    course: 'MATH 101',
    exam: 'Final Exam',
    studentPair: {
      student1: { name: 'Grace Lee', id: 'G789012' },
      student2: { name: 'Henry Chen', id: 'H890123' },
    },
    similarityScore: 65.4,
    flaggedQuestions: [20, 25],
    dateDetected: '2024-03-12',
    status: 'dismissed',
    reviewer: 'Dr. Johnson',
    notes: 'Low similarity, likely coincidental',
  },
];

export const generateMockExportHistory = () => [
  {
    id: 1,
    name: 'Complete Analytics Report - March 2024',
    format: 'PDF',
    size: '2.3 MB',
    date: '2024-03-15',
    status: 'completed',
  },
  {
    id: 2,
    name: 'Student Performance Data - MATH 101',
    format: 'CSV',
    size: '156 KB',
    date: '2024-03-14',
    status: 'completed',
  },
  {
    id: 3,
    name: 'Course Comparison Report',
    format: 'Excel',
    size: '1.8 MB',
    date: '2024-03-13',
    status: 'completed',
  },
];
