// Ambient backdrop for the passenger app: a little taxi-yellow bus driving
// along a dashed-line road, sitting just above the bottom tab bar. Fixed and
// behind all content (pointer-events: none), kept subtle so it never fights
// readability. Motion pauses under prefers-reduced-motion (see index.css).

function Bus() {
  return (
    <svg width="72" height="34" viewBox="0 0 72 34" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* body */}
      <rect x="2" y="3" width="64" height="21" rx="5" fill="var(--amber)" />
      {/* roof shine */}
      <rect x="4" y="4.5" width="60" height="4" rx="2" fill="#FFFFFF" opacity="0.28" />
      {/* windows */}
      <g fill="var(--ink)" opacity="0.9">
        <rect x="8" y="8" width="9" height="8" rx="1.6" />
        <rect x="20" y="8" width="9" height="8" rx="1.6" />
        <rect x="32" y="8" width="9" height="8" rx="1.6" />
        <rect x="44" y="8" width="9" height="8" rx="1.6" />
      </g>
      {/* door */}
      <rect x="56" y="8" width="6" height="14" rx="1.4" fill="var(--ink)" opacity="0.55" />
      {/* headlight */}
      <circle cx="64" cy="20" r="1.6" fill="#FFFFFF" opacity="0.85" />
      {/* wheels */}
      <g>
        <circle cx="18" cy="27" r="5" fill="var(--ink)" />
        <circle cx="52" cy="27" r="5" fill="var(--ink)" />
        <circle cx="18" cy="27" r="1.8" fill="var(--amber)" />
        <circle cx="52" cy="27" r="1.8" fill="var(--amber)" />
      </g>
    </svg>
  );
}

export default function PassengerBackdrop() {
  return (
    <div
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, zIndex: 20, pointerEvents: "none", overflow: "hidden" }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: "calc(66px + env(safe-area-inset-bottom))",
          height: 60,
        }}
      >
        {/* asphalt — solid road, dark in both themes */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#2B2E33",
            borderTop: "3px solid #43474E",
          }}
        />
        {/* dashed centre line */}
        <div
          className="lp-road"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: "50%",
            height: 4,
            transform: "translateY(-50%)",
            background: "repeating-linear-gradient(90deg, var(--amber) 0 30px, transparent 30px 66px)",
            backgroundSize: "96px 100%",
            animation: "lp-road-dash 1.1s linear infinite",
          }}
        />
        {/* the bus */}
        <div
          className="lp-bus"
          style={{ position: "absolute", bottom: 4, left: 0, animation: "lp-bus-drive 16s linear infinite" }}
        >
          <div className="lp-bus-bob" style={{ animation: "lp-bus-bob 1.4s ease-in-out infinite" }}>
            <Bus />
          </div>
        </div>
      </div>
    </div>
  );
}
