import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { examAPI } from '../api/examAPI';
import { questionAPI } from '../api/questionAPI';
import type { ExamDetail } from '../api/examAPI';
import type { Question } from '../components/QuestionBank/types';

interface UseQuestionManagementProps {
  exam: ExamDetail | null;
  loadExamData: (examId: number) => Promise<void>;
}

export const useQuestionManagement = ({
  exam,
  loadExamData,
}: UseQuestionManagementProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const handleCreateQuestion = async (data: {
    prompt: string;
    choices: Record<string, string>;
    correct_answer: string[];
    difficulty?: number;
    tags: string[];
    explanation: string;
  }) => {
    if (!exam) return;

    try {
      let banks = await questionAPI.getQuestionBanksByCourse(exam.course);
      if (banks.length === 0) {
        const newBank = await questionAPI.createQuestionBank({
          courseId: exam.course,
          title: `Default Question Bank`,
          description: 'Default question bank',
        });
        banks = [newBank];
      }

      const payload = {
        bank: banks[0].id,
        prompt: data.prompt,
        choices: data.choices,
        correct_answer: data.correct_answer,
        difficulty: data.difficulty,
        tags: data.tags,
        explanation: data.explanation,
      };

      const created = await questionAPI.createQuestion(payload);
      await examAPI.addQuestions(exam.id, [created.id]);
      await loadExamData(exam.id);

      // Don't close modal here - let the CreateQuestionModal handle it based on createAnother
      toast.success('Question created and added to exam!');
    } catch (err) {
      console.error('Failed to create question:', err);
      toast.error('Failed to create question. Please try again.');
    }
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setShowEditModal(true);
  };

  const handleSaveEditedQuestion = async (updatedQuestion: Question) => {
    if (!exam) return;

    try {
      await questionAPI.updateQuestion(parseInt(updatedQuestion.id), {
        prompt: updatedQuestion.prompt,
        choices: Object.entries(updatedQuestion.choices).reduce(
          (acc, [key, value]) => {
            if (value.trim()) acc[key] = value;
            return acc;
          },
          {} as Record<string, string>
        ),
        correct_answer: updatedQuestion.correct_answer,
        difficulty:
          updatedQuestion.difficulty === 'Easy'
            ? 1
            : updatedQuestion.difficulty === 'Medium'
              ? 2
              : 3,
        tags: updatedQuestion.tags || [],
        explanation: updatedQuestion.explanation || '',
      });
      await loadExamData(exam.id);
      setShowEditModal(false);
      setEditingQuestion(null);
      toast.success('Question updated successfully!');
    } catch (err) {
      console.error('Failed to update question:', err);
      toast.error('Failed to update question');
    }
  };

  const handleRemoveQuestion = async (questionId: number) => {
    if (!exam) return;

    try {
      await examAPI.removeQuestion(exam.id, questionId);
      await loadExamData(exam.id);
      toast.success('Question removed from exam');
    } catch (err) {
      console.error('Failed to remove question:', err);
      toast.error('Failed to remove question');
    }
  };

  return {
    showCreateModal,
    setShowCreateModal,
    editingQuestion,
    setEditingQuestion,
    showEditModal,
    setShowEditModal,
    handleCreateQuestion,
    handleEditQuestion,
    handleSaveEditedQuestion,
    handleRemoveQuestion,
  };
};
