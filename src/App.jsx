import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import AdminLayout from "@/layouts/AdminLayout";
import ComingSoon from "@/components/admin/ComingSoon";
import BusesPage from "@/pages/admin/buses/BusesPage";
import SchedulesPage from "@/pages/admin/schedules/SchedulesPage";
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
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/buses" replace />} />
              <Route path="buses" element={<BusesPage />} />
              <Route path="stations" element={<ComingSoon title="Stations" />} />
              <Route path="routes" element={<ComingSoon title="Routes" />} />
              <Route path="drivers" element={<ComingSoon title="Drivers" />} />
              <Route path="schedules" element={<SchedulesPage />} />
              <Route path="schedule-days" element={<ComingSoon title="Schedule Days" />} />
              <Route path="maintenance" element={<ComingSoon title="Maintenance" />} />
              <Route path="route-stations" element={<ComingSoon title="Route Stations" />} />
              <Route path="trips" element={<ComingSoon title="Trips" />} />
            </Route>
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
