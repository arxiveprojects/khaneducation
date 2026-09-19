import {
  User,
  AuthResponse,
  Subject,
  SubjectDetail,
  Chapter,
  Quiz,
  MeProfile,
  QuizAttempt,
  StudentDashboard,
  SchoolDashboard,
  AIAssistRequest,
  AIAssistResponse,
  QuizSubmission,
  QuizAttemptOut,
  School,
  Invitation,
  Application,
  Book,
  Job,
  TeacherProfile,
  AccountType,
  EnrollmentRecord,
  AttendanceRecord,
  AttendanceStatus,
  ActivityEvent,
  SchoolPerformance,
} from "@/types/api";
import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? "http://127.0.0.1:8000" : "https://api.khaneducation.ai");

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function loginUser(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await api.post("/auth/login", { email, password });
    localStorage.setItem("accessToken", response.data.access_token);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      const response = await api.post("/login", { email, password });
      localStorage.setItem("accessToken", response.data.access_token);
      return response.data;
    }
    throw error;
  }
}

export async function registerUser(userData: Partial<User> & { account_type?: AccountType }): Promise<User> {
  const response = await api.post("/auth/register", userData);
  return response.data;
}

export async function getCurrentUser(): Promise<MeProfile> {
  const response = await api.get("/users/me");
  return response.data;
}

export async function updateUserProfile(profileData: Partial<User>): Promise<User> {
  const response = await api.put("/users/me", profileData);
  return response.data;
}

export async function updateStudentProfile(profileData: { language?: string; current_grade?: number }): Promise<MeProfile["student_profile"]> {
  const response = await api.put("/users/me/student", profileData);
  return response.data;
}

export async function updateTeacherProfile(profileData: Partial<TeacherProfile>): Promise<TeacherProfile> {
  const response = await api.put("/users/me/teacher", profileData);
  return response.data;
}

export async function getLanguages(): Promise<string[]> {
  const response = await api.get("/languages");
  return response.data;
}

export async function getAiAssistance(request: AIAssistRequest): Promise<AIAssistResponse> {
  const response = await api.post("/assistant/query", {
    subject_id: request.subject_id,
    chapter_id: request.chapter_id || request.lesson_id,
    user_messages: request.user_messages,
  });
  return response.data;
}

export async function getSchools(): Promise<School[]> {
  const response = await api.get("/schools/");
  return response.data;
}

export async function createSchool(data: { name: string; description?: string; address?: string }): Promise<School> {
  const response = await api.post("/schools/", data);
  return response.data;
}

export async function getSchoolDashboard(schoolId: string): Promise<SchoolDashboard> {
  const response = await api.get(`/schools/${schoolId}/dashboard`);
  return response.data;
}

export async function inviteTeacher(schoolId: string, email: string, message?: string): Promise<Invitation> {
  const response = await api.post(`/schools/${schoolId}/invitations`, { email, message });
  return response.data;
}

export async function listInvitations(schoolId: string): Promise<Invitation[]> {
  const response = await api.get(`/schools/${schoolId}/invitations`);
  return response.data;
}

export async function applyToSchool(schoolId: string, grade_level: number): Promise<Application> {
  const response = await api.post(`/schools/${schoolId}/applications`, { grade_level });
  return response.data;
}

export async function listApplications(schoolId: string): Promise<Application[]> {
  const response = await api.get(`/schools/${schoolId}/applications`);
  return response.data;
}

export async function reviewApplication(
  schoolId: string,
  applicationId: string,
  status: "accepted" | "rejected",
  subject_ids: string[] = []
): Promise<Application> {
  const response = await api.post(`/schools/${schoolId}/applications/${applicationId}/review`, { status, subject_ids });
  return response.data;
}

export async function createSubject(schoolId: string, data: Omit<Subject, "id">): Promise<Subject> {
  const response = await api.post(`/schools/${schoolId}/subjects`, data);
  return response.data;
}

export async function listSchoolSubjects(schoolId: string): Promise<Subject[]> {
  const response = await api.get(`/schools/${schoolId}/subjects`);
  return response.data;
}

export async function assignTeacher(schoolId: string, subjectId: string, teacher_user_id: string): Promise<void> {
  await api.post(`/schools/${schoolId}/subjects/${subjectId}/assign-teacher`, { teacher_user_id });
}

