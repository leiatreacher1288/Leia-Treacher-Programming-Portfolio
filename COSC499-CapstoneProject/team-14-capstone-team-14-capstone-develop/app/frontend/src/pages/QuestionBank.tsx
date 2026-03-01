import React, { useState, useEffect } from 'react';
import {
  Plus,
  Upload,
  Search,
  BookOpen,
  Eye,
  Edit,
  Trash2,
  Filter,
  ChevronDown,
} from 'lucide-react';
import { StandardButton } from '../components/ui/StandardButton';
import { WizardQuestionBankCard } from '../components/QuestionBank/WizardQuestionBankCard';
import {
  questionAPI,
  type QuestionBank as QuestionBankType,
} from '../api/questionAPI';
import { courseAPI, type Course } from '../api/courseAPI';
import { ImportQuestionsModal } from '../components/QuestionBank/ImportQuestionsModal';
import { CreateQuestionBankModal } from '../components/QuestionBank/CreateQuestionBankModal';
import { QuestionBankDetail } from '../components/QuestionBank/QuestionBankDetail';
import ConfirmModal from '../components/ui/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';
import { useLocation, useNavigate } from 'react-router-dom';

interface QuestionBankWithStats extends QuestionBankType {
  question_count: number;
  difficulty_breakdown: {
    easy: number;
    medium: number;
    hard: number;
    unknown: number;
  };
  tag_counts: Record<string, number>;
}

interface CourseWithBanks extends Course {
  questionBanks: QuestionBankWithStats[];
}

/**
 * QuestionBank - Main page for managing question banks across all courses
 * Shows question bank cards organized by course with filtering and search
 */
