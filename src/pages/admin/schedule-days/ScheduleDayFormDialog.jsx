import { useEffect, useState } from "react";
import { useCreateScheduleDay, useUpdateScheduleDay } from "@/api/scheduleDays";
import { useSchedules } from "@/api/schedules";
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

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

const EMPTY_FORM = {
  schedule_id: "",
  day_of_week: "monday",
};

export default function ScheduleDayFormDialog({ open, onOpenChange, scheduleDay }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: schedulesPage } = useSchedules(1);
  const schedules = schedulesPage?.data ?? [];
  const createScheduleDay = useCreateScheduleDay();
  const updateScheduleDay = useUpdateScheduleDay();
  const isEditing = Boolean(scheduleDay);
  const isSubmitting = createScheduleDay.isPending || updateScheduleDay.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        scheduleDay
          ? {
              schedule_id: scheduleDay.schedule_id,
              day_of_week: scheduleDay.day_of_week,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, scheduleDay]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      schedule_id: Number(form.schedule_id),
      day_of_week: form.day_of_week,
    };
    try {
      if (isEditing) {
        await updateScheduleDay.mutateAsync({ id: scheduleDay.id, payload });
      } else {
        await createScheduleDay.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Schedule Day" : "Add Schedule Day"}</DialogTitle>
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
            <Label htmlFor="day_of_week">Day of week</Label>
            <select
              id="day_of_week"
              value={form.day_of_week}
              onChange={(e) => handleChange("day_of_week", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {DAYS.map((day) => (
                <option key={day} value={day}>
                  {day.charAt(0).toUpperCase() + day.slice(1)}
                </option>
              ))}
            </select>
            {errors.day_of_week && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.day_of_week[0]}
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
