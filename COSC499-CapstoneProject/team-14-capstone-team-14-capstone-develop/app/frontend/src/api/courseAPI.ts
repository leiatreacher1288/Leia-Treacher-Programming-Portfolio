// src/api/courseAPI.ts
import axiosInstance from './axiosInstance';

/* ───────────────────────────────────────────────────────────────
   1.  Shared Types
──────────────────────────────────────────────────────────────── */
export interface Course {
  id: number;
  code: string;
  title: string;
  description: string;
  term: string;
  bannerUrl: string | null;
  exams: number;
  students: number;
  avgScore: number;
  lastEdited: string;
  created_at: string;
  updated_at: string;
  instructor: string | null;

  /* ⚑ NEW — per‑role default access */
  default_sec_access: 'FULL' | 'LIMITED' | 'NONE';
  default_ta_access: 'FULL' | 'LIMITED' | 'NONE';
  default_oth_access: 'FULL' | 'LIMITED' | 'NONE';
}

export interface CourseActivity {
  id: number;
  user: string;
  user_id: number;
  activity_type: string;
  description: string;
  entity_type: string;
  entity_id: number;
  created_at: string;
}

export interface CourseInstructor {
  id: number; // user‑id
  email: string;
  name: string;
  role: 'MAIN' | 'SEC' | 'TA' | 'OTH';
  access: 'FULL' | 'LIMITED' | 'NONE';
  accepted: boolean;
}

export interface CourseInvite {
  id: number;
  courseId: number;
  courseCode: string;
  courseTitle: string;
  inviterName: string;
  inviterEmail: string;
  role: 'SEC' | 'TA' | 'OTH';
  permissions: 'FULL' | 'LIMITED' | 'NONE';
  createdAt: string;
}

export interface Student {
  id: number;
  student_id: string;
  display_id: string;
  name: string;
  preferred_name?: string;
  effective_name?: string;
  display_name: string;
  email: string;
  section: string;
  is_active: boolean;
  enrolled_at: string;
  created_at: string;
  dropped_at?: string;
  notes: string;
  is_anonymous: boolean;
  anonymous_id?: string;
  overall_score: number;
}

/* ───────────────────────────────────────────────────────────────
   2.  Transform helpers
──────────────────────────────────────────────────────────────── */
const transformCourse = (b: {
  id: number;
  code: string;
  name: string;
  description?: string;
  term: string;
  banner?: string;
  exam_count?: number;
  student_count?: number;
  avg_score?: number;
  last_edited?: string;
  last_modified?: string;
  updated_at?: string;
  created_at?: string;
  instructor?: string;

  /* ⚑ default‑access fields come straight from serializer */
  default_sec_access?: 'FULL' | 'LIMITED' | 'NONE';
  default_ta_access?: 'FULL' | 'LIMITED' | 'NONE';
  default_oth_access?: 'FULL' | 'LIMITED' | 'NONE';
}): Course => ({
  id: b.id,
  code: b.code,
  title: b.name,
  description: b.description ?? '',
  term: b.term,
  bannerUrl: b.banner ?? null,
  exams: b.exam_count ?? 0,
  students: b.student_count ?? 0,
  avgScore: b.avg_score ?? 0,
  lastEdited: b.last_edited ?? b.last_modified ?? b.updated_at ?? '',
  created_at: b.created_at ?? new Date().toISOString(),
  updated_at: b.updated_at ?? new Date().toISOString(),
  instructor: b.instructor ?? null,

  /* ⚑  pass‑through (backend already gives sane defaults) */
  default_sec_access: b.default_sec_access ?? 'LIMITED',
  default_ta_access: b.default_ta_access ?? 'LIMITED',
  default_oth_access: b.default_oth_access ?? 'NONE',
});

const transformInstructor = (b: {
  id: number;
  email: string;
  name: string;
  role: 'MAIN' | 'SEC' | 'TA' | 'OTH';
  access: 'FULL' | 'LIMITED' | 'NONE';
  accepted: boolean;
}): CourseInstructor => ({
  id: b.id,
  email: b.email,
  name: b.name,
  role: b.role,
  access: b.access,
  accepted: b.accepted,
});

const transformInvite = (b: {
  id: number;
  course_id: number;
  course_code: string;
  course_title: string;
  inviter_name: string;
  inviter_email: string;
  role: 'SEC' | 'TA' | 'OTH';
  permissions: 'FULL' | 'LIMITED' | 'NONE';
  created_at: string;
}): CourseInvite => ({
  id: b.id,
  courseId: b.course_id,
  courseCode: b.course_code,
  courseTitle: b.course_title,
  inviterName: b.inviter_name,
  inviterEmail: b.inviter_email,
  role: b.role,
  permissions: b.permissions,
  createdAt: b.created_at,
});

