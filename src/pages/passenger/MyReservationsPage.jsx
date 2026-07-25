import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useCancelReservation, useMyReservations } from "@/api/passengerReservations";

const STATUS_STYLE = {
  booked: { bg: "var(--success-bg)", fg: "var(--success)", label: "Booked" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
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
    <div>
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        My Reservations
      </h1>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          Failed to load your reservations.
        </p>
      )}
      {reservations && reservations.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You don't have any reservations yet.
        </p>
      )}
      {error && (
        <p className="mb-3 text-sm" style={{ color: "var(--critical)" }}>
          {error}
        </p>
      )}

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {reservations && reservations.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Route", "Trip Date", "Seat", "Status", ""].map((h) => (
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
              {reservations.map((reservation) => {
                const status = resolveStatus(STATUS_STYLE, reservation.status);
                return (
                  <tr key={reservation.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {reservation.trip?.schedule?.route?.route_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {reservation.trip?.trip_date}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {reservation.seat_number}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      {reservation.status === "booked" && (
                        <button
                          onClick={() => handleCancel(reservation)}
                          disabled={cancellingId === reservation.id}
                          className="font-semibold"
                          style={{ color: "var(--critical)" }}
                        >
                          {cancellingId === reservation.id ? "Cancelling…" : "Cancel"}
                        </button>
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
