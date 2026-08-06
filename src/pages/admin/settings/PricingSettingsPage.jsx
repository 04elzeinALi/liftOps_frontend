import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { parseApiError } from "@/api/errors";
import { usePricingSettings, useUpdatePricingSettings } from "@/api/pricingSettings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// The network-wide DEFAULT. Any route that hasn't been given its own bands
// prices off these (see Route::fareForKm(), which resolves route bands →
// these settings). Per-route pricing lives on the route form itself.
export default function PricingSettingsPage() {
  const { data: settings, isLoading, isError } = usePricingSettings();
  const updateSettings = useUpdatePricingSettings();

  const [form, setForm] = useState({ long_trip_km: "", short_trip_fare: "", long_trip_fare: "" });
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setForm({
      long_trip_km: settings.long_trip_km,
      short_trip_fare: settings.short_trip_fare,
      long_trip_fare: settings.long_trip_fare,
    });
  }, [settings]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
    setSaved(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    setSaved(false);
    try {
      await updateSettings.mutateAsync({
        long_trip_km: Number(form.long_trip_km),
        short_trip_fare: Number(form.short_trip_fare),
        long_trip_fare: Number(form.long_trip_fare),
      });
      setSaved(true);
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      setErrors(fieldErrors ?? {});
      setGeneralError(message ?? "Failed to save pricing settings. Please try again.");
    }
  }

  const km = Number(form.long_trip_km);
  const previewReady = Number.isFinite(km) && form.short_trip_fare !== "" && form.long_trip_fare !== "";

  return (
    <div className="max-w-lg">
      <h1 className="font-display mb-1 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        Default Pricing
      </h1>
      <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
        Rides are priced automatically by how far they run. These bands apply to every route that
        hasn't been given its own — set a route's own pricing on that route in{" "}
        <Link to="/admin/routes" className="font-semibold" style={{ color: "var(--accent-strong)" }}>
          Routes
        </Link>
        .
      </p>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>Failed to load pricing settings.</p>
      )}

      {settings && (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl p-6"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <div>
            <Label htmlFor="long_trip_km">Distance threshold (km)</Label>
            <Input
              id="long_trip_km"
              type="number"
              step="any"
              min="0.1"
              value={form.long_trip_km}
              onChange={(e) => handleChange("long_trip_km", e.target.value)}
              required
            />
            <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
              A ride shorter than this pays the short-trip fare; at or beyond it, the long-trip fare.
            </p>
            {errors.long_trip_km && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.long_trip_km[0]}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="short_trip_fare">Short-trip fare</Label>
              <Input
                id="short_trip_fare"
                type="number"
                step="any"
                min="0"
                value={form.short_trip_fare}
                onChange={(e) => handleChange("short_trip_fare", e.target.value)}
                required
              />
              {errors.short_trip_fare && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.short_trip_fare[0]}</p>
              )}
            </div>
            <div>
              <Label htmlFor="long_trip_fare">Long-trip fare</Label>
              <Input
                id="long_trip_fare"
                type="number"
                step="any"
                min="0"
                value={form.long_trip_fare}
                onChange={(e) => handleChange("long_trip_fare", e.target.value)}
                required
              />
              {errors.long_trip_fare && (
                <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>{errors.long_trip_fare[0]}</p>
              )}
            </div>
          </div>

          {previewReady && (
            <div
              className="rounded-lg p-3 text-xs"
              style={{ background: "var(--surface-2)", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}
            >
              0–{km}km → ${Number(form.short_trip_fare).toFixed(2)} · {km}km+ → ${Number(form.long_trip_fare).toFixed(2)}
            </div>
          )}

          {generalError && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>{generalError}</p>
          )}
          {saved && !generalError && (
            <p className="text-sm font-semibold" style={{ color: "var(--success)" }}>Saved.</p>
          )}

          <Button type="submit" disabled={updateSettings.isPending}>
            {updateSettings.isPending ? "Saving…" : "Save pricing"}
          </Button>
        </form>
      )}
    </div>
  );
}
