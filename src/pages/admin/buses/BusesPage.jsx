import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useBuses, useDeleteBus } from "@/api/buses";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import BusFormDialog from "./BusFormDialog";
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
  in_service: { bg: "var(--success-bg)", fg: "var(--success)", label: "In service" },
  maintenance: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Maintenance" },
  out_of_service: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Out of service" },
};

export default function BusesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBuses(page);
  const deleteBus = useDeleteBus();

  const [formOpen, setFormOpen] = useState(false);
  const [editingBus, setEditingBus] = useState(null);
  const [deletingBus, setDeletingBus] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingBus(null);
    setFormOpen(true);
  }

  function openEdit(bus) {
    setEditingBus(bus);
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
      await deleteBus.mutateAsync(deletingBus.id);
      setDeletingBus(null);
    } catch {
      setDeleteError("Failed to delete this bus. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Buses
        </h1>
        <Button onClick={openCreate}>Add Bus</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load buses.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Plate", "Manufacturer", "Model", "Year", "Capacity", "Status", ""].map((h) => (
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
              {data.data.map((bus) => {
                const status = resolveStatus(STATUS_STYLE, bus.status);
                return (
                  <tr key={bus.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {bus.plate_number}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {bus.manufacturer}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {bus.model}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {bus.production_year}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {bus.capacity}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <button onClick={() => openEdit(bus)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                        Edit
                      </button>
                      <button onClick={() => setDeletingBus(bus)} className="font-semibold" style={{ color: "var(--critical)" }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={data} onPageChange={setPage} />

      <BusFormDialog open={formOpen} onOpenChange={setFormOpen} bus={editingBus} />

      <AlertDialog
        open={Boolean(deletingBus)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingBus(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this bus?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {deletingBus?.plate_number}. This action cannot be undone.
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