export async function enrollStudent(schoolId: string, subjectId: string, student_user_id: string): Promise<void> {
  await api.post(`/schools/${schoolId}/subjects/${subjectId}/enrollments`, { student_user_id });
}

export async function getMyInvitations(): Promise<Invitation[]> {
  const response = await api.get("/teacher/invitations");
  return response.data;
}

export async function respondInvitation(invitationId: string, accept: boolean): Promise<Invitation> {
  const response = await api.post(`/teacher/invitations/${invitationId}/respond`, null, { params: { accept } });
  return response.data;
}

export async function getSubjects(): Promise<Subject[]> {
  const response = await api.get("/subjects/");
  return response.data;
}

export async function getSubject(id: string): Promise<Subject> {
  const response = await api.get(`/subjects/${id}`);
  return response.data;
}

export async function getSubjectDetail(id: string): Promise<SubjectDetail> {
  const response = await api.get(`/subjects/${id}/details`);
  return response.data;
}

export async function uploadBook(subjectId: string, title: string, language: string, file: File): Promise<Book> {
  const form = new FormData();
  form.append("title", title);
  form.append("language", language);
  form.append("file", file);
  const response = await api.post(`/subjects/${subjectId}/books`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

export async function listSubjectBooks(subjectId: string): Promise<Book[]> {
  const response = await api.get(`/subjects/${subjectId}/books`);
  return response.data;
}

export async function getBookJobs(bookId: string): Promise<Job[]> {
  const response = await api.get(`/books/${bookId}/jobs`);
  return response.data;
}

export async function listSchoolEnrollments(schoolId: string): Promise<EnrollmentRecord[]> {
  const response = await api.get(`/schools/${schoolId}/enrollments`);
  return response.data;
}

export async function listSchoolAttendance(schoolId: string): Promise<AttendanceRecord[]> {
  const response = await api.get(`/schools/${schoolId}/attendance`);
  return response.data;
}

export async function recordAttendance(
  schoolId: string,
  enrollmentId: string,
  payload: { on_date: string; status: AttendanceStatus; note?: string }
): Promise<AttendanceRecord> {
  const response = await api.post(`/schools/${schoolId}/enrollments/${enrollmentId}/attendance`, payload);
  return response.data;
}

export async function listSchoolJobs(schoolId: string): Promise<Job[]> {
  const response = await api.get(`/schools/${schoolId}/jobs`);
  return response.data;
}

export async function listSchoolActivity(schoolId: string): Promise<ActivityEvent[]> {
  const response = await api.get(`/schools/${schoolId}/activity`);
  return response.data;
}

export async function getSchoolPerformance(schoolId: string): Promise<SchoolPerformance> {
  const response = await api.get(`/schools/${schoolId}/performance`);
  return response.data;
}

export async function getChapter(chapterId: string): Promise<Chapter> {
  const response = await api.get(`/chapters/${chapterId}`);
  return response.data;
}

export async function recordChapterProgress(chapterId: string, payload: { time_spent_seconds?: number; last_concept?: string; completed?: boolean }) {
  await api.post(`/chapters/${chapterId}/progress`, payload);
}

export async function getLesson(lessonId: string): Promise<Chapter> {
  return getChapter(lessonId);
}

export async function getQuiz(chapterId: string): Promise<Quiz | null> {
  const response = await api.get(`/chapters/${chapterId}/quiz`);
  return response.data;
}

export async function getQuizAttempts(chapterId: string): Promise<QuizAttemptOut[]> {
  const response = await api.get(`/chapters/${chapterId}/attempts`);
  return response.data;
}

export async function submitQuiz(submission: Partial<QuizSubmission>): Promise<{
  attempt: QuizAttempt;
  ai_feedback: string;
}> {
  const response = await api.post(`/quizzes/${submission.quiz_id}/submit`, submission.responses);
  return response.data;
}

export async function getStudentDashboard(): Promise<StudentDashboard> {
  const response = await api.get("/dashboard/student");
  return response.data;
}

export const getStudentProfile = getCurrentUser;
export const createStudentProfile = async () => getCurrentUser();
export const getAdminDashboard = async () => {
  throw new Error("Use getSchoolDashboard");
};

export const adminAPI = {
  createAdminSubject: createSubject,
  getAdminSubjects: async () => getSubjects(),
};
