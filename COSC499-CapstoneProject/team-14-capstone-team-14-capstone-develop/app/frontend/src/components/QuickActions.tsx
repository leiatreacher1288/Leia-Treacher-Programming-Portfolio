import { Plus, Upload, FileInput } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { StandardButton } from './ui/StandardButton';
import { SectionTitle } from './cards/SectionTitle';
import { SearchBar } from './ui/SearchBar';
import { CreateExamModal } from './CreateExamModal';
import { ImportQuestionsModal } from './QuestionBank/ImportQuestionsModal';
import ConfirmModal from './ui/ConfirmModal';
import { examAPI } from '../api/examAPI';
import { questionAPI } from '../api/questionAPI';
import type { Course } from '../types/course';

/* -------------------------------------------------------------------------- */
/* Typings                                                                     */
/* -------------------------------------------------------------------------- */
type Exam = {
  id: string | number;
  title: string;
  course?: number;
  courseId?: string | number;
};

interface QuickActionsProps {
  courses: Course[];
  exams: Exam[];
  onNavigate: (path: string) => void;
  onExamCreated?: (exam: Exam) => void; // notify parent when a new exam is made
}

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */
function formatTerm(term?: string): string {
  if (!term) return '';
  const [season, year] = term.split(' ');
  const readable =
    {
      W1: 'Winter Term 1',
      W2: 'Winter Term 2',
      S1: 'Summer Term 1',
      S2: 'Summer Term 2',
    }[season] ?? season;
  return `${year} | ${readable}`;
}

