import { useState } from "react";
import { useDeleteScheduleDay, useScheduleDays } from "@/api/scheduleDays";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import ScheduleDayFormDialog from "./ScheduleDayFormDialog";
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

export default function ScheduleDaysPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useScheduleDays(page);
  const deleteScheduleDay = useDeleteScheduleDay();

  const [formOpen, setFormOpen] = useState(false);
  const [editingScheduleDay, setEditingScheduleDay] = useState(null);
  const [deletingScheduleDay, setDeletingScheduleDay] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingScheduleDay(null);
    setFormOpen(true);
  }

  function openEdit(scheduleDay) {
    setEditingScheduleDay(scheduleDay);
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
      await deleteScheduleDay.mutateAsync(deletingScheduleDay.id);
      setDeletingScheduleDay(null);
    } catch {
      setDeleteError("Failed to delete this schedule day. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Schedule Days
        </h1>
        <Button onClick={openCreate}>Add Schedule Day</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load schedule days.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Schedule", "Day", ""].map((h) => (
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
              {data.data.map((scheduleDay) => (
                <tr key={scheduleDay.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {scheduleDay.schedule?.route?.route_name} — {scheduleDay.schedule?.departure_time?.slice(0, 5)}–{scheduleDay.schedule?.arrival_time?.slice(0, 5)}
                  </td>
                  <td className="px-5 py-3 text-sm capitalize" style={{ color: "var(--text)" }}>
                    {scheduleDay.day_of_week}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button onClick={() => openEdit(scheduleDay)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingScheduleDay(scheduleDay)} className="font-semibold" style={{ color: "var(--critical)" }}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination meta={data} onPageChange={setPage} />

      <ScheduleDayFormDialog open={formOpen} onOpenChange={setFormOpen} scheduleDay={editingScheduleDay} />

      <AlertDialog
        open={Boolean(deletingScheduleDay)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingScheduleDay(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this schedule day?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this schedule day. This action cannot be undone.
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
