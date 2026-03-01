// src/components/cards/ExamCard.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Eye, MoreHorizontal } from 'lucide-react';
import clsx from 'clsx';
import { StandardButton } from '../ui/StandardButton';
import { EditExamModal } from './EditRecentExamCard';
import type { Exam } from '../../api/examAPI';
import type { Course } from '../../types/course';

// ──────────────────────────────────────────────────────────────
// helpers (unchanged)
// ──────────────────────────────────────────────────────────────
const accentColors = {
  math: 'text-accent-emerald',
  physics: 'text-accent-indigo',
  chemistry: 'text-accent-amber',
  chem: 'text-accent-amber',
  biology: 'text-accent-green',
} as const;
type Subject = keyof typeof accentColors;

const formatLastOpened = (dateString?: string) => {
  if (!dateString) return 'Never opened';
  const diff = Date.now() - new Date(dateString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min${mins !== 1 ? 's' : ''} ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs !== 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days !== 1 ? 's' : ''} ago`;
};

// ──────────────────────────────────────────────────────────────
// component
// ──────────────────────────────────────────────────────────────
interface Props {
  exam: Exam;
  courses: Course[];
  onDelete: (exam: Exam) => void;
  onView?: (exam: Exam) => void;
  onSubmitEdit: (
    id: number,
    data: {
      title: string;
      exam_type: string;
      time_limit: number;
      course: number;
      description?: string;
      weight: number;
      required_to_pass: boolean;
    }
  ) => Promise<void>;
  isEditingLoading?: boolean;
  editError?: string | null;
}

export const ExamCard: React.FC<Props> = ({
  exam,
  courses,
  onDelete,
  onView,
  onSubmitEdit,
  isEditingLoading = false,
  editError = null,
}) => {
  const accent =
    accentColors[(exam.subject as Subject) ?? 'math'] || 'text-heading';

  // Generate a pastel gradient based on exam ID for consistent colors
  const getPastelGradient = (id: number) => {
    const gradients = [
      'from-pink-200 via-purple-200 to-indigo-200',
      'from-blue-200 via-cyan-200 to-teal-200',
      'from-green-200 via-emerald-200 to-teal-200',
      'from-yellow-200 via-orange-200 to-red-200',
      'from-purple-200 via-pink-200 to-rose-200',
      'from-indigo-200 via-blue-200 to-cyan-200',
      'from-teal-200 via-green-200 to-emerald-200',
      'from-orange-200 via-yellow-200 to-amber-200',
    ];
    return gradients[id % gradients.length];
  };

  // kebab‑menu state
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // edit‑modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const openEdit = () => {
    setMenuOpen(false);
    setIsEditModalOpen(true);
  };

  // ** new ** delete‑confirm state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const openDeleteConfirm = () => {
    setMenuOpen(false);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = () => {
    onDelete(exam);
    setShowDeleteConfirm(false);
  };

  return (
    <>
      <div className="relative bg-white rounded-xl shadow-sm overflow-visible border border-input-border hover:shadow-md duration-200">
        {/* banner */}
        <div
          className={`w-full h-36 bg-gradient-to-r ${getPastelGradient(exam.id)}`}
        />

        {/* body */}
        <div className="p-4">
          {/* header: title + menu */}
          <div className="flex items-start justify-between mb-3 relative overflow-visible">
            <div>
              <p
                className={clsx(
                  'text-sm font-semibold uppercase tracking-wide mb-1',
                  accent
                )}
              >
                {exam.course_code} — {exam.course_term}
              </p>
              <h3 className="font-semibold text-heading leading-snug line-clamp-1">
                {exam.title}
              </h3>
            </div>

            <div ref={ref} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="p-1 rounded-full bg-white hover:bg-gray-100 transition"
              >
                <MoreHorizontal size={18} className="text-gray-600" />
              </button>
              {menuOpen && (
                <ul className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50">
                  <li
                    className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
                    onClick={openEdit}
                  >
                    Edit
                  </li>
                  <li
                    className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
                    onClick={openDeleteConfirm}
                  >
                    Delete
                  </li>
                </ul>
              )}
            </div>
          </div>

          {/* metadata */}
          <p className="text-sm text-card-subtitle mt-1 mb-3">
            Last opened: {formatLastOpened(exam.updated_at)}
          </p>

          {/* bottom buttons */}
          <div className="flex gap-2 pt-3 border-t border-input-border">
            <StandardButton
              icon={<Eye size={16} />}
              color="primary-btn"
              className="flex-1 justify-center"
              onClick={() => onView?.(exam)}
            >
              View Exam
            </StandardButton>
          </div>
        </div>
      </div>

      {/* edit modal */}
      <EditExamModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        exam={exam}
        courses={courses}
        onSubmit={onSubmitEdit}
        isLoading={isEditingLoading}
        error={editError}
      />

      {/* delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-xs w-full">
            <h3 className="text-lg mb-6">
              Delete <span className="font-semibold">{exam.title}</span>?
            </h3>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
