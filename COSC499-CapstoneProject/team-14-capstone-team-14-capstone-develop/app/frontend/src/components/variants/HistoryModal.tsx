import { Clock, MoreVertical, Trash2, Check } from 'lucide-react';
import { StandardButton } from '../ui/StandardButton';
import { useState } from 'react';

interface VariantSet {
  id: string;
  name: string;
  variants: any[];
  is_locked: boolean;
  created_at: string | Date;
  is_active: boolean;
}

interface HistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  sets: VariantSet[];
  onDeleteSets?: (setIds: string[]) => void;
}

export const HistoryModal = ({
  isOpen,
  onClose,
  sets,
  onDeleteSets,
}: HistoryModalProps) => {
  const [selectedSets, setSelectedSets] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleSelectSet = (setId: string) => {
    setSelectedSets((prev) =>
      prev.includes(setId)
        ? prev.filter((id) => id !== setId)
        : [...prev, setId]
    );
  };

  const handleSelectAll = () => {
    const nonLockedSets = sets
      .filter((set) => !set.is_locked)
      .map((set) => set.id);
    setSelectedSets(nonLockedSets);
  };

  const handleDeleteSelected = async () => {
    if (!onDeleteSets || selectedSets.length === 0) return;

    setIsDeleting(true);
    try {
      await onDeleteSets(selectedSets);
      setSelectedSets([]);
    } catch (error) {
      console.error('Error deleting sets:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50" onClick={onClose} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg z-50 w-full max-w-2xl mx-4">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Variant Set History
              </h3>
            </div>
            {selectedSets.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  {selectedSets.length} selected
                </span>
                <StandardButton
                  onClick={handleDeleteSelected}
                  color="danger-btn"
                  size="sm"
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete Selected'}
                </StandardButton>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-600 mb-6">
            View previously generated variant sets
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-2 mb-4">
            <StandardButton
              onClick={handleSelectAll}
              color="secondary-btn"
              size="sm"
            >
              Select All Non-Locked
            </StandardButton>
            {selectedSets.length > 0 && (
              <StandardButton
                onClick={() => setSelectedSets([])}
                color="secondary-btn"
                size="sm"
              >
                Clear Selection
              </StandardButton>
            )}
          </div>

          {/* Content */}
          <div className="space-y-0 max-h-96 overflow-y-auto">
            {sets.map((set, index) => {
              // Handle both string and Date types, and add fallback for invalid dates
              let createdAt;
              try {
                createdAt =
                  typeof set.created_at === 'string'
                    ? new Date(set.created_at)
                    : set.created_at;
                if (isNaN(createdAt.getTime())) {
                  createdAt = new Date(); // fallback
                }
              } catch (e) {
                createdAt = new Date(); // fallback
              }

              // Convert UTC time to local timezone for display
              const localTime = new Date(set.created_at).toLocaleString(
                'en-US',
                {
                  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                }
              );

              return (
                <div
                  key={set.id}
                  className={`py-3 px-4 flex flex-col ${
                    index < sets.length - 1 ? 'border-b border-gray-200' : ''
                  }`}
                >
                  {/* Primary line */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedSets.includes(set.id)}
                        onChange={() => handleSelectSet(set.id)}
                        disabled={set.is_locked}
                        className={`w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 ${
                          set.is_locked
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer'
                        }`}
                      />

                      <div>
                        <p className="font-medium text-gray-900">{localTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Variant count badge */}
                      <span className="rounded-full bg-gray-100 text-gray-800 text-xs px-2 py-0.5 font-medium">
                        {set.variants.length} variants
                      </span>

                      {/* Question count badge */}
                      <span className="rounded-full bg-green-100 text-green-800 text-xs px-2 py-0.5 font-medium">
                        {set.variants.length > 0
                          ? set.variants[0].questions?.length || 0
                          : 0}{' '}
                        questions per variant
                      </span>

                      {/* Status badge */}
                      {set.is_locked ? (
                        <span className="rounded-full bg-yellow-100 text-yellow-800 text-xs px-2 py-0.5 font-medium">
                          Locked
                        </span>
                      ) : (
                        <span className="rounded-full bg-blue-100 text-blue-800 text-xs px-2 py-0.5 font-medium">
                          Draft
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end">
            <StandardButton onClick={onClose} color="secondary-btn" size="sm">
              Close
            </StandardButton>
          </div>
        </div>
      </div>
    </>
  );
};
