import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useRoute, useRoutes } from "@/api/routes";
import { fareForDistance } from "@/lib/fare";
import RouteLineGraph from "@/components/RouteLineGraph";
import LeafletMap from "@/components/LeafletMap";

export default function RouteLinePage() {
  const { data: routes } = useRoutes();
  const [routeId, setRouteId] = useState("");
  const { data: route, isLoading, isError } = useRoute(routeId);

  useEffect(() => {
    if (!routeId && routes?.length) setRouteId(String(routes[0].id));
  }, [routes, routeId]);

  const stops = (route?.route_stations ?? []).map((rs) => ({
    id: rs.station_id,
    name: rs.station?.station_name ?? `Station #${rs.station_id}`,
    lat: rs.station?.latitude,
    lng: rs.station?.longitude,
  }));

  return (
    <div className="mx-auto w-full max-w-[452px]">
      <Link to="/passenger" className="mb-4 inline-block text-sm font-semibold" style={{ color: "var(--accent)" }}>
        ← Back
      </Link>

      <h1 className="font-display mb-4 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        The Line
      </h1>

      {routes && routes.length > 1 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {routes.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRouteId(String(r.id))}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{
                background: String(r.id) === routeId ? "var(--accent)" : "var(--surface-2)",
                color: String(r.id) === routeId ? "var(--accent-ink)" : "var(--text-muted)",
              }}
            >
              {r.route_name}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          Failed to load this route.
        </p>
      )}

      {route && (
        <div className="flex flex-col gap-4">
          <RouteLineGraph
            routeName={route.route_name}
            origin={route.origin}
            destination={route.destination}
            stops={stops}
            price={fareForDistance(route.distance_km)}
            priceNote={`End to end · ${route.distance_km} km`}
          />
          <LeafletMap
            height={260}
            connect
            points={stops.map((s) => ({ lat: s.lat, lng: s.lng, label: s.name, kind: "stop" }))}
          />
        </div>
      )}
    </div>
  );
}
