import { useNavigate } from "react-router-dom";
import { useUpcomingTrips } from "@/api/passengerTrips";

export default function TripsBrowsePage() {
  const { data: trips, isLoading, isError } = useUpcomingTrips();
  const navigate = useNavigate();

  return (
    <div>
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        Book a Trip
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
          No upcoming trips right now.
        </p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {trips?.map((trip) => (
          <div
            key={trip.id}
            className="rounded-xl p-5"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <span className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
              {trip.schedule?.route?.route_name}
            </span>
            <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
              {trip.schedule?.departure_time?.slice(0, 5)}–{trip.schedule?.arrival_time?.slice(0, 5)}
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Bus {trip.bus?.plate_number} · {trip.available_seats} seats left
            </p>
            <button
              onClick={() => navigate(`/passenger/trips/${trip.id}/book`)}
              disabled={trip.available_seats <= 0}
              className="mt-3 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:opacity-40"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {trip.available_seats <= 0 ? "Fully booked" : "Book"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
