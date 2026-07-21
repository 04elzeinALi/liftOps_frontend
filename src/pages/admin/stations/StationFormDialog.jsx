import { useEffect, useState } from "react";
import { useCreateStation, useUpdateStation } from "@/api/stations";
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
  station_name: "",
  latitude: "",
  longitude: "",
};

export default function StationFormDialog({ open, onOpenChange, station }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const createStation = useCreateStation();
  const updateStation = useUpdateStation();
  const isEditing = Boolean(station);
  const isSubmitting = createStation.isPending || updateStation.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        station
          ? {
              station_name: station.station_name,
              latitude: station.latitude,
              longitude: station.longitude,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, station]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      station_name: form.station_name,
      latitude: Number(form.latitude),
      longitude: Number(form.longitude),
    };
    try {
      if (isEditing) {
        await updateStation.mutateAsync({ id: station.id, payload });
      } else {
        await createStation.mutateAsync(payload);
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
          <DialogTitle>{isEditing ? "Edit Station" : "Add Station"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="station_name">Station name</Label>
            <Input
              id="station_name"
              value={form.station_name}
              onChange={(e) => handleChange("station_name", e.target.value)}
              required
            />
            {errors.station_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.station_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="any"
              value={form.latitude}
              onChange={(e) => handleChange("latitude", e.target.value)}
              required
            />
            {errors.latitude && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.latitude[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="any"
              value={form.longitude}
              onChange={(e) => handleChange("longitude", e.target.value)}
              required
            />
            {errors.longitude && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.longitude[0]}
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
