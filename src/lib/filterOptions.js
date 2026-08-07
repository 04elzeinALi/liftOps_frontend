// A plain function over data, not JSX, so it's importable and testable
// without a build step. `options` is [{ value, label }].
export function filterStationOptions(options, query, value) {
  const term = query.trim().toLowerCase();
  const matches = term
    ? options.filter((o) => o.label.toLowerCase().includes(term))
    : options;

  // The Select trigger renders its text from the mounted item, so a selected
  // option that doesn't match the filter still has to be in the list —
  // otherwise typing an unrelated term visibly empties the field.
  if (value && !matches.some((o) => o.value === value)) {
    const selected = options.find((o) => o.value === value);
    if (selected) return [selected, ...matches];
  }
  return matches;
}
