import { useAuthStore } from "@/stores/authStore";
import { Navigate, Outlet } from "react-router-dom";

const ProtectedRoute = () => {
  const { isLoading, isAuthenticated } = useAuthStore();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="font-display text-2xl italic text-muted-foreground">Opening the studio…</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
