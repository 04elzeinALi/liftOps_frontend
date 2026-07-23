import { getApiErrorMessage } from "@/api/errors";
import StatusPill from "@/components/StatusPill";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMarkBoarded, useTripDetail, useTripManifest, useUpdateTripStatus } from "@/api/driverTrips";

const STATUS_STYLE = {
  scheduled: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Scheduled" },
  ongoing: { bg: "var(--success-bg)", fg: "var(--success)", label: "Ongoing" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
};

const NEXT_STATUS = {
  scheduled: { label: "Start Trip", status: "ongoing" },
  ongoing: { label: "End Trip", status: "completed" },
};

export default function TripManifestPage() {
  const { id } = useParams();
  const { data: trip, isLoading: tripLoading, isError: tripError } = useTripDetail(id);
  const { data: manifest, isLoading: manifestLoading, isError: manifestError } = useTripManifest(id);
  const updateStatus = useUpdateTripStatus();
  const markBoarded = useMarkBoarded();
  const [statusError, setStatusError] = useState("");
  const [boardingErrors, setBoardingErrors] = useState({});

  async function handleStatusChange(nextStatus) {
    setStatusError("");
    try {
      await updateStatus.mutateAsync({ id, status: nextStatus });
    } catch (err) {
      setStatusError(getApiErrorMessage(err, "Failed to update trip status. Please try again."));
    }
  }

  async function handleMarkBoarded(reservation) {
    setBoardingErrors((prev) => ({ ...prev, [reservation.id]: "" }));
    try {
      await markBoarded.mutateAsync(reservation);
    } catch (err) {
      setBoardingErrors((prev) => ({
        ...prev,
        [reservation.id]: getApiErrorMessage(err, "Failed to mark this passenger as boarded."),
      }));
    }
  }

  if (tripLoading) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </p>
    );
  }

  if (tripError || !trip) {
    return (
      <p className="text-sm" style={{ color: "var(--critical)" }}>
        Failed to load this trip.
      </p>
    );
  }

  const status = STATUS_STYLE[trip.status];
  const nextAction = NEXT_STATUS[trip.status];
  const boardings = manifest?.boardings ?? [];
  const reservations = manifest?.reservations ?? [];
  const bookedReservations = reservations.filter((r) => r.status === "booked");

  return (
    <div>
      <Link to="/driver/trips" className="mb-4 inline-block text-sm font-semibold" style={{ color: "var(--accent)" }}>
        ← Back to today's trips
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            {trip.schedule?.route?.route_name}
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {trip.schedule?.departure_time?.slice(0, 5)}–{trip.schedule?.arrival_time?.slice(0, 5)} · Bus {trip.bus?.plate_number}
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            {boardings.length} / {trip.bus?.capacity} boarded
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
          {nextAction && (
            <button
              onClick={() => handleStatusChange(nextAction.status)}
              disabled={updateStatus.isPending}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
            >
              {updateStatus.isPending ? "Saving…" : nextAction.label}
            </button>
          )}
        </div>
      </div>

      {statusError && (
        <p className="mb-4 text-sm" style={{ color: "var(--critical)" }}>
          {statusError}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {manifestLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading manifest…
          </p>
        )}
        {manifestError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load the manifest.
          </p>
        )}
        {manifest && bookedReservations.length === 0 && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No booked passengers on this trip.
          </p>
        )}
        {manifest && bookedReservations.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Passenger", "Seat", "Pickup", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11.5px] font-bold uppercase"
                    style={{ color: "var(--text-muted)", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {bookedReservations.map((reservation) => {
                const isBoarded = boardings.some((b) => b.reservation_id === reservation.id);
                return (
                  <tr key={reservation.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {reservation.passenger?.first_name} {reservation.passenger?.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {reservation.seat_number}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {reservation.pickup_location ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {isBoarded ? (
                        <span
                          className="rounded-full px-2.5 py-1 text-xs font-semibold"
                          style={{ background: "var(--success-bg)", color: "var(--success)" }}
                        >
                          Boarded
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => handleMarkBoarded(reservation)}
                            disabled={markBoarded.isPending}
                            className="font-semibold"
                            style={{ color: "var(--accent)" }}
                          >
                            Mark Boarded
                          </button>
                          {boardingErrors[reservation.id] && (
                            <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                              {boardingErrors[reservation.id]}
                            </p>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
