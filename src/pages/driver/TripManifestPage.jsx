import { getApiErrorMessage } from "@/api/errors";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useMarkBoarded, useTripDetail, useTripManifest, useUpdateTripStatus } from "@/api/driverTrips";
import { tripRouteName, tripTimes } from "@/lib/trip";
import { boardingSegmentLabel, cardSegmentLabel } from "@/lib/cardLabel";
import WalkUpBoardingDialog from "./WalkUpBoardingDialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

const STATUS_STYLE = {
  scheduled: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Scheduled" },
  ongoing: { bg: "var(--success-bg)", fg: "var(--success)", label: "Ongoing" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
  emergency: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Emergency" },
};

const NEXT_STATUS = {
  scheduled: { label: "Start Trip", status: "ongoing" },
  ongoing: { label: "End Trip", status: "completed" },
};

// A driver can flag an emergency any time their trip is still actively
// running — not once it's already completed/cancelled, and not twice.
const CAN_FLAG_EMERGENCY = ["scheduled", "ongoing"];

function formatTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

export default function TripManifestPage() {
  const { id } = useParams();
  const { data: trip, isLoading: tripLoading, isError: tripError } = useTripDetail(id);
  const { data: manifest, isLoading: manifestLoading, isError: manifestError } = useTripManifest(id);
  const updateStatus = useUpdateTripStatus();
  const markBoarded = useMarkBoarded();
  const [statusError, setStatusError] = useState("");
  const [boardingErrors, setBoardingErrors] = useState({});
  const [confirmingEmergency, setConfirmingEmergency] = useState(false);
  const [walkUpOpen, setWalkUpOpen] = useState(false);

  async function handleStatusChange(nextStatus) {
    setStatusError("");
    try {
      await updateStatus.mutateAsync({ id, status: nextStatus });
    } catch (err) {
      setStatusError(getApiErrorMessage(err, "Failed to update trip status. Please try again."));
    }
  }

  async function confirmFlagEmergency(event) {
    // AlertDialogAction auto-closes on click (see the note on delete
    // confirms elsewhere) unless we preventDefault() before the first await.
    event.preventDefault();
    setStatusError("");
    try {
      await updateStatus.mutateAsync({ id, status: "emergency" });
      setConfirmingEmergency(false);
    } catch (err) {
      setStatusError(getApiErrorMessage(err, "Failed to flag this trip. Please try again."));
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

  const status = resolveStatus(STATUS_STYLE, trip.status);
  const nextAction = NEXT_STATUS[trip.status];
  const boardings = manifest?.boardings ?? [];
  const reservations = manifest?.reservations ?? [];
  // Boarding a reservation marks it completed, so anything still "booked" is
  // someone the driver is waiting on.
  const waitingReservations = reservations.filter((r) => r.status === "booked");

  return (
    <div>
      <Link to="/driver/trips" className="mb-4 inline-block text-sm font-semibold" style={{ color: "var(--accent)" }}>
        ← Back to today's trips
      </Link>

      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            {tripRouteName(trip)}
          </h1>
          <p className="mt-1 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
            {tripTimes(trip).departure}–{tripTimes(trip).arrival} · Bus {trip.bus?.plate_number}
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
          {CAN_FLAG_EMERGENCY.includes(trip.status) && (
            <button
              onClick={() => setConfirmingEmergency(true)}
              disabled={updateStatus.isPending}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{ background: "var(--critical-bg)", color: "var(--critical)", border: "1px solid var(--critical)" }}
            >
              Flag Emergency
            </button>
          )}
        </div>
      </div>

      {trip.status === "emergency" && (
        <p
          className="mb-4 rounded-lg px-4 py-3 text-sm font-semibold"
          style={{ background: "var(--critical-bg)", color: "var(--critical)" }}
        >
          This trip is flagged as an emergency — admins will see this the next time they check Trips. For anything urgent, contact them directly.
        </p>
      )}

      {statusError && (
        <p className="mb-4 text-sm" style={{ color: "var(--critical)" }}>
          {statusError}
        </p>
      )}

      <AlertDialog open={confirmingEmergency} onOpenChange={setConfirmingEmergency}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Flag this trip as an emergency?</AlertDialogTitle>
            <AlertDialogDescription>
              This immediately marks the trip as an emergency for the admin to see. Only use this for an actual emergency.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFlagEmergency}>Flag Emergency</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* who is actually on the bus, in the order they got on */}
      <section className="mb-6">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
            On board · {boardings.length}
          </h2>
          <button
            type="button"
            onClick={() => setWalkUpOpen(true)}
            className="rounded-lg px-3 py-1.5 text-sm font-semibold"
            style={{ background: "var(--accent)", color: "var(--accent-ink)" }}
          >
            Board a walk-up
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {manifestLoading && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>Loading manifest…</p>
          )}
          {manifestError && (
            <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>Failed to load the manifest.</p>
          )}
          {manifest && boardings.length === 0 && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Nobody has boarded this leg yet.
            </p>
          )}
          {boardings.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Boarded", "Passenger", "Phone", "Pickup", "Travelling", "Status"].map((h) => (
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
                {boardings.map((boarding) => {
                  const walkUp = !boarding.reservation_id;
                  return (
                    <tr key={boarding.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {formatTime(boarding.boarded_at)}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                        {boarding.passenger?.first_name} {boarding.passenger?.last_name}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                        {boarding.passenger?.phone_number ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                        {boarding.reservation?.pickup_location ?? boarding.from_station?.station_name ?? "—"}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                        {boardingSegmentLabel(boarding)}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <StatusPill
                          bg={walkUp ? "var(--warning-bg)" : "var(--success-bg)"}
                          fg={walkUp ? "var(--warning)" : "var(--success)"}
                          label={walkUp ? "Walk-up" : "Reserved"}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* booked but not yet on the bus */}
      <section>
        <h2 className="mb-2 text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
          Expected · {waitingReservations.length}
        </h2>
        <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          {manifest && waitingReservations.length === 0 && (
            <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
              Everyone who booked this leg is on board.
            </p>
          )}
          {waitingReservations.length > 0 && (
            <table className="w-full border-collapse">
              <thead>
                <tr style={{ background: "var(--surface-2)" }}>
                  {["Passenger", "Phone", "Pickup", "Travelling", ""].map((h) => (
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
                {waitingReservations.map((reservation) => (
                  <tr key={reservation.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {reservation.passenger?.first_name} {reservation.passenger?.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {reservation.passenger?.phone_number ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {reservation.pickup_location ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {cardSegmentLabel(reservation.travel_card)}
                    </td>
                    <td className="px-5 py-3 text-sm">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <WalkUpBoardingDialog open={walkUpOpen} onOpenChange={setWalkUpOpen} trip={trip} />
    </div>
  );
}
