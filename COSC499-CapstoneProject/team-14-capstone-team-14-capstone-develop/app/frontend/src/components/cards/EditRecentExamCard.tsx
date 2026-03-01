// src/components/Exams/EditRecentExamCard.tsx
import { useState, useEffect } from 'react';
import { X, Clock, AlertTriangle, ChevronDown } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import type { Course } from '../../types/course';
import type { Exam as BaseExam } from '../../api/examAPI';
import { CourseInfoCard } from '../ui/CourseInfoCard';

// ──────────────────────────────────────────────────────────────
// typings
// ──────────────────────────────────────────────────────────────
type Exam = BaseExam & {
  time_limit?: number;
  course?: number | { id: number };
};

interface EditExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: Exam | null;
  courses: Course[];
  onSubmit: (
    id: number,
    data: {
      title: string;
      exam_type: string;
      time_limit: number;
      course: number;
      description?: string;
      weight: number;
      required_to_pass: boolean;
    }
  ) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

// exam-type catalogue (identical to create-modal)
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
    label: 'Practice',
    defaultTime: 60,
    description: 'Practice exam for student prep',
  },
];

// ──────────────────────────────────────────────────────────────
// component
// ──────────────────────────────────────────────────────────────
export const EditExamModal = ({
  isOpen,
  onClose,
  exam,
  courses,
  onSubmit,
  isLoading = false,
  error = null,
}: EditExamModalProps) => {
  /* form state seeded from the exam --------------------------------*/
  const [formData, setFormData] = useState({
    title: '',
    exam_type: 'quiz',
    time_limit: 0,
    description: '',
    weight: 0,
    required_to_pass: false,
    course: 0,
  });

  const [weightTouched, setWeightTouched] = useState(true);
  const [timeLimitTouched, setTimeLimitTouched] = useState(true);

  /* seed whenever a new exam is supplied */
  useEffect(() => {
    if (!exam) return;

    const courseId =
      typeof exam.course === 'object'
        ? exam.course?.id
        : (exam.course as number | undefined);

    setFormData({
      title: exam.title,
      exam_type: (exam as any).exam_type ?? 'quiz',
      time_limit: exam.time_limit ?? 0,
      description: (exam as any).description || '',
      weight: Number((exam as any).weight ?? 0),
      required_to_pass: (exam as any).required_to_pass ?? false,
      course: courseId ?? 0,
    });

    // Reset touched states when loading new exam
    setWeightTouched(false);
    setTimeLimitTouched(false);
  }, [exam]);

  /* auto-select the sole course, if there is only one --------------*/
  useEffect(() => {
    if (courses.length === 1 && formData.course === 0) {
      setFormData((p) => ({ ...p, course: courses[0].id }));
    }
  }, [courses, formData.course]);

  /* submit -------------------------------------------------------- */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exam) return;
    if (!formData.title.trim() || !formData.course) return;

    try {
      await onSubmit(exam.id, {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        time_limit: Number(formData.time_limit),
        weight: Number(formData.weight),
      });

      // Close modal on success
      onClose();
    } catch (error) {
      // Error is handled by the parent component
      console.error('Failed to save exam:', error);
    }
  };

  const handleExamTypeChange = (type: string) =>
    setFormData((p) => ({ ...p, exam_type: type }));

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTimeLimitTouched(true);

    if (value === '') {
      setFormData((p) => ({ ...p, time_limit: 0 }));
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0) {
        setFormData((p) => ({ ...p, time_limit: numValue }));
      }
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setWeightTouched(true);

    if (value === '') {
      setFormData((p) => ({ ...p, weight: 0 }));
    } else {
      const numValue = parseInt(value, 10);
      if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
        setFormData((p) => ({ ...p, weight: numValue }));
      }
    }
  };

  if (!isOpen || !exam) return null;

  // ──────────────────────────────────────────────────────────────
  // JSX
  // ──────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl border border-input-border relative max-h-[90vh] overflow-y-auto">
        {/* close */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition"
        >
          <X size={18} />
        </button>

        {/* header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-heading mb-2">Edit Exam</h2>
          <p className="text-card-info">
            Update the details below and click&nbsp;
            <strong>Save&nbsp;Changes</strong>.
          </p>
        </div>

        {/* form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* course */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {courses.length === 1 ? 'Course' : 'Select Course *'}
            </label>

            {courses.length === 1 ? (
              <CourseInfoCard course={courses[0]} />
            ) : (
              <div className="relative">
                <select
                  value={formData.course}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      course: Number(e.target.value),
                    }))
                  }
                  className="w-full px-4 py-3 border border-input-border rounded-lg
                             bg-white text-gray-900
                             focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn
                             appearance-none"
                  disabled={isLoading}
                  required
                >
                  <option value={0}>Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} – {c.title} ({c.term})
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                  <ChevronDown size={18} className="text-gray-400" />
                </div>
              </div>
            )}
          </div>

          {/* title */}
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
              value={formData.title}
              onChange={(e) =>
                setFormData((p) => ({ ...p, title: e.target.value }))
              }
              className="w-full px-4 py-3 border border-input-border rounded-lg
                         bg-white text-gray-900
                         focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              disabled={isLoading}
              required
            />
          </div>

          {/* exam type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Exam Type *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {EXAM_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => handleExamTypeChange(t.value)}
                  disabled={isLoading}
                  className={`p-4 border rounded-lg text-left transition ${
                    formData.exam_type === t.value
                      ? 'border-primary-btn bg-primary-btn text-white'
                      : 'border-input-border hover:border-primary-btn bg-white'
                  }`}
                >
                  <div className="font-medium">{t.label}</div>
                  <div
                    className={`text-sm mt-1 ${
                      formData.exam_type === t.value
                        ? 'text-white/80'
                        : 'text-card-info'
                    }`}
                  >
                    {t.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* time limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Time Limit (minutes)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={
                  formData.time_limit === 0 && !timeLimitTouched
                    ? ''
                    : formData.time_limit
                }
                onChange={handleTimeChange}
                onFocus={() => setTimeLimitTouched(true)}
                className="flex-1 px-4 py-3 border border-input-border rounded-lg
                           bg-white text-gray-900
                           focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
                placeholder="0 = unlimited"
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

          {/* description */}
          <div>
            <label
              htmlFor="desc"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Description
            </label>
            <textarea
              id="desc"
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData((p) => ({ ...p, description: e.target.value }))
              }
              className="w-full px-4 py-3 border border-input-border rounded-lg
                         bg-white text-gray-900
                         focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              disabled={isLoading}
            />
          </div>

          {/* weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight (% of course grade)
            </label>
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={
                formData.weight === 0 && !weightTouched ? '' : formData.weight
              }
              onChange={handleWeightChange}
              onFocus={() => setWeightTouched(true)}
              className="w-full px-4 py-3 border border-input-border rounded-lg
                         bg-white text-gray-900
                         focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              placeholder="0 – 100"
              disabled={isLoading}
            />
          </div>

          {/* required to pass */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="reqPass"
              checked={formData.required_to_pass}
              onChange={(e) =>
                setFormData((p) => ({
                  ...p,
                  required_to_pass: e.target.checked,
                }))
              }
              disabled={isLoading}
            />
            <label htmlFor="reqPass" className="text-sm">
              Required to pass course
            </label>
          </div>

          {/* default note */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-600 mt-0.5" />
              <p className="text-sm text-amber-700">
                You can fine-tune question selection in the
                Exam&nbsp;&quot;Questions&quot; tab, available via
                the&nbsp;&quot;View Exam&quot; button on the Exam Card.
              </p>
            </div>
          </div>

          {/* error */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {/* actions */}
          <div className="flex gap-3 pt-4">
            <StandardButton
              type="button"
              color="secondary-btn"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </StandardButton>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium transition"
              disabled={isLoading || !formData.title.trim() || !formData.course}
            >
              {isLoading ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
