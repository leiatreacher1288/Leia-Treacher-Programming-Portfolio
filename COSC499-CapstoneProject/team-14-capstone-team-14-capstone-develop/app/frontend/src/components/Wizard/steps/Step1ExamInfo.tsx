import React, { useEffect } from 'react';
import { Calendar, BookOpen } from 'lucide-react';
import type { WizardData } from '../../../api/examAPI';
import type { Course } from '../../../types/course';
import { validateCourseHasQuestionBanks } from '../../../utils/courseValidation';
import toast from 'react-hot-toast';

interface Step1ExamInfoProps {
  examName: string;
  setExamName: (name: string) => void;
  examDesc: string;
  setExamDesc: (desc: string) => void;
  examType: string;
  setExamType: (type: string) => void;
  examTimeLimit: number | ''; // CHANGED: Allow empty string
  setExamTimeLimit: (limit: number | '') => void; // CHANGED: Allow empty string
  examWeight: number | '';
  setExamWeight: (weight: number | '') => void;
  examDate: string;
  setExamDate: (date: string) => void;
  requiredToPass: boolean;
  setRequiredToPass: (required: boolean) => void;
  wizardData: WizardData;
  courses?: Course[];
  selectedCourseId?: number;
  onCourseChange?: (courseId: number) => void;
  onValidationChange?: (isValid: boolean) => void;
  onRedirectToCourse?: (courseId: number) => void;
}

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

