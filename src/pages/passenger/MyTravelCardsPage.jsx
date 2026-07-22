import { Link } from "react-router-dom";
import { useMyTravelCards } from "@/api/passengerCards";
import { Button } from "@/components/ui/button";

const STATUS_STYLE = {
  active: { bg: "var(--success-bg)", fg: "var(--success)", label: "Active" },
  expired: { bg: "var(--critical-bg)", fg: "var(--critical)", label: "Expired" },
  suspended: { bg: "var(--warning-bg)", fg: "var(--warning)", label: "Suspended" },
};

export default function MyTravelCardsPage() {
  const { data: cards, isLoading, isError } = useMyTravelCards();

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="font-display text-3xl font-extrabold" style={{ color: "var(--text)" }}>
          My Travel Cards
        </h1>
        <Link to="/passenger/cards/buy">
          <Button>Buy a Travel Card</Button>
        </Link>
      </div>

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

      <div className="overflow-x-auto rounded-xl" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
        {cards && cards.length > 0 && (
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: "var(--surface-2)" }}>
                {["Route", "Type", "Trips Left", "Expires", "Status"].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3 text-left text-[11.5px] font-bold uppercase"
                    style={{ color: "var(--text-muted)", letterSpacing: "0.06em", borderBottom: "1px solid var(--border)" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => {
                const status = STATUS_STYLE[card.status];
                return (
                  <tr key={card.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td className="px-5 py-3 text-sm" style={{ color: "var(--text)" }}>
                      {card.route?.route_name}
                    </td>
                    <td className="px-5 py-3 text-sm capitalize" style={{ color: "var(--text)" }}>
                      {card.card_type}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {card.remaining_trips}
                    </td>
                    <td className="px-5 py-3 text-sm" style={{ fontFamily: "var(--font-mono)" }}>
                      {card.expiry_date}
                    </td>
                    <td className="px-5 py-3 text-sm">
                      <span
                        className="rounded-full px-2.5 py-1 text-xs font-semibold"
                        style={{ background: status.bg, color: status.fg }}
                      >
                        {status.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
