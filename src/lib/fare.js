// Distance-based fare. Kept in one place so the diagram, the card preview and
// the booking screen can't drift apart. The backend enforces the same rule —
// this copy is for display only, never for what actually gets charged.
export const LONG_TRIP_KM = 40;
export const SHORT_TRIP_FARE = 2;
export const LONG_TRIP_FARE = 3;

export function fareForDistance(km) {
  const distance = Number(km);
  if (!Number.isFinite(distance)) return null;
  return distance < LONG_TRIP_KM ? SHORT_TRIP_FARE : LONG_TRIP_FARE;
}
