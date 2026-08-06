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

// Turns anything the API hands back into a Date in LOCAL time.
//
// A bare "2026-08-05" is defined by the spec to parse as UTC midnight, which
// renders as the day BEFORE anywhere west of Greenwich — so date-only strings
// (trip_date, expiry_date, scheduled_at…) get an explicit time appended to
// force local parsing. Full timestamps already carry a zone and are left
// alone. Returns null for anything unparseable.
function toLocalDate(value) {
  if (!value) return null;
  const d = typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Every date the app SHOWS is dd/mm/yyyy — built from the local calendar
// fields rather than a locale string, so it doesn't change shape depending
// on the viewer's browser language.
//
// Note this governs displayed text only: a native <input type="date"> draws
// its own control using the browser/OS locale and can't be overridden by
// the page, so those pickers may still read mm/dd/yyyy on a US-locale
// browser. Replacing them would mean hand-building a date picker.
export function formatDate(value) {
  const d = toLocalDate(value);
  if (!d) return "—";
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// dd/mm/yyyy plus a 24-hour clock, for timestamps.
export function formatDateTime(value) {
  const d = toLocalDate(value);
  if (!d) return "—";
  return `${formatDate(value)} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
