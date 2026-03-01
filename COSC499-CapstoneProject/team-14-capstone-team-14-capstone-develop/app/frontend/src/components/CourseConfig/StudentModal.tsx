// src/components/CourseConfig/StudentModal.tsx
import React, { useState } from 'react';
import type { ReactNode } from 'react';

// Generic Modal wrapper
type ModalProps = {
  onClose: () => void;
  children: ReactNode;
};
export const Modal: React.FC<ModalProps> = ({ onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 w-8 h-8 bg-danger-btn text-white hover:bg-red-600 flex items-center justify-center"
        aria-label="Close modal"
      >
        &times;
      </button>
      {children}
    </div>
  </div>
);

// StudentModal for Add/Edit
interface StudentData {
  student_id: string;
  name: string;
  preferred_name?: string;
  email: string;
  section: string;
  is_anonymous: boolean;
}

interface StudentModalProps {
  title: string;
  initialData?: Partial<StudentData>;
  onSubmit: (data: StudentData) => Promise<void>;
  onClose: () => void;
}

export const StudentModal: React.FC<StudentModalProps> = ({
  title,
  initialData = {},
  onSubmit,
  onClose,
}) => {
  const [form, setForm] = useState(initialData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setGeneralError('');
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.student_id) newErrors.student_id = 'Student ID is required';
    if (!form.name) newErrors.name = 'Name is required'; // Changed
    if (!form.email) newErrors.email = 'Email is required';
    if (!form.section) newErrors.section = 'Section is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    try {
      await onSubmit(form as StudentData);
      onClose();
    } catch (err) {
      setGeneralError('Student wasn’t saved successfully');
      console.error('Save error', err);
    }
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {generalError && <div className="text-red-600 mb-2">{generalError}</div>}
      <div className="flex flex-col gap-3">
        <input
          name="student_id"
          value={form.student_id || ''}
          onChange={handleChange}
          placeholder="Student ID"
          className="border bg-white text-black p-2 rounded"
        />
        {errors.student_id && (
          <p className="text-red-500 text-sm">{errors.student_id}</p>
        )}

        <input
          name="name"
          value={form.name || ''}
          onChange={handleChange}
          placeholder="Legal/Official Name"
          className="border bg-white text-black p-2 rounded"
        />
        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

        <input
          name="preferred_name"
          value={form.preferred_name || ''}
          onChange={handleChange}
          placeholder="Preferred Name (optional)"
          className="border bg-white text-black p-2 rounded"
        />
        {errors.last_name && (
          <p className="text-red-500 text-sm">{errors.last_name}</p>
        )}

        <input
          name="email"
          type="email"
          value={form.email || ''}
          onChange={handleChange}
          placeholder="Email"
          className="border bg-white text-black p-2 rounded"
        />
        {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}

        <input
          name="section"
          value={form.section || ''}
          onChange={handleChange}
          placeholder="Section"
          className="border bg-white text-black p-2 rounded"
        />
        {errors.section && (
          <p className="text-red-500 text-sm">{errors.section}</p>
        )}

        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            name="is_anonymous"
            checked={!!form.is_anonymous}
            onChange={handleChange}
            className="form-checkbox"
          />
          Anonymize profile?
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-danger-btn text-white rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary-btn text-white rounded-lg"
        >
          Save
        </button>
      </div>
    </Modal>
  );
};
