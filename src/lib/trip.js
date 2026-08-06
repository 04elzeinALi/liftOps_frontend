// A trip is one segment of a shift, so its route comes from that shift. Trips
// created under the old fixed timetable have no shift and still carry theirs
// on a schedule, so every reader goes through here rather than reaching for
// one shape or the other.

export function tripRoute(trip) {
  return trip?.shift?.route ?? trip?.schedule?.route ?? null;
}

export function tripRouteName(trip) {
  const route = tripRoute(trip);
  if (!route) return "—";
  return route.route_name ?? `${route.origin} → ${route.destination}`;
}

// What this segment actually runs, end to end: "Beirut-Cola → Tyre (Borj
// Shemali)" outbound, and the reverse coming back. Naming every segment
// after the whole line ("Beirut → Saida → Tyre") made them indistinguishable
// — a driver couldn't tell which way they were pointing.
//
// The route's origin/destination accessors already resolve to the linked
// station's current name (see Route::origin() on the backend), so this
// reads real stop names rather than the frozen text columns.
export function tripEndpoints(trip) {
  const route = tripRoute(trip);
  if (!route) return { from: null, to: null };

  const start = route.origin;
  const end = route.destination;

  // Trips predating shifts have no direction; they ran the line forwards.
  return trip?.direction === "inbound"
    ? { from: end, to: start }
    : { from: start, to: end };
}

export function tripSegmentLabel(trip) {
  const { from, to } = tripEndpoints(trip);
  if (!from || !to) return "";
  return `${from} → ${to}`;
}

// "Round 2" — which out-and-back of the shift this segment belongs to.
// Separate from the name above so a caller can show either or both.
export function tripRoundLabel(trip) {
  if (!trip?.round_number) return "";
  return `Round ${trip.round_number}`;
}

// The backend already falls back to the schedule's times for older trips, so
// the trip's own fields are the single thing to read.
export function tripTimes(trip) {
  return {
    departure: trip?.departure_time?.slice(0, 5) ?? "--:--",
    arrival: trip?.arrival_time?.slice(0, 5) ?? "--:--",
  };
}
