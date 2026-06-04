const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export interface Student {
  id: string;
  roll_number: string;
  enrollment_number: string | null;
  name: string;
  father_name: string | null;
  branch: 'CSE' | 'CSE_AIML' | 'CST' | string;
  gender: string | null;
  has_submitted: boolean;
  created_at: string;
}

export interface OverallResult {
  id: string;
  student_id: string;
  roll_number: string;
  total_semesters_submitted: number;
  overall_sgpa: number | null;
  total_backs: number;
  has_backs: boolean;
  raw_session_summary: string | null;
  uploaded_at: string;
  updated_at: string;
  students?: Student;
}

export interface LeaderboardEntry extends OverallResult {
  students: Student;
}

export interface SemesterResult {
  id: string;
  student_id: string;
  roll_number: string;
  semester: number;
  sgpa: number | null;
  total_marks: number | null;
  result_status: string | null;
  backs_in_sem: number;
  date_of_declaration: string | null;
  students?: Student;
}

export interface SubjectMark {
  id: string;
  student_id: string;
  roll_number: string;
  semester: number;
  subject_code: string;
  subject_name: string;
  subject_type: 'Theory' | 'Practical' | 'CA' | string;
  internal_marks: number | null;
  external_marks: number | null;
  total_marks: number | null;
  grade: string | null;
  is_back: boolean;
  students?: Student;
}

export interface BatchStats {
  total_students: number;
  total_submitted: number;
  average_sgpa: number;
  total_backs: number;
}

export interface SubjectToppers {
  subject_name: string;
  subject_code: string;
  top_3: (SubjectMark & { students: Student })[];
}

export async function fetchStats(): Promise<BatchStats> {
  const res = await fetch(`${API_BASE_URL}/students/stats`);
  if (!res.ok) throw new Error('Failed to fetch batch stats');
  return res.json();
}

export interface LeaderboardFilterParams {
  branch?: string;
  sort?: 'sgpa' | 'backs';
  order?: 'asc' | 'desc';
  has_backs?: boolean;
  limit?: number;
  offset?: number;
}

export async function fetchLeaderboard(params: LeaderboardFilterParams = {}): Promise<{ data: LeaderboardEntry[] }> {
  const url = new URL(`${API_BASE_URL}/leaderboard`);
  if (params.branch) url.searchParams.append('branch', params.branch);
  if (params.sort) url.searchParams.append('sort', params.sort);
  if (params.order) url.searchParams.append('order', params.order);
  if (params.has_backs !== undefined) url.searchParams.append('has_backs', String(params.has_backs));
  if (params.limit) url.searchParams.append('limit', String(params.limit));
  if (params.offset) url.searchParams.append('offset', String(params.offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}

export async function fetchSemesterLeaderboard(
  sem: number,
  branch?: string,
  limit?: number,
  offset?: number
): Promise<{ data: (SemesterResult & { students: Student })[] }> {
  const url = new URL(`${API_BASE_URL}/leaderboard/semester/${sem}`);
  if (branch) url.searchParams.append('branch', branch);
  if (limit) url.searchParams.append('limit', String(limit));
  if (offset) url.searchParams.append('offset', String(offset));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Failed to fetch leaderboard for semester ${sem}`);
  return res.json();
}

export async function fetchSubjectToppers(semester: number, branch?: string): Promise<{ data: SubjectToppers[] }> {
  const url = new URL(`${API_BASE_URL}/leaderboard/subject`);
  url.searchParams.append('semester', String(semester));
  if (branch) url.searchParams.append('branch', branch);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Failed to fetch subject toppers');
  return res.json();
}

export async function searchStudents(query: string): Promise<{ data: Student[] }> {
  const res = await fetch(`${API_BASE_URL}/students/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Failed to search students');
  return res.json();
}

export interface StudentDetails {
  student: Student;
  result: OverallResult | null;
  semesters: (SemesterResult & { subjects: SubjectMark[] })[];
}

export async function fetchStudentDetails(rollNumber: string): Promise<StudentDetails> {
  const res = await fetch(`${API_BASE_URL}/students/${rollNumber}`);
  if (!res.ok) throw new Error('Failed to fetch student details');
  return res.json();
}


export async function uploadResult(file: File, inviteCode: string): Promise<{ message: string; roll_number: string }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('invite_code', inviteCode);

  const res = await fetch(`${API_BASE_URL}/upload/`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Unknown error uploading result' }));
    throw new Error(errorData.detail || 'Upload failed');
  }

  return res.json();
}

// Admin Helpers
function getAdminHeaders(token: string) {
  return {
    'Authorization': `Bearer ${token}`,
  };
}

export async function adminFetchAllStudents(token: string): Promise<{ data: Student[] }> {
  const res = await fetch(`${API_BASE_URL}/admin/all-students`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Unauthorized or failed to fetch admin student list');
  return res.json();
}

export async function adminFetchNotSubmitted(token: string): Promise<{ data: Student[] }> {
  const res = await fetch(`${API_BASE_URL}/admin/not-submitted`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Unauthorized or failed to fetch admin not submitted list');
  return res.json();
}

export interface AdminBacks {
  students_with_backs: (OverallResult & { students: Student })[];
  back_subjects: (SubjectMark & { students: Student })[];
}

export async function adminFetchBacks(token: string): Promise<AdminBacks> {
  const res = await fetch(`${API_BASE_URL}/admin/backs`, {
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Unauthorized or failed to fetch admin backs list');
  return res.json();
}

export async function adminDeleteStudentResult(rollNumber: string, token: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/admin/student/${rollNumber}`, {
    method: 'DELETE',
    headers: getAdminHeaders(token),
  });
  if (!res.ok) throw new Error('Unauthorized or failed to delete student result');
  return res.json();
}
