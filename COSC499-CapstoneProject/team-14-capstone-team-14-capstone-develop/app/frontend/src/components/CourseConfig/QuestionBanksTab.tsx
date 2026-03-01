import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Edit,
  Trash2,
  Search,
  BookOpen,
  Eye,
} from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { WizardQuestionBankCard } from '../QuestionBank/WizardQuestionBankCard';
import { questionAPI, type QuestionBank } from '../../api/questionAPI';
import { courseAPI, type Course } from '../../api/courseAPI';
import { ImportQuestionsModal } from '../QuestionBank/ImportQuestionsModal';
import { CreateQuestionBankModal } from '../QuestionBank/CreateQuestionBankModal';
import { QuestionBankDetail } from '../QuestionBank/QuestionBankDetail';
import ConfirmModal from '../ui/ConfirmModal';

interface QuestionBanksTabProps {
  courseId: number;
}

interface QuestionBankWithStats extends QuestionBank {
  question_count: number;
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
    unknown: number;
  };
  tag_counts: Record<string, number>;
}

export const QuestionBanksTab: React.FC<QuestionBanksTabProps> = ({
  courseId,
}) => {
  const [questionBanks, setQuestionBanks] = useState<QuestionBankWithStats[]>(
    []
  );
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBank | null>(null);
  const [deletingBank, setDeletingBank] = useState<QuestionBank | null>(null);
  const [selectedBankForImport, setSelectedBankForImport] =
    useState<QuestionBank | null>(null);

  const [selectedBankForDetail, setSelectedBankForDetail] =
    useState<QuestionBank | null>(null);

  useEffect(() => {
    loadQuestionBanks();
    loadCourse();
  }, [courseId]);

  const loadCourse = async () => {
    try {
      const courseData = await courseAPI.getCourseDetail(courseId);
      setCourse(courseData);
    } catch (err) {
      console.error('Failed to load course:', err);
    }
  };

  const loadQuestionBanks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const banks = await questionAPI.getQuestionBanksByCourse(courseId);
      // Backend now provides all the metadata we need
      setQuestionBanks(banks as QuestionBankWithStats[]);
    } catch (err) {
      console.error('Failed to load question banks:', err);
      setError('Failed to load question banks. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBank = async (bankData: {
    title: string;
    description: string;
    courseId: number;
  }) => {
    try {
      const newBank = await questionAPI.createQuestionBank({
        courseId: bankData.courseId,
        title: bankData.title,
        description: bankData.description,
      });

      // Add the new bank with initial stats (backend will provide these)
      const bankWithStats: QuestionBankWithStats = {
        ...newBank,
        question_count: 0,
        difficulty_breakdown: { easy: 0, medium: 0, hard: 0, unknown: 0 },
        tag_counts: {},
      };

      setQuestionBanks((prev) => [bankWithStats, ...prev]);
      setShowCreateModal(false);
    } catch (err) {
      console.error('Failed to create question bank:', err);
      alert('Failed to create question bank. Please try again.');
    }
  };

  const handleUpdateBank = async (
    bankId: number,
    bankData: { title: string; description: string; courseId: number }
  ) => {
    try {
      const updatedBank = await questionAPI.updateQuestionBank(bankId, {
        title: bankData.title,
        description: bankData.description,
      });
      setQuestionBanks((prev) =>
        prev.map((bank) =>
          bank.id === bankId ? { ...bank, ...updatedBank } : bank
        )
      );
      setEditingBank(null);
    } catch (err) {
      console.error('Failed to update question bank:', err);
      alert('Failed to update question bank. Please try again.');
    }
  };

  const handleDeleteBank = async (bankId: number) => {
    try {
      await questionAPI.deleteQuestionBank(bankId);
      setQuestionBanks((prev) => prev.filter((bank) => bank.id !== bankId));
      setDeletingBank(null);
    } catch (err) {
      console.error('Failed to delete question bank:', err);
      alert('Failed to delete question bank. Please try again.');
    }
  };

  const handleImportSuccess = () => {
    loadQuestionBanks(); // Reload to get updated question counts
    setShowImportModal(false);
    setSelectedBankForImport(null);
  };

  const filteredBanks = questionBanks.filter((bank) => {
    const matchesSearch =
      searchQuery === '' ||
      bank.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bank.description.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">Loading question banks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
        <StandardButton
          color="primary-btn"
          onClick={loadQuestionBanks}
          icon={<BookOpen size={16} />}
        >
          Try Again
        </StandardButton>
      </div>
    );
  }

  // Show detail view if a bank is selected
  if (selectedBankForDetail) {
    return (
      <QuestionBankDetail
        questionBankId={selectedBankForDetail.id}
        questionBankTitle={selectedBankForDetail.title}
        courseId={courseId}
        onBack={() => setSelectedBankForDetail(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-heading mb-2">
            Question Banks
          </h1>
          <p className="text-sm text-muted">
            Manage question banks for this course
          </p>
        </div>
        <div className="flex gap-3">
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
            Create Bank
          </StandardButton>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          size={16}
        />
        <input
          type="text"
          placeholder="Search question banks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn bg-white"
        />
      </div>

      {/* Question Banks Grid */}
      {filteredBanks.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <BookOpen className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">
            {questionBanks.length === 0
              ? 'No Question Banks Yet'
              : 'No Banks Found'}
          </h3>
          <p className="text-muted mb-6">
            {questionBanks.length === 0
              ? 'Create your first question bank to start organizing questions for this course.'
              : 'Try adjusting your search or filters.'}
          </p>
          {questionBanks.length === 0 && (
            <StandardButton
              color="primary-btn"
              size="lg"
              onClick={() => setShowCreateModal(true)}
              icon={<Plus size={16} />}
            >
              Create First Bank
            </StandardButton>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBanks.map((bank) => (
            <div key={bank.id} className="relative group">
              <WizardQuestionBankCard
                bank={{
                  ...bank,
                  question_count: bank.question_count,
                  difficulty_breakdown: bank.difficulty_breakdown,
                  tag_counts: bank.tag_counts,
                }}
                showAddButton={false}
                className="h-full"
              />

              {/* Action Buttons Overlay */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedBankForDetail(bank)}
                    className="p-2 bg-purple-100 hover:bg-purple-200 rounded-lg transition-colors"
                    title="View Questions"
                  >
                    <Eye size={14} className="text-purple-600" />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedBankForImport(bank);
                      setShowImportModal(true);
                    }}
                    className="p-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors"
                    title="Import Questions"
                  >
                    <Upload size={14} className="text-blue-600" />
                  </button>
                  <button
                    onClick={() => setEditingBank(bank)}
                    className="p-2 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
                    title="Edit Bank"
                  >
                    <Edit size={14} className="text-green-600" />
                  </button>
                  <button
                    onClick={() => setDeletingBank(bank)}
                    className="p-2 bg-red-100 hover:bg-red-200 rounded-lg transition-colors"
                    title="Delete Bank"
                  >
                    <Trash2 size={14} className="text-red-600" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Question Bank Modal */}
      {showCreateModal && course && (
        <CreateQuestionBankModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBank}
          title="Create Question Bank"
          courses={[course]} // Pass the current course as the only option
        />
      )}

      {/* Edit Question Bank Modal */}
      {editingBank && course && (
        <CreateQuestionBankModal
          isOpen={!!editingBank}
          onClose={() => setEditingBank(null)}
          onSubmit={(data: {
            title: string;
            description: string;
            courseId: number;
          }) => handleUpdateBank(editingBank.id, data)}
          title="Edit Question Bank"
          courses={[course]} // Pass the current course as the only option
          initialData={{
            title: editingBank.title,
            description: editingBank.description,
            courseId: courseId,
          }}
        />
      )}

      {/* Import Modal */}
      {showImportModal && (
        <ImportQuestionsModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            setSelectedBankForImport(null);
          }}
          onSubmit={async (data) => {
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
          defaultQuestionBankId={selectedBankForImport?.id}
          showCourseSelector={false} // Hide course selector since we're in a specific course
        />
      )}

      {/* Delete Confirmation Modal */}
      {deletingBank && (
        <ConfirmModal
          open={!!deletingBank}
          onCancel={() => setDeletingBank(null)}
          onConfirm={() => handleDeleteBank(deletingBank.id)}
          title="Delete Question Bank"
          description={`Are you sure you want to delete "${deletingBank.title}"? This action cannot be undone and will also delete all questions in this bank.`}
          confirmText="Delete"
        />
      )}
    </div>
  );
};
