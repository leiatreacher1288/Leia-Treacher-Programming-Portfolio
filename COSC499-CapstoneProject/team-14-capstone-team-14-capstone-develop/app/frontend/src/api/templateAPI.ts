// src/api/templateAPI.ts
import axiosInstance from './axiosInstance';

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export interface ExamTemplate {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
  created_by: number;
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
      question_bank_id: number;
      instructions: string;
      num_questions: number;
    }>;
    marking_scheme?: {
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
        [sectionIndex: number]: number; // Index-based for template compatibility
      };
    };
  };
}

export interface SaveTemplatePayload {
  name: string;
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
      question_bank_id: number;
      instructions: string;
      num_questions: number;
    }>;
    marking_scheme?: {
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
        [sectionIndex: number]: number; // Index-based for template compatibility
      };
    };
  };
}

export interface LoadTemplateResponse {
  success: boolean;
  template?: ExamTemplate;
  error?: string;
}

export interface TemplatesResponse {
  success: boolean;
  templates: ExamTemplate[];
  error?: string;
}

export interface SaveTemplateResponse {
  success: boolean;
  template: ExamTemplate;
  error?: string;
}

/* -------------------------------------------------------------------------- */
/*                              Template API                                   */
/* -------------------------------------------------------------------------- */

export const templateAPI = {
  // Get all templates for the current user
  async getTemplates(): Promise<TemplatesResponse> {
    try {
      const response = await axiosInstance.get<ExamTemplate[]>(
        '/exams/templates/layout/'
      );
      return {
        success: true,
        templates: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        templates: [],
        error: error.response?.data?.message || 'Failed to load templates',
      };
    }
  },

  // Load a specific template by ID
  async loadTemplate(templateId: number): Promise<LoadTemplateResponse> {
    console.log('🔍 Template API: Loading template with ID:', templateId);
    try {
      const response = await axiosInstance.get<ExamTemplate>(
        `/exams/templates/layout/${templateId}/`
      );
      console.log('🔍 Template API: Response received:', response.data);
      return {
        success: true,
        template: response.data,
      };
    } catch (error: any) {
      console.error('🔍 Template API: Error loading template:', error);
      console.error('🔍 Template API: Error response:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load template',
      };
    }
  },

  // Save a new template
  async saveTemplate(data: SaveTemplatePayload): Promise<SaveTemplateResponse> {
    try {
      const response = await axiosInstance.post<ExamTemplate>(
        '/exams/templates/layout/',
        data
      );
      return {
        success: true,
        template: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        template: {} as ExamTemplate,
        error: error.response?.data?.message || 'Failed to save template',
      };
    }
  },

  // Update an existing template
  async updateTemplate(
    templateId: number,
    data: SaveTemplatePayload
  ): Promise<SaveTemplateResponse> {
    try {
      const response = await axiosInstance.put<ExamTemplate>(
        `/exams/templates/layout/${templateId}/`,
        data
      );
      return {
        success: true,
        template: response.data,
      };
    } catch (error: any) {
      return {
        success: false,
        template: {} as ExamTemplate,
        error: error.response?.data?.message || 'Failed to update template',
      };
    }
  },

  // Delete a template
  async deleteTemplate(
    templateId: number
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await axiosInstance.delete(`/exams/templates/layout/${templateId}/`);
      return {
        success: true,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete template',
      };
    }
  },

  // Get all templates for admin management
  async getAdminTemplates(): Promise<any> {
    try {
      const response = await axiosInstance.get('/exams/admin/templates/');
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to load templates',
      };
    }
  },

  // Admin template management
  async createAdminTemplate(templateData: any): Promise<any> {
    try {
      const response = await axiosInstance.post(
        '/exams/admin/templates/create/',
        templateData
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to create template',
      };
    }
  },

  async updateAdminTemplate(
    templateId: number,
    templateData: any
  ): Promise<any> {
    try {
      const response = await axiosInstance.put(
        `/exams/admin/templates/${templateId}/update/`,
        templateData
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to update template',
      };
    }
  },

  async deleteAdminTemplate(templateId: number): Promise<any> {
    try {
      const response = await axiosInstance.delete(
        `/exams/admin/templates/${templateId}/delete/`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || 'Failed to delete template',
      };
    }
  },

  async setDefaultTemplate(templateId: number): Promise<any> {
    try {
      const response = await axiosInstance.post(
        `/exams/admin/templates/${templateId}/set-default/`
      );
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error:
          error.response?.data?.message || 'Failed to set default template',
      };
    }
  },
};
