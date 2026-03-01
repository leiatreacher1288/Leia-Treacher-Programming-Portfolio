import React, { useState } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { QuestionBankCard } from './QuestionBankCard';
import { EditPreviewQuestionModal } from './EditPreviewQuestionModal';
import type { Question } from './types';
import { questionAPI } from '../../api/questionAPI';

interface Props {
  questions: Question[];
  onClose: () => void;
  onImport: (finalQuestions: Question[]) => void;
}

export const PreviewImportModal: React.FC<Props> = ({
  questions,
  onClose,
  onImport,
}) => {
  const [editableQuestions, setEditableQuestions] =
    useState<Question[]>(questions);
  const [editIndex, setEditIndex] = useState<number | null>(null);

  const handleDelete = (index: number) => {
    setEditableQuestions((prev) => prev.filter((_, i) => i !== index));
  };

  // ✅ FIXED: Pass prompt as argument instead of reading from stale state
  const handleDuplicateCheck = async (prompt: string, index: number) => {
    try {
      const allQuestions = await questionAPI.getQuestions();
      const promptExists = allQuestions.some(
        (existing) =>
          existing.prompt.trim().toLowerCase() === prompt.trim().toLowerCase()
      );

      setEditableQuestions((prev) => {
        const updated = [...prev];
        updated[index] = { ...updated[index], is_duplicate: promptExists };
        return updated;
      });
    } catch (err) {
      console.error('Failed to check duplicates', err);
    }
  };

  // ✅ FIXED: Trigger duplicate check with updated prompt
  const handleSaveEdit = (updatedQuestion: Question) => {
    if (editIndex === null) return;

    const indexToUpdate = editIndex;

    setEditableQuestions((prev) => {
      const updated = [...prev];
      updated[indexToUpdate] = { ...updatedQuestion };
      return updated;
    });

    handleDuplicateCheck(updatedQuestion.prompt, indexToUpdate);

    setEditIndex(null);
  };

  const getValidationErrors = (q: Question): string[] => {
    const errors: string[] = [];
    const nonEmptyChoices = Object.values(q.choices || {}).filter(
      (val) => val && val.trim() !== ''
    ).length;

    if (q.prompt.trim() === '') errors.push('Missing question prompt.');

    // UPDATED: Changed from 4 to 2 minimum options
    if (nonEmptyChoices < 2)
      errors.push('Must provide at least 2 answer options.');

    if (q.correct_answer.length < 1)
      errors.push('Must select at least 1 correct answer.');

    return errors;
  };

  const questionsWithIssues = editableQuestions.filter(
    (q) => q.is_duplicate || getValidationErrors(q).length > 0
  ).length;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[9999]">
      <div className="bg-white p-4 rounded-lg w-[1100px] max-h-[90vh] overflow-auto">
        <h2 className="text-xl font-bold mb-4">Preview Imported Questions</h2>

        {questionsWithIssues > 0 && (
          <div className="text-red-600 font-semibold mb-4">
            ⚠ {questionsWithIssues} question
            {questionsWithIssues > 1 ? 's have' : ' has'} issues and will not be
            imported.
          </div>
        )}

        {editableQuestions.map((q, index) => {
          const errors = getValidationErrors(q);

          return (
            <div
              key={index}
              className="border rounded-lg p-4 mb-4 bg-white shadow"
            >
              <QuestionBankCard
                question={q}
                onEdit={() => setEditIndex(index)}
                onDelete={() => handleDelete(index)}
              />

              <div className="mt-2 text-sm text-red-500">
                {q.is_duplicate && <div>⚠ Duplicate detected.</div>}
                {errors.length > 0 &&
                  errors.map((err, i) => <div key={i}>⚠ {err}</div>)}

                {(q.is_duplicate || errors.length > 0) && (
                  <div className="font-semibold mt-1">
                    ⚠ Question will NOT be imported until issues are fixed.
                  </div>
                )}
              </div>

              {editIndex === index && (
                <EditPreviewQuestionModal
                  show={true}
                  onClose={() => setEditIndex(null)}
                  initialValues={q}
                  onSave={handleSaveEdit} // ✅ Uses updated function
                />
              )}
            </div>
          );
        })}

        <div className="flex justify-between mt-4">
          <StandardButton onClick={onClose} className="bg-gray-400">
            Cancel Import
          </StandardButton>
          <StandardButton
            onClick={() =>
              onImport(
                editableQuestions.filter(
                  (q) => !q.is_duplicate && getValidationErrors(q).length === 0
                )
              )
            }
            className="bg-green-500 text-white"
          >
            Import Questions
          </StandardButton>
        </div>
      </div>
    </div>
  );
};
