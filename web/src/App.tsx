import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { AuthForm } from "./components/auth/AuthForm";
import { Dashboard } from "./components/dashboard/Dashboard";
import { SubjectDetail } from "./components/subjects/SubjectDetail";
import { ChapterPlayer } from "./components/chapters/ChapterPlayer";
import { QuizPage } from "./components/quiz/QuizPage";
import { ProfilePage } from "./components/profile/ProfilePage";
import MainLayout from "./components/navigation/MainLayout";
import { SchoolWorkspace } from "./pages/SchoolWorkspace";
import { SchoolsPage } from "./pages/SchoolsPage";
import { useAuthStore, isSchoolStaff } from "./stores/authStore";

const RoleDashboard = () => {
  const { profile } = useAuthStore();
  if (isSchoolStaff(profile) || profile?.user.account_type === "school_admin" || profile?.user.account_type === "teacher") {
    return <SchoolWorkspace />;
  }
  return <Dashboard />;
};

const App = () => {
  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<AuthForm />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/subjects/:subjectId" element={<SubjectDetail />} />
              <Route path="/subjects/:subjectId/lessons/:lessonId" element={<ChapterPlayer />} />
              <Route path="/subjects/:subjectId/chapters/:chapterId" element={<ChapterPlayer />} />
              <Route path="/lessons/:lessonId/quiz/" element={<QuizPage />} />
              <Route path="/chapters/:chapterId/quiz/" element={<QuizPage />} />
              <Route path="/dashboard" element={<RoleDashboard />} />
              <Route path="/schools" element={<SchoolsPage />} />
              <Route path="/workspace" element={<SchoolWorkspace />} />
              <Route path="/profile/" element={<ProfilePage />} />
            </Route>
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  );
};

export default App;
