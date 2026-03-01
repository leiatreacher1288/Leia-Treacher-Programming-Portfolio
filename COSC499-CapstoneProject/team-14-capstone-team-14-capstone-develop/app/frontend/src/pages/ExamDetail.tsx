// src/pages/ExamDetail.tsx

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { examAPI } from '../api/examAPI';
import { courseAPI } from '../api/courseAPI';
import type { ExamDetail as ExamDetailType } from '../api/examAPI';
import { ExamDashboardView } from '../components/ExamDashboard/ExamDashboardView';
import { ExamWizardPage } from '../components/Wizard/ExamWizardPage';

export const ExamDetail: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [exam, setExam] = useState<ExamDetailType | null>(null);
  const [course, setCourse] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showWizardPage, setShowWizardPage] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if we're coming from the wizard (has prioritizeRecentSet in URL params)
  const searchParams = new URLSearchParams(location.search);
  const prioritizeRecentSet =
    searchParams.get('prioritizeRecentSet') === 'true';

  useEffect(() => {
    if (id) {
      loadExamData(parseInt(id, 10));
    }
  }, [id]);

  const loadExamData = async (examId: number): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      // 1) fetch the exam
      const examData = await examAPI.getExamDetail(examId);
      // 2) fetch its course
      const courseData = await courseAPI.getCourseDetail(examData.course);
      // 3) update state
      setExam(examData);
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load exam:', err);
      setError('Failed to load exam. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateVariants = async () => {
    if (!exam) return;

    setIsGenerating(true);
    try {
      await examAPI.generateVariants(exam.id);
      // Don't reload exam data - let VariantSetManager handle loading new variant sets
      // The VariantSetManager will call loadVariantSets() to get the updated sets
    } catch (error) {
      console.error('Error generating variants:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  // If wizard is active, show it as full page
  if (showWizardPage && exam) {
    return (
      <ExamWizardPage
        examId={exam.id}
        onClose={() => setShowWizardPage(false)}
      />
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500">Loading exam...</div>
        </div>
      </div>
    );
  }

  if (error || !exam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">
            {error || 'Exam not found'}
          </div>
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ExamDashboardView
        exam={exam}
        course={course}
        onGenerateVariants={generateVariants}
        onWizardOpen={() => setShowWizardPage(true)}
        prioritizeRecentSet={prioritizeRecentSet}
      />
    </div>
  );
};
