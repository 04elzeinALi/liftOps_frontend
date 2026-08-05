// Formats a Date as YYYY-MM-DD from its LOCAL calendar fields. Reading the
// fields directly is the only way that can't drift: toISOString() converts to
// UTC first, so east of Greenwich a local midnight lands on the previous day.
// Every local date string in the app goes through here.
export function toLocalISODate(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// Today's date as YYYY-MM-DD in the browser's LOCAL zone.
export function localToday() {
  return toLocalISODate(new Date());
}

// Advances a YYYY-MM-DD string by `days`, staying in local time throughout.
// Stepping a date through UTC is what silently broke the driver's day picker:
// at UTC+3 the "next day" round-tripped back to the day it started on, so the
// button looked dead, and "previous day" jumped back two.
export function addDaysLocal(dateStr, days) {
  const d = new Date(`${dateStr}T00:00:00`);
  d.setDate(d.getDate() + days);
  return toLocalISODate(d);
}

// A UTC ISO timestamp rendered in the viewer's local date+time.
export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
