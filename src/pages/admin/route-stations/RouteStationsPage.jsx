import { useState } from "react";
import { useDeleteRouteStation, useRouteStations } from "@/api/routeStations";
import { Button } from "@/components/ui/button";
import RouteStationFormDialog from "./RouteStationFormDialog";
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

export default function RouteStationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useRouteStations(page);
  const deleteRouteStation = useDeleteRouteStation();

  const [formOpen, setFormOpen] = useState(false);
  const [deletingRouteStation, setDeletingRouteStation] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  async function confirmDelete(event) {
    // AlertDialogAction is Radix's DialogPrimitive.Close under the hood, so it
    // auto-closes on click unless we preventDefault() before the first await —
    // without this, the dialog closes immediately regardless of whether the
    // delete succeeds, and the error message below can never be seen.
    event.preventDefault();
    setDeleteError("");
    try {
      await deleteRouteStation.mutateAsync({
        route_id: deletingRouteStation.route_id,
        station_id: deletingRouteStation.station_id,
      });
      setDeletingRouteStation(null);
    } catch {
      setDeleteError("Failed to delete this route station. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Route Stations
        </h1>
        <Button onClick={() => setFormOpen(true)}>Add Route Station</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load route stations.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Route", "Station", "Order", ""].map((h) => (
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
              {data.data.map((routeStation) => (
                <tr
                  key={`${routeStation.route_id}-${routeStation.station_id}`}
                  style={{ borderBottom: "1px solid var(--border)" }}
                >
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {routeStation.route?.origin} → {routeStation.route?.destination}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                    {routeStation.station?.station_name}
                  </td>
                  <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                    {routeStation.station_order}
                  </td>
                  <td className="px-5 py-3 text-sm">
                    <button
                      onClick={() => setDeletingRouteStation(routeStation)}
                      className="font-semibold"
                      style={{ color: "var(--critical)" }}
                    >
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

      <RouteStationFormDialog open={formOpen} onOpenChange={setFormOpen} />

      <AlertDialog
        open={Boolean(deletingRouteStation)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRouteStation(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this route station?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this station from this route. This action cannot be undone.
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
