import { useEffect, useState } from "react";
import { useCreatePassenger, useUpdatePassenger } from "@/api/passengers";
import { useAvailablePassengerUsers } from "@/api/users";
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

const STATUSES = ["active", "inactive", "suspended"];

const EMPTY_FORM = {
  user_id: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  status: STATUSES[0],
};

export default function PassengerFormDialog({ open, onOpenChange, passenger }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: availableUsers } = useAvailablePassengerUsers();
  const createPassenger = useCreatePassenger();
  const updatePassenger = useUpdatePassenger();
  const isEditing = Boolean(passenger);
  const isSubmitting = createPassenger.isPending || updatePassenger.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        passenger
          ? {
              user_id: passenger.user_id,
              first_name: passenger.first_name,
              last_name: passenger.last_name,
              phone_number: passenger.phone_number,
              status: passenger.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, passenger]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    // user_id is only settable on create — reassigning an existing
    // Passenger profile to a different user isn't supported here.
    const payload = isEditing
      ? {
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          status: form.status,
        }
      : {
          user_id: Number(form.user_id),
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          status: form.status,
        };

    try {
      if (isEditing) {
        await updatePassenger.mutateAsync({ id: passenger.id, payload });
      } else {
        await createPassenger.mutateAsync(payload);
      }
      onOpenChange(false);
    } catch (err) {
      if (err.response?.status === 422 && err.response.data.errors) {
        setErrors(err.response.data.errors);
      } else if (err.response?.data?.message) {
        setGeneralError(err.response.data.message);
      } else {
        setGeneralError("Something went wrong. Please try again.");
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Passenger" : "Add Passenger"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">User account</Label>
            {isEditing ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {passenger.user?.name} ({passenger.user?.email})
              </p>
            ) : (
              <>
                <Select
                  value={form.user_id ? String(form.user_id) : ""}
                  onValueChange={(value) => handleChange("user_id", Number(value))}
                >
                  <SelectTrigger id="user_id" className="w-full">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers?.map((user) => (
                      <SelectItem key={user.id} value={String(user.id)}>
                        {user.name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.user_id && (
                  <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                    {errors.user_id[0]}
                  </p>
                )}
              </>
            )}
          </div>
          <div>
            <Label htmlFor="first_name">First name</Label>
            <Input
              id="first_name"
              value={form.first_name}
              onChange={(e) => handleChange("first_name", e.target.value)}
              required
            />
            {errors.first_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.first_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="last_name">Last name</Label>
            <Input
              id="last_name"
              value={form.last_name}
              onChange={(e) => handleChange("last_name", e.target.value)}
              required
            />
            {errors.last_name && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.last_name[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="phone_number">Phone number</Label>
            <Input
              id="phone_number"
              value={form.phone_number}
              onChange={(e) => handleChange("phone_number", e.target.value)}
              required
            />
            {errors.phone_number && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.phone_number[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="status">Status</Label>
            <select
              id="status"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
            >
              {STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </option>
              ))}
            </select>
            {errors.status && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.status[0]}
              </p>
            )}
          </div>
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
