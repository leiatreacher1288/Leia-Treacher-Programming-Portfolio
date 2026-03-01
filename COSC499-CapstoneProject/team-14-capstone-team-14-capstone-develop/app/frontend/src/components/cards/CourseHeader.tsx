import { Book, Edit } from 'lucide-react';
import { useState } from 'react';
import type { Course } from '../../types/course';
import { EditCourseModal } from '../EditCourseModal';

interface CourseHeaderProps {
  course: Course; // always the newest object supplied by CourseDetail
  onCourseUpdate?: (courseData: {
    code: string;
    name: string;
    description: string;
    term: string;
    banner?: string;
  }) => Promise<void>;
}

export const CourseHeader: React.FC<CourseHeaderProps> = ({
  course,
  onCourseUpdate,
}) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEditClick = () => {
    setShowEditModal(true);
  };

  const handleCloseModal = () => {
    setShowEditModal(false);
  };

  const handleSubmit = async (courseData: {
    code: string;
    name: string;
    description: string;
    term: string;
    banner?: string;
  }) => {
    if (onCourseUpdate) {
      await onCourseUpdate(courseData);
    }
    setShowEditModal(false);
  };

  return (
    <>
      <div className="rounded-xl bg-muted/10 px-6 py-4 border border-border shadow-sm mb-6">
        <div className="flex items-start justify-between">
          {/* Left Column - Course Info */}
          <div className="flex-1">
            {/* Title */}
            <div className="flex items-center gap-3 mb-3">
              <Book className="text-primary-btn" size={24} />
              <h1 className="text-2xl font-semibold text-heading">
                {course.code} – {course.title}
              </h1>
            </div>

            {/* Metadata */}
            <div className="flex items-center gap-6 text-base text-muted-foreground">
              <span className="font-medium">{course.term}</span>
              {course.instructor && (
                <span className="font-medium">
                  Taught by {course.instructor}
                </span>
              )}
            </div>
          </div>

          {/* Right Column - Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleEditClick}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/20 rounded-lg transition-colors"
              title="Edit course information"
            >
              <Edit size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Edit Course Modal */}
      <EditCourseModal
        isOpen={showEditModal}
        course={course}
        onClose={handleCloseModal}
        onSubmit={handleSubmit}
      />
    </>
  );
};
