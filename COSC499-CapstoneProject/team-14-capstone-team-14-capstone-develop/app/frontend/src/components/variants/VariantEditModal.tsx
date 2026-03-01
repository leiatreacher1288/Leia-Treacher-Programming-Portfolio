import React, { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { QuestionBankCard } from '../QuestionBank/QuestionBankCard';
import { mapApiQuestionToFrontend } from '../../utils/questionMapper';
import { examAPI } from '../../api/examAPI';
import type { VariantQuestion } from '../../types/exam';
import ConfirmModal from '../ui/ConfirmModal';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface VariantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: {
    id: number;
    version_label: string;
    questions: VariantQuestion[];
    is_locked?: boolean;
  } | null;
  onSave: (
    variantId: number,
    questions: VariantQuestion[]
  ) => void | Promise<void>;
  onExport: (variantId: number) => void;
}

// Sortable item wrapper for dnd-kit
function SortableQuestionItem({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 50 : 'auto',
      }}
      {...attributes}
      {...listeners}
      className="relative"
    >
      {children}
    </li>
  );
}

export const VariantEditModal: React.FC<VariantEditModalProps> = ({
  isOpen,
  onClose,
  variant,
  onSave,
}: VariantEditModalProps) => {
  const [questions, setQuestions] = useState<VariantQuestion[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  useEffect(() => {
    if (variant && Array.isArray(variant.questions)) {
      console.log('Loading variant questions:', variant.questions);
      if (
        variant.questions.length > 0 &&
        variant.questions.every(
          (q: VariantQuestion) =>
            q &&
            typeof q.id !== 'undefined' &&
            q.question &&
            typeof q.question.id !== 'undefined'
        )
      ) {
        const cloned = variant.questions.map((q: VariantQuestion) =>
          JSON.parse(JSON.stringify(q))
        );

        // Sort questions by order to match the exported files exactly
        // The exported files show all questions in order by their order field
        const sortedQuestions = cloned.sort(
          (a: VariantQuestion, b: VariantQuestion) => {
            return (a.order || 0) - (b.order || 0);
          }
        );

        setQuestions(sortedQuestions);
      } else {
        setQuestions([]);
      }
    } else {
      setQuestions([]);
    }
  }, [variant]);

  const handleRemoveQuestion = (questionId: string) => {
    setQuestionToDelete(questionId);
    setShowDeleteModal(true);
  };

  const confirmRemoveQuestion = async () => {
    if (!variant || !questionToDelete) return;
    setIsSaving(true);
    setError(null);
    try {
      await examAPI.removeQuestionFromVariant(
        variant.id,
        Number(questionToDelete)
      );
      setQuestions((prev: VariantQuestion[]) =>
        prev.filter(
          (q: VariantQuestion) => q.question.id.toString() !== questionToDelete
        )
      );
      setShowDeleteModal(false);
      setQuestionToDelete(null);
      if (onSave) {
        onSave(variant.id, []);
      }
      setError(null);
      toast.success('Question removed from variant');
    } catch (error) {
      setError('Failed to remove question from variant.');
      toast.error('Failed to remove question from variant');
      console.error('Failed to remove question from variant:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = questions.findIndex(
        (q) => q.id.toString() === active.id
      );
      const newIndex = questions.findIndex((q) => q.id.toString() === over.id);
      setQuestions((items) => arrayMove(items, oldIndex, newIndex));
    }
  };

  const handleSaveOrder = async () => {
    if (!variant) return;
    setIsSaving(true);
    setError(null);
    try {
      const questionIds = questions.map((q) => q.question.id);
      console.log('Saving order for variant:', variant.id);
      console.log('Question IDs in new order:', questionIds);

      await examAPI.reorderVariantQuestions(variant.id, questionIds);

      // Update the questions with the new order
      const updatedQuestions = questions.map((q, index) => ({
        ...q,
        order: index + 1,
      }));

      // Update local state immediately
      setQuestions(updatedQuestions);

      toast.success('Order saved successfully!', {
        duration: 2000,
        icon: '✅',
      });

      if (onSave) {
        await onSave(variant.id, updatedQuestions);
      }
    } catch (error) {
      console.error('Failed to save order:', error);
      setError('Failed to save order.');
      toast.error('Failed to save order. Please try again.', {
        duration: 3000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen || !variant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Edit Variant {variant.version_label}
            </h2>
            <p className="text-gray-600 mt-1">
              {variant.is_locked
                ? 'This variant has been exported and is locked'
                : 'Edit questions, drag to reorder, or remove questions'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!variant.is_locked && (
              <StandardButton
                color="primary-btn"
                onClick={handleSaveOrder}
                disabled={isSaving}
                className="flex items-center gap-2"
              >
                {isSaving ? 'Saving...' : 'Save Changes'}
              </StandardButton>
            )}
            <StandardButton
              variant="default"
              aria-label="Close"
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-2 text-black rounded-lg p-2"
            >
              <X size={20} />
            </StandardButton>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {variant.is_locked ? (
            // Locked variant - read-only view
            <div className="p-6 overflow-y-auto h-full">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <Eye size={20} className="text-yellow-600" />
                  <span className="font-medium text-yellow-800">
                    Variant Locked
                  </span>
                </div>
                <p className="text-yellow-700 text-sm mt-1">
                  This variant has been exported and cannot be edited. You can
                  only view the questions.
                </p>
              </div>

              <div className="space-y-4">
                {questions.map((q: VariantQuestion, index: number) => (
                  <div key={q.id} className="relative">
                    {/* Section header if this question has a section and it's the first question or different from the previous one */}
                    {q.section &&
                      (index === 0 ||
                        questions[index - 1]?.section?.id !== q.section.id) && (
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <h3 className="text-sm font-semibold text-blue-800">
                            {q.section.title}
                          </h3>
                          {q.section.instructions && (
                            <p className="text-xs text-blue-600 mt-1">
                              {q.section.instructions}
                            </p>
                          )}
                        </div>
                      )}
                    {/* Question card */}
                    <QuestionBankCard
                      question={mapApiQuestionToFrontend({
                        ...q.question,
                        choices: q.randomized_choices || q.question.choices,
                        correct_answer:
                          q.randomized_correct_answer ||
                          q.question.correct_answer,
                      })}
                      isSelected={false}
                      questionNumber={index + 1}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            // Editable variant
            <div className="p-6 overflow-y-auto h-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={questions.map((q) => q.id.toString())}
                  strategy={verticalListSortingStrategy}
                >
                  <ul className="space-y-4">
                    {questions
                      .filter(
                        (q: VariantQuestion) =>
                          q &&
                          typeof q.id !== 'undefined' &&
                          q.question &&
                          typeof q.question.id !== 'undefined'
                      )
                      .map((value: VariantQuestion, index: number) => {
                        return (
                          <SortableQuestionItem
                            key={value.id}
                            id={value.id.toString()}
                          >
                            <div className="relative">
                              {/* Section header if this question has a section and it's the first question or different from the previous one */}
                              {value.section &&
                                (index === 0 ||
                                  questions[index - 1]?.section?.id !==
                                    value.section.id) && (
                                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                    <h3 className="text-sm font-semibold text-blue-800">
                                      {value.section.title}
                                    </h3>
                                    {value.section.instructions && (
                                      <p className="text-xs text-blue-600 mt-1">
                                        {value.section.instructions}
                                      </p>
                                    )}
                                  </div>
                                )}
                              {/* Question card */}
                              <QuestionBankCard
                                key={`${value.question.id}-${JSON.stringify(value.question.choices)}-${JSON.stringify(value.question.correct_answer)}`}
                                question={mapApiQuestionToFrontend({
                                  ...value.question,
                                  choices:
                                    value.randomized_choices ||
                                    value.question.choices,
                                  correct_answer:
                                    value.randomized_correct_answer ||
                                    value.question.correct_answer,
                                })}
                                isSelected={false}
                                onDelete={() =>
                                  handleRemoveQuestion(
                                    value.question.id.toString()
                                  )
                                }
                                context="exam"
                                questionNumber={index + 1}
                              />
                            </div>
                          </SortableQuestionItem>
                        );
                      })}
                  </ul>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Confirm Delete Modal */}
        <ConfirmModal
          open={showDeleteModal}
          title="Remove Question from Variant?"
          description="This will permanently remove the question from this variant. Are you sure you want to proceed?"
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={confirmRemoveQuestion}
          onCancel={() => {
            setShowDeleteModal(false);
            setQuestionToDelete(null);
          }}
          loading={isSaving}
        />
      </div>
    </div>
  );
};
