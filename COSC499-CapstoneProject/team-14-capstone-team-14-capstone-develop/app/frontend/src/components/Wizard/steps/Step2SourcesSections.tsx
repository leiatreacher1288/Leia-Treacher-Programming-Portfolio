import React, { useEffect } from 'react';
import {
  BarChart2,
  LayoutList,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Library,
  Trash2,
} from 'lucide-react';
import { StandardButton } from '../../ui/StandardButton';
import { QuestionBankHeader } from '../../QuestionBank/QuestionBankHeader';
import type { QuestionBank, ExamSection } from '../../../api/examAPI';
import { validateCourseHasQuestionBanks } from '../../../utils/courseValidation';
import clsx from 'clsx';
import toast from 'react-hot-toast';

interface Step2SourcesSectionsProps {
  availableBanks: QuestionBank[];
  sections: ExamSection[];
  draggedBankId: string | null;
  highlightedBank: number | null;
  collapsedSections: Set<string>;
  sectionQuestionCounts: number[];
  handleBankDragStart: (bankId: number) => void;
  handleBankDragEnd: () => void;
  handleDropOnSection: (sectionIdx: number) => void;
  handleAddBankToSection: (bankId: number, sectionIdx: number) => void;
  handleRemoveBankFromSection: (sectionIdx: number, bankId: number) => void;
  setHighlightedBank: (bankId: number | null) => void;
  setSections: React.Dispatch<React.SetStateAction<ExamSection[]>>;
  setCollapsedSections: React.Dispatch<React.SetStateAction<Set<string>>>;
  updateSectionQuestionCount: (sectionIdx: number, count: number) => void;
  calculateMaxQuestionsForSection: (sectionIdx: number) => number;
  selectedCourseId?: number;
  onRedirectToCourse?: (courseId: number) => void;
}

