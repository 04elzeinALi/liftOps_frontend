import { getApiErrorMessage } from "@/api/errors";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRoute, useRoutes } from "@/api/routes";
import { distanceAlongStops, effectiveFare } from "@/lib/fare";
import { useMyPassengerProfile, useBuyTravelCard } from "@/api/passengerCards";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import TravelCardObject from "@/components/passenger/TravelCardObject";

const CARD_TYPES = ["single", "return", "weekly", "monthly"];

// Preview only — mirrors TravelCardController::computeCardTerms() and
// TravelCard::calculatePrice() on the backend, which are the authoritative
// source. Shown here so the passenger knows what they're buying before
// submitting; the server computes the real values independently.
const CARD_TERMS_PREVIEW = {
  single: { total_trips: 1, expiry_days: 1, price_multiplier: 1 },
  return: { total_trips: 2, expiry_days: 3, price_multiplier: 2 },
  weekly: { total_trips: 5, expiry_days: 7, price_multiplier: 5 * 0.9 },
  monthly: { total_trips: 20, expiry_days: 30, price_multiplier: 20 * 0.8 },
};

// Online methods first so the default (credit_card) confirms instantly and
// the card is bookable right away; cash is last because it stays unpaid
// until a driver/admin confirms receipt.
const PAYMENT_METHODS = ["credit_card", "bank_transfer", "wish", "cash"];

const PAYMENT_LABELS = {
  credit_card: "Credit card",
  bank_transfer: "Bank transfer",
  wish: "Wish",
  cash: "Cash",
};

export default function BuyTravelCardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: routes } = useRoutes();
  const { data: passenger } = useMyPassengerProfile();
  const buyCard = useBuyTravelCard();

  const [routeId, setRouteId] = useState(searchParams.get("route_id") ?? "");
  const [fromStationId, setFromStationId] = useState("");
  const [toStationId, setToStationId] = useState("");
  const [cardType, setCardType] = useState(CARD_TYPES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState("");

  // There's one coastal line, so "which route" isn't a real choice — the
  // passenger's actual choice is which two stops on it. Auto-pick the route
  // (honouring ?route_id= if one was passed in) instead of making them
  // choose it first, which read as "you can only ride the whole line."
  useEffect(() => {
    if (routeId || !routes?.length) return;
    setRouteId(String(routes[0].id));
  }, [routeId, routes]);

  const { data: routeDetail } = useRoute(routeId);

  const stops = useMemo(
    () =>
      (routeDetail?.route_stations ?? []).map((rs) => ({
        id: rs.station_id,
        name: rs.station?.station_name ?? `Station #${rs.station_id}`,
        lat: rs.station?.latitude,
        lng: rs.station?.longitude,
      })),
    [routeDetail]
  );

  // Default to riding the whole line; the passenger narrows it from there.
  useEffect(() => {
    if (stops.length < 2) {
      setFromStationId("");
      setToStationId("");
      return;
    }
    setFromStationId(String(stops[0].id));
    setToStationId(String(stops[stops.length - 1].id));
  }, [stops]);

  const terms = CARD_TERMS_PREVIEW[cardType];

  // The fare band comes from how far the chosen segment actually runs.
  const segmentKm =
    fromStationId && toStationId ? distanceAlongStops(stops, fromStationId, toStationId) : null;
  const baseFare = segmentKm != null ? effectiveFare(routeDetail, segmentKm) : null;
  const previewPrice = baseFare != null ? (baseFare * terms.price_multiplier).toFixed(2) : null;

  const fromName = stops.find((s) => s.id === Number(fromStationId))?.name;
  const toName = stops.find((s) => s.id === Number(toStationId))?.name;
  const routeHasStops = stops.length >= 2;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!passenger) {
      setError("Could not load your passenger profile. Please try again.");
      return;
    }

    try {
      await buyCard.mutateAsync({
        passenger_id: passenger.id,
        route_id: Number(routeId),
        from_station_id: Number(fromStationId),
        to_station_id: Number(toStationId),
        card_type: cardType,
        payment_method: paymentMethod,
      });
      navigate("/passenger/cards");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to buy this travel card. Please try again."));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[452px]">
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        Buy a Travel Card
      </h1>

      {/* live preview of the card being built */}
      <div className="mb-5">
        <TravelCardObject
          routeName={fromName && toName ? `${fromName} → ${toName}` : "Choose your stations"}
          cardType={cardType}
          remaining={terms.total_trips}
          total={terms.total_trips}
          status="active"
          note={previewPrice ? `$${previewPrice}` : undefined}
        />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {routeId && !routeHasStops && (
          <p className="rounded-lg p-3 text-xs" style={{ background: "var(--warning-bg)", color: "var(--warning)" }}>
            The line has no stops set up yet, so a card can't be priced by distance.
          </p>
        )}

        {routeHasStops && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="from_station_id">Starting station</Label>
              <Select value={fromStationId} onValueChange={setFromStationId}>
                <SelectTrigger id="from_station_id" className="w-full">
                  <SelectValue placeholder="From" />
                </SelectTrigger>
                <SelectContent>
                  {stops.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="to_station_id">Ending station</Label>
              <Select value={toStationId} onValueChange={setToStationId}>
                <SelectTrigger id="to_station_id" className="w-full">
                  <SelectValue placeholder="To" />
                </SelectTrigger>
                <SelectContent>
                  {stops
                    .filter((s) => String(s.id) !== fromStationId)
                    .map((s) => (
                      <SelectItem key={s.id} value={String(s.id)}>
                        {s.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="card_type">Card type</Label>
          <Select value={cardType} onValueChange={setCardType}>
            <SelectTrigger id="card_type" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CARD_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg p-4 text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
          <div>
            {terms.total_trips} trip{terms.total_trips === 1 ? "" : "s"} · valid for {terms.expiry_days} day{terms.expiry_days === 1 ? "" : "s"}
          </div>
          {segmentKm != null && (
            <div className="mt-1.5 flex items-baseline justify-between gap-3">
              <span style={{ fontFamily: "var(--font-mono)" }}>
                {segmentKm.toFixed(1)} km · ${baseFare.toFixed(2)}/ride
              </span>
              <span className="font-display text-lg font-extrabold" style={{ color: "var(--accent)" }}>
                ${previewPrice}
              </span>
            </div>
          )}
        </div>

        <div>
          <Label htmlFor="payment_method">Payment method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="payment_method" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((method) => (
                <SelectItem key={method} value={method}>
                  {PAYMENT_LABELS[method]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {paymentMethod === "cash" && (
            <p className="mt-1 text-xs" style={{ color: "var(--warning)" }}>
              Cash isn't confirmed until a driver or admin marks it received — you won't be able to book with this card until then.
            </p>
          )}
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={buyCard.isPending || !routeId || !fromStationId || !toStationId}>
          {buyCard.isPending ? "Processing…" : "Pay & Buy Card"}
        </Button>
      </form>
    </div>
  );
}
