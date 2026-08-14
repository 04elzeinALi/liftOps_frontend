import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/theme/ThemeContext";

// Free, no-API-key basemaps (CARTO over OpenStreetMap) with a light and a
// dark variant so the map matches the app theme.
const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// One identity: taxi-yellow station dots on a taxi-yellow route line — the
// one brand colour that stays legible on both the light and dark basemaps
// (charcoal would vanish on the dark tiles). Origin/destination are told
// apart by their labels and the line's direction, not by hue.
const KIND_COLOR = {
  origin: "var(--amber)",
  boarding: "var(--amber)",
  destination: "var(--amber)",
  stop: "var(--amber)",
};
const ROUTE_LINE = "#F5B301";

function isValid(p) {
  const lat = Number(p?.lat);
  const lng = Number(p?.lng);
  return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0);
}

function markerIcon(kind) {
  const color = KIND_COLOR[kind] ?? "var(--accent)";
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:16px;height:16px;border-radius:50%;background:${color};border:2px solid var(--surface);box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

// Bigger, ringed marker for the two ends of a highlighted ride — drawn on top
// of the plain station dot at the same coordinates, so it reads as "this stop
// is special" rather than a whole separate pin.
function highlightMarkerIcon(color) {
  return L.divIcon({
    className: "",
    html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:${color};border:3px solid var(--surface);box-shadow:0 0 0 3px color-mix(in srgb, ${color} 35%, transparent),0 2px 8px rgba(0,0,0,.45)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// The actual Leaflet mount + drawing logic, factored out so it can be
// instantiated twice: once inline (always mounted) and once more inside the
// fullscreen portal while expanded. Each copy owns its own map instance —
// simpler and far more robust than trying to move one Leaflet instance's DOM
// node between the two locations, which React does not reliably support (see
// the note above the portal below).
function MapCanvas({ valid, validHighlight, highlightColor, connect, interactive, onMarkerClickRef, pointsKey, style }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const layerRef = useRef(null);
  const { theme } = useTheme();

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: false,
      attributionControl: true,
    }).setView([33.5, 35.4], 8); // Lebanon coast fallback view
    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [interactive]);

  // swap tiles on theme change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileRef.current) tileRef.current.remove();
    tileRef.current = L.tileLayer(TILES[theme === "dark" ? "dark" : "light"], {
      attribution: ATTRIBUTION,
      subdomains: "abcd",
      maxZoom: 19,
    }).addTo(map);
  }, [theme]);

  // draw markers + line, fit bounds
  useEffect(() => {
    const map = mapRef.current;
    const group = layerRef.current;
    if (!map || !group) return;
    group.clearLayers();
    if (valid.length === 0) return;

    valid.forEach((p) => {
      const m = L.marker([p.lat, p.lng], { icon: markerIcon(p.kind), keyboard: false });
      if (p.label) m.bindTooltip(p.label, { direction: "top", offset: [0, -8] });
      if (onMarkerClickRef.current) {
        m.on("click", () => onMarkerClickRef.current(p));
        m.on("add", () => {
          const el = m.getElement();
          if (el) el.style.cursor = "pointer";
        });
      }
      m.addTo(group);
    });

    if (connect && valid.length >= 2) {
      L.polyline(valid.map((p) => [p.lat, p.lng]), {
        color: ROUTE_LINE,
        weight: 3,
        opacity: 0.9,
        dashArray: "1 6",
        lineCap: "round",
      }).addTo(group);
    }

    // The highlighted ride, solid and on top of the dashed base line so it
    // reads as "this part" without losing the rest of the line for context.
    if (validHighlight.length >= 2) {
      L.polyline(validHighlight.map((p) => [p.lat, p.lng]), {
        color: highlightColor,
        weight: 5,
        opacity: 0.95,
        lineCap: "round",
      }).addTo(group);
    }
    if (validHighlight.length >= 1) {
      const ends = [validHighlight[0], validHighlight[validHighlight.length - 1]];
      ends.forEach((p) => {
        const m = L.marker([p.lat, p.lng], { icon: highlightMarkerIcon(highlightColor), keyboard: false, zIndexOffset: 500 });
        if (p.label) m.bindTooltip(p.label, { direction: "top", offset: [0, -10] });
        // This marker sits on top of the plain one at the same spot (higher
        // zIndexOffset), so it's the one that actually receives the click —
        // without this, re-clicking an already-selected endpoint would do
        // nothing.
        if (onMarkerClickRef.current) {
          m.on("click", () => onMarkerClickRef.current(p));
          m.on("add", () => {
            const el = m.getElement();
            if (el) el.style.cursor = "pointer";
          });
        }
        m.addTo(group);
      });
    }

    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 14);
    } else {
      map.fitBounds(valid.map((p) => [p.lat, p.lng]), { padding: [30, 30], maxZoom: 14 });
    }
    // the container may have been hidden/resized when created inside a dialog
    setTimeout(() => map.invalidateSize(), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pointsKey, connect]);

  return <div ref={containerRef} style={style} />;
}

