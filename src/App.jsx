import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/auth/AuthContext";
import ProtectedRoute from "@/auth/ProtectedRoute";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import AdminLayout from "@/layouts/AdminLayout";
import BusesPage from "@/pages/admin/buses/BusesPage";
import ShiftsPage from "@/pages/admin/shifts/ShiftsPage";
import StationsPage from "@/pages/admin/stations/StationsPage";
import RoutesPage from "@/pages/admin/routes/RoutesPage";
import MaintenancePage from "@/pages/admin/maintenance/MaintenancePage";
import RouteStationsPage from "@/pages/admin/route-stations/RouteStationsPage";
import TripsPage from "@/pages/admin/trips/TripsPage";
import DriversPage from "@/pages/admin/drivers/DriversPage";
import DriverDetailPage from "@/pages/admin/drivers/DriverDetailPage";
import AdminPassengersPage from "@/pages/admin/passengers/PassengersPage";
import PassengerDetailPage from "@/pages/admin/passengers/PassengerDetailPage";
import AdminTravelCardsPage from "@/pages/admin/travel-cards/TravelCardsPage";
import AdminPaymentsPage from "@/pages/admin/payments/PaymentsPage";
import RevenueReportPage from "@/pages/admin/reports/RevenueReportPage";
import RevenueDetailPage from "@/pages/admin/reports/RevenueDetailPage";
import DriverCashReportPage from "@/pages/admin/reports/DriverCashReportPage";
import FleetReportPage from "@/pages/admin/reports/FleetReportPage";
import DriverLayout from "@/layouts/DriverLayout";
import DriverTripsPage from "@/pages/driver/DriverTripsPage";
import TripManifestPage from "@/pages/driver/TripManifestPage";
import PassengerLayout from "@/layouts/PassengerLayout";
import PassengerHomePage from "@/pages/passenger/PassengerHomePage";
import RouteLinePage from "@/pages/passenger/RouteLinePage";
import TripsBrowsePage from "@/pages/passenger/TripsBrowsePage";
import BookTripPage from "@/pages/passenger/BookTripPage";
import MyTravelCardsPage from "@/pages/passenger/MyTravelCardsPage";
import BuyTravelCardPage from "@/pages/passenger/BuyTravelCardPage";
import MyReservationsPage from "@/pages/passenger/MyReservationsPage";
import MyPaymentsPage from "@/pages/passenger/MyPaymentsPage";

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
          <Route path="/signup" element={<Signup />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<RoleHomeRedirect />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Navigate to="/admin/buses" replace />} />
              <Route path="buses" element={<BusesPage />} />
              <Route path="stations" element={<StationsPage />} />
              <Route path="routes" element={<RoutesPage />} />
              <Route path="drivers" element={<DriversPage />} />
              <Route path="drivers/:id" element={<DriverDetailPage />} />
              <Route path="shifts" element={<ShiftsPage />} />
              <Route path="maintenance" element={<MaintenancePage />} />
              <Route path="route-stations" element={<RouteStationsPage />} />
              <Route path="trips" element={<TripsPage />} />
              <Route path="passengers" element={<AdminPassengersPage />} />
              <Route path="passengers/:id" element={<PassengerDetailPage />} />
              <Route path="travel-cards" element={<AdminTravelCardsPage />} />
              <Route path="payments" element={<AdminPaymentsPage />} />
              <Route path="reports/revenue" element={<RevenueReportPage />} />
              <Route path="reports/revenue/:dimension/:value" element={<RevenueDetailPage />} />
              <Route path="reports/driver-cash" element={<DriverCashReportPage />} />
              <Route path="reports/fleet" element={<FleetReportPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["driver"]} />}>
            <Route path="/driver" element={<DriverLayout />}>
              <Route index element={<Navigate to="/driver/trips" replace />} />
              <Route path="trips" element={<DriverTripsPage />} />
              <Route path="trips/:id" element={<TripManifestPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["passenger"]} />}>
            <Route path="/passenger" element={<PassengerLayout />}>
              <Route index element={<PassengerHomePage />} />
              <Route path="line" element={<RouteLinePage />} />
              <Route path="trips" element={<TripsBrowsePage />} />
              <Route path="trips/:id/book" element={<BookTripPage />} />
              <Route path="cards" element={<MyTravelCardsPage />} />
              <Route path="cards/buy" element={<BuyTravelCardPage />} />
              <Route path="reservations" element={<MyReservationsPage />} />
              <Route path="payments" element={<MyPaymentsPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
