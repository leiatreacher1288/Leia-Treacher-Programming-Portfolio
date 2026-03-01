import React from 'react';
import {
  Sparkles,
  Info,
  Shield,
  Shuffle,
  Layers,
  CheckCircle2,
  BookOpen,
  Target,
  Calculator,
} from 'lucide-react';
import type { ExamSection } from '../../../api/examAPI';
import clsx from 'clsx';

interface MarkingScheme {
  multiCorrectPolicy:
    | 'all_or_nothing'
    | 'partial_credit'
    | 'partial_with_penalty';
  negativeMarking: {
    enabled: boolean;
    penalty: number;
    applyTo: 'all_questions' | 'single_choice_only' | 'multi_choice_only';
  };
  sectionWeighting: {
    [sectionId: number]: number;
  };
}

interface Step6ReviewGenerateProps {
  examName: string;
  numVariants: number;
  questionsPerVariant: number;
  selectedMandatoryQuestions: Set<number>;
  sections: ExamSection[];
  reuseMode?: boolean;
  totalAvailableQuestions?: number;
  markingScheme?: MarkingScheme;
}

export const Step6ReviewGenerate: React.FC<Step6ReviewGenerateProps> = ({
  examName,
  numVariants,
  questionsPerVariant,
  selectedMandatoryQuestions,
  sections,
  reuseMode = false,
  totalAvailableQuestions = 0,
  markingScheme,
}) => {
  // Calculate total questions that will be used
  const totalQuestionsUsed = reuseMode
    ? questionsPerVariant
    : numVariants * questionsPerVariant;
  const poolCoveragePercentage =
    totalAvailableQuestions > 0
      ? (totalQuestionsUsed / totalAvailableQuestions) * 100
      : 0;

  // Calculate questions per section
  const questionsPerSection = sections.map((section) => {
    const sectionQuestionCount = section.question_banks.reduce(
      (total, bank: any) => {
        return total + (bank?.question_count || 0);
      },
      0
    );
    return {
      title: section.title,
      questionCount: sectionQuestionCount,
      bankCount: section.question_banks.length,
      configuredCount: section.configured_question_count || 5,
    };
  });

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Sparkles className="text-purple-600" size={20} />
          </div>
          Review & Generate
        </h1>
        <p className="text-sm text-gray-600">
          Review your exam configuration and generate variants.
        </p>
      </div>
      {/* First Row: Exam Summary and Variant Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BookOpen className="text-purple-600" size={20} />
            Exam Summary
          </h3>

          <div className="space-y-6">
            {/* Basic Exam Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Exam Name:</span>
                <p className="font-semibold">{examName || 'Untitled Exam'}</p>
              </div>
              <div>
                <span className="text-gray-500">Variants:</span>
                <p className="font-semibold">{numVariants}</p>
              </div>
              <div>
                <span className="text-gray-500">Questions per Variant:</span>
                <p className="font-semibold">
                  {reuseMode
                    ? questionsPerVariant
                    : questionsPerSection.reduce(
                        (total, section) => total + section.configuredCount,
                        0
                      )}
                </p>
              </div>
              <div>
                <span className="text-gray-500">Mandatory Questions:</span>
                <p className="font-semibold">
                  {selectedMandatoryQuestions.size}
                </p>
              </div>
            </div>

            {/* Question Pool Coverage */}
            {totalAvailableQuestions > 0 && (
              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-900">
                    Question Pool Coverage
                  </span>
                  <span className="text-sm text-gray-500">
                    {totalQuestionsUsed} / {totalAvailableQuestions} used
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={clsx(
                      'h-2 rounded-full transition-all duration-300',
                      poolCoveragePercentage > 80
                        ? 'bg-red-500'
                        : poolCoveragePercentage > 60
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                    )}
                    style={{
                      width: `${Math.min(poolCoveragePercentage, 100)}%`,
                    }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {poolCoveragePercentage > 80
                    ? 'High coverage - consider adding more banks'
                    : poolCoveragePercentage > 60
                      ? 'Moderate coverage'
                      : 'Good coverage'}
                </p>
              </div>
            )}

            {/* Sections Breakdown */}
            <div className="border-t pt-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Layers className="text-amber-600" size={16} />
                Sections Configuration
              </h4>
              <div className="space-y-3">
                {questionsPerSection.map((section, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center text-sm bg-gray-50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{section.title}</span>
                      <span className="text-xs text-gray-500">
                        {section.bankCount} bank
                        {section.bankCount !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">→</span>
                      <span className="font-semibold">
                        {section.configuredCount} questions
                      </span>
                      <span className="text-xs text-gray-500">
                        (from {section.questionCount} available)
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Variant Configuration Summary */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="text-green-600" size={20} />
            Variant Configuration
          </h3>

          <div className="space-y-4">
            {/* Variant Strategy */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Variant Strategy
              </label>
              <div className="flex gap-2">
                <span
                  className={clsx(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    reuseMode
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-purple-100 text-purple-700'
                  )}
                >
                  {reuseMode ? 'Reuse Mode' : 'Unique Mode'}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {numVariants} variants
                </span>
              </div>
            </div>

            {/* Question Behavior */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Question Behavior
              </label>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                  <Shuffle className="w-3 h-3" />
                  Randomized Order
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                  <Shuffle className="w-3 h-3" />
                  Randomized Choices
                </span>
              </div>
            </div>

            {/* Security Features */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Security
              </label>
              <div className="flex gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Anti-Cheating Enabled
                </span>
              </div>
            </div>

            {/* Question Distribution */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Question Distribution
              </label>
              <div className="flex gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                  {reuseMode
                    ? questionsPerVariant
                    : questionsPerSection.reduce(
                        (total, section) => total + section.configuredCount,
                        0
                      )}{' '}
                  per variant
                </span>
                {selectedMandatoryQuestions.size > 0 && (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    {selectedMandatoryQuestions.size} mandatory
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Second Row: Marking Scheme and Ready to Generate */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Marking Scheme Card */}
        {markingScheme && (
          <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
            <div className="flex items-center mb-3">
              <Calculator className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-base font-semibold text-gray-900">
                Marking Scheme
              </h3>
            </div>

            <div className="space-y-2">
              {/* Multi-Correct Policy */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">
                  Multi-Correct Policy:
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    markingScheme.multiCorrectPolicy === 'all_or_nothing'
                      ? 'bg-red-100 text-red-700'
                      : markingScheme.multiCorrectPolicy === 'partial_credit'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {markingScheme.multiCorrectPolicy === 'all_or_nothing' &&
                    'All or Nothing'}
                  {markingScheme.multiCorrectPolicy === 'partial_credit' &&
                    'Partial Credit'}
                  {markingScheme.multiCorrectPolicy ===
                    'partial_with_penalty' && 'Partial with Penalty'}
                </span>
              </div>

              {/* Negative Marking */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-700">Negative Marking:</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    markingScheme.negativeMarking.enabled
                      ? 'bg-red-100 text-red-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {markingScheme.negativeMarking.enabled
                    ? `${Math.round(markingScheme.negativeMarking.penalty * 100)}% penalty`
                    : 'Disabled'}
                </span>
              </div>

              {/* Section Weighting */}
              {Object.keys(markingScheme.sectionWeighting).length > 0 && (
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-700">
                    Section Weighting:
                  </span>
                  <div className="flex gap-1">
                    {sections.map((section, index) => {
                      const weight =
                        markingScheme.sectionWeighting[section.id] || 1;
                      if (weight === 1) return null; // Skip normal weight sections
                      return (
                        <span
                          key={section.id}
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            weight > 1
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-700'
                          }`}
                        >
                          {section.title ||
                            `Section ${String.fromCharCode(65 + index)}`}{' '}
                          ×{weight}
                        </span>
                      );
                    })}
                    {sections.every((section) => {
                      const weight =
                        markingScheme.sectionWeighting[section.id] || 1;
                      return weight === 1;
                    }) && (
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                        Normal weight
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ready to Generate Info Panel */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Info className="text-blue-600 mt-0.5" size={16} />
            <div>
              <h4 className="font-semibold text-blue-800 mb-1">
                Ready to Generate
              </h4>
              <p className="text-sm text-blue-700">
                After clicking &quot;Save & Generate&quot;, your {numVariants}{' '}
                exam variants will be generated and available for export as
                DOCX, PDF, and CSV formats with answer keys.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
