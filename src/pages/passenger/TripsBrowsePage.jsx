import { useNavigate } from "react-router-dom";
import { useUpcomingTrips } from "@/api/passengerTrips";
import DepartureBoard from "@/components/passenger/DepartureBoard";

export default function TripsBrowsePage() {
  const { data: trips, isLoading, isError } = useUpcomingTrips();
  const navigate = useNavigate();

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
      {trips && trips.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No upcoming departures right now.
        </p>
      )}

      {trips && trips.length > 0 && (
        <DepartureBoard trips={trips} onBook={(id) => navigate(`/passenger/trips/${id}/book`)} />
      )}
    </div>
  );
}
