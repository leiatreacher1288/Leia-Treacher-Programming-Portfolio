import axios, { type AxiosError, type AxiosResponse } from 'axios';

// Type definitions
interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  error?: string;
  data?: T;
  user?: {
    id: number;
    is_active: boolean;
    email: string;
    name: string;
  };
}

interface UserApiResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

interface RecentActivityResponse {
  activities: Array<{
    id: string;
    user_name: string;
    user_email: string;
    action: string;
    description: string;
    timestamp: string;
    type: string;
    severity: string;
  }>;
  count: number;
  last_updated: string;
}

interface PrivacyAuditLogResponse {
  logs: Array<{
    id: string;
    action: string;
    action_display: string;
    description: string;
    admin_user: string;
    user_email: string;
    created_at: string;
    created_at_formatted: string;
  }>;
  total_count: number;
  page: number;
  page_size: number;
}

interface User {
  id: number;
  email: string;
  name: string;
  role: 'instructor' | 'admin';
  is_active: boolean;
  is_staff: boolean;
  is_superuser: boolean;
  is_archived?: boolean;
  archived_at?: string;
  archived_by?: number;
  created_at: string;
  last_login: string | null;
  last_logout: string | null;
  is_online?: boolean;
  is_offline?: boolean;
  is_inactive?: boolean;
  days_since_login?: number | null;
}

interface LoginResponse extends ApiResponse {
  user?: {
    id: number;
    username: string;
    email: string;
    name: string;
    is_active: boolean;
    is_superuser: boolean;
    is_staff: boolean;
  };
  access?: string;
  refresh?: string;
}

interface StatsResponse extends ApiResponse {
  stats: {
    total_users: number;
    total_exams: number;
    total_questions: number;
    total_results: number;
    user_info: {
      username: string;
      email: string;
      name: string;
      is_superuser: boolean;
    };
    pending_approvals?: number;
    active_exams?: number;
    system_health?: {
      system_status: {
        memory_usage: number;
        cpu_usage: number;
        disk_usage: number;
      };
      metrics: Array<{
        timestamp: string;
        memory_usage: number;
        cpu_usage: number;
        disk_usage: number;
      }>;
    };
  };
}

interface LoginCredentials {
  username: string;
  password: string;
}

