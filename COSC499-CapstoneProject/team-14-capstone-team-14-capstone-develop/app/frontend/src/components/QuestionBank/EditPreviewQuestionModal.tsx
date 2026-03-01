import React, { useState, useEffect } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { CustomCheckbox } from '../ui/CustomCheckbox';
import { DifficultySelector } from '../ui/DifficultySelector';
import { CustomCloseButton } from '../ui/CustomCloseButton';
import { FiX } from 'react-icons/fi';
import type { Question } from './types';

interface EditPreviewQuestionModalProps {
  show: boolean;
  onClose: () => void;
  initialValues: Question;
  onSave: (data: Question) => void;
}

export const EditPreviewQuestionModal: React.FC<
  EditPreviewQuestionModalProps
> = ({ show, onClose, initialValues, onSave }) => {
  const [prompt, setPrompt] = useState('');
  const [options, setOptions] = useState<Record<string, string>>({
    A: '',
    B: '',
    C: '',
    D: '',
    E: '',
  });
  const [correctAnswers, setCorrectAnswers] = useState<string[]>([]);
  const [difficulty, setDifficulty] = useState('Medium');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [explanation, setExplanation] = useState('');

  useEffect(() => {
    if (show) {
      setPrompt(initialValues.prompt || '');
      setOptions(
        initialValues.choices || { A: '', B: '', C: '', D: '', E: '' }
      );
      setCorrectAnswers(initialValues.correct_answer || []);
      setDifficulty(initialValues.difficulty || 'Medium');
      setTags(initialValues.tags || []);
      setExplanation(initialValues.explanation || '');
    }
  }, [show, initialValues]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const filledOptions = Object.entries(options).filter(
      ([, v]) => v.trim() !== ''
    );

    // Basic validation
    if (!prompt.trim()) {
      alert('Question content is required.');
      return;
    }

    // UPDATED: Changed from 4 to 2 minimum options
    if (filledOptions.length < 2) {
      alert('At least 2 options are required.');
      return;
    }

    if (correctAnswers.length < 1) {
      alert('Select at least one correct answer.');
      return;
    }

    // Check that all selected correct answers have text
    const invalidCorrectAnswers = correctAnswers.filter(
      (key) => !options[key] || options[key].trim() === ''
    );

    if (invalidCorrectAnswers.length > 0) {
      alert('All selected correct answers must have text.');
      return;
    }

    const choices: Record<string, string> = {};
    Object.entries(options).forEach(([k, v]) => {
      if (v.trim() !== '') choices[k] = v;
    });

    // Preserve ID and other fields from initialValues
    onSave({
      ...initialValues,
      prompt,
      choices,
      correct_answer: correctAnswers,
      difficulty: difficulty as Question['difficulty'],
      tags,
      explanation,
    });
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl p-10 relative max-h-[90vh] overflow-y-auto border border-gray-200">
        <CustomCloseButton
          onClick={onClose}
          className="absolute top-4 right-4 hover:bg-gray-100 rounded-full"
        />

        <h2 className="text-2xl font-bold mb-8 text-gray-900">
          Edit Question (Preview)
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Content
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
            />
          </div>

          {/* Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Options
            </label>
            <div className="space-y-3">
              {['A', 'B', 'C', 'D', 'E'].map((key) => (
                <div key={key} className="flex items-center gap-3">
                  <CustomCheckbox
                    checked={correctAnswers.includes(key)}
                    onChange={() => handleCorrectAnswerToggle(key)}
                    disabled={!options[key]}
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
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-black focus:outline-none"
                  />
                </div>
              ))}
            </div>
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
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-white text-black"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2 bg-primary-btn text-white rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Explanation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Explanation (optional)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-black"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-8">
            <StandardButton
              type="button"
              onClick={onClose}
              className="bg-gray-400"
            >
              Cancel
            </StandardButton>
            <StandardButton type="submit" color="primary-btn">
              Save
            </StandardButton>
          </div>
        </form>
      </div>
    </div>
  );
};
