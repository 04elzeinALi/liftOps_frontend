import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

// GET /passengers already scopes to the caller's own record for a passenger
// role, so this is just that one record — needed because passenger_id is a
// required field on travel-card/reservation creation even though the backend
// overrides it to the caller's own profile regardless of what's sent.
export function useMyPassengerProfile() {
  return useQuery({
    queryKey: ["my-passenger-profile"],
    queryFn: async () => {
      const res = await api.get("/passengers");
      return res.data.data[0];
    },
  });
}

export function useMyTravelCards() {
  return useQuery({
    queryKey: ["my-travel-cards"],
    queryFn: () => fetchAllPages("/travel-cards"),
  });
}

export function useBuyTravelCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ passenger_id, route_id, card_type, payment_method }) => {
      const cardRes = await api.post("/travel-cards", {
        passenger_id,
        route_id,
        card_type,
        status: "active",
      });
      const card = cardRes.data;

      // The backend decides the payment status from the method: online
      // methods (card/bank/wish) auto-confirm as paid, cash starts unpaid
      // until a driver/admin confirms. We just send the method — never a
      // status (a passenger can't self-confirm a payment).
      const paymentRes = await api.post("/payments", {
        travel_card_id: card.id,
        payment_method,
      });

      return { card, payment: paymentRes.data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-travel-cards"] });
      queryClient.invalidateQueries({ queryKey: ["my-payments"] });
    },
  });
}