/* -------------------------------------------------------------------------- */
/* Component: QuickActions                                                     */
/* -------------------------------------------------------------------------- */
export function QuickActions({
  courses,
  exams,
  onNavigate,
  onExamCreated,
}: QuickActionsProps) {
  /* ──────────────────────── search state ─────────────────────── */
  const [search, setSearch] = useState('');
  const [showResults, setShowResults] = useState(false);

  /* ──────────────────────── create‑exam modal ────────────────── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  /* ──────────────────────── import / upload modal ────────────── */
  const [showImportModal, setShowImportModal] = useState(false);
  const [showImportQuestionsModal, setShowImportQuestionsModal] =
    useState(false);
  const [importType, setImportType] = useState<'questions' | 'results' | null>(
    null
  );
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedExam, setSelectedExam] = useState<number | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ──────────────────────── course exams state ──────────────── */
  const [courseExams, setCourseExams] = useState<Exam[]>([]);

  /* ──────────────────────── info dialog ─────────────────────── */
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  /* ──────────────────────── results import validation ───────── */
  const [showConfirmOverwrite, setShowConfirmOverwrite] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [pendingImportData, setPendingImportData] = useState<{
    examId: number;
    formData: FormData;
  } | null>(null);

  /* ------------------------------------------------------------------ */
  /* Effect: Load exams when course is selected for results upload      */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (importType === 'results' && selectedCourse) {
      examAPI
        .getExams(selectedCourse)
        .then((fetched) => {
          setCourseExams(fetched);
          setSelectedExam(null);
        })
        .catch(console.error);
    }
  }, [selectedCourse, importType]);

  /* ------------------------------------------------------------------ */
  /* Filtering helpers                                                   */
  /* ------------------------------------------------------------------ */
  const lcValue = search.toLowerCase().replace(/\s+/g, '');

  const filteredCourses = search
    ? courses.filter((c) => {
        const code = (c.code ?? '').toLowerCase();
        const title = (c.title ?? '').toLowerCase();
        const term = formatTerm(c.term).toLowerCase();
        const searchable = `${code} ${title} ${term}`.replace(/\s+/g, '');
        return searchable.includes(lcValue);
      })
    : [];

  const filteredExams = search
    ? exams.filter((e) => {
        const title = (e.title ?? '').toLowerCase();
        const courseId = e.course ?? e.courseId;
        const course = courses.find((c) => String(c.id) === String(courseId));

        const courseCode = (course?.code ?? '').toLowerCase();
        const courseTitle = (course?.title ?? '').toLowerCase();
        const courseTerm = formatTerm(course?.term).toLowerCase();

        const searchable =
          `${title} ${courseCode} ${courseTitle} ${courseTerm}`.replace(
            /\s+/g,
            ''
          );
        return searchable.includes(lcValue);
      })
    : [];

  /* ------------------------------------------------------------------ */
  /* Handlers: search                                                    */
  /* ------------------------------------------------------------------ */
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setShowResults(!!e.target.value);
  };

  const handleResultClick = (type: string, id: string | number) => {
    if (type === 'course') onNavigate(`/courses/${id}`);
    if (type === 'exam') onNavigate(`/exams/${id}`);
    setShowResults(false);
    setSearch('');
  };

  /* ------------------------------------------------------------------ */
  /* Handlers: create exam                                               */
  /* ------------------------------------------------------------------ */
  const handleCreateExamClick = async () => {
    if (courses.length === 0) {
      setInfoMessage('No courses available. Please create a course first.');
      return;
    }

    // For now, we'll redirect to the wizard. In the future, we can add course selection
    // and validation here
    onNavigate('/exam-wizard');
  };

  const handleCreateExam = async (examData: {
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
      const createdExam = await examAPI.createExam(examData);

      if (!createdExam || !createdExam.id) {
        setCreateError('No exam returned from server. Please try again.');
        setIsCreating(false);
        return;
      }

      /* update parent */
      if (onExamCreated) onExamCreated(createdExam);

      setShowCreateModal(false);
      setTimeout(() => onNavigate(`/exam/${createdExam.id}`), 50);
    } catch (err: unknown) {
      console.error('Exam creation error:', err);
      setCreateError(
        (err as Error & { response?: { data?: { detail?: string } } })?.response
          ?.data?.detail ||
          (err as Error)?.message ||
          'Failed to create exam.'
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setCreateError(null);
  };

  /* ------------------------------------------------------------------ */
  /* Handlers: import / upload                                           */
  /* ------------------------------------------------------------------ */
  const handleImportClick = (type: 'questions' | 'results') => {
    if (courses.length === 0) {
      setInfoMessage('No courses available. Please create a course first.');
      return;
    }

    if (type === 'questions') {
      setShowImportQuestionsModal(true);
    } else {
      setImportType(type);
      setShowImportModal(true);
      setImportError(null);
      setSelectedCourse(null);
      setSelectedExam(null);
      setSelectedFile(null);
      setCourseExams([]);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      'text/csv',
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];

    const allowedExtensions = ['.csv', '.pdf', '.txt', '.docx', '.doc'];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf('.'));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      setImportError(
        'Invalid file format. Please select a CSV, PDF, TXT, or DOCX file.'
      );
      return;
    }

    setSelectedFile(file);
    setImportError(null);
  };

  const handleImportSubmit = async () => {
    if (!selectedFile || !selectedCourse) {
      setImportError('Please select both a file and a course.');
      return;
    }

    // For results upload, also need an exam
    if (importType === 'results' && !selectedExam) {
      setImportError('Please select an exam to upload results to.');
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      // Importing Questions
      if (importType === 'questions') {
        let banks = await questionAPI.getQuestionBanksByCourse(selectedCourse);
        if (banks.length === 0) {
          const course = courses.find((c) => c.id === selectedCourse)!;
          const newBank = await questionAPI.createQuestionBank({
            courseId: selectedCourse,
            title: `${course.code} - Default Question Bank`,
            description: `Default question bank for ${course.code}`,
          });
          banks = [newBank];
        }
        await questionAPI.uploadQuestionsFile(
          selectedFile,
          banks[0].id,
          selectedCourse
        );
        setInfoMessage('Questions imported successfully!');
      }

      // Uploading Results
      else if (importType === 'results' && selectedExam) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('format', 'csv');

        // First, validate the import to check for locked variants and existing results
        try {
          const validationResponse = await examAPI.validateResultsImport(
            selectedExam,
            formData
          );

          if (!validationResponse.valid) {
            // Check if it's a "no locked variants" error
            const noLockedVariantsError = validationResponse.errors?.find(
              (error: any) => error.type === 'no_locked_variants'
            );

            if (noLockedVariantsError) {
              setImportError(
                'No locked variants found for this exam. Please lock a variant set before importing results.'
              );
            } else {
              setImportError(
                `Validation failed: ${validationResponse.errors?.[0]?.message || 'Unknown error'}`
              );
            }
            return;
          }

          // Check if there are existing results that would be overwritten
          const hasExistingResults = validationResponse.warnings?.some(
            (warning: any) => warning.type === 'duplicate_result'
          );

          if (hasExistingResults) {
            // Store the data for confirmation
            setPendingImportData({ examId: selectedExam, formData });
            setValidationResult(validationResponse);
            setShowConfirmOverwrite(true);
            return;
          }

          // No existing results, proceed with import
          await performResultsImport(selectedExam, formData);
        } catch (error: any) {
          console.error('Results import validation error:', error);
          setImportError(
            error.response?.data?.error ||
              error.message ||
              'Failed to validate results import'
          );
        }
      }

      handleCloseImportModal();
    } catch (err) {
      console.error('Import/Upload failed:', err);
      setImportError(
        (err as Error)?.message ||
          `Failed to ${importType === 'questions' ? 'import questions' : 'upload results'}.`
      );
    } finally {
      setIsImporting(false);
    }
  };

  const performResultsImport = async (examId: number, formData: FormData) => {
    try {
      const result = await examAPI.importResults(examId, formData);

      if (result.status === 'completed') {
        setInfoMessage(
          `Results uploaded successfully! ${result.imported} records imported.`
        );

        // Redirect to exam detail page
        setTimeout(() => {
          onNavigate(`/exam/${examId}`);
        }, 1000);
      } else {
        setImportError(`Import failed: ${result.status || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Results import error:', error);
      setImportError(
        error.response?.data?.error ||
          error.message ||
          'Failed to import results'
      );
    }
  };

  const handleConfirmOverwrite = async () => {
    if (!pendingImportData) return;

    setIsImporting(true);
    try {
      await performResultsImport(
        pendingImportData.examId,
        pendingImportData.formData
      );
      setShowConfirmOverwrite(false);
      setPendingImportData(null);
      setValidationResult(null);
      handleCloseImportModal();
    } catch (error: any) {
      console.error('Results import error:', error);
      setImportError(
        error.response?.data?.error ||
          error.message ||
          'Failed to import results'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCancelOverwrite = () => {
    setShowConfirmOverwrite(false);
    setPendingImportData(null);
    setValidationResult(null);
  };

  const handleCloseImportModal = () => {
    setShowImportModal(false);
    setImportType(null);
    setSelectedCourse(null);
    setSelectedExam(null);
    setSelectedFile(null);
    setImportError(null);
    setCourseExams([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleImportQuestionsSubmit = async (data: {
    courseId: number;
    questionBankId: number;
    files: File[];
  }) => {
    try {
      // Import each file to the selected question bank
      for (const file of data.files) {
        await questionAPI.uploadQuestionsFile(
          file,
          data.questionBankId,
          data.courseId
        );
      }
      setInfoMessage(
        `Successfully imported ${data.files.length} file(s) to the question bank!`
      );
      setShowImportQuestionsModal(false);
    } catch (error) {
      console.error('Failed to import questions:', error);
      setInfoMessage('Failed to import questions. Please try again.');
    }
  };

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */
  return (
    <section className="bg-card rounded-xl p-6 shadow-sm mb-10">
      <SectionTitle icon={<Plus />} title="Quick Actions" />

      {/* buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <StandardButton
          icon={<Plus size={16} />}
          onClick={handleCreateExamClick}
        >
          Create Exam
        </StandardButton>
        <StandardButton
          icon={<FileInput size={16} />}
          onClick={() => handleImportClick('questions')}
        >
          Import Questions
        </StandardButton>
        <StandardButton
          icon={<Upload size={16} />}
          onClick={() => handleImportClick('results')}
        >
          Upload Results
        </StandardButton>
      </div>

      {/* search bar & dropdown */}
      <div className="w-full relative">
        <SearchBar
          placeholder="Search courses, exams..."
          value={search}
          onChange={handleSearch}
        />

        {showResults &&
          (filteredCourses.length > 0 || filteredExams.length > 0) && (
            <div className="absolute z-10 bg-white border rounded shadow w-full mt-1 max-h-64 overflow-auto">
              {/* courses */}
              {filteredCourses.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 font-bold text-xs text-gray-600">
                    Courses
                  </div>
                  <ul>
                    {filteredCourses.map((course) => {
                      const hasValidCode =
                        course.code &&
                        course.code.trim().toUpperCase() !== 'N/A';
                      return (
                        <li
                          key={`course-${course.id}`}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => handleResultClick('course', course.id)}
                        >
                          <span className="font-medium">
                            {hasValidCode
                              ? `${course.code} – ${course.title}`
                              : course.title}
                          </span>
                          <span className="ml-2 text-xs text-gray-400">
                            {formatTerm(course.term)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}

              {/* exams */}
              {filteredExams.length > 0 && (
                <div>
                  <div className="px-3 pt-2 pb-1 font-bold text-xs text-gray-600">
                    Exams
                  </div>
                  <ul>
                    {filteredExams.map((exam) => {
                      const courseId = exam.course ?? exam.courseId;
                      const course = courses.find(
                        (c) => String(c.id) === String(courseId)
                      );

                      let year = '';
                      let semester = '';
                      if (course?.term) {
                        const [season, yr] = course.term.split(' ');
                        year = yr;
                        semester =
                          {
                            W1: 'Winter Term 1',
                            W2: 'Winter Term 2',
                            S1: 'Summer Term 1',
                            S2: 'Summer Term 2',
                          }[season] ?? season;
                      }

                      return (
                        <li
                          key={`exam-${exam.id}`}
                          className="px-3 py-2 cursor-pointer hover:bg-gray-100 text-sm"
                          onClick={() => handleResultClick('exam', exam.id)}
                        >
                          <span className="font-medium">{exam.title}</span>
                          {course && (
                            <span className="ml-2 text-xs text-gray-500">
                              | {course.code} – {course.title}
                              {year && ` | ${year}`}
                              {semester && ` | ${semester}`}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
            </div>
          )}
      </div>

      {/* create‑exam modal */}
      {showCreateModal && (
        <CreateExamModal
          isOpen={showCreateModal}
          onClose={handleCloseModal}
          onSubmit={handleCreateExam}
          courses={courses}
          isLoading={isCreating}
          error={createError}
        />
      )}

      {/* import / upload modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-md mx-4 border border-input-border">
            <h2 className="text-xl font-bold text-heading mb-4">
              {importType === 'questions'
                ? 'Import Questions'
                : 'Upload Results'}
            </h2>

            {/* validation error */}
            {importError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                {importError}
              </div>
            )}

            {/* course dropdown */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Course
              </label>
              <select
                value={selectedCourse ?? ''}
                onChange={(e) => setSelectedCourse(Number(e.target.value))}
                className="w-full px-4 py-3 border border-input-border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
              >
                <option value="">Choose a course...</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code && c.code.trim().toUpperCase() !== 'N/A'
                      ? `${c.code} – ${c.title}`
                      : c.title}
                    {c.term && ` | ${formatTerm(c.term)}`}
                  </option>
                ))}
              </select>
            </div>

            {/* exam dropdown - only for results upload */}
            {importType === 'results' && selectedCourse && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Exam
                </label>
                <select
                  value={selectedExam ?? ''}
                  onChange={(e) => setSelectedExam(Number(e.target.value))}
                  className="w-full px-4 py-3 border border-input-border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-primary-btn"
                  disabled={courseExams.length === 0}
                >
                  <option value="">
                    {courseExams.length === 0
                      ? 'No exams found for this course'
                      : 'Choose an exam...'}
                  </option>
                  {courseExams.map((exam) => (
                    <option key={exam.id} value={exam.id}>
                      {exam.title}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* file picker */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select File (CSV, TXT)
              </label>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.pdf,.txt,.docx,.doc"
                onChange={handleFileSelect}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {selectedFile && (
                <p className="mt-2 text-sm text-gray-600">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* action buttons */}
            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={handleCloseImportModal}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={
                  !selectedFile ||
                  !selectedCourse ||
                  (importType === 'results' && !selectedExam) ||
                  isImporting
                }
                className="px-4 py-2 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? 'Processing...' : 'Import'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Questions Modal */}
      <ImportQuestionsModal
        isOpen={showImportQuestionsModal}
        onClose={() => setShowImportQuestionsModal(false)}
        onSubmit={handleImportQuestionsSubmit}
      />

      {/* Confirm Overwrite Modal */}
      {showConfirmOverwrite && (
        <ConfirmModal
          open={showConfirmOverwrite}
          onCancel={handleCancelOverwrite}
          onConfirm={handleConfirmOverwrite}
          title="Overwrite Existing Results"
          description={`This will overwrite ${validationResult?.warnings?.filter((w: any) => w.type === 'duplicate_result').length || 0} existing result(s). Are you sure you want to continue?`}
          confirmText="Overwrite"
          cancelText="Cancel"
          loading={isImporting}
          variant="warning"
          icon="warning"
        />
      )}

      {/* single‑button info dialog */}
      {infoMessage && (
        <InfoModal message={infoMessage} onClose={() => setInfoMessage(null)} />
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/* Small reusable OK‑dialog                                                   */
/* -------------------------------------------------------------------------- */
interface InfoModalProps {
  message: string;
  onClose: () => void;
}

// src/components/QuickActions.tsx
interface InfoModalProps {
  message: string;
  onClose: () => void;
}

const InfoModal: React.FC<InfoModalProps> = ({ message, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/50"
      aria-label="Close overlay"
      onClick={onClose}
    />
    <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
      <p className="text-gray-900 mb-6">{message}</p>
      <button
        onClick={onClose}
        className="w-full px-4 py-2 bg-primary-btn text-white rounded-lg hover:bg-primary-btn-hover focus:outline-none"
      >
        OK
      </button>
    </div>
  </div>
);
