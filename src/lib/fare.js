// Distance-based fare, mirrored from the backend (Route::ROAD_FACTOR,
// Route::fareBetweenStations, TravelCard::calculatePrice) so the price a
// passenger is quoted matches the one they get charged. The server stays
// authoritative — everything here is preview only.

export const LONG_TRIP_KM = 40;
export const SHORT_TRIP_FARE = 2;
export const LONG_TRIP_FARE = 3;

// Roads bend between stops, so summed straight lines undershoot the distance
// actually driven. Must stay in step with Route::ROAD_FACTOR.
export const ROAD_FACTOR = 1.1;

export const CARD_TERMS = {
  single: { total_trips: 1, expiry_days: 1, multiplier: 1 },
  return: { total_trips: 2, expiry_days: 3, multiplier: 2 },
  weekly: { total_trips: 5, expiry_days: 7, multiplier: 5 * 0.9 },
  monthly: { total_trips: 20, expiry_days: 30, multiplier: 20 * 0.8 },
};

export function fareForDistance(km) {
  const distance = Number(km);
  if (!Number.isFinite(distance)) return null;
  return distance < LONG_TRIP_KM ? SHORT_TRIP_FARE : LONG_TRIP_FARE;
}

// Mirrors TravelCard::baseFare()'s override: a route with manual_fare set
// is priced at that fixed amount regardless of distance.
export function effectiveFare(route, km) {
  if (route?.manual_fare != null) return Number(route.manual_fare);
  return fareForDistance(km);
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Distance between two stops measured along the stop sequence, not as one
// straight line. `stops` is the route's stops in call order, each {id, lat, lng}.
export function distanceAlongStops(stops, fromId, toId) {
  const from = stops.findIndex((s) => s.id === Number(fromId));
  const to = stops.findIndex((s) => s.id === Number(toId));
  if (from < 0 || to < 0) return null;

  const [start, end] = from <= to ? [from, to] : [to, from];
  let km = 0;

  for (let i = start; i < end; i++) {
    const a = stops[i];
    const b = stops[i + 1];
    const coords = [a?.lat, a?.lng, b?.lat, b?.lng].map(Number);
    if (!coords.every(Number.isFinite)) continue;
    km += haversineKm(...coords);
  }

  return km * ROAD_FACTOR;
}

// The stops a ride actually passes through, in travel order — what a map
// highlights for "this card covers Cola to Khalde". Direction-agnostic, like
// distanceAlongStops. Returns null if either end isn't one of the stops.
export function segmentBetweenStops(stops, fromId, toId) {
  const from = stops.findIndex((s) => s.id === Number(fromId));
  const to = stops.findIndex((s) => s.id === Number(toId));
  if (from < 0 || to < 0) return null;

  const [start, end] = from <= to ? [from, to] : [to, from];
  return stops.slice(start, end + 1);
}
