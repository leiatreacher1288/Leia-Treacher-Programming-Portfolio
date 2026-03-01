import {
  SlidersHorizontal,
  HelpCircle,
  Save,
  CheckCircle,
  Info,
} from 'lucide-react';
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/Tooltip';
import { OverviewSummaryCard } from '../cards/OverviewSummaryCard';
import { SectionTitle } from '../cards/SectionTitle';
import React, { useState, useEffect } from 'react';
import { FiRepeat, FiLock } from 'react-icons/fi';
import { StandardButton } from '../ui/StandardButton';

interface GeneralSettingsCardProps {
  numVariants: number;
  questionsPerVariant: number;
  allowReuse: boolean;
  setNumVariants: (v: number) => void;
  setQuestionsPerVariant: (v: number) => void;
  setAllowReuse: (v: boolean) => void;
  questionTotal: number;
  mandatoryCount: number;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  onSave: () => void;
  isDirty: boolean;
}

export const GeneralSettingsCard = ({
  numVariants,
  questionsPerVariant,
  allowReuse,
  setNumVariants,
  setQuestionsPerVariant,
  setAllowReuse,
  questionTotal,
  mandatoryCount,
  isSaving,
  saveStatus,
  onSave,
  isDirty,
}: GeneralSettingsCardProps) => {
  // Local state for input fields to allow clearing while editing
  const [numVariantsInput, setNumVariantsInput] = useState(
    numVariants.toString()
  );
  const [questionsPerVariantInput, setQuestionsPerVariantInput] = useState(
    questionsPerVariant.toString()
  );

  // Sync local state with props if they change externally
  useEffect(() => {
    setNumVariantsInput(numVariants.toString());
  }, [numVariants]);
  useEffect(() => {
    setQuestionsPerVariantInput(questionsPerVariant.toString());
  }, [questionsPerVariant]);

  // New question budget calculation
  let questionBudget = 0;
  const uniquenessMode = allowReuse ? 'reuse' : 'unique';
  if (uniquenessMode === 'reuse') {
    questionBudget =
      mandatoryCount + Math.max(0, questionsPerVariant - mandatoryCount);
  } else {
    questionBudget =
      mandatoryCount +
      numVariants * Math.max(0, questionsPerVariant - mandatoryCount);
  }
  const questionBudgetExceeded = questionBudget > questionTotal;
  const budgetPercentage = Math.min(
    (questionBudget / questionTotal) * 100,
    100
  );

  // Save button enabled if any field is dirty (parent tracks dirty state)
  // const isDirty =
  //   numVariants !== numVariants ||
  //   questionsPerVariant !== questionsPerVariant ||
  //   allowReuse !== allowReuse ||
  //   randomizeChoices !== randomizeChoices;

  // On input change, allow empty string, but only update parent on valid positive integer
  const handleNumVariantsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setNumVariantsInput(val);
      // Only update parent if valid positive integer (no 0)
      if (/^[1-9]\d*$/.test(val)) {
        setNumVariants(Number(val));
      }
    }
  };
  const handleNumVariantsBlur = () => {
    if (!/^[1-9]\d*$/.test(numVariantsInput)) {
      setNumVariantsInput('1');
      setNumVariants(1);
    }
  };
  const handleQuestionsPerVariantChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const val = e.target.value;
    if (val === '' || /^\d+$/.test(val)) {
      setQuestionsPerVariantInput(val);
      if (/^[1-9]\d*$/.test(val)) {
        setQuestionsPerVariant(Number(val));
      }
    }
  };
  const handleQuestionsPerVariantBlur = () => {
    if (!/^[1-9]\d*$/.test(questionsPerVariantInput)) {
      setQuestionsPerVariantInput('1');
      setQuestionsPerVariant(1);
    }
  };
  const handleAllowReuseChange = (reuse: boolean) => {
    setAllowReuse(reuse);
  };

  // On Save, call onSave
  const handleSave = async () => {
    onSave();
  };

  return (
    <OverviewSummaryCard className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <SectionTitle
          icon={<SlidersHorizontal className="text-primary-btn w-5 h-5" />}
          title="General Settings"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start mb-4">
        {/* Number of Variants */}
        <div>
          <div className="flex items-center gap-1 text-sm text-heading mb-2">
            Number of variants
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent side="top">
                Total randomized versions of the exam to generate (max 5).
              </TooltipContent>
            </Tooltip>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numVariantsInput}
            onChange={handleNumVariantsChange}
            onBlur={handleNumVariantsBlur}
            className="w-full rounded-md border border-input-border px-3 py-2 text-heading bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-btn text-base"
            autoComplete="off"
          />
        </div>

        {/* Questions per Exam */}
        <div>
          <div className="flex items-center gap-1 text-sm text-heading mb-2">
            Number of questions per version
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
              </TooltipTrigger>
              <TooltipContent side="top">
                Number of questions selected per variant.
              </TooltipContent>
            </Tooltip>
          </div>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={questionsPerVariantInput}
            onChange={handleQuestionsPerVariantChange}
            onBlur={handleQuestionsPerVariantBlur}
            className="w-full rounded-md border border-input-border px-3 py-2 text-heading bg-white shadow-sm focus:outline-none focus:ring-1 focus:ring-primary-btn text-base"
            autoComplete="off"
          />
        </div>
      </div>

      {/* Variant Uniqueness Segmented Control */}
      <div className="mb-4">
        <div className="font-medium text-sm text-heading mb-2 flex items-center gap-2">
          Question Uniqueness
          <Tooltip>
            <TooltipTrigger asChild>
              <HelpCircle className="w-4 h-4 text-gray-400 hover:text-gray-600 cursor-pointer" />
            </TooltipTrigger>
            <TooltipContent side="top">
              <div className="max-w-xs">
                <p className="font-medium mb-1">Unique:</p>
                <p className="text-xs mb-2">
                  Each variant gets completely different questions (except
                  mandatory ones).
                </p>
                <p className="font-medium mb-1">Reuse:</p>
                <p className="text-xs">
                  All variants can share the same question pool, just in
                  different orders.
                </p>
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => handleAllowReuseChange(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-btn/30 ${!allowReuse ? 'bg-primary-btn/10 text-primary-btn shadow-sm' : 'bg-white text-gray-600 hover:text-primary-btn'}`}
            aria-pressed={!allowReuse}
          >
            Unique
          </button>
          <button
            onClick={() => handleAllowReuseChange(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary-btn/30 ${allowReuse ? 'bg-primary-btn/10 text-primary-btn shadow-sm' : 'bg-white text-gray-600 hover:text-primary-btn'}`}
            aria-pressed={allowReuse}
          >
            Reuse
          </button>
        </div>
        {/* Inline explainer for Allow Reuse/Unique */}
        <div
          className={`flex items-center gap-2 mt-2 rounded bg-gray-50 border ${allowReuse ? 'border-accent-blue' : 'border-accent-indigo'} px-3 py-1.5 text-xs ${allowReuse ? 'text-accent-blue' : 'text-accent-indigo'}`}
        >
          {allowReuse ? (
            <FiRepeat className="w-4 h-4" />
          ) : (
            <FiLock className="w-4 h-4" />
          )}
          <span>
            <span className="font-semibold">
              {allowReuse ? 'Allow Reuse:' : 'Unique:'}
            </span>
            {allowReuse
              ? ' Every variant will have the same set of questions, but the order of questions and answer choices will be shuffled for each student.'
              : ' The system will try to generate unique variants, each with a different set of questions (except mandatory questions, which appear in all variants).'}
          </span>
        </div>
      </div>

      {/* (REMOVED) Randomization Options - always enabled */}

      {/* Question Budget Warning */}
      {questionBudgetExceeded && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">
                Question budget exceeded
              </p>
              <p className="text-sm text-red-700 mt-1">
                You need {questionBudget} questions but only have{' '}
                {questionTotal}. Please add more questions or reduce the number
                of variants/questions per variant.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Question Budget Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-sm text-heading mb-2">
          <span>Question Budget Usage</span>
          <span className="font-medium">
            {questionBudget} / {questionTotal} ({budgetPercentage.toFixed(1)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              questionBudgetExceeded
                ? 'bg-red-500'
                : budgetPercentage > 80
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
            }`}
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-600 mt-1">
          {uniquenessMode === 'reuse'
            ? 'All variants share the same question pool'
            : `Each variant needs unique questions`}
        </p>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <StandardButton
          onClick={handleSave}
          disabled={isSaving || questionBudgetExceeded || !isDirty}
          className="flex items-center gap-2"
        >
          {saveStatus === 'saving' ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : !isDirty ? (
            <>
              <CheckCircle className="w-4 h-4 text-success-btn" />
              All changes saved
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </StandardButton>
      </div>
    </OverviewSummaryCard>
  );
};
