import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

export function useUpcomingTrips() {
  return useQuery({
    queryKey: ["passenger-trips"],
    queryFn: async () => {
      const res = await api.get("/trips");
      return res.data.data.filter((trip) => trip.status === "scheduled");
    },
  });
}

export function useTripDetail(id) {
  return useQuery({
    queryKey: ["passenger-trip", id],
    queryFn: async () => {
      const res = await api.get(`/trips/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}
