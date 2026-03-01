import React, { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../ui/StandardButton';
import { StandardInput } from '../../ui/StandardInput';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import ConfirmModal from '../../ui/ConfirmModal';
import {
  FiPlus,
  FiEdit,
  FiTrash2,
  FiSave,
  FiX,
  FiClock,
  FiHash,
} from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { globalSettings } from '../../../api/adminApi';
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
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    is_active: true,
    sections: [{ name: 'Main Section', question_count: 10, points: 100 }],
    total_minutes: 60,
    warning_minutes: 5,
    easy_questions: 3,
    medium_questions: 5,
    hard_questions: 2,
    randomize_questions: false,
    randomize_choices: false,
    show_progress: true,
    // Add missing properties:
    max_attempts: 3,
    questions_per_page: 1,
    question_display_mode: 'one_by_one' as 'all_at_once' | 'one_by_one',
    allow_navigation: true,
    randomize_options: false, // Alternative name for randomize_choices
    show_results_immediately: false,
    allow_review_after_submission: true,
    auto_submit_on_time_limit: true,
    require_webcam: false,
    require_microphone: false,
    lockdown_browser_required: false,
  });

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
    // Listen for refresh events
    const handleRefresh = () => loadFormats();
    window.addEventListener('refresh-global-settings', handleRefresh);
    return () =>
      window.removeEventListener('refresh-global-settings', handleRefresh);
  }, [loadFormats]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_default: false,
      is_active: true,
      sections: [{ name: 'Main Section', question_count: 10, points: 100 }],
      total_minutes: 60,
      warning_minutes: 5,
      easy_questions: 3,
      medium_questions: 5,
      hard_questions: 2,
      randomize_questions: false,
      randomize_choices: false,
      show_progress: true,
      // Add the same missing properties here:
      max_attempts: 3,
      questions_per_page: 1,
      question_display_mode: 'one_by_one' as 'all_at_once' | 'one_by_one',
      allow_navigation: true,
      randomize_options: false,
      show_results_immediately: false,
      allow_review_after_submission: true,
      auto_submit_on_time_limit: true,
      require_webcam: false,
      require_microphone: false,
      lockdown_browser_required: false,
    });
    setEditingFormat(null);
    onUnsavedChanges(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (format: ExamFormat) => {
    setEditingFormat(format);
    setFormData({
      name: format.global_setting.name,
      description: format.global_setting.description,
      is_default: format.global_setting.is_default,
      is_active: format.global_setting.is_active,
      sections:
        format.sections.length > 0
          ? format.sections
          : [{ name: 'Main Section', question_count: 10, points: 100 }],
      total_minutes: format.time_limits.total_minutes,
      warning_minutes: format.time_limits.warning_minutes,
      easy_questions: format.question_distribution.easy,
      medium_questions: format.question_distribution.medium,
      hard_questions: format.question_distribution.hard,
      randomize_questions: format.exam_structure.randomize_questions,
      randomize_choices: format.exam_structure.randomize_choices,
      show_progress: format.exam_structure.show_progress,
      // Add missing properties:
      max_attempts: 3,
      questions_per_page: 1,
      question_display_mode: 'one_by_one' as 'all_at_once' | 'one_by_one',
      allow_navigation: true,
      randomize_options: false, // Alternative name for randomize_choices
      show_results_immediately: false,
      allow_review_after_submission: true,
      auto_submit_on_time_limit: true,
      require_webcam: false,
      require_microphone: false,
      lockdown_browser_required: false,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Format name is required');
        return;
      }

      if (formData.total_minutes < 1) {
        toast.error('Time limit must be at least 1 minute');
        return;
      }

      if (formData.sections.length === 0) {
        toast.error('At least one section is required');
        return;
      }

      setLoading(true);

      const formatData = {
        global_setting: {
          name: formData.name,
          description: formData.description,
          is_default: formData.is_default,
          is_active: formData.is_active,
        },
        sections: formData.sections,
        time_limits: {
          total_minutes: formData.total_minutes,
          warning_minutes: formData.warning_minutes,
        },
        question_distribution: {
          easy: formData.easy_questions,
          medium: formData.medium_questions,
          hard: formData.hard_questions,
        },
        exam_structure: {
          randomize_questions: formData.randomize_questions,
          randomize_choices: formData.randomize_choices,
          show_progress: formData.show_progress,
        },
      };

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
      onUnsavedChanges(false);
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
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-card-info">Loading exam formats...</div>
        </div>
      ) : formats.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-card-info">
            No exam formats configured yet. Create your first format to get
            started.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {formats.map((format) => (
            <div
              key={format.id}
              className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-heading">
                      {format.global_setting.name}
                    </h3>
                    <div className="flex gap-2">
                      {format.global_setting.is_default && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Default
                        </span>
                      )}
                      {!format.global_setting.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  {format.global_setting.description && (
                    <p className="text-card-info text-sm mb-3">
                      {format.global_setting.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4 text-blue-500" />
                      <div>
                        <div className="font-medium text-heading">
                          Time Limit
                        </div>
                        <div className="text-card-info">
                          {format.time_limits.total_minutes} minutes
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiHash className="w-4 h-4 text-green-500" />
                      <div>
                        <div className="font-medium text-heading">Sections</div>
                        <div className="text-card-info">
                          {format.sections.length}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-heading">Questions</div>
                      <div className="text-card-info">
                        {format.question_distribution.easy +
                          format.question_distribution.medium +
                          format.question_distribution.hard}{' '}
                        total
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-heading">Points</div>
                      <div className="text-card-info">
                        {format.sections.reduce(
                          (total, section) => total + section.points,
                          0
                        )}{' '}
                        total
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {format.exam_structure.randomize_questions && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Random Questions
                      </span>
                    )}
                    {format.exam_structure.randomize_choices && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                        Random Choices
                      </span>
                    )}
                    {format.exam_structure.show_progress && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                        Show Progress
                      </span>
                    )}
                    {format.time_limits.warning_minutes > 0 && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                        {format.time_limits.warning_minutes}min Warning
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StandardButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(format)}
                  >
                    <FiEdit className="w-4 h-4" />
                  </StandardButton>
                  <StandardButton
                    size="sm"
                    variant="outline"
                    onClick={() => confirmDelete(format)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </StandardButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold">
                {editingFormat ? 'Edit Exam Format' : 'Create New Exam Format'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Format Name *
                  </label>
                  <StandardInput
                    value={formData.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }));
                      onUnsavedChanges(true);
                    }}
                    placeholder="e.g., Standard Online Exam"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Time Limit (minutes) *
                  </label>
                  <StandardInput
                    type="number"
                    min="1"
                    value={formData.total_minutes.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        total_minutes: parseInt(e.target.value) || 1,
                      }));
                      onUnsavedChanges(true);
                    }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }));
                    onUnsavedChanges(true);
                  }}
                  placeholder="Describe this exam format..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              {/* Basic Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Attempts
                  </label>
                  <StandardInput
                    type="number"
                    min="1"
                    value={formData.max_attempts.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        max_attempts: parseInt(e.target.value),
                      }));
                      onUnsavedChanges(true);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Questions Per Page
                  </label>
                  <StandardInput
                    type="number"
                    min="1"
                    value={formData.questions_per_page.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        questions_per_page: parseInt(e.target.value),
                      }));
                      onUnsavedChanges(true);
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <ToggleSwitch
                    enabled={formData.is_default}
                    onToggle={() => {
                      setFormData((prev) => ({
                        ...prev,
                        is_default: !prev.is_default,
                      }));
                      onUnsavedChanges(true);
                    }}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Set as default format
                  </label>
                </div>
                <div className="flex items-center space-x-2">
                  <ToggleSwitch
                    enabled={formData.is_active}
                    onToggle={() => {
                      setFormData((prev) => ({
                        ...prev,
                        is_active: !prev.is_active,
                      }));
                      onUnsavedChanges(true);
                    }}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>

              {/* Question Display */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Question Display</h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Mode
                  </label>
                  <select
                    value={formData.question_display_mode}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        question_display_mode: e.target.value as
                          | 'all_at_once'
                          | 'one_by_one',
                      }));
                      onUnsavedChanges(true);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all_at_once">All questions at once</option>
                    <option value="one_by_one">One question at a time</option>
                  </select>
                </div>
                <div className="flex items-center space-x-2">
                  <ToggleSwitch
                    enabled={formData.allow_navigation}
                    onToggle={() => {
                      setFormData((prev) => ({
                        ...prev,
                        allow_navigation: !prev.allow_navigation,
                      }));
                      onUnsavedChanges(true);
                    }}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    Allow navigation between questions
                  </label>
                </div>
              </div>

              {/* Randomization */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Randomization</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.randomize_questions}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          randomize_questions: !prev.randomize_questions,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Randomize question order
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.randomize_options}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          randomize_options: !prev.randomize_options,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Randomize answer options
                    </label>
                  </div>
                </div>
              </div>

              {/* Results & Submission */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Results & Submission</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.show_results_immediately}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          show_results_immediately:
                            !prev.show_results_immediately,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Show results immediately after submission
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.allow_review_after_submission}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          allow_review_after_submission:
                            !prev.allow_review_after_submission,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Allow review after submission
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.auto_submit_on_time_limit}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          auto_submit_on_time_limit:
                            !prev.auto_submit_on_time_limit,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Auto-submit when time limit is reached
                    </label>
                  </div>
                </div>
              </div>

              {/* Security Settings */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Security Settings</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.require_webcam}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          require_webcam: !prev.require_webcam,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Require webcam access
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.require_microphone}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          require_microphone: !prev.require_microphone,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Require microphone access
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.lockdown_browser_required}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          lockdown_browser_required:
                            !prev.lockdown_browser_required,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Require lockdown browser
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end gap-3">
              <StandardButton
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                <FiX className="w-4 h-4 mr-2" />
                Cancel
              </StandardButton>
              <StandardButton
                onClick={handleSave}
                disabled={loading || !formData.name.trim()}
              >
                <FiSave className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : editingFormat ? 'Update' : 'Create'}
              </StandardButton>
            </div>
          </div>
        </div>
      )}

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
