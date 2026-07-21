import { useEffect, useState } from "react";
import { useCreateSchedule, useUpdateSchedule } from "@/api/schedules";
import { useRoutes } from "@/api/routes";
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

const EMPTY_FORM = {
  route_id: "",
  departure_time: "",
  arrival_time: "",
};

export default function ScheduleFormDialog({ open, onOpenChange, schedule }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: routes } = useRoutes();
  const createSchedule = useCreateSchedule();
  const updateSchedule = useUpdateSchedule();
  const isEditing = Boolean(schedule);
  const isSubmitting = createSchedule.isPending || updateSchedule.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        schedule
          ? {
              route_id: schedule.route_id,
              departure_time: schedule.departure_time?.slice(0, 5) ?? "",
              arrival_time: schedule.arrival_time?.slice(0, 5) ?? "",
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, schedule]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      route_id: Number(form.route_id),
      departure_time: form.departure_time,
      arrival_time: form.arrival_time,
    };
    try {
      if (isEditing) {
        await updateSchedule.mutateAsync({ id: schedule.id, payload });
      } else {
        await createSchedule.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message);
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Schedule" : "Add Schedule"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <div>
            <Label htmlFor="departure_time">Departure time</Label>
            <Input
              id="departure_time"
              type="time"
              value={form.departure_time}
              onChange={(e) => handleChange("departure_time", e.target.value)}
              required
            />
            {errors.departure_time && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.departure_time[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="arrival_time">Arrival time</Label>
            <Input
              id="arrival_time"
              type="time"
              value={form.arrival_time}
              onChange={(e) => handleChange("arrival_time", e.target.value)}
              required
            />
            {errors.arrival_time && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.arrival_time[0]}
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
