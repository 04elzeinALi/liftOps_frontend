import { useEffect, useState } from "react";
import { useCreateRoute, useUpdateRoute } from "@/api/routes";
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
  route_name: "",
  origin: "",
  destination: "",
  distance_km: "",
  estimated_duration: "",
  fare: "",
};

export default function RouteFormDialog({ open, onOpenChange, route }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const createRoute = useCreateRoute();
  const updateRoute = useUpdateRoute();
  const isEditing = Boolean(route);
  const isSubmitting = createRoute.isPending || updateRoute.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        route
          ? {
              route_name: route.route_name,
              origin: route.origin,
              destination: route.destination,
              distance_km: route.distance_km,
              estimated_duration: route.estimated_duration,
              fare: route.fare,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, route]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      route_name: form.route_name,
      origin: form.origin,
      destination: form.destination,
      distance_km: Number(form.distance_km),
      estimated_duration: form.estimated_duration,
      fare: Number(form.fare),
    };
    try {
      if (isEditing) {
        await updateRoute.mutateAsync({ id: route.id, payload });
      } else {
        await createRoute.mutateAsync(payload);
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
          <DialogTitle>{isEditing ? "Edit Route" : "Add Route"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="route_name">Route name</Label>
            <Input
              id="route_name"
              value={form.route_name}
              onChange={(e) => handleChange("route_name", e.target.value)}
              required
            />
            {errors.route_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.route_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="origin">Origin</Label>
            <Input
              id="origin"
              value={form.origin}
              onChange={(e) => handleChange("origin", e.target.value)}
              required
            />
            {errors.origin && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.origin[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              value={form.destination}
              onChange={(e) => handleChange("destination", e.target.value)}
              required
            />
            {errors.destination && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.destination[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="distance_km">Distance (km)</Label>
            <Input
              id="distance_km"
              type="number"
              step="any"
              value={form.distance_km}
              onChange={(e) => handleChange("distance_km", e.target.value)}
              required
            />
            {errors.distance_km && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.distance_km[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="estimated_duration">Estimated duration</Label>
            <Input
              id="estimated_duration"
              placeholder="e.g. 1h 30m"
              value={form.estimated_duration}
              onChange={(e) => handleChange("estimated_duration", e.target.value)}
              required
            />
            {errors.estimated_duration && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.estimated_duration[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="fare">Fare</Label>
            <Input
              id="fare"
              type="number"
              step="any"
              value={form.fare}
              onChange={(e) => handleChange("fare", e.target.value)}
              required
            />
            {errors.fare && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.fare[0]}
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
