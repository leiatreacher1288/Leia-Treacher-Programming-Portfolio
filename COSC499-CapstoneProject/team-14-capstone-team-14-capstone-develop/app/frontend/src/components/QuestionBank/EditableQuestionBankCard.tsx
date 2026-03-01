import React from 'react';
import type { Question } from './types';

interface EditableQuestionBankCardProps {
  question: Question;
  onChange: (field: string, value: any) => void;
}

export const EditableQuestionBankCard: React.FC<
  EditableQuestionBankCardProps
> = ({ question, onChange }) => {
  const handleChoiceChange = (key: string, value: string) => {
    onChange('choices', { ...question.choices, [key]: value });
  };

  const handleCorrectAnswerToggle = (key: string, checked: boolean) => {
    let updatedAnswers = [...question.correct_answer];
    if (checked) {
      updatedAnswers.push(key);
    } else {
      updatedAnswers = updatedAnswers.filter((ans) => ans !== key);
    }
    onChange('correct_answer', updatedAnswers);
  };

  return (
    <div className="border rounded-lg p-4 bg-white shadow">
      {/* Prompt */}
      <label className="block font-semibold mb-1">Question Prompt:</label>
      <input
        className="w-full border p-1 mb-3 bg-white text-black"
        value={question.prompt}
        onChange={(e) => onChange('prompt', e.target.value)}
      />

      {/* Choices + Checkboxes for correct answers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        {['A', 'B', 'C', 'D', 'E'].map((key) => (
          <div key={key}>
            <label className="font-semibold">{key}:</label>
            <input
              value={question.choices[key] || ''}
              onChange={(e) => handleChoiceChange(key, e.target.value)}
              placeholder={`Option ${key}`}
              className="border p-1 w-full bg-white text-black mb-1"
            />

            {/* Checkbox to mark as correct */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={question.correct_answer.includes(key)}
                onChange={(e) =>
                  handleCorrectAnswerToggle(key, e.target.checked)
                }
              />
              Correct Answer
            </label>
          </div>
        ))}
      </div>

      {/* Difficulty */}
      <label className="block font-semibold mb-1">Difficulty:</label>
      <select
        className="w-full border p-1 mb-3 bg-white text-black"
        value={question.difficulty || 'Medium'}
        onChange={(e) => onChange('difficulty', e.target.value)}
      >
        <option value="Easy">Easy</option>
        <option value="Medium">Medium</option>
        <option value="Hard">Hard</option>
      </select>

      {/* Tags */}
      <label className="block font-semibold mb-1">
        Tags <span className="text-sm text-gray-500">(comma separated)</span>
      </label>
      <input
        className="w-full border p-1 mb-3 bg-white text-black"
        value={question.tags.join(',')}
        onChange={(e) =>
          onChange(
            'tags',
            e.target.value.split(',').map((tag) => tag.trim())
          )
        }
      />

      {/* Explanation */}
      <label className="block font-semibold mb-1">Explanation:</label>
      <textarea
        className="w-full border p-1 bg-white text-black"
        value={question.explanation}
        onChange={(e) => onChange('explanation', e.target.value)}
      />

      {question.is_duplicate && (
        <p className="text-red-500 text-sm mt-2">
          ⚠ Duplicate – This question will NOT be imported
        </p>
      )}
    </div>
  );
};
