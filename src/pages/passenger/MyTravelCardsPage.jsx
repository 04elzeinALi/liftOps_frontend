import { useState } from "react";
import { Link } from "react-router-dom";
import { useMyTravelCards } from "@/api/passengerCards";
import { useRoute, useRoutes } from "@/api/routes";
import TravelCardObject from "@/components/passenger/TravelCardObject";
import LeafletMap from "@/components/LeafletMap";
import { cardSegmentLabel } from "@/lib/cardLabel";
import { segmentBetweenStops } from "@/lib/fare";

const eyebrow = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.15em",
  color: "var(--text-muted)",
  display: "flex",
  alignItems: "center",
  gap: 10,
  margin: "0 2px 12px",
};
const eyebrowRule = { content: '""', height: 1, flex: 1, background: "var(--border)" };

export default function MyTravelCardsPage() {
  const { data: cards, isLoading, isError } = useMyTravelCards();
  const { data: routes } = useRoutes();

  // Tapping a card marks its own segment on the map above, in place; tapping
  // the same one again clears it back to just the plain corridor.
  const [highlightedCardId, setHighlightedCardId] = useState(null);
  const highlightedCard = cards?.find((c) => c.id === highlightedCardId) ?? null;

  // Show whichever route the highlighted card belongs to, falling back to the
  // first route so there's still a line before any card is selected.
  const lineRouteId = highlightedCard?.route_id ?? routes?.[0]?.id;
  const { data: lineRoute } = useRoute(lineRouteId);

  const orderedStops = (lineRoute?.route_stations ?? []).map((rs) => ({
    id: rs.station_id,
    lat: rs.station?.latitude,
    lng: rs.station?.longitude,
    label: rs.station?.station_name,
  }));
  const linePoints = orderedStops.map((s, i, arr) => ({
    ...s,
    kind: i === 0 || i === arr.length - 1 ? "origin" : "stop",
  }));

  const highlightPoints =
    highlightedCard?.from_station_id && highlightedCard?.to_station_id
      ? segmentBetweenStops(orderedStops, highlightedCard.from_station_id, highlightedCard.to_station_id) ?? []
      : [];

  return (
    <div className="mx-auto w-full max-w-[452px]">
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
         Travel Cards
      </h1>

      {linePoints.length >= 2 && (
        <div className="mb-6">
          <p style={eyebrow}>
            The line
            <span style={eyebrowRule} />
          </p>
          <LeafletMap points={linePoints} connect height={200} highlightPoints={highlightPoints} />
          {highlightedCard && (
            <p className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
              {highlightPoints.length >= 2 ? (
                <>
                  <span style={{ color: "#2F6FED", fontWeight: 600 }}>●</span> Showing{" "}
                  {cardSegmentLabel(highlightedCard)}
                </>
              ) : (
                "This card has no route segment on record."
              )}
            </p>
          )}
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            Tap a card below to mark its route on the map.
          </p>
        </div>
      )}

      {isLoading && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Loading…
        </p>
      )}
      {isError && (
        <p className="text-sm" style={{ color: "var(--critical)" }}>
          Failed to load your travel cards.
        </p>
      )}
      {cards && cards.length === 0 && (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          You don't have any travel cards yet.
        </p>
      )}

      <div className="flex flex-col gap-3.5">
        {cards?.map((card) => (
          <TravelCardObject
            key={card.id}
            routeName={cardSegmentLabel(card)}
            cardType={card.card_type}
            remaining={card.remaining_trips}
            total={card.total_trips}
            status={card.status}
            expiry={card.expiry_date}
            note={card.status === "expired" ? "expired" : card.status === "suspended" ? "suspended" : undefined}
            selectable
            selected={card.id === highlightedCardId}
            onSelect={() => setHighlightedCardId((id) => (id === card.id ? null : card.id))}
          />
        ))}
        <Link
          to="/passenger/cards/buy"
          className="flex items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-semibold no-underline"
          style={{ border: "1px dashed var(--border)", background: "transparent", color: "var(--accent)" }}
        >
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Buy a travel card
        </Link>
      </div>
    </div>
  );
}