export const Step1ExamInfo: React.FC<Step1ExamInfoProps> = ({
  examName,
  setExamName,
  examDesc,
  setExamDesc,
  examType,
  setExamType,
  examTimeLimit,
  setExamTimeLimit,
  examWeight,
  setExamWeight,
  examDate,
  setExamDate,
  requiredToPass,
  setRequiredToPass,
  wizardData,
  courses,
  selectedCourseId,
  onCourseChange,
  onValidationChange,
  onRedirectToCourse,
}) => {
  // Check if we have a pre-selected course (from course-specific exam creation)
  const hasPreselectedCourse =
    wizardData.exam.course && wizardData.exam.course > 0;

  // Helper function to format course display
  const formatCourseDisplay = (course: Course) => {
    const code =
      course.code && course.code.trim().toUpperCase() !== 'N/A'
        ? course.code
        : '';
    const term = course.term ? ` | ${course.term}` : '';
    return code ? `${code} - ${course.title}${term}` : `${course.title}${term}`;
  };

  // Validation logic
  useEffect(() => {
    const isExamNameValid = examName.trim().length > 0;
    const isCourseValid =
      hasPreselectedCourse ||
      (selectedCourseId !== undefined && selectedCourseId > 0);

    const isValid = isExamNameValid && isCourseValid;
    onValidationChange?.(isValid);
  }, [examName, selectedCourseId, hasPreselectedCourse, onValidationChange]);

  // Check if course has question banks when course changes
  useEffect(() => {
    const checkCourseHasBanks = async () => {
      const courseToCheck = selectedCourseId || wizardData.exam.course;

      if (courseToCheck && courseToCheck > 0) {
        try {
          const hasBanks = await validateCourseHasQuestionBanks(courseToCheck);
          if (!hasBanks) {
            toast.error(
              'No question banks found for this course. Please add some.'
            );
            onRedirectToCourse?.(courseToCheck);
          }
        } catch (err) {
          console.error('Failed to validate course question banks:', err);
        }
      }
    };

    checkCourseHasBanks();
  }, [selectedCourseId, wizardData.exam.course, onRedirectToCourse]);

  // Validation states for visual feedback
  const isExamNameValid = examName.trim().length > 0;
  const isCourseValid =
    hasPreselectedCourse ||
    (selectedCourseId !== undefined && selectedCourseId > 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-3">
        <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <BookOpen className="text-purple-600" size={20} />
          </div>
          Exam Information
        </h1>
        <p className="text-sm text-gray-600">
          Configure the basic details for your exam.
        </p>
      </div>

      {/* Course Selection */}
      {hasPreselectedCourse ? (
        // Show course tag for pre-selected course
        <div className="flex items-center gap-3 mb-4">
          <span className="inline-block px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold text-sm">
            {wizardData.exam.course_code} - {wizardData.exam.course_term}
          </span>
        </div>
      ) : (
        // Show course dropdown for global exam creation
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1 text-gray-900">
            Course <span className="text-red-500">*</span>
          </label>
          <select
            className={`w-full px-4 py-3 rounded-lg border focus:ring-1 focus:ring-purple-500 text-base bg-white ${
              !isCourseValid && !hasPreselectedCourse
                ? 'border-red-300 focus:border-red-500'
                : 'border-gray-300 focus:border-purple-500'
            }`}
            value={selectedCourseId || ''}
            onChange={(e) => onCourseChange?.(Number(e.target.value))}
            required
          >
            <option value="">Choose a course...</option>
            {courses?.map((course) => (
              <option key={course.id} value={course.id}>
                {formatCourseDisplay(course)}
              </option>
            ))}
          </select>
          {!isCourseValid && !hasPreselectedCourse && (
            <p className="text-xs text-red-500 mt-1">Please select a course</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            This exam will be associated with the selected course.
          </p>
        </div>
      )}

      <form className="space-y-4">
        {/* Exam Name and Description */}
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-900">
              Exam Name <span className="text-red-500">*</span>
            </label>
            <input
              className={`w-full px-4 py-3 rounded-lg border focus:ring-1 focus:ring-purple-500 text-base bg-white ${
                !isExamNameValid
                  ? 'border-red-300 focus:border-red-500'
                  : 'border-gray-300 focus:border-purple-500'
              }`}
              type="text"
              required
              placeholder="Midterm A"
              value={examName}
              onChange={(e) => setExamName(e.target.value)}
            />
            {!isExamNameValid && (
              <p className="text-xs text-red-500 mt-1">
                Exam name cannot be empty
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Used to identify this exam in the system.
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-gray-900">
              Description
            </label>
            <textarea
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base placeholder:text-gray-400 bg-white"
              placeholder="Brief description of the exam content and format"
              value={examDesc}
              onChange={(e) => setExamDesc(e.target.value)}
              rows={2}
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional description to help students understand the exam.
            </p>
          </div>
        </div>

        {/* Exam Configuration Grid */}
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900">
                Exam Type
              </label>
              <select
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base bg-white"
                value={examType}
                onChange={(e) => setExamType(e.target.value)}
              >
                <option value="quiz">Quiz</option>
                <option value="midterm">Midterm</option>
                <option value="final">Final Exam</option>
                <option value="practice">Practice Test</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900">
                Time Limit (minutes)
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base bg-white"
                type="number"
                min={0}
                placeholder="60"
                value={examTimeLimit}
                onChange={(e) =>
                  setExamTimeLimit(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Leave as 0 for unlimited time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900">
                Exam Weight (%)
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base bg-white"
                type="number"
                min={0}
                max={100}
                placeholder="e.g. 20"
                value={examWeight}
                onChange={(e) =>
                  setExamWeight(
                    e.target.value === ''
                      ? ''
                      : clamp(Number(e.target.value), 0, 100)
                  )
                }
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage of total course grade.
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-gray-900 flex items-center gap-2">
                Exam Date{' '}
                <Calendar className="inline text-gray-500" size={16} />
              </label>
              <input
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 text-base bg-white"
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
              />
              <p className="text-xs text-gray-500 mt-1">
                When this exam will be administered.
              </p>
            </div>
          </div>

          {/* Inline Requirements Checkbox */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="requiredToPass"
              checked={requiredToPass}
              onChange={(e) => setRequiredToPass(e.target.checked)}
              className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
            />
            <label
              htmlFor="requiredToPass"
              className="text-sm font-medium text-gray-900"
            >
              Required to pass course
            </label>
          </div>
        </div>
      </form>
    </div>
  );
};
