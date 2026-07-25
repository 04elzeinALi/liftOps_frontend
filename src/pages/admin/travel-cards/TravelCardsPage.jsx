import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useDeleteTravelCard, useTravelCards } from "@/api/travelCards";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
import TravelCardFormDialog from "./TravelCardFormDialog";
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
  active: { bg: "var(--success-bg)", fg: "var(--success)", label: "Active" },
  expired: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Expired" },
  suspended: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Suspended" },
};

export default function TravelCardsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useTravelCards(page);
  const deleteTravelCard = useDeleteTravelCard();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);
  const [deletingCard, setDeletingCard] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingCard(null);
    setFormOpen(true);
  }

  function openEdit(card) {
    setEditingCard(card);
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
      await deleteTravelCard.mutateAsync(deletingCard.id);
      setDeletingCard(null);
    } catch {
      setDeleteError("Failed to delete this travel card. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Travel Cards
        </h1>
        <Button onClick={openCreate}>Add Travel Card</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load travel cards.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Passenger", "Route", "Type", "Trips Left", "Expires", "Status", ""].map((h) => (
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
              {data.data.map((card) => {
                const status = resolveStatus(STATUS_STYLE, card.status);
                return (
                  <tr key={card.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {card.passenger?.first_name} {card.passenger?.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {card.route?.route_name}
                    </td>
                    <td className="px-5 py-3 text-sm capitalize" style={{ color: "var(--text)" }}>
                      {card.card_type}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {card.remaining_trips}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {card.expiry_date}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <button onClick={() => openEdit(card)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                        Edit
                      </button>
                      <button onClick={() => setDeletingCard(card)} className="font-semibold" style={{ color: "var(--critical)" }}>
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

      <TravelCardFormDialog open={formOpen} onOpenChange={setFormOpen} travelCard={editingCard} />

      <AlertDialog
        open={Boolean(deletingCard)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingCard(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this travel card?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this travel card. This action cannot be undone.
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
