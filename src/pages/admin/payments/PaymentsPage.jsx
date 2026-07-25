import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useDeletePayment, usePayments, usePaymentsSummary } from "@/api/payments";
import { Button } from "@/components/ui/button";
import Pagination from "@/components/Pagination";
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

const PERIODS = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function SummarySection() {
  const [period, setPeriod] = useState("day");
  const { data: summary, isLoading } = usePaymentsSummary(period);

  const billed = summary?.total_billed ?? 0;
  const received = summary?.total_received ?? 0;
  const gap = billed - received;

  return (
    <div className="mb-6 rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-bold" style={{ color: "var(--text)" }}>
          Totals
        </h2>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{
                background: period === p.value ? "var(--accent)" : "var(--surface-2)",
                color: period === p.value ? "var(--accent-ink)" : "var(--text-muted)",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}

      {summary && (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg p-4" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Total Billed
              </p>
              <p className="font-display mt-1 text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                ${billed.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Total Received
              </p>
              <p className="font-display mt-1 text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                ${received.toFixed(2)}
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{ background: gap > 0 ? "var(--critical-bg)" : "var(--success-bg)" }}
            >
              <p
                className="text-xs font-semibold uppercase"
                style={{ color: gap > 0 ? "var(--critical)" : "var(--success)", letterSpacing: "0.06em" }}
              >
                {gap > 0 ? "Unreceived" : "Fully Reconciled"}
              </p>
              <p
                className="font-display mt-1 text-2xl font-extrabold"
                style={{ color: gap > 0 ? "var(--critical)" : "var(--success)" }}
              >
                ${gap.toFixed(2)}
              </p>
            </div>
          </div>

          {summary.by_driver.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                By Driver
              </p>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr>
                    {["Driver", "Billed", "Received", "Gap"].map((h) => (
                      <th
                        key={h}
                        className="px-3 py-2 text-left text-[11px] font-bold uppercase"
                        style={{ color: "var(--text-muted)", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {summary.by_driver.map((row) => {
                    const driverGap = row.billed - row.received;
                    return (
                      <tr key={row.driver_id} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td className="px-3 py-2" style={{ color: "var(--text)" }}>
                          {row.driver_name}
                        </td>
                        <td className="px-3 py-2" style={{ fontFamily: "var(--font-mono)" }}>
                          ${row.billed.toFixed(2)}
                        </td>
                        <td className="px-3 py-2" style={{ fontFamily: "var(--font-mono)" }}>
                          ${row.received.toFixed(2)}
                        </td>
                        <td
                          className="px-3 py-2 font-semibold"
                          style={{ fontFamily: "var(--font-mono)", color: driverGap > 0 ? "var(--critical)" : "var(--success)" }}
                        >
                          ${driverGap.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

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

      <SummarySection />

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
                {["Passenger", "Amount", "Method", "Status", "Paid At", "Collected By", ""].map((h) => (
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
                const status = resolveStatus(STATUS_STYLE, payment.payment_status);
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
                      <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                      {formatDateTime(payment.paid_at)}
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
        {data && data.data.length === 0 && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No records yet.
          </p>
        )}
      </div>

      <Pagination meta={data} onPageChange={setPage} />

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
