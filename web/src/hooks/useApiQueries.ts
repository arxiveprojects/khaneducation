import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { useAuthStore } from "@/stores/authStore";
import { useToast } from "@/hooks/use-toast";
import {
  loginUser,
  registerUser,
  getCurrentUser,
  getSubjects,
  getSubject,
  updateUserProfile,
  updateStudentProfile,
  updateTeacherProfile,
  getChapter,
  getQuiz,
  submitQuiz,
  getStudentDashboard,
  getLanguages,
  getAiAssistance,
  getSubjectDetail,
  getQuizAttempts,
  getSchools,
  createSchool,
  applyToSchool,
  getMyInvitations,
  respondInvitation,
  getSchoolDashboard,
  listSchoolSubjects,
  createSubject,
  inviteTeacher,
  listApplications,
  reviewApplication,
  uploadBook,
  listInvitations,
  listSubjectBooks,
  getBookJobs,
  listSchoolEnrollments,
  listSchoolAttendance,
  recordAttendance,
  listSchoolJobs,
  listSchoolActivity,
  getSchoolPerformance,
} from "@/services/api";
import { User, QuizSubmission, AIAssistRequest, AccountType, AttendanceStatus } from "@/types/api";

export const useLogin = () => {
  const { setAuth, setLoading } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const data = await loginUser(email, password);
      const profile = await getCurrentUser();
      return { data, profile };
    },
    onMutate: () => setLoading(true),
    onSuccess: ({ data, profile }) => {
      setAuth(profile, data.access_token);
      toast({ title: "Welcome back!", description: "Successfully logged in." });
    },
    onError: (error: AxiosError) => {
      setLoading(false);
      const detail = (error.response?.data as { detail?: string })?.detail;
      toast({
        title: "Login Failed",
        description:
          error.response?.status === 404
            ? "Could not reach the local API. Confirm it is running on http://127.0.0.1:8000 and use student@example.com / Abc123()."
            : detail || "Invalid credentials. Use student@example.com and password Abc123().",
        variant: "destructive",
      });
    },
  });
};

export const useRegister = () => {
  const { setAuth, setLoading } = useAuthStore();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (userData: Partial<User> & { account_type?: AccountType }) => registerUser(userData),
    onMutate: () => setLoading(true),
    onSuccess: async (user, variables) => {
      const response = await loginUser(user.email, variables.password || "");
      const profile = await getCurrentUser();
      setAuth(profile, response.access_token);
      toast({ title: "Account Created!", description: "Welcome to Khan Education." });
    },
    onError: (error: AxiosError) => {
      setLoading(false);
      toast({
        title: "Registration Failed",
        description: (error.response?.data as { detail: string })?.detail || "Unable to create account.",
        variant: "destructive",
      });
    },
  });
};

export const useStudentProfile = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["me"],
    queryFn: getCurrentUser,
    enabled: isAuthenticated,
  });
};

export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (profileData: { first_name: string; last_name: string; email: string }) => updateUserProfile(profileData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast({ title: "Profile Updated" });
    },
  });
};

export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (profileData: { language?: string; current_grade?: number }) => updateStudentProfile(profileData),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useUpdateTeacherProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTeacherProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useSubjects = () =>
  useQuery({
    queryKey: ["subjects"],
    queryFn: getSubjects,
  });

export const useSubject = (id?: string) =>
  useQuery({
    queryKey: ["subject", id],
    queryFn: () => getSubject(id as string),
    enabled: !!id,
  });

export const useSubjectDetail = (id?: string) =>
  useQuery({
    queryKey: ["subject-detail", id],
    queryFn: () => getSubjectDetail(id as string),
    enabled: !!id,
  });

export const useLesson = (chapterId?: string) =>
  useQuery({
    queryKey: ["chapter", chapterId],
    queryFn: () => getChapter(chapterId as string),
    enabled: !!chapterId,
  });

export const useQuiz = (chapterId: string, options?: { enabled: boolean }) =>
  useQuery({
    queryKey: ["quiz", chapterId],
    queryFn: () => getQuiz(chapterId),
    enabled: !!chapterId,
    gcTime: 0,
    ...options,
  });

export const useQuizAttempts = (chapterId: string) =>
  useQuery({
    queryKey: ["quiz-attempts", chapterId],
    queryFn: () => getQuizAttempts(chapterId),
    enabled: !!chapterId,
  });

export const useSubmitQuiz = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (submission: QuizSubmission) => submitQuiz(submission),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-dashboard"] });
      toast({
        title: data.attempt.passed ? "Quiz Passed!" : "Quiz Completed",
        description: `Score: ${Math.round(data.attempt.score)}%. ${data.ai_feedback}`,
        variant: data.attempt.passed ? "default" : "destructive",
      });
    },
  });
};

export const useStudentDashboard = () => {
  const { isAuthenticated } = useAuthStore();
  return useQuery({
    queryKey: ["student-dashboard"],
    queryFn: getStudentDashboard,
    enabled: isAuthenticated,
  });
};

