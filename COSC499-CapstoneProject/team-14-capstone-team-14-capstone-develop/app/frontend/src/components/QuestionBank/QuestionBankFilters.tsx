import React from 'react';

interface FilterState {
  course: string;
  exam: string;
  difficulty: string;
}

interface QuestionBankFiltersProps {
  filters: FilterState;
  onFilterChange: (key: keyof FilterState, value: string) => void;
}

export const QuestionBankFilters: React.FC<QuestionBankFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const courses = [
    'All Courses',
    'Mathematics 101',
    'Science 102',
    'History 103',
    'Literature 104',
  ];

  const exams = [
    'All Exams',
    'Midterm 1 (Fall 2023)',
    'Quiz 2 (Spring 2024)',
    'Final Exam (Fall 2023)',
    'Practice Test 1',
  ];

  const difficulties = ['All Difficulties', 'Easy', 'Medium', 'Hard'];

  return (
    <div className="bg-white border-r border-gray-200 p-4 space-y-6">
      <div>
        <h3 className="text-sm font-medium text-gray-900 mb-3">FILTERS</h3>

        {/* Course Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Course
          </label>
          <select
            value={filters.course}
            onChange={(e) => onFilterChange('course', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {courses.map((course) => (
              <option key={course} value={course}>
                {course}
              </option>
            ))}
          </select>
        </div>

        {/* Exam Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Exam
          </label>
          <select
            value={filters.exam}
            onChange={(e) => onFilterChange('exam', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {exams.map((exam) => (
              <option key={exam} value={exam}>
                {exam}
              </option>
            ))}
          </select>
        </div>

        {/* Difficulty Filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Difficulty
          </label>
          <select
            value={filters.difficulty}
            onChange={(e) => onFilterChange('difficulty', e.target.value)}
            className="w-full px-3 py-2 bg-gray-800 text-white border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {difficulties.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
