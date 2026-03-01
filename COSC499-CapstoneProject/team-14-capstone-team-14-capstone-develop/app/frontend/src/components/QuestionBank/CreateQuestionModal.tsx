import React, { useState, useEffect } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { DifficultySelector } from '../ui/DifficultySelector';
import { CustomCloseButton } from '../ui/CustomCloseButton';
import { CourseInfoCard } from '../ui/CourseInfoCard';
import type { Course } from '../../api/courseAPI';
import { FiRepeat } from 'react-icons/fi';
import { FiX } from 'react-icons/fi';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (data: {
    prompt: string;
    choices: Record<string, string>;
    correct_answer: string[];
    difficulty?: number | undefined;
    tags: string[];
    explanation: string;
    course_id: number;
  }) => Promise<void>;
  examId?: number;
  courses: Course[];
  defaultCourse?: number;
  defaultDifficulty?: string;
  defaultTags?: string[];
  hideCoursePicker?: boolean;
  hideExplanation?: boolean;
  initialValues?: {
    prompt?: string;
    choices?: Record<string, string>;
    correct_answer?: string[];
    difficulty?: number | string;
    tags?: string[];
    explanation?: string;
    course_id?: number;
  };
}

export const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  courses = [],
  defaultCourse,
  defaultDifficulty,
  defaultTags,
  hideCoursePicker = false,
  hideExplanation = false,
  initialValues,
}) => {
  const [course_id, setCourseId] = useState<number | ''>(defaultCourse || '');
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<{ [key: string]: string }>({
    A: '',
    B: '',
    C: '',
    D: '',
  });
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState(defaultDifficulty || '');
  const [tags, setTags] = useState<string[]>(defaultTags || []);
  const [tagInput, setTagInput] = useState('');
  const [explanation, setExplanation] = useState('');
  const [createAnother, setCreateAnother] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isOpen) {
      let diff = '';
      // Handle both string labels and numeric strings
      if (typeof initialValues?.difficulty === 'string') {
        if (
          initialValues.difficulty === 'Easy' ||
          initialValues.difficulty === '1'
        )
          diff = '1';
        else if (
          initialValues.difficulty === 'Medium' ||
          initialValues.difficulty === '2'
        )
          diff = '2';
        else if (
          initialValues.difficulty === 'Hard' ||
          initialValues.difficulty === '3'
        )
          diff = '3';
        else if (['1', '2', '3'].includes(initialValues.difficulty))
          diff = initialValues.difficulty;
      } else if (typeof initialValues?.difficulty === 'number') {
        diff = String(initialValues.difficulty);
      }

      setPrompt(initialValues?.prompt ?? '');
      setOptions(initialValues?.choices ?? { A: '', B: '', C: '', D: '' });
      setCorrectAnswers(initialValues?.correct_answer ?? []);
      setDifficulty(diff || defaultDifficulty || '');
      setTags(initialValues?.tags ?? defaultTags ?? []);
      setExplanation(initialValues?.explanation ?? '');
      setCourseId(initialValues?.course_id ?? defaultCourse ?? '');
      setCreateAnother(false);
    }
  }, [isOpen, initialValues, defaultCourse, defaultDifficulty, defaultTags]);

  // Auto-select course if only one is available
  useEffect(() => {
    if (courses.length === 1 && !course_id) {
      setCourseId(courses[0].id);
    }
  }, [courses, course_id]);

  const handleOptionChange = (key: string, value: string) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleCorrectAnswerToggle = (key: string) => {
    setCorrectAnswers((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const handleAddTag = () => {
    const newTag = tagInput.trim();
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: { [key: string]: string } = {};

    if (!hideCoursePicker && !course_id) {
      newErrors.course_id = 'Please select a course.';
    }

    if (!prompt.trim()) {
      newErrors.prompt = 'Question content is required.';
    }

    const filledOptions = Object.entries(options).filter(
      ([, v]) => v.trim() !== ''
    );

    // UPDATED: Changed from 4 to 2 minimum options
    if (filledOptions.length < 2) {
      newErrors.options = 'At least 2 options are required.';
    }

    if (correctAnswers.length < 1) {
      newErrors.correctAnswers = 'Select at least one correct answer.';
    }

    // Check that all selected correct answers have text
    const invalidCorrectAnswers = correctAnswers.filter(
      (key) => !options[key] || options[key].trim() === ''
    );

    if (invalidCorrectAnswers.length > 0) {
      newErrors.correctAnswers = 'All selected correct answers must have text.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Prepare data
    const choices: { [key: string]: string } = {};
    Object.entries(options).forEach(([k, v]) => {
      if (v.trim() !== '') choices[k] = v;
    });

    console.log('SUBMIT DEBUG: difficulty', difficulty, typeof difficulty);
    // Call onCreate with the expected signature
    await onCreate({
      prompt,
      choices,
      correct_answer: correctAnswers,
      difficulty: difficulty ? parseInt(difficulty) : undefined, // Send undefined if unset
      tags,
      explanation: hideExplanation ? '' : explanation,
      course_id:
        typeof course_id === 'number'
          ? course_id
          : initialValues?.course_id || courses[0]?.id || 0,
    });

    if (!createAnother) {
      onClose();
    } else {
      // Reset form fields but keep sticky data (course, difficulty, tags)
      setPrompt('');
      setOptions({ A: '', B: '', C: '', D: '' });
      setCorrectAnswers([]);
      setExplanation('');
      setTagInput('');
      setErrors({});
      // Keep course, difficulty, tags unchanged
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 relative animate-fade-in max-h-[90vh] overflow-y-auto border border-gray-200">
        <CustomCloseButton
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-100 rounded-full transition-colors"
        />

        <h2 className="text-2xl font-bold mb-8 text-gray-900 tracking-tight">
          {initialValues ? 'Edit Question' : 'Create New Question'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Course */}
          {!hideCoursePicker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {courses.length === 1 ? 'Course' : 'Course *'}
              </label>
              {courses.length === 1 && courses[0] ? (
                <CourseInfoCard
                  course={{
                    code: courses[0].code || '',
                    title: courses[0].title,
                    term: courses[0].term || '',
                  }}
                />
              ) : (
                <select
                  value={course_id}
                  onChange={(e) => setCourseId(Number(e.target.value))}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent text-sm transition-all ${
                    courses.length === 1
                      ? 'border-secondary-blue bg-secondary-blue/10 cursor-not-allowed'
                      : 'border-gray-300 bg-white hover:border-primary-btn'
                  }`}
                  required
                  disabled={courses.length === 1}
                >
                  <option value="">Select a course</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code ? `${c.code} - ` : ''}
                      {c.title}
                      {c.term ? ` (${c.term})` : ''}
                    </option>
                  ))}
                </select>
              )}
              {errors.course_id && (
                <p className="text-red-600 text-xs mt-1">{errors.course_id}</p>
              )}
            </div>
          )}

          {/* Question Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Content <span className="text-red-500">*</span>
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent text-sm bg-white min-h-[80px] transition-all"
              required
            />
            {errors.prompt && (
              <p className="text-red-600 text-xs mt-1">{errors.prompt}</p>
            )}
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'E'].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <CustomCheckbox
                    checked={correctAnswers.includes(key)}
                    onChange={() => handleCorrectAnswerToggle(key)}
                    disabled={!options[key]}
                    className="flex-shrink-0"
                  >
                    <span className="text-sm font-medium text-gray-600 w-6">
                      {key}
                    </span>
                  </CustomCheckbox>
                  <input
                    type="text"
                    value={options[key] || ''}
                    onChange={(e) => handleOptionChange(key, e.target.value)}
                    placeholder={`Option ${key}`}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent bg-white transition-all"
                  />
                </div>
              ))}
            </div>
            {errors.options && (
              <p className="text-red-600 text-xs mt-1">{errors.options}</p>
            )}
            {errors.correctAnswers && (
              <p className="text-red-600 text-xs mt-1">
                {errors.correctAnswers}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              At least 2 options required. Check all correct answers.
            </p>
          </div>

          {/* Difficulty */}
          <DifficultySelector value={difficulty} onChange={setDifficulty} />

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (optional)
            </label>
            <div className="flex flex-wrap gap-2 mb-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs flex items-center gap-2 border border-purple-200"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-purple-400 hover:text-purple-700 transition-colors p-0.5 ml-1"
                  >
                    <FiX size={8} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag and press Enter"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent bg-white transition-all"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary-btn text-white rounded-lg text-sm font-medium hover:bg-primary-btn/90 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Explanation */}
          {!hideExplanation && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Explanation (optional)
              </label>
              <textarea
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-btn focus:border-transparent text-sm bg-white min-h-[60px] transition-all"
              />
              <p className="text-xs text-gray-400 mt-1">
                This field is for your own reference. It will not appear on the
                exam.
              </p>
            </div>
          )}

          {/* Only show create another checkbox in create mode */}
          {!initialValues && (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <FiRepeat className="text-purple-500 w-4 h-4" />
              <CustomCheckbox
                checked={createAnother}
                onChange={(checked) => setCreateAnother(checked)}
              />
              <span className="text-sm text-gray-700">
                Create another after this
              </span>
            </label>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <StandardButton type="submit" color="primary-btn">
              {initialValues ? 'Save' : 'Create Question'}
            </StandardButton>
          </div>
        </form>
      </div>
    </div>
  );
};
