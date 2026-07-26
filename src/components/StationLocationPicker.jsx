import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useTheme } from "@/theme/ThemeContext";

const TILES = {
  light: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png",
  dark: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
};
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

function pinIcon() {
  return L.divIcon({
    className: "",
    html: '<span style="display:block;width:18px;height:18px;border-radius:50%;background:var(--amber);border:2px solid var(--surface);box-shadow:0 1px 5px rgba(0,0,0,.5)"></span>',
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

// Click anywhere (or drag the pin) to set a station's coordinates.
export default function StationLocationPicker({ lat, lng, onChange, height = 220 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const tileRef = useRef(null);
  const markerRef = useRef(null);
  const onChangeRef = useRef(onChange);
  const { theme } = useTheme();

  onChangeRef.current = onChange;
  const numLat = Number(lat);
  const numLng = Number(lng);
  const hasCoords = Number.isFinite(numLat) && Number.isFinite(numLng) && !(numLat === 0 && numLng === 0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const start = hasCoords ? [numLat, numLng] : [33.5, 35.4];
    const map = L.map(containerRef.current, { scrollWheelZoom: false }).setView(start, hasCoords ? 14 : 8);
    mapRef.current = map;

    if (hasCoords) {
      markerRef.current = L.marker([numLat, numLng], { icon: pinIcon(), draggable: true }).addTo(map);
      markerRef.current.on("dragend", () => {
        const { lat: a, lng: b } = markerRef.current.getLatLng();
        onChangeRef.current(a.toFixed(6), b.toFixed(6));
      });
    }

    map.on("click", (e) => {
      const { lat: a, lng: b } = e.latlng;
      if (!markerRef.current) {
        markerRef.current = L.marker([a, b], { icon: pinIcon(), draggable: true }).addTo(map);
        markerRef.current.on("dragend", () => {
          const ll = markerRef.current.getLatLng();
          onChangeRef.current(ll.lat.toFixed(6), ll.lng.toFixed(6));
        });
      } else {
        markerRef.current.setLatLng([a, b]);
      }
      onChangeRef.current(a.toFixed(6), b.toFixed(6));
    });

    setTimeout(() => map.invalidateSize(), 0);
    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  return (
    <div>
      <div
        ref={containerRef}
        style={{ height, borderRadius: 12, overflow: "hidden", border: "1px solid var(--border)", zIndex: 0 }}
      />
      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
        Click the map to set this station's location, or drag the pin.
      </p>
    </div>
  );
}
