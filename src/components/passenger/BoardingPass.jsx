// The passenger's next departure, rendered as a boarding pass — the app's
// hero object. Origin/destination in signage type, a route line with a bus
// marker at the boarding stop, and a torn stub with departure/boarding/card.

import { tripRoute, tripTimes } from "@/lib/trip";

function fmtDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}

export default function BoardingPass({ reservation, onShow }) {
  const trip = reservation?.trip;
  const route = tripRoute(trip);
  const origin = route?.origin ?? "—";
  const destination = route?.destination ?? "—";
  const depart = tripTimes(trip).departure;
  const cardType = reservation?.travel_card?.card_type ?? "—";
  const boardingStop = reservation?.pickup_location || origin;

  const face = {
    position: "relative",
    borderRadius: 20,
    padding: "22px 22px 20px",
    color: "var(--ink-text)",
    background: "linear-gradient(150deg, var(--ink-2), var(--ink) 62%)",
    boxShadow: "0 18px 40px -22px rgba(3,24,30,.7)",
    overflow: "hidden",
    isolation: "isolate",
  };
  const label = { fontSize: 10, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 2 };
  const name = { fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 40, lineHeight: 0.9, letterSpacing: "0.01em" };
  const stubK = { fontSize: 9.5, fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--ink-muted)" };
  const stubV = { fontFamily: "var(--font-mono)", fontVariantNumeric: "tabular-nums", fontSize: 22, fontWeight: 500, color: "var(--amber)", marginTop: 3, letterSpacing: "-0.01em" };

  return (
    <div style={face}>
      <span aria-hidden="true" style={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.06) 46%, transparent 58%)" }} />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 }}>
          <span style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--amber)" }}>Next departure</span>
          <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>{fmtDate(trip?.trip_date)}</span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 10 }}>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={label}>From</span>
            <span style={name}>{origin}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 4 }}>{boardingStop}</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", textAlign: "right" }}>
            <span style={label}>To</span>
            <span style={name}>{destination}</span>
            <span style={{ fontSize: 11.5, color: "var(--ink-muted)", marginTop: 4 }}>{destination}</span>
          </div>
        </div>

        {/* route line + marker */}
        <div style={{ position: "relative", height: 40, margin: "6px 4px 0" }} aria-hidden="true">
          <svg viewBox="0 0 300 40" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
            <line x1="8" y1="20" x2="292" y2="20" stroke="var(--ink-line)" strokeWidth="2" />
            <circle cx="8" cy="20" r="4.5" fill="var(--amber)" />
            <circle cx="292" cy="20" r="4.5" fill="var(--amber)" />
            <circle cx="150" cy="20" r="3" fill="var(--ink-line)" />
          </svg>
          <div style={{ position: "absolute", top: "50%", left: "12%", transform: "translate(-50%,-50%)", display: "grid", placeItems: "center" }}>
            <span style={{ position: "absolute", width: 26, height: 26, borderRadius: "50%", background: "color-mix(in srgb, var(--amber) 26%, transparent)" }} />
            <span style={{ width: 22, height: 22, borderRadius: 8, background: "var(--amber)", color: "var(--ink)", display: "grid", placeItems: "center", boxShadow: "0 4px 10px -3px rgba(0,0,0,.5)" }}>
              <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 17V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11" /><path d="M17 8h2.5L21 12v5h-4" /><circle cx="7.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" /></svg>
            </span>
          </div>
        </div>

        {/* perforation */}
        <div style={{ position: "relative", height: 22, margin: "14px -22px 12px" }} aria-hidden="true">
          <span style={{ position: "absolute", top: "50%", left: -11, transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: "var(--bg)" }} />
          <span style={{ position: "absolute", top: "50%", right: -11, transform: "translateY(-50%)", width: 22, height: 22, borderRadius: "50%", background: "var(--bg)" }} />
          <span style={{ position: "absolute", left: 16, right: 16, top: "50%", borderTop: "2px dashed color-mix(in srgb, var(--ink-line) 80%, transparent)" }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
          <div><div style={stubK}>Departs</div><div style={stubV}>{depart}</div></div>
          <div style={{ textAlign: "center" }}><div style={stubK}>Boarding</div><div style={{ ...stubV, fontSize: 15, color: "var(--ink-text)" }}>{boardingStop}</div></div>
          <div style={{ textAlign: "right" }}><div style={stubK}>Card</div><div style={{ ...stubV, fontSize: 15, color: "var(--ink-text)", textTransform: "capitalize" }}>{cardType}</div></div>
        </div>

        {onShow && (
          <button
            type="button"
            onClick={onShow}
            style={{ marginTop: 18, width: "100%", border: 0, cursor: "pointer", background: "var(--amber)", color: "#23160B", fontFamily: "var(--font-sans)", fontWeight: 600, fontSize: 15, padding: 13, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></svg>
            View trip
          </button>
        )}
      </div>
    </div>
  );
}
