import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMyReservations } from "@/api/passengerReservations";
import { useMyTravelCards } from "@/api/passengerCards";
import { useUpcomingTrips } from "@/api/passengerTrips";
import { useRoute, useRoutes } from "@/api/routes";
import { localToday } from "@/lib/dates";
import { cardSegmentLabel } from "@/lib/cardLabel";
import { segmentBetweenStops } from "@/lib/fare";
import BoardingPass from "@/components/passenger/BoardingPass";
import TravelCardObject from "@/components/passenger/TravelCardObject";
import DepartureBoard from "@/components/passenger/DepartureBoard";
import LeafletMap from "@/components/LeafletMap";

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

function Eyebrow({ children, action }) {
  return (
    <p style={eyebrow}>
      {children}
      <span style={eyebrowRule} />
      {action}
    </p>
  );
}

function nextBookedReservation(reservations) {
  const today = localToday();
  return (reservations ?? [])
    .filter((r) => r.status === "booked" && r.trip?.trip_date && r.trip.trip_date >= today)
    .sort((a, b) => {
      const ka = `${a.trip.trip_date} ${a.trip.departure_time ?? ""}`;
      const kb = `${b.trip.trip_date} ${b.trip.departure_time ?? ""}`;
      return ka.localeCompare(kb);
    })[0];
}

export default function PassengerHomePage() {
  const navigate = useNavigate();
  const { data: reservations } = useMyReservations();
  const { data: cards } = useMyTravelCards();
  const { data: trips, isLoading: tripsLoading } = useUpcomingTrips();
  const { data: routes } = useRoutes();

  const next = nextBookedReservation(reservations);
  const visibleCards = (cards ?? []).slice(0, 2);
  const hasMoreCards = (cards ?? []).length > 2;

  // Tapping a card marks its own segment on the line below, in place; tapping
  // the same one again clears it back to just the plain corridor.
  const [highlightedCardId, setHighlightedCardId] = useState(null);
  const highlightedCard = visibleCards.find((c) => c.id === highlightedCardId) ?? null;

  // Show whichever route the highlighted card belongs to, falling back to the
  // first route so there's still a line before any card is selected.
  const lineRouteId = highlightedCard?.route_id ?? routes?.[0]?.id;
  const { data: lineRoute } = useRoute(lineRouteId);

  // Don't offer a trip the passenger has already booked — it belongs in "your
  // trips", not in the list of things still to book.
  const bookedTripIds = new Set(
    (reservations ?? [])
      .filter((r) => r.status === "booked")
      .map((r) => r.trip?.id ?? r.trip_id)
  );
  const availableTrips = (trips ?? []).filter((t) => !bookedTripIds.has(t.id));

  // The corridor as a map: every stop on the route, in the order the bus
  // actually calls at them, joined into one taxi-yellow line.
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

  // The specific stretch the highlighted card covers, marked in a different
  // colour over the base line.
  const highlightPoints =
    highlightedCard?.from_station_id && highlightedCard?.to_station_id
      ? segmentBetweenStops(orderedStops, highlightedCard.from_station_id, highlightedCard.to_station_id) ?? []
      : [];

  return (
    <div className="mx-auto flex w-full max-w-[452px] flex-col gap-7">
      {/* NEXT DEPARTURE */}
      <section aria-label="Your next departure">
        {next ? (
          <BoardingPass reservation={next} onShow={() => navigate("/passenger/reservations")} />
        ) : (
          <div
            className="rounded-2xl p-6 text-center"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
          >
            <p className="font-display text-xl font-bold" style={{ color: "var(--text)" }}>
              No upcoming trips
            </p>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Book a seat from today's departures below.
            </p>
          </div>
        )}
      </section>

      {/* THE LINE */}
      {linePoints.length >= 2 && (
        <section aria-label="The line">
          <Eyebrow
            action={
              <button
                type="button"
                onClick={() => navigate("/passenger/line")}
                className="text-[11px] font-semibold"
                style={{ color: "var(--accent)", letterSpacing: "0.04em" }}
              >
                All stops
              </button>
            }
          >
            The line
          </Eyebrow>
          <LeafletMap points={linePoints} connect height={220} highlightPoints={highlightPoints} />
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
        </section>
      )}

      {/* YOUR CARDS */}
      <section aria-label="Your travel cards">
        <Eyebrow
          action={
            hasMoreCards ? (
              <button
                type="button"
                onClick={() => navigate("/passenger/cards")}
                className="text-[11px] font-semibold"
                style={{ color: "var(--accent)", letterSpacing: "0.04em" }}
              >
                All cards
              </button>
            ) : null
          }
        >
          Your cards
        </Eyebrow>
        <div className="flex flex-col gap-3.5">
          {visibleCards.map((card) => (
            <TravelCardObject
              key={card.id}
              routeName={cardSegmentLabel(card)}
              cardType={card.card_type}
              remaining={card.remaining_trips}
              total={card.total_trips}
              status={card.status}
              selectable
              selected={card.id === highlightedCardId}
              onSelect={() => setHighlightedCardId((id) => (id === card.id ? null : card.id))}
            />
          ))}
          {visibleCards.length === 0 && (
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You don't have any travel cards yet.
            </p>
          )}
          <button
            type="button"
            onClick={() => navigate("/passenger/cards/buy")}
            className="flex items-center justify-center gap-2 rounded-2xl p-3.5 text-sm font-semibold"
            style={{ border: "1px dashed var(--border)", background: "transparent", color: "var(--accent)" }}
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
            Buy a travel card
          </button>
        </div>
      </section>

      {/* DEPARTURES */}
      <section aria-label="Upcoming departures">
        <Eyebrow>Upcoming departures</Eyebrow>
        {tripsLoading && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Loading…
          </p>
        )}
        {trips && availableTrips.length === 0 && (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            No upcoming departures right now.
          </p>
        )}
        {availableTrips.length > 0 && (
          <DepartureBoard trips={availableTrips} onBook={(id) => navigate(`/passenger/trips/${id}/book`)} />
        )}
      </section>
    </div>
  );
}
