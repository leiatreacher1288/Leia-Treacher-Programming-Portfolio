import React from 'react';
import { X } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import type { Course } from '../../api/courseAPI';
import type { Exam } from '../../api/examAPI';

interface AddToExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  addExamCourseId: number | '';
  setAddExamCourseId: React.Dispatch<React.SetStateAction<number | ''>>;
  availableExams: Exam[];
  selectedExamIdToAdd: number | '';
  setSelectedExamIdToAdd: React.Dispatch<React.SetStateAction<number | ''>>;
  handleConfirmAddToExam: () => Promise<void>;
  courses: Course[];
}

export const AddToExamModal: React.FC<AddToExamModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  addExamCourseId,
  setAddExamCourseId,
  availableExams,
  selectedExamIdToAdd,
  setSelectedExamIdToAdd,
  handleConfirmAddToExam,
  courses,
}) => {
  if (!isOpen) return null;

  const handleAdd = async () => {
    await handleConfirmAddToExam();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl border border-gray-200 w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add to Exam</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600">
            {selectedCount} question{selectedCount !== 1 ? 's' : ''} selected
          </p>

          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select course
            </label>
            <select
              value={addExamCourseId}
              onChange={(e) => setAddExamCourseId(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code ? `${c.code} – ${c.title}` : c.title}
                </option>
              ))}
            </select>
          </div>

          {/* Exam Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select exam
            </label>
            <select
              value={selectedExamIdToAdd}
              disabled={!addExamCourseId}
              onChange={(e) => setSelectedExamIdToAdd(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn disabled:opacity-50 disabled:bg-gray-100"
            >
              <option value="">Select exam</option>
              {availableExams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
          <StandardButton color="secondary-btn" onClick={onClose}>
            Cancel
          </StandardButton>
          <StandardButton
            color="primary-btn"
            onClick={handleAdd}
            disabled={!selectedExamIdToAdd}
          >
            Add to Exam
          </StandardButton>
        </div>
      </div>
    </div>
  );
};
