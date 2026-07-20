import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import AdminDashboard from "@/pages/admin/DashboardHome";
import DriverDashboard from "@/pages/driver/DashboardHome";
import PassengerDashboard from "@/pages/passenger/DashboardHome";

function RoleHomeRedirect() {
  const { user } = useAuth();
  return <Navigate to={`/${user.role}`} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleHomeRedirect />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
            <Route path="/driver" element={<DriverDashboard />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
            <Route path="/passenger" element={<PassengerDashboard />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
