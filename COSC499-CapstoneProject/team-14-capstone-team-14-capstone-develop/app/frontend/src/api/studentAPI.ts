// src/api/studentAPI.ts
import axiosInstance from './axiosInstance';

// Update the Student interface to include preferred_name
export interface Student {
  id: number;
  student_id: string;
  name: string;
  preferred_name?: string; // Optional preferred name
  effective_name?: string; // Computed name (preferred name + last name)
  email?: string;
  section?: string;
  is_anonymous: boolean;
  enrolled_at: string;
  is_active: boolean;
  display_name: string;
  display_id: string;
  overall_score?: number;
  created_at?: string;
  notes?: string;
  dropped_at?: string;
  anonymous_id?: string;
}

// Update the transform function to handle preferred_name
const transformStudent = (b: {
  id: number;
  student_id: string;
  name: string;
  preferred_name?: string;
  effective_name?: string;
  email: string;
  section: string;
  display_id: string;
  overall_score?: number;
  is_anonymous?: boolean;
  enrolled_at?: string;
  is_active?: boolean;
  display_name?: string;
  created_at?: string;
  notes?: string;
  dropped_at?: string;
  anonymous_id?: string;
}): Student => ({
  id: b.id,
  student_id: b.student_id,
  name: b.name,
  preferred_name: b.preferred_name,
  effective_name: b.effective_name,
  email: b.email,
  section: b.section,
  is_anonymous: b.is_anonymous || false,
  enrolled_at: b.enrolled_at || '',
  is_active: b.is_active !== undefined ? b.is_active : true,
  display_name: b.display_name || b.name,
  display_id: b.display_id,
  overall_score: b.overall_score,
  created_at: b.created_at,
  notes: b.notes,
  dropped_at: b.dropped_at,
  anonymous_id: b.anonymous_id,
});

export const studentAPI = {
  // List students
  async getStudents(courseId: number): Promise<Student[]> {
    const resp = await axiosInstance.get(`/courses/${courseId}/students/`);
    const data = resp.data;
    const arr = Array.isArray(data)
      ? data
      : Array.isArray(data.students)
        ? data.students
        : [];
    return arr.map(transformStudent);
  },

  // Get one student
  async getStudentDetail(
    courseId: number,
    studentId: number
  ): Promise<Student> {
    const resp = await axiosInstance.get(
      `/courses/${courseId}/students/${studentId}/`
    );
    return transformStudent(resp.data);
  },

  // Create a new student - now accepts preferred_name
  async createStudent(
    courseId: number,
    data: {
      student_id: string;
      name: string; // Full legal name
      preferred_name?: string; // Optional preferred name
      email: string;
      section: string;
      is_anonymous: boolean;
    }
  ): Promise<Student> {
    const payload = {
      student_id: data.student_id,
      name: data.name,
      preferred_name: data.preferred_name,
      email: data.email,
      section: data.section,
      is_anonymous: data.is_anonymous,
    };
    const resp = await axiosInstance.post(
      `/courses/${courseId}/students/`,
      payload
    );
    return transformStudent(resp.data);
  },

  // Update an existing student - now accepts preferred_name
  async updateStudent(
    courseId: number,
    studentId: number,
    data: Partial<{
      student_id: string;
      name: string; // Full legal name
      preferred_name?: string; // Optional preferred name
      email: string;
      section: string;
      is_anonymous: boolean;
      is_active: boolean;
      notes: string;
    }>
  ): Promise<Student> {
    const payload: Record<string, unknown> = {};
    if (data.student_id !== undefined) payload.student_id = data.student_id;
    if (data.name !== undefined) payload.name = data.name;
    if (data.preferred_name !== undefined)
      payload.preferred_name = data.preferred_name;
    if (data.email !== undefined) payload.email = data.email;
    if (data.section !== undefined) payload.section = data.section;
    if (data.is_anonymous !== undefined)
      payload.is_anonymous = data.is_anonymous;
    if (data.is_active !== undefined) payload.is_active = data.is_active;
    if (data.notes !== undefined) payload.notes = data.notes;

    const resp = await axiosInstance.patch(
      `/courses/${courseId}/students/${studentId}/`,
      payload
    );
    return transformStudent(resp.data);
  },

  // Delete a student
  async deleteStudent(courseId: number, studentId: number): Promise<void> {
    await axiosInstance.delete(`/courses/${courseId}/students/${studentId}/`);
  },

  // Delete all students for a course
  async deleteAllStudents(courseId: number): Promise<void> {
    await axiosInstance.delete(`/courses/${courseId}/students/delete_all/`);
  },

  // Anonymize all students for a course
  async anonymizeAllStudents(courseId: number): Promise<void> {
    await axiosInstance.post(`/courses/${courseId}/students/anonymize_all/`);
  },

  // Deanonymize all students for a course
  async deanonymizeAllStudents(courseId: number): Promise<void> {
    await axiosInstance.post(`/courses/${courseId}/students/deanonymize_all/`);
  },

  // Bulk import
  async importStudents(courseId: number, csvFile: File): Promise<Student[]> {
    const form = new FormData();
    form.append('file', csvFile);
    const resp = await axiosInstance.post(
      `/courses/${courseId}/students/import_csv/`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return (resp.data as Array<Parameters<typeof transformStudent>[0]>).map(
      transformStudent
    );
  },

  // Bulk export
  async exportStudents(courseId: number): Promise<Blob> {
    const resp = await axiosInstance.get(
      `/courses/${courseId}/students/export_csv/`,
      { responseType: 'blob' }
    );
    return resp.data;
  },
};
