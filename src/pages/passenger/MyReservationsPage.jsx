import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import { formatDate } from "@/lib/dates";
import StatusPill from "@/components/StatusPill";
import { useCancelReservation, useMyReservations } from "@/api/passengerReservations";
import { tripRoute, tripTimes } from "@/lib/trip";

const STATUS_STYLE = {
  booked: { bg: "var(--success-bg)", fg: "var(--success)", label: "Booked" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
  completed: { bg: "var(--surface-2)", fg: "var(--text-muted)", label: "Completed" },
};

export default function MyReservationsPage() {
  const { data: reservations, isLoading, isError } = useMyReservations();
  const cancelReservation = useCancelReservation();
  const [cancellingId, setCancellingId] = useState(null);
  const [error, setError] = useState("");

  async function handleCancel(reservation) {
    setError("");
    setCancellingId(reservation.id);
    try {
      await cancelReservation.mutateAsync(reservation.id);
    } catch {
      setError("Failed to cancel this reservation. Please try again.");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[452px]">
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
         Trips
      </h1>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          Failed to load your trips.
        </p>
      )}
      {reservations && reservations.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You don't have any trips yet.
        </p>
      )}
      {error && (
        <p className="mb-3 text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {reservations?.map((reservation) => {
          const status = resolveStatus(STATUS_STYLE, reservation.status);
          const route = tripRoute(reservation.trip);
          const label = route ? `${route.origin} → ${route.destination}` : route?.route_name;
          return (
            <div
              key={reservation.id}
              className="rounded-xl p-4"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
            >
              <div className="flex items-start justify-between gap-3">
                <span className="font-display text-lg font-bold leading-tight" style={{ color: "var(--text)" }}>
                  {label}
                </span>
                <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                <span>{formatDate(reservation.trip?.trip_date)}</span>
                <span>·</span>
                <span>{tripTimes(reservation.trip).departure}</span>
                {reservation.pickup_location && (
                  <>
                    <span>·</span>
                    <span>{reservation.pickup_location}</span>
                  </>
                )}
              </div>
              {reservation.status === "booked" && (
                <button
                  onClick={() => handleCancel(reservation)}
                  disabled={cancellingId === reservation.id}
                  className="mt-3 text-sm font-semibold"
                  style={{ color: "var(--critical)" }}
                >
                  {cancellingId === reservation.id ? "Cancelling…" : "Cancel trip"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
