import { useEffect, useRef } from "react";
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

const KIND_COLOR = {
  origin: "var(--amber)",
  boarding: "var(--amber)",
  destination: "var(--accent)",
  stop: "var(--accent)",
};

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

export default function LeafletMap({ points = [], connect = false, height = 220, interactive = true }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const layerRef = useRef(null);
  const { theme } = useTheme();

  const valid = points.filter(isValid).map((p) => ({ ...p, lat: Number(p.lat), lng: Number(p.lng) }));
  const pointsKey = JSON.stringify(valid.map((p) => [p.lat, p.lng, p.label, p.kind]));

  // create map once
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
      m.addTo(group);
    });

    if (connect && valid.length >= 2) {
      L.polyline(valid.map((p) => [p.lat, p.lng]), {
        color: "#1F8B84",
        weight: 3,
        opacity: 0.85,
        dashArray: "1 6",
        lineCap: "round",
      }).addTo(group);
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

  // The container must always mount so the map is created once and survives
  // points arriving later (e.g. stations picked after the dialog opens). The
  // empty-state message is an overlay, not a replacement for the container.
  return (
    <div style={{ position: "relative", height }}>
      <div
        ref={containerRef}
        style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", zIndex: 0 }}
      />
      {valid.length === 0 && (
        <div
          className="absolute inset-0 grid place-items-center rounded-xl text-center text-sm"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
        >
          <span className="px-6">No location set for these stations yet.</span>
        </div>
      )}
    </div>
  );
}
