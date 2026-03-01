import React, { useState } from 'react';
import {
  Shuffle,
  Layers,
  CheckCircle2,
  Target,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { DifficultyCard } from '../../ExamConfig/DifficultyCard';
import ConfirmModal from '../../ui/ConfirmModal';

interface Step3VariantStrategyProps {
  reuseMode: boolean;
  setReuseMode: (mode: boolean) => void;
  numVariants: number;
  setNumVariants: (num: number) => void;
  questionsPerVariant: number;
  // Add props for DifficultyCard
  selectedMode: 'auto' | 'even' | null;
  setSelectedMode: (mode: 'auto' | 'even' | null) => void;
  savedDistribution: {
    Easy: number;
    Medium: number;
    Hard: number;
    Unknown: number;
  };
  setEnabled: (enabled: boolean) => void;
  onSave: (
    mode: 'auto' | 'even',
    distribution: {
      Easy: number;
      Medium: number;
      Hard: number;
      Unknown: number;
    }
  ) => void;
  isSaving: boolean;
  saveStatus: 'idle' | 'saving' | 'saved';
  questions: any[];
  allowReuse: boolean;
  enabled: boolean;
  // Add props for question pool calculation
  // allQuestionBanks: any[]; // Unused
  sections: any[];
  sectionQuestionCounts: number[];
  // Add props for unsaved changes tracking
  hasUnsavedChanges?: boolean;
  onBackToExamView?: () => void;
  // Add props for insufficient questions validation
  hasInsufficientQuestions?: boolean;
  totalAvailableQuestions?: number;
  requiredQuestions?: number;
}

export const Step3VariantStrategy: React.FC<Step3VariantStrategyProps> = ({
  reuseMode,
  setReuseMode,
  numVariants,
  setNumVariants,
  questionsPerVariant,
  // setQuestionsPerVariant, // Unused
  selectedMode,
  setSelectedMode,
  savedDistribution,
  setEnabled,
  onSave,
  isSaving,
  saveStatus,
  questions,
  allowReuse,
  enabled,
  // allQuestionBanks, // Unused
  sections,
  sectionQuestionCounts,
  onBackToExamView,
  hasInsufficientQuestions = false,
  totalAvailableQuestions = 0,
  requiredQuestions = 0,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Calculate total questions from all question banks (for comparison)
  const totalQBQuestions = React.useMemo(() => {
    const uniqueBankIds = new Set<number>();
    let total = 0;

    sections.forEach((section) => {
      section.question_banks.forEach((bank: any) => {
        if (!uniqueBankIds.has(bank.id)) {
          uniqueBankIds.add(bank.id);
          total += bank.question_count || 0;
        }
      });
    });
    return total;
  }, [sections]);

  // Calculate actual question pool from sections (using configured limits)
  const calculatedTotalAvailableQuestions = React.useMemo(() => {
    let total = 0;

    sections.forEach((section, index) => {
      // Use the configured question count for each section
      const sectionLimit = sectionQuestionCounts[index] || 5;
      total += sectionLimit;
    });
    return total;
  }, [sections, sectionQuestionCounts]);

  // Calculate total questions per variant based on section configuration
  const totalQuestionsPerVariant = React.useMemo(() => {
    const total = sectionQuestionCounts.reduce((sum, count) => sum + count, 0);
    console.log(`🔍 totalQuestionsPerVariant calculation:`);
    console.log(`  - sectionQuestionCounts:`, sectionQuestionCounts);
    console.log(`  - total: ${total}`);
    return total;
  }, [sectionQuestionCounts]);

  // Calculate required questions based on mode
  const calculateRequiredQuestions = React.useMemo(() => {
    if (reuseMode) {
      // In reuse mode, we need the total questions per variant
      return totalQuestionsPerVariant;
    } else {
      // In unique mode, we need total questions across all variants
      return numVariants * totalQuestionsPerVariant;
    }
  }, [reuseMode, numVariants, totalQuestionsPerVariant]);

  // Calculate max variants supported in unique mode (always calculate for unique mode, regardless of current reuseMode)
  const maxVariantsSupported = React.useMemo(() => {
    console.log(`🔍 Calculating maxVariantsSupported for unique mode`);

    // Calculate how many variants each section can support
    const sectionVariantLimits = sections.map((section, index) => {
      const sectionQuestionsPerVariant = sectionQuestionCounts[index] || 0;
      if (sectionQuestionsPerVariant === 0) return Infinity;

      const totalQuestionsInSection = section.question_banks.reduce(
        (total: number, bank: any) => total + (bank.question_count || 0),
        0
      );

      const maxVariantsForSection = Math.floor(
        totalQuestionsInSection / sectionQuestionsPerVariant
      );

      console.log(
        `🔍 Section ${index}: ${sectionQuestionsPerVariant} questions/variant, ${totalQuestionsInSection} total questions = ${maxVariantsForSection} max variants`
      );

      return maxVariantsForSection;
    });

    const result = Math.min(...sectionVariantLimits);
    console.log(`🔍 Section limits:`, sectionVariantLimits);
    console.log(`🔍 Final maxVariantsSupported:`, result);
    console.log(`🔍 Should disable unique mode:`, result <= 1);

    return result;
  }, [sections, sectionQuestionCounts]);

  // Auto-update variant count when switching to unique mode
  React.useEffect(() => {
    if (
      !reuseMode &&
      maxVariantsSupported > 0 &&
      maxVariantsSupported < Infinity
    ) {
      setNumVariants(Math.min(numVariants, maxVariantsSupported));
    }
  }, [reuseMode, maxVariantsSupported, numVariants]);

  // Ensure one mode is always selected
  React.useEffect(() => {
    console.log(
      `🔍 Auto-selection effect - maxVariantsSupported: ${maxVariantsSupported}, reuseMode: ${reuseMode}, numVariants: ${numVariants}`
    );

    // Only auto-select reuse mode if no mode is selected initially
    if (maxVariantsSupported <= 1 && !reuseMode && numVariants === 1) {
      console.log(`🔍 Auto-selecting reuse mode`);
      setReuseMode(true);
    }
  }, [maxVariantsSupported, reuseMode, numVariants]);

  // Use passed props if available, otherwise calculate
  const finalTotalAvailableQuestions =
    totalAvailableQuestions || calculatedTotalAvailableQuestions;
  const finalRequiredQuestions =
    requiredQuestions || calculateRequiredQuestions;
  const finalHasInsufficientQuestions =
    hasInsufficientQuestions ||
    finalTotalAvailableQuestions < finalRequiredQuestions;

  const handleConfirmLeave = () => {
    setShowConfirmModal(false);
    onBackToExamView?.();
  };

  // Validation function - can be called by parent component
  const isStepValid = React.useMemo(() => {
    // Must have one mode selected
    if (!reuseMode && maxVariantsSupported <= 1) {
      return false;
    }

    // Must have at least 1 variant
    if (numVariants < 1) {
      return false;
    }

    // In unique mode, must not exceed max variants
    if (!reuseMode && numVariants > maxVariantsSupported) {
      return false;
    }

    return true;
  }, [reuseMode, maxVariantsSupported, numVariants]);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
            <Target className="text-green-600" size={20} />
          </div>
          Variant Strategy
        </h1>
        <p className="text-sm text-muted">
          How many versions? What&apos;s your strategy?
        </p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* Left Column - Strategy Settings (45%) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Strategy Selection Cards */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Reuse Mode Card */}
              <div
                className={clsx(
                  'p-4 rounded-lg border-2 transition-all duration-200 h-[140px] flex flex-col justify-center',
                  reuseMode
                    ? 'border-primary-btn bg-primary-btn/5 cursor-pointer'
                    : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                )}
                onClick={() => {
                  setReuseMode(true);
                  // Auto-set to 3 variants when Reuse Mode is selected
                  setNumVariants(3);
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                      reuseMode
                        ? 'bg-primary-btn text-white'
                        : 'bg-gray-100 text-gray-600'
                    )}
                  >
                    <Shuffle size={18} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="font-semibold text-heading text-sm">
                        Reuse Mode
                      </h3>
                      <p className="text-xs text-muted mt-1">
                        Reuse mode lets you generate unlimited versions with the
                        same questions shuffled.
                      </p>
                    </div>
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>Same questions in all variants</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                        <span>Lower question pool requirement</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Unique Mode Card */}
              <div
                className={clsx(
                  'p-4 rounded-lg border-2 transition-all duration-200 h-[140px] flex flex-col justify-center relative',
                  !reuseMode && maxVariantsSupported > 1
                    ? 'border-green-500 bg-green-50'
                    : maxVariantsSupported <= 1
                      ? 'border-gray-300 bg-gray-100 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 bg-white hover:border-gray-300 cursor-pointer'
                )}
                onClick={(e) => {
                  console.log(
                    `🔍 Click on unique mode card - maxVariantsSupported: ${maxVariantsSupported}, reuseMode: ${reuseMode}`
                  );

                  if (maxVariantsSupported <= 1) {
                    console.log(`🔍 Unique mode disabled, preventing click`);
                    e.preventDefault();
                    e.stopPropagation();
                    console.warn(
                      '❌ Tried to select unique mode but not enough questions.'
                    );
                    return;
                  }

                  console.log(
                    `🔍 Enabling unique mode, setting reuseMode to false`
                  );
                  setReuseMode(false);
                }}
                title={
                  maxVariantsSupported <= 1
                    ? 'Not enough questions for unique variants based on section limits'
                    : 'Click to select Unique Mode'
                }
                aria-disabled={maxVariantsSupported <= 1}
              >
                <div className="relative z-10">
                  <div className="flex items-start gap-3">
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0',
                        !reuseMode && maxVariantsSupported > 1
                          ? 'bg-green-500 text-white'
                          : maxVariantsSupported <= 1
                            ? 'bg-gray-200 text-gray-400'
                            : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      <Layers size={18} />
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={clsx(
                              'font-semibold text-sm',
                              maxVariantsSupported <= 1
                                ? 'text-gray-500'
                                : 'text-heading'
                            )}
                          >
                            Unique Mode
                          </h3>
                          {maxVariantsSupported > 1 &&
                            maxVariantsSupported !== Infinity && (
                              <span
                                className={clsx(
                                  'px-2 py-1 rounded-full text-xs font-medium',
                                  !reuseMode && maxVariantsSupported > 1
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-600'
                                )}
                              >
                                Max variants: {maxVariantsSupported}
                              </span>
                            )}
                          {maxVariantsSupported <= 1 && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              Disabled
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted mt-1">
                          {maxVariantsSupported <= 1
                            ? 'Not enough questions for unique variants'
                            : 'Each variant gets unique questions. Based on section constraints.'}
                        </p>
                      </div>
                      <div
                        className={clsx(
                          'text-xs space-y-1',
                          maxVariantsSupported <= 1
                            ? 'text-gray-400'
                            : 'text-gray-500'
                        )}
                      >
                        <div className="flex items-center gap-1">
                          <div
                            className={clsx(
                              'w-1 h-1 rounded-full',
                              maxVariantsSupported <= 1
                                ? 'bg-gray-300'
                                : 'bg-gray-400'
                            )}
                          ></div>
                          <span>Maximum anti-cheating protection</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div
                            className={clsx(
                              'w-1 h-1 rounded-full',
                              maxVariantsSupported <= 1
                                ? 'bg-gray-300'
                                : 'bg-gray-400'
                            )}
                          ></div>
                          <span>Requires larger question pool</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!reuseMode && (
              <p className="text-sm text-muted">
                You&apos;ll select mandatory questions in the next step.
              </p>
            )}
            {reuseMode && (
              <div className="h-6"></div> // Placeholder to maintain layout
            )}
          </div>

          {/* Side-by-side Steppers - Made smaller */}
          <div className="grid grid-cols-2 gap-4">
            {/* Variants Stepper */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-heading">
                Variants
              </label>
              <div className="flex items-center gap-1">
                <button
                  className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors"
                  onClick={() => setNumVariants(Math.max(1, numVariants - 1))}
                >
                  <span className="text-sm font-semibold">−</span>
                </button>
                <input
                  type="number"
                  min={1}
                  max={5}
                  className="w-16 px-4 py-2 text-center border border-gray-300 rounded text-sm bg-white focus:border-primary-btn focus:ring-1 focus:ring-primary-btn"
                  value={numVariants}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '') return; // Allow empty input
                    const num = parseInt(value);
                    if (!isNaN(num) && num >= 1 && num <= 5) {
                      setNumVariants(num);
                    }
                  }}
                  onBlur={(e) => {
                    const value = e.target.value;
                    if (value === '' || parseInt(value) < 1) {
                      setNumVariants(1);
                    }
                  }}
                />
                <button
                  className={clsx(
                    'w-8 h-8 rounded border border-gray-300 bg-white flex items-center justify-center transition-colors',
                    !reuseMode && numVariants >= maxVariantsSupported
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  )}
                  onClick={() => {
                    if (reuseMode || numVariants < maxVariantsSupported) {
                      setNumVariants(Math.min(5, numVariants + 1));
                    }
                  }}
                  disabled={!reuseMode && numVariants >= maxVariantsSupported}
                  title={
                    !reuseMode && numVariants >= maxVariantsSupported
                      ? `Maximum ${maxVariantsSupported} variants supported in unique mode`
                      : undefined
                  }
                >
                  <span className="text-sm font-semibold">+</span>
                </button>
              </div>
            </div>

            {/* Questions per Variant (Static Display) */}
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-heading">
                Questions per Variant
              </label>
              <div className="flex items-center gap-2">
                <div className="w-16 px-4 py-2 text-center border border-gray-300 rounded text-sm bg-blue-50 text-blue-700 font-medium">
                  {totalQuestionsPerVariant}
                </div>
                <span
                  className="text-xs text-muted"
                  title="Calculated from section allocations in Step 2"
                >
                  From Step 2
                </span>
              </div>
            </div>
          </div>

          {/* Helper text inside steppers div */}
          <div className="col-span-2">
            <p className="text-xs text-gray-500 mt-1">
              Questions will be distributed across sections based on your
              selections in Step 2.
            </p>
          </div>

          {/* Mode-specific Summary */}
          <div className="col-span-2">
            {/* Removed old unlimited variants card - now handled in Variants Available card */}
          </div>
        </div>

        {/* Right Column - Difficulty Distribution (55%) */}
        <div className="lg:col-span-6 flex flex-col">
          <div className="flex-1 min-h-[320px]">
            <DifficultyCard
              selectedMode={selectedMode}
              setSelectedMode={(mode) => {
                setSelectedMode(mode);
                // Auto-save when mode is selected
                if (mode) {
                  const distribution =
                    mode === 'even'
                      ? {
                          Easy: 33,
                          Medium: 33,
                          Hard: 34,
                          Unknown: 0,
                        }
                      : {
                          Easy: 40,
                          Medium: 40,
                          Hard: 20,
                          Unknown: 0,
                        };
                  onSave(mode, distribution);
                }
              }}
              savedDistribution={savedDistribution}
              setEnabled={setEnabled}
              onSave={onSave}
              isSaving={isSaving}
              saveStatus={saveStatus}
              questions={questions}
              questionsPerVariant={questionsPerVariant}
              numVariants={numVariants}
              allowReuse={allowReuse}
              enabled={enabled}
              hideSaveButton={true}
            />
          </div>

          {/* Question Pool Status - Under DifficultyCard */}
          <div className="mt-1 space-y-2">
            <div
              className={clsx(
                'border rounded-lg p-3',
                finalHasInsufficientQuestions
                  ? 'bg-red-50 border-red-200'
                  : 'bg-green-50 border-green-200'
              )}
            >
              <div className="flex items-center gap-2">
                {finalHasInsufficientQuestions ? (
                  <>
                    <div className="w-4 h-4 rounded-full bg-red-100 flex items-center justify-center">
                      <AlertTriangle className="text-red-600" size={12} />
                    </div>
                    <div>
                      <p className="font-semibold text-red-800 text-sm">
                        Not enough questions available
                      </p>
                      <p className="text-xs text-red-700 mt-1">
                        You selected {finalRequiredQuestions} questions but only{' '}
                        {finalTotalAvailableQuestions} are available based on
                        section limits in Step 2.
                        {finalRequiredQuestions > totalQBQuestions
                          ? ` Your question banks only have ${totalQBQuestions} total questions. Add more question banks.`
                          : ` Increase your section limits in Step 2 to allow more questions.`}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="text-green-600" size={16} />
                    <div>
                      <p className="font-semibold text-green-800 text-sm">
                        Question pool is sufficient
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        You requested a total of {finalTotalAvailableQuestions}{' '}
                        questions in all sections. You can change your preferred
                        question counts for each section in the previous step.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Variants Available Info - Show for both modes */}
            {reuseMode ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="text-blue-600" size={12} />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">
                      Variants Available
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      You can create unlimited variants with your current setup.
                    </p>
                  </div>
                </div>
              </div>
            ) : maxVariantsSupported > 1 ? (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center">
                    <Target className="text-blue-600" size={12} />
                  </div>
                  <div>
                    <p className="font-semibold text-blue-800 text-sm">
                      Variants Available
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Your current question pool supports up to{' '}
                      {maxVariantsSupported} unique variants. Based on section
                      preferences from Step 2.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Confirmation Modal for unsaved changes */}
      <ConfirmModal
        open={showConfirmModal}
        title="Discard unsaved changes?"
        description="Changes you make here are only saved at the final step. Are you sure you want to exit without saving?"
        confirmText="Leave without Saving"
        cancelText="Cancel"
        onConfirm={handleConfirmLeave}
        onCancel={() => setShowConfirmModal(false)}
      />
    </div>
  );
};
