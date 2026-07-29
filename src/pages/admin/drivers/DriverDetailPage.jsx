import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import { Link, useParams } from "react-router-dom";
import { useDriverActivity } from "@/api/activity";
import ActivityTable from "@/components/ActivityTable";
import StatusPill from "@/components/StatusPill";
import { localToday, formatDateTime } from "@/lib/dates";
import { tripRouteName } from "@/lib/trip";

const TRIP_STATUS_STYLE = {
  scheduled: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Scheduled" },
  ongoing: { bg: "var(--success-bg)", fg: "var(--success)", label: "Ongoing" },
  completed: { bg: "var(--success-bg)", fg: "var(--success)", label: "Completed" },
  cancelled: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Cancelled" },
  emergency: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Emergency" },
};

const PAYMENT_STATUS_STYLE = {
  paid: { bg: "var(--success-bg)", fg: "var(--success)", label: "Paid" },
  unpaid: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Unpaid" },
  failed: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Failed" },
};

export default function DriverDetailPage() {
  const { id } = useParams();
  const [date, setDate] = useState(localToday);
  const { data, isLoading, isError } = useDriverActivity(id, date);

  const driver = data?.driver;

  // What the driver collected vs what's actually marked paid — the same
  // reconciliation the Payments summary does, scoped to this driver + day.
  const totalCollected = (data?.payments ?? []).reduce((sum, p) => sum + Number(p.amount), 0);
  const totalReceived = (data?.payments ?? [])
    .filter((p) => p.payment_status === "paid")
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div>
      <Link to="/admin/drivers" className="mb-4 inline-block text-sm font-semibold" style={{ color: "var(--accent)" }}>
        ← Back to drivers
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            {driver ? `${driver.first_name} ${driver.last_name}` : "Driver"}
          </h1>
          {driver && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {driver.user?.email} · {driver.phone_number} · {driver.status}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="date" className="mr-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            Day
          </label>
          <input
            id="date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
        </div>
      </div>

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          Failed to load this driver's activity.
        </p>
      )}

      {data && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="rounded-lg p-4" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Cash Collected
              </p>
              <p className="font-display mt-1 text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                ${totalCollected.toFixed(2)}
              </p>
            </div>
            <div className="rounded-lg p-4" style={{ background: "var(--surface-2)" }}>
              <p className="text-xs font-semibold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
                Marked Paid
              </p>
              <p className="font-display mt-1 text-2xl font-extrabold" style={{ color: "var(--text)" }}>
                ${totalReceived.toFixed(2)}
              </p>
            </div>
            <div
              className="rounded-lg p-4"
              style={{ background: totalCollected - totalReceived > 0 ? "var(--critical-bg)" : "var(--success-bg)" }}
            >
              <p
                className="text-xs font-semibold uppercase"
                style={{ color: totalCollected - totalReceived > 0 ? "var(--critical)" : "var(--success)", letterSpacing: "0.06em" }}
              >
                {totalCollected - totalReceived > 0 ? "Unaccounted" : "Reconciled"}
              </p>
              <p
                className="font-display mt-1 text-2xl font-extrabold"
                style={{ color: totalCollected - totalReceived > 0 ? "var(--critical)" : "var(--success)" }}
              >
                ${(totalCollected - totalReceived).toFixed(2)}
              </p>
            </div>
          </div>

          <ActivityTable
            title="Trips Driven"
            headers={["Route", "Bus", "Trip Date", "Status"]}
            emptyText="No trips driven on this day."
            rows={data.trips.map((t) => {
              const s = resolveStatus(TRIP_STATUS_STYLE, t.status);
              return [
                tripRouteName(t),
                t.bus?.plate_number ?? "—",
                t.trip_date,
                <StatusPill key="s" bg={s.bg} fg={s.fg} label={s.label} />,
              ];
            })}
          />

          <ActivityTable
            title="Payments Collected"
            headers={["Passenger", "Amount", "Method", "Status", "Paid At"]}
            emptyText="No payments collected on this day."
            rows={data.payments.map((p) => {
              const s = resolveStatus(PAYMENT_STATUS_STYLE, p.payment_status);
              return [
                p.travel_card?.passenger
                  ? `${p.travel_card.passenger.first_name} ${p.travel_card.passenger.last_name}`
                  : "—",
                `$${Number(p.amount).toFixed(2)}`,
                p.payment_method.replaceAll("_", " "),
                <StatusPill key="s" bg={s.bg} fg={s.fg} label={s.label} />,
                formatDateTime(p.paid_at),
              ];
            })}
          />

          <ActivityTable
            title="Attendance"
            headers={["Route", "Check In", "Check Out", "Status"]}
            emptyText="No attendance recorded on this day."
            rows={data.attendance.map((a) => [
              tripRouteName(a.trip),
              formatDateTime(a.check_in),
              formatDateTime(a.check_out),
              a.status,
            ])}
          />
        </>
      )}
    </div>
  );
}
