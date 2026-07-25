import { useState } from "react";
import { resolveStatus } from "@/lib/status";
import { Link, useParams } from "react-router-dom";
import { usePassengerActivity } from "@/api/activity";
import ActivityTable from "@/components/ActivityTable";
import StatusPill from "@/components/StatusPill";
import { localToday, formatDateTime } from "@/lib/dates";

const PAYMENT_STATUS_STYLE = {
  paid: { bg: "var(--success-bg)", fg: "var(--success)", label: "Paid" },
  unpaid: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Unpaid" },
  failed: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Failed" },
};

export default function PassengerDetailPage() {
  const { id } = useParams();
  const [date, setDate] = useState(localToday);
  const { data, isLoading, isError } = usePassengerActivity(id, date);

  const passenger = data?.passenger;

  return (
    <div>
      <Link to="/admin/passengers" className="mb-4 inline-block text-sm font-semibold" style={{ color: "var(--accent)" }}>
        ← Back to passengers
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            {passenger ? `${passenger.first_name} ${passenger.last_name}` : "Passenger"}
          </h1>
          {passenger && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              {passenger.user?.email} · {passenger.phone_number} · {passenger.status}
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
          Failed to load this passenger's activity.
        </p>
      )}

      {data && (
        <>
          <ActivityTable
            title="Reservations"
            headers={["Route", "Trip Date", "Seat", "Status", "Booked At"]}
            emptyText="No reservations booked on this day."
            rows={data.reservations.map((r) => [
              r.trip?.schedule?.route?.route_name ?? "—",
              r.trip?.trip_date ?? "—",
              r.seat_number,
              r.status,
              formatDateTime(r.created_at),
            ])}
          />

          <ActivityTable
            title="Trips Attended"
            headers={["Route", "Trip Date", "Boarded At"]}
            emptyText="No trips boarded on this day."
            rows={data.boardings.map((b) => [
              b.trip?.schedule?.route?.route_name ?? "—",
              b.trip?.trip_date ?? "—",
              formatDateTime(b.boarded_at),
            ])}
          />

          <ActivityTable
            title="Travel Cards"
            headers={["Route", "Type", "Trips Left", "Status", "Expires"]}
            emptyText="No travel cards obtained on this day."
            rows={data.travel_cards.map((c) => [
              c.route?.route_name ?? "—",
              c.card_type,
              c.remaining_trips,
              c.status,
              c.expiry_date,
            ])}
          />

          <ActivityTable
            title="Payments"
            headers={["Amount", "Method", "Status", "Collected By", "Paid At"]}
            emptyText="No payments made on this day."
            rows={data.payments.map((p) => {
              const s = PAYMENT_resolveStatus(STATUS_STYLE, p.payment_status);
              return [
                `$${p.amount}`,
                p.payment_method.replace("_", " "),
                <StatusPill key="s" bg={s.bg} fg={s.fg} label={s.label} />,
                p.collected_by_driver
                  ? `${p.collected_by_driver.first_name} ${p.collected_by_driver.last_name}`
                  : "—",
                formatDateTime(p.paid_at),
              ];
            })}
          />
        </>
      )}
    </div>
  );
}
