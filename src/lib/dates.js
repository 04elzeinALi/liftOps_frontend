// Today's date as YYYY-MM-DD in the browser's LOCAL zone. Using
// toISOString() directly would give the UTC date, which is off by a day
// near midnight — the same class of bug the backend summary had.
export function localToday() {
  const d = new Date();
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

// A UTC ISO timestamp rendered in the viewer's local date+time.
export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
