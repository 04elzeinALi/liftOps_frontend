import { useRidershipReport } from "@/api/reports";
import {
  ReportShell,
  ReportTable,
  StatTiles,
  useReportRange,
} from "@/components/reports/ReportShell";

export default function RidershipReportPage() {
  const range = useReportRange("month");
  const { data, isLoading, isError } = useRidershipReport(range.params);

  const t = data?.totals;

  return (
    <ReportShell
      title="Ridership"
      subtitle="How many people actually rode, how full the buses were, and who booked a seat without turning up."
      range={range}
      window={data?.window}
      isLoading={isLoading}
      isError={isError}
    >
      {t && (
        <StatTiles
          tiles={[
            { label: "Riders", value: t.riders, hint: `${t.card_boardings} on cards · ${t.cash_customers} cash` },
            { label: "Segments run", value: t.trips },
            {
              label: "Seats filled",
              // Null when nothing has actually run yet — showing "0%" would
              // read as "nobody rode" rather than "there was nothing to ride".
              value: t.load_factor == null ? "—" : `${t.load_factor}%`,
              hint: t.seats_offered > 0 ? `of ${t.seats_offered} offered` : "no completed segments yet",
            },
            {
              label: "No-shows",
              value: t.no_shows,
              tone: t.no_shows > 0 ? "var(--warning)" : undefined,
              hint: "Booked, never boarded",
            },
          ]}
        />
      )}

      {t && (
        <StatTiles
          tiles={[
            { label: "Booked", value: t.reservations_booked },
            { label: "Completed", value: t.reservations_completed },
            { label: "Cancelled", value: t.reservations_cancelled },
          ]}
        />
      )}

      <ReportTable
        title="By route"
        columns={[
          { key: "route_name", label: "Route" },
          { key: "trips", label: "Segments", align: "right" },
          { key: "riders", label: "Riders", align: "right" },
        ]}
        rows={(data?.by_route ?? []).map((r, i) => ({ ...r, id: r.route_id ?? `none-${i}` }))}
      />
    </ReportShell>
  );
}
