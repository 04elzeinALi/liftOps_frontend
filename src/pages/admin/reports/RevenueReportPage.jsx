import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  const [searchParams] = useSearchParams();
  // Coming back from a drill-down carries the period it was opened with
  // (?period=all or ?from=&to=), so returning here re-selects the same
  // window instead of resetting to "This month".
  const range = useReportRange(searchParams.get("period") ?? "month");
  useEffect(() => {
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    if (from && to) {
      range.setFrom(from);
      range.setTo(to);
    }
    // Only ever meant to seed from the URL once, on arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const { data, isLoading, isError } = useRevenueReport(range.params);

  const t = data?.totals;
  // Carries the currently-selected period into the drill-down, so it opens
  // showing the same window instead of resetting to "This month" and looking
  // like the numbers vanished.
  const rangeQuery = new URLSearchParams(range.params).toString();

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
        rowHref={(row) => `/admin/reports/revenue/method/${encodeURIComponent(row.method)}?${rangeQuery}`}
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
        rowHref={(row) => `/admin/reports/revenue/route/${row.route_id}?${rangeQuery}`}
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
        rowHref={(row) => `/admin/reports/revenue/card_type/${encodeURIComponent(row.card_type)}?${rangeQuery}`}
      />
    </ReportShell>
  );
}