export const Step2SourcesSections: React.FC<Step2SourcesSectionsProps> = ({
  availableBanks,
  sections,
  draggedBankId,
  highlightedBank,
  collapsedSections,
  sectionQuestionCounts,
  handleBankDragStart,
  handleBankDragEnd,
  handleDropOnSection,
  handleAddBankToSection,
  handleRemoveBankFromSection,
  setHighlightedBank,
  setSections,
  setCollapsedSections,
  updateSectionQuestionCount,
  calculateMaxQuestionsForSection,
  selectedCourseId,
  onRedirectToCourse,
}) => {
  useEffect(() => {
    const checkCourseHasBanks = async () => {
      if (selectedCourseId) {
        const hasBanks = await validateCourseHasQuestionBanks(selectedCourseId);
        if (!hasBanks) {
          toast.error(
            'No question banks found for this course. Please add some.'
          );
          onRedirectToCourse?.(selectedCourseId);
        }
      }
    };

    checkCourseHasBanks();
  }, [selectedCourseId, onRedirectToCourse]);

  // Check if we have any question banks (excluding the default Section A)
  if (
    (availableBanks || []).length === 0 &&
    (sections || []).every((s) => (s.question_banks || []).length === 0)
  ) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
              <Library className="text-amber-600" size={20} />
            </div>
            Question Sources & Section Builder
          </h1>
          <p className="text-sm text-muted">
            Choose question banks and organize them into sections. Set the exact
            number of questions each section will contribute to each variant.
          </p>
        </div>
        {/* Empty State */}
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center mx-auto mb-4">
            <Library className="text-blue-600" size={32} />
          </div>
          <h3 className="text-xl font-bold text-heading mb-2">
            No Question Banks Found
          </h3>
          <p className="text-muted mb-6">
            You need at least one to start building your exam.
          </p>
          <StandardButton
            color="primary-btn"
            size="lg"
            onClick={() => {
              // Navigate to course detail with question banks tab
              window.location.href = `/courses/${selectedCourseId || 1}#question-banks`;
            }}
            icon={<Library size={16} />}
            className="px-6 py-2"
          >
            Go to Question Banks
          </StandardButton>
        </div>
      </div>
    );
  }

  // Helper function to check if a bank is already assigned to any section
  const isBankAssignedToAnySection = (bankId: number): boolean => {
    return (sections || []).some((section) =>
      (section.question_banks || []).some((bank) => bank.id === bankId)
    );
  };

  // Helper function to get the section that contains a specific bank
  const getSectionContainingBank = (bankId: number): ExamSection | null => {
    return (
      (sections || []).find((section) =>
        (section.question_banks || []).some((bank) => bank.id === bankId)
      ) || null
    );
  };

  const handleRemoveSection = (sectionIdx: number) => {
    const section = sections[sectionIdx];
    if (section.question_banks && section.question_banks.length > 0) {
      toast.error(
        'Cannot remove section with question banks. Please remove all question banks first.'
      );
      return;
    }

    setSections((prev) => prev.filter((_, idx) => idx !== sectionIdx));
    toast.success('Section removed');
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-heading mb-2 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
            <Library className="text-amber-600" size={20} />
          </div>
          Question Sources & Section Builder
        </h1>
        <p className="text-sm text-muted">
          Choose question banks and organize them into sections.
        </p>
      </div>

      {/* Add instructional banner here */}
      <div className="mb-4 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-sm">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 5H7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" />
                <path d="m13 5 6 6m-6-6v4h4" />
              </svg>
            </div>
          </div>
          <p className="text-gray-700">
            <strong>How to use:</strong> Drag question banks to sections or
            click "Add to Section". Each question bank can only be used in one
            section per exam. Set the exact number of questions each section
            will contribute to each variant.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-x-6">
        {/* Available Question Banks Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-heading flex items-center gap-2">
              <BarChart2 className="text-accent-amber" size={16} />
              Available Question Banks
            </div>
            <span className="text-sm text-muted">
              {(availableBanks || []).length} available
            </span>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
            {(availableBanks || []).map((bank) => {
              // Check if this bank is already in any section
              const isInAnySection = (sections || []).some((section) =>
                (section.question_banks || []).some(
                  (sectionBank) => sectionBank.id === bank.id
                )
              );
              const assignedSection = (sections || []).find((section) =>
                (section.question_banks || []).some(
                  (sectionBank) => sectionBank.id === bank.id
                )
              );

              return (
                <div
                  key={bank.id}
                  className={clsx(
                    'bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-300',
                    isInAnySection
                      ? 'cursor-not-allowed opacity-75'
                      : 'cursor-grab active:cursor-grabbing hover:border-blue-300 hover:border-2',
                    draggedBankId === bank.id.toString() &&
                      'ring-2 ring-primary-btn scale-105 shadow-lg',
                    isInAnySection && 'ring-1 ring-amber-300'
                  )}
                  draggable={!isInAnySection}
                  onDragStart={() =>
                    !isInAnySection && handleBankDragStart(bank.id)
                  }
                  onDragEnd={handleBankDragEnd}
                  title={
                    isInAnySection
                      ? 'This question bank is already assigned and cannot be dragged'
                      : 'Drag to add to a section'
                  }
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BarChart2 className="text-blue-600" size={16} />
                      <span className="font-semibold text-heading">
                        {bank.title}
                      </span>
                    </div>
                    {isInAnySection && assignedSection && (
                      <span
                        className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200"
                        title={`This question bank is already used in ${assignedSection.title}. A bank can only be used in one section per exam.`}
                      >
                        In {assignedSection.title}
                      </span>
                    )}
                  </div>

                  <div className="mb-3">
                    <p className="text-sm text-muted mb-2">
                      {bank.description}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted">
                      <span>{bank.question_count} questions</span>
                      {bank.easy > 0 && (
                        <span className="px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                          Easy {bank.easy}%
                        </span>
                      )}
                      {bank.medium > 0 && (
                        <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-700 text-xs">
                          Medium {bank.medium}%
                        </span>
                      )}
                      {bank.hard > 0 && (
                        <span className="px-2 py-1 rounded-full bg-red-100 text-red-700 text-xs">
                          Hard {bank.hard}%
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    className={`w-full mt-2 px-3 py-2 text-sm rounded-lg transition-colors ${
                      isInAnySection
                        ? 'text-gray-400 bg-gray-100 cursor-not-allowed'
                        : 'text-primary-btn hover:bg-blue-50'
                    }`}
                    onClick={() => {
                      // Double-check to prevent assignment if already assigned
                      if (
                        isInAnySection ||
                        isBankAssignedToAnySection(bank.id)
                      ) {
                        const containingSection = getSectionContainingBank(
                          bank.id
                        );
                        if (containingSection) {
                          toast.error(
                            `This question bank is already used in ${containingSection.title}. A bank can only be used in one section per exam.`
                          );
                        }
                        return;
                      }

                      if ((sections || []).length === 1) {
                        // Auto-add if only one section
                        handleAddBankToSection(bank.id, 0);
                        // Update section question count to match the bank's question count
                        updateSectionQuestionCount(0, bank.question_count || 5);
                      } else if ((sections || []).length > 1) {
                        // Highlight sections for selection
                        setHighlightedBank(bank.id);
                      }
                    }}
                    disabled={isInAnySection}
                    title={
                      isInAnySection
                        ? `This question bank is already used in ${assignedSection?.title}. A bank can only be used in one section per exam.`
                        : undefined
                    }
                  >
                    {isInAnySection ? 'Already Assigned' : '+ Add to Section'}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sections Panel */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-heading flex items-center gap-2">
              <LayoutList className="text-blue-600" size={16} />
              Sections
            </div>
            <button
              className="flex items-center gap-1 text-primary-btn hover:underline text-sm font-medium"
              onClick={() => {
                const newSection: ExamSection = {
                  id: Math.max(...(sections || []).map((s) => s.id), 0) + 1,
                  title: `Section ${String.fromCharCode(65 + (sections || []).length)}`,
                  question_banks: [],
                  instructions: '',
                  order: (sections || []).length,
                  question_count: 0,
                };
                setSections((prev) => [...(prev || []), newSection]);
                updateSectionQuestionCount((sections || []).length, 5); // Default 5 questions
              }}
            >
              <Plus size={16} />
              Add Section
            </button>
          </div>

          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
            {(sections || []).map((section, idx) => {
              const isCollapsed = collapsedSections.has(section.id.toString());

              return (
                <div
                  key={section.id}
                  className={clsx(
                    'bg-blue-50 border border-blue-200 rounded-lg shadow-sm transition-all duration-300',
                    draggedBankId && 'ring-2 ring-primary-btn',
                    highlightedBank && 'ring-2 ring-yellow-400 cursor-pointer',
                    isCollapsed ? 'p-3' : 'p-4'
                  )}
                  onClick={() => {
                    if (highlightedBank) {
                      // Double-check to prevent assignment if already assigned
                      if (isBankAssignedToAnySection(highlightedBank)) {
                        const containingSection =
                          getSectionContainingBank(highlightedBank);
                        if (containingSection) {
                          toast.error(
                            `This question bank is already used in ${containingSection.title}. A bank can only be used in one section per exam.`
                          );
                        }
                        setHighlightedBank(null);
                        return;
                      }

                      handleAddBankToSection(highlightedBank, idx);
                      // Update section question count to match the bank's question count
                      const bank = availableBanks.find(
                        (b) => b.id === highlightedBank
                      );
                      if (bank) {
                        updateSectionQuestionCount(
                          idx,
                          bank.question_count || 5
                        );
                      }
                      setHighlightedBank(null);
                    }
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => handleDropOnSection(idx)}
                >
                  <div
                    className={clsx(
                      'flex items-center justify-between',
                      isCollapsed ? 'mb-0' : 'mb-3'
                    )}
                  >
                    <div className="flex items-center gap-2 flex-1">
                      <LayoutList className="text-blue-600" size={16} />
                      <input
                        className="font-semibold text-heading text-base bg-transparent border border-transparent hover:border-blue-300 hover:bg-blue-50 rounded px-2 py-1 transition-all duration-200 cursor-text focus:border-blue-400 focus:bg-blue-50 focus:outline-none"
                        value={section.title}
                        onChange={(e) => {
                          setSections((prev) => {
                            const updated = [...prev];
                            updated[idx].title = e.target.value;
                            return updated;
                          });
                        }}
                        placeholder="Enter section title..."
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        className="p-1 hover:bg-blue-100 rounded transition-colors"
                        onClick={() => {
                          setCollapsedSections((prev) => {
                            const newSet = new Set(prev);
                            if (isCollapsed) {
                              newSet.delete(section.id.toString());
                            } else {
                              newSet.add(section.id.toString());
                            }
                            return newSet;
                          });
                        }}
                      >
                        {isCollapsed ? (
                          <ChevronDown size={16} />
                        ) : (
                          <ChevronUp size={16} />
                        )}
                      </button>
                      <button
                        className="p-1 hover:bg-red-100 rounded transition-colors text-red-600"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveSection(idx);
                        }}
                        title="Remove section"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {!isCollapsed && (
                    <>
                      {idx === 0 && (
                        <div className="text-sm text-muted mb-3">
                          This section will appear as a separate part in the
                          final exam.
                        </div>
                      )}

                      <div className="space-y-2">
                        {(section.question_banks || []).map((bank: any) => {
                          const isReused =
                            sections.filter((s) =>
                              s.question_banks.some(
                                (b: any) => b.id === bank.id
                              )
                            ).length > 1;

                          return (
                            <div
                              key={bank.id}
                              className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium group"
                            >
                              <div className="flex items-center gap-2">
                                <BarChart2
                                  className="text-blue-600"
                                  size={14}
                                />
                                <span>{bank.title}</span>
                                {isReused && (
                                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs">
                                    Reused
                                  </span>
                                )}
                              </div>
                              <button
                                className="opacity-0 group-hover:opacity-100 text-red-600 hover:bg-red-50 p-1 rounded transition-all"
                                onClick={() =>
                                  handleRemoveBankFromSection(idx, bank.id)
                                }
                                type="button"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          );
                        })}
                      </div>

                      {/* Questions per Section Stepper */}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                        <div className="flex flex-col">
                          <label className="text-sm font-medium text-muted-foreground">
                            Questions per variant from this section
                          </label>
                          {(section.question_banks || []).length > 0 && (
                            <span className="text-xs text-gray-500">
                              Max: {calculateMaxQuestionsForSection(idx)}{' '}
                              questions available
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            className="w-8 h-8 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              const currentCount =
                                sectionQuestionCounts[idx] || 5;
                              const newCount = Math.max(1, currentCount - 1);
                              updateSectionQuestionCount(idx, newCount);
                            }}
                            disabled={
                              (section.question_banks || []).length === 0
                            }
                          >
                            <span className="text-lg font-semibold">−</span>
                          </button>
                          <input
                            type="number"
                            min={1}
                            max={calculateMaxQuestionsForSection(idx)}
                            className="w-16 text-center text-sm font-medium text-heading border border-gray-300 rounded-lg px-2 py-1 bg-white focus:border-primary-btn focus:ring-1 focus:ring-primary-btn disabled:opacity-50 disabled:cursor-not-allowed"
                            value={sectionQuestionCounts[idx] || 5}
                            onChange={(e) => {
                              const inputValue = parseInt(e.target.value) || 1;
                              const maxQuestions =
                                calculateMaxQuestionsForSection(idx);

                              // Allow typing freely, only validate on blur
                              if (
                                inputValue >= 1 &&
                                inputValue <= maxQuestions
                              ) {
                                updateSectionQuestionCount(idx, inputValue);
                              }
                            }}
                            onBlur={(e) => {
                              const inputValue = parseInt(e.target.value) || 1;
                              const maxQuestions =
                                calculateMaxQuestionsForSection(idx);

                              if (inputValue > maxQuestions) {
                                toast.error(
                                  `Maximum ${maxQuestions} questions allowed for this section`
                                );
                                updateSectionQuestionCount(idx, maxQuestions);
                              } else if (inputValue < 1) {
                                toast.error('Minimum 1 question required');
                                updateSectionQuestionCount(idx, 1);
                              } else {
                                updateSectionQuestionCount(idx, inputValue);
                              }
                            }}
                            disabled={
                              (section.question_banks || []).length === 0
                            }
                          />
                          <button
                            className="w-8 h-8 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 flex items-center justify-center text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            onClick={() => {
                              const currentCount =
                                sectionQuestionCounts[idx] || 5;
                              const maxQuestions =
                                calculateMaxQuestionsForSection(idx);
                              const newCount = Math.min(
                                maxQuestions,
                                currentCount + 1
                              );
                              updateSectionQuestionCount(idx, newCount);
                            }}
                            disabled={
                              (section.question_banks || []).length === 0
                            }
                          >
                            <span className="text-lg font-semibold">+</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
