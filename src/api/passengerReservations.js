import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function useMyReservations() {
  return useQuery({
    queryKey: ["my-reservations"],
    queryFn: async () => {
      const res = await api.get("/reservations");
      return res.data.data;
    },
  });
}

export function useCreateReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ passenger_id, trip_id, travel_card_id, seat_number, pickup_location }) => {
      const res = await api.post("/reservations", {
        passenger_id,
        trip_id,
        travel_card_id,
        seat_number,
        pickup_location: pickup_location || null,
        reservation_time: new Date().toISOString(),
        status: "booked",
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["passenger-trips"] });
      queryClient.invalidateQueries({ queryKey: ["my-travel-cards"] });
    },
  });
}

export function useCancelReservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.put(`/reservations/${id}`, { status: "cancelled" });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-reservations"] });
      queryClient.invalidateQueries({ queryKey: ["passenger-trips"] });
    },
  });
}
