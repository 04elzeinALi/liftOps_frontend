import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/api/errors";
import api from "@/api/client";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute } from "@/api/routes";
import { useCreateWalkUpPassenger, usePassengerLookup } from "@/api/driverShifts";
import { distanceAlongStops, effectiveFare } from "@/lib/fare";
import { usePricingSettings } from "@/api/pricingSettings";
import { tripRoute } from "@/lib/trip";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EMPTY_NEW = { first_name: "", last_name: "", phone_number: "", email: "", password: "" };

/**
 * Boards a rider who turned up without a booking.
 *
 * Three things have to happen and all of them are the driver's problem: the
 * rider needs an account (find theirs, or open one), a single-trip card for the
 * segment they're riding (which is what sets the fare), and the boarding
 * itself. The driver takes cash, so the payment is recorded as cash — left
 * unpaid until confirmed, exactly like the passenger-side flow.
 */
export default function WalkUpBoardingDialog({ open, onOpenChange, trip }) {
  const queryClient = useQueryClient();
  const route = tripRoute(trip);
  const { data: routeDetail } = useRoute(route?.id);
  const { data: pricingSettings } = usePricingSettings();
  const createPassenger = useCreateWalkUpPassenger();

  const [mode, setMode] = useState("find"); // find | new
  const [search, setSearch] = useState("");
  const [passengerId, setPassengerId] = useState("");
  const [newPassenger, setNewPassenger] = useState(EMPTY_NEW);
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

  useEffect(() => {
    if (!open) return;
    setMode("find");
    setSearch("");
    setPassengerId("");
    setNewPassenger(EMPTY_NEW);
    setError("");
    setBusy(false);
  }, [open]);

  // Default to the rest of the line from its start; the driver narrows it.
  useEffect(() => {
    if (stops.length < 2) return;
    setFromStationId(String(stops[0].id));
    setToStationId(String(stops[stops.length - 1].id));
  }, [stops]);

  const segmentKm =
    fromStationId && toStationId ? distanceAlongStops(stops, fromStationId, toStationId) : null;
  const fare = segmentKm != null ? effectiveFare(routeDetail, segmentKm, pricingSettings) : null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      // 1. Whose ride is this?
      let riderId = Number(passengerId);

      if (mode === "new") {
        const created = await createPassenger.mutateAsync({
          first_name: newPassenger.first_name,
          last_name: newPassenger.last_name,
          phone_number: newPassenger.phone_number,
          email: newPassenger.email,
          password: newPassenger.password,
          password_confirmation: newPassenger.password,
        });
        riderId = created.id;
      }

      if (!riderId) {
        setError("Pick the passenger, or open an account for them.");
        setBusy(false);
        return;
      }

      // 2. A single-trip card for the segment they're riding — this is what
      //    prices the ride.
      const cardRes = await api.post("/travel-cards", {
        passenger_id: riderId,
        route_id: route.id,
        from_station_id: Number(fromStationId),
        to_station_id: Number(toStationId),
        card_type: "single",
        status: "active",
      });
      const card = cardRes.data;

      // 3. Cash taken on the bus. It stays unpaid until confirmed, so the
      //    money is still reconcilable against the driver later.
      await api.post("/payments", {
        travel_card_id: card.id,
        payment_method: "cash",
      });

      // 4. And onto the bus.
      await api.post("/boardings", {
        trip_id: trip.id,
        passenger_id: riderId,
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

  const canSubmit =
    fromStationId &&
    toStationId &&
    (mode === "find"
      ? Boolean(passengerId)
      : newPassenger.first_name && newPassenger.last_name && newPassenger.phone_number && newPassenger.email && newPassenger.password.length >= 8);

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

          <div className="flex gap-1.5">
            {[
              ["find", "Existing rider"],
              ["new", "New account"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setMode(value)}
                className="rounded-lg px-3 py-1.5 text-sm font-semibold"
                style={{
                  background: mode === value ? "var(--accent)" : "var(--surface-2)",
                  color: mode === value ? "var(--accent-ink)" : "var(--text-muted)",
                }}
              >
                {label}
              </button>
            ))}
          </div>

          {mode === "find" ? (
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
                      No match. Open an account for them instead.
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
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    value={newPassenger.first_name}
                    onChange={(e) => setNewPassenger((f) => ({ ...f, first_name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    value={newPassenger.last_name}
                    onChange={(e) => setNewPassenger((f) => ({ ...f, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone_number">Phone</Label>
                <Input
                  id="phone_number"
                  value={newPassenger.phone_number}
                  onChange={(e) => setNewPassenger((f) => ({ ...f, phone_number: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newPassenger.email}
                  onChange={(e) => setNewPassenger((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">Password they'll log in with</Label>
                <Input
                  id="password"
                  type="text"
                  value={newPassenger.password}
                  onChange={(e) => setNewPassenger((f) => ({ ...f, password: e.target.value }))}
                  placeholder="At least 8 characters"
                />
                <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                  Read this out to them — they'll need it to sign in later.
                </p>
              </div>
            </div>
          )}

          {stops.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from_station_id">Boarding at</Label>
                <Select value={fromStationId} onValueChange={setFromStationId}>
                  <SelectTrigger id="from_station_id" className="w-full">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    {stops.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="to_station_id">Getting off at</Label>
                <Select value={toStationId} onValueChange={setToStationId}>
                  <SelectTrigger id="to_station_id" className="w-full">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    {stops
                      .filter((s) => String(s.id) !== fromStationId)
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
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
