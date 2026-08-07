import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";
import { localToday } from "@/lib/dates";

// Fetches every bookable trip across all pages.
//
// Both filters are applied server-side (?status=scheduled&from_date=…) so
// matches past page 1 aren't silently dropped, and we page through rather
// than assume they all fit in the backend's fixed paginate(15).
//
// from_date is the browser's local date, not the server's: a passenger's
// "today" is the day they're actually standing in. Trips that already ran
// aren't bookable, so showing them is just noise between the passenger and
// the next departure.
export function useUpcomingTrips() {
  const today = localToday();

  return useQuery({
    // The date is part of the key so the list refreshes past midnight
    // instead of serving yesterday's cached window.
    queryKey: ["passenger-trips", today],
    queryFn: async () => {
      const query = `status=scheduled&from_date=${today}`;
      const first = await api.get(`/trips?${query}&page=1`);
      const { data, last_page } = first.data;

      if (last_page <= 1) {
        return data;
      }

      const rest = await Promise.all(
        Array.from({ length: last_page - 1 }, (_, i) =>
          api.get(`/trips?${query}&page=${i + 2}`)
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