export const QuestionBank: React.FC = () => {
  // State management
  const [courses, setCourses] = useState<CourseWithBanks[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourseFilter, setSelectedCourseFilter] =
    useState<string>('All Courses');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingBank, setEditingBank] = useState<QuestionBankType | null>(null);
  const [deletingBank, setDeletingBank] = useState<QuestionBankType | null>(
    null
  );
  const [selectedBankForImport, setSelectedBankForImport] =
    useState<QuestionBankType | null>(null);
  const [selectedBankForDetail, setSelectedBankForDetail] =
    useState<QuestionBankType | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const addToExamMode = params.get('addToExam') === '1';
  const examId = params.get('examId');
  const [examName, setExamName] = useState<string>('');

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData();
  }, []);

  // Fetch exam name if in addToExamMode
  useEffect(() => {
    if (addToExamMode && examId) {
      // Import examAPI here to avoid circular dependency
      import('../api/examAPI').then(({ examAPI }) => {
        examAPI
          .getExamDetail(Number(examId))
          .then((data) => setExamName(data.title || 'Exam'))
          .catch(() => setExamName('Exam'));
      });
    }
  }, [addToExamMode, examId]);

  /**
   * Load courses and their question banks from the API
   */
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const coursesData = await courseAPI.getCourses();

      // Load question banks for each course
      const coursesWithBanks = await Promise.all(
        coursesData.map(async (course) => {
          try {
            const banks = await questionAPI.getQuestionBanksByCourse(course.id);
            return {
              ...course,
              questionBanks: banks as QuestionBankWithStats[],
            };
          } catch (err) {
            console.error(
              `Failed to load question banks for course ${course.id}:`,
              err
            );
            return {
              ...course,
              questionBanks: [],
            };
          }
        })
      );

      setCourses(coursesWithBanks);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('Failed to load courses and question banks');
      toast.error('Failed to load courses and question banks');
    } finally {
      setLoading(false);
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

      // Add the new bank with initial stats
      const bankWithStats: QuestionBankWithStats = {
        ...newBank,
        question_count: 0,
        difficulty_breakdown: { easy: 0, medium: 0, hard: 0, unknown: 0 },
        tag_counts: {},
      };

      // Update the course with the new bank
      setCourses((prev) =>
        prev.map((course) =>
          course.id === bankData.courseId
            ? {
                ...course,
                questionBanks: [bankWithStats, ...course.questionBanks],
              }
            : course
        )
      );

      setShowCreateModal(false);
      toast.success('Question bank created successfully!');
    } catch (err) {
      console.error('Failed to create question bank:', err);
      toast.error('Failed to create question bank. Please try again.');
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

      setCourses((prev) =>
        prev.map((course) => ({
          ...course,
          questionBanks: course.questionBanks.map((bank) =>
            bank.id === bankId ? { ...bank, ...updatedBank } : bank
          ),
        }))
      );

      setEditingBank(null);
      toast.success('Question bank updated successfully!');
    } catch (err) {
      console.error('Failed to update question bank:', err);
      toast.error('Failed to update question bank. Please try again.');
    }
  };

  const handleDeleteBank = async (bankId: number) => {
    try {
      await questionAPI.deleteQuestionBank(bankId);

      setCourses((prev) =>
        prev.map((course) => ({
          ...course,
          questionBanks: course.questionBanks.filter(
            (bank) => bank.id !== bankId
          ),
        }))
      );

      setDeletingBank(null);
      toast.success('Question bank deleted successfully!');
    } catch (err) {
      console.error('Failed to delete question bank:', err);
      toast.error('Failed to delete question bank. Please try again.');
    }
  };

  const handleImportSuccess = () => {
    loadInitialData(); // Reload to get updated question counts
    setShowImportModal(false);
    setSelectedBankForImport(null);
  };

  // Filter courses and question banks based on search and filters
  const filteredCourses = courses.filter((course) => {
    const matchesCourseFilter =
      selectedCourseFilter === 'All Courses' ||
      course.code === selectedCourseFilter;

    if (!matchesCourseFilter) return false;

    // Filter question banks within the course
    const filteredBanks = course.questionBanks.filter((bank) => {
      const matchesSearch =
        searchQuery === '' ||
        bank.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bank.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });

    return filteredBanks.length > 0;
  });

  // Get all available courses for the filter dropdown
  const availableCourses = courses.map((course) => course.code);

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-btn mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading question banks...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 text-lg font-semibold mb-4">{error}</div>
          <StandardButton
            color="primary-btn"
            onClick={loadInitialData}
            icon={<BookOpen size={16} />}
          >
            Try Again
          </StandardButton>
        </div>
      </div>
    );
  }

  // Show detail view if a bank is selected
  if (selectedBankForDetail) {
    return (
      <QuestionBankDetail
        questionBankId={selectedBankForDetail.id}
        questionBankTitle={selectedBankForDetail.title}
        courseId={selectedBankForDetail.course}
        onBack={() => setSelectedBankForDetail(null)}
      />
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Toaster
        position="top-right"
        toastOptions={{ className: 'font-inter text-sm' }}
      />

      {/* Fixed Sticky Header - Always visible at the top, positioned after sidebar */}
      <div className="fixed top-0 left-64 right-0 bg-white border-b border-gray-200 shadow-sm z-40">
        <div className="px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-heading mb-2">
                Question Banks
              </h1>
              <p className="text-sm text-muted">
                Manage question banks across all courses
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

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
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

            {/* Course Filter */}
            <div className="relative">
              <select
                value={selectedCourseFilter}
                onChange={(e) => setSelectedCourseFilter(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn bg-white appearance-none pr-10"
              >
                <option value="All Courses">All Courses</option>
                {availableCourses.map((courseCode) => (
                  <option key={courseCode} value={courseCode}>
                    {courseCode}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors flex items-center gap-2"
            >
              <Filter size={16} className="text-gray-500" />
              <span className="text-sm font-medium">Filters</span>
            </button>
          </div>

          {addToExamMode && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookOpen className="text-blue-600" size={16} />
                  <span className="font-medium text-blue-800">
                    Adding questions to: {examName}
                  </span>
                </div>
                <button
                  onClick={() => navigate(-1)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content with top padding to account for fixed header */}
      <div className="w-full" style={{ paddingTop: '200px' }}>
        <div className="px-4 sm:px-6 lg:px-8">
          {/* Question Banks by Course */}
          {filteredCourses.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <BookOpen className="text-blue-600" size={32} />
              </div>
              <h3 className="text-xl font-bold text-heading mb-2">
                {courses.length === 0
                  ? 'No Courses Available'
                  : 'No Question Banks Found'}
              </h3>
              <p className="text-muted mb-6">
                {courses.length === 0
                  ? 'You need to be enrolled in courses to view question banks.'
                  : 'Try adjusting your search or filters.'}
              </p>
              {courses.length > 0 && (
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
            <div className="space-y-8">
              {filteredCourses.map((course) => (
                <div key={course.id} className="space-y-4">
                  {/* Course Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-heading">
                        {course.code} - {course.title}
                      </h2>
                      <p className="text-sm text-muted">
                        {course.questionBanks.length} question bank
                        {course.questionBanks.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Question Banks Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {course.questionBanks
                      .filter((bank) => {
                        const matchesSearch =
                          searchQuery === '' ||
                          bank.title
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase()) ||
                          bank.description
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase());
                        return matchesSearch;
                      })
                      .map((bank) => (
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
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create Question Bank Modal */}
      {showCreateModal && (
        <CreateQuestionBankModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateBank}
          title="Create Question Bank"
          courses={courses} // Pass courses to the modal
        />
      )}

      {/* Edit Question Bank Modal */}
      {editingBank && (
        <CreateQuestionBankModal
          isOpen={!!editingBank}
          onClose={() => setEditingBank(null)}
          onSubmit={(data: {
            title: string;
            description: string;
            courseId: number;
          }) => handleUpdateBank(editingBank.id, data)}
          title="Edit Question Bank"
          courses={courses}
          initialData={{
            title: editingBank.title,
            description: editingBank.description,
            courseId: editingBank.course,
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
          defaultCourseId={selectedBankForImport?.course || courses[0]?.id}
          defaultQuestionBankId={selectedBankForImport?.id}
          showCourseSelector={!selectedBankForImport} // Show course selector if no bank is pre-selected
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