/* ───────────────────────────────────────────────────────────────
   3.  API wrapper
──────────────────────────────────────────────────────────────── */
export const courseAPI = {
  // ── COURSES ───────────────────────────────────────────────
  async getCourses(): Promise<Course[]> {
    const resp = await axiosInstance.get('/courses/');
    return (resp.data as Array<any>).map(transformCourse);
  },

  async createCourse(data: {
    code: string;
    name: string;
    description: string;
    term: string;
    banner?: string;
  }): Promise<Course> {
    const resp = await axiosInstance.post('/courses/', {
      code: data.code,
      name: data.name,
      description: data.description,
      term: data.term,
      ...(data.banner ? { banner: data.banner } : {}),
    });
    return transformCourse(resp.data);
  },

  async getCourseDetail(courseId: number): Promise<Course> {
    const resp = await axiosInstance.get(`/courses/${courseId}/`);
    return transformCourse(resp.data);
  },

  async updateCourse(
    courseId: number,
    data: Partial<{
      code: string;
      name: string;
      description: string;
      term: string;
      banner: string;
    }>
  ): Promise<Course> {
    const resp = await axiosInstance.patch(`/courses/${courseId}/`, data);
    return transformCourse(resp.data);
  },

  async deleteCourse(courseId: number): Promise<void> {
    await axiosInstance.delete(`/courses/${courseId}/`);
  },

  // ── INSTRUCTORS ───────────────────────────────────────────
  async getInstructors(courseId: number): Promise<CourseInstructor[]> {
    const resp = await axiosInstance.get(`/courses/${courseId}/instructors/`);
    return (resp.data as Array<any>).map(transformInstructor);
  },

  async inviteInstructor(
    courseId: number,
    email: string,
    role: 'MAIN' | 'SEC' | 'TA' | 'OTH' = 'SEC',
    access?: 'FULL' | 'LIMITED' | 'NONE' // optional override
  ): Promise<CourseInstructor> {
    const resp = await axiosInstance.post(
      `/courses/${courseId}/add_instructor/`,
      { email, role, ...(access ? { access } : {}) }
    );
    return transformInstructor(resp.data);
  },

  async removeInstructor(courseId: number, email: string): Promise<void> {
    await axiosInstance.post(`/courses/${courseId}/remove_instructor/`, {
      email,
    });
  },

  /* ⚑ NEW — per‑role default access */
  async updateDefaultAccess(
    courseId: number,
    role: 'SEC' | 'TA' | 'OTH',
    access: 'FULL' | 'LIMITED' | 'NONE'
  ): Promise<void> {
    await axiosInstance.put(`/courses/${courseId}/default_access/${role}/`, {
      access,
    });
  },

  /* (legacy / optional) — only keep if you actually wire this endpoint */
  async updateInstructorAccess(
    courseId: number,
    userId: number,
    access: 'FULL' | 'LIMITED' | 'NONE'
  ): Promise<CourseInstructor> {
    const resp = await axiosInstance.patch(
      `/courses/${courseId}/instructors/${userId}/`,
      { access }
    );
    return transformInstructor(resp.data);
  },

  async inviteCollaborator(
    courseId: number,
    email: string,
    role: 'SEC' | 'TA' | 'OTH' = 'SEC',
    access?: 'FULL' | 'LIMITED' | 'NONE' // optional override
  ): Promise<CourseInstructor> {
    const resp = await axiosInstance.post(
      `/courses/${courseId}/add_instructor/`, // ← new endpoint
      { email, role, ...(access ? { access } : {}) }
    );
    return transformInstructor(resp.data); // ← new transform
  },

  // ── INVITES ───────────────────────────────────────────────
  async getPendingInvites(): Promise<CourseInvite[]> {
    const resp = await axiosInstance.get('/courses/invites/pending/');
    return (resp.data as Array<any>).map(transformInvite);
  },

  async acceptInvite(inviteId: number): Promise<void> {
    await axiosInstance.post(`/courses/invites/${inviteId}/accept/`);
  },

  async declineInvite(inviteId: number): Promise<void> {
    await axiosInstance.post(`/courses/invites/${inviteId}/decline/`);
  },

  async leaveCourse(courseId: number): Promise<void> {
    await axiosInstance.post(`/courses/${courseId}/leave/`);
  },

  // ── STUDENTS ──────────────────────────────────────────────
  async getStudents(courseId: number): Promise<Student[]> {
    const resp = await axiosInstance.get(`/courses/${courseId}/students/`);
    return resp.data as Student[];
  },

  startExport: async (courseId: number, options: any) => {
    const response = await axiosInstance.post(
      `/courses/${courseId}/export/`,
      options
    );
    return response.data;
  },

  getExportStatus: async (courseId: number, jobId: string) => {
    const response = await axiosInstance.get(
      `/courses/${courseId}/export/${jobId}/status/`
    );
    return response.data;
  },

  downloadExport: async (courseId: number, jobId: string) => {
    const response = await axiosInstance.get(
      `/courses/${courseId}/export/${jobId}/download/`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  async getCourseActivity(courseId: number): Promise<CourseActivity[]> {
    const resp = await axiosInstance.get(`/courses/${courseId}/activity/`);
    return resp.data;
  },

  exportCourse: async (courseId: number, options: any) => {
    const response = await axiosInstance.post(
      `/courses/${courseId}/export/`,
      options,
      { responseType: 'blob' }
    );
    return response.data;
  },

  getExportHistory: async (courseId: number) => {
    const response = await axiosInstance.get(
      `/courses/${courseId}/export/history/`
    );
    return response.data;
  },

  async getStudent(courseId: number, studentId: number): Promise<Student> {
    const resp = await axiosInstance.get(
      `/courses/${courseId}/students/${studentId}/`
    );
    return resp.data as Student;
  },
};
