import { useRevenueReport } from "@/api/reports";
import {
  ReportShell,
  ReportTable,
  StatTiles,
  money,
  titleCase,
  useReportRange,
} from "@/components/reports/ReportShell";

export default function RevenueReportPage() {
  const range = useReportRange("month");
  const { data, isLoading, isError } = useRevenueReport(range.params);

  const t = data?.totals;

  return (
    <ReportShell
      title="Revenue Report"
      subtitle="Money billed and actually received, including cash customers who never had a travel card."
      range={range}
      window={data?.window}
      isLoading={isLoading}
      isError={isError}
    >
      {t && (
        <StatTiles
          tiles={[
            { label: "Received", value: money(t.received), tone: "var(--success)" },
            { label: "Billed", value: money(t.billed) },
            {
              label: "Outstanding",
              value: money(t.outstanding),
              tone: t.outstanding > 0 ? "var(--warning)" : undefined,
              hint: "Billed but not yet confirmed",
            },
            {
              label: "Cash customers",
              value: money(t.cash_customer_revenue),
              hint: "Taken on the bus, no card",
            },
          ]}
        />
      )}

      <ReportTable
        title="By payment method"
        columns={[
          { key: "method", label: "Method", format: titleCase },
          { key: "count", label: "Payments", align: "right" },
          { key: "billed", label: "Billed", align: "right", format: money },
          { key: "received", label: "Received", align: "right", format: money },
        ]}
        rows={data?.by_method ?? []}
      />

      <ReportTable
        title="By route"
        columns={[
          { key: "route_name", label: "Route" },
          { key: "count", label: "Payments", align: "right" },
          { key: "billed", label: "Billed", align: "right", format: money },
          { key: "received", label: "Received", align: "right", format: money },
        ]}
        rows={data?.by_route ?? []}
        emptyMessage="No card sales in this period."
      />

      <ReportTable
        title="By card type"
        columns={[
          { key: "card_type", label: "Card type", format: titleCase },
          { key: "count", label: "Sold", align: "right" },
          { key: "billed", label: "Billed", align: "right", format: money },
        ]}
        rows={data?.by_card_type ?? []}
        emptyMessage="No card sales in this period."
      />
    </ReportShell>
  );
}
