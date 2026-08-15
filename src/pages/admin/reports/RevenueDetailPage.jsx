import { useEffect } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useRevenueDetail } from "@/api/reports";
import { formatDateTime } from "@/lib/dates";
import StatusPill from "@/components/StatusPill";
import { resolveStatus } from "@/lib/status";
import {
  ReportShell,
  ReportTable,
  StatTiles,
  money,
  titleCase,
  useReportRange,
} from "@/components/reports/ReportShell";

const STATUS_STYLE = {
  paid: { bg: "var(--success-bg)", fg: "var(--success)", label: "Paid" },
  unpaid: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Unpaid" },
  failed: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Failed" },
};

const DIMENSION_LABEL = { method: "payment method", route: "route", card_type: "card type" };

export default function RevenueDetailPage() {
  const { dimension, value } = useParams();
  const [searchParams] = useSearchParams();
  // Arrives from the summary report's rowHref carrying whatever period was
  // selected there (?period=all or ?from=&to=) — without picking it back up,
  // this page would default to "This month" and could look empty even
  // though the summary it was clicked from showed real numbers.
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

  const { data, isLoading, isError } = useRevenueDetail(dimension, value, range.params);

  const t = data?.totals;
  // react-router already decodes path params, so `value` itself (not another
  // decodeURIComponent pass) is the right fallback while the label loads.
  const title = data?.label ?? value ?? "";
  const backHref = `/admin/reports/revenue?${searchParams.toString()}`;

  return (
    <ReportShell
      title={`Revenue — ${title}`}
      subtitle={
        <>
          Every transaction behind this {DIMENSION_LABEL[dimension] ?? "slice"} of the revenue report.{" "}
          <Link to={backHref} className="font-semibold print:hidden" style={{ color: "var(--accent)" }}>
            ← Back to Revenue Report
          </Link>
        </>
      }
      range={range}
      window={data?.window}
      isLoading={isLoading}
      isError={isError}
    >
      {t && (
        <StatTiles
          tiles={[
            { label: "Transactions", value: t.count },
            { label: "Billed", value: money(t.billed) },
            { label: "Received", value: money(t.received), tone: "var(--success)" },
          ]}
        />
      )}

      <ReportTable
        columns={[
          { key: "date", label: "Date", format: (v) => formatDateTime(v) },
          { key: "driver_name", label: "Driver", format: (v) => v ?? "—" },
          { key: "passenger_name", label: "Passenger" },
          { key: "route_name", label: "Route", format: (v) => v ?? "—" },
          { key: "card_type", label: "Card type", format: (v) => (v ? titleCase(v) : "—") },
          {
            key: "payment_status",
            label: "Status",
            format: (v) => {
              const s = resolveStatus(STATUS_STYLE, v);
              return <StatusPill bg={s.bg} fg={s.fg} label={s.label} />;
            },
          },
          { key: "amount", label: "Amount", align: "right", format: money },
        ]}
        rows={data?.rows ?? []}
        emptyMessage="No transactions in this period."
      />
    </ReportShell>
  );
}
