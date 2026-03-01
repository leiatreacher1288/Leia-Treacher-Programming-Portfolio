// src/components/Exams/ExamsTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExamCard } from './../cards/ExamCard';
import { SearchBar } from '../ui/SearchBar';
import { StandardDropdown } from '../ui/StandardDropdown';
import { StandardButton } from '../ui/StandardButton';
import { FileText } from 'lucide-react';
import { examAPI, type Exam } from '../../api/examAPI';
import { courseAPI, type Course } from '../../api/courseAPI';
import { CreateExamModal } from '../CreateExamModal';
import toast from 'react-hot-toast';
import { validateCourseHasQuestionBanks } from '../../utils/courseValidation';

interface ExamsTabProps {
  courseId: number;
}

export const ExamsTab = ({ courseId }: ExamsTabProps) => {
  // ─── data & UI state ─────────────────────────────────────────
  const [exams, setExams] = useState<Exam[]>([]);
  const [filteredExams, setFilteredExams] = useState<Exam[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('Title');
  const sortOptions = ['Title', 'Last Opened', 'Term', 'Subject'];

  const [showComparePopup, setShowComparePopup] = useState(false);
  const [compare1, setCompare1] = useState<string>('');
  const [compare2, setCompare2] = useState<string>('');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const [course, setCourse] = useState<Course | null>(null);

  // ─── editing state (only for the loading/error indicators) ───
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const navigate = useNavigate();

  // ─── load the list and course detail ────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [examList, courseDetail] = await Promise.all([
        examAPI.getExams(courseId),
        courseAPI.getCourseDetail(courseId),
      ]);
      setExams(examList);
      setFilteredExams(examList);
      setCourse(courseDetail);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load exams');
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── search + sort ──────────────────────────────────────────
  useEffect(() => {
    let items = [...exams];
    if (search) {
      items = items.filter((e) =>
        e.title.toLowerCase().includes(search.toLowerCase())
      );
    }
    items.sort((a, b) => {
      switch (sortBy) {
        case 'Title':
          return a.title.localeCompare(b.title);
        case 'Last Opened':
          return (
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          );
        case 'Term':
          return a.course_term.localeCompare(b.course_term);
        case 'Subject':
          return (a.subject || '').localeCompare(a.subject || '');
        default:
          return 0;
      }
    });
    setFilteredExams(items);
  }, [exams, search, sortBy]);

  // ─── create new exam ────────────────────────────────────────
  const handleCreateExam = async (data: {
    title: string;
    exam_type: string;
    time_limit: number;
    course: number;
    description?: string;
    weight: number;
    required_to_pass: boolean;
  }) => {
    setIsCreating(true);
    setCreateError(null);

    try {
      const createdExam = await examAPI.createExam(data);

      if (!createdExam || !createdExam.id) {
        setCreateError('No exam returned from server. Please try again.');
        setIsCreating(false);
        return;
      }

      setShowCreateModal(false);
      setTimeout(() => navigate(`/exam/${createdExam.id}`), 50);
    } catch (err: unknown) {
      console.error('Exam creation error:', err);
      setCreateError(
        (err as Error & { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail ||
          (err as Error)?.message ||
          'Failed to create exam.'
      );
      toast.error('Failed to create exam');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateExamClick = async () => {
    try {
      // Check if course has question banks
      const hasQuestionBanks = await validateCourseHasQuestionBanks(courseId);

      if (!hasQuestionBanks) {
        // Redirect to course detail with question banks tab and flag
        navigate(`/courses/${courseId}?fromExamCreation=true#question-banks`);
        return;
      }

      // If course has question banks, proceed to wizard
      navigate(`/exam-wizard?courseId=${courseId}`);
    } catch (error) {
      console.error('Error validating course question banks:', error);
      toast.error('Failed to validate course. Please try again.');
    }
  };

  // ─── delete exam ─────────────────
  const handleDeleteExam = async (examId: number) => {
    try {
      await examAPI.deleteExam(examId);
      setExams((prev) => prev.filter((e) => e.id !== examId));
      setFilteredExams((prev) => prev.filter((e) => e.id !== examId));
      toast.success('Exam deleted');
    } catch {
      toast.error('Failed to delete exam');
    }
  };

  // ─── submit changes from the card's modal ──────────────────
  const handleEditSubmit = async (
    id: number,
    data: {
      title: string;
      exam_type: string;
      time_limit: number;
      course: number;
      description?: string;
      weight: number;
      required_to_pass: boolean;
    }
  ) => {
    setEditLoading(true);
    setEditError(null);
    try {
      const updated = await examAPI.updateExam(id, data);
      setExams((prev) => prev.map((e) => (e.id === id ? updated : e)));
      setFilteredExams((prev) => prev.map((e) => (e.id === id ? updated : e)));
      toast.success('Exam updated');
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save changes.';
      setEditError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setEditLoading(false);
    }
  };

  return (
    <div className="w-full bg-card p-6 rounded-xl shadow-sm mb-10">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3 md:items-center w-full md:w-auto md:flex-1">
          <StandardDropdown
            options={sortOptions}
            value={sortBy}
            onChange={setSortBy}
          />
          <div className="w-full max-w-sm">
            <SearchBar
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search exams..."
            />
          </div>
        </div>
        <div className="flex gap-3 justify-end">
          <StandardButton
            icon={<FileText size={16} />}
            color="primary-btn"
            onClick={handleCreateExamClick}
          >
            Create New Exam
          </StandardButton>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && course && (
        <CreateExamModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateExam}
          courses={[course]}
          isLoading={isCreating}
          error={createError}
        />
      )}

      {/* Compare Popup - TODO: Implement later */}
      {/* {showComparePopup && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          ...
        </div>
      )} */}

      {/* Exams Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          Loading exams…
        </div>
      ) : filteredExams.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-gray-500">
          No exams found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredExams.map((exam) => (
            <ExamCard
              key={exam.id}
              exam={exam}
              courses={course ? [course] : []}
              onDelete={() => handleDeleteExam(exam.id)}
              onView={() => navigate(`/exam/${exam.id}`)}
              onSubmitEdit={handleEditSubmit}
              isEditingLoading={editLoading}
              editError={editError}
            />
          ))}
        </div>
      )}
    </div>
  );
};
