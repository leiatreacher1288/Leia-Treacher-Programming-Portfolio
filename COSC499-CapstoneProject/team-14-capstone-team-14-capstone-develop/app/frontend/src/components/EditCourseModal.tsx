// src/components/EditCourseModal.tsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import type { Course } from '../types/course';

interface EditCourseModalProps {
  isOpen: boolean;
  course: Course;
  onClose: () => void;
  onSubmit: (courseData: {
    code: string;
    name: string;
    description: string;
    term: string;
  }) => Promise<void>;
}

export const EditCourseModal = ({
  isOpen,
  course,
  onClose,
  onSubmit,
}: EditCourseModalProps) => {
  // Parse the term to extract term type and year
  const parseTerm = (termString: string) => {
    const parts = termString.split(' ');
    if (parts.length === 2) {
      return { term: parts[0], year: parts[1] };
    }
    // Fallback if term format is unexpected
    return { term: 'W1', year: new Date().getFullYear().toString() };
  };

  const initialTermData = parseTerm(course.term);

  const [formData, setFormData] = useState({
    code: course.code,
    name: course.title,
    description: course.description || '',
    term: initialTermData.term,
    year: initialTermData.year,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset formData whenever a new course is passed in
  useEffect(() => {
    const termData = parseTerm(course.term);
    setFormData({
      code: course.code,
      name: course.title,
      description: course.description || '',
      term: termData.term,
      year: termData.year,
    });
    setError(null);
  }, [course, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        term: `${formData.term} ${formData.year}`,
      };
      await onSubmit(payload);
      onClose();
    } catch (err: any) {
      console.error('Failed to update course:', err);
      if (err.response?.status === 400 && err.response.data) {
        const errs = err.response.data;
        if (errs.code) setError(`Code: ${errs.code[0]}`);
        else if (errs.name) setError(`Name: ${errs.name[0]}`);
        else if (errs.description)
          setError(`Description: ${errs.description[0]}`);
        else if (errs.term) setError(`Term: ${errs.term[0]}`);
        else setError('Invalid input, please check your data.');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate years (current year + next 2 years)
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2].map(String);
  const terms = ['W1', 'W2', 'S1', 'S2'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Edit Course</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Course Code
              </label>
              <input
                id="code"
                type="text"
                required
                maxLength={10}
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-btn"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Course Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-btn"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Course Description
              </label>
              <textarea
                id="description"
                required
                placeholder="Enter a brief description of the course..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-btn resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="term"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Term
                </label>
                <select
                  id="term"
                  required
                  value={formData.term}
                  onChange={(e) =>
                    setFormData({ ...formData, term: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                >
                  {terms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="year"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Year
                </label>
                <select
                  id="year"
                  required
                  value={formData.year}
                  onChange={(e) =>
                    setFormData({ ...formData, year: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-btn"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
