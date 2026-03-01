import React from 'react';
import { StandardButton } from '../ui/StandardButton';
import { Download } from 'lucide-react';

interface SelectedMenuProps {
  selectedCount: number;
  onAddToExam: () => void;
  deleteAllSelected: () => Promise<void>;
  exportSelectedQuestions: () => void;
  clearSelection: () => void;
  examName: string;
  addToExamMode: boolean;
  handleConfirmAddToExam: () => Promise<void>;
}

export const SelectedMenu: React.FC<SelectedMenuProps> = ({
  selectedCount,
  onAddToExam,
  deleteAllSelected,
  exportSelectedQuestions,
  clearSelection,
  examName,
  addToExamMode,
  handleConfirmAddToExam,
}) => {
  return (
    <div
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-white
                    border border-gray-200 rounded-xl shadow-card px-6 py-3
                    flex items-center gap-4 animate-fade-in"
    >
      <span className="text-sm text-gray-700 font-medium">
        {selectedCount} selected
      </span>

      {addToExamMode ? (
        <StandardButton color="primary-btn" onClick={handleConfirmAddToExam}>
          Add to {examName}
        </StandardButton>
      ) : (
        <StandardButton color="primary-btn" onClick={onAddToExam}>
          Add selected to exam
        </StandardButton>
      )}
      <StandardButton color="danger-btn" onClick={deleteAllSelected}>
        Delete all selected
      </StandardButton>

      <StandardButton
        onClick={exportSelectedQuestions}
        icon={<Download size={16} />}
        color="secondary-btn"
      >
        Export
      </StandardButton>

      <StandardButton color="secondary-btn" onClick={clearSelection}>
        Cancel
      </StandardButton>
    </div>
  );
};
