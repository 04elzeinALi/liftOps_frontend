import { useState } from "react";
import { useDeleteStation, useStations } from "@/api/stations";
import { Button } from "@/components/ui/button";
import StationFormDialog from "./StationFormDialog";
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

export default function StationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useStations(page);
  const deleteStation = useDeleteStation();

  const [formOpen, setFormOpen] = useState(false);
  const [editingStation, setEditingStation] = useState(null);
  const [deletingStation, setDeletingStation] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingStation(null);
    setFormOpen(true);
  }

  function openEdit(station) {
    setEditingStation(station);
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
      await deleteStation.mutateAsync(deletingStation.id);
      setDeletingStation(null);
    } catch {
      setDeleteError("Failed to delete this station. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Stations
        </h1>
        <Button onClick={openCreate}>Add Station</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load stations.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Name", "Latitude", "Longitude", ""].map((h) => (
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
              {data.data.map((station) => (
                <tr key={station.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {station.station_name}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {station.latitude}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {station.longitude}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button onClick={() => openEdit(station)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingStation(station)} className="font-semibold" style={{ color: "var(--critical)" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {data && (
        <div className="mt-4 flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
          <span>
            Page {data.current_page} of {data.last_page}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => p - 1)}
              disabled={data.current_page <= 1}
              className="rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              Prev
            </button>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={data.current_page >= data.last_page}
              className="rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
            >
              Next
            </button>
          </div>
        </div>
      )}

      <StationFormDialog open={formOpen} onOpenChange={setFormOpen} station={editingStation} />

      <AlertDialog
        open={Boolean(deletingStation)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingStation(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this station?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this station. This action cannot be undone.
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
