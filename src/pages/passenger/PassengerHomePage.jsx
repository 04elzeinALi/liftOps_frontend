import { useNavigate } from "react-router-dom";
import { useMyReservations } from "@/api/passengerReservations";
import { useUpcomingTrips } from "@/api/passengerTrips";
import { useRoute, useRoutes } from "@/api/routes";
import { localToday } from "@/lib/dates";
import BoardingPass from "@/components/passenger/BoardingPass";
import DepartureBoard from "@/components/passenger/DepartureBoard";
import LeafletMap from "@/components/LeafletMap";

const eyebrow = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 2px 12px",
};
const eyebrowRule = { content: '""', height: 1, flex: 1, background: "var(--border)" };

function Eyebrow({ children, action }) {
  return (
    <p style={eyebrow}>
      {children}
      <span style={eyebrowRule} />
      {action}
    </p>
  );
}

function nextBookedReservation(reservations) {
  const today = localToday();
  return (reservations ?? [])
    .filter((r) => r.status === "booked" && r.trip?.trip_date && r.trip.trip_date >= today)
    .sort((a, b) => {
      const ka = `${a.trip.trip_date} ${a.trip.departure_time ?? ""}`;
      const kb = `${b.trip.trip_date} ${b.trip.departure_time ?? ""}`;
      return ka.localeCompare(kb);
    })[0];
}

export default function PassengerHomePage() {
  const navigate = useNavigate();
  const { data: reservations } = useMyReservations();
  const { data: trips, isLoading: tripsLoading } = useUpcomingTrips();
  const { data: routes } = useRoutes();

  const next = nextBookedReservation(reservations);

  // The line shown here is just an overview — the whole corridor, plain.
  const { data: lineRoute } = useRoute(routes?.[0]?.id);

  // Don't offer a trip the passenger has already booked — it belongs in "your
  // trips", not in the list of things still to book.
  const bookedTripIds = new Set(
    (reservations ?? [])
      .filter((r) => r.status === "booked")
      .map((r) => r.trip?.id ?? r.trip_id)
  );
  const availableTrips = (trips ?? []).filter((t) => !bookedTripIds.has(t.id));

  // The corridor as a map: every stop on the route, in the order the bus
  // actually calls at them, joined into one taxi-yellow line.
  const linePoints = (lineRoute?.route_stations ?? []).map((rs, i, arr) => ({
    lat: rs.station?.latitude,
    lng: rs.station?.longitude,
    label: rs.station?.station_name,
    kind: i === 0 || i === arr.length - 1 ? "origin" : "stop",
  }));

  return (
    <div className="mx-auto flex w-full max-w-[452px] flex-col gap-7">
      {/* NEXT DEPARTURE */}
      <section aria-label="Your next departure">
        {next ? (
          <BoardingPass reservation={next} onShow={() => navigate("/passenger/reservations")} />
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
              No upcoming trips
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Book a seat from today's departures below.
            </p>
          </div>
        )}
      </section>

      {/* THE LINE */}
      {linePoints.length >= 2 && (
        <section aria-label="The line">
          <Eyebrow>The line</Eyebrow>
          <LeafletMap points={linePoints} connect height={220} maximizable />
          <button
            type="button"
            onClick={() => navigate("/passenger/line")}
            className="mt-3 flex w-full items-center justify-between gap-3 rounded-2xl p-4"
            style={{ background: "color-mix(in srgb, var(--accent) 14%, var(--surface))", border: "1px solid color-mix(in srgb, var(--accent) 35%, var(--border))" }}
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: "var(--accent)", color: "var(--accent-ink)" }}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="6" r="2.5" /><circle cx="18" cy="18" r="2.5" /><path d="M8.2 7.2 15.8 16.8" /></svg>
              </span>
              <span className="text-left">
                <span className="block text-sm font-bold" style={{ color: "var(--text)" }}>
                  View the full route diagram
                </span>
                <span className="block text-xs" style={{ color: "var(--text-muted)" }}>
                  Every stop, in order, with the fare
                </span>
              </span>
            </span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
        </section>
      )}

      {/* DEPARTURES */}
      <section aria-label="Upcoming departures">
        <Eyebrow>Upcoming departures</Eyebrow>
        {tripsLoading && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
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
      </section>
    </div>
  );
}
