import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import { formatDate } from "@/lib/dates";
import { tripSegmentLabel, tripRoundLabel, tripRouteName } from "@/lib/trip";
import StatusPill from "@/components/StatusPill";
import { useDeleteTrip, useTrips } from "@/api/trips";
import Pagination from "@/components/Pagination";
import TripFormDialog from "./TripFormDialog";
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

// Buckets consecutive trips by the shift they belong to. The backend already
// orders them so a shift's segments arrive together (see TripController), so
// this only has to notice where one shift ends and the next begins — no
// sorting or regrouping, which keeps the page's order identical to the
// server's.
//
// Trips from before shifts existed have no shift_id; they collapse into one
// shared section rather than a header apiece, since a header per orphan trip
// is just noise. They still carry their own route, so each row names its own
// segment.
function groupByShift(trips) {
  const groups = [];
  for (const trip of trips) {
    const last = groups[groups.length - 1];
    if (last && last.shiftId === trip.shift_id) {
      last.trips.push(trip);
    } else {
      groups.push({ shiftId: trip.shift_id, shift: trip.shift, trips: [trip] });
    }
  }
  return groups;
}

export default function TripsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTrips(page);
  const deleteTrip = useDeleteTrip();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openEdit(trip) {
    setEditingTrip(trip);
    setFormOpen(true);
  }

  async function confirmDelete(event) {
    // AlertDialogAction is Radix's DialogPrimitive.Close under the hood, so it
    // auto-closes on click unless we preventDefault() before the first await —
    // without this, the dialog closes immediately regardless of whether the
    // delete succeeds, and the error message below can never be seen.
    event.preventDefault();
    setDeleteError("");
    try {
      await deleteTrip.mutateAsync(deletingTrip.id);
      setDeletingTrip(null);
    } catch {
      setDeleteError("Failed to delete this trip. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Trips
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          Each trip is one segment of a shift. Add a shift to create segments; edit one here to adjust it on its own.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load trips.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Segment", "Bus", "Driver", "Trip Date", "Status", ""].map((h) => (
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
            {groupByShift(data.data).map((group) => (
              <tbody key={group.shiftId ?? `unshifted-${group.trips[0].id}`}>
                {/* One header per shift — the line, who's driving it and on
                    what, stated once instead of repeated on every segment. */}
                <tr style={{ background: "var(--surface-2)" }}>
                  <th
                    colSpan={6}
                    className="px-5 py-2.5 text-left"
                    style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}
                  >
                    <span className="font-display text-sm font-bold" style={{ color: "var(--text)" }}>
                      {group.shiftId ? tripRouteName(group.trips[0]) : "Not part of a shift"}
                    </span>
                    <span className="ml-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
                      {/* Only a real shift has one date, driver and bus across
                          all its segments. The catch-all group mixes trips
                          from different days and drivers, so stating any one
                          of them there would be a lie — it gets the count. */}
                      {group.shiftId && (
                        <>
                          {formatDate(group.trips[0].trip_date)}
                          {group.shift?.start_time && (
                            <>
                              {" · "}
                              <span style={{ fontFamily: "var(--font-mono)" }}>
                                {group.shift.start_time.slice(0, 5)}–{group.shift.end_time?.slice(0, 5)}
                              </span>
                            </>
                          )}
                          {" · "}
                          {group.trips[0].driver?.first_name} {group.trips[0].driver?.last_name}
                          {group.trips[0].bus?.plate_number && ` · Bus ${group.trips[0].bus.plate_number}`}
                          {" · "}
                        </>
                      )}
                      {group.trips.length} segment{group.trips.length === 1 ? "" : "s"}
                    </span>
                  </th>
                </tr>

                {group.trips.map((trip) => {
                  const status = resolveStatus(STATUS_STYLE, trip.status);
                  const isEmergency = trip.status === "emergency";
                  const round = tripRoundLabel(trip);
                  return (
                    <tr
                      key={trip.id}
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: isEmergency ? "var(--critical-bg)" : undefined,
                      }}
                    >
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                        <div>{tripSegmentLabel(trip) || tripRouteName(trip)}</div>
                        <div className="text-xs" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                          {round && `${round} · `}
                          {trip.departure_time?.slice(0, 5)}–{trip.arrival_time?.slice(0, 5)}
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {trip.bus?.plate_number}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                        {trip.driver?.first_name} {trip.driver?.last_name}
                      </td>
                      <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                        {formatDate(trip.trip_date)}
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                      </td>
                      <td className="px-5 py-3 text-sm">
                        <button onClick={() => openEdit(trip)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                          Edit
                        </button>
                        <button onClick={() => setDeletingTrip(trip)} className="font-semibold" style={{ color: "var(--critical)" }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            ))}
          </table>
        )}
        {data && data.data.length === 0 && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No records yet.
          </p>
        )}
      </div>

      <Pagination meta={data} onPageChange={setPage} />

      <TripFormDialog open={formOpen} onOpenChange={setFormOpen} trip={editingTrip} />

      <AlertDialog
        open={Boolean(deletingTrip)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingTrip(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this trip. This action cannot be undone.
            </AlertDialogDescription>
            {deleteError && (
              <p className="mt-2 text-sm" style={{ color: "var(--critical)" }}>
                {deleteError}
              </p>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
