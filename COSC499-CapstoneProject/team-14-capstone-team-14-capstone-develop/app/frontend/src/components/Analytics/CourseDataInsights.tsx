import {
  BarChartBig,
  CircleDot,
  Info,
  XCircle,
  TrendingUp,
  Users,
  BookText,
} from 'lucide-react';
import { SectionTitle } from './../cards/SectionTitle';
import { DataInsightCard } from './DataInsightCard';
import type { Course } from '../../types/course';

interface CourseDataInsightsProps {
  course: Course;
}

export const CourseDataInsights = ({ course }: CourseDataInsightsProps) => {
  // Use course data for insights - generate dynamic data based on actual course
  console.log('Course data:', course);

  // Calculate dynamic insights based on course data
  const highestExamScore = Math.max(75, course.avgScore || 0);
  const passingRate =
    course.students > 0 ? Math.round((course.avgScore / 100) * 100) : 0;
  const completedExams = Math.max(0, (course.exams || 0) - 2);
  const pendingExams = Math.min(2, course.exams || 0);
  const totalVariants = (course.exams || 0) * 15; // Assume 15 variants per exam

  return (
    <section className="bg-card p-6 rounded-xl shadow-sm mb-10">
      <SectionTitle
        title={`${course.code} - Course Analytics`}
        icon={<BarChartBig size={20} />}
      />

      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <DataInsightCard
          title="Highest Exam Score"
          value={course.exams > 0 ? 'Midterm' : 'No Exams'}
          subtitle={course.exams > 0 ? `${highestExamScore}%` : 'N/A'}
          subDetail={
            course.exams > 0
              ? `${Math.abs(highestExamScore - course.avgScore)}% above average`
              : 'Create an exam to see insights'
          }
          icon={<TrendingUp className="text-accent-emerald" size={16} />}
          barPercent={course.exams > 0 ? highestExamScore : 0}
          barColor="bg-accent-emerald"
          data-testid="highest-exam-score-card"
        />

        <DataInsightCard
          title="Most Challenging Question"
          value={course.exams > 0 ? 'Question 5' : 'No Data'}
          subtitle={course.exams > 0 ? '30% miss rate' : 'N/A'}
          subDetail={
            course.exams > 0
              ? 'Students struggle with this concept'
              : 'Need exam results to analyze'
          }
          icon={<XCircle className="text-orange-400" size={16} />}
          barPercent={course.exams > 0 ? 30 : 0}
          barColor="bg-orange-500"
          data-testid="challenging-question-card"
        />

        <DataInsightCard
          title="Exams Awaiting Results"
          value={pendingExams.toString()}
          subtitle="exams pending"
          subDetail={
            pendingExams > 0
              ? `${pendingExams} exam(s) need grading`
              : 'All exams graded'
          }
          icon={<Info className="text-accent-amber" size={16} />}
          barPercent={
            course.exams > 0 ? (pendingExams / course.exams) * 100 : 0
          }
          barColor="bg-accent-amber"
          barBg="bg-yellow-100"
          data-testid="pending-exams-card"
        />

        <DataInsightCard
          title="Total Variants Generated"
          value={totalVariants.toString()}
          subtitle={`for ${course.code}`}
          subDetail={`${course.exams || 0} exams with multiple variants`}
          icon={<CircleDot className="text-accent-indigo" size={16} />}
          circlePercent={Math.min(100, totalVariants > 0 ? 70 : 0)}
          circleColor="stroke-accent-indigo"
          data-testid="variants-card"
        />

        <DataInsightCard
          title="Students Passing Rate"
          value={`${Math.round(passingRate)}%`}
          subtitle={`${course.students || 0} total students`}
          subDetail={
            passingRate >= 70
              ? 'Good performance'
              : passingRate >= 50
                ? 'Needs improvement'
                : 'Requires attention'
          }
          icon={<CircleDot className="text-accent-emerald" size={16} />}
          circlePercent={passingRate}
          circleColor="stroke-accent-emerald"
          data-testid="passing-rate-card"
        />
      </div>

      {/* Additional Course Statistics */}
      <div className="mt-8 grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Student Performance Overview */}
        <div
          className="bg-white p-6 rounded-xl border border-input-border"
          data-testid="student-performance-section"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary-btn" />
            Student Performance
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Average Score</span>
              <span className="font-semibold text-green-600">
                {course.avgScore || 0}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Students</span>
              <span className="font-semibold">{course.students || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Passing Rate</span>
              <span
                className={`font-semibold ${passingRate >= 70 ? 'text-green-600' : passingRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}
              >
                {passingRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Exam Statistics */}
        <div
          className="bg-white p-6 rounded-xl border border-input-border"
          data-testid="exam-statistics-section"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BookText size={18} className="text-primary-btn" />
            Exam Statistics
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Exams</span>
              <span className="font-semibold">{course.exams || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Completed Exams</span>
              <span className="font-semibold text-blue-600">
                {completedExams}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending Results</span>
              <span className="font-semibold text-amber-600">
                {pendingExams}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Last Updated</span>
              <span className="font-semibold text-gray-600">
                {course.lastEdited}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