// Create axios instance
const adminApiClient = axios.create({
  baseURL: '/api/admin/',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// JWT token management
let adminAccessToken: string | null = null;
let adminRefreshToken: string | null = null;

function getAdminTokens() {
  if (!adminAccessToken) {
    adminAccessToken = localStorage.getItem('adminAccess');
  }
  if (!adminRefreshToken) {
    adminRefreshToken = localStorage.getItem('adminRefresh');
  }
  return { adminAccessToken, adminRefreshToken };
}

function setAdminTokens(access: string, refresh: string) {
  adminAccessToken = access;
  adminRefreshToken = refresh;
  localStorage.setItem('adminAccess', access);
  localStorage.setItem('adminRefresh', refresh);
}

function clearAdminTokens() {
  adminAccessToken = null;
  adminRefreshToken = null;
  localStorage.removeItem('adminAccess');
  localStorage.removeItem('adminRefresh');
}

// Request interceptor
adminApiClient.interceptors.request.use(
  async (config) => {
    // Add JWT token to all requests
    const { adminAccessToken } = getAdminTokens();
    if (adminAccessToken) {
      config.headers.Authorization = `Bearer ${adminAccessToken}`;
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor
adminApiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    console.error(
      '❌ Admin API Response Error:',
      error.response?.status,
      error.message
    );

    // Handle 401 Unauthorized errors by attempting token refresh
    if (error.response?.status === 401) {
      console.warn('🚨 Admin token expired (401). Attempting refresh...');

      try {
        const { adminRefreshToken } = getAdminTokens();
        if (adminRefreshToken) {
          const response = await axios.post('/api/admin/refresh/', {
            refresh: adminRefreshToken,
          });

          if (response.data.access) {
            setAdminTokens(response.data.access, response.data.refresh);
            // Retry the original request
            const originalRequest = error.config;
            if (originalRequest) {
              originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
              return adminApiClient(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        console.warn('⚠️ Token refresh failed:', refreshError);
      }

      // Clear tokens and redirect to login
      clearAdminTokens();
      localStorage.removeItem('adminUser');

      // Trigger a custom event that AuthContext can listen to
      window.dispatchEvent(new CustomEvent('admin-session-expired'));

      // Redirect to admin login if we're in admin panel
      if (
        window.location.pathname.startsWith('/admin-panel') &&
        window.location.pathname !== '/admin-panel/login'
      ) {
        window.location.href = '/admin-panel/login';
      }
    }

    return Promise.reject(error);
  }
);

// Error handler
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      'API request failed';
    throw new Error(message);
  }
  throw new Error(
    error instanceof Error ? error.message : 'Unknown error occurred'
  );
};

// Mock data for development
const mockUsers: User[] = [
  {
    id: 1,
    email: 'john.instructor@university.edu',
    name: 'John Smith',
    role: 'instructor',
    is_active: true,
    is_staff: false,
    is_superuser: false,
    created_at: '2024-01-15T10:30:00Z',
    last_login: '2024-01-20T14:30:00Z',
    last_logout: null,
  },
];

// ── Authentication ─────────────────────
export async function login(
  credentials: LoginCredentials
): Promise<LoginResponse> {
  try {
    const response = await adminApiClient.post<LoginResponse>(
      'login/',
      credentials
    );

    console.log('🔷 Raw API Response:', response.data);
    return response.data; // Return as-is, let AuthContext handle token
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function logout(): Promise<ApiResponse> {
  try {
    const response = await adminApiClient.post<ApiResponse>('logout/');
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// ── Admin data ─────────────────────────
export async function getStats(): Promise<StatsResponse['stats'] | null> {
  try {
    const response = await adminApiClient.get<any>('stats/');

    // The backend returns stats directly in response.data
    if (response.data && response.data.success) {
      const data = response.data.data;
      return {
        total_users: data.total_users || 0,
        total_exams: data.total_exams || 0,
        total_questions: data.total_questions || 0,
        total_results: data.total_results || 0,
        user_info: data.user_info || {
          username: 'Unknown',
          email: 'unknown@example.com',
          name: 'Unknown User',
          is_superuser: false,
        },
        pending_approvals: data.pending_approvals,
        active_exams: data.active_exams,
        system_health: data.system_health, // Include system health data
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    return null;
  }
}

export async function getCsrfToken(): Promise<{
  csrfToken: string;
  success: boolean;
}> {
  try {
    const response = await adminApiClient.get<{
      csrfToken: string;
      success: boolean;
    }>('csrf-token/');
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

export async function getHealth(): Promise<ApiResponse> {
  try {
    // Call stats endpoint which includes system health data
    const response = await adminApiClient.get<ApiResponse>('stats/');

    console.log('🔍 Raw stats response:', response.data);
    console.log('🔍 response.data keys:', Object.keys(response.data));
    console.log(
      '🔍 response.data.data keys:',
      Object.keys((response.data as any).data || {})
    );
    console.log(
      '🔍 response.data.data.system_health:',
      (response.data as any).data?.system_health
    );

    // The stats API returns: { success: true, data: { system_health: { system_status: {...}, metrics: [...] } } }
    const apiData = (response.data as any).data;
    const systemHealth = apiData?.system_health;

    console.log('🔍 apiData:', apiData);
    console.log('🔍 systemHealth:', systemHealth);
    console.log('🔍 systemHealth.system_status:', systemHealth?.system_status);
    console.log('🔍 systemHealth.metrics:', systemHealth?.metrics);

    return {
      success: true,
      data: {
        system_status: systemHealth?.system_status,
        metrics: systemHealth?.metrics || [],
      },
    };
  } catch (error: unknown) {
    console.error('❌ Admin API Response Error:', error);
    return {
      success: false,
      error: 'Failed to fetch health data',
    };
  }
}

// ── User Management ─────────────────────
export const users = {
  async list(params?: Record<string, unknown>): Promise<UserApiResponse> {
    try {
      const response = await adminApiClient.get<any>('users/', {
        params,
      });

      // Handle both wrapped and unwrapped responses
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else if (response.data.results) {
        // Direct response format
        return response.data;
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      // Return mock data for development when API fails
      return {
        count: mockUsers.length,
        next: null,
        previous: null,
        results: mockUsers,
      };
    }
  },

  async create(userData: Record<string, unknown>): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.post<ApiResponse>(
        'users/',
        userData
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  async update(
    userId: number,
    userData: Record<string, unknown>
  ): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.put<ApiResponse>(`users/`, {
        user_id: userId,
        ...userData,
      });
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  async updateStatus(userId: number, action: string): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.post<ApiResponse>('users/', {
        user_id: userId,
        action,
      });

      return response.data;
    } catch (error: unknown) {
      console.error('Error updating user status:', error);
      return handleApiError(error);
    }
  },

  async delete(userId: number): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.delete<ApiResponse>(
        `users/${userId}/`
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  // PII Management methods for GDPR compliance
  async archive(userId: number): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.put<ApiResponse>(
        `users/${userId}/archive/`
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  async exportData(userId: number): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.put<ApiResponse>(
        `users/${userId}/export/`
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  async bulkArchive(userIds: number[]): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.post<ApiResponse>(
        'users/bulk-archive/',
        {
          user_ids: userIds,
        }
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  async bulkDelete(userIds: number[]): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.post<ApiResponse>(
        'users/bulk-delete/',
        {
          user_ids: userIds,
          action: 'delete',
        }
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },
};

// ── Recent Activity ─────────────────────
export const recentActivity = {
  async list(): Promise<ApiResponse<RecentActivityResponse>> {
    try {
      const response = await adminApiClient.get<any>('recent-activity/');

      // Backend returns array directly
      if (Array.isArray(response.data)) {
        return {
          success: true,
          data: {
            activities: response.data,
            count: response.data.length,
            last_updated: new Date().toISOString(),
          },
        };
      }

      // Handle wrapped response
      if (response.data.success && response.data.data) {
        return response.data;
      }

      throw new Error('Invalid recent activity response format');
    } catch (error) {
      console.error('❌ Recent activity fetch error:', error);
      // Return empty activities instead of throwing
      return {
        success: false,
        data: {
          activities: [],
          count: 0,
          last_updated: new Date().toISOString(),
        },
        error: 'Failed to fetch recent activities',
      };
    }
  },
};

// ── Privacy Audit Log ─────────────────────
export const privacyAuditLog = {
  async list(params?: {
    page?: number;
    page_size?: number;
  }): Promise<ApiResponse<PrivacyAuditLogResponse>> {
    try {
      const response = await adminApiClient.get('/privacy-audit/', { params });
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },

  async create(data: {
    action: string;
    description: string;
    user_email?: string;
    admin_user?: string;
  }): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.post('/privacy-audit/', data);
      return response.data;
    } catch (error) {
      return handleApiError(error);
    }
  },
};

// ── Exam Management ─────────────────────
export const exams = {
  async list(): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.get<ApiResponse>('exams/');
      return response.data;
    } catch {
      // Return mock data for development
      return {
        success: true,
        data: { results: [], count: 0 },
      };
    }
  },

  async create(examData: Record<string, unknown>): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.post<ApiResponse>(
        'exams/',
        examData
      );
      return response.data;
    } catch {
      throw new Error('Failed to create exam');
    }
  },

  async update(
    examId: number,
    examData: Record<string, unknown>
  ): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.put<ApiResponse>(
        `exams/${examId}/`,
        examData
      );
      return response.data;
    } catch (error: unknown) {
      return handleApiError(error);
    }
  },

  async delete(examId: number): Promise<ApiResponse> {
    try {
      const response = await adminApiClient.delete<ApiResponse>(
        `exams/${examId}/`
      );
      return response.data;
    } catch {
      throw new Error('Failed to delete exam');
    }
  },
};

// ── Analytics ─────────────────────
export async function getAnalytics(): Promise<ApiResponse> {
  try {
    const response = await adminApiClient.get<ApiResponse>('analytics/');
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// ── Results ─────────────────────
export async function getResults(): Promise<ApiResponse> {
  try {
    const response = await adminApiClient.get<ApiResponse>('results/');
    return response.data;
  } catch (error: unknown) {
    return handleApiError(error);
  }
}

// ── Global Settings API (UR 1.3) ─────────────────────
export const globalSettings = {
  async getAll(): Promise<any> {
    try {
      const response = await adminApiClient.get<any>('global-settings/');
      return response.data;
    } catch (error: unknown) {
      console.error('Error loading global settings:', error);
      return handleApiError(error);
    }
  },

  async create(settingData: any): Promise<any> {
    try {
      const response = await adminApiClient.post<any>(
        'global-settings/',
        settingData
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Error creating global setting:', error);
      return handleApiError(error);
    }
  },

  async update(settingData: any): Promise<any> {
    try {
      const response = await adminApiClient.put<any>(
        'global-settings/',
        settingData
      );
      return response.data;
    } catch (error: unknown) {
      console.error('Error updating global setting:', error);
      return handleApiError(error);
    }
  },

  templates: {
    async getAll(params?: Record<string, any>): Promise<any> {
      try {
        const response = await adminApiClient.get('templates/', {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async create(templateData: any): Promise<any> {
      try {
        const response = await adminApiClient.post('templates/', templateData);
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async update(templateId: number, templateData: any): Promise<any> {
      try {
        const response = await adminApiClient.put(
          `templates/${templateId}/`,
          templateData
        );
        return response.data;
      } catch (error) {
        console.error('Error updating template:', error);
        throw error;
      }
    },

    async delete(templateId: number): Promise<any> {
      try {
        const response = await adminApiClient.delete(
          `templates/${templateId}/`
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    setDefault: async (templateId: number) => {
      try {
        const response = await adminApiClient.post('templates/', {
          action: 'set_default',
          template_id: templateId,
        });
        return response.data;
      } catch (error) {
        console.error('Error setting template as default:', error);
        throw error;
      }
    },
  },

  markingSchemes: {
    async getAll(params?: Record<string, any>): Promise<any> {
      try {
        const response = await adminApiClient.get('settings/marking-schemes/', {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async create(schemeData: any): Promise<any> {
      try {
        const response = await adminApiClient.post(
          'settings/marking-schemes/',
          schemeData
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async update(schemeId: number, schemeData: any): Promise<any> {
      try {
        const response = await adminApiClient.put(
          `settings/marking-schemes/${schemeId}/`,
          schemeData
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async delete(schemeId: number): Promise<any> {
      try {
        const response = await adminApiClient.delete(
          `settings/marking-schemes/${schemeId}/`
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },
  },

  // Exam Formats
  examFormats: {
    async getAll(params?: Record<string, any>): Promise<any> {
      try {
        const response = await adminApiClient.get('settings/exam-formats/', {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async create(formatData: any): Promise<any> {
      try {
        const response = await adminApiClient.post(
          'settings/exam-formats/',
          formatData
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async update(formatId: number, formatData: any): Promise<any> {
      try {
        const response = await adminApiClient.put(
          `settings/exam-formats/${formatId}/`,
          formatData
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },

    async delete(formatId: number): Promise<any> {
      try {
        const response = await adminApiClient.delete(
          `settings/exam-formats/${formatId}/`
        );
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },
  },

  // Overview APIs
  coursesOverview: {
    async getAll(params?: Record<string, any>): Promise<any> {
      try {
        const response = await adminApiClient.get('courses-overview/', {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },
  },

  examsOverview: {
    async getAll(params?: Record<string, any>): Promise<any> {
      try {
        const response = await adminApiClient.get('exams-overview/', {
          params,
        });
        return response.data;
      } catch (error: unknown) {
        return handleApiError(error);
      }
    },
  },
};

// Default export for compatibility
export default {
  login,
  logout,
  getStats,
  getHealth,
  getCsrfToken,
  users,
  exams,
  getAnalytics,
  getResults,
};

// Main adminApi export
export const adminApi = {
  login,
  logout,
  getStats,
  getHealth,
  getCsrfToken,
  users,
  recentActivity,
  exams,
  getAnalytics,
  getResults,
  globalSettings,
};

// Export types
export type {
  User,
  UserApiResponse,
  LoginResponse,
  StatsResponse,
  ApiResponse,
};
