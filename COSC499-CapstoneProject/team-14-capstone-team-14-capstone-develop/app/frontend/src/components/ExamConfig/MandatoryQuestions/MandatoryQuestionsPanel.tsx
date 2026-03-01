import { useState } from 'react';
import { SectionTitle } from '../../cards/SectionTitle';
import { StandardButton } from '../../ui/StandardButton';
import MandatoryQuestionItem from './MandatoryQuestionItem';
import {
  ClipboardList,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import type { ExamDetail } from '../../../api/examAPI';
interface ExamDetailWithCurrent extends ExamDetail {
  current_variant_questions?: any[];
}

export const MandatoryQuestionsPanel = ({
  exam,
  mandatoryIds,
  onSave,
  isSaving,
}: {
  exam: ExamDetailWithCurrent;
  mandatoryIds: number[];
  onSave: (ids: number[]) => void;
  isSaving: boolean;
}) => {
  // Ensure mandatoryIds is not null/undefined
  const safeMandatoryIds = mandatoryIds || [];
  const [selectedIds, setSelectedIds] = useState<number[]>(safeMandatoryIds);
  const [open, setOpen] = useState(true);

  // Ensure questions is not null/undefined
  const safeQuestions = exam.questions;

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    onSave(selectedIds);
  };

  return (
    <div className="bg-card rounded-lg shadow p-6 mb-8">
      <div
        className="flex items-center justify-between mb-2 cursor-pointer"
        onClick={() => setOpen((o) => !o)}
      >
        <div className="flex items-center gap-2">
          <SectionTitle
            icon={
              <ClipboardList
                size={22}
                strokeWidth={2}
                className="text-primary-btn"
              />
            }
            title="Mandatory Questions"
          />
        </div>
        <div className="flex items-center gap-2">
          <CheckCircle2 size={18} className="text-accent-emerald" />
          <span className="text-xs text-card-info">
            {selectedIds.length} selected
          </span>
          <span>{selectedIds.length} / 5 Recommended Mandatory</span>
          {open ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>
      {open && (
        <>
          {safeQuestions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <AlertTriangle size={32} className="mb-2 text-warning-btn" />
              <div className="text-lg font-semibold mb-2">
                No Questions Added
              </div>
              <div className="text-sm text-card-info mb-4">
                Add questions to this exam before selecting mandatory questions.
              </div>
            </div>
          ) : (
            <>
              <div className="max-h-96 overflow-y-auto space-y-3 pr-2 mb-6">
                {safeQuestions.map((q) => (
                  <MandatoryQuestionItem
                    key={q.id}
                    id={q.id}
                    text={q.question.prompt}
                    difficulty={
                      q.question.difficulty as 'Easy' | 'Medium' | 'Hard'
                    }
                    subject={q.question.tags?.[0] || 'General'}
                    selected={selectedIds.includes(q.id)}
                    onToggle={() => toggleSelect(q.id)}
                  />
                ))}
              </div>
              <hr className="border-t border-input-border mb-4" />
              <p className="text-sm text-card-info mb-4">
                Tip: You can click on a question card to toggle its mandatory
                status.
                <br />
                Randomizing non-mandatory questions can improve exam variant
                diversity.
              </p>
              <StandardButton onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Saving...' : 'Save Selection'}
              </StandardButton>
            </>
          )}
        </>
      )}
    </div>
  );
};
