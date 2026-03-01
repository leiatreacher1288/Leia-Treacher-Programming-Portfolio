import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ConnectedExamWizardPage } from '../components/Wizard/ConnectedExamWizardPage';

export const ExamWizardPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const courseId = searchParams.get('courseId');

  const handleClose = () => {
    // Navigate back to the course detail if courseId is provided, otherwise to dashboard
    if (courseId) {
      navigate(`/courses/${courseId}`);
    } else {
      navigate('/dashboard');
    }
  };

  // For now, we'll create a new exam. In the future, we can add examId parameter
  // to edit existing exams
  const examId = searchParams.get('examId');

  if (!examId) {
    // Create a new exam first, then open the wizard
    // This will be handled by the wizard itself
    return (
      <ConnectedExamWizardPage
        examId={0} // 0 indicates new exam creation
        onClose={handleClose}
        courseId={courseId ? parseInt(courseId) : undefined}
      />
    );
  }

  return (
    <ConnectedExamWizardPage
      examId={parseInt(examId)}
      onClose={handleClose}
      courseId={courseId ? parseInt(courseId) : undefined}
    />
  );
};
