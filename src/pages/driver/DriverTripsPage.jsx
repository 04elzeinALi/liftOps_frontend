import { useNavigate } from "react-router-dom";
import { useTodaysTrips } from "@/api/driverTrips";

const STATUS_STYLE = {
  scheduled: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Scheduled" },
  ongoing: { bg: "var(--success-bg)", fg: "var(--success)", label: "Ongoing" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
};

export default function DriverTripsPage() {
  const { data, isLoading, isError } = useTodaysTrips();
  const navigate = useNavigate();
  const trips = data?.data ?? [];

  return (
    <div>
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        Today's Trips
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
      {data && trips.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          No trips scheduled for today.
        </p>
      )}

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
        {trips.map((trip) => {
          const status = STATUS_STYLE[trip.status];
          return (
            <button
              key={trip.id}
              onClick={() => navigate(`/driver/trips/${trip.id}`)}
              className="rounded-xl p-5 text-left"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="mb-3 flex items-center justify-between">
                <span className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
                  {trip.schedule?.route?.route_name}
                </span>
                <span
                  className="rounded-full px-2.5 py-1 text-xs font-semibold"
                  style={{ background: status.bg, color: status.fg }}
                >
                  {status.label}
                </span>
              </div>
              <p className="text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                {trip.schedule?.departure_time?.slice(0, 5)}–{trip.schedule?.arrival_time?.slice(0, 5)}
              </p>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                Bus {trip.bus?.plate_number}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
