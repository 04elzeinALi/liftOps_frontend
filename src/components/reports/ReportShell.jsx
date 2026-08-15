import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localToday } from "@/lib/dates";

const PRESETS = [
  { value: "day", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
  { value: "year", label: "This Year" },
  { value: "all", label: "All Time" },
];

/**
 * The date range a report is being read for.
 *
 * Presets and an explicit from/to are deliberately exclusive: picking a
 * preset clears the custom dates and vice versa, so there's never a question
 * of which one the figures on screen actually came from.
 */
export function useReportRange(initial = "month") {
  const [period, setPeriod] = useState(initial);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const usingCustom = Boolean(from && to);
  const params = usingCustom ? { from, to } : { period };

  return {
    params,
    period,
    from,
    to,
    usingCustom,
    selectPreset(value) {
      setPeriod(value);
      setFrom("");
      setTo("");
    },
    setFrom,
    setTo,
  };
}

export function ReportRangePicker({ range }) {
  return (
    <div className="mb-5 flex flex-wrap items-end gap-3 print:hidden">
      <div className="flex flex-wrap gap-1.5">
        {PRESETS.map((p) => {
          const active = !range.usingCustom && range.period === p.value;
          return (
            <button
              key={p.value}
              type="button"
              onClick={() => range.selectPreset(p.value)}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold"
              style={{
                background: active ? "var(--accent)" : "var(--surface-2)",
                color: active ? "var(--accent-ink)" : "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-end gap-2">
        <label className="flex flex-col text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          From
          <input
            type="date"
            value={range.from}
            max={range.to || localToday()}
            onChange={(e) => range.setFrom(e.target.value)}
            className="mt-1 rounded-md border px-2.5 py-1.5 text-sm font-normal normal-case"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
        </label>
        <label className="flex flex-col text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.06em" }}>
          To
          <input
            type="date"
            value={range.to}
            min={range.from || undefined}
            onChange={(e) => range.setTo(e.target.value)}
            className="mt-1 rounded-md border px-2.5 py-1.5 text-sm font-normal normal-case"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        title="Print / Save PDF"
        aria-label="Print / Save PDF"
        className="ml-auto flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold"
        style={{ background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" }}
      >
        <svg
          viewBox="0 0 24 24"
          width="15"
          height="15"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9V2h12v7" />
          <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
          <path d="M6 14h12v8H6z" />
        </svg>
        Print / Save PDF
      </button>
    </div>
  );
}

/**
 * Page frame shared by every report: title, the range picker, and a printed
 * header that only shows on paper — a printed sheet has to say what it covers,
 * since the on-screen controls that would have told you are hidden.
 */
export function ReportShell({ title, subtitle, range, window: win, isLoading, isError, children }) {
  return (
    <div className="report-sheet">
      <div className="mb-1 flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          {title}
        </h1>
        {win?.label && (
          <span className="text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
            {win.label}
            {win.from && win.to && win.label !== `${win.from} – ${win.to}` && (
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {" "}· {win.from} → {win.to}
              </span>
            )}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          {subtitle}
        </p>
      )}

      <ReportRangePicker range={range} />

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Loading…</p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>Failed to load this report.</p>
      )}
      {!isLoading && !isError && children}
    </div>
  );
}

export function StatTiles({ tiles }) {
  return (
    <div className="mb-5 grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
      {tiles.map((t) => (
        <div
          key={t.label}
          className="rounded-xl p-4"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
        >
          <p className="text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.07em" }}>
            {t.label}
          </p>
          <p
            className="font-display mt-1 text-2xl font-extrabold"
            style={{ color: t.tone ?? "var(--text)", fontVariantNumeric: "tabular-nums" }}
          >
            {t.value}
          </p>
          {t.hint && (
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>{t.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * A breakdown table. `columns` is [{ key, label, align, format }].
 *
 * `rowHref(row)` is optional — when given, every row navigates there on
 * click (e.g. a summary row drilling into the transactions behind it). Left
 * off, rows render exactly as before; the reports that don't need drill-down
 * (fleet, driver cash) are unaffected.
 */
export function ReportTable({ title, columns, rows, emptyMessage = "Nothing in this period.", rowHref }) {
  const navigate = useNavigate();

  return (
    <section className="mb-6">
      {title && (
        <h2 className="mb-2 text-[11px] font-bold uppercase" style={{ color: "var(--text-muted)", letterSpacing: "0.09em" }}>
          {title}
        </h2>
      )}
      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {rows.length === 0 ? (
          <p className="p-5 text-sm" style={{ color: "var(--text-muted)" }}>{emptyMessage}</p>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {columns.map((c) => (
                  <th
                    key={c.key}
                    className="px-5 py-3 text-[11.5px] font-bold uppercase"
                    style={{
                      color: "var(--text-muted)",
                      letterSpacing: "0.06em",
                      borderBottom: "1px solid var(--border)",
                      textAlign: c.align ?? "left",
                    }}
                  >
                    {c.label}
                  </th>
                ))}
                {rowHref && <th className="print:hidden" />}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const href = rowHref?.(row);
                return (
                  <tr
                    key={row.id ?? i}
                    onClick={href ? () => navigate(href) : undefined}
                    role={href ? "button" : undefined}
                    tabIndex={href ? 0 : undefined}
                    onKeyDown={href ? (e) => e.key === "Enter" && navigate(href) : undefined}
                    className={href ? "cursor-pointer hover:brightness-95 print:cursor-auto" : undefined}
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    {columns.map((c) => (
                      <td
                        key={c.key}
                        className="px-5 py-3 text-sm"
                        style={{
                          color: "var(--text)",
                          textAlign: c.align ?? "left",
                          fontFamily: c.align === "right" ? "var(--font-mono)" : undefined,
                          fontVariantNumeric: c.align === "right" ? "tabular-nums" : undefined,
                        }}
                      >
                        {c.format ? c.format(row[c.key], row) : row[c.key]}
                      </td>
                    ))}
                    {href && (
                      <td className="px-3 text-sm print:hidden" style={{ color: "var(--text-muted)" }}>
                        ›
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export const money = (v) => `$${Number(v ?? 0).toFixed(2)}`;
export const titleCase = (v) =>
  String(v ?? "").replaceAll("_", " ").replace(/^\w/, (c) => c.toUpperCase());
