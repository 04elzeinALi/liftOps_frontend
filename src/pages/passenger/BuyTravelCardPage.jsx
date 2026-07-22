import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRoutes } from "@/api/routes";
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

const PAYMENT_METHODS = ["cash", "credit_card", "bank_transfer", "wish"];

function extractErrorMessage(err, fallback) {
  if (err.response?.data?.errors) {
    return Object.values(err.response.data.errors)[0][0];
  }
  if (err.response?.data?.message) {
    return err.response.data.message;
  }
  return fallback;
}

export default function BuyTravelCardPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { data: routes } = useRoutes();
  const { data: passenger } = useMyPassengerProfile();
  const buyCard = useBuyTravelCard();

  const [routeId, setRouteId] = useState(searchParams.get("route_id") ?? "");
  const [cardType, setCardType] = useState(CARD_TYPES[0]);
  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHODS[0]);
  const [error, setError] = useState("");

  const selectedRoute = routes?.find((r) => r.id === Number(routeId));
  const terms = CARD_TERMS_PREVIEW[cardType];
  const previewPrice = selectedRoute ? (Number(selectedRoute.fare) * terms.price_multiplier).toFixed(2) : null;

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
        card_type: cardType,
        payment_method: paymentMethod,
      });
      navigate("/passenger/cards");
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to buy this travel card. Please try again."));
    }
  }

  return (
    <div className="max-w-md">
      <h1 className="font-display mb-5 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        Buy a Travel Card
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="route_id">Route</Label>
          <Select value={routeId ? String(routeId) : ""} onValueChange={setRouteId}>
            <SelectTrigger id="route_id" className="w-full">
              <SelectValue placeholder="Select a route" />
            </SelectTrigger>
            <SelectContent>
              {routes?.map((route) => (
                <SelectItem key={route.id} value={String(route.id)}>
                  {route.origin} → {route.destination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="card_type">Card type</Label>
          <select
            id="card_type"
            value={cardType}
            onChange={(e) => setCardType(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            {CARD_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div className="rounded-lg p-4 text-sm" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
          {terms.total_trips} trip{terms.total_trips === 1 ? "" : "s"} · valid for {terms.expiry_days} day{terms.expiry_days === 1 ? "" : "s"}
          {previewPrice && (
            <>
              {" "}
              · <span style={{ color: "var(--text)" }}>${previewPrice}</span>
            </>
          )}
        </div>

        <div>
          <Label htmlFor="payment_method">Payment method</Label>
          <select
            id="payment_method"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full rounded-md border px-3 py-2 text-sm"
            style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--text)" }}
          >
            {PAYMENT_METHODS.map((method) => (
              <option key={method} value={method}>
                {method.replace("_", " ")}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--critical)" }}>
            {error}
          </p>
        )}

        <Button type="submit" disabled={buyCard.isPending || !routeId}>
          {buyCard.isPending ? "Processing…" : "Pay & Buy Card"}
        </Button>
      </form>
    </div>
  );
}
