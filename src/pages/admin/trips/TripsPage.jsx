import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useDeleteTrip, useTrips } from "@/api/trips";
import { Button } from "@/components/ui/button";
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

export default function TripsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTrips(page);
  const deleteTrip = useDeleteTrip();

  const [formOpen, setFormOpen] = useState(false);
  const [editingTrip, setEditingTrip] = useState(null);
  const [deletingTrip, setDeletingTrip] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingTrip(null);
    setFormOpen(true);
  }

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
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Trips
        </h1>
        <Button onClick={openCreate}>Add Trip</Button>
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
                {["Schedule", "Bus", "Driver", "Trip Date", "Status", ""].map((h) => (
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
              {data.data.map((trip) => {
                const status = resolveStatus(STATUS_STYLE, trip.status);
                const isEmergency = trip.status === "emergency";
                return (
                  <tr
                    key={trip.id}
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: isEmergency ? "var(--critical-bg)" : undefined,
                    }}
                  >
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {trip.schedule?.route?.route_name} — {trip.schedule?.departure_time?.slice(0, 5)}–{trip.schedule?.arrival_time?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {trip.bus?.plate_number}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {trip.driver?.first_name} {trip.driver?.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {trip.trip_date}
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
