import { useEffect, useMemo, useState } from "react";
import { useRoute, useRoutes } from "@/api/routes";
import { useStationsList } from "@/api/stations";
import {
  useCreateRouteStation,
  useDeleteRouteStation,
  useReorderRouteStations,
} from "@/api/routeStations";
import RouteLineGraph from "@/components/RouteLineGraph";
import LeafletMap from "@/components/LeafletMap";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function RouteStationsPage() {
  const { data: routes } = useRoutes();
  const { data: stations } = useStationsList();
  const [routeId, setRouteId] = useState("");
  const { data: route, isLoading } = useRoute(routeId);

  const createRouteStation = useCreateRouteStation();
  const deleteRouteStation = useDeleteRouteStation();
  const reorderRouteStations = useReorderRouteStations();

  // The sequence is edited locally and committed with Save, so moving a stop
  // up three places costs one request, not three.
  const [order, setOrder] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");

  // Default to the first route so the page isn't empty on arrival.
  useEffect(() => {
    if (!routeId && routes?.length) setRouteId(String(routes[0].id));
  }, [routes, routeId]);

  useEffect(() => {
    if (!route) return;
    setOrder(
      (route.route_stations ?? []).map((rs) => ({
        station_id: rs.station_id,
        name: rs.station?.station_name ?? `Station #${rs.station_id}`,
        latitude: rs.station?.latitude,
        longitude: rs.station?.longitude,
      }))
    );
    setDirty(false);
    setError("");
  }, [route]);

  const unusedStations = useMemo(() => {
    const used = new Set(order.map((s) => s.station_id));
    return (stations ?? []).filter((s) => !used.has(s.id));
  }, [stations, order]);

  function move(index, delta) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setDirty(true);
  }

  async function handleAdd(stationId) {
    setError("");
    try {
      await createRouteStation.mutateAsync({
        route_id: Number(routeId),
        station_id: Number(stationId),
      });
    } catch {
      setError("Couldn't add that stop. It may already be on this route.");
    }
  }

  async function handleRemove(stationId) {
    setError("");
    try {
      await deleteRouteStation.mutateAsync({
        route_id: Number(routeId),
        station_id: Number(stationId),
      });
    } catch {
      setError("Couldn't remove that stop. Please try again.");
    }
  }

  async function handleSave() {
    setError("");
    try {
      await reorderRouteStations.mutateAsync({
        route_id: Number(routeId),
        station_ids: order.map((s) => s.station_id),
      });
      setDirty(false);
    } catch {
      setError("Couldn't save the new order. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            Route Line
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            The stops a bus calls at, in order. This order draws the route diagram passengers see.
          </p>
        </div>
        <div className="min-w-[260px]">
          <Label htmlFor="route">Route</Label>
          <Select value={routeId} onValueChange={setRouteId}>
            <SelectTrigger id="route" className="w-full">
              <SelectValue placeholder="Select a route" />
            </SelectTrigger>
            <SelectContent>
              {routes?.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.route_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="mb-3 text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}

      {route && (
        <div className="grid gap-5 lg:grid-cols-[1fr_380px]">
          {/* editor */}
          <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
                Stop sequence
                <span className="ml-2 text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  {order.length} stop{order.length === 1 ? "" : "s"}
                </span>
              </h2>
              <Button onClick={handleSave} disabled={!dirty || reorderRouteStations.isPending}>
                {reorderRouteStations.isPending ? "Saving…" : dirty ? "Save order" : "Saved"}
              </Button>
            </div>

            {order.length === 0 && (
              <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
                No stops yet. Add the first one below.
              </p>
            )}

            <ol className="mb-4">
              {order.map((stop, i) => (
                <li
                  key={stop.station_id}
                  className="flex items-center gap-3 py-2"
                  style={{ borderBottom: i === order.length - 1 ? "none" : "1px solid var(--border)" }}
                >
                  <span
                    className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold"
                    style={{ background: "var(--surface-2)", color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
                  >
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm" style={{ color: "var(--text)" }}>
                    {stop.name}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => move(i, -1)}
                      disabled={i === 0}
                      aria-label={`Move ${stop.name} up`}
                      className="grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
                      style={{ background: "var(--surface-2)", color: "var(--text)" }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M6 11l6-6 6 6" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => move(i, 1)}
                      disabled={i === order.length - 1}
                      aria-label={`Move ${stop.name} down`}
                      className="grid h-7 w-7 place-items-center rounded-md disabled:opacity-30"
                      style={{ background: "var(--surface-2)", color: "var(--text)" }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemove(stop.station_id)}
                      aria-label={`Remove ${stop.name}`}
                      className="grid h-7 w-7 place-items-center rounded-md"
                      style={{ background: "var(--critical-bg)", color: "var(--critical)" }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /></svg>
                    </button>
                  </div>
                </li>
              ))}
            </ol>

            <div>
              <Label htmlFor="add_station">Add a stop</Label>
              <Select value="" onValueChange={handleAdd}>
                <SelectTrigger id="add_station" className="w-full">
                  <SelectValue placeholder="Select a station to append" />
                </SelectTrigger>
                <SelectContent>
                  {unusedStations.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.station_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {unusedStations.length === 0
                  ? "Every station is already on this route."
                  : "New stops are added to the end — move them into place, then save."}
              </p>
            </div>
          </div>

          {/* live preview */}
          <div className="flex flex-col gap-4">
            <LeafletMap
              height={420}
              connect
              maximizable
              points={order.map((s) => ({ lat: s.latitude, lng: s.longitude, label: s.name, kind: "stop" }))}
            />
            <RouteLineGraph
              routeName={route.route_name}
              origin={route.origin}
              destination={route.destination}
              stops={order.map((s) => ({ id: s.station_id, name: s.name }))}
            />
          </div>
        </div>
      )}
    </div>
  );
}
