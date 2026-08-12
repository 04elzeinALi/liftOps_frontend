import { useFleetReport } from "@/api/reports";
import {
  ReportShell,
  ReportTable,
  StatTiles,
  money,
  titleCase,
  useReportRange,
} from "@/components/reports/ReportShell";

export default function FleetReportPage() {
  const range = useReportRange("year");
  const { data, isLoading, isError } = useFleetReport(range.params);

  const t = data?.totals;

  return (
    <ReportShell
      title="Fleet & Maintenance"
      subtitle="What the fleet cost to keep running, by bus and by kind of work."
      range={range}
      window={data?.window}
      isLoading={isLoading}
      isError={isError}
    >
      {t && (
        <StatTiles
          tiles={[
            { label: "Total cost", value: money(t.cost) },
            { label: "Jobs", value: t.jobs },
            {
              label: "Still open",
              value: t.open_jobs,
              tone: t.open_jobs > 0 ? "var(--warning)" : undefined,
            },
            {
              label: "Off the road now",
              value: t.buses_off_road,
              tone: t.buses_off_road > 0 ? "var(--critical)" : undefined,
              hint: "Buses under maintenance today",
            },
          ]}
        />
      )}

      <ReportTable
        title="By bus"
        columns={[
          { key: "plate_number", label: "Bus" },
          { key: "jobs", label: "Jobs", align: "right" },
          { key: "cost", label: "Cost", align: "right", format: money },
        ]}
        rows={(data?.by_bus ?? []).map((r) => ({ ...r, id: r.bus_id }))}
      />

      <ReportTable
        title="By type of work"
        columns={[
          { key: "maintenance_type", label: "Type", format: titleCase },
          { key: "jobs", label: "Jobs", align: "right" },
          { key: "cost", label: "Cost", align: "right", format: money },
        ]}
        rows={data?.by_type ?? []}
      />
    </ReportShell>
  );
}
