import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import LeafletMap from "@/components/LeafletMap";
import { getApiErrorMessage } from "@/api/errors";
import { useMyShifts, useMyTripsOn, useUpdateShiftStatus } from "@/api/driverShifts";
import { useRoute } from "@/api/routes";
import { addDaysLocal, localToday } from "@/lib/dates";
import { tripLegLabel, tripTimes } from "@/lib/trip";

const STATUS_STYLE = {
  scheduled: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Scheduled" },
  ongoing: { bg: "var(--success-bg)", fg: "var(--success)", label: "Ongoing" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
  emergency: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Emergency" },
};

// What a driver does next to their shift, given where it is.
const NEXT_SHIFT_STATUS = {
  scheduled: { label: "Start shift", status: "ongoing" },
  ongoing: { label: "Finish shift", status: "completed" },
};

function ShiftCard({ shift, onStatus, busy, error }) {
  const status = resolveStatus(STATUS_STYLE, shift.status);
  const next = NEXT_SHIFT_STATUS[shift.status];

  return (
    <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-extrabold" style={{ color: "var(--text)" }}>
            {shift.route?.route_name ?? "Your shift"}
          </h2>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {shift.start_time?.slice(0, 5)}–{shift.end_time?.slice(0, 5)} · {shift.rounds} round
            {shift.rounds === 1 ? "" : "s"} · Bus {shift.bus?.plate_number}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
          {next && (
            <button
              type="button"
              onClick={() => onStatus(next.status)}
              disabled={busy}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {busy ? "Saving…" : next.label}
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-3 text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default function DriverTripsPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(localToday);
  const { data: shifts, isLoading: shiftsLoading } = useMyShifts(date);
  const { data: trips, isLoading: tripsLoading, isError } = useMyTripsOn(date);
  const updateShiftStatus = useUpdateShiftStatus();
  const [statusError, setStatusError] = useState("");

  const shift = shifts?.[0];
  // The whole line the driver is running, so they can see the road ahead.
  const { data: routeDetail } = useRoute(shift?.route_id);
  const stops = (routeDetail?.route_stations ?? []).map((rs) => ({
    lat: rs.station?.latitude,
    lng: rs.station?.longitude,
    label: rs.station?.station_name,
    kind: "stop",
  }));

  async function handleShiftStatus(status) {
    setStatusError("");
    try {
      await updateShiftStatus.mutateAsync({ id: shift.id, status });
    } catch (err) {
      setStatusError(getApiErrorMessage(err, "Couldn't update your shift. Please try again."));
    }
  }

  function stepDay(delta) {
    setDate(addDaysLocal(date, delta));
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          My Shifts
        </h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => stepDay(-1)}
            aria-label="Previous day"
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
          <button
            type="button"
            onClick={() => stepDay(1)}
            aria-label="Next day"
            className="grid h-9 w-9 place-items-center rounded-lg"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
          </button>
          {date !== localToday() && (
            <button
              type="button"
              onClick={() => setDate(localToday())}
              className="text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              Today
            </button>
          )}
        </div>
      </div>

      {(shiftsLoading || tripsLoading) && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>Failed to load your day.</p>
      )}

      {!shiftsLoading && !shift && (
        <div className="rounded-xl p-6 text-center" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
            No shift on this day
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            Pick another day, or check with an admin if you were expecting one.
          </p>
        </div>
      )}

      {shift && (
        <div className="flex flex-col gap-5">
          <ShiftCard
            shift={shift}
            onStatus={handleShiftStatus}
            busy={updateShiftStatus.isPending}
            error={statusError}
          />

          {stops.length >= 2 && (
            <section>
              <h3 className="mb-2 text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
                The route you're driving
              </h3>
              <LeafletMap points={stops} connect height={260} />
            </section>
          )}

          <section>
            <h3 className="mb-2 text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
              Legs
            </h3>
            <div className="overflow-hidden rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              {(trips ?? []).length === 0 && (
                <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>
                  This shift has no legs yet.
                </p>
              )}
              {(trips ?? []).map((trip, i) => {
                const status = resolveStatus(STATUS_STYLE, trip.status);
                const times = tripTimes(trip);
                return (
                  <button
                    key={trip.id}
                    type="button"
                    onClick={() => navigate(`/driver/trips/${trip.id}`)}
                    className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
                    style={{ borderTop: i === 0 ? "none" : "1px solid var(--border)", background: "transparent" }}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
                          {times.departure}
                        </span>
                        <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                          → {times.arrival}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {tripLegLabel(trip) || "Leg"}
                        {" · "}
                        {trip.boardings_count ?? 0} boarded
                        {trip.available_seats != null && ` · ${trip.available_seats} seats free`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--text-muted)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