export const useLanguages = () =>
  useQuery({
    queryKey: ["languages"],
    queryFn: getLanguages,
  });

export const useAiAssistance = () =>
  useMutation({
    mutationFn: (request: AIAssistRequest) => getAiAssistance(request),
  });

export const useSchools = () => useQuery({ queryKey: ["schools"], queryFn: getSchools });

export const useCreateSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSchool,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["me"] }),
  });
};

export const useApplyToSchool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ schoolId, grade_level }: { schoolId: string; grade_level: number }) => applyToSchool(schoolId, grade_level),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["student-dashboard"] }),
  });
};

export const useTeacherInvitations = () =>
  useQuery({
    queryKey: ["teacher-invitations"],
    queryFn: getMyInvitations,
  });

export const useRespondInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ invitationId, accept }: { invitationId: string; accept: boolean }) => respondInvitation(invitationId, accept),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teacher-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["me"] });
    },
  });
};

export const useSchoolDashboard = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-dashboard", schoolId],
    queryFn: () => getSchoolDashboard(schoolId as string),
    enabled: !!schoolId,
  });

export const useSchoolSubjects = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-subjects", schoolId],
    queryFn: () => listSchoolSubjects(schoolId as string),
    enabled: !!schoolId,
  });

export const useCreateSubject = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { name: string; description?: string; grade_level: number }) =>
      createSubject(schoolId, { name: data.name, description: data.description || "", grade_level: data.grade_level }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["school-subjects", schoolId] }),
  });
};

export const useInviteTeacher = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => inviteTeacher(schoolId, email),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["school-invitations", schoolId] }),
  });
};

export const useSchoolInvitations = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-invitations", schoolId],
    queryFn: () => listInvitations(schoolId as string),
    enabled: !!schoolId,
  });

export const useSchoolApplications = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-applications", schoolId],
    queryFn: () => listApplications(schoolId as string),
    enabled: !!schoolId,
  });

export const useReviewApplication = (schoolId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ applicationId, status, subjectIds }: { applicationId: string; status: "accepted" | "rejected"; subjectIds?: string[] }) =>
      reviewApplication(schoolId, applicationId, status, subjectIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["school-applications", schoolId] }),
  });
};

export const useUploadBook = (subjectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ title, language, file }: { title: string; language: string; file: File }) =>
      uploadBook(subjectId, title, language, file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subject-detail", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["school-subjects"] });
      queryClient.invalidateQueries({ queryKey: ["subject-books", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["school-jobs"] });
    },
  });
};

export const useSubjectBooks = (subjectId?: string) =>
  useQuery({
    queryKey: ["subject-books", subjectId],
    queryFn: () => listSubjectBooks(subjectId as string),
    enabled: !!subjectId,
  });

export const useBookJobs = (bookId?: string) =>
  useQuery({
    queryKey: ["book-jobs", bookId],
    queryFn: () => getBookJobs(bookId as string),
    enabled: !!bookId,
    refetchInterval: (query) => {
      const jobs = query.state.data || [];
      return jobs.some((job) => job.status === "queued" || job.status === "running") ? 4000 : false;
    },
  });

export const useSchoolJobs = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-jobs", schoolId],
    queryFn: () => listSchoolJobs(schoolId as string),
    enabled: !!schoolId,
    refetchInterval: (query) => {
      const jobs = query.state.data || [];
      return jobs.some((job) => job.status === "queued" || job.status === "running") ? 4000 : false;
    },
  });

export const useSchoolEnrollments = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-enrollments", schoolId],
    queryFn: () => listSchoolEnrollments(schoolId as string),
    enabled: !!schoolId,
  });

export const useSchoolAttendance = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-attendance", schoolId],
    queryFn: () => listSchoolAttendance(schoolId as string),
    enabled: !!schoolId,
  });

export const useRecordAttendance = (schoolId: string) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({
      enrollmentId,
      status,
      on_date,
      note,
    }: {
      enrollmentId: string;
      status: AttendanceStatus;
      on_date: string;
      note?: string;
    }) => recordAttendance(schoolId, enrollmentId, { on_date, status, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["school-attendance", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["school-activity", schoolId] });
      queryClient.invalidateQueries({ queryKey: ["school-dashboard", schoolId] });
      toast({ title: "Attendance saved" });
    },
  });
};

export const useSchoolActivity = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-activity", schoolId],
    queryFn: () => listSchoolActivity(schoolId as string),
    enabled: !!schoolId,
  });

export const useSchoolPerformance = (schoolId?: string) =>
  useQuery({
    queryKey: ["school-performance", schoolId],
    queryFn: () => getSchoolPerformance(schoolId as string),
    enabled: !!schoolId,
  });

export const usePracticeTasks = (_lessonId?: string) =>
  useQuery({
    queryKey: ["practice-tasks", _lessonId],
    queryFn: async () => [],
    enabled: false,
  });
