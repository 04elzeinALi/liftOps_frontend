import { useEffect, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateRouteStation } from "@/api/routeStations";
import { useRoutes } from "@/api/routes";
import { useStations } from "@/api/stations";
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
  station_id: "",
  station_order: "",
};

export default function RouteStationFormDialog({ open, onOpenChange }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: routes } = useRoutes();
  const { data: stationsPage } = useStations(1);
  const stations = stationsPage?.data ?? [];
  const createRouteStation = useCreateRouteStation();
  const isSubmitting = createRouteStation.isPending;

  useEffect(() => {
    if (open) {
      setForm(EMPTY_FORM);
      setErrors({});
      setGeneralError("");
    }
  }, [open]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      route_id: Number(form.route_id),
      station_id: Number(form.station_id),
      station_order: Number(form.station_order),
    };
    try {
      await createRouteStation.mutateAsync(payload);
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
          <DialogTitle>Add Route Station</DialogTitle>
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
            <Label htmlFor="station_id">Station</Label>
            <Select
              value={form.station_id ? String(form.station_id) : ""}
              onValueChange={(value) => handleChange("station_id", Number(value))}
            >
              <SelectTrigger id="station_id" className="w-full">
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {stations.map((station) => (
                  <SelectItem key={station.id} value={String(station.id)}>
                    {station.station_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.station_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.station_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="station_order">Station order</Label>
            <Input
              id="station_order"
              type="number"
              value={form.station_order}
              onChange={(e) => handleChange("station_order", e.target.value)}
              required
            />
            {errors.station_order && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.station_order[0]}
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
