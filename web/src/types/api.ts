export type AccountType = "student" | "teacher" | "school_admin";
export type MembershipRole = "owner" | "admin" | "teacher" | "student";
export type ChapterStatus = "pending" | "queued" | "generating" | "vectorizing" | "ready" | "failed";
export type BookStatus = "uploaded" | "toc_running" | "toc_ready" | "generating" | "ready" | "failed";

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  account_type: AccountType;
  is_active?: boolean;
  dp?: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface StudentProfile {
  user_id: string;
  current_grade: number;
  language: string;
}

export interface TeacherProfile {
  user_id: string;
  bio?: string;
  availability_open: boolean;
  offered_subjects?: string[];
}

export interface Membership {
  id: string;
  school_id: string;
  school_name?: string;
  role: MembershipRole;
  status: string;
}

export interface MeProfile {
  user: User;
  student_profile?: StudentProfile;
  teacher_profile?: TeacherProfile;
  memberships: Membership[];
}

export interface School {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  created_at: string;
}

export interface Invitation {
  id: string;
  school_id: string;
  school_name?: string;
  teacher_user_id: string;
  teacher_email?: string;
  status: string;
  message?: string;
  created_at: string;
}

export interface Application {
  id: string;
  school_id: string;
  school_name?: string;
  student_user_id: string;
  student_email?: string;
  grade_level: number;
  status: string;
  note?: string;
  created_at: string;
}

export interface Book {
  id: string;
  subject_id: string;
  title: string;
  language: string;
  status: BookStatus;
  page_count?: number;
  original_filename?: string;
  created_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  title: string;
  order_index: number;
  page_start?: number;
  page_end?: number;
  status: ChapterStatus;
  embed_url?: string | null;
  progress?: number;
  quiz_attempts?: number;
  is_completed?: boolean;
}

export interface Subject {
  id?: string;
  school_id?: string;
  name: string;
  description: string;
  grade_level: number;
  total_chapters?: number;
  completed_chapters?: number;
  progress?: number;
}

export interface SubjectDetail extends Subject {
  book?: Book | null;
  chapters?: Chapter[];
}

export interface Job {
  id: string;
  book_id: string;
  chapter_id?: string | null;
  job_type: string;
  status: string;
  progress_pct: number;
  current_step?: string;
  error?: string;
  created_at: string;
  book_title?: string;
}

export type AttendanceStatus = "present" | "absent" | "late" | "excused";

export interface EnrollmentRecord {
  id: string;
  school_id: string;
  subject_id: string;
  student_user_id: string;
  status: string;
  student_email?: string;
  student_name?: string;
  subject_name?: string;
}

export interface AttendanceRecord {
  id: string;
  enrollment_id: string;
  on_date: string;
  status: AttendanceStatus;
  recorded_by: string;
  note?: string;
  student_email?: string;
  subject_name?: string;
}

export interface ActivityEvent {
  id: string;
  school_id?: string;
  actor_id: string;
  actor_role?: string;
  verb: string;
  object_type: string;
  object_id?: string;
  extra?: Record<string, unknown>;
  created_at: string;
}

export interface Question {
  question_id: string;
  question_text: string;
  question_type: string;
  options?: string[];
  correct_answer: string;
}

export interface Quiz {
  id: string;
  chapter_id?: string;
  chapter_title?: string;
  lesson_title?: string;
  quiz_questions: Question[];
  created_at: string;
}

export interface QuizAttempt {
  id: string;
  student_id?: string;
  quiz_version: number;
  start_time: string;
  chapter_title?: string;
  lesson_title?: string;
  end_time: string;
  score: number;
  passed: boolean;
  ai_feedback?: string;
  cheating_detected?: boolean;
  responses: QuizResponse[];
}

export interface QuizResponse {
  question_id: string;
  student_answer: string;
}

export interface QuizSubmission {
  quiz_id: string;
  responses: QuizResponse[];
}

export interface StudentDashboardStats {
  completed_chapters: number;
  total_chapters: number;
  avg_score: number;
  streak: number;
  completed_lessons?: number;
  total_lessons?: number;
}

export interface StudentDashboard {
  enrollments: Subject[];
  applications?: Application[];
  stats: StudentDashboardStats;
}

export interface SchoolDashboard {
  school: School;
  total_students: number;
  total_teachers: number;
  total_subjects: number;
  total_chapters: number;
  recent_activity: ActivityEvent[];
}

export interface StudentPerformanceRow {
  enrollment_id: string;
  student_user_id: string;
  student_name?: string;
  student_email?: string;
  subject_id: string;
  subject_name?: string;
  chapters_completed: number;
  total_chapters: number;
  progress_pct: number;
  avg_score: number;
  quiz_attempts: number;
  attendance_rate?: number | null;
  attendance_present: number;
  attendance_total: number;
  time_spent_seconds: number;
  last_concept?: string;
  last_activity_at?: string;
}

export interface SchoolPerformance {
  school_id: string;
  rows: StudentPerformanceRow[];
  avg_score: number;
  avg_progress: number;
  avg_attendance?: number | null;
}

export interface AIMessage {
  role: string;
  content: string;
}

export interface AIAssistRequest {
  subject_id: string;
  chapter_id?: string;
  lesson_id?: string;
  user_messages: AIMessage[];
}

export interface AIAssistResponse {
  ai_response: string;
  citations?: Array<{ page?: number; paragraph_id?: string; excerpt?: string }>;
}

export interface QuizAttemptResponsesOut {
  question_id: string;
  question_text: string;
  question_type: string;
  student_answer: string;
  correct_answer: string;
}

export interface QuizAttemptOut {
  id: string;
  chapter_title?: string;
  lesson_title?: string;
  start_time: string;
  end_time?: string;
  score?: number;
  passed: boolean;
  ai_feedback?: string;
  quiz_version?: number;
  cheating_detected?: boolean;
  responses: QuizAttemptResponsesOut[];
}

/** @deprecated Use MeProfile */
export type StudentProfileBundle = MeProfile;
/** @deprecated Use Chapter */
export type Lesson = Chapter;
/** @deprecated Use Subject */
export type Enrollment = Subject;
