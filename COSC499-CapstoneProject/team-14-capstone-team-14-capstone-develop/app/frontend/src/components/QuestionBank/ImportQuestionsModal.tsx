import React, { useState, useEffect } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { X, Upload, ChevronDown } from 'lucide-react';
import { questionAPI, type QuestionBank } from '../../api/questionAPI';
import { courseAPI, type Course } from '../../api/courseAPI';
import { CreateQuestionBankModal } from './CreateQuestionBankModal';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    courseId: number;
    questionBankId: number;
    files: File[];
  }) => Promise<void>;
  // Auto-population props
  defaultCourseId?: number;
  defaultQuestionBankId?: number;
  showCourseSelector?: boolean; // If false, course is auto-selected and hidden
  hideCreateBankButton?: boolean; // If true, hide the create new bank button
  readOnlyQuestionBank?: boolean; // If true, question bank field is read-only and non-changeable
}

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultCourseId,
  defaultQuestionBankId,
  showCourseSelector = true, // Default to showing course selector
  hideCreateBankButton = false, // Default to showing create bank button
  readOnlyQuestionBank = false, // Default to allowing question bank selection
}) => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedQuestionBank, setSelectedQuestionBank] =
    useState<QuestionBank | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showCreateBankModal, setShowCreateBankModal] = useState(false);
  const [newBankData, setNewBankData] = useState<{
    title: string;
    description: string;
    courseId: number;
  } | null>(null);

  // Load courses on mount
  useEffect(() => {
    if (isOpen) {
      loadCourses();
    }
  }, [isOpen]);

  // Set default course and question bank when props change
  useEffect(() => {
    if (defaultCourseId && courses.length > 0) {
      const defaultCourse = courses.find(
        (course) => course.id === defaultCourseId
      );
      if (defaultCourse) {
        setSelectedCourse(defaultCourse);
        loadQuestionBanks(defaultCourse.id);
      }
    }
  }, [defaultCourseId, courses]);

  useEffect(() => {
    if (defaultQuestionBankId && questionBanks.length > 0) {
      const defaultBank = questionBanks.find(
        (bank) => bank.id === defaultQuestionBankId
      );
      if (defaultBank) {
        setSelectedQuestionBank(defaultBank);
      }
    }
  }, [defaultQuestionBankId, questionBanks]);

  const loadCourses = async () => {
    try {
      const coursesData = await courseAPI.getCourses();
      setCourses(coursesData);
    } catch (err) {
      console.error('Failed to load courses:', err);
    }
  };

  const loadQuestionBanks = async (courseId: number) => {
    try {
      const banks = await questionAPI.getQuestionBanksByCourse(courseId);
      setQuestionBanks(banks);
    } catch (err) {
      console.error('Failed to load question banks:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    // Validate file count
    if (selectedFiles.length + files.length > 5) {
      setErrors({ files: 'Maximum 5 files allowed' });
      return;
    }

    // Validate file sizes
    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = files.filter((file) => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      setErrors({ files: 'Some files exceed 10MB limit' });
      return;
    }

    setSelectedFiles((prev) => [...prev, ...files]);
    setErrors({});
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateQuestionBank = async (data: {
    title: string;
    description: string;
    courseId: number;
  }) => {
    try {
      const newBank = await questionAPI.createQuestionBank({
        courseId: data.courseId,
        title: data.title,
        description: data.description,
      });

      // Add the new bank to the list and select it
      setQuestionBanks((prev) => [newBank, ...prev]);
      setSelectedQuestionBank(newBank);
      setShowCreateBankModal(false);
      setNewBankData(null);
    } catch (err) {
      console.error('Failed to create question bank:', err);
      setErrors({
        submit: 'Failed to create question bank. Please try again.',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!selectedCourse) {
      newErrors.course = 'Please select a course.';
    }

    if (!selectedQuestionBank) {
      newErrors.questionBank = 'Please select a question bank.';
    }

    if (selectedFiles.length === 0) {
      newErrors.files = 'Please select at least one file.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        courseId: selectedCourse!.id,
        questionBankId: selectedQuestionBank!.id,
        files: selectedFiles,
      });
    } catch (error) {
      console.error('Import failed:', error);
      setErrors({ submit: 'Import failed. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedFiles([]);
    setErrors({});
    setSelectedCourse(null);
    setSelectedQuestionBank(null);
    setShowCreateBankModal(false);
    setNewBankData(null);
    onClose();
  };

  const handleCreateNewBank = () => {
    if (!selectedCourse) {
      setErrors({ course: 'Please select a course first.' });
      return;
    }

    // Generate a better default name for the new bank
    const courseCode = selectedCourse.code;
    const term = selectedCourse.term || 'Current Term';
    const existingBanksCount = questionBanks.length;
    const bankNumber = existingBanksCount + 1;

    const defaultTitle = `${courseCode} - ${term} QB #${bankNumber}`;
    const defaultDescription = `Question bank for ${courseCode} - ${term}`;

    setNewBankData({
      title: defaultTitle,
      description: defaultDescription,
      courseId: selectedCourse.id,
    });
    setShowCreateBankModal(true);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-8 relative animate-fade-in">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>

          <h2 className="text-2xl font-bold mb-6 text-heading">
            Import Questions
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Course Selection */}
            {showCourseSelector && (
              <div>
                <label className="block text-sm font-semibold mb-2 text-heading">
                  Course <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedCourse?.id || ''}
                  onChange={(e) => {
                    const courseId = Number(e.target.value);
                    const course = courses.find((c) => c.id === courseId);
                    setSelectedCourse(course || null);
                    setSelectedQuestionBank(null);
                    if (course) {
                      loadQuestionBanks(course.id);
                    }
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn bg-white"
                  required
                >
                  <option value="">Select a course...</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.title}
                    </option>
                  ))}
                </select>
                {errors.course && (
                  <p className="text-red-600 text-sm mt-1">{errors.course}</p>
                )}
              </div>
            )}

            {/* Question Bank Selection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-semibold text-heading">
                  Question Bank <span className="text-red-500">*</span>
                </label>
                {selectedCourse &&
                  !hideCreateBankButton &&
                  !readOnlyQuestionBank && (
                    <button
                      type="button"
                      onClick={handleCreateNewBank}
                      className="text-primary-btn hover:text-primary-btn-dark text-sm font-medium"
                    >
                      + Create New Bank
                    </button>
                  )}
              </div>
              {readOnlyQuestionBank && selectedQuestionBank ? (
                <div className="w-full px-4 py-3 rounded-lg border border-gray-300 bg-gray-50 text-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedQuestionBank.title}
                    </span>
                    <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                      Current Bank
                    </span>
                  </div>
                </div>
              ) : (
                <select
                  value={selectedQuestionBank?.id || ''}
                  onChange={(e) => {
                    const bankId = Number(e.target.value);
                    const bank = questionBanks.find((b) => b.id === bankId);
                    setSelectedQuestionBank(bank || null);
                  }}
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:border-primary-btn focus:ring-1 focus:ring-primary-btn bg-white"
                  required
                  disabled={!selectedCourse}
                >
                  <option value="">
                    {selectedCourse
                      ? 'Select a question bank...'
                      : 'Select a course first...'}
                  </option>
                  {questionBanks.map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.title}
                    </option>
                  ))}
                </select>
              )}
              {errors.questionBank && (
                <p className="text-red-600 text-sm mt-1">
                  {errors.questionBank}
                </p>
              )}
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold mb-2 text-heading">
                Files to Import <span className="text-red-500">*</span>
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-btn transition-colors">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <input
                  type="file"
                  multiple
                  accept=".csv,.pdf,.txt,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,application/msword"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-primary-btn hover:text-primary-btn-dark font-medium"
                >
                  Choose files
                </label>
                <p className="text-sm text-gray-500 mt-2">
                  or drag and drop CSV, PDF, TXT, DOCX, or DOC files
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Maximum 5 files, up to 10MB each
                </p>
              </div>

              {/* Selected Files List */}
              {selectedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-sm font-medium text-heading">
                    Selected Files:
                  </h4>
                  {selectedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Upload size={16} className="text-gray-400" />
                        <span className="text-sm font-medium">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {errors.files && (
                <p className="text-red-600 text-sm mt-1">{errors.files}</p>
              )}
            </div>

            {/* Error Messages */}
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <StandardButton
                type="button"
                color="secondary-btn"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </StandardButton>
              <StandardButton
                type="submit"
                color="primary-btn"
                disabled={
                  isSubmitting ||
                  !selectedCourse ||
                  !selectedQuestionBank ||
                  selectedFiles.length === 0
                }
              >
                {isSubmitting ? 'Importing...' : 'Import Questions'}
              </StandardButton>
            </div>
          </form>
        </div>
      </div>

      {/* Create Question Bank Modal */}
      {showCreateBankModal && newBankData && (
        <CreateQuestionBankModal
          isOpen={showCreateBankModal}
          onClose={() => setShowCreateBankModal(false)}
          onSubmit={handleCreateQuestionBank}
          title="Create New Question Bank"
          courses={courses}
          initialData={newBankData}
        />
      )}
    </>
  );
};
