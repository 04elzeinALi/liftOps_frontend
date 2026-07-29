// What a travel card is *for*: the segment it covers, falling back to the
// route name for cards bought before segments existed.
export function cardSegmentLabel(card) {
  const from = card?.from_station?.station_name;
  const to = card?.to_station?.station_name;

  if (from && to) return `${from} → ${to}`;

  return card?.route?.route_name ?? `${card?.route?.origin} — ${card?.route?.destination}`;
}
