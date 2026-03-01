import React from 'react';
import { StandardButton } from '../../../ui/StandardButton';
import { FiSave, FiX } from 'react-icons/fi';
import { BasicInfoForm } from './BasicInfoForm';
import { QuestionDisplayForm } from './QuestionDisplayForm';
import { RandomizationForm } from './RandomizationForm';
import { ResultsForm } from './ResultsForm';
import { SecurityForm } from './SecurityForm';
import type { ExamFormData } from '../../../../utils/examFormHelpers';

interface ExamFormatModalProps {
  isOpen: boolean;
  isEditing: boolean;
  formData: ExamFormData;
  loading: boolean;
  onClose: () => void;
  onSave: () => void;
  onUpdate: (updates: Partial<ExamFormData>) => void;
}

export const ExamFormatModal: React.FC<ExamFormatModalProps> = ({
  isOpen,
  isEditing,
  formData,
  loading,
  onClose,
  onSave,
  onUpdate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {isEditing ? 'Edit Exam Format' : 'Create New Exam Format'}
          </h3>
        </div>

        <div className="p-6 space-y-6">
          <BasicInfoForm formData={formData} onUpdate={onUpdate} />
          <QuestionDisplayForm formData={formData} onUpdate={onUpdate} />
          <RandomizationForm formData={formData} onUpdate={onUpdate} />
          <ResultsForm formData={formData} onUpdate={onUpdate} />
          <SecurityForm formData={formData} onUpdate={onUpdate} />
        </div>

        <div className="p-6 border-t flex justify-end gap-3">
          <StandardButton variant="outline" onClick={onClose}>
            <FiX className="w-4 h-4 mr-2" />
            Cancel
          </StandardButton>
          <StandardButton
            onClick={onSave}
            disabled={loading || !formData.name.trim()}
          >
            <FiSave className="w-4 h-4 mr-2" />
            {loading ? 'Saving...' : isEditing ? 'Update' : 'Create'}
          </StandardButton>
        </div>
      </div>
    </div>
  );
};
