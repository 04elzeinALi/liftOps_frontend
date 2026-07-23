import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

// Fetches every scheduled trip across all pages. Filtering by status is
// done server-side (?status=scheduled) so scheduled trips past page 1
// aren't silently dropped, and we page through rather than assume they all
// fit in the backend's fixed paginate(15).
export function useUpcomingTrips() {
  return useQuery({
    queryKey: ["passenger-trips"],
    queryFn: async () => {
      const first = await api.get("/trips?status=scheduled&page=1");
      const { data, last_page } = first.data;

      if (last_page <= 1) {
        return data;
      }

      const rest = await Promise.all(
        Array.from({ length: last_page - 1 }, (_, i) =>
          api.get(`/trips?status=scheduled&page=${i + 2}`)
        )
      );

      return [data, ...rest.map((res) => res.data.data)].flat();
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
