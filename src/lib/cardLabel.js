// What a travel card is *for*: the segment it covers, falling back to the
// route name for cards bought before segments existed.
export function cardSegmentLabel(card) {
  const from = card?.from_station?.station_name;
  const to = card?.to_station?.station_name;

  if (from && to) return `${from} → ${to}`;

  return card?.route?.route_name ?? `${card?.route?.origin} — ${card?.route?.destination}`;
}

// Where a rider is actually travelling on this trip. Recorded on the boarding
// for a walk-up; inherited from their card otherwise.
export function boardingSegmentLabel(boarding) {
  const from = boarding?.from_station?.station_name ?? boarding?.travel_card?.from_station?.station_name;
  const to = boarding?.to_station?.station_name ?? boarding?.travel_card?.to_station?.station_name;

  if (from && to) return `${from} → ${to}`;

  return "—";
}
