import { useState } from "react";
import { useDeletePayment, usePayments } from "@/api/payments";
import { Button } from "@/components/ui/button";
import PaymentFormDialog from "./PaymentFormDialog";
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
  paid: { bg: "var(--success-bg)", fg: "var(--success)", label: "Paid" },
  unpaid: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Unpaid" },
  failed: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Failed" },
};

export default function PaymentsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = usePayments(page);
  const deletePayment = useDeletePayment();

  const [formOpen, setFormOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingPayment(null);
    setFormOpen(true);
  }

  function openEdit(payment) {
    setEditingPayment(payment);
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
      await deletePayment.mutateAsync(deletingPayment.id);
      setDeletingPayment(null);
    } catch {
      setDeleteError("Failed to delete this payment. Please try again.");
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          Payments
        </h1>
        <Button onClick={openCreate}>Add Payment</Button>
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>
            Failed to load payments.
          </p>
        )}
        {data && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Passenger", "Amount", "Method", "Status", "Collected By", ""].map((h) => (
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
              {data.data.map((payment) => {
                const status = STATUS_STYLE[payment.payment_status];
                return (
                  <tr key={payment.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {payment.travel_card?.passenger?.first_name} {payment.travel_card?.passenger?.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      ${payment.amount}
                    </td>
                    <td className="px-5 py-3 text-sm capitalize" style={{ color: "var(--text)" }}>
                      {payment.payment_method.replace("_", " ")}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: status.bg, color: status.fg }}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {payment.collected_by_driver
                        ? `${payment.collected_by_driver.first_name} ${payment.collected_by_driver.last_name}`
                        : "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <button onClick={() => openEdit(payment)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                        Edit
                      </button>
                      <button onClick={() => setDeletingPayment(payment)} className="font-semibold" style={{ color: "var(--critical)" }}>
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

      <PaymentFormDialog open={formOpen} onOpenChange={setFormOpen} payment={editingPayment} />

      <AlertDialog
        open={Boolean(deletingPayment)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingPayment(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this payment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this payment. This action cannot be undone.
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
