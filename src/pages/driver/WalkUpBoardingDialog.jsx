import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/api/errors";
import api from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "@/api/routes";
import { usePassengerLookup } from "@/api/driverShifts";
import { distanceAlongStops, effectiveFare } from "@/lib/fare";
import { usePricingSettings } from "@/api/pricingSettings";
import { deferSelectSet } from "@/lib/deferSelectSet";
import { tripRoute } from "@/lib/trip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/SearchableSelect";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

/**
 * Boards a rider who has an account but turned up without a booking.
 *
 * Opening a new account isn't done here — a rider with no account is a cash
 * customer instead (see CashCustomerDialog), which needs neither an account
 * nor a password read aloud on a moving bus. Two things happen for an
 * existing rider: a single-trip card for the segment they're riding (which
 * is what sets the fare), and the boarding itself. The driver takes cash, so
 * the payment is recorded as cash — left unpaid until confirmed, exactly
 * like the passenger-side flow.
 */
export default function WalkUpBoardingDialog({ open, onOpenChange, trip }) {
  const queryClient = useQueryClient();
  const route = tripRoute(trip);
  const { data: routeDetail } = useRoute(route?.id);
  const { data: pricingSettings } = usePricingSettings();

  const [search, setSearch] = useState("");
  const [passengerId, setPassengerId] = useState("");
  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const { data: matches, isFetching: searching } = usePassengerLookup(search);

  const stops = useMemo(
    () =>
      (routeDetail?.route_stations ?? []).map((rs) => ({
        id: rs.station_id,
        name: rs.station?.station_name ?? `Station #${rs.station_id}`,
        lat: rs.station?.latitude,
        lng: rs.station?.longitude,
      })),
    [routeDetail]
  );

  const fromStationOptions = useMemo(
    () => stops.map((s) => ({ value: String(s.id), label: s.name })),
    [stops]
  );
  // A rider can't board and alight at the same stop, so "Getting off at"
  // leaves out whichever one is currently picked as "Boarding at".
  const toStationOptions = useMemo(
    () => stops.filter((s) => String(s.id) !== fromStationId).map((s) => ({ value: String(s.id), label: s.name })),
    [stops, fromStationId]
  );

  useEffect(() => {
    if (!open) return;
    setSearch("");
    setPassengerId("");
    setError("");
    setBusy(false);
  }, [open]);

  // Default to the rest of the line from its start; the driver narrows it.
  // Deferred — see deferSelectSet — because this Select is inside a <form>:
  // setting its value in the same commit as this effect gets silently reset
  // back to "" by Radix's own mount-time state sync, which would make
  // "Boarding at"/"Getting off at" show their placeholder forever and the
  // fare never appear, even though a real station was "selected" the whole
  // time.
  useEffect(() => {
    if (stops.length < 2) return;
    deferSelectSet(() => {
      setFromStationId(String(stops[0].id));
      setToStationId(String(stops[stops.length - 1].id));
    });
  }, [stops]);

  const segmentKm =
    fromStationId && toStationId ? distanceAlongStops(stops, fromStationId, toStationId) : null;
  const fare = segmentKm != null ? effectiveFare(routeDetail, segmentKm, pricingSettings) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!passengerId) {
      setError("Find and pick the rider.");
      return;
    }

    setBusy(true);

    try {
      // 1. A single-trip card for the segment they're riding — this is what
      //    prices the ride.
      const cardRes = await api.post("/travel-cards", {
        passenger_id: Number(passengerId),
        route_id: route.id,
        from_station_id: Number(fromStationId),
        to_station_id: Number(toStationId),
        card_type: "single",
        status: "active",
      });
      const card = cardRes.data;

      // 2. Cash taken on the bus. It stays unpaid until confirmed, so the
      //    money is still reconcilable against the driver later.
      await api.post("/payments", {
        travel_card_id: card.id,
        payment_method: "cash",
      });

      // 3. And onto the bus.
      await api.post("/boardings", {
        trip_id: trip.id,
        passenger_id: Number(passengerId),
        travel_card_id: card.id,
        from_station_id: Number(fromStationId),
        to_station_id: Number(toStationId),
        boarded_at: new Date().toISOString(),
      });

      queryClient.invalidateQueries({ queryKey: ["driver-trip-manifest", trip.id] });
      queryClient.invalidateQueries({ queryKey: ["driver-trip", String(trip.id)] });
      queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Couldn't board this passenger. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = fromStationId && toStationId && Boolean(passengerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Board a walk-up</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {stops.length < 2 && (
            <p className="rounded-lg p-3 text-xs" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
              This route has no stops set up, so a fare can't be worked out. Ask an admin to add them.
            </p>
          )}

          <div>
            <Label htmlFor="search">Find by name or phone</Label>
            <Input
              id="search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPassengerId("");
              }}
              placeholder="At least 3 characters"
              autoComplete="off"
            />
            {search.trim().length >= 3 && (
              <div className="mt-2 overflow-hidden rounded-lg" style={{ border: "1px solid var(--border)" }}>
                {searching && (
                  <p className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>Searching…</p>
                )}
                {!searching && (matches ?? []).length === 0 && (
                  <p className="px-3 py-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    No match. If they don't have an account, add them as a cash customer instead.
                  </p>
                )}
                {(matches ?? []).map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPassengerId(String(p.id))}
                    className="flex w-full items-center justify-between px-3 py-2 text-left text-sm"
                    style={{
                      background: String(p.id) === passengerId ? "color-mix(in srgb, var(--accent) 16%, transparent)" : "transparent",
                      color: "var(--text)",
                    }}
                  >
                    <span>{p.first_name} {p.last_name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{p.phone_number}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {stops.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from_station_id">Boarding at</Label>
                <SearchableSelect
                  id="from_station_id"
                  value={fromStationId}
                  onValueChange={setFromStationId}
                  options={fromStationOptions}
                  placeholder="From"
                  title="Boarding at"
                  searchPlaceholder="Search stations…"
                  emptyMessage="No stations match."
                />
              </div>
              <div>
                <Label htmlFor="to_station_id">Getting off at</Label>
                <SearchableSelect
                  id="to_station_id"
                  value={toStationId}
                  onValueChange={setToStationId}
                  options={toStationOptions}
                  placeholder="To"
                  title="Getting off at"
                  searchPlaceholder="Search stations…"
                  emptyMessage="No stations match."
                />
              </div>
            </div>
          )}

          {fare != null && (
            <div
              className="flex items-baseline justify-between rounded-lg px-3 py-2.5 text-sm"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              <span style={{ fontFamily: "var(--font-mono)" }}>{segmentKm.toFixed(1)} km · cash</span>
              <span className="font-display text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                ${fare.toFixed(2)}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>{error}</p>
          )}

          <DialogFooter>
            <Button type="submit" disabled={busy || !canSubmit}>
              {busy ? "Boarding…" : fare != null ? `Take $${fare.toFixed(2)} & board` : "Board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
