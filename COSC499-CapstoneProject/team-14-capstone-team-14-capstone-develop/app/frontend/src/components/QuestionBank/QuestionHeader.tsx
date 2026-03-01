import React from 'react';
import { FiPlus } from 'react-icons/fi';
import { Upload, Download } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';

interface QuestionHeaderProps {
  onImportClick: () => void;
  onExportClick: () => void;
  onCreateClick: () => void;
}

export const QuestionHeader: React.FC<QuestionHeaderProps> = ({
  onImportClick,
  onExportClick,
  onCreateClick,
}) => (
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
    <h1 className="text-2xl font-semibold text-gray-900">Question Bank</h1>
    <div className="flex gap-3">
      <StandardButton
        color="secondary-btn"
        icon={<Upload size={16} />}
        onClick={onImportClick}
      >
        Import Questions
      </StandardButton>
      <StandardButton
        color="secondary-btn"
        icon={<Download size={16} />}
        onClick={onExportClick}
      >
        Export Questions
      </StandardButton>
      <StandardButton
        color="primary-btn"
        icon={<FiPlus size={16} />}
        onClick={onCreateClick}
      >
        Create New Question
      </StandardButton>
    </div>
  </div>
);
