// The LiftOps travel card as a physical transit pass — the passenger app's
// signature object. Route printed across an ink-and-amber plastic face,
// remaining trips shown as punch dots (filled = left, hollow = used).
// Reused on My Cards, the Buy-a-Card live preview, and the Book picker.

import { formatDate } from "@/lib/dates";

// Whole days from today until a 'YYYY-MM-DD' expiry — negative once past.
// Both sides are pinned to midday so a daylight-saving shift can't drag the
// difference onto the wrong day.
function daysUntil(dateStr) {
  if (!dateStr) return null;
  const [y, m, d] = String(dateStr).slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return null;
  const target = new Date(y, m - 1, d, 12, 0, 0);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 12, 0, 0);
  return Math.round((target - today) / 86400000);
}

const wrap = {
  position: "relative",
  borderRadius: 18,
  overflow: "hidden",
  padding: "18px 18px 16px",
  color: "var(--ink-text)",
  background: "linear-gradient(140deg, var(--ink-2), var(--ink) 70%)",
  boxShadow: "0 14px 32px -22px rgba(3,24,30,.7)",
  isolation: "isolate",
};

const sheen = {
  content: '""',
  position: "absolute",
  inset: 0,
  zIndex: 0,
  pointerEvents: "none",
  background: "linear-gradient(120deg, transparent 34%, rgba(255,255,255,0.05) 50%, transparent 64%)",
};

export default function TravelCardObject({
  routeName,
  cardType,
  remaining = 0,
  total = 0,
  status,
  expiry,
  note,
  selectable = false,
  selected = false,
  onSelect,
  compact = false,
}) {
  const spent = remaining <= 0 || status === "expired" || status === "suspended";
  const used = Math.max(0, total - remaining);

  // Warn only while there's still something to lose: trips left on a live
  // card, and the deadline close enough to act on. Expiry is fair, but it
  // shouldn't be a surprise the rider only notices once the trips are gone.
  const daysLeft = daysUntil(expiry);
  const expiringSoon = !spent && daysLeft !== null && daysLeft >= 0 && daysLeft <= 3;

  const content = (
    <>
      <span style={sheen} aria-hidden="true" />
      {/* faint printed route line across the face */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "-10%",
          right: "-10%",
          bottom: 40,
          zIndex: 0,
          height: 1,
          opacity: 0.5,
          background: "repeating-linear-gradient(90deg, var(--ink-line) 0 8px, transparent 8px 15px)",
        }}
      />
      <div style={{ position: "relative", zIndex: 1 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: compact ? 20 : 25,
              lineHeight: 1,
              color: spent ? "var(--ink-muted)" : "var(--ink-text)",
            }}
          >
            {routeName}
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "4px 9px",
              borderRadius: 999,
              color: spent ? "var(--ink-muted)" : "var(--ink)",
              background: spent ? "color-mix(in srgb, var(--ink-line) 55%, transparent)" : "var(--amber)",
            }}
          >
            {cardType}
          </span>
        </div>

        {total > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "10px 0 14px" }} aria-hidden="true">
            {Array.from({ length: total }, (_, i) => {
              const left = i < remaining;
              return (
                <span
                  key={i}
                  style={{
                    width: 11,
                    height: 11,
                    borderRadius: "50%",
                    background: left ? "var(--amber)" : "transparent",
                    boxShadow: left
                      ? "0 0 0 1px color-mix(in srgb, var(--amber) 40%, transparent)"
                      : "inset 0 0 0 1.5px var(--ink-line)",
                  }}
                />
              );
            })}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: spent ? "var(--ink-muted)" : "var(--ink-text)" }}>
            <b style={{ fontWeight: 500, color: spent ? "var(--ink-muted)" : "var(--amber)" }}>{remaining}</b>
            {total > 0 ? ` of ${total} trips left` : ""}
            {note ? ` · ${note}` : ""}
          </span>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 800, fontSize: 13, letterSpacing: "0.04em", color: "var(--ink-muted)" }}>
            LIFT-OPS
          </span>
        </div>
        {expiry && (
          <div
            style={{
              marginTop: 6,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: expiringSoon ? "var(--amber)" : "var(--ink-muted)",
              fontWeight: expiringSoon ? 700 : 400,
            }}
          >
            {expiringSoon
              ? `Expires ${daysLeft === 0 ? "today" : daysLeft === 1 ? "tomorrow" : `in ${daysLeft} days`} · ${formatDate(expiry)}`
              : `Expires ${formatDate(expiry)}`}
          </div>
        )}
      </div>
    </>
  );

  if (selectable) {
    return (
      <button
        type="button"
        onClick={onSelect}
        style={{
          ...wrap,
          display: "block",
          width: "100%",
          textAlign: "left",
          cursor: "pointer",
          font: "inherit",
          outline: selected ? "2px solid var(--amber)" : "none",
          outlineOffset: 2,
        }}
      >
        {content}
      </button>
    );
  }

  return <div style={wrap}>{content}</div>;
}
