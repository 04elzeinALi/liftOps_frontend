import { useEffect, useState } from "react";
import { useDeleteStation, useStations } from "@/api/stations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Pagination from "@/components/Pagination";
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
  // What's typed vs what's actually queried: the input updates on every
  // keystroke, but the query waits until typing pauses, so searching a name
  // doesn't fire a request per letter.
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useStations(page, search);
  const deleteStation = useDeleteStation();

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      // A new search starts at page 1 — staying on page 3 of the old results
      // would land on an empty page for most terms.
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

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
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Stations
        </h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Input
              type="search"
              placeholder="Search stations…"
              aria-label="Search stations"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-56 pl-8"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="15"
              height="15"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-3.5-3.5" />
            </svg>
          </div>
          <Button onClick={openCreate}>Add Station</Button>
        </div>
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
        {data && data.data.length === 0 && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            {search ? `No stations match "${search}".` : "No records yet."}
          </p>
        )}
      </div>

      <Pagination meta={data} onPageChange={setPage} />

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
