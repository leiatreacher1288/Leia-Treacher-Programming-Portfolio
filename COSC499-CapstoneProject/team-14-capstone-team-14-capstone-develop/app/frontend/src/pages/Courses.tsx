// src/pages/Courses.tsx
import { useEffect, useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { CourseCard } from '../components/cards/CourseCard';
import { AddCourseModal } from '../components/AddCourseModal';
import { EditCourseModal } from '../components/EditCourseModal';
import { CollaborationInvitesModal } from '../components/CollaborationInviteModal';
import { CollaborationInvitesButton } from '../components/ui/CollaborationInvitesButton';
import { courseAPI } from '../api/courseAPI';
import type { Course } from '../types/course';
import { SearchBar } from '../components/ui/SearchBar';
import { ExportCourseModal } from '../components/ui/ExportCourseModal';

// Add this type for invites
interface CourseInvite {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  inviterName: string;
  inviterEmail: string;
  role: 'SEC' | 'TA' | 'OTH';
  permissions: 'FULL' | 'LIMITED' | 'NONE';
  createdAt: string;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  // modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState<Course | null>(null);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);
  const [isInvitesOpen, setIsInvitesOpen] = useState(false);
  const [courseToExport, setCourseToExport] = useState<Course | null>(null);
  const handleExportRequest = (course: Course) => setCourseToExport(course);

  // invites state
  const [invites, setInvites] = useState<CourseInvite[]>([]);
  const [invitesLoading, setInvitesLoading] = useState(false);

  // filters & search
  const [selectedTerm, setSelectedTerm] = useState('All Terms');
  const [selectedYear, setSelectedYear] = useState('All Years');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCourses();
    loadInvites();
  }, []);

  useEffect(() => {
    let filtered = courses;
    if (selectedTerm !== 'All Terms') {
      filtered = filtered.filter((c) => c.term === selectedTerm);
    }
    if (selectedYear !== 'All Years') {
      filtered = filtered.filter((c) => c.term.includes(selectedYear));
    }
    if (searchQuery) {
      filtered = filtered.filter(
        (c) =>
          c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredCourses(filtered);
  }, [courses, selectedTerm, selectedYear, searchQuery]);

  async function loadCourses() {
    setIsLoading(true);
    try {
      const data = await courseAPI.getCourses();
      setCourses(data);
      setFilteredCourses(data);
    } catch (err) {
      console.error('Failed to load courses:', err);
    } finally {
      setIsLoading(false);
    }
  }

  async function loadInvites() {
    setInvitesLoading(true);
    try {
      // You'll need to add this API endpoint
      const data = await courseAPI.getPendingInvites();
      setInvites(data);
    } catch (err) {
      console.error('Failed to load invites:', err);
    } finally {
      setInvitesLoading(false);
    }
  }

  // INVITES HANDLERS
  const handleAcceptInvite = async (inviteId: number) => {
    await courseAPI.acceptInvite(inviteId);
    // Remove from invites list and reload courses
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
    loadCourses(); // Reload to show the new course
  };

  const handleDeclineInvite = async (inviteId: number) => {
    await courseAPI.declineInvite(inviteId);
    // Remove from invites list
    setInvites((prev) => prev.filter((inv) => inv.id !== inviteId));
  };

  // CREATE
  const handleCreate = async (payload: {
    code: string;
    name: string;
    description: string;
    term: string;
    banner?: string;
  }) => {
    const newCourse = await courseAPI.createCourse(payload);
    setCourses((prev) => [newCourse, ...prev]);
    setFilteredCourses((prev) => [newCourse, ...prev]);
    setIsCreateOpen(false);
  };

  // EDIT
  const handleEditRequest = (course: Course) => setCourseToEdit(course);
  const handleConfirmEdit = async (payload: {
    code: string;
    name: string;
    term: string;
    banner?: string;
  }) => {
    if (!courseToEdit) return;
    try {
      const updated = await courseAPI.updateCourse(courseToEdit.id, payload);
      setCourses((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setFilteredCourses((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      setCourseToEdit(null);
    } catch (error: unknown) {
      console.error('Failed to update course:', error);
      const err = error as { response?: { status?: number }; message?: string };
      setStatusMsg(
        err.response?.status === 403
          ? 'Permission denied: You do not have permission to edit this course.'
          : `Failed to update course: ${err.message || 'Unknown error'}`
      );
    }
  };

  // DELETE
  const handleDeleteRequest = (course: Course) => setCourseToDelete(course);
  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;

    try {
      // 1) Try to delete – succeeds only for the creator
      await courseAPI.deleteCourse(courseToDelete.id);
    } catch (err: any) {
      if (err.response?.status === 403) {
        // 2) Not creator → simply leave
        await courseAPI.leaveCourse(courseToDelete.id);
      } else {
        // real error, re‑throw
        throw err;
      }
    }

    // remove from local state either way
    setCourses((prev) => prev.filter((c) => c.id !== courseToDelete.id));
    setFilteredCourses((prev) =>
      prev.filter((c) => c.id !== courseToDelete.id)
    );
    setCourseToDelete(null);
  };

  const uniqueTerms = Array.from(new Set(courses.map((c) => c.term))).sort();
  const uniqueYears = Array.from(
    new Set(courses.map((c) => c.term.split(' ')[1]).filter(Boolean))
  ).sort();

  return (
    <div
      className="fixed top-0 right-0 bottom-0 bg-white text-gray-800 font-inter overflow-y-auto"
      style={{ left: '16rem', width: 'calc(100vw - 16rem)' }}
    >
      <div className="px-8 py-10">
        {/* Title */}
        <h1 className="text-heading text-2xl font-bold mb-6">My Courses</h1>

        {/* Filters + Grouped Create & Search */}
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          {/* Term filter */}
          <select
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            className="text-sm border border-input-border rounded-md px-3 py-2 bg-white"
          >
            <option>All Terms</option>
            {uniqueTerms.map((term) => (
              <option key={term} value={term}>
                {term}
              </option>
            ))}
          </select>

          {/* Year filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-sm border border-input-border rounded-md px-3 py-2 bg-white"
          >
            <option>All Years</option>
            {uniqueYears.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>

          {/* push this group to the right */}
          <div className="ml-auto flex items-center gap-4">
            {/* Collaboration Invites Button */}
            <CollaborationInvitesButton
              inviteCount={invites.length}
              onClick={() => setIsInvitesOpen(true)}
            />

            {courses.length > 0 && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 text-white bg-primary-btn hover:bg-primary-btn-hover text-sm font-medium px-4 py-2 rounded-lg"
              >
                <PlusCircle size={18} />
                Create Course
              </button>
            )}

            <div className="w-80">
              <SearchBar
                placeholder="Search courses..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading courses...</div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredCourses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <p className="text-gray-500 mb-4">
              {searchQuery ||
              selectedTerm !== 'All Terms' ||
              selectedYear !== 'All Years'
                ? 'No courses found matching your filters.'
                : 'No courses yet. Create your first course!'}
            </p>
            {courses.length === 0 && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="flex items-center gap-2 text-white bg-primary-btn hover:bg-primary-btn-hover text-sm font-medium px-4 py-2 rounded-lg"
              >
                <PlusCircle size={18} />
                Create Course
              </button>
            )}
          </div>
        )}

        {/* Course Grid - Respects card minimum width */}
        {!isLoading && filteredCourses.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(320px,1fr))] gap-6">
            {filteredCourses.map((c) => (
              <CourseCard
                key={c.id}
                course={c}
                onEditRequest={handleEditRequest}
                onDeleteRequest={handleDeleteRequest}
                onExportRequest={handleExportRequest}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AddCourseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreate}
      />

      {courseToExport && (
        <ExportCourseModal
          isOpen={!!courseToExport}
          onClose={() => setCourseToExport(null)}
          course={courseToExport}
        />
      )}

      {courseToEdit && (
        <EditCourseModal
          isOpen
          course={courseToEdit}
          onClose={() => setCourseToEdit(null)}
          onSubmit={handleConfirmEdit}
        />
      )}

      {/* Collaboration Invites Modal */}
      <CollaborationInvitesModal
        isOpen={isInvitesOpen}
        onClose={() => setIsInvitesOpen(false)}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
        invites={invites}
      />

      {/* Delete confirmation */}
      {courseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setCourseToDelete(null)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
            <p className="text-gray-900 mb-4">
              Delete <strong>{courseToDelete.code}</strong>?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCourseToDelete(null)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                No
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Yes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* status popup (re‑uses styling from CourseSettings) */}
      {statusMsg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setStatusMsg(null)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-sm w-full">
            <p className="text-gray-900 mb-4">{statusMsg}</p>
            <button
              onClick={() => setStatusMsg(null)}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Courses;
