import { useEffect, useState } from "react";
import { useCreateBus, useUpdateBus } from "@/api/buses";
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
  plate_number: "",
  manufacturer: "",
  model: "",
  production_year: "",
  capacity: "",
  status: "in_service",
};

export default function BusFormDialog({ open, onOpenChange, bus }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const createBus = useCreateBus();
  const updateBus = useUpdateBus();
  const isEditing = Boolean(bus);
  const isSubmitting = createBus.isPending || updateBus.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        bus
          ? {
              plate_number: bus.plate_number,
              manufacturer: bus.manufacturer,
              model: bus.model,
              production_year: bus.production_year,
              capacity: bus.capacity,
              status: bus.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
    }
  }, [open, bus]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    const payload = {
      ...form,
      production_year: Number(form.production_year),
      capacity: Number(form.capacity),
    };
    try {
      if (isEditing) {
        await updateBus.mutateAsync({ id: bus.id, payload });
      } else {
        await createBus.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err.response?.status === 422) {
        setErrors(err.response.data.errors ?? {});
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Bus" : "Add Bus"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="plate_number">Plate number</Label>
            <Input
              id="plate_number"
              value={form.plate_number}
              onChange={(e) => handleChange("plate_number", e.target.value)}
              required
            />
            {errors.plate_number && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.plate_number[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="manufacturer">Manufacturer</Label>
            <Input
              id="manufacturer"
              value={form.manufacturer}
              onChange={(e) => handleChange("manufacturer", e.target.value)}
              required
            />
            {errors.manufacturer && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.manufacturer[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              value={form.model}
              onChange={(e) => handleChange("model", e.target.value)}
              required
            />
            {errors.model && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.model[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="production_year">Production year</Label>
            <Input
              id="production_year"
              type="number"
              value={form.production_year}
              onChange={(e) => handleChange("production_year", e.target.value)}
              required
            />
            {errors.production_year && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.production_year[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              value={form.capacity}
              onChange={(e) => handleChange("capacity", e.target.value)}
              required
            />
            {errors.capacity && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.capacity[0]}
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
              <option value="in_service">In service</option>
              <option value="maintenance">Maintenance</option>
              <option value="out_of_service">Out of service</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.status[0]}
              </p>
            )}
          </div>
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
