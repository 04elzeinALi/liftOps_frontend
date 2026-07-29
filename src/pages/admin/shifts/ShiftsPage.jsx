import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import StatusPill from "@/components/StatusPill";
import { useDeleteShift, useShifts } from "@/api/shifts";
import { useDriversList } from "@/api/drivers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Pagination from "@/components/Pagination";
import ShiftFormDialog from "./ShiftFormDialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  scheduled: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Scheduled" },
  ongoing: { bg: "var(--success-bg)", fg: "var(--success)", label: "Ongoing" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
  emergency: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Emergency" },
};

const ALL = "__all__";

export default function ShiftsPage() {
  const [page, setPage] = useState(1);
  const [shiftDate, setShiftDate] = useState("");
  const [driverId, setDriverId] = useState("");
  const { data, isLoading, isError } = useShifts({ page, shiftDate, driverId });
  const { data: drivers } = useDriversList();
  const deleteShift = useDeleteShift();

  const [formOpen, setFormOpen] = useState(false);
  const [editingShift, setEditingShift] = useState(null);
  const [deletingShift, setDeletingShift] = useState(null);
  const [deleteError, setDeleteError] = useState("");

  function openCreate() {
    setEditingShift(null);
    setFormOpen(true);
  }

  function openEdit(shift) {
    setEditingShift(shift);
    setFormOpen(true);
  }

  async function confirmDelete(event) {
    // AlertDialogAction closes on click unless prevented before the first
    // await, which would hide the error below.
    event.preventDefault();
    setDeleteError("");
    try {
      await deleteShift.mutateAsync(deletingShift.id);
      setDeletingShift(null);
    } catch (err) {
      setDeleteError(
        err?.response?.data?.message ?? "Failed to delete this shift. Please try again."
      );
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            Shifts
          </h1>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            A driver's working day on a route. Each shift generates its own legs — out and back, once per round.
          </p>
        </div>
        <Button onClick={openCreate}>Add Shift</Button>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <div>
          <Label htmlFor="filter_date">Date</Label>
          <Input
            id="filter_date"
            type="date"
            value={shiftDate}
            onChange={(e) => {
              setShiftDate(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="min-w-[200px]">
          <Label htmlFor="filter_driver">Driver</Label>
          <Select
            value={driverId || ALL}
            onValueChange={(v) => {
              setDriverId(v === ALL ? "" : v);
              setPage(1);
            }}
          >
            <SelectTrigger id="filter_driver" className="w-full">
              <SelectValue placeholder="All drivers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All drivers</SelectItem>
              {drivers?.map((d) => (
                <SelectItem key={d.id} value={String(d.id)}>
                  {d.first_name} {d.last_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {(shiftDate || driverId) && (
          <button
            type="button"
            onClick={() => {
              setShiftDate("");
              setDriverId("");
              setPage(1);
            }}
            className="pb-2 text-sm font-semibold"
            style={{ color: "var(--accent)" }}
          >
            Clear
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {isLoading && (
          <p className="p-6 text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
        )}
        {isError && (
          <p className="p-6 text-sm" style={{ color: "var(--critical)" }}>Failed to load shifts.</p>
        )}
        {data && data.data.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Date", "Driver", "Route", "Bus", "Hours", "Rounds", "Legs", "Status", ""].map((h) => (
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
              {data.data.map((shift) => {
                const status = resolveStatus(STATUS_STYLE, shift.status);
                return (
                  <tr key={shift.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text)" }}>
                      {shift.shift_date?.slice(0, 10)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {shift.driver?.first_name} {shift.driver?.last_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {shift.route?.route_name}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                      {shift.bus?.plate_number}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {shift.start_time?.slice(0, 5)}–{shift.end_time?.slice(0, 5)}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {shift.rounds}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
                      {shift.trips_count ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <StatusPill bg={status.bg} fg={status.fg} label={status.label} />
                    </td>
                    <td className="px-5 py-3 text-sm whitespace-nowrap">
                      <button onClick={() => openEdit(shift)} className="mr-3 font-semibold" style={{ color: "var(--accent)" }}>
                        Edit
                      </button>
                      <button onClick={() => setDeletingShift(shift)} className="font-semibold" style={{ color: "var(--critical)" }}>
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
            No shifts{shiftDate ? ` on ${shiftDate}` : ""}.
          </p>
        )}
      </div>

      <Pagination meta={data} onPageChange={setPage} />

      <ShiftFormDialog open={formOpen} onOpenChange={setFormOpen} shift={editingShift} />

      <AlertDialog
        open={Boolean(deletingShift)}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingShift(null);
            setDeleteError("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this shift?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the shift and every leg it generated. If anything is booked on those legs, cancel the shift instead.
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
