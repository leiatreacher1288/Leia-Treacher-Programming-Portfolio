import { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { StandardButton } from './ui/StandardButton';
import type { Course } from '../types/course';
import { CourseInfoCard } from './ui/CourseInfoCard';

interface CreateExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (examData: {
    title: string;
    exam_type: string;
    time_limit: number;
    course: number;
    description?: string;
    weight: number;
    required_to_pass: boolean;
  }) => Promise<void>;
  courses: Course[];
  isLoading?: boolean;
  error?: string | null;
}

const EXAM_TYPES = [
  {
    value: 'quiz',
    label: 'Quiz',
    defaultTime: 30,
    description: 'Short assessment for quick feedback',
  },
  {
    value: 'midterm',
    label: 'Midterm',
    defaultTime: 80,
    description: 'Comprehensive mid-semester exam',
  },
  {
    value: 'final',
    label: 'Final Exam',
    defaultTime: 180,
    description: 'End-of-semester comprehensive exam',
  },
  {
    value: 'practice',
    label: 'Practice Test',
    defaultTime: 60,
    description: 'Practice exam for student preparation',
  },
];

export const CreateExamModal = ({
  isOpen,
  onClose,
  onSubmit,
  courses,
  isLoading = false,
  error = null,
}: CreateExamModalProps) => {
  const [formData, setFormData] = useState({
    title: '',
    exam_type: 'midterm',
    time_limit: 0,
    description: '',
    weight: 0,
    required_to_pass: false,
    course: 0, // Add course field to form data
  });

  const [weightTouched, setWeightTouched] = useState(false);
  const [timeLimitTouched, setTimeLimitTouched] = useState(false);

  // Auto-select course if only one is available
  useEffect(() => {
    if (courses.length === 1 && formData.course === 0) {
      setFormData((prev) => ({
        ...prev,
        course: courses[0].id,
      }));
    }
  }, [courses, formData.course]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.course) return;

    await onSubmit({
      title: formData.title.trim(),
      exam_type: formData.exam_type,
      time_limit: formData.time_limit,
      course: formData.course,
      description: formData.description.trim() || undefined,
      weight: formData.weight,
      required_to_pass: formData.required_to_pass,
    });
  };

  const handleExamTypeChange = (examType: string) => {
    setFormData((prev) => ({
      ...prev,
      exam_type: examType,
      time_limit: 0, // Keep at 0 instead of changing to default time
    }));
  };

  const resetForm = () => {
    setFormData({
      title: '',
      exam_type: 'midterm',
      time_limit: 0,
      description: '',
      weight: 0,
      required_to_pass: false,
      course: 0,
    });
    setWeightTouched(false);
    setTimeLimitTouched(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl border border-input-border relative max-h-[90vh] overflow-y-auto">
        <button
          className="absolute top-4 right-4 p-2 rounded-full
             bg-red-600 text-white hover:bg-red-700
             disabled:opacity-50 disabled:cursor-not-allowed transition"
          onClick={handleClose}
          disabled={isLoading}
        >
          <X size={18} className="stroke-current" /> {/* white when enabled */}
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-heading mb-2">
            Create New Exam
          </h2>
          <p className="text-card-info">
            Create a new exam by selecting a course and filling in the details
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {courses.length === 1 ? 'Course' : 'Select Course *'}
            </label>
            {courses.length === 1 && courses[0] ? (
              <CourseInfoCard course={courses[0]} />
            ) : (
              <div className="relative">
                <select
                  value={formData.course}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      course: Number(e.target.value),
                    }))
                  }
                  className={`w-full px-4 py-3 border rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn appearance-none ${
                    courses.length === 1
                      ? 'border-secondary-blue bg-secondary-blue/10 cursor-not-allowed'
                      : 'border-input-border bg-white'
                  }`}
                  required
                  disabled={isLoading || courses.length === 1}
                >
                  <option value={0}>Select a course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title} ({course.term})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* Exam Title */}
          <div>
            <label
              htmlFor="exam-title"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Exam Title *
            </label>
            <input
              id="exam-title"
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="w-full px-4 py-3 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              placeholder="e.g., Midterm 1, Final Exam, Quiz 3"
              disabled={isLoading}
            />
          </div>

          {/* Exam Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Exam Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAM_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => handleExamTypeChange(type.value)}
                  disabled={isLoading}
                  className={`p-4 border rounded-lg text-left transition ${
                    formData.exam_type === type.value
                      ? 'border-primary-btn bg-primary-btn text-white'
                      : 'border-input-border hover:border-primary-btn bg-white'
                  }`}
                >
                  <div className="font-medium">{type.label}</div>
                  <div
                    className={`text-sm mt-1 ${
                      formData.exam_type === type.value
                        ? 'text-white/80'
                        : 'text-card-info'
                    }`}
                  >
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Time Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                value={
                  !timeLimitTouched && formData.time_limit === 0
                    ? ''
                    : formData.time_limit
                }
                onChange={(e) => {
                  const raw = e.target.value;
                  setTimeLimitTouched(true);

                  if (raw === '') {
                    setFormData((prev) => ({ ...prev, time_limit: 0 }));
                    setTimeLimitTouched(false);
                    return;
                  }

                  setFormData((prev) => ({
                    ...prev,
                    time_limit: Number(raw),
                  }));
                }}
                className="flex-1 px-4 py-3 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
                placeholder="e.g., 60 for 1 hour (0 for unlimited)"
                disabled={isLoading}
              />
              <div className="flex items-center gap-2 text-card-info">
                <Clock size={16} />
                <span className="text-sm">
                  {formData.time_limit === 0
                    ? 'Unlimited'
                    : `${formData.time_limit} min`}
                </span>
              </div>
            </div>
            <p className="text-xs text-card-info mt-1">
              Set to 0 for unlimited time
            </p>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="exam-description"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description (Optional)
            </label>
            <textarea
              id="exam-description"
              className="w-full px-4 py-3 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              placeholder="Brief description of the exam content and objectives..."
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              disabled={isLoading}
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (% of course grade)
            </label>

            <input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={
                !weightTouched && formData.weight === 0 ? '' : formData.weight
              }
              onChange={(e) => {
                const raw = e.target.value; // '' | '25' | '150' | '-3' | '0'
                setWeightTouched(true);

                if (raw === '') {
                  // allow clearing the field
                  setFormData((prev) => ({ ...prev, weight: 0 }));
                  setWeightTouched(false);
                  return;
                }

                // clamp to 0-100
                const clamped = Math.min(100, Math.max(0, Number(raw)));

                setFormData((prev) => ({ ...prev, weight: clamped }));
              }}
              className="w-full px-4 py-3 border border-input-border rounded-lg text-gray-900 bg-white
                        focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              placeholder="e.g., 40 for 40%"
              disabled={isLoading}
            />
            <p className="text-xs text-card-info mt-1">
              Must be between 0 and 100. Values outside the range are snapped to
              the nearest limit.
            </p>
          </div>

          {/* Required to Pass */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.required_to_pass}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  required_to_pass: e.target.checked,
                }))
              }
              id="requiredToPass"
              disabled={isLoading}
            />
            <label htmlFor="requiredToPass" className="text-sm text-gray-700">
              Required to pass course
            </label>
          </div>

          {/* Default Values Warning */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-amber-800 mb-1">
                  Default Configuration
                </h4>
                <p className="text-sm text-amber-700">
                  This exam will be created with default settings. You can
                  configure difficulty distribution, question selection, and
                  other settings after creation in the Exam Configuration tab.
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <StandardButton
              onClick={handleClose}
              color="secondary-btn"
              className="flex-1"
              type="button"
              disabled={isLoading}
            >
              Cancel
            </StandardButton>
            <button
              type="submit"
              disabled={isLoading || !formData.title.trim() || !formData.course}
              className="flex-1 px-4 py-3 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
            >
              {isLoading ? 'Creating...' : 'Create Exam'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
