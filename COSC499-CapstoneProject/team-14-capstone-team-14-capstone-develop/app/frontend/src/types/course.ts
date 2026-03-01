export interface Course {
  id: number;
  code: string;
  title: string;
  description?: string;
  term: string;
  bannerURL?: string;
  exams: number;
  students: number;
  avgScore: number;
  lastEdited: string;
  created_at: string;
  updated_at: string;
  instructor?: string | null;
  default_sec_access: string;
  default_ta_access: string;
  default_oth_access: string;
}
