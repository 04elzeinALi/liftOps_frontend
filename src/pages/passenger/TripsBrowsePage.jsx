import { useNavigate } from "react-router-dom";
import { useUpcomingTrips } from "@/api/passengerTrips";
import { useMyReservations } from "@/api/passengerReservations";
import DepartureBoard from "@/components/passenger/DepartureBoard";

export default function TripsBrowsePage() {
  const { data: trips, isLoading, isError } = useUpcomingTrips();
  const { data: reservations } = useMyReservations();
  const navigate = useNavigate();

  // Hide trips the passenger has already booked — they can't book them twice.
  const bookedTripIds = new Set(
    (reservations ?? [])
      .filter((r) => r.status === "booked")
      .map((r) => r.trip?.id ?? r.trip_id)
  );
  const availableTrips = (trips ?? []).filter((t) => !bookedTripIds.has(t.id));

  return (
    <div className="mx-auto w-full max-w-[452px]">
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        Departures
      </h1>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          Failed to load trips.
        </p>
      )}
      {trips && availableTrips.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No upcoming departures right now.
        </p>
      )}

      {availableTrips.length > 0 && (
        <DepartureBoard trips={availableTrips} onBook={(id) => navigate(`/passenger/trips/${id}/book`)} />
      )}
    </div>
  );
}
