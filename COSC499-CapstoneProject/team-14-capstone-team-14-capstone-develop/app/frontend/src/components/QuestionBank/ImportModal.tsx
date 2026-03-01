import React from 'react';
import { FiX } from 'react-icons/fi';
import { StandardButton } from '../ui/StandardButton';
import type { Course } from '../../api/courseAPI';

interface ImportModalProps {
  show: boolean;
  onClose: () => void;
  courses: Course[];
  importCourseId: number | undefined;
  setImportCourseId: React.Dispatch<React.SetStateAction<number | undefined>>;
  importFiles: File[];
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeFile: (idx: number) => void;
  handleImportAll: () => Promise<void>;
  handlePreview: () => Promise<void>;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  show,
  onClose,
  courses,
  importCourseId,
  setImportCourseId,
  importFiles,
  onFileChange,
  removeFile,
  handleImportAll,
  handlePreview,
}) => {
  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center
                    bg-black bg-opacity-40 backdrop-blur-sm"
    >
      <div className="bg-white rounded-xl w-full max-w-lg p-6 space-y-6 shadow-xl">
        <h2 className="text-xl font-semibold">Import Questions</h2>

        <div>
          <label className="block text-sm font-medium mb-1">Course</label>
          <select
            value={importCourseId ?? ''}
            onChange={(e) => {
              const val = e.target.value;
              setImportCourseId(val === '' ? undefined : Number(val));
            }}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Select a course</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code ? `${c.code} – ${c.title}` : c.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Files (up to 5)
          </label>
          <input
            type="file"
            accept=".csv,.pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            multiple
            onChange={onFileChange}
            className="block mb-2"
          />
          <ul className="space-y-1">
            {importFiles.map((file, idx) => (
              <li
                key={idx}
                className="flex items-center justify-between px-3 py-2
                           border rounded"
              >
                <span className="truncate">{file.name}</span>
                <StandardButton
                  color="danger-btn"
                  icon={<FiX size={14} />}
                  onClick={() => removeFile(idx)}
                  className="p-2"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <StandardButton
            color="secondary-btn"
            onClick={() => {
              setImportCourseId(undefined);
              onClose();
            }}
          >
            Cancel
          </StandardButton>
          <StandardButton
            onClick={async () => {
              await handlePreview();
              setTimeout(() => {
                onClose(); // Close AFTER state update so modal stays mounted
              }, 50); // small delay (50ms)
            }}
            disabled={!importCourseId || importFiles.length === 0}
          >
            Preview Questions
          </StandardButton>
        </div>
      </div>
    </div>
  );
};
