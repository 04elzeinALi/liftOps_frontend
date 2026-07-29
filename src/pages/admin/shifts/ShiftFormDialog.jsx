import { useEffect, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateShift, useUpdateShift } from "@/api/shifts";
import { useRoutes } from "@/api/routes";
import { useBuses } from "@/api/buses";
import { useDriversList } from "@/api/drivers";
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

const STATUSES = ["scheduled", "ongoing", "completed", "cancelled", "emergency"];

const EMPTY_FORM = {
  driver_id: "",
  bus_id: "",
  route_id: "",
  shift_date: "",
  start_time: "08:00",
  end_time: "17:00",
  rounds: 2,
  status: STATUSES[0],
};

// Mirrors Shift::legPlan() so the admin sees the legs a shift will generate
// before saving it. The server generates the real ones.
function previewLegs({ start_time, end_time, rounds }) {
  if (!start_time || !end_time) return [];
  const toMinutes = (t) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const startM = toMinutes(start_time);
  let endM = toMinutes(end_time);
  if (endM <= startM) endM += 24 * 60; // runs past midnight

  const legs = Math.max(1, Number(rounds) || 1) * 2;
  const per = (endM - startM) / legs;

  return Array.from({ length: legs }, (_, i) => {
    const fmt = (mins) => {
      const t = Math.round(mins) % (24 * 60);
      return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
    };
    return {
      round: Math.floor(i / 2) + 1,
      direction: i % 2 === 0 ? "outbound" : "inbound",
      from: fmt(startM + i * per),
      to: fmt(startM + (i + 1) * per),
    };
  });
}

export default function ShiftFormDialog({ open, onOpenChange, shift }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: routes } = useRoutes();
  const { data: busesPage } = useBuses(1);
  const buses = busesPage?.data ?? [];
  const { data: drivers } = useDriversList();
  const createShift = useCreateShift();
  const updateShift = useUpdateShift();
  const isEditing = Boolean(shift);
  const isSubmitting = createShift.isPending || updateShift.isPending;

  useEffect(() => {
    if (!open) return;
    setForm(
      shift
        ? {
            driver_id: shift.driver_id,
            bus_id: shift.bus_id,
            route_id: shift.route_id,
            shift_date: shift.shift_date?.slice(0, 10) ?? "",
            start_time: shift.start_time?.slice(0, 5) ?? "08:00",
            end_time: shift.end_time?.slice(0, 5) ?? "17:00",
            rounds: shift.rounds ?? 2,
            status: shift.status,
          }
        : EMPTY_FORM
    );
    setErrors({});
    setGeneralError("");
  }, [open, shift]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    const payload = {
      driver_id: Number(form.driver_id),
      bus_id: Number(form.bus_id),
      route_id: Number(form.route_id),
      shift_date: form.shift_date,
      start_time: form.start_time,
      end_time: form.end_time,
      rounds: Number(form.rounds),
    };
    // A new shift always starts scheduled; status is only editable after.
    if (isEditing) payload.status = form.status;

    try {
      if (isEditing) {
        await updateShift.mutateAsync({ id: shift.id, payload });
      } else {
        await createShift.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      setErrors(fieldErrors ?? {});
      setGeneralError(message ?? "");
    }
  }

  const legs = previewLegs(form);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Shift" : "Add Shift"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="driver_id">Driver</Label>
            <Select
              value={form.driver_id ? String(form.driver_id) : ""}
              onValueChange={(v) => handleChange("driver_id", Number(v))}
            >
              <SelectTrigger id="driver_id" className="w-full">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((d) => (
                  <SelectItem key={d.id} value={String(d.id)}>
                    {d.first_name} {d.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.driver_id[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bus_id">Bus</Label>
              <Select
                value={form.bus_id ? String(form.bus_id) : ""}
                onValueChange={(v) => handleChange("bus_id", Number(v))}
              >
                <SelectTrigger id="bus_id" className="w-full">
                  <SelectValue placeholder="Select a bus" />
                </SelectTrigger>
                <SelectContent>
                  {buses.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.plate_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.bus_id && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.bus_id[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="route_id">Route</Label>
              <Select
                value={form.route_id ? String(form.route_id) : ""}
                onValueChange={(v) => handleChange("route_id", Number(v))}
              >
                <SelectTrigger id="route_id" className="w-full">
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
              {errors.route_id && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.route_id[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="shift_date">Date</Label>
              <Input
                id="shift_date"
                type="date"
                value={form.shift_date}
                onChange={(e) => handleChange("shift_date", e.target.value)}
                required
              />
              {errors.shift_date && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.shift_date[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rounds">Rounds</Label>
              <Input
                id="rounds"
                type="number"
                min="1"
                max="6"
                value={form.rounds}
                onChange={(e) => handleChange("rounds", e.target.value)}
                required
              />
              {errors.rounds && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.rounds[0]}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="start_time">Starts</Label>
              <Input
                id="start_time"
                type="time"
                value={form.start_time}
                onChange={(e) => handleChange("start_time", e.target.value)}
                required
              />
              {errors.start_time && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.start_time[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="end_time">Ends</Label>
              <Input
                id="end_time"
                type="time"
                value={form.end_time}
                onChange={(e) => handleChange("end_time", e.target.value)}
                required
              />
              {errors.end_time && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.end_time[0]}</p>
              )}
            </div>
          </div>

          {isEditing && (
            <div>
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full rounded-md border px-3 py-2 text-sm"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* what this shift will actually run */}
          {legs.length > 0 && (
            <div className="rounded-lg p-3" style={{ background: "var(--surface-2)" }}>
              <p className="mb-2 text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}>
                {legs.length} legs · {form.rounds} round{Number(form.rounds) === 1 ? "" : "s"}
              </p>
              <ul className="space-y-1">
                {legs.map((leg, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span
                      className="grid h-4 w-4 shrink-0 place-items-center rounded-full text-[9px] font-bold"
                      style={{ background: "var(--surface)", color: "var(--text-muted)" }}
                    >
                      {leg.round}
                    </span>
                    <span style={{ color: "var(--text)" }}>
                      {leg.direction === "outbound" ? "→" : "←"}
                    </span>
                    <span style={{ fontFamily: "var(--font-mono)" }}>
                      {leg.from} – {leg.to}
                    </span>
                  </li>
                ))}
              </ul>
              {isEditing && (
                <p className="mt-2 text-[11px]" style={{ color: "var(--text-muted)" }}>
                  Saving updates these legs in place; anything already booked on them stays booked.
                </p>
              )}
            </div>
          )}

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
