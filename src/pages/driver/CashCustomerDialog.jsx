import { useEffect, useMemo, useState } from "react";
import { getApiErrorMessage } from "@/api/errors";
import { useCreateCashBoarding } from "@/api/driverTrips";
import { useRoute } from "@/api/routes";
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

const EMPTY_FORM = { customer_name: "", from_station_id: "", to_station_id: "", amount: "" };

// A rider who turned up without a reservation, an account, or a travel
// card — pays cash, rides once. Deliberately minimal: who they are, where
// they got on and off, and what they paid. No capacity check and no
// account creation — this is the lightweight path next to "Board a
// walk-up" (WalkUpBoardingDialog), for when setting up a full account and
// card is more ceremony than a one-time cash rider needs.
export default function CashCustomerDialog({ open, onOpenChange, trip }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const createCashBoarding = useCreateCashBoarding();

  const route = tripRoute(trip);
  const { data: routeDetail } = useRoute(route?.id);

  const stops = useMemo(
    () =>
      (routeDetail?.route_stations ?? []).map((rs) => ({
        id: rs.station_id,
        name: rs.station?.station_name ?? `Station #${rs.station_id}`,
      })),
    [routeDetail]
  );

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setError("");
    }
  }, [open]);

  // Default to the whole line, the same way the walk-up flow does — the
  // driver narrows it if the rider got on or off partway.
  useEffect(() => {
    if (!open || stops.length < 2) return;
    setForm((f) => ({
      ...f,
      from_station_id: String(stops[0].id),
      to_station_id: String(stops[stops.length - 1].id),
    }));
  }, [open, stops]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await createCashBoarding.mutateAsync({
        trip_id: trip.id,
        customer_name: form.customer_name,
        from_station_id: form.from_station_id ? Number(form.from_station_id) : null,
        to_station_id: form.to_station_id ? Number(form.to_station_id) : null,
        amount: Number(form.amount),
      });
      onOpenChange(false);
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to add this cash customer. Please try again."));
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Cash Customer</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            For a one-time rider who paid you directly, on {route?.route_name ?? "this route"}.
          </p>

          <div>
            <Label htmlFor="customer_name">Name</Label>
            <Input
              id="customer_name"
              value={form.customer_name}
              onChange={(e) => handleChange("customer_name", e.target.value)}
              required
            />
          </div>

          {stops.length >= 2 ? (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="from_station_id">Departure</Label>
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
              </div>
              <div>
                <Label htmlFor="to_station_id">Destination</Label>
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
              </div>
            </div>
          ) : (
            <p className="rounded-lg p-3 text-xs" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
              This route has no stops set up, so departure and destination can't be recorded.
            </p>
          )}

          <div>
            <Label htmlFor="amount">Amount collected</Label>
            <Input
              id="amount"
              type="number"
              step="any"
              min="0"
              value={form.amount}
              onChange={(e) => handleChange("amount", e.target.value)}
              required
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={createCashBoarding.isPending}>
              {createCashBoarding.isPending ? "Saving…" : "Add Customer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
