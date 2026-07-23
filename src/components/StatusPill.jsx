// Small colored status badge. Callers pass a resolved { bg, fg, label }
// (usually looked up from a page-local status→style map) so the repeated
// pill markup lives in one place.
export default function StatusPill({ bg, fg, label }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ background: bg, color: fg }}
    >
      {label}
    </span>
  );
}
