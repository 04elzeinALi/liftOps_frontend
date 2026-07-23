// Shared prev/next pager for the paginated list endpoints. `meta` is the
// Laravel paginator envelope (current_page / last_page); onPageChange gets
// the new page number. Renders nothing until meta is available.
export default function Pagination({ meta, onPageChange }) {
  if (!meta) {
    return null;
  }

  return (
    <div className="mt-4 flex items-center justify-between text-sm" style={{ color: "var(--text-muted)" }}>
      <span>
        Page {meta.current_page} of {meta.last_page}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page <= 1}
          className="rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          Prev
        </button>
        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page >= meta.last_page}
          className="rounded-lg px-3 py-1.5 font-semibold disabled:opacity-40"
          style={{ background: "var(--surface-2)", border: "1px solid var(--border)", color: "var(--text)" }}
        >
          Next
        </button>
      </div>
    </div>
  );
}
