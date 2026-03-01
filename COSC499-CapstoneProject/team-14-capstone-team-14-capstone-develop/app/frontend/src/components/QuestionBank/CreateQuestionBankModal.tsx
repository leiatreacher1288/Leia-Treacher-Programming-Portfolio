import React, { useState, useEffect } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { X } from 'lucide-react';
import { type Course } from '../../api/courseAPI';

interface CreateQuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    title: string;
    description: string;
    courseId: number;
  }) => Promise<void>;
  title: string;
  courses: Course[];
  initialData?: {
    title: string;
    description: string;
    courseId?: number;
  };
}

export const CreateQuestionBankModal: React.FC<
  CreateQuestionBankModalProps
> = ({ isOpen, onClose, onSubmit, title, courses, initialData }) => {
  const [bankTitle, setBankTitle] = useState('');
  const [bankDescription, setBankDescription] = useState('');
  const [selectedCourseId, setSelectedCourseId] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      setBankTitle(initialData?.title || '');
      setBankDescription(initialData?.description || '');
      setSelectedCourseId(
        initialData?.courseId || (courses.length > 0 ? courses[0].id : 0)
      );
      setErrors({});
    }
  }, [isOpen, initialData, courses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!bankTitle.trim()) {
      newErrors.title = 'Question bank title is required.';
    }

    if (!selectedCourseId) {
      newErrors.course = 'Please select a course.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      console.log(
        '🆕 CreateQuestionBankModal: Creating question bank with data:',
        {
          title: bankTitle.trim(),
          description: bankDescription.trim(),
          courseId: selectedCourseId,
        }
      );

      await onSubmit({
        title: bankTitle.trim(),
        description: bankDescription.trim(),
        courseId: selectedCourseId,
      });

      console.log(
        '✅ CreateQuestionBankModal: Question bank created successfully'
      );
    } catch (error) {
      console.error(
        '❌ CreateQuestionBankModal: Failed to create question bank:',
        error
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 relative animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X size={20} className="text-gray-500" />
        </button>

        <h2 className="text-2xl font-bold mb-6 text-heading">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-heading">
              Course <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(Number(e.target.value))}
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white"
              required
            >
              <option value={0}>Select a course...</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.code} - {course.title}
                </option>
              ))}
            </select>
            {errors.course && (
              <p className="text-red-600 text-sm mt-1">{errors.course}</p>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-heading">
              Question Bank Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={bankTitle}
              onChange={(e) => setBankTitle(e.target.value)}
              placeholder="e.g., Chapter 1 QB, Midterm Questions"
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white"
              required
            />
            {errors.title && (
              <p className="text-red-600 text-sm mt-1">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-heading">
              Description
            </label>
            <textarea
              value={bankDescription}
              onChange={(e) => setBankDescription(e.target.value)}
              placeholder="Brief description of this question bank..."
              className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn text-base bg-white resize-none"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <StandardButton
              type="button"
              color="secondary-btn"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </StandardButton>
            <StandardButton
              type="submit"
              color="primary-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Create'}
            </StandardButton>
          </div>
        </form>
      </div>
    </div>
  );
};
