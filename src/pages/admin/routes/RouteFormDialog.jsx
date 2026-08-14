import { useEffect, useMemo, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateRoute, useUpdateRoute } from "@/api/routes";
import { useStationsList } from "@/api/stations";
import { DEFAULT_PRICING_SETTINGS, ROAD_FACTOR, haversineKm } from "@/lib/fare";
import { deferSelectSet } from "@/lib/deferSelectSet";
import { usePricingSettings } from "@/api/pricingSettings";
import LeafletMap from "@/components/LeafletMap";
import SearchableSelect from "@/components/SearchableSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const EMPTY_FORM = {
  route_name: "",
  origin_station_id: "",
  destination_station_id: "",
  estimated_duration: "",
  manual_fare: "",
  long_trip_km: "",
  short_trip_fare: "",
  long_trip_fare: "",
};

export default function RouteFormDialog({ open, onOpenChange, route }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: stations } = useStationsList();
  const { data: pricingSettings } = usePricingSettings();
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const isEditing = Boolean(route);
  const isSubmitting = createRoute.isPending || updateRoute.isPending;
  const stationOptions = useMemo(
    () => (stations ?? []).map((s) => ({ value: String(s.id), label: s.station_name })),
    [stations]
  );

  const originStation = stations?.find((s) => s.id === Number(form.origin_station_id));
  const destinationStation = stations?.find((s) => s.id === Number(form.destination_station_id));

  // Starting figures for a route that hasn't been priced yet. There's no
  // pricing screen any more — every route carries its own — so these only
  // seed the fields below, they're never what a saved route runs on.
  const defaultBands = pricingSettings ?? DEFAULT_PRICING_SETTINGS;

  // The three band fields move together: a route prices on all three or none
  // of them. Anything between is flagged rather than silently half-applied
  // (the server rejects it too — see RouteController's required_with rules).
  const bandsFilled = [form.long_trip_km, form.short_trip_fare, form.long_trip_fare]
    .filter((v) => v !== "" && v !== null).length;
  const partialBands = bandsFilled > 0 && bandsFilled < 3;

  // Straight-line distance between the two endpoints, scaled by the same
  // detour factor the backend applies (Route::ROAD_FACTOR) — this is a
  // preview of what the server will independently compute and save, not a
  // value the admin edits directly. It's necessarily rougher than the
  // stop-by-stop distance Route::totalDistanceKm() gives once the route's
  // full stop sequence is set up on the Route Stations page; this is what's
  // available before that sequence exists.
  const computedDistanceKm = useMemo(() => {
    if (!originStation || !destinationStation) return null;
    const km = haversineKm(
      Number(originStation.latitude),
      Number(originStation.longitude),
      Number(destinationStation.latitude),
      Number(destinationStation.longitude)
    );
    return km * ROAD_FACTOR;
  }, [originStation, destinationStation]);

  useEffect(() => {
    if (!open) return;

    if (route) {
      // origin/destination start blank and are filled in a moment later —
      // see deferSelectSet. Setting a SearchableSelect's value in the same
      // commit as this effect gets silently reset back to "" by Radix's own
      // mount-time state sync (it's inside a <form>), which would make the
      // origin/destination pickers show their placeholder on every edit even
      // though a real station was "selected" the whole time.
      setForm({
        route_name: route.route_name,
        origin_station_id: "",
        destination_station_id: "",
        estimated_duration: route.estimated_duration,
        manual_fare: route.manual_fare ?? "",
        long_trip_km: route.long_trip_km ?? "",
        short_trip_fare: route.short_trip_fare ?? "",
        long_trip_fare: route.long_trip_fare ?? "",
      });
      deferSelectSet(() => {
        setForm((f) => ({
          ...f,
          origin_station_id: route.origin_station_id ?? "",
          destination_station_id: route.destination_station_id ?? "",
        }));
      });
    } else {
      setForm(EMPTY_FORM);
    }
    setErrors({});
    setGeneralError("");
  }, [open, route]);

  // Seed the bands for a route that has none, so the admin adjusts real
  // numbers rather than guessing what to type into three empty boxes — and
  // so every route ends up saved with pricing of its own instead of quietly
  // resting on a fallback there's no longer a screen for. Runs after the
  // effect above (and again once the defaults finish loading), and only
  // touches fields still untouched, so it can't overwrite a real value.
  useEffect(() => {
    if (!open || !pricingSettings) return;
    setForm((f) => {
      if (f.long_trip_km !== "" || f.short_trip_fare !== "" || f.long_trip_fare !== "") {
        return f;
      }
      return {
        ...f,
        long_trip_km: pricingSettings.long_trip_km,
        short_trip_fare: pricingSettings.short_trip_fare,
        long_trip_fare: pricingSettings.long_trip_fare,
      };
    });
  }, [open, pricingSettings]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  // Clicking a station on the map picks it as the origin, then the
  // destination, cycling: a third click starts a fresh pick from that
  // station, and clicking whichever endpoint is already selected clears it
  // instead (so re-picking doesn't require starting over).
  function handleStationClick(station) {
    const clickedId = station.id;
    if (form.origin_station_id === clickedId) {
      handleChange("origin_station_id", "");
      return;
    }
    if (form.destination_station_id === clickedId) {
      handleChange("destination_station_id", "");
      return;
    }
    if (!form.origin_station_id) {
      handleChange("origin_station_id", clickedId);
    } else if (!form.destination_station_id) {
      handleChange("destination_station_id", clickedId);
    } else {
      setForm((f) => ({ ...f, origin_station_id: clickedId, destination_station_id: "" }));
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      route_name: form.route_name,
      origin_station_id: Number(form.origin_station_id),
      destination_station_id: Number(form.destination_station_id),
      distance_km: computedDistanceKm,
      estimated_duration: form.estimated_duration,
      manual_fare: form.manual_fare === "" ? null : Number(form.manual_fare),
      long_trip_km: form.long_trip_km === "" ? null : Number(form.long_trip_km),
      short_trip_fare: form.short_trip_fare === "" ? null : Number(form.short_trip_fare),
      long_trip_fare: form.long_trip_fare === "" ? null : Number(form.long_trip_fare),
    };
    try {
      if (isEditing) {
        await updateRoute.mutateAsync({ id: route.id, payload });
      } else {
        await createRoute.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      setErrors(fieldErrors ?? {});
      setGeneralError(message ?? "");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Route" : "Add Route"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {open && (
            <>
              <LeafletMap
                height={320}
                points={(stations ?? []).map((s) => ({
                  id: s.id,
                  lat: s.latitude,
                  lng: s.longitude,
                  label: s.station_name,
                  kind: "stop",
                }))}
                highlightPoints={[originStation, destinationStation]
                  .filter(Boolean)
                  .map((s) => ({ id: s.id, lat: s.latitude, lng: s.longitude, label: s.station_name }))}
                onMarkerClick={handleStationClick}
              />
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Click a station to set it as the origin, then click another for the destination — click either again to clear it.
              </p>
            </>
          )}
          <div>
            <Label htmlFor="route_name">Route name</Label>
            <Input
              id="route_name"
              value={form.route_name}
              onChange={(e) => handleChange("route_name", e.target.value)}
              required
            />
            {errors.route_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.route_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="origin_station_id">Origin</Label>
            <SearchableSelect
              id="origin_station_id"
              value={form.origin_station_id ? String(form.origin_station_id) : ""}
              onValueChange={(value) => handleChange("origin_station_id", Number(value))}
              options={stationOptions}
              placeholder="Select a station"
              title="Origin"
              searchPlaceholder="Search stations…"
              emptyMessage="No stations match."
            />
            {errors.origin_station_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.origin_station_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="destination_station_id">Destination</Label>
            <SearchableSelect
              id="destination_station_id"
              value={form.destination_station_id ? String(form.destination_station_id) : ""}
              onValueChange={(value) => handleChange("destination_station_id", Number(value))}
              options={stationOptions}
              placeholder="Select a station"
              title="Destination"
              searchPlaceholder="Search stations…"
              emptyMessage="No stations match."
            />
            {errors.destination_station_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.destination_station_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label>Distance</Label>
            <div
              className="rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface-2)", color: computedDistanceKm != null ? "var(--text)" : "var(--text-muted)" }}
            >
              {computedDistanceKm != null ? `${computedDistanceKm.toFixed(2)} km` : "Pick an origin and destination to calculate"}
            </div>
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              Calculated automatically from the origin and destination's locations — not editable directly.
            </p>
            {errors.distance_km && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.distance_km[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="estimated_duration">Estimated duration</Label>
            <Input
              id="estimated_duration"
              placeholder="e.g. 1h 30m"
              value={form.estimated_duration}
              onChange={(e) => handleChange("estimated_duration", e.target.value)}
              required
            />
            {errors.estimated_duration && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.estimated_duration[0]}
              </p>
            )}
          </div>
          <div className="rounded-xl p-4" style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}>
            <h3 className="font-display text-base font-bold" style={{ color: "var(--text)" }}>
              Pricing for this route
            </h3>
            <p className="mt-0.5 mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
              Rides on this route are priced by how far they run. A ride under the cutoff pays the
              short fare; at or over it, the long fare.
            </p>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="long_trip_km">Distance cutoff (km)</Label>
                <Input
                  id="long_trip_km"
                  type="number"
                  step="any"
                  min="0.1"
                  className="no-spinner"
                  placeholder={String(defaultBands.long_trip_km)}
                  value={form.long_trip_km}
                  onChange={(e) => handleChange("long_trip_km", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="short_trip_fare">Short fare</Label>
                <Input
                  id="short_trip_fare"
                  type="number"
                  step="any"
                  min="0"
                  placeholder={Number(defaultBands.short_trip_fare).toFixed(2)}
                  value={form.short_trip_fare}
                  onChange={(e) => handleChange("short_trip_fare", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="long_trip_fare">Long fare</Label>
                <Input
                  id="long_trip_fare"
                  type="number"
                  step="any"
                  min="0"
                  placeholder={Number(defaultBands.long_trip_fare).toFixed(2)}
                  value={form.long_trip_fare}
                  onChange={(e) => handleChange("long_trip_fare", e.target.value)}
                />
              </div>
            </div>
            {partialBands && (
              <p className="mt-2 text-xs" style={{ color: "var(--critical)" }}>
                Fill in all three, or clear all three — a route can't mix its own distance cutoff with the network's fares.
              </p>
            )}
            {["long_trip_km", "short_trip_fare", "long_trip_fare"].map(
              (field) =>
                errors[field] && (
                  <p key={field} className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                    {errors[field][0]}
                  </p>
                )
            )}

            <div className="mt-4">
              <Label htmlFor="manual_fare">Flat price override</Label>
              <Input
                id="manual_fare"
                type="number"
                step="any"
                placeholder="Leave blank to price by distance"
                value={form.manual_fare}
                onChange={(e) => handleChange("manual_fare", e.target.value)}
              />
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                Charges this fixed price per ride and ignores distance entirely — overrides the bands above.
              </p>
              {errors.manual_fare && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                  {errors.manual_fare[0]}
                </p>
              )}
            </div>
          </div>
          {generalError && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {generalError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting || partialBands}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
