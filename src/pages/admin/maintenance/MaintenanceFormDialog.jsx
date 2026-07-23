import { useEffect, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateMaintenance, useUpdateMaintenance } from "@/api/maintenance";
import { useBuses } from "@/api/buses";
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

const MAINTENANCE_TYPES = [
  "oil_change",
  "tire_replacement",
  "brake_inspection",
  "engine_repair",
  "transmission_service",
  "electrical_system_check",
  "suspension_inspection",
];
const MAINTENANCE_STATUSES = ["scheduled", "in_progress", "completed"];

const EMPTY_FORM = {
  bus_id: "",
  maintenance_type: MAINTENANCE_TYPES[0],
  maintenance_status: MAINTENANCE_STATUSES[0],
  description: "",
  cost: "",
  scheduled_at: "",
  completed_at: "",
};

function labelFor(value) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function MaintenanceFormDialog({ open, onOpenChange, record }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: busesPage } = useBuses(1);
  const buses = busesPage?.data ?? [];
  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const isEditing = Boolean(record);
  const isSubmitting = createMaintenance.isPending || updateMaintenance.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        record
          ? {
              bus_id: record.bus_id,
              maintenance_type: record.maintenance_type,
              maintenance_status: record.maintenance_status,
              description: record.description ?? "",
              cost: record.cost ?? "",
              scheduled_at: record.scheduled_at?.slice(0, 10) ?? "",
              completed_at: record.completed_at?.slice(0, 16) ?? "",
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, record]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      bus_id: Number(form.bus_id),
      maintenance_type: form.maintenance_type,
      maintenance_status: form.maintenance_status,
      description: form.description || null,
      cost: form.cost ? Number(form.cost) : null,
      scheduled_at: form.scheduled_at,
      completed_at: form.completed_at || null,
    };
    try {
      if (isEditing) {
        await updateMaintenance.mutateAsync({ id: record.id, payload });
      } else {
        await createMaintenance.mutateAsync(payload);
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
          <DialogTitle>{isEditing ? "Edit Maintenance" : "Add Maintenance"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="maintenance_type">Type</Label>
            <select
              id="maintenance_type"
              value={form.maintenance_type}
              onChange={(e) => handleChange("maintenance_type", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {MAINTENANCE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {labelFor(type)}
                </option>
              ))}
            </select>
            {errors.maintenance_type && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.maintenance_type[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="maintenance_status">Status</Label>
            <select
              id="maintenance_status"
              value={form.maintenance_status}
              onChange={(e) => handleChange("maintenance_status", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {MAINTENANCE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {labelFor(status)}
                </option>
              ))}
            </select>
            {errors.maintenance_status && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.maintenance_status[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
            />
            {errors.description && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.description[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="cost">Cost</Label>
            <Input
              id="cost"
              type="number"
              step="any"
              value={form.cost}
              onChange={(e) => handleChange("cost", e.target.value)}
            />
            {errors.cost && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.cost[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="scheduled_at">Scheduled date</Label>
            <Input
              id="scheduled_at"
              type="date"
              value={form.scheduled_at}
              onChange={(e) => handleChange("scheduled_at", e.target.value)}
              required
            />
            {errors.scheduled_at && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.scheduled_at[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="completed_at">Completed at</Label>
            <Input
              id="completed_at"
              type="datetime-local"
              value={form.completed_at}
              onChange={(e) => handleChange("completed_at", e.target.value)}
            />
            {errors.completed_at && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.completed_at[0]}
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
