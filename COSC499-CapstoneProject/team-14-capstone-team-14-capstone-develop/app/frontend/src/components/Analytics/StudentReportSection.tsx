import React, { useState, useEffect } from 'react';
import {
  Users,
  FileText,
  Download,
  BookOpen,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import { SearchBar } from '../ui/SearchBar';
import { courseAPI, type Student as CourseStudent } from '../../api/courseAPI';
import { analyticsAPI } from '../../api/analyticsAPI';
import type { CourseSearchResult } from '../../api/analyticsAPI';
import { AnalyticsErrorBoundary } from './AnalyticsErrorBoundary';
import axiosInstance from '../../api/axiosInstance';

interface StudentReportSectionProps {
  allCourses: CourseSearchResult[];
}

// Extended student interface for analytics
interface AnalyticsStudent extends CourseStudent {
  examsTaken: number;
  lastActivity: string;
}

interface StudentReport {
  student: AnalyticsStudent;
  coursePerformance: Array<{
    courseCode: string;
    courseName: string;
    examCount: number;
    averageScore: number;
    bestScore: number;
    worstScore: number;
    improvement: number;
    classAverage?: number;
    classMedian?: number;
    classBest?: number;
    totalStudents?: number;
  }>;
  examDetails: Array<{
    examId: number;
    examTitle: string;
    score: number;
    maxScore: number;
    percentile: number;
    timeTaken: string;
    date: string;
    classAverage?: number;
    classMedian?: number;
    classBest?: number;
  }>;
  recommendations: string[];
}

export const StudentReportSection: React.FC<StudentReportSectionProps> = ({
  allCourses,
}) => {
  const [selectedCourse, setSelectedCourse] = useState<string>('');
  const [students, setStudents] = useState<AnalyticsStudent[]>([]);
  const [selectedStudent, setSelectedStudent] =
    useState<AnalyticsStudent | null>(null);
  const [studentReport, setStudentReport] = useState<StudentReport | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<AnalyticsStudent[]>(
    []
  );

  // Filter students based on search
  useEffect(() => {
    if (!search.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(
        (student) =>
          student.name.toLowerCase().includes(search.toLowerCase()) ||
          student.student_id.toLowerCase().includes(search.toLowerCase()) ||
          student.email.toLowerCase().includes(search.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [search, students]);

  const handleCourseSelect = async (courseCode: string) => {
    setSelectedCourse(courseCode);
    setLoading(true);
    setSelectedStudent(null);
    setStudentReport(null);

    try {
      // Find the course by code to get the ID
      const course = allCourses.find((c) => c.code === courseCode);
      if (!course) {
        console.error('Course not found:', courseCode);
        setLoading(false);
        return;
      }

      // Fetch real student data from API
      const apiResponse = await courseAPI.getStudents(course.id);

      // Ensure the response is an array, handle different response formats
      let apiStudents: any[] = [];
      if (Array.isArray(apiResponse)) {
        apiStudents = apiResponse;
      } else if (
        apiResponse &&
        typeof apiResponse === 'object' &&
        Array.isArray((apiResponse as any).students)
      ) {
        apiStudents = (apiResponse as any).students;
      } else if (
        apiResponse &&
        typeof apiResponse === 'object' &&
        Array.isArray((apiResponse as any).data)
      ) {
        apiStudents = (apiResponse as any).data;
      } else {
        console.warn('Unexpected students API response format:', apiResponse);
        apiStudents = [];
      }

      // Fetch student report data for each student to get their scores
      const analyticsStudents: AnalyticsStudent[] = [];

      for (const student of apiStudents) {
        try {
          // Fetch individual student report to get their performance data
          const reportData = await analyticsAPI.getStudentReport(
            course.id,
            student.id
          );

          // Calculate overall score from the report data
          const overallScore =
            reportData.coursePerformance?.studentAverage || 0;
          const examsTaken = reportData.examResults?.length || 0;

          analyticsStudents.push({
            ...student,
            overall_score: overallScore,
            examsTaken: examsTaken,
            lastActivity: reportData.examResults?.[0]?.submittedAt
              ? new Date(
                  reportData.examResults[0].submittedAt
                ).toLocaleDateString()
              : 'N/A',
          });
        } catch (error) {
          console.error(
            `Failed to fetch report for student ${student.id}:`,
            error
          );
          // Add student with default values if report fetch fails
          analyticsStudents.push({
            ...student,
            overall_score: 0,
            examsTaken: 0,
            lastActivity: 'N/A',
          });
        }
      }

      setStudents(analyticsStudents);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      // Fallback to empty array if API fails
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentSelect = async (student: AnalyticsStudent) => {
    setSelectedStudent(student);
    setLoading(true);

    try {
      // Find the course by code to get the ID
      const course = allCourses.find((c) => c.code === selectedCourse);
      if (!course) {
        console.error('Course not found');
        setStudentReport(null);
        return;
      }

      // Fetch real student report data from API
      const reportData = await analyticsAPI.getStudentReport(
        course.id,
        student.id
      );

      // Transform API response to our interface format
      const transformedReport: StudentReport = {
        student: {
          ...student,
          examsTaken: reportData.examResults?.length || 0,
          lastActivity: reportData.examResults?.[0]?.submittedAt
            ? new Date(
                reportData.examResults[0].submittedAt
              ).toLocaleDateString()
            : 'N/A',
        },
        coursePerformance: [
          {
            courseCode: selectedCourse,
            courseName: course.title || 'Selected Course',
            examCount: reportData.coursePerformance?.examsCompleted || 0,
            averageScore: reportData.coursePerformance?.studentAverage || 0,
            bestScore: reportData.coursePerformance?.studentBest || 0,
            worstScore: reportData.coursePerformance?.studentWorst || 0,
            improvement:
              reportData.examResults?.length >= 2
                ? (reportData.examResults[reportData.examResults.length - 1]
                    ?.studentScore || 0) -
                  (reportData.examResults[0]?.studentScore || 0)
                : 0,
            classAverage: reportData.coursePerformance?.classAverage || 0,
            classMedian: reportData.coursePerformance?.classMedian || 0,
            classBest: reportData.coursePerformance?.classBest || 0,
            totalStudents:
              reportData.coursePerformance?.totalClassStudents || 0,
          },
        ],
        examDetails:
          reportData.examResults?.map((exam: any) => ({
            examId: exam.examId,
            examTitle: exam.examTitle,
            score: exam.studentScore || 0,
            maxScore: 100,
            percentile: exam.classAverage
              ? Math.round((exam.studentScore / exam.classAverage) * 100)
              : 0,
            timeTaken: 'N/A',
            date: exam.submittedAt
              ? new Date(exam.submittedAt).toLocaleDateString()
              : 'N/A',
            classAverage: exam.classAverage || 0,
            classMedian: exam.classMedian || 0,
            classBest: exam.classBest || 0,
          })) || [],
        recommendations: reportData.recommendations || [
          'Continue your excellent progress',
          'Review areas where improvement is needed',
          'Attend office hours if you have questions',
        ],
      };

      setStudentReport(transformedReport);
    } catch (error) {
      console.error('Failed to fetch student report:', error);

      // Graceful fallback - show error state instead of crashing
      setStudentReport({
        student,
        coursePerformance: [
          {
            courseCode: selectedCourse,
            courseName: 'Selected Course',
            examCount: 0,
            averageScore: 0,
            bestScore: 0,
            worstScore: 0,
            improvement: 0,
          },
        ],
        examDetails: [],
        recommendations: ['No data available. Please check back later.'],
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePDFReport = async () => {
    if (!studentReport || !selectedStudent || !selectedCourse) {
      alert('No student report data available for export');
      return;
    }

    try {
      // Find the course by code to get the ID
      const course = allCourses.find((c) => c.code === selectedCourse);
      if (!course) {
        alert('Course not found for export');
        return;
      }

      console.log('Exporting PDF for:', {
        courseId: course.id,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentCode: selectedStudent.student_id,
      });

      // Call the student report export API
      const response = await axiosInstance.get(
        `/analytics/student-report/${course.id}/${selectedStudent.id}/export/`,
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedStudent.name}_${selectedCourse}_Report.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate PDF report:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  const generateDOCXReport = async () => {
    if (!studentReport || !selectedStudent || !selectedCourse) {
      alert('No student report data available for export');
      return;
    }

    try {
      // Find the course by code to get the ID
      const course = allCourses.find((c) => c.code === selectedCourse);
      if (!course) {
        alert('Course not found for export');
        return;
      }

      console.log('Exporting DOCX for:', {
        courseId: course.id,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentCode: selectedStudent.student_id,
      });

      // Call the student report export API
      const response = await axiosInstance.get(
        `/analytics/student-report/${course.id}/${selectedStudent.id}/export/docx/`,
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedStudent.name}_${selectedCourse}_Report.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate DOCX report:', error);
      alert('Failed to generate DOCX report. Please try again.');
    }
  };

  const generateCSVReport = async () => {
    if (!studentReport || !selectedStudent || !selectedCourse) {
      alert('No student report data available for export');
      return;
    }

    try {
      // Find the course by code to get the ID
      const course = allCourses.find((c) => c.code === selectedCourse);
      if (!course) {
        alert('Course not found for export');
        return;
      }

      console.log('Exporting CSV for:', {
        courseId: course.id,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        studentCode: selectedStudent.student_id,
      });

      // Call the student report CSV export API
      const response = await axiosInstance.get(
        `/analytics/student-report/${course.id}/${selectedStudent.id}/export/csv/`,
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedStudent.name}_${selectedCourse}_Report.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate CSV report:', error);
      alert('Failed to generate CSV report. Please try again.');
    }
  };

  const handleBulkExport = async (format: 'pdf' | 'docx' | 'csv') => {
    if (!selectedCourse) {
      alert('Please select a course first to export all students.');
      return;
    }

    setLoading(true);
    try {
      const course = allCourses.find((c) => c.code === selectedCourse);
      if (!course) {
        alert('Course not found for bulk export.');
        setLoading(false);
        return;
      }

      console.log('Bulk exporting for course:', {
        courseId: course.id,
        courseCode: course.code,
        format: format,
      });

      // Use the backend bulk export endpoint for better performance
      const response = await axiosInstance.get(
        `/analytics/course/${course.id}/bulk-export/${format}`,
        {
          responseType: 'blob',
        }
      );

      // Create blob and download
      const blob = response.data;
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${selectedCourse}_All_Students_Report.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to generate bulk report:', error);
      alert(`Failed to generate bulk ${format} report. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnalyticsErrorBoundary>
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Users className="text-blue-600 mr-2" size={24} />
            Student Reports
          </h2>
          <p className="text-gray-600 mb-6">
            Generate comprehensive reports for individual students including
            performance analysis, exam details, and personalized
            recommendations.
          </p>

          {/* Course Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Course
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseSelect(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-btn focus:border-transparent"
            >
              <option value="">Choose a course...</option>
              {allCourses &&
                Array.isArray(allCourses) &&
                allCourses.map((course) => (
                  <option key={course.id} value={course.code}>
                    {course.code} - {course.title}
                  </option>
                ))}
            </select>
          </div>

          {/* Bulk Export Button - Only show when course is selected */}
          {selectedCourse && (
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">
                  Bulk Export Options
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBulkExport('pdf')}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    <FileText size={16} />
                    Export All (PDF)
                  </button>
                  <button
                    onClick={() => handleBulkExport('docx')}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <FileText size={16} />
                    Export All (DOCX)
                  </button>
                  <button
                    onClick={() => handleBulkExport('csv')}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download size={16} />
                    Export All (CSV)
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Export all student results for this course in your preferred
                format.
              </p>
            </div>
          )}

          {/* Students List */}
          {selectedCourse && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="mb-4">
                  <SearchBar
                    placeholder="Search students by name, ID, or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-btn border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-600">Loading students...</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {filteredStudents.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedStudent?.id === student.id
                            ? 'border-primary-btn bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {student.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {student.student_id} • {student.section}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-green-600">
                              {student.overall_score?.toFixed(1)}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {student.examsTaken} exams
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Student Report */}
              <div>
                {selectedStudent && studentReport ? (
                  <div className="space-y-6">
                    {/* Student Info Header */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {studentReport.student.name}
                        </h3>
                        <div className="flex gap-2">
                          <button
                            onClick={generatePDFReport}
                            className="flex items-center gap-1 px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                          >
                            <FileText size={14} />
                            PDF
                          </button>
                          <button
                            onClick={generateDOCXReport}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                          >
                            <Download size={14} />
                            DOCX
                          </button>
                          <button
                            onClick={generateCSVReport}
                            className="flex items-center gap-1 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                          >
                            <Download size={14} />
                            CSV
                          </button>
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {studentReport.student.student_id} •{' '}
                        {studentReport.student.email}
                      </p>
                    </div>

                    {/* Performance Overview */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <TrendingUp className="text-green-500 mr-2" size={16} />
                        Course Performance Overview
                      </h4>
                      {studentReport.coursePerformance.map(
                        (performance, index) => (
                          <div key={index} className="space-y-4">
                            {/* Student vs Class Comparison Table */}
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm border-collapse border border-gray-300">
                                <thead>
                                  <tr className="bg-gray-100">
                                    <th className="border border-gray-300 px-3 py-2 text-left">
                                      Metric
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">
                                      Student&apos;s Performance
                                    </th>
                                    <th className="border border-gray-300 px-3 py-2 text-left">
                                      Class Statistics
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 font-medium">
                                      Average Score
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <span className="font-bold text-green-600">
                                        {performance.averageScore.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      Class Avg:{' '}
                                      <span className="font-semibold">
                                        {performance.classAverage?.toFixed(1) ||
                                          'N/A'}
                                        %
                                      </span>
                                    </td>
                                  </tr>
                                  <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-2 font-medium">
                                      Best Score
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <span className="font-bold text-blue-600">
                                        {performance.bestScore.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      Class Best:{' '}
                                      <span className="font-semibold">
                                        {performance.classBest?.toFixed(1) ||
                                          'N/A'}
                                        %
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 font-medium">
                                      Worst Score
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <span className="font-bold text-orange-600">
                                        {performance.worstScore.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      Class Median:{' '}
                                      <span className="font-semibold">
                                        {performance.classMedian?.toFixed(1) ||
                                          'N/A'}
                                        %
                                      </span>
                                    </td>
                                  </tr>
                                  <tr className="bg-gray-50">
                                    <td className="border border-gray-300 px-3 py-2 font-medium">
                                      Exams Completed
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <span className="font-bold">
                                        {performance.examCount}
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      Total Students:{' '}
                                      <span className="font-semibold">
                                        {performance.totalStudents || 'N/A'}
                                      </span>
                                    </td>
                                  </tr>
                                  <tr>
                                    <td className="border border-gray-300 px-3 py-2 font-medium">
                                      Improvement Trend
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <span
                                        className={`font-bold ${performance.improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                      >
                                        {performance.improvement >= 0
                                          ? '+'
                                          : ''}
                                        {performance.improvement.toFixed(1)}%
                                      </span>
                                    </td>
                                    <td className="border border-gray-300 px-3 py-2">
                                      <span className="text-gray-600 text-xs">
                                        {performance.improvement >= 0
                                          ? '📈 Improving'
                                          : '📉 Declining'}
                                      </span>
                                    </td>
                                  </tr>
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )
                      )}
                    </div>

                    {/* Individual Exam Results */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                        <BarChart3 className="text-blue-500 mr-2" size={16} />
                        Individual Exam Results
                      </h4>

                      {/* Exam Results Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse border border-gray-300">
                          <thead>
                            <tr className="bg-blue-100">
                              <th className="border border-gray-300 px-3 py-2 text-left">
                                Exam
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-left">
                                Student&apos;s Score
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-left">
                                Class Avg
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-left">
                                Class Median
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-left">
                                Class Best
                              </th>
                              <th className="border border-gray-300 px-3 py-2 text-left">
                                Date
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {studentReport.examDetails.map((exam, index) => (
                              <tr
                                key={exam.examId}
                                className={
                                  index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                }
                              >
                                <td className="border border-gray-300 px-3 py-2 font-medium">
                                  {exam.examTitle.length > 25
                                    ? `${exam.examTitle.substring(0, 25)}...`
                                    : exam.examTitle}
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <span className="font-bold text-green-600">
                                    {exam.score.toFixed(1)}%
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <span className="font-semibold">
                                    {exam.classAverage?.toFixed(1) || 'N/A'}%
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <span className="font-semibold">
                                    {exam.classMedian?.toFixed(1) || 'N/A'}%
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2">
                                  <span className="font-semibold">
                                    {exam.classBest?.toFixed(1) || 'N/A'}%
                                  </span>
                                </td>
                                <td className="border border-gray-300 px-3 py-2 text-xs">
                                  {exam.date}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-white border rounded-lg p-4">
                      <h4 className="font-medium text-gray-900 mb-3">
                        Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {studentReport.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-sm text-gray-700 flex items-start"
                          >
                            <span className="text-primary-btn mr-2">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : selectedStudent ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-btn border-t-transparent mx-auto mb-2"></div>
                    <p className="text-gray-600">Generating report...</p>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Users size={32} className="mx-auto mb-2 text-gray-300" />
                    <h3 className="font-medium text-gray-900 mb-1">
                      Select a Student
                    </h3>
                    <p className="text-sm">
                      Choose a student from the list to view their detailed
                      performance report.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {!selectedCourse && (
            <div className="text-center py-8 text-gray-500">
              <BookOpen size={32} className="mx-auto mb-2 text-gray-300" />
              <h3 className="font-medium text-gray-900 mb-1">
                Select a Course
              </h3>
              <p className="text-sm">
                Please select a course to view student reports.
              </p>
            </div>
          )}
        </div>
      </div>
    </AnalyticsErrorBoundary>
  );
};
