// src/components/QuestionBank/AddToExamBanner.tsx
import React from 'react';
import { StandardButton } from '../ui/StandardButton';

interface AddToExamBannerProps {
  examName: string;
  onCancel: () => void;
}

export const AddToExamBanner: React.FC<AddToExamBannerProps> = ({
  examName,
  onCancel,
}) => (
  <div className="bg-primary-btn/10 border-l-4 border-primary-btn p-4 mb-6 rounded-lg flex items-center justify-between mt-4">
    <div>
      <span className="font-semibold text-primary-btn">
        Add Questions to {examName}
      </span>
      <span className="block text-gray-700 mt-1 text-sm">
        Select questions below and click &apos;Add to {examName}&apos; to add
        them to the exam.
      </span>
    </div>
    <StandardButton color="secondary-btn" onClick={onCancel}>
      Cancel
    </StandardButton>
  </div>
);