export default function LeafletMap({
  points = [],
  connect = false,
  height = 220,
  interactive = true,
  // An optional ride to pick out from the rest of the line — e.g. the
  // segment a selected travel card covers. Drawn as a solid contrasting line
  // over the dashed base route, with the two ends marked distinctly.
  highlightPoints = [],
  highlightColor = "#2F6FED",
  // Adds a hover-revealed control that blows the map up to fill the window.
  maximizable = false,
  // Makes every marker clickable, calling back with that point's own data
  // (whatever was passed in `points`/`highlightPoints`, so pass an `id`
  // through if the caller needs to know which one). Used for picking a
  // route's endpoints by clicking stations directly, instead of only via
  // the dropdowns.
  onMarkerClick,
}) {
  const [expanded, setExpanded] = useState(false);
  // Ref so the draw effect (which only wants to re-run when the POINTS
  // change) doesn't have to list the callback as a dependency — callers
  // routinely pass a fresh function every render.
  const onMarkerClickRef = useRef(onMarkerClick);
  onMarkerClickRef.current = onMarkerClick;

  const valid = points.filter(isValid).map((p) => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }));
  const validHighlight = highlightPoints.filter(isValid).map((p) => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }));
  const pointsKey = JSON.stringify([
    valid.map((p) => [p.lat, p.lng, p.label, p.kind]),
    validHighlight.map((p) => [p.lat, p.lng, p.label]),
    highlightColor,
  ]);

  // Escape restores, the way every other fullscreen surface behaves.
  useEffect(() => {
    if (!expanded) return;
    function onKey(event) {
      if (event.key === "Escape") setExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [expanded]);

  const canvasProps = { valid, validHighlight, highlightColor, connect, interactive, onMarkerClickRef, pointsKey };

  const maximizeButton = (
    <button
      type="button"
      onClick={() => setExpanded((e) => !e)}
      aria-label={expanded ? "Restore map size" : "Maximise map"}
      title={expanded ? "Restore (Esc)" : "Maximise"}
      // Hidden until the map is hovered so it doesn't clutter the page — but
      // only on devices that actually have a hover state. Touch devices have
      // no way to trigger `:hover` at all, so there the button just stays
      // visible (matches always-visible while maximised, and on keyboard
      // focus, since neither reaches hover).
      className={`absolute grid h-8 w-8 place-items-center rounded-lg transition-opacity focus:opacity-100 ${
        expanded
          ? "opacity-100"
          : "opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100"
      }`}
      style={{
        top: expanded ? 26 : 10,
        right: expanded ? 26 : 10,
        zIndex: 500,
        background: "var(--surface)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.18)",
      }}
    >
      {expanded ? (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3v6H3M15 21v-6h6M3 15h6v6M21 9h-6V3" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
      )}
    </button>
  );

  const emptyState = valid.length === 0 && (
    <div
      className="absolute inset-0 grid place-items-center rounded-xl text-center text-sm"
      style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
    >
      <span className="px-6">No location set for these stations yet.</span>
    </div>
  );

  return (
    <div className="group" style={{ position: "relative", height }}>
      {/* Hidden (not unmounted, so its Leaflet instance survives) rather than
          replaced by the fullscreen copy below — visibility:hidden also
          drops it from hit-testing, so it can't steal taps meant for the
          portal's button, which shares the same aria-label while expanded. */}
      <MapCanvas
        {...canvasProps}
        style={{
          height,
          borderRadius: 12,
          overflow: "hidden",
          border: "1px solid var(--border)",
          zIndex: 0,
          visibility: expanded ? "hidden" : "visible",
        }}
      />
      {maximizable && !expanded && maximizeButton}
      {!expanded && emptyState}

      {/* A nested z-index can never escape its ancestor's own stacking
          context — PassengerLayout's <header> sits at z-40 while <main> (and
          everything inside it, including this map) is capped at z-10, so no
          z-index set in place here could ever paint or receive clicks above
          the header. Portaling a SEPARATE, freshly-mounted map straight to
          <body> escapes that entirely. (An earlier version tried to move the
          single Leaflet instance between an inline slot and <body> by
          changing one portal's target — React does not reliably preserve the
          DOM/Leaflet state across that move, so this mounts an independent
          instance instead, which is a normal, fully supported mount/unmount.) */}
      {expanded &&
        createPortal(
          <div
            className="group"
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              padding: 16,
              background: "color-mix(in srgb, var(--bg) 94%, transparent)",
            }}
          >
            <MapCanvas
              {...canvasProps}
              style={{ height: "100%", borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", zIndex: 0 }}
            />
            {maximizeButton}
            {emptyState}
          </div>,
          document.body
        )}
    </div>
  );
}
