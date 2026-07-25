import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { localToday } from "@/lib/dates";

export function useTodaysTrips() {
  return useQuery({
    queryKey: ["driver-trips", "today"],
    queryFn: async () => {
      // Local date, not UTC — a UTC date rolls to tomorrow every evening in
      // zones behind UTC, making the driver miss today's real trips.
      const res = await api.get(`/trips?trip_date=${localToday()}`);
      return res.data;
    },
  });
}

export function useTripDetail(id) {
  return useQuery({
    queryKey: ["driver-trip", id],
    queryFn: async () => {
      const res = await api.get(`/trips/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useUpdateTripStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.put(`/trips/${id}`, { status });
      return res.data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["driver-trip", id] });
      queryClient.invalidateQueries({ queryKey: ["driver-trips", "today"] });
    },
  });
}

// `paginate(15)` is a fixed backend-wide convention, but a full bus's
// manifest can exceed that — fetch page 1, then fetch any remaining pages
// in parallel and concatenate so nobody silently falls off the list.
async function fetchAllPages(url) {
  const first = await api.get(`${url}${url.includes("?") ? "&" : "?"}page=1`);
  const { data, last_page } = first.data;

  if (last_page <= 1) {
    return data;
  }

  const rest = await Promise.all(
    Array.from({ length: last_page - 1 }, (_, i) =>
      api.get(`${url}${url.includes("?") ? "&" : "?"}page=${i + 2}`)
    )
  );

  return [data, ...rest.map((res) => res.data.data)].flat();
}

export function useTripManifest(tripId) {
  return useQuery({
    queryKey: ["driver-trip-manifest", tripId],
    queryFn: async () => {
      const [reservations, boardings] = await Promise.all([
        fetchAllPages(`/reservations?trip_id=${tripId}`),
        fetchAllPages(`/boardings?trip_id=${tripId}`),
      ]);
      return { reservations, boardings };
    },
    enabled: Boolean(tripId),
  });
}

export function useMarkBoarded() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reservation) => {
      const res = await api.post("/boardings", {
        trip_id: reservation.trip_id,
        reservation_id: reservation.id,
        passenger_id: reservation.passenger_id,
        travel_card_id: reservation.travel_card_id,
        boarded_at: new Date().toISOString(),
      });
      return res.data;
    },
    onSuccess: (_data, reservation) => {
      queryClient.invalidateQueries({ queryKey: ["driver-trip-manifest", reservation.trip_id] });
    },
  });
}
