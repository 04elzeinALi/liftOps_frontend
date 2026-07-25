// A split-flap-style departure board: one row per upcoming trip. Mono time,
// signage route, seats-left (amber-red when low), a Book action. Used on the
// passenger home and the full browse page.

const LOW_SEATS = 5;

export default function DepartureBoard({ trips, onBook }) {
  return (
    <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
      {trips.map((trip, i) => {
        const seats = trip.available_seats ?? 0;
        const soldOut = seats <= 0;
        const low = !soldOut && seats <= LOW_SEATS;
        const route = trip.schedule?.route;
        const label = route ? `${route.origin} → ${route.destination}` : route?.route_name;
        return (
          <button
            key={trip.id}
            type="button"
            disabled={soldOut}
            onClick={() => !soldOut && onBook(trip.id)}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto",
              alignItems: "center",
              gap: 14,
              width: "100%",
              padding: "14px 16px",
              borderTop: i === 0 ? "none" : "1px solid var(--border)",
              background: "none",
              textAlign: "left",
              color: "inherit",
              font: "inherit",
              cursor: soldOut ? "default" : "pointer",
              opacity: soldOut ? 0.55 : 1,
            }}
          >
            <span style={{ fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 19, fontWeight: 500 }}>
              {trip.schedule?.departure_time?.slice(0, 5)}
            </span>
            <span style={{ minWidth: 0 }}>
              <span style={{ display: "block", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 18, lineHeight: 1.05, letterSpacing: "0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {label}
              </span>
              <span style={{ display: "block", fontSize: 12, marginTop: 2, color: soldOut ? "var(--text-muted)" : low ? "var(--critical)" : "var(--text-muted)" }}>
                {soldOut ? "Sold out" : (
                  <>
                    <span style={{ fontFamily: "var(--font-mono)" }}>{seats}</span> seats left
                  </>
                )}
              </span>
            </span>
            <span
              style={{
                fontFamily: "var(--font-sans)",
                fontWeight: 600,
                fontSize: 13,
                whiteSpace: "nowrap",
                padding: "7px 13px",
                borderRadius: 9,
                color: soldOut ? "var(--text-muted)" : "var(--accent)",
                border: `1px ${soldOut ? "dashed" : "solid"} color-mix(in srgb, var(--accent) 40%, transparent)`,
              }}
            >
              {soldOut ? "Full" : "Book"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
