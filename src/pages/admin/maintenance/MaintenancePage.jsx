import { useState } from "react";
import { useDeleteMaintenance, useMaintenance } from "@/api/maintenance";
import { Button } from "@/components/ui/button";
import MaintenanceFormDialog from "./MaintenanceFormDialog";
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
  in_progress: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "In progress" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
};

function labelForType(value) {
  return value
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export default function MaintenancePage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useMaintenance(page);
  const deleteMaintenance = useDeleteMaintenance();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [deletingRecord, setDeletingRecord] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingRecord(null);
    setFormOpen(true);
  }

  function openEdit(record) {
    setEditingRecord(record);
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
      await deleteMaintenance.mutateAsync(deletingRecord.id);
      setDeletingRecord(null);
    } catch {
      setDeleteError("Failed to delete this maintenance record. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Maintenance
        </h1>
        <Button onClick={openCreate}>Add Maintenance</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load maintenance records.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Bus", "Type", "Status", "Scheduled", "Cost", ""].map((h) => (
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
              {data.data.map((record) => {
                const status = STATUS_STYLE[record.maintenance_status];
                return (
                  <tr key={record.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {record.bus?.plate_number}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {labelForType(record.maintenance_type)}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: status.bg, color: status.fg }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {record.scheduled_at}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {record.cost ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <button onClick={() => openEdit(record)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                        Edit
                      </button>
                      <button onClick={() => setDeletingRecord(record)} className="font-semibold" style={{ color: "var(--critical)" }}>
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

      <MaintenanceFormDialog open={formOpen} onOpenChange={setFormOpen} record={editingRecord} />

      <AlertDialog
        open={Boolean(deletingRecord)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRecord(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this maintenance record?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this maintenance record. This action cannot be undone.
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
