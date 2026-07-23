import { useEffect, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateTrip, useUpdateTrip } from "@/api/trips";
import { useSchedules } from "@/api/schedules";
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

const STATUSES = ["scheduled", "ongoing", "completed", "cancelled"];

const EMPTY_FORM = {
  schedule_id: "",
  bus_id: "",
  driver_id: "",
  trip_date: "",
  actual_departure: "",
  actual_arrival: "",
  status: STATUSES[0],
};

export default function TripFormDialog({ open, onOpenChange, trip }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: schedulesPage } = useSchedules(1);
  const schedules = schedulesPage?.data ?? [];
  const { data: busesPage } = useBuses(1);
  const buses = busesPage?.data ?? [];
  const { data: drivers } = useDriversList();
  const createTrip = useCreateTrip();
  const updateTrip = useUpdateTrip();
  const isEditing = Boolean(trip);
  const isSubmitting = createTrip.isPending || updateTrip.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        trip
          ? {
              schedule_id: trip.schedule_id,
              bus_id: trip.bus_id,
              driver_id: trip.driver_id,
              trip_date: trip.trip_date,
              actual_departure: trip.actual_departure?.slice(0, 16) ?? "",
              actual_arrival: trip.actual_arrival?.slice(0, 16) ?? "",
              status: trip.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, trip]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      schedule_id: Number(form.schedule_id),
      bus_id: Number(form.bus_id),
      driver_id: Number(form.driver_id),
      trip_date: form.trip_date,
      actual_departure: form.actual_departure || null,
      actual_arrival: form.actual_arrival || null,
      status: form.status,
    };
    try {
      if (isEditing) {
        await updateTrip.mutateAsync({ id: trip.id, payload });
      } else {
        await createTrip.mutateAsync(payload);
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
          <DialogTitle>{isEditing ? "Edit Trip" : "Add Trip"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="schedule_id">Schedule</Label>
            <Select
              value={form.schedule_id ? String(form.schedule_id) : ""}
              onValueChange={(value) => handleChange("schedule_id", Number(value))}
            >
              <SelectTrigger id="schedule_id" className="w-full">
                <SelectValue placeholder="Select a schedule" />
              </SelectTrigger>
              <SelectContent>
                {schedules.map((schedule) => (
                  <SelectItem key={schedule.id} value={String(schedule.id)}>
                    {schedule.route?.route_name} — {schedule.departure_time?.slice(0, 5)}–{schedule.arrival_time?.slice(0, 5)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.schedule_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.schedule_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="bus_id">Bus</Label>
            <Select
              value={form.bus_id ? String(form.bus_id) : ""}
              onValueChange={(value) => handleChange("bus_id", Number(value))}
            >
              <SelectTrigger id="bus_id" className="w-full">
                <SelectValue placeholder="Select a bus" />
              </SelectTrigger>
              <SelectContent>
                {buses.map((bus) => (
                  <SelectItem key={bus.id} value={String(bus.id)}>
                    {bus.plate_number} — {bus.manufacturer} {bus.model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.bus_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.bus_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="driver_id">Driver</Label>
            <Select
              value={form.driver_id ? String(form.driver_id) : ""}
              onValueChange={(value) => handleChange("driver_id", Number(value))}
            >
              <SelectTrigger id="driver_id" className="w-full">
                <SelectValue placeholder="Select a driver" />
              </SelectTrigger>
              <SelectContent>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={String(driver.id)}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.driver_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.driver_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="trip_date">Trip date</Label>
            <Input
              id="trip_date"
              type="date"
              value={form.trip_date}
              onChange={(e) => handleChange("trip_date", e.target.value)}
              required
            />
            {errors.trip_date && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.trip_date[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="actual_departure">Actual departure</Label>
            <Input
              id="actual_departure"
              type="datetime-local"
              value={form.actual_departure}
              onChange={(e) => handleChange("actual_departure", e.target.value)}
            />
            {errors.actual_departure && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.actual_departure[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="actual_arrival">Actual arrival</Label>
            <Input
              id="actual_arrival"
              type="datetime-local"
              value={form.actual_arrival}
              onChange={(e) => handleChange("actual_arrival", e.target.value)}
            />
            {errors.actual_arrival && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.actual_arrival[0]}
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
