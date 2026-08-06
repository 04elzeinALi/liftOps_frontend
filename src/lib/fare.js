// Distance-based fare, mirrored from the backend (Route::ROAD_FACTOR,
// Route::fareForKm, TravelCard::calculatePrice) so the price a passenger is
// quoted matches the one they get charged. The server stays authoritative —
// everything here is preview only.

// Used only as a fallback while the real settings (usePricingSettings, from
// /pricing-settings) are still loading — the admin can change the distance
// band and both fares at runtime, so these are not the source of truth.
export const DEFAULT_PRICING_SETTINGS = {
  long_trip_km: 40,
  short_trip_fare: 2,
  long_trip_fare: 3,
};

// Roads bend between stops, so summed straight lines undershoot the distance
// actually driven. Must stay in step with Route::ROAD_FACTOR.
export const ROAD_FACTOR = 1.1;

export const CARD_TERMS = {
  single: { total_trips: 1, expiry_days: 1, multiplier: 1 },
  return: { total_trips: 2, expiry_days: 3, multiplier: 2 },
  weekly: { total_trips: 5, expiry_days: 7, multiplier: 5 * 0.9 },
  monthly: { total_trips: 20, expiry_days: 30, multiplier: 20 * 0.8 },
};

// `settings` mirrors PricingSetting (long_trip_km / short_trip_fare /
// long_trip_fare) — pass the result of usePricingSettings().data, or omit it
// to fall back to DEFAULT_PRICING_SETTINGS before that's loaded.
export function fareForDistance(km, settings = DEFAULT_PRICING_SETTINGS) {
  const distance = Number(km);
  if (!Number.isFinite(distance)) return null;
  const bands = settings ?? DEFAULT_PRICING_SETTINGS;
  return distance < Number(bands.long_trip_km)
    ? Number(bands.short_trip_fare)
    : Number(bands.long_trip_fare);
}

// True when a route carries a complete set of its own bands. Mirrors
// Route::hasOwnPricing() — the three are treated as one unit, so a
// half-filled route falls back to the network defaults rather than mixing
// its own threshold with the network's fares.
export function hasOwnPricing(route) {
  return (
    route?.long_trip_km != null &&
    route?.short_trip_fare != null &&
    route?.long_trip_fare != null
  );
}

// Mirrors TravelCard::baseFare() and Route::fareForKm(), most specific first:
//   1. the route's manual_fare — a flat price, distance ignored entirely
//   2. the route's own distance bands, if it has a full set
//   3. the network-wide defaults from /pricing-settings
export function effectiveFare(route, km, settings = DEFAULT_PRICING_SETTINGS) {
  if (route?.manual_fare != null) return Number(route.manual_fare);
  if (hasOwnPricing(route)) return fareForDistance(km, route);
  return fareForDistance(km, settings);
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
