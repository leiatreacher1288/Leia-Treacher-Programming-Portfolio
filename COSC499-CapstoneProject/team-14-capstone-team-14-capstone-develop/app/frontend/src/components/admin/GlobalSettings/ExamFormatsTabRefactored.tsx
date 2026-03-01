import React, { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../ui/StandardButton';
import ConfirmModal from '../../ui/ConfirmModal';
import { FiPlus } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { globalSettings } from '../../../api/adminApi';
import { ExamFormatList } from './ExamFormatList';
import { ExamFormatModal } from './forms/ExamFormatModal';
import {
  getDefaultFormData,
  formatToFormData,
  formDataToApiFormat,
  validateExamForm,
  type ExamFormData,
} from '../../../utils/examFormHelpers';
import type { ExamFormat } from '../../../types/globalSettings';

interface ExamFormatsTabProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export const ExamFormatsTab: React.FC<ExamFormatsTabProps> = ({
  onUnsavedChanges,
}) => {
  const [formats, setFormats] = useState<ExamFormat[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingFormat, setEditingFormat] = useState<ExamFormat | null>(null);
  const [deleteFormat, setDeleteFormat] = useState<ExamFormat | null>(null);
  const [formData, setFormData] = useState<ExamFormData>(getDefaultFormData());

  const loadFormats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await globalSettings.examFormats.getAll();
      if (response.success) {
        setFormats(response.exam_formats || []);
      }
    } catch (error) {
      toast.error('Failed to load exam formats');
      console.error('Error loading exam formats:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFormats();
  }, [loadFormats]);

  useEffect(() => {
    const handleRefresh = () => loadFormats();
    window.addEventListener('refresh-global-settings', handleRefresh);
    return () =>
      window.removeEventListener('refresh-global-settings', handleRefresh);
  }, [loadFormats]);

  const resetForm = () => {
    setFormData(getDefaultFormData());
    setEditingFormat(null);
    onUnsavedChanges(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (format: ExamFormat) => {
    setEditingFormat(format);
    setFormData(formatToFormData(format));
    setShowEditModal(true);
  };

  const handleFormUpdate = (updates: Partial<ExamFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    onUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      const validationErrors = validateExamForm(formData);
      if (validationErrors.length > 0) {
        toast.error(validationErrors[0]);
        return;
      }

      setLoading(true);
      const formatData = formDataToApiFormat(formData);

      if (editingFormat) {
        await globalSettings.examFormats.update(editingFormat.id!, formatData);
        toast.success('Exam format updated successfully');
      } else {
        await globalSettings.examFormats.create(formatData);
        toast.success('Exam format created successfully');
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
      await loadFormats();
    } catch (error) {
      toast.error('Failed to save exam format');
      console.error('Error saving exam format:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteFormat) return;

    try {
      setLoading(true);
      await globalSettings.examFormats.delete(deleteFormat.id!);
      toast.success('Exam format deleted successfully');
      setShowDeleteModal(false);
      setDeleteFormat(null);
      await loadFormats();
    } catch (error) {
      toast.error('Failed to delete exam format');
      console.error('Error deleting exam format:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (format: ExamFormat) => {
    setDeleteFormat(format);
    setShowDeleteModal(true);
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading">Exam Formats</h2>
          <p className="text-card-info text-sm mt-1">
            Configure exam timing, navigation, randomization, and security
            settings
          </p>
        </div>
        <StandardButton
          onClick={handleCreate}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          New Format
        </StandardButton>
      </div>

      {/* Formats List */}
      <ExamFormatList
        formats={formats}
        loading={loading}
        onEdit={handleEdit}
        onDelete={confirmDelete}
      />

      {/* Create/Edit Modal */}
      <ExamFormatModal
        isOpen={showCreateModal || showEditModal}
        isEditing={!!editingFormat}
        formData={formData}
        loading={loading}
        onClose={closeModals}
        onSave={handleSave}
        onUpdate={handleFormUpdate}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={showDeleteModal}
        onCancel={() => {
          setShowDeleteModal(false);
          setDeleteFormat(null);
        }}
        onConfirm={handleDelete}
        title="Delete Exam Format"
        description={`Are you sure you want to delete "${deleteFormat?.global_setting.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
