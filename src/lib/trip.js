// A trip is one leg of a shift, so its route comes from that shift. Trips
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

// "Round 2 →" — which out-and-back this leg belongs to, and its direction.
export function tripLegLabel(trip) {
  if (!trip?.round_number) return "";
  return `Round ${trip.round_number} ${trip.direction === "inbound" ? "←" : "→"}`;
}

// The backend already falls back to the schedule's times for older trips, so
// the trip's own fields are the single thing to read.
export function tripTimes(trip) {
  return {
    departure: trip?.departure_time?.slice(0, 5) ?? "--:--",
    arrival: trip?.arrival_time?.slice(0, 5) ?? "--:--",
  };
}
