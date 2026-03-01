import { FileText } from 'lucide-react';
import type { Course } from '../../types/course';

export function CourseInfoCard({
  course,
}: {
  course: Pick<Course, 'code' | 'title' | 'term'>;
}) {
  if (!course) return null;
  return (
    <div className="mt-2 p-3 bg-secondary-blue rounded-lg flex items-center gap-2">
      <FileText size={16} className="text-primary-btn" />
      <div className="text-sm">
        <span className="font-medium">{course.code}</span>
        <span className="text-card-info ml-2">
          {course.title} • {course.term}
        </span>
      </div>
    </div>
  );
}
