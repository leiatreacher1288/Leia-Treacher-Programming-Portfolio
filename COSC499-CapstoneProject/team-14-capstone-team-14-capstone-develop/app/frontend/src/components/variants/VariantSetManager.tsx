// src/components/variants/VariantSetManager.tsx
import type { Variant } from '../../api/examAPI';
import {
  Download,
  Edit3,
  Lock,
  Unlock,
  RefreshCw,
  History,
  ChevronDown,
  MoreVertical,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Calendar,
  Eye,
  Clock,
} from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { StatusBadge } from '../ui/StatusBadge';
import clsx from 'clsx';
import { examAPI } from '../../api/examAPI';
import { useState, useEffect } from 'react';
import { VariantEditModal } from './VariantEditModal';
import { ExportIndividualVariantModal } from './ExportIndividualVariantModal';
import { HistoryModal } from './HistoryModal';
import ConfirmModal from '../ui/ConfirmModal';
import toast, { Toaster } from 'react-hot-toast';

// Types for Variant Sets
interface VariantSet {
  id: string;
  name: string;
  variants: Variant[];
  is_locked: boolean;
  created_at: string | Date;
  is_active: boolean;
}

// Export Individual Variant Modal Component
interface ExportIndividualVariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  variant: Variant;
  examTitle: string;
  examId: number;
}

// Lock Confirmation Modal Component
interface LockConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  setName: string;
}

// Delete Confirmation Modal Component
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  setName: string;
}

// Unlock Confirmation Modal Component
interface UnlockConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  setName: string;
  hasResults: boolean;
}

// History Modal Component
interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: VariantSet[];
}

// Lock Confirmation Modal
const LockConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  setName,
}: LockConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-50 w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Lock className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold">Lock Variant Set</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Locking this set will unlock your currently locked set. Continue?
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
            >
              Lock Set
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Delete Confirmation Modal
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  setName,
}: DeleteConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-50 w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            <h3 className="text-lg font-semibold">Delete Variant Set</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{setName}"? This action cannot be
            undone.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// Unlock Confirmation Modal
const UnlockConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  setName,
  hasResults,
}: UnlockConfirmationModalProps) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-50 w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <Unlock className="w-6 h-6 text-orange-600" />
            <h3 className="text-lg font-semibold">Unlock Variant Set</h3>
          </div>
          {hasResults ? (
            <>
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800 font-medium">
                    Warning: Results will be deleted
                  </span>
                </div>
                <p className="text-sm text-red-700 mt-1">
                  This variant set has imported results. Unlocking it will
                  permanently delete all associated results.
                </p>
              </div>
              <p className="text-gray-600 mb-6">
                Are you sure you want to unlock "{setName}"? This will delete
                all imported results for this variant set.
              </p>
            </>
          ) : (
            <p className="text-gray-600 mb-6">
              Are you sure you want to unlock "{setName}"?
            </p>
          )}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className={`flex-1 px-4 py-2 rounded-lg ${
                hasResults
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-orange-600 text-white hover:bg-orange-700'
              }`}
            >
              {hasResults ? 'Unlock & Delete Results' : 'Unlock'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

// History Modal

export interface VariantPreviewCardProps {
  variant: Variant;
  index: number;
  showEditedTag?: boolean;
  examTitle?: string;
  examId?: number;
}

// New interface for the redesigned component
export interface VariantSetManagerProps {
  examTitle?: string;
  examId?: number;
  onGenerateVariants?: () => Promise<void>;
  onLockSet?: (setId: string) => Promise<void>;
  onDeleteSet?: (setId: string) => Promise<void>;
  onEditVariant?: (variant: Variant) => void;
  onExportVariant?: (variant: Variant) => void;
  onCurrentVariantSetChange?: (variantSet: VariantSet | null) => void;
  prioritizeRecentSet?: boolean; // New prop to prioritize recent set over locked set
}

// Helper function for consistent time formatting
const formatLocalTime = (dateString: string | Date) => {
  try {
    const date =
      typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      return new Date().toLocaleString('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });
    }

    return date.toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch (e) {
    return new Date().toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  }
};

export const VariantSetManager = ({
  examTitle = 'Exam',
  examId,
  onGenerateVariants,
  onLockSet,
  onDeleteSet,
  onEditVariant,
  onExportVariant,
  onCurrentVariantSetChange,
  prioritizeRecentSet = false,
}: VariantSetManagerProps) => {
  const [selectedSetId, setSelectedSetId] = useState<string>('');
  const [showLockModal, setShowLockModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportingVariant, setExportingVariant] = useState<Variant | null>(
    null
  );
  const [showLockConfirmation, setShowLockConfirmation] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingVariant, setEditingVariant] = useState<Variant | null>(null);
  const [showLockConfirmModal, setShowLockConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [showUnlockConfirmModal, setShowUnlockConfirmModal] = useState(false);
  const [deletingVariant, setDeletingVariant] = useState<Variant | null>(null);
  const [variantSets, setVariantSets] = useState<VariantSet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load variant sets from API
  const loadVariantSets = async () => {
    if (!examId) return [];

    try {
      setIsLoading(true);
      console.log('Loading variant sets for exam:', examId);
      const response = await examAPI.getVariantSets(examId);
      console.log('Variant sets response:', response);
      const sets = response.variant_sets || [];

      if (sets.length > 0) {
        setVariantSets(sets);
        console.log('Loaded variant sets:', sets);
        return sets;
      } else {
        console.log('No variant sets found');
        return [];
      }
    } catch (error) {
      console.error('Failed to load variant sets:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Load variant sets on mount
  useEffect(() => {
    loadVariantSets();
  }, [examId]);

  // Set default selected set when variantSets change
  useEffect(() => {
    if (variantSets.length > 0) {
      // Check if current selectedSetId is still valid
      const currentSetExists = variantSets.find(
        (set) => set.id === selectedSetId
      );

      if (!currentSetExists) {
        // Current set no longer exists, select a new one
        const lockedSet = variantSets.find((set) => set.is_locked);
        const mostRecentSet = variantSets[variantSets.length - 1];

        if (prioritizeRecentSet && mostRecentSet) {
          // When coming from wizard, prioritize the most recent set
          setSelectedSetId(mostRecentSet.id);
        } else if (lockedSet) {
          // Default behavior: prioritize locked set
          setSelectedSetId(lockedSet.id);
        } else if (mostRecentSet) {
          // Fallback to most recent set
          setSelectedSetId(mostRecentSet.id);
        }
      }
    } else if (variantSets.length === 0 && selectedSetId) {
      // No sets available, clear selection
      setSelectedSetId('');
    }
  }, [variantSets, prioritizeRecentSet]);

  // Notify parent of current variant set changes
  useEffect(() => {
    if (onCurrentVariantSetChange) {
      const currentSet = variantSets.find((set) => set.id === selectedSetId);
      onCurrentVariantSetChange(currentSet || null);
    }
  }, [selectedSetId, variantSets, onCurrentVariantSetChange]);

  // After generation, always select the most recent set
  const handleGenerateAndSelect = async () => {
    if (onGenerateVariants) {
      console.log('DEBUG: Starting handleGenerateAndSelect');

      try {
        await onGenerateVariants();
        console.log('DEBUG: onGenerateVariants completed');

        // Show success toast immediately
        toast.success('Exam variants generated successfully!');

        // Then reload and select the new set
        const updatedSets = await loadVariantSets();
        console.log('DEBUG: loadVariantSets returned:', updatedSets);

        // Always select the most recent set after generation
        if (updatedSets && updatedSets.length > 0) {
          const mostRecentSet = updatedSets[updatedSets.length - 1];
          console.log('DEBUG: Most recent set:', mostRecentSet);
          setSelectedSetId(mostRecentSet.id);
        }
      } catch (error) {
        console.error('DEBUG: Error in handleGenerateAndSelect:', error);
        toast.error('Failed to generate variants');
      }
    } else {
      console.log('DEBUG: onGenerateVariants is not defined');
      toast.error('Generation function not available');
    }
  };

  // Close dropdown menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-menu')) {
        // Close all dropdowns
        document.querySelectorAll('[id^="dropdown-"]').forEach((dropdown) => {
          dropdown.classList.add('hidden');
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentSet = variantSets.find((set) => set.id === selectedSetId);
  const lockedSet = variantSets.find((set) => set.is_locked);
  const hasOtherLockedSet = lockedSet && lockedSet.id !== selectedSetId;

  // Debug logging for troubleshooting
  console.log('DEBUG: variantSets.length:', variantSets.length);
  console.log('DEBUG: selectedSetId:', selectedSetId);
  console.log('DEBUG: currentSet:', currentSet);
  console.log('DEBUG: lockedSet:', lockedSet);

  const handleLockSet = async () => {
    if (!currentSet) return;

    // Check if there's already a locked set
    const hasLockedSet = variantSets.some(
      (set) => set.is_locked && set.id !== currentSet.id
    );

    if (hasLockedSet) {
      setShowLockConfirmation(true);
      return;
    }

    await performLockSet();
  };

  const handleUnlockSet = async () => {
    if (!currentSet) return;

    // Check if this variant set has results (simplified check)
    const hasResults = currentSet.variants.some((v) => v.exported_at);

    if (hasResults) {
      // Show confirmation modal with warning
      setShowUnlockConfirmModal(true);
    } else {
      // Proceed with unlock directly
      await performUnlockSet();
    }
  };

  const performUnlockSet = async () => {
    if (!currentSet) return;

    try {
      console.log('Unlocking set:', currentSet.id);

      // Unlock all variants in the set
      for (const variant of currentSet.variants) {
        await examAPI.unlockVariant(variant.id);
      }

      // Reload variant sets to reflect the changes
      await loadVariantSets();

      console.log('Set unlocked successfully');
    } catch (error) {
      console.error('Failed to unlock set:', error);
      alert('Failed to unlock set. Please try again.');
    }
  };

  const performLockSet = async () => {
    if (!currentSet) return;

    try {
      console.log('Locking set:', currentSet.id);

      // Lock the first variant in the set - backend will lock all variants in the same set
      if (currentSet.variants.length > 0) {
        const response = await examAPI.lockVariant(currentSet.variants[0].id);
        console.log('Lock response:', response);

        // Check if there was an error in the response
        if (!response.message || response.message.includes('error')) {
          alert(`Failed to lock set: ${response.message || 'Unknown error'}`);
          return;
        }
      }

      // Reload variant sets to reflect the changes
      await loadVariantSets();

      console.log('Set locked successfully');
    } catch (error: any) {
      console.error('Failed to lock set:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to lock set. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteSet = async () => {
    if (!currentSet) return;

    try {
      console.log('Deleting set:', currentSet.id);

      // Delete all variants in the set
      for (const variant of currentSet.variants) {
        const response = await examAPI.deleteVariant(variant.id);
        console.log('Delete response:', response);
      }

      // Reload variant sets to reflect the changes
      await loadVariantSets();
      setShowDeleteModal(false);

      console.log('Set deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete set:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to delete set. Please try again.';
      alert(errorMessage);
    }
  };

  const handleEditVariant = async (variant: Variant) => {
    console.log('Edit variant:', variant);

    try {
      // Fetch the complete variant data with questions
      const fullVariant = await examAPI.getVariantDetail(variant.id);
      console.log('Full variant data:', fullVariant);

      // Transform the variant to match VariantEditModal's expected format
      const transformedVariant = {
        id: fullVariant.id,
        version_label: fullVariant.version_label,
        is_locked: fullVariant.is_locked,
        questions: (fullVariant.questions || []).map((q, index) => ({
          id: q.id || index,
          question: q.question, // This is the QuestionSerializer data
          order: q.order || index,
          randomized_choices: q.randomized_choices || {},
          randomized_correct_answer: q.randomized_correct_answer || [],
        })),
      };

      // Check if the current set is locked to determine read-only mode
      const isReadOnly = currentSet?.is_locked || false;

      console.log('Transformed variant for edit:', transformedVariant);
      setEditingVariant({ ...transformedVariant, isReadOnly } as any);
      setShowEditModal(true);
    } catch (error) {
      console.error('Failed to fetch variant details:', error);
      alert('Failed to load variant for editing. Please try again.');
    }
  };

  const handleExportVariant = (variant: Variant) => {
    setExportingVariant(variant);
    setShowExportModal(true);
  };

  const handleDeleteIndividualVariant = (variant: Variant) => {
    setDeletingVariant(variant);
    setShowDeleteConfirmModal(true);
  };

  const performDeleteIndividualVariant = async () => {
    if (!deletingVariant) return;

    try {
      console.log('Deleting individual variant:', deletingVariant.id);

      const response = await examAPI.deleteVariant(deletingVariant.id);
      console.log('Delete response:', response);

      // Reload variant sets to reflect the changes
      await loadVariantSets();
      setShowDeleteConfirmModal(false);
      setDeletingVariant(null);

      console.log('Individual variant deleted successfully');
    } catch (error: any) {
      console.error('Failed to delete individual variant:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to delete variant. Please try again.';
      alert(errorMessage);
    }
  };

  const handleDeleteMultipleSets = async (setIds: string[]) => {
    try {
      console.log('Deleting multiple sets:', setIds);

      // Find the sets to delete
      const setsToDelete = variantSets.filter((set) => setIds.includes(set.id));

      // Delete all variants in each set
      for (const set of setsToDelete) {
        for (const variant of set.variants) {
          await examAPI.deleteVariant(variant.id);
        }
      }

      // Reload variant sets to reflect the changes
      await loadVariantSets();

      console.log('Multiple sets deleted successfully');
      toast.success(
        `Successfully deleted ${setIds.length} variant set${setIds.length > 1 ? 's' : ''}`
      );
    } catch (error: any) {
      console.error('Failed to delete multiple sets:', error);
      const errorMessage =
        error.response?.data?.error ||
        error.message ||
        'Failed to delete sets. Please try again.';
      toast.error(errorMessage);
    }
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        {/* Header with History and Regenerate buttons */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  Generated Variants
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Review, edit, and export your generated variants
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <StandardButton
                onClick={() => setShowHistoryModal(true)}
                color="secondary-btn"
                size="sm"
                icon={<History size={16} />}
                title="View variant generation history"
              >
                History
              </StandardButton>
              <StandardButton
                onClick={handleGenerateAndSelect}
                color="primary-btn"
                size="sm"
                icon={<RefreshCw size={16} />}
                title="Generate new variant set"
              >
                Regenerate
              </StandardButton>
            </div>
          </div>

          {/* Variant Set Selector Row */}
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Viewing Variant Set:
              </label>
              <select
                value={selectedSetId}
                onChange={(e) => setSelectedSetId(e.target.value)}
                className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
              >
                {variantSets.map((set) => {
                  const localTime = formatLocalTime(set.created_at);

                  return (
                    <option
                      key={set.id}
                      value={set.id}
                      disabled={set.is_locked && set.id === selectedSetId}
                    >
                      {localTime} {set.is_locked ? '(Locked)' : '(Draft)'}
                    </option>
                  );
                })}
              </select>
            </div>
            {currentSet && (
              <StandardButton
                onClick={
                  currentSet.is_locked
                    ? () => setShowUnlockConfirmModal(true)
                    : () => setShowLockConfirmModal(true)
                }
                color={
                  currentSet.is_locked
                    ? 'secondary-btn'
                    : hasOtherLockedSet
                      ? 'secondary-btn'
                      : 'primary-btn'
                }
                size="sm"
                icon={
                  currentSet.is_locked ? (
                    <Unlock size={16} />
                  ) : (
                    <Lock size={16} />
                  )
                }
                disabled={hasOtherLockedSet && !currentSet.is_locked}
                title={
                  currentSet.is_locked
                    ? 'Unlock this set to allow editing and deactivate it for results/analytics'
                    : hasOtherLockedSet
                      ? '⚠️ You must unlock the other locked set first before locking this one'
                      : 'Lock this set to prevent editing and activate it for results/analytics. Only one set can be locked at a time. Locked sets are used for official exams and cannot be modified.'
                }
                className={`h-9 ${hasOtherLockedSet && !currentSet.is_locked ? 'opacity-50 cursor-not-allowed' : ''}`}
                style={
                  hasOtherLockedSet && !currentSet.is_locked
                    ? { pointerEvents: 'auto' }
                    : {}
                }
              >
                {currentSet.is_locked ? 'Unlock This Set' : 'Lock This Set'}
              </StandardButton>
            )}
            {currentSet && !currentSet.is_locked && (
              <StandardButton
                onClick={() => setShowDeleteModal(true)}
                color="danger-outline"
                size="sm"
                icon={<Trash2 size={16} />}
                title="Delete this variant set"
                className="h-9"
              >
                Delete
              </StandardButton>
            )}
          </div>
        </div>

        {/* Variants Grid */}
        <div className="p-6">
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">Loading variant sets...</p>
            </div>
          ) : currentSet ? (
            <>
              {/* Locked State Banner */}
              {currentSet.is_locked && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium text-yellow-800">
                      This set is locked and cannot be edited
                    </span>
                  </div>
                </div>
              )}

              {/* Variants Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentSet.variants.map((variant) => (
                  <div
                    key={variant.id}
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow h-full flex flex-col relative"
                  >
                    {/* Kebab Menu - Top Right */}
                    {!currentSet.is_locked && (
                      <div className="absolute top-2 right-2">
                        <StandardButton
                          onClick={() => {
                            // Toggle dropdown for this specific variant
                            const dropdownId = `dropdown-${variant.id}`;
                            const dropdown =
                              document.getElementById(dropdownId);
                            if (dropdown) {
                              dropdown.classList.toggle('hidden');
                            }
                          }}
                          color="secondary-btn"
                          size="sm"
                          icon={<MoreVertical size={14} />}
                          className="px-1 py-1 min-w-0"
                          title="More options"
                        />

                        {/* Dropdown Menu */}
                        <div
                          id={`dropdown-${variant.id}`}
                          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10 hidden min-w-32 dropdown-menu"
                        >
                          <button
                            onClick={() =>
                              handleDeleteIndividualVariant(variant)
                            }
                            className="w-full px-3 py-2 text-left text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 whitespace-nowrap"
                          >
                            <Trash2 size={14} />
                            Delete Variant
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-semibold text-gray-900">
                          Variant {variant.version_label}
                        </h4>
                        {variant.is_locked && (
                          <div title="This variant is locked">
                            <Lock className="w-4 h-4 text-yellow-600" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <span className="rounded-full bg-blue-100 text-blue-800 text-xs px-2 py-0.5 font-medium">
                        {variant.question_count ||
                          variant.questions?.length ||
                          0}{' '}
                        Questions
                      </span>
                    </div>

                    {/* Variant Actions */}
                    <div className="flex gap-2 mt-auto">
                      {!currentSet.is_locked ? (
                        <StandardButton
                          onClick={() => handleEditVariant(variant)}
                          color="primary-btn"
                          size="sm"
                          icon={<Edit3 size={14} />}
                          className="flex-1 min-w-0"
                          title="Edit this variant"
                        >
                          Edit
                        </StandardButton>
                      ) : (
                        <StandardButton
                          onClick={() => handleEditVariant(variant)}
                          color="secondary-btn"
                          size="sm"
                          icon={<Eye size={14} />}
                          className="flex-1 min-w-0"
                          title="View variant in read-only mode"
                        >
                          View
                        </StandardButton>
                      )}
                      <StandardButton
                        onClick={() => handleExportVariant(variant)}
                        color="secondary-btn"
                        size="sm"
                        icon={<Download size={14} />}
                        className="flex-1 min-w-0"
                        title="Export this variant"
                      >
                        Export
                      </StandardButton>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No variant sets available</p>
              <StandardButton
                onClick={onGenerateVariants}
                color="primary-btn"
                icon={<RefreshCw size={16} />}
              >
                Generate First Set
              </StandardButton>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <LockConfirmationModal
        isOpen={showLockConfirmation}
        onClose={() => setShowLockConfirmation(false)}
        onConfirm={() => {
          performLockSet();
          setShowLockConfirmation(false);
        }}
        setName={currentSet?.name || ''}
      />

      {/* Delete Set Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        title="Delete Variant Set"
        description={`Are you sure you want to delete the variant set "${currentSet ? formatLocalTime(currentSet.created_at) : ''}"? This will permanently remove all variants in this set and cannot be undone.`}
        confirmText="Delete Set"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
        onConfirm={() => {
          setShowDeleteModal(false);
          handleDeleteSet();
        }}
        onCancel={() => setShowDeleteModal(false)}
      />

      {/* Unlock Set Confirmation Modal */}
      <ConfirmModal
        open={showUnlockConfirmModal}
        title="Unlock Variant Set"
        description={`Are you sure you want to unlock the variant set "${currentSet?.name}"? This will allow editing and may affect any uploaded results if students have already taken this exam.`}
        confirmText="Unlock Set"
        cancelText="Cancel"
        variant="warning"
        icon="unlock"
        onConfirm={() => {
          setShowUnlockConfirmModal(false);
          handleUnlockSet();
        }}
        onCancel={() => setShowUnlockConfirmModal(false)}
      />

      <HistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        sets={variantSets}
        onDeleteSets={handleDeleteMultipleSets}
      />

      {showExportModal && exportingVariant && (
        <ExportIndividualVariantModal
          isOpen={showExportModal}
          onClose={() => {
            setShowExportModal(false);
            setExportingVariant(null);
          }}
          variant={exportingVariant}
          examTitle={examTitle}
          examId={examId || 0}
        />
      )}

      {showEditModal && editingVariant && (
        <VariantEditModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingVariant(null);
          }}
          variant={editingVariant}
          onSave={async (variantId, questions) => {
            try {
              // Transform questions back to the format expected by the API
              const examQuestions = questions.map((q) => ({
                id: q.question.id,
                question: {
                  ...q.question,
                  explanation: q.question.explanation || '',
                },
                order: q.order,
                points: q.question.points || 1,
              }));

              await examAPI.updateVariant(variantId, examQuestions);
              await loadVariantSets();
              setShowEditModal(false);
              setEditingVariant(null);
            } catch (error) {
              console.error('Failed to save variant:', error);
            }
          }}
          onExport={(variantId) => {
            handleExportVariant(editingVariant);
          }}
        />
      )}

      {/* Lock Confirmation Modal */}
      <ConfirmModal
        open={showLockConfirmModal}
        title="Lock Variant Set"
        description="Locking this variant set will make it the official version for this exam. Locked sets cannot be edited and are used for student assignments and analytics. Only one set can be locked at a time."
        confirmText="Lock Set"
        cancelText="Cancel"
        variant="primary"
        icon="lock"
        onConfirm={() => {
          setShowLockConfirmModal(false);
          handleLockSet();
        }}
        onCancel={() => setShowLockConfirmModal(false)}
      />

      {/* Delete Individual Variant Confirmation Modal */}
      <ConfirmModal
        open={showDeleteConfirmModal}
        title="Delete Variant"
        description={`Are you sure you want to delete Variant ${deletingVariant?.version_label}? This action cannot be undone and will remove this variant from the set.`}
        confirmText="Delete Variant"
        cancelText="Cancel"
        variant="danger"
        icon="trash"
        onConfirm={() => {
          setShowDeleteConfirmModal(false);
          performDeleteIndividualVariant();
        }}
        onCancel={() => {
          setShowDeleteConfirmModal(false);
          setDeletingVariant(null);
        }}
      />

      {/* Unlock Confirmation Modal */}
      <UnlockConfirmationModal
        isOpen={showUnlockConfirmModal}
        onClose={() => setShowUnlockConfirmModal(false)}
        onConfirm={performUnlockSet}
        setName={currentSet?.name || 'Variant Set'}
        hasResults={currentSet?.variants.some((v) => v.exported_at) || false}
      />

      {/* Toast Notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#ffffff',
            color: '#374151',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow:
              '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        }}
      />
    </>
  );
};

// Individual variant card component
export const VariantPreviewCard = ({
  variant,
  index,
  showEditedTag = false,
  examTitle = 'Exam',
  examId,
}: VariantPreviewCardProps) => {
  const [showExportModal, setShowExportModal] = useState(false);

  const difficultyColors = {
    Easy: 'text-accent-emerald',
    Medium: 'text-accent-amber',
    Hard: 'text-accent-indigo',
  };

  // derive counts from the questions array
  const difficultySummary = {
    Easy: variant.questions.filter((q) => q.question.difficulty === 'Easy')
      .length,
    Medium: variant.questions.filter((q) => q.question.difficulty === 'Medium')
      .length,
    Hard: variant.questions.filter((q) => q.question.difficulty === 'Hard')
      .length,
  };

  // both exports = valid; exactly one = edited; none = issues
  const status =
    variant.docx_exported && variant.pdf_exported
      ? 'valid'
      : variant.docx_exported || variant.pdf_exported
        ? 'edited'
        : 'issues';

  const handleExportWithModal = () => {
    setShowExportModal(true);
  };

  return (
    <>
      <div
        className={clsx(
          'flex items-center justify-between py-3 px-4 border-b border-border-light last:border-b-0',
          index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
        )}
      >
        {/* Left side: info */}
        <div className="flex items-center gap-6 min-w-0 flex-1">
          <div className="text-lg font-bold text-heading w-10">
            {variant.version_label}
          </div>
          <div className="text-sm text-card-info w-24">
            {variant.questions.length} Questions
          </div>
          <div className="flex gap-2 text-xs">
            <span className={clsx('font-semibold', difficultyColors.Easy)}>
              Easy {difficultySummary.Easy}
            </span>
            <span className={clsx('font-semibold', difficultyColors.Medium)}>
              Medium {difficultySummary.Medium}
            </span>
            <span className={clsx('font-semibold', difficultyColors.Hard)}>
              Hard {difficultySummary.Hard}
            </span>
          </div>
          <StatusBadge status={status} className="ml-4" />
          {showEditedTag && variant.is_locked && (
            <span className="ml-2 text-accent-amber text-xs font-medium">
              Edited Since Export
            </span>
          )}
        </div>

        {/* Right side: actions */}
        <div className="flex items-center gap-2">
          <StandardButton
            icon={<Edit3 size={16} />}
            color="primary-btn"
            className="px-2 py-1"
            onClick={() => alert('Manage variant')}
          >
            Manage
          </StandardButton>
          <StandardButton
            icon={<Download size={16} />}
            color="secondary-btn"
            className="px-2 py-1"
            onClick={handleExportWithModal}
          >
            Export
          </StandardButton>
          <StandardButton
            icon={<Download size={16} />}
            color="danger-outline"
            className="px-2 py-1"
            onClick={() => alert('Delete variant')}
          >
            Delete
          </StandardButton>
        </div>
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <ExportIndividualVariantModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          variant={variant}
          examTitle={examTitle}
          examId={examId || 0}
        />
      )}
    </>
  );
};
