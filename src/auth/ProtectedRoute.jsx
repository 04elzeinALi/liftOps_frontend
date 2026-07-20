import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/auth/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid h-screen place-items-center" style={{ color: "var(--text-muted)" }}>
        Loading…
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={`/${user.role}`} replace />;
  }

  return <Outlet />;
}
