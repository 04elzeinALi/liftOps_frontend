import { useState } from "react";
import { useDeleteDriver, useDrivers } from "@/api/drivers";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import DriverFormDialog from "./DriverFormDialog";
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

export default function DriversPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useDrivers(page);
  const deleteDriver = useDeleteDriver();

  const [formOpen, setFormOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [deletingDriver, setDeletingDriver] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingDriver(null);
    setFormOpen(true);
  }

  function openEdit(driver) {
    setEditingDriver(driver);
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
      await deleteDriver.mutateAsync(deletingDriver.id);
      setDeletingDriver(null);
    } catch {
      setDeleteError("Failed to delete this driver. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Drivers
        </h1>
        <Button onClick={openCreate}>Add Driver</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load drivers.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Name", "User", "Phone", "License #", "Status", ""].map((h) => (
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
              {data.data.map((driver) => (
                <tr key={driver.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {driver.first_name} {driver.last_name}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                    {driver.user?.email}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {driver.phone_number}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {driver.license_number}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {driver.status}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button onClick={() => openEdit(driver)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingDriver(driver)} className="font-semibold" style={{ color: "var(--critical)" }}>
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

      <DriverFormDialog open={formOpen} onOpenChange={setFormOpen} driver={editingDriver} />

      <AlertDialog
        open={Boolean(deletingDriver)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingDriver(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this driver?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this driver. This action cannot be undone.
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
