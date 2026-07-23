import { useEffect, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreatePayment, useTravelCardsList, useUpdatePayment } from "@/api/payments";
import { useDriversList } from "@/api/drivers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const PAYMENT_METHODS = ["cash", "credit_card", "bank_transfer", "wish"];
const PAYMENT_STATUSES = ["unpaid", "paid", "failed"];
const NONE_VALUE = "none";

const EMPTY_FORM = {
  travel_card_id: "",
  payment_method: PAYMENT_METHODS[0],
  payment_status: PAYMENT_STATUSES[0],
  paid_at: "",
  collected_by_driver_id: NONE_VALUE,
};

export default function PaymentFormDialog({ open, onOpenChange, payment }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: travelCards } = useTravelCardsList();
  const { data: drivers } = useDriversList();
  const createPayment = useCreatePayment();
  const updatePayment = useUpdatePayment();
  const isEditing = Boolean(payment);
  const isSubmitting = createPayment.isPending || updatePayment.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        payment
          ? {
              travel_card_id: payment.travel_card_id,
              payment_method: payment.payment_method,
              payment_status: payment.payment_status,
              paid_at: payment.paid_at?.slice(0, 16) ?? "",
              collected_by_driver_id: payment.collected_by_driver_id
                ? String(payment.collected_by_driver_id)
                : NONE_VALUE,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, payment]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");
    const payload = {
      travel_card_id: Number(form.travel_card_id),
      payment_method: form.payment_method,
      payment_status: form.payment_status,
      paid_at: form.paid_at || null,
      collected_by_driver_id: form.collected_by_driver_id === NONE_VALUE ? null : Number(form.collected_by_driver_id),
    };
    try {
      if (isEditing) {
        await updatePayment.mutateAsync({ id: payment.id, payload });
      } else {
        await createPayment.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      const { fieldErrors, message } = parseApiError(err);
      setErrors(fieldErrors ?? {});
      setGeneralError(message ?? "");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Payment" : "Add Payment"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="travel_card_id">Travel card</Label>
            <Select
              value={form.travel_card_id ? String(form.travel_card_id) : ""}
              onValueChange={(value) => handleChange("travel_card_id", Number(value))}
            >
              <SelectTrigger id="travel_card_id" className="w-full">
                <SelectValue placeholder="Select a travel card" />
              </SelectTrigger>
              <SelectContent>
                {travelCards?.map((card) => (
                  <SelectItem key={card.id} value={String(card.id)}>
                    #{card.id} — {card.passenger?.first_name} {card.passenger?.last_name} ({card.card_type})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.travel_card_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.travel_card_id[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="payment_method">Payment method</Label>
            <select
              id="payment_method"
              value={form.payment_method}
              onChange={(e) => handleChange("payment_method", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {PAYMENT_METHODS.map((method) => (
                <option key={method} value={method}>
                  {method.replace("_", " ")}
                </option>
              ))}
            </select>
            {errors.payment_method && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.payment_method[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="payment_status">Payment status</Label>
            <select
              id="payment_status"
              value={form.payment_status}
              onChange={(e) => handleChange("payment_status", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {PAYMENT_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {errors.payment_status && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.payment_status[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="paid_at">Paid at</Label>
            <Input
              id="paid_at"
              type="datetime-local"
              value={form.paid_at}
              onChange={(e) => handleChange("paid_at", e.target.value)}
            />
            {errors.paid_at && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.paid_at[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="collected_by_driver_id">Collected by driver (optional)</Label>
            <Select
              value={form.collected_by_driver_id}
              onValueChange={(value) => handleChange("collected_by_driver_id", value)}
            >
              <SelectTrigger id="collected_by_driver_id" className="w-full">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {drivers?.map((driver) => (
                  <SelectItem key={driver.id} value={String(driver.id)}>
                    {driver.first_name} {driver.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.collected_by_driver_id && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.collected_by_driver_id[0]}
              </p>
            )}
          </div>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Amount is computed automatically from the travel card's route and type.
          </p>
          {generalError && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {generalError}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
