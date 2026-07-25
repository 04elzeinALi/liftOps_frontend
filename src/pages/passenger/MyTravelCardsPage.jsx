import { Link } from "react-router-dom";
import { useMyTravelCards } from "@/api/passengerCards";
import TravelCardObject from "@/components/passenger/TravelCardObject";

export default function MyTravelCardsPage() {
  const { data: cards, isLoading, isError } = useMyTravelCards();

  return (
    <div className="mx-auto w-full max-w-[452px]">
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        My Travel Cards
      </h1>

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
            routeName={card.route?.route_name ?? `${card.route?.origin} — ${card.route?.destination}`}
            cardType={card.card_type}
            remaining={card.remaining_trips}
            total={card.total_trips}
            status={card.status}
            expiry={card.expiry_date}
            note={card.status === "expired" ? "expired" : card.status === "suspended" ? "suspended" : undefined}
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
