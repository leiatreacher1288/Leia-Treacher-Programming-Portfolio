import React, { useState, useEffect, useCallback } from 'react';
import { StandardButton } from '../../ui/StandardButton';
import { StandardInput } from '../../ui/StandardInput';
import { ToggleSwitch } from '../../ui/ToggleSwitch';
import ConfirmModal from '../../ui/ConfirmModal';
import { FiPlus, FiEdit, FiTrash2, FiSave, FiX } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { globalSettings } from '../../../api/adminApi';
import type { MarkingScheme } from '../../../types/globalSettings';

interface MarkingSchemesTabProps {
  onUnsavedChanges: (hasChanges: boolean) => void;
}

export const MarkingSchemesTab: React.FC<MarkingSchemesTabProps> = ({
  onUnsavedChanges,
}) => {
  const [schemes, setSchemes] = useState<MarkingScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingScheme, setEditingScheme] = useState<MarkingScheme | null>(
    null
  );
  const [deleteScheme, setDeleteScheme] = useState<MarkingScheme | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_default: false,
    is_active: true,
    pass_threshold: 50,
    grade_boundaries: {
      'A+': 95,
      A: 90,
      'A-': 85,
      'B+': 80,
      B: 75,
      'B-': 70,
      'C+': 65,
      C: 60,
      'C-': 55,
      D: 50,
      F: 0,
    },
    negative_marking_enabled: false,
    negative_marking_penalty: 25,
    weight_exam: 60,
    weight_assignments: 30,
    weight_participation: 10,
  });

  const loadSchemes = useCallback(async () => {
    try {
      setLoading(true);
      const response = await globalSettings.markingSchemes.getAll();
      if (response.success) {
        setSchemes(response.marking_schemes || []);
      }
    } catch (error) {
      toast.error('Failed to load marking schemes');
      console.error('Error loading marking schemes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemes();
  }, [loadSchemes]);

  useEffect(() => {
    // Listen for refresh events
    const handleRefresh = () => loadSchemes();
    window.addEventListener('refresh-global-settings', handleRefresh);
    return () =>
      window.removeEventListener('refresh-global-settings', handleRefresh);
  }, [loadSchemes]);

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      is_default: false,
      is_active: true,
      pass_threshold: 50,
      grade_boundaries: {
        'A+': 95,
        A: 90,
        'A-': 85,
        'B+': 80,
        B: 75,
        'B-': 70,
        'C+': 65,
        C: 60,
        'C-': 55,
        D: 50,
        F: 0,
      },
      negative_marking_enabled: false,
      negative_marking_penalty: 25,
      weight_exam: 60,
      weight_assignments: 30,
      weight_participation: 10,
    });
    setEditingScheme(null);
    onUnsavedChanges(false);
  };

  const handleCreate = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const handleEdit = (scheme: MarkingScheme) => {
    setEditingScheme(scheme);
    setFormData({
      name: scheme.global_setting.name,
      description: scheme.global_setting.description,
      is_default: scheme.global_setting.is_default,
      is_active: scheme.global_setting.is_active,
      pass_threshold: scheme.pass_threshold,
      grade_boundaries: {
        'A+': scheme.grade_boundaries['A+'] ?? 95,
        A: scheme.grade_boundaries['A'] ?? 90,
        'A-': scheme.grade_boundaries['A-'] ?? 85,
        'B+': scheme.grade_boundaries['B+'] ?? 80,
        B: scheme.grade_boundaries['B'] ?? 75,
        'B-': scheme.grade_boundaries['B-'] ?? 70,
        'C+': scheme.grade_boundaries['C+'] ?? 65,
        C: scheme.grade_boundaries['C'] ?? 60,
        'C-': scheme.grade_boundaries['C-'] ?? 55,
        D: scheme.grade_boundaries['D'] ?? 50,
        F: scheme.grade_boundaries['F'] ?? 0,
      },
      negative_marking_enabled: scheme.negative_marking.enabled,
      negative_marking_penalty: scheme.negative_marking.penalty_percentage,
      weight_exam: scheme.weight_distribution.exam || 60,
      weight_assignments: scheme.weight_distribution.assignments || 30,
      weight_participation: scheme.weight_distribution.participation || 10,
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    try {
      if (!formData.name.trim()) {
        toast.error('Scheme name is required');
        return;
      }

      // Validate weight distribution totals to 100%
      const totalWeight =
        formData.weight_exam +
        formData.weight_assignments +
        formData.weight_participation;
      if (Math.abs(totalWeight - 100) > 0.1) {
        toast.error('Weight distribution must total 100%');
        return;
      }

      setLoading(true);

      const schemeData = {
        global_setting: {
          name: formData.name,
          description: formData.description,
          is_default: formData.is_default,
          is_active: formData.is_active,
        },
        grade_boundaries: formData.grade_boundaries,
        negative_marking: {
          enabled: formData.negative_marking_enabled,
          penalty_percentage: formData.negative_marking_penalty,
        },
        pass_threshold: formData.pass_threshold,
        weight_distribution: {
          exam: formData.weight_exam,
          assignments: formData.weight_assignments,
          participation: formData.weight_participation,
        },
      };

      if (editingScheme) {
        await globalSettings.markingSchemes.update(
          editingScheme.id!,
          schemeData
        );
        toast.success('Marking scheme updated successfully');
      } else {
        await globalSettings.markingSchemes.create(schemeData);
        toast.success('Marking scheme created successfully');
      }

      setShowCreateModal(false);
      setShowEditModal(false);
      resetForm();
      await loadSchemes();
      onUnsavedChanges(false);
    } catch (error) {
      toast.error('Failed to save marking scheme');
      console.error('Error saving marking scheme:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteScheme) return;

    try {
      setLoading(true);
      await globalSettings.markingSchemes.delete(deleteScheme.id!);
      toast.success('Marking scheme deleted successfully');
      setShowDeleteModal(false);
      setDeleteScheme(null);
      await loadSchemes();
    } catch (error) {
      toast.error('Failed to delete marking scheme');
      console.error('Error deleting marking scheme:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (scheme: MarkingScheme) => {
    setDeleteScheme(scheme);
    setShowDeleteModal(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-heading">
            Marking Schemes
          </h2>
          <p className="text-card-info text-sm mt-1">
            Configure grade boundaries, negative marking, and weight
            distributions
          </p>
        </div>
        <StandardButton
          onClick={handleCreate}
          className="flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" />
          New Scheme
        </StandardButton>
      </div>

      {/* Schemes List */}
      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-card-info">Loading marking schemes...</div>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border text-center">
          <div className="text-card-info">
            No marking schemes configured yet. Create your first scheme to get
            started.
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {schemes.map((scheme) => (
            <div
              key={scheme.id}
              className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-heading">
                      {scheme.global_setting.name}
                    </h3>
                    <div className="flex gap-2">
                      {scheme.global_setting.is_default && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          Default
                        </span>
                      )}
                      {!scheme.global_setting.is_active && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">
                          Inactive
                        </span>
                      )}
                    </div>
                  </div>
                  {scheme.global_setting.description && (
                    <p className="text-card-info text-sm mb-3">
                      {scheme.global_setting.description}
                    </p>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="font-medium text-heading">
                        Pass Threshold
                      </div>
                      <div className="text-card-info">
                        {scheme.pass_threshold}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-heading">
                        Negative Marking
                      </div>
                      <div className="text-card-info">
                        {scheme.negative_marking.enabled
                          ? `${scheme.negative_marking.penalty_percentage}% penalty`
                          : 'Disabled'}
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-heading">
                        Grade Range
                      </div>
                      <div className="text-card-info">
                        {Math.min(...Object.values(scheme.grade_boundaries))}% -{' '}
                        {Math.max(...Object.values(scheme.grade_boundaries))}%
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-heading">Categories</div>
                      <div className="text-card-info">
                        {Object.keys(scheme.weight_distribution).length}{' '}
                        categories
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StandardButton
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(scheme)}
                  >
                    <FiEdit className="w-4 h-4" />
                  </StandardButton>
                  <StandardButton
                    size="sm"
                    variant="outline"
                    onClick={() => confirmDelete(scheme)}
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
                {editingScheme
                  ? 'Edit Marking Scheme'
                  : 'Create New Marking Scheme'}
              </h3>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Scheme Name *
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
                    placeholder="e.g., Standard Grading"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pass Threshold (%)
                  </label>
                  <StandardInput
                    type="number"
                    min="0"
                    max="100"
                    value={formData.pass_threshold.toString()}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFormData((prev) => ({
                        ...prev,
                        pass_threshold: parseFloat(e.target.value),
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
                  placeholder="Describe this marking scheme..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
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
                    Set as default scheme
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

              {/* Weight Distribution */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Weight Distribution</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Exam (%)
                    </label>
                    <StandardInput
                      type="number"
                      min="0"
                      max="100"
                      value={formData.weight_exam.toString()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFormData((prev) => ({
                          ...prev,
                          weight_exam: parseFloat(e.target.value),
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Assignments (%)
                    </label>
                    <StandardInput
                      type="number"
                      min="0"
                      max="100"
                      value={formData.weight_assignments.toString()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFormData((prev) => ({
                          ...prev,
                          weight_assignments: parseFloat(e.target.value),
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Participation (%)
                    </label>
                    <StandardInput
                      type="number"
                      min="0"
                      max="100"
                      value={formData.weight_participation.toString()}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        setFormData((prev) => ({
                          ...prev,
                          weight_participation: parseFloat(e.target.value),
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  Total:{' '}
                  {formData.weight_exam +
                    formData.weight_assignments +
                    formData.weight_participation}
                  %
                  {Math.abs(
                    formData.weight_exam +
                      formData.weight_assignments +
                      formData.weight_participation -
                      100
                  ) > 0.1 && (
                    <span className="text-red-500 ml-2">Must total 100%</span>
                  )}
                </div>
              </div>

              {/* Negative Marking */}
              <div className="space-y-4">
                <h4 className="text-lg font-medium">Negative Marking</h4>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <ToggleSwitch
                      enabled={formData.negative_marking_enabled}
                      onToggle={() => {
                        setFormData((prev) => ({
                          ...prev,
                          negative_marking_enabled:
                            !prev.negative_marking_enabled,
                        }));
                        onUnsavedChanges(true);
                      }}
                    />
                    <label className="text-sm font-medium text-gray-700">
                      Enable negative marking
                    </label>
                  </div>
                  {formData.negative_marking_enabled && (
                    <div className="flex items-center gap-2">
                      <label className="text-sm font-medium text-gray-700">
                        Penalty:
                      </label>
                      <StandardInput
                        type="number"
                        min="0"
                        max="100"
                        value={formData.negative_marking_penalty.toString()}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          setFormData((prev) => ({
                            ...prev,
                            negative_marking_penalty: parseFloat(
                              e.target.value
                            ),
                          }));
                          onUnsavedChanges(true);
                        }}
                        className="w-20"
                      />
                      <span className="text-sm text-gray-600">%</span>
                    </div>
                  )}
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
                {loading ? 'Saving...' : editingScheme ? 'Update' : 'Create'}
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
          setDeleteScheme(null);
        }}
        onConfirm={handleDelete}
        title="Delete Marking Scheme"
        description={`Are you sure you want to delete "${deleteScheme?.global_setting.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};
