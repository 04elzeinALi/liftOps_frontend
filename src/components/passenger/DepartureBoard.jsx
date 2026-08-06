// A split-flap-style departure board: trips grouped under a header for each
// day (Today / Tomorrow / the weekday), so a passenger can see how far out
// they're looking rather than a flat list with no date on it. Mono time,
// signage route, seats-left (amber-red when low), a Book action. Used on the
// passenger home and the full browse page.

import { tripSegmentLabel, tripTimes } from "@/lib/trip";
import { addDaysLocal, formatDate, localToday } from "@/lib/dates";

const LOW_SEATS = 5;

// Today/Tomorrow stay as words — they tell a passenger how far out they're
// looking faster than any number can. Everything beyond that is the app's
// standard dd/mm/yyyy.
function dayLabel(dateStr) {
  const today = localToday();
  if (dateStr === today) return "Today";
  if (dateStr === addDaysLocal(today, 1)) return "Tomorrow";

  return formatDate(dateStr);
}

// Stable ordering regardless of what the API returned in, then bucketed by
// trip_date so each day's trips render together under one header.
function groupByDay(trips) {
  const sorted = [...trips].sort((a, b) => {
    const ka = `${a.trip_date} ${a.departure_time ?? ""}`;
    const kb = `${b.trip_date} ${b.departure_time ?? ""}`;
    return ka.localeCompare(kb);
  });

  const groups = [];
  for (const trip of sorted) {
    const last = groups[groups.length - 1];
    if (last && last.date === trip.trip_date) {
      last.trips.push(trip);
    } else {
      groups.push({ date: trip.trip_date, trips: [trip] });
    }
  }
  return groups;
}

export default function DepartureBoard({ trips, onBook }) {
  const groups = groupByDay(trips);

  return (
    <div className="flex flex-col gap-4">
      {groups.map((group) => (
        <div key={group.date}>
          <p
            className="mb-1.5 px-1 text-[11px] font-bold uppercase"
            style={{ color: "var(--text-muted)", letterSpacing: "0.08em" }}
          >
            {dayLabel(group.date)}
          </p>
          <div style={{ borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)", background: "var(--surface)" }}>
            {group.trips.map((trip, i) => {
              const seats = trip.available_seats ?? 0;
              const soldOut = seats <= 0;
              const low = !soldOut && seats <= LOW_SEATS;
              const label = tripSegmentLabel(trip);
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
                    {tripTimes(trip).departure}
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
        </div>
      ))}
    </div>
  );
}
