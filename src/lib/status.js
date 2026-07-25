// Resolves a status value to its display style with a neutral fallback, so
// an unexpected or null status never throws during render. Without this,
// one bad status value crashes the whole app (the root ErrorBoundary
// replaces everything with "Something went wrong").
export function resolveStatus(map, value) {
  return (
    map[value] ?? {
      bg: "var(--surface-2)",
      fg: "var(--text-muted)",
      label: value ?? "—",
    }
  );
}
