import { getApiErrorMessage } from "@/api/errors";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTripDetail } from "@/api/passengerTrips";
import { useMyTravelCards } from "@/api/passengerCards";
import { useCreateReservation } from "@/api/passengerReservations";
import { useStationsList } from "@/api/stations";
import { localToday } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const OTHER_PICKUP = "__other__";

export default function BookTripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: trip, isLoading: tripLoading, isError: tripError } = useTripDetail(id);
  const { data: cards, isLoading: cardsLoading } = useMyTravelCards();
  const { data: stations } = useStationsList();
  const createReservation = useCreateReservation();

  const [seatNumber, setSeatNumber] = useState("");
  const [pickupChoice, setPickupChoice] = useState("");
  const [pickupOther, setPickupOther] = useState("");
  const [travelCardId, setTravelCardId] = useState("");
  const [error, setError] = useState("");

  if (tripLoading || cardsLoading) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        Loading…
      </p>
    );
  }

  if (tripError || !trip) {
    return (
      <p className="text-sm" style={{ color: "var(--critical)" }}>
        Failed to load this trip.
      </p>
    );
  }

  const routeId = trip.schedule?.route?.id;
  const today = localToday();
  const eligibleCards = (cards ?? []).filter(
    (card) =>
      card.route_id === routeId &&
      card.status === "active" &&
      card.expiry_date >= today &&
      card.remaining_trips > 0
  );

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    const card = eligibleCards.find((c) => c.id === Number(travelCardId));
    if (!card) {
      setError("Please select a travel card.");
      return;
    }

    const pickupLocation = pickupChoice === OTHER_PICKUP ? pickupOther : pickupChoice;

    try {
      await createReservation.mutateAsync({
        passenger_id: card.passenger_id,
        trip_id: Number(id),
        travel_card_id: card.id,
        seat_number: Number(seatNumber),
        pickup_location: pickupLocation,
      });
      navigate("/passenger/reservations");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to book this trip. Please try again."));
    }
  }

  return (
    <div className="max-w-md">
      <Link to="/passenger/trips" className="mb-4 inline-block text-sm font-semibold" style={{ color: "var(--accent)" }}>
        ← Back to trips
      </Link>

      <h1 className="font-display mb-1 text-3xl font-extrabold" style={{ color: "var(--text)" }}>
        {trip.schedule?.route?.route_name}
      </h1>
      <p className="mb-5 text-sm" style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
        {trip.schedule?.departure_time?.slice(0, 5)}–{trip.schedule?.arrival_time?.slice(0, 5)} · Bus {trip.bus?.plate_number} · {trip.available_seats} seats left
      </p>

      {eligibleCards.length === 0 ? (
        <div className="rounded-xl p-5" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <p className="text-sm" style={{ color: "var(--text)" }}>
            You need a travel card for this route to book this trip.
          </p>
          <Link to={`/passenger/cards/buy?route_id=${routeId}`}>
            <Button className="mt-3">Buy a Travel Card</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="travel_card_id">Travel card</Label>
            <Select value={travelCardId} onValueChange={setTravelCardId}>
              <SelectTrigger id="travel_card_id" className="w-full">
                <SelectValue placeholder="Select a travel card" />
              </SelectTrigger>
              <SelectContent>
                {eligibleCards.map((card) => (
                  <SelectItem key={card.id} value={String(card.id)}>
                    {card.card_type} — {card.remaining_trips} trip{card.remaining_trips === 1 ? "" : "s"} left (expires {card.expiry_date})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="seat_number">Seat number</Label>
            <Input
              id="seat_number"
              type="number"
              min="1"
              max={trip.bus?.capacity}
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="pickup_location">Pickup location (optional)</Label>
            <Select value={pickupChoice} onValueChange={setPickupChoice}>
              <SelectTrigger id="pickup_location" className="w-full">
                <SelectValue placeholder="Select a station" />
              </SelectTrigger>
              <SelectContent>
                {stations?.map((station) => (
                  <SelectItem key={station.id} value={station.station_name}>
                    {station.station_name}
                  </SelectItem>
                ))}
                <SelectItem value={OTHER_PICKUP}>Other…</SelectItem>
              </SelectContent>
            </Select>
            {pickupChoice === OTHER_PICKUP && (
              <Input
                className="mt-2"
                placeholder="Describe your pickup location"
                value={pickupOther}
                onChange={(e) => setPickupOther(e.target.value)}
              />
            )}
          </div>
          {error && (
            <p className="text-sm" style={{ color: "var(--critical)" }}>
              {error}
            </p>
          )}
          <Button type="submit" disabled={createReservation.isPending}>
            {createReservation.isPending ? "Booking…" : "Book this trip"}
          </Button>
        </form>
      )}
    </div>
  );
}
