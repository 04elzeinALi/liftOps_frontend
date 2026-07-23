import { useEffect, useState } from "react";
import { parseApiError } from "@/api/errors";
import { useCreateDriver, useUpdateDriver } from "@/api/drivers";
import { useAvailableDriverUsers } from "@/api/users";
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
  address: "",
  license_number: "",
  hire_date: "",
  status: STATUSES[0],
};

export default function DriverFormDialog({ open, onOpenChange, driver }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState("");
  const { data: availableUsers } = useAvailableDriverUsers();
  const createDriver = useCreateDriver();
  const updateDriver = useUpdateDriver();
  const isEditing = Boolean(driver);
  const isSubmitting = createDriver.isPending || updateDriver.isPending;

  useEffect(() => {
    if (open) {
      setForm(
        driver
          ? {
              user_id: driver.user_id,
              first_name: driver.first_name,
              last_name: driver.last_name,
              phone_number: driver.phone_number,
              address: driver.address ?? "",
              license_number: driver.license_number,
              hire_date: driver.hire_date ?? "",
              status: driver.status,
            }
          : EMPTY_FORM
      );
      setErrors({});
      setGeneralError("");
    }
  }, [open, driver]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setGeneralError("");

    // user_id is only settable on create — changing which user a driver
    // profile belongs to after creation isn't something this form allows.
    const payload = isEditing
      ? {
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          address: form.address || null,
          license_number: form.license_number,
          hire_date: form.hire_date || null,
          status: form.status,
        }
      : {
          user_id: Number(form.user_id),
          first_name: form.first_name,
          last_name: form.last_name,
          phone_number: form.phone_number,
          address: form.address || null,
          license_number: form.license_number,
          hire_date: form.hire_date || null,
          status: form.status,
        };

    try {
      if (isEditing) {
        await updateDriver.mutateAsync({ id: driver.id, payload });
      } else {
        await createDriver.mutateAsync(payload);
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
          <DialogTitle>{isEditing ? "Edit Driver" : "Add Driver"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_id">User account</Label>
            {isEditing ? (
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                {driver.user?.name} ({driver.user?.email})
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
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              value={form.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
            {errors.address && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.address[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="license_number">License number</Label>
            <Input
              id="license_number"
              value={form.license_number}
              onChange={(e) => handleChange("license_number", e.target.value)}
              required
            />
            {errors.license_number && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.license_number[0]}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="hire_date">Hire date</Label>
            <Input
              id="hire_date"
              type="date"
              value={form.hire_date}
              onChange={(e) => handleChange("hire_date", e.target.value)}
            />
            {errors.hire_date && (
              <p className="mt-1 text-xs" style={{ color: "var(--critical)" }}>
                {errors.hire_date[0]}
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
