// The route drawn as a transit line diagram: the outbound leg runs down the
// left rail, turns at the terminus, and the return leg runs back up the right
// rail — so every stop reads twice, once per direction, the way a printed bus
// map shows it. Stops come from route_stations in station_order.

const RAIL_W = 34; // width of one rail column
const DOT = 9;

function Rail({ first, last, arrow }) {
  return (
    <div style={{ position: "relative", width: RAIL_W, alignSelf: "stretch", display: "grid", placeItems: "center" }}>
      {/* the vertical line: clipped at the first/last dot so it doesn't overhang */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          transform: "translateX(-50%)",
          top: first ? "50%" : 0,
          bottom: last ? "50%" : 0,
          width: 2,
          background: "var(--accent)",
          opacity: 0.45,
        }}
      />
      <span
        aria-hidden="true"
        style={{
          position: "relative",
          zIndex: 1,
          width: DOT,
          height: DOT,
          borderRadius: "50%",
          background: "var(--surface)",
          border: "2px solid var(--accent)",
        }}
      />
      {arrow && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            zIndex: 2,
            top: arrow === "down" ? -2 : undefined,
            bottom: arrow === "up" ? -2 : undefined,
            display: "grid",
            placeItems: "center",
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--accent)",
            color: "var(--accent-ink)",
          }}
        >
          <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            {arrow === "down" ? <path d="M12 5v14M6 13l6 6 6-6" /> : <path d="M12 19V5M6 11l6-6 6 6" />}
          </svg>
        </span>
      )}
    </div>
  );
}

export default function RouteLineGraph({
  routeName,
  origin,
  destination,
  stops = [],
  price,
  priceNote,
}) {
  const name = { fontSize: 13.5, lineHeight: 1.25, color: "var(--text)" };
  const label = { fontSize: 10.5, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)" };

  return (
    <div className="flex flex-col gap-3">
      {/* route header */}
      <div
        className="relative overflow-hidden rounded-xl p-4 pl-5"
        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 4, background: "var(--accent)" }} />
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 17V6a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v11" /><path d="M17 8h2.5L21 12v5h-4" />
            <circle cx="7.5" cy="17.5" r="1.6" /><circle cx="16.5" cy="17.5" r="1.6" />
          </svg>
          <span className="font-display text-base font-extrabold" style={{ color: "var(--text)" }}>
            {routeName}
          </span>
        </div>
        <dl className="mt-2 space-y-0.5 text-[12.5px]">
          <div className="flex gap-1.5">
            <dt className="font-semibold" style={{ color: "var(--text)" }}>Starting point</dt>
            <dd style={{ color: "var(--text-muted)" }}>— {origin ?? "—"}</dd>
          </div>
          <div className="flex gap-1.5">
            <dt className="font-semibold" style={{ color: "var(--text)" }}>Terminal point</dt>
            <dd style={{ color: "var(--text-muted)" }}>— {destination ?? "—"}</dd>
          </div>
        </dl>
      </div>

      {/* stops */}
      <div className="rounded-xl px-4 py-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {price != null && (
          <div className="mb-4 flex items-baseline justify-between border-b pb-3" style={{ borderColor: "var(--border)" }}>
            <span style={label}>{priceNote ?? "Full route"}</span>
            <span className="font-display text-xl font-extrabold" style={{ color: "var(--accent)", fontVariantNumeric: "tabular-nums" }}>
              ${Number(price).toFixed(2)}
            </span>
          </div>
        )}

        {stops.length === 0 ? (
          <p className="py-4 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No stops have been added to this route yet.
          </p>
        ) : (
          <div>
            {stops.map((stop, i) => {
              const first = i === 0;
              const last = i === stops.length - 1;
              return (
                <div key={stop.id ?? i} className="grid items-stretch" style={{ gridTemplateColumns: `1fr ${RAIL_W}px ${RAIL_W}px 1fr` }}>
                  <div className="flex items-center justify-end py-1.5 pr-2 text-right" style={name}>
                    {stop.name}
                  </div>
                  <Rail first={first} last={last} arrow={first ? "down" : undefined} />
                  <Rail first={first} last={last} arrow={last ? "up" : undefined} />
                  <div className="flex items-center py-1.5 pl-2" style={name}>
                    {stop.name}
                  </div>
                </div>
              );
            })}

            {/* the turn at the terminus, joining the two rails */}
            <div className="grid" style={{ gridTemplateColumns: `1fr ${RAIL_W * 2}px 1fr` }}>
              <span />
              <span
                aria-hidden="true"
                style={{
                  height: 14,
                  margin: `0 ${RAIL_W / 2}px`,
                  borderLeft: "2px solid var(--accent)",
                  borderRight: "2px solid var(--accent)",
                  borderBottom: "2px solid var(--accent)",
                  borderBottomLeftRadius: 14,
                  borderBottomRightRadius: 14,
                  opacity: 0.45,
                }}
              />
              <span />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
