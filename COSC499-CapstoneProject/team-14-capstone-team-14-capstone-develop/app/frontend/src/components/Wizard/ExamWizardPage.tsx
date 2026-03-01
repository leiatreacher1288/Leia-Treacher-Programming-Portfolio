import React from 'react';
import { ConnectedExamWizardPage } from './ConnectedExamWizardPage';

interface ExamWizardPageProps {
  examId: number;
  onClose: () => void;
}

export const ExamWizardPage: React.FC<ExamWizardPageProps> = ({
  examId,
  onClose,
}) => {
  return <ConnectedExamWizardPage examId={examId} onClose={onClose} />;
};
