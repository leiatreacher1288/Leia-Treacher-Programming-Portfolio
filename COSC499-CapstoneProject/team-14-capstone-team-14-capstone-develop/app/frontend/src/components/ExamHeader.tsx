import React from 'react';
import type { ExamDetail } from '../api/examAPI';
import type { Course } from '../types/course';

// Patch type to allow current_variant_questions
interface ExamDetailWithCurrent extends ExamDetail {
  current_variant_questions?: any[];
}

export const ExamHeader = ({
  exam,
  course,
}: {
  exam: ExamDetailWithCurrent;
  course: Course;
}) => {
  console.log('[ExamHeader] exam prop:', exam);
  return (
    <div className="bg-card rounded-xl shadow-sm border border-border-light p-6 mb-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-heading mb-1">{exam.title}</h1>
          <div className="flex flex-wrap gap-2 items-center text-sm text-card-info mb-2">
            <span className="bg-secondary-blue text-primary-btn px-2 py-1 rounded font-semibold">
              {exam.exam_type.charAt(0).toUpperCase() + exam.exam_type.slice(1)}
            </span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {course.term}
            </span>
            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
              {course.code}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex flex-col items-center">
            <span className="text-xs text-card-info">Variants</span>
            <span className="font-semibold text-lg text-heading">
              {exam.current_variant_questions?.length || exam.variants.length}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-card-info">Questions</span>
            <span className="font-semibold text-lg text-heading">
              {exam.questions_per_variant}
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-card-info">Weight</span>
            <span className="font-semibold text-lg text-heading">
              {exam.weight}%
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="text-xs text-card-info">Required to Pass</span>
            <span className="font-semibold text-lg text-heading">
              {exam.required_to_pass ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-card-info">Last Edited</span>
          <span className="font-semibold text-heading">
            {new Date(exam.updated_at).toLocaleDateString()}
          </span>
          <span className="text-xs text-card-info mt-1">Created By</span>
          <span className="font-semibold text-heading">
            {exam.created_by_name}
          </span>
        </div>
      </div>
    </div>
  );
};
