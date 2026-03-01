// src/components/QuestionBank/FilterPanel.tsx
import React from 'react';

interface FilterState {
  course: string;
  difficulty: string;
  tags: string[];
}
interface Course {
  id: number;
  code: string;
  title: string;
}

interface FilterPanelProps {
  filters: FilterState;
  courses: Course[];
  onFilterChange: (key: keyof FilterState, value: string | string[]) => void;
  onClose: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  courses,
  onFilterChange,
  onClose,
}) => (
  <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-700">Filters</h3>
      <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
        ×
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Course
        </label>
        <select
          value={filters.course}
          onChange={(e) => onFilterChange('course', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn text-sm bg-white"
        >
          <option value="All Courses">All Courses</option>
          {courses.map((c) => (
            <option key={c.id} value={c.title}>
              {c.code} - {c.title}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Difficulty
        </label>
        <select
          value={filters.difficulty}
          onChange={(e) => onFilterChange('difficulty', e.target.value)}
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn text-sm bg-white"
        >
          {['All Difficulties', 'Easy', 'Medium', 'Hard'].map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags
        </label>
        <input
          type="text"
          placeholder="Enter tags separated by commas"
          value={filters.tags.join(', ')}
          onChange={(e) =>
            onFilterChange(
              'tags',
              e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            )
          }
          className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-btn text-sm bg-white"
        />
      </div>
    </div>
  </div>
);
