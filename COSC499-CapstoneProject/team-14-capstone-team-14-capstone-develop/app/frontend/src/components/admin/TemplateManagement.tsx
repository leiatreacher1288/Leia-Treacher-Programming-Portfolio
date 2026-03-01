import React, { useState, useEffect } from 'react';
import { StandardButton } from '../ui/StandardButton';
import {
  Plus,
  Trash2,
  Save,
  Loader2,
  AlertTriangle,
  Edit,
  Star,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { globalSettings } from '../../api/adminApi';
import { TemplateEditor } from './TemplateEditor';
import {
  defaultTemplateFormData,
  type TemplateFormData,
  convertFormDataToTemplate,
} from '../../utils/templateHelpers';

interface Template {
  id: number;
  name: string;
  created_by: {
    id: number;
    name: string;
    email: string;
  };
  created_at: string;
  is_default: boolean;
  layout_data: {
    instructions: string[];
    footer: string;
    academic_integrity: {
      enabled: boolean;
      text: string;
    };
    sections: Array<{
      name: string;
      title: string;
      instructions: string;
      num_questions: number;
    }>;
    marking_scheme: {
      multiCorrectPolicy:
        | 'all_or_nothing'
        | 'partial_credit'
        | 'partial_with_penalty';
      negativeMarking: {
        enabled: boolean;
        penalty: number;
        applyTo: 'all_questions' | 'single_choice_only' | 'multi_choice_only';
      };
      sectionWeighting: {
        [sectionId: number]: number;
      };
    };
  };
}

export const TemplateManagement: React.FC = () => {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(
    defaultTemplateFormData
  );
  const [templateSections, setTemplateSections] = useState<any[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const response = await globalSettings.templates.getAll();
      if (response.success) {
        setTemplates(response.templates || []);
      } else {
        toast.error(response.error || 'Failed to load templates');
      }
    } catch {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    setLoading(true);
    try {
      const templateData = convertFormDataToTemplate(
        formData,
        null,
        templateSections
      );
      const response = await globalSettings.templates.create(templateData);
      if (response.success) {
        toast.success('Template created successfully');
        setShowForm(false);
        resetForm();
        loadTemplates();
      } else {
        toast.error(response.error || 'Failed to create template');
      }
    } catch {
      toast.error('Failed to create template');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateTemplate = async () => {
    if (!editingTemplate) return;
    setLoading(true);
    try {
      const templateData = convertFormDataToTemplate(
        formData,
        editingTemplate,
        templateSections
      );
      const response = await globalSettings.templates.update(
        editingTemplate.id,
        templateData
      );
      if (response.success) {
        toast.success('Template updated successfully');
        setShowForm(false);
        setEditingTemplate(null);
        resetForm();
        loadTemplates();
      } else {
        toast.error(response.error || 'Failed to update template');
      }
    } catch {
      toast.error('Failed to update template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }
    setLoading(true);
    try {
      const response = await globalSettings.templates.delete(templateId);
      if (response.success) {
        toast.success('Template deleted successfully');
        loadTemplates();
      } else {
        toast.error(response.error || 'Failed to delete template');
      }
    } catch {
      toast.error('Failed to delete template');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (templateId: number) => {
    try {
      const response = await globalSettings.templates.setDefault(templateId);
      if (response.success) {
        toast.success('Template set as default successfully');
        loadTemplates(); // Refresh the list
      } else {
        toast.error(response.error || 'Failed to set template as default');
      }
    } catch (error) {
      console.error('Error setting template as default:', error);
      toast.error('Failed to set template as default');
    }
  };

  const resetForm = () => {
    setFormData(defaultTemplateFormData);
    setEditingTemplate(null);
  };

  const handleEditTemplate = (template: Template) => {
    // Convert the template to form data format
    const templateFormData: TemplateFormData = {
      name: template.name,
      layout_instructions:
        template.layout_data.instructions ||
        defaultTemplateFormData.layout_instructions,
      footer_text: template.layout_data.footer || '',
      academic_integrity_statement:
        template.layout_data.academic_integrity?.text || '',
      marking_scheme:
        template.layout_data.marking_scheme ||
        defaultTemplateFormData.marking_scheme,
      section_instructions:
        template.layout_data.sections?.reduce(
          (acc, section, index) => {
            acc[index] = section.instructions || '';
            return acc;
          },
          {} as Record<string, string>
        ) || {},
      is_default: template.is_default,
    };

    setFormData(templateFormData);
    setEditingTemplate(template);
    setShowForm(true);
  };

  const handleNewTemplate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleFormChange = (newFormData: TemplateFormData) => {
    setFormData(newFormData);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Exam Templates
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage system-wide exam templates and default configurations
          </p>
        </div>
        <StandardButton
          onClick={handleNewTemplate}
          className="flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          New Template
        </StandardButton>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          <span>Loading templates...</span>
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-4">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <p className="text-lg font-medium">No templates found</p>
            <p className="text-sm">Create your first template to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 relative border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    {template.is_default && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                        <Star className="w-3 h-3" />
                        Default
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      Created:{' '}
                      {new Date(template.created_at).toLocaleDateString()}
                    </span>
                    <span>by {template.created_by.name}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="bg-blue-600 text-white px-3 py-1.5 text-sm rounded hover:bg-blue-700 transition-colors"
                  >
                    Edit
                  </button>
                  {template.is_default ? (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                      <Star className="w-3 h-3" />
                      Default
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSetDefault(template.id)}
                      className="bg-green-600 text-white px-3 py-1.5 text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Set as Default
                    </button>
                  )}
                  <StandardButton
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </StandardButton>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700">
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                  {editingTemplate ? 'Edit Template' : 'Create New Template'}
                </h3>
                <StandardButton
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForm(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ×
                </StandardButton>
              </div>

              <TemplateEditor
                template={formData}
                onChange={handleFormChange}
                onSectionsChange={setTemplateSections}
                sections={
                  editingTemplate?.layout_data?.sections?.map(
                    (section, index) => ({
                      id: index,
                      title: section.title,
                      question_count: section.num_questions,
                    })
                  ) || []
                }
              />

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <StandardButton
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-2"
                >
                  Cancel
                </StandardButton>
                <StandardButton
                  onClick={
                    editingTemplate
                      ? handleUpdateTemplate
                      : handleCreateTemplate
                  }
                  disabled={loading}
                  className="px-6 py-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </StandardButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
