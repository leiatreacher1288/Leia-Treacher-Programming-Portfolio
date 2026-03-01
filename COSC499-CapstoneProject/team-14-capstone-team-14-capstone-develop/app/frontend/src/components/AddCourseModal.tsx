// src/components/AddCourseModal.tsx
import { useState } from 'react';
import { StandardButton } from './ui/StandardButton';

interface AddCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (courseData: {
    code: string;
    name: string;
    description: string;
    term: string;
  }) => Promise<void>;
}

export const AddCourseModal = ({
  isOpen,
  onClose,
  onSubmit,
}: AddCourseModalProps) => {
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    year: new Date().getFullYear().toString(),
    term: 'W1',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      // Prepare the data
      const submitData: any = {
        code: formData.code,
        name: formData.name,
        description: formData.description,
        term: `${formData.term} ${formData.year}`,
      };
      await onSubmit(submitData);
      // Only reset and close if no error thrown
      setFormData({
        code: '',
        name: '',
        description: '',
        year: new Date().getFullYear().toString(),
        term: 'W1',
      });
      onClose();
    } catch (error: any) {
      console.error('Failed to create course:', error);
      // Set error message based on the error
      if (error.response?.status === 401) {
        setError(
          'Creating course failed: You are not authenticated. Please log in.'
        );
      } else if (error.response?.status === 400) {
        if (error.response?.data) {
          const errors = error.response.data;
          if (errors.code) {
            setError(`Creating course failed: Course code - ${errors.code[0]}`);
          } else if (errors.name) {
            setError(`Creating course failed: Course name - ${errors.name[0]}`);
          } else if (errors.description) {
            setError(
              `Creating course failed: Description - ${errors.description[0]}`
            );
          } else if (errors.term) {
            setError(`Creating course failed: Term - ${errors.term[0]}`);
          } else {
            setError(
              'Creating course failed: Invalid course data. Please check all fields.'
            );
          }
        } else {
          setError(
            'Creating course failed: Invalid course data. Please check all fields.'
          );
        }
      } else if (error.response?.status === 403) {
        setError(
          'Creating course failed: You do not have permission to create courses.'
        );
      } else if (error.response?.data?.detail) {
        setError(`Creating course failed: ${error.response.data.detail}`);
      } else if (error.message) {
        setError(`Creating course failed: ${error.message}`);
      } else {
        setError(
          'Creating course failed: An unexpected error occurred. Please try again.'
        );
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
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-card rounded-xl shadow-xl max-w-md w-full p-6 border border-input-border">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-heading">
              Create New Course
            </h2>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Course Code
              </label>
              <input
                type="text"
                id="code"
                required
                maxLength={10}
                placeholder="e.g., COSC 304"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                className="w-full px-3 py-2 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              />
            </div>

            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Course Name
              </label>
              <input
                type="text"
                id="name"
                required
                placeholder="e.g., Introduction to Databases"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              />
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 mb-2"
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
                className="w-full px-3 py-2 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="term"
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
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
                  className="block text-sm font-medium text-gray-700 mb-2"
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
                  className="w-full px-3 py-2 border border-input-border rounded-lg text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
                >
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-6">
              <StandardButton
                onClick={onClose}
                color="secondary-btn"
                className="flex-1"
              >
                Cancel
              </StandardButton>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              >
                {isSubmitting ? 'Creating...' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
