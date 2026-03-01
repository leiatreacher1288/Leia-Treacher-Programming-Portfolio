import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StandardButton } from '../ui/StandardButton';
import { SearchBar } from '../ui/SearchBar';
import {
  Upload,
  Download,
  UserPlus,
  MoreHorizontal,
  Trash2,
  EyeOff,
  Eye,
} from 'lucide-react';
import { StudentModal } from './StudentModal';
import { studentAPI, type Student } from '../../api/studentAPI';
import type { Course } from '../../types/course';

interface StudentsTabProps {
  courseId: number;
  course?: Course;
}

export const StudentsTab: React.FC<StudentsTabProps> = ({ courseId }) => {
  // ───────────────────────── state ─────────────────────────
  const [students, setStudents] = useState<Student[]>([]);
  const [filtered, setFiltered] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAnonymousStudents, setHasAnonymousStudents] = useState(false);
  const [showPreferredNames, setShowPreferredNames] = useState(true); // New state for toggling display
  const fileInput = useRef<HTMLInputElement>(null);

  const [showAdd, setShowAdd] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editStudent, setEditStudent] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);
  const [showAnonymizeAllConfirm, setShowAnonymizeAllConfirm] = useState(false);

  // Check if any students have preferred names
  const hasStudentsWithPreferredNames = students.some(
    (s) => s.preferred_name && s.preferred_name !== ''
  );

  // ───────────────────────── load fn ─────────────────────────
  const loadStudents = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await studentAPI.getStudents(courseId);
      setStudents(data);
      setHasAnonymousStudents(data.some((s) => s.is_anonymous));
    } catch (err) {
      console.error('Error loading students:', err);
      setStudents([]);
      setHasAnonymousStudents(false);
    } finally {
      setIsLoading(false);
    }
  }, [courseId]);

  // ───────────────────────── effects ─────────────────────────
  // 1️⃣ load on mount / courseId change
  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  // 2️⃣ re-filter whenever students or searchQuery change
  useEffect(() => {
    const q = searchQuery.toLowerCase();
    setFiltered(
      students.filter((s) => {
        const isAnon = s.is_anonymous;
        const id = (
          isAnon ? `anon_${s.id}` : s.display_id || s.student_id || ''
        ).toLowerCase();

        // Search by all name variations
        const name = (s.name || '').toLowerCase();
        const effectiveName = (s.effective_name || '').toLowerCase();
        const displayName = (s.display_name || '').toLowerCase();
        const preferredName = (s.preferred_name || '').toLowerCase();

        const section = (s.section || '').toLowerCase();
        const email = (s.email || '').toLowerCase();

        return (
          id.includes(q) ||
          name.includes(q) ||
          effectiveName.includes(q) ||
          displayName.includes(q) ||
          preferredName.includes(q) ||
          section.includes(q) ||
          email.includes(q)
        );
      })
    );
  }, [students, searchQuery]);

  const handleImport = () => fileInput.current?.click();
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    try {
      await studentAPI.importStudents(courseId, f);
      await loadStudents();
    } catch (err) {
      console.error('Error importing students:', err);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await studentAPI.exportStudents(courseId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `students_${courseId}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting students:', err);
    }
  };

  // row CRUD
  const openAdd = () => setShowAdd(true);
  const openEdit = (s: Student) => {
    setEditStudent(s);
    setShowEdit(true);
  };

  const promptDelete = (s: Student) => {
    setDeleteTarget(s);
    setShowDeleteConfirm(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await studentAPI.deleteStudent(courseId, deleteTarget.id);
      await loadStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
    } finally {
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  // bulk actions
  const promptDeleteAll = () => setShowDeleteAllConfirm(true);
  const confirmDeleteAll = async () => {
    try {
      await studentAPI.deleteAllStudents(courseId);
      await loadStudents();
    } catch (err) {
      console.error('Error deleting all students:', err);
    } finally {
      setShowDeleteAllConfirm(false);
    }
  };

  const promptAnonymizeAll = () => setShowAnonymizeAllConfirm(true);
  const confirmAnonymizeAll = async () => {
    try {
      if (hasAnonymousStudents) {
        await studentAPI.deanonymizeAllStudents(courseId);
      } else {
        await studentAPI.anonymizeAllStudents(courseId);
      }
      await loadStudents();
    } catch (err) {
      console.error('Error (de)anonymizing students:', err);
    } finally {
      setShowAnonymizeAllConfirm(false);
    }
  };

  // ─────────────── table row actions ───────────────
  const RowActions: React.FC<{ student: Student }> = ({ student }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
      const handler = (e: MouseEvent) => {
        if (ref.current && !ref.current.contains(e.target as Node))
          setOpen(false);
      };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
      <div ref={ref} className="relative inline-block">
        <button
          onClick={() => setOpen((o) => !o)}
          className="p-1 rounded-full bg-white hover:bg-gray-100 transition"
        >
          <MoreHorizontal size={20} className="text-gray-600" />
        </button>
        {open && (
          <ul className="absolute right-0 mt-2 w-32 bg-white rounded-md shadow-lg z-50">
            <li
              onClick={() => {
                openEdit(student);
                setOpen(false);
              }}
              className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
            >
              Edit
            </li>
            <li
              onClick={() => {
                promptDelete(student);
                setOpen(false);
              }}
              className="px-4 py-2 text-red-600 hover:bg-gray-100 cursor-pointer"
            >
              Delete
            </li>
          </ul>
        )}
      </div>
    );
  };

  // ───────────────────────── render ─────────────────────────
  return (
    <div className="w-full px-8 py-6 bg-card rounded-xl shadow-sm mb-10 overflow-visible">
      <input
        type="file"
        accept=".csv"
        ref={fileInput}
        hidden
        onChange={onFileChange}
      />

      {/* action buttons + search */}
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <StandardButton
          onClick={handleImport}
          icon={<Upload size={16} />}
          color="secondary-btn"
        >
          Import
        </StandardButton>
        <StandardButton
          onClick={handleExport}
          icon={<Download size={16} />}
          color="secondary-btn"
        >
          Export
        </StandardButton>
        <StandardButton
          onClick={promptAnonymizeAll}
          icon={hasAnonymousStudents ? <Eye size={16} /> : <EyeOff size={16} />}
          color="secondary-btn"
        >
          {hasAnonymousStudents ? 'Deanonymize All' : 'Anonymize All'}
        </StandardButton>
        <StandardButton
          onClick={promptDeleteAll}
          icon={<Trash2 size={16} />}
          color="danger-btn"
        >
          Delete All
        </StandardButton>
        <StandardButton
          onClick={openAdd}
          icon={<UserPlus size={16} />}
          color="primary-btn"
        >
          Add Student
        </StandardButton>

        {/* search and toggle – updated layout */}
        <div className="ml-auto flex items-center gap-4">
          {hasStudentsWithPreferredNames && (
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showPreferredNames}
                onChange={(e) => setShowPreferredNames(e.target.checked)}
                className="rounded"
              />
              Show preferred names
            </label>
          )}
          <div className="w-80">
            <SearchBar
              placeholder="Search students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* loading / empty / table */}
      {isLoading ? (
        <div className="text-center py-20 text-gray-500">
          Loading students...
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-500 mb-6">No students found.</p>
          <div className="flex justify-center gap-3">
            <StandardButton
              onClick={handleImport}
              icon={<Upload size={16} />}
              color="secondary-btn"
            >
              Import Students
            </StandardButton>
            <StandardButton
              onClick={openAdd}
              icon={<UserPlus size={16} />}
              color="primary-btn"
            >
              Add Student
            </StandardButton>
          </div>
        </div>
      ) : (
        <table className="w-full bg-white border rounded-lg overflow-visible">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4 text-left font-semibold">Student&nbsp;ID</th>
              {showPreferredNames && (
                <th className="p-4 text-left font-semibold">
                  Preferred&nbsp;Name
                </th>
              )}
              <th className="p-4 text-left font-semibold">Legal&nbsp;Name</th>
              <th className="p-4 text-left font-semibold">Email</th>
              <th className="p-4 text-left font-semibold">Section</th>
              <th className="p-4 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const isAnon = s.is_anonymous;
              const anonTag = `ANON_${s.id}`;
              const displayId = isAnon
                ? anonTag
                : s.display_id || s.student_id || '-';

              // Determine what to show based on settings and data
              const hasPreferredName =
                !isAnon && s.preferred_name && s.preferred_name !== '';

              let displayName: string;
              let legalName: string;

              if (isAnon) {
                displayName = anonTag;
                legalName = '-';
              } else if (showPreferredNames && hasPreferredName) {
                // Show effective name (preferred + last name) when preferred names are enabled
                displayName =
                  s.effective_name || s.display_name || s.name || '-';
                legalName = s.name || '-';
              } else {
                // Show legal name in both columns when preferred names are disabled
                displayName = s.name || '-';
                legalName = s.name || '-';
              }

              const email = isAnon
                ? `anon_${s.id}@anonymous.local`
                : s.email || '-';

              return (
                <tr key={s.id} className="border-t hover:bg-gray-50">
                  <td className="p-4">{displayId}</td>
                  {showPreferredNames && <td className="p-4">{displayName}</td>}
                  <td className="p-4 text-gray-600">{legalName}</td>
                  <td className="p-4">{email}</td>
                  <td className="p-4">{s.section || '-'}</td>
                  <td className="p-4 text-right">
                    <RowActions student={s} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      {/* Info box about preferred names if any exist */}
      {hasStudentsWithPreferredNames && !isLoading && filtered.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> Some students have preferred names. When
            enabled, the Display Name column shows their preferred name with
            their last name. The Legal Name column always shows their official
            name for administrative purposes.
          </p>
        </div>
      )}

      {/* modals (unchanged logic) */}
      {showAdd && (
        <StudentModal
          title="Add Student"
          onClose={() => setShowAdd(false)}
          onSubmit={async (data) => {
            // Frontend validation - updated
            if (!data.student_id || !data.name) {
              alert('Student ID and Name are required.');
              return;
            }
            try {
              await studentAPI.createStudent(courseId, data);
              await loadStudents();
            } catch (err: any) {
              if (err?.response?.status === 400 && err?.response?.data) {
                alert(
                  'Failed to add student: ' +
                    (err.response.data.detail ||
                      JSON.stringify(err.response.data))
                );
              } else {
                alert('Failed to add student. Please check your input.');
              }
            }
          }}
        />
      )}
      {showEdit && editStudent && (
        <StudentModal
          title="Edit Student"
          initialData={editStudent}
          onClose={() => setShowEdit(false)}
          onSubmit={async (data) => {
            await studentAPI.updateStudent(courseId, editStudent.id, data);
            await loadStudents();
          }}
        />
      )}

      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
              Delete student with&nbsp;ID&nbsp;{deleteTarget.display_id}?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                No
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-80 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-6 text-center">
              Delete all registered students for this course?
            </h3>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteAllConfirm(false)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                No
              </button>
              <button
                onClick={confirmDeleteAll}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnonymizeAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
              {hasAnonymousStudents
                ? 'Deanonymize all students in this course?'
                : 'Anonymize all students in this course?'}
            </h3>
            <p className="text-sm text-gray-600 mb-6 text-center">
              {hasAnonymousStudents
                ? 'This will restore the original names and emails for all students.'
                : 'This will hide personal information (names & emails) for all students. You can still identify students by their anonymous IDs.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowAnonymizeAllConfirm(false)}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-medium py-3 px-4 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={confirmAnonymizeAll}
                className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-3 px-4 rounded-lg"
              >
                {hasAnonymousStudents ? 'Deanonymize All' : 'Anonymize All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
