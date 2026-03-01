import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Plus,
  Upload,
  Eye,
  Trash2,
  CheckSquare,
  Square,
} from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { questionAPI, type Question } from '../../api/questionAPI';
import { CreateQuestionModal } from './CreateQuestionModal';
import { ImportQuestionsModal } from './ImportQuestionsModal';
import ConfirmModal from '../ui/ConfirmModal';
import { courseAPI, type Course } from '../../api/courseAPI';
import { QuestionBankHeader } from './QuestionBankHeader';
import { QuestionBankCard } from './QuestionBankCard';

interface QuestionBankDetailProps {
  questionBankId: number;
  questionBankTitle: string;
  courseId: number;
  onBack: () => void;
}

export const QuestionBankDetail: React.FC<QuestionBankDetailProps> = ({
  questionBankId,
  questionBankTitle,
  courseId,
  onBack,
}) => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Any');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(
    null
  );
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<number>>(
    new Set()
  );
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [showDeleteMultipleModal, setShowDeleteMultipleModal] = useState(false);
  const [questionBankData, setQuestionBankData] = useState<{
    question_count: number;
    difficulty_breakdown: {
      easy: number;
      medium: number;
      hard: number;
      unknown: number;
    };
    tag_counts: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    loadQuestions();
    loadCourses();
    loadQuestionBankData();
  }, [questionBankId]);

  const loadQuestions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const questionsData =
        await questionAPI.getQuestionsByBank(questionBankId);
      setQuestions(questionsData);
    } catch (err) {
      console.error('Failed to load questions:', err);
      setError('Failed to load questions. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadCourses = async () => {
    try {
      const coursesData = await courseAPI.getCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadQuestionBankData = async () => {
    try {
      const bankData = await questionAPI.getQuestionBanksByCourse(courseId);
      const currentBank = bankData.find((bank) => bank.id === questionBankId);
      if (currentBank) {
        setQuestionBankData({
          question_count: currentBank.question_count,
          difficulty_breakdown: currentBank.difficulty_breakdown,
          tag_counts: currentBank.tag_counts,
        });
      }
    } catch (err) {
      console.error('Failed to load question bank data:', err);
    }
  };

  const handleCreateQuestion = async (data: {
    prompt: string;
    choices: Record<string, string>;
    correct_answer: string[];
    difficulty?: number;
    tags: string[];
    explanation: string;
    course_id: number;
  }) => {
    try {
      await questionAPI.createQuestion({
        ...data,
        bank: questionBankId,
      });
      loadQuestions();
      loadQuestionBankData();
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create question:', err);
      alert('Failed to create question. Please try again.');
    }
  };

  const handleUpdateQuestion = async (
    questionId: number,
    data: Partial<{
      prompt: string;
      choices: Record<string, string>;
      correct_answer: string[];
      difficulty: number;
      tags: string[];
      explanation: string;
    }>
  ) => {
    try {
      await questionAPI.updateQuestion(questionId, data);
      loadQuestions();
      loadQuestionBankData();
      setEditingQuestion(null);
    } catch (err) {
      console.error('Failed to update question:', err);
      alert('Failed to update question. Please try again.');
    }
  };

  const handleDeleteQuestion = async (questionId: number) => {
    try {
      await questionAPI.deleteQuestion(questionId);
      loadQuestions();
      loadQuestionBankData();
      setDeletingQuestion(null);
      // Remove from selected questions if it was selected
      setSelectedQuestions((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
    } catch (err) {
      console.error('Failed to delete question:', err);
      alert('Failed to delete question. Please try again.');
    }
  };

  const handleDeleteMultipleQuestions = async () => {
    try {
      const questionIds = Array.from(selectedQuestions).map(Number);
      await Promise.all(
        questionIds.map((id) => questionAPI.deleteQuestion(id))
      );

      // Clear selection and exit multi-select mode
      setSelectedQuestions(new Set());
      setIsMultiSelectMode(false);
      setShowDeleteMultipleModal(false);

      // Reload questions
      await loadQuestions();
    } catch (error) {
      console.error('Failed to delete multiple questions:', error);
    }
  };

  const handleImportSuccess = () => {
    loadQuestions();
    loadQuestionBankData();
    setShowImportModal(false);
  };

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question);
  };

  const handleDeleteQuestionClick = (questionId: string) => {
    const question = questions.find(
      (q) => q.id.toString() === questionId || q.id === parseInt(questionId)
    );
    if (question) {
      setDeletingQuestion(question);
    }
  };

  const handleQuestionSelect = (questionId: number) => {
    setSelectedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const allQuestionIds = filteredQuestions.map((q) => q.id);
    setSelectedQuestions(new Set(allQuestionIds));
  };

  const handleDeselectAll = () => {
    setSelectedQuestions(new Set());
  };

  const toggleMultiSelectMode = () => {
    setIsMultiSelectMode(!isMultiSelectMode);
    if (!isMultiSelectMode) {
      setSelectedQuestions(new Set());
    }
  };

  const handleDeleteSelectedClick = () => {
    if (selectedCount > 0) {
      setShowDeleteMultipleModal(true);
    }
  };

  const filteredQuestions = questions.filter((question) => {
    const matchesSearch =
      searchQuery === '' ||
      question.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      question.tags.some((tag) =>
        tag.toLowerCase().includes(searchQuery.toLowerCase())
      );

    const matchesDifficulty =
      selectedDifficulty === 'Any' ||
      questionAPI.getDifficultyLabel(question.difficulty) ===
        selectedDifficulty;

    return matchesSearch && matchesDifficulty;
  });

  const selectedCount = selectedQuestions.size;
  const isAllSelected =
    filteredQuestions.length > 0 &&
    filteredQuestions.every((q) => selectedQuestions.has(q.id));

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading questions...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
        <StandardButton
          color="primary-btn"
          onClick={loadQuestions}
          icon={<Eye size={16} />}
        >
          Try Again
        </StandardButton>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header - Two Column Layout with Consistent Spacing */}
      <div className="flex items-start justify-between">
        {/* Left Column: Back button, title, and metadata */}
        <div className="flex items-start gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="space-y-2">
            <div>
              <h1 className="text-2xl font-semibold text-heading mb-2">
                {questionBankTitle}
              </h1>
              {questionBankData && (
                <QuestionBankHeader
                  title=""
                  question_count={questionBankData.question_count}
                  difficulty_breakdown={questionBankData.difficulty_breakdown}
                  tag_counts={questionBankData.tag_counts}
                  className="mt-1"
                />
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Action buttons */}
        <div className="flex items-center gap-3">
          <StandardButton
            color="secondary-btn"
            onClick={() => setShowImportModal(true)}
            icon={<Upload size={16} />}
          >
            Import Questions
          </StandardButton>
          <StandardButton
            color="primary-btn"
            onClick={() => setShowCreateModal(true)}
            icon={<Plus size={16} />}
          >
            Add Question
          </StandardButton>
        </div>
      </div>

      {/* Multi-select Controls */}
      {isMultiSelectMode && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-blue-900">
              {selectedCount} question{selectedCount !== 1 ? 's' : ''} selected
            </span>
            <button
              onClick={isAllSelected ? handleDeselectAll : handleSelectAll}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              {isAllSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <StandardButton
              color="danger-btn"
              onClick={handleDeleteSelectedClick}
              icon={<Trash2 size={16} />}
              disabled={selectedCount === 0}
            >
              Delete Selected ({selectedCount})
            </StandardButton>
            <button
              onClick={toggleMultiSelectMode}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Search and Filters - Full Width with Consistent Spacing */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn bg-white"
            />
          </div>
        </div>
        <select
          value={selectedDifficulty}
          onChange={(e) => setSelectedDifficulty(e.target.value)}
          className="px-4 py-3 rounded-lg border border-gray-300 bg-white text-sm focus:border-primary-btn focus:ring-1 focus:ring-primary-btn"
        >
          <option value="Any">Any Difficulty</option>
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
        <button
          onClick={toggleMultiSelectMode}
          className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
            isMultiSelectMode
              ? 'border-blue-300 bg-blue-50 text-blue-700'
              : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {isMultiSelectMode ? (
            <>
              <CheckSquare size={16} className="inline mr-2" />
              Multi-select
            </>
          ) : (
            <>
              <Square size={16} className="inline mr-2" />
              Select Multiple
            </>
          )}
        </button>
      </div>

      {/* Questions List with Consistent Spacing */}
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Eye className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">
            {questions.length === 0 ? 'No Questions Yet' : 'No Questions Found'}
          </h3>
          <p className="text-muted mb-6">
            {questions.length === 0
              ? 'Add your first question to get started.'
              : 'Try adjusting your search or filters.'}
          </p>
          {questions.length === 0 && (
            <StandardButton
              color="primary-btn"
              size="lg"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
            >
              Add First Question
            </StandardButton>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredQuestions.map((question, index) => (
            <div key={question.id} className="transition-all duration-200">
              <QuestionBankCard
                question={question as any}
                questionNumber={index + 1}
                context="question-bank"
                onEdit={isMultiSelectMode ? undefined : handleEditQuestion}
                onDelete={handleDeleteQuestionClick}
                isSelected={
                  isMultiSelectMode && selectedQuestions.has(question.id)
                }
                onSelect={isMultiSelectMode ? handleQuestionSelect : undefined}
              />
            </div>
          ))}
        </div>
      )}

      {/* Create Question Modal */}
      {showCreateModal && (
        <CreateQuestionModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateQuestion}
          courses={courses}
          defaultCourse={courseId}
          hideCoursePicker={true}
        />
      )}

      {/* Edit Question Modal */}
      {editingQuestion && (
        <CreateQuestionModal
          isOpen={!!editingQuestion}
          onClose={() => setEditingQuestion(null)}
          onCreate={(data) => handleUpdateQuestion(editingQuestion.id, data)}
          courses={courses}
          defaultCourse={courseId}
          hideCoursePicker={true}
          initialValues={{
            prompt: editingQuestion.prompt,
            choices: editingQuestion.choices,
            correct_answer: editingQuestion.correct_answer,
            difficulty: editingQuestion.difficulty,
            tags: editingQuestion.tags,
            explanation: editingQuestion.explanation,
            course_id: courseId,
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportQuestionsModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSubmit={async (data) => {
            // Handle the import submission
            try {
              for (const file of data.files) {
                await questionAPI.uploadQuestionsFile(
                  file,
                  data.questionBankId,
                  data.courseId
                );
              }
              handleImportSuccess();
            } catch (error) {
              console.error('Import failed:', error);
            }
          }}
          defaultCourseId={courseId}
          defaultQuestionBankId={questionBankId}
          showCourseSelector={false} // Hide course selector since we're in a specific question bank
          hideCreateBankButton={true} // Hide create new bank button since it doesn't make sense here
          readOnlyQuestionBank={true} // Make question bank field read-only since we're in a specific bank
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingQuestion && (
        <ConfirmModal
          open={!!deletingQuestion}
          onCancel={() => setDeletingQuestion(null)}
          onConfirm={() => handleDeleteQuestion(deletingQuestion.id)}
          title="Delete Question"
          description={`Are you sure you want to delete this question? This action cannot be undone.`}
          confirmText="Delete"
        />
      )}

      {/* Delete Multiple Confirmation Modal */}
      {showDeleteMultipleModal && (
        <ConfirmModal
          open={showDeleteMultipleModal}
          onCancel={() => setShowDeleteMultipleModal(false)}
          onConfirm={handleDeleteMultipleQuestions}
          title="Delete Multiple Questions"
          description={`Are you sure you want to delete ${selectedCount} question${selectedCount !== 1 ? 's' : ''}? This action cannot be undone.`}
          confirmText="Delete All"
        />
      )}
    </div>
  );
};
