import { useState } from "react";
import { useDeleteRoute, useRoutesPage } from "@/api/routes";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import RouteFormDialog from "./RouteFormDialog";
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

export default function RoutesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useRoutesPage(page);
  const deleteRoute = useDeleteRoute();

  const [formOpen, setFormOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deletingRoute, setDeletingRoute] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingRoute(null);
    setFormOpen(true);
  }

  function openEdit(route) {
    setEditingRoute(route);
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
      await deleteRoute.mutateAsync(deletingRoute.id);
      setDeletingRoute(null);
    } catch {
      setDeleteError("Failed to delete this route. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Routes
        </h1>
        <Button onClick={openCreate}>Add Route</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load routes.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Name", "Origin", "Destination", "Distance", "Duration", "Fare", ""].map((h) => (
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
              {data.data.map((route) => (
                <tr key={route.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {route.route_name}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {route.origin}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {route.destination}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {route.distance_km}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {route.estimated_duration}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {route.fare}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button onClick={() => openEdit(route)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                      Edit
                    </button>
                    <button onClick={() => setDeletingRoute(route)} className="font-semibold" style={{ color: "var(--critical)" }}>
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

      <RouteFormDialog open={formOpen} onOpenChange={setFormOpen} route={editingRoute} />

      <AlertDialog
        open={Boolean(deletingRoute)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRoute(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this route?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this route. This action cannot be undone.
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
