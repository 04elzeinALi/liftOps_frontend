import { useEffect, useMemo, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateTravelCard, usePassengersList, useUpdateTravelCard } from "@/api/travelCards";
import { useRoute, useRoutes } from "@/api/routes";
import { CARD_TERMS, distanceAlongStops, fareForDistance } from "@/lib/fare";
import { Button } from "@/components/ui/button";
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

const CARD_TYPES = ["single", "return", "weekly", "monthly"];
const STATUSES = ["active", "expired", "suspended"];

const EMPTY_FORM = {
  passenger_id: "",
  route_id: "",
  from_station_id: "",
  to_station_id: "",
  card_type: CARD_TYPES[0],
  status: STATUSES[0],
};

export default function TravelCardFormDialog({ open, onOpenChange, travelCard }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: passengers } = usePassengersList();
  const { data: routes } = useRoutes();
  const createTravelCard = useCreateTravelCard();
  const updateTravelCard = useUpdateTravelCard();
  const isEditing = Boolean(travelCard);
  const isSubmitting = createTravelCard.isPending || updateTravelCard.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        travelCard
          ? {
              passenger_id: travelCard.passenger_id,
              route_id: travelCard.route_id,
              from_station_id: travelCard.from_station_id ? String(travelCard.from_station_id) : "",
              to_station_id: travelCard.to_station_id ? String(travelCard.to_station_id) : "",
              card_type: travelCard.card_type,
              status: travelCard.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, travelCard]);

  const { data: routeDetail } = useRoute(form.route_id);

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

  // What the card will cost, so the admin sees the price before saving. The
  // fare band comes from how far the chosen segment runs; the server
  // recalculates it independently on save.
  const segmentKm =
    form.from_station_id && form.to_station_id
      ? distanceAlongStops(stops, form.from_station_id, form.to_station_id)
      : null;
  const baseFare = segmentKm != null ? fareForDistance(segmentKm) : null;
  const price = baseFare != null ? baseFare * CARD_TERMS[form.card_type].multiplier : null;

  function handleChange(field, value) {
    setForm((f) => {
      // Changing route invalidates any stops picked from the previous one.
      if (field === "route_id" && Number(value) !== Number(f.route_id)) {
        return { ...f, route_id: value, from_station_id: "", to_station_id: "" };
      }
      return { ...f, [field]: value };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      passenger_id: Number(form.passenger_id),
      route_id: Number(form.route_id),
      from_station_id: Number(form.from_station_id),
      to_station_id: Number(form.to_station_id),
      card_type: form.card_type,
      status: form.status,
    };
    try {
      if (isEditing) {
        await updateTravelCard.mutateAsync({ id: travelCard.id, payload });
      } else {
        await createTravelCard.mutateAsync(payload);
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Travel Card" : "Add Travel Card"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="passenger_id">Passenger</Label>
            <Select
              value={form.passenger_id ? String(form.passenger_id) : ""}
              onValueChange={(value) => handleChange("passenger_id", Number(value))}
            >
              <SelectTrigger id="passenger_id" className="w-full">
                <SelectValue placeholder="Select a passenger" />
              </SelectTrigger>
              <SelectContent>
                {passengers?.map((passenger) => (
                  <SelectItem key={passenger.id} value={String(passenger.id)}>
                    {passenger.first_name} {passenger.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.passenger_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.passenger_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="route_id">Route</Label>
            <Select
              value={form.route_id ? String(form.route_id) : ""}
              onValueChange={(value) => handleChange("route_id", Number(value))}
            >
              <SelectTrigger id="route_id" className="w-full">
                <SelectValue placeholder="Select a route" />
              </SelectTrigger>
              <SelectContent>
                {routes?.map((route) => (
                  <SelectItem key={route.id} value={String(route.id)}>
                    {route.origin} → {route.destination}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.route_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.route_id[0]}
              </p>
            )}
          </div>

          {form.route_id && stops.length < 2 && (
            <p className="rounded-lg p-3 text-xs" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
              This route has no stop sequence yet, so a card can't be priced by distance. Add stops under Route Line first.
            </p>
          )}

          {stops.length >= 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from_station_id">Boards at</Label>
                <Select
                  value={form.from_station_id}
                  onValueChange={(value) => handleChange("from_station_id", value)}
                >
                  <SelectTrigger id="from_station_id" className="w-full">
                    <SelectValue placeholder="From" />
                  </SelectTrigger>
                  <SelectContent>
                    {stops.map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.from_station_id && (
                  <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                    {errors.from_station_id[0]}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="to_station_id">Gets off at</Label>
                <Select
                  value={form.to_station_id}
                  onValueChange={(value) => handleChange("to_station_id", value)}
                >
                  <SelectTrigger id="to_station_id" className="w-full">
                    <SelectValue placeholder="To" />
                  </SelectTrigger>
                  <SelectContent>
                    {stops
                      .filter((s) => String(s.id) !== form.from_station_id)
                      .map((s) => (
                        <SelectItem key={s.id} value={String(s.id)}>
                          {s.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                {errors.to_station_id && (
                  <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                    {errors.to_station_id[0]}
                  </p>
                )}
              </div>
            </div>
          )}

          {segmentKm != null && (
            <div
              className="flex items-baseline justify-between rounded-lg px-3 py-2.5 text-sm"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
            >
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {segmentKm.toFixed(1)} km · ${baseFare.toFixed(2)}/ride ×{" "}
                {CARD_TERMS[form.card_type].total_trips}
              </span>
              <span className="font-display text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                ${price.toFixed(2)}
              </span>
            </div>
          )}

          <div>
            <Label htmlFor="card_type">Card type</Label>
            <select
              id="card_type"
              value={form.card_type}
              onChange={(e) => handleChange("card_type", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {CARD_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {errors.card_type && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.card_type[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.status[0]}
              </p>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Trip count, expiry date, and price are computed automatically from the card type.
          </p>
          {generalError && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {generalError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
