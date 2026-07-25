import { useState } from "react";
import { useDeleteSchedule, useSchedules } from "@/api/schedules";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import ScheduleFormDialog from "./ScheduleFormDialog";
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

export default function SchedulesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useSchedules(page);
  const deleteSchedule = useDeleteSchedule();

  const [formOpen, setFormOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [deletingSchedule, setDeletingSchedule] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingSchedule(null);
    setFormOpen(true);
  }

  function openEdit(schedule) {
    setEditingSchedule(schedule);
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
      await deleteSchedule.mutateAsync(deletingSchedule.id);
      setDeletingSchedule(null);
    } catch {
      setDeleteError("Failed to delete this schedule. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Schedules
        </h1>
        <Button onClick={openCreate}>Add Schedule</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load schedules.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Route", "Departure", "Arrival", ""].map((h) => (
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
              {data.data.map((schedule) => (
                <tr key={schedule.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {schedule.route?.route_name}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {schedule.departure_time?.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {schedule.arrival_time?.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button onClick={() => openEdit(schedule)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingSchedule(schedule)} className="font-semibold" style={{ color: "var(--critical)" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
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

      <ScheduleFormDialog open={formOpen} onOpenChange={setFormOpen} schedule={editingSchedule} />

      <AlertDialog
        open={Boolean(deletingSchedule)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingSchedule(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schedule. This action cannot be undone.
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
