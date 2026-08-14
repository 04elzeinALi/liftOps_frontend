import { useDriverCashReport } from "@/api/reports";
import {
  ReportShell,
  ReportTable,
  StatTiles,
  money,
  useReportRange,
} from "@/components/reports/ReportShell";

export default function DriverCashReportPage() {
  const range = useReportRange("month");
  const { data, isLoading, isError } = useDriverCashReport(range.params);

  const t = data?.totals;

  return (
    <ReportShell
      title="Driver Cash Report"
      subtitle="What each driver took in, counting both travel cards they sold and cash customers they boarded."
      range={range}
      window={data?.window}
      isLoading={isLoading}
      isError={isError}
    >
      {t && (
        <StatTiles
          tiles={[
            { label: "Collected", value: money(t.collected) },
            { label: "Confirmed", value: money(t.confirmed), tone: "var(--success)" },
            {
              label: "Still owed",
              value: money(t.outstanding),
              tone: t.outstanding > 0 ? "var(--warning)" : undefined,
              hint: "Taken but not yet marked received",
            },
          ]}
        />
      )}

      <ReportTable
        title="By driver"
        columns={[
          { key: "driver_name", label: "Driver" },
          { key: "card_sales_count", label: "Cards sold", align: "right" },
          { key: "cash_customer_count", label: "Cash riders", align: "right" },
          { key: "collected", label: "Collected", align: "right", format: money },
          { key: "confirmed", label: "Confirmed", align: "right", format: money },
          {
            key: "outstanding",
            label: "Still owed",
            align: "right",
            format: (v) => (
              <span style={{ color: Number(v) > 0 ? "var(--warning)" : "var(--text-muted)" }}>
                {money(v)}
              </span>
            ),
          },
        ]}
        rows={(data?.by_driver ?? []).map((r) => ({ ...r, id: r.driver_id }))}
        emptyMessage="No driver took money in this period."
      />
    </ReportShell>
  );
}
