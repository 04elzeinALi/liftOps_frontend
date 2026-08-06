import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

// The driver's own shifts for one day. The backend scopes /shifts to the
// signed-in driver, so no driver filter is needed here.
export function useMyShifts(date) {
  return useQuery({
    queryKey: ["driver-shifts", date],
    queryFn: () => fetchAllPages(`/shifts?shift_date=${date}`),
    enabled: Boolean(date),
  });
}

// Every segment the driver runs on a day, in departure order.
export function useMyTripsOn(date) {
  return useQuery({
    queryKey: ["driver-trips", date],
    queryFn: async () => {
      const trips = await fetchAllPages(`/trips?trip_date=${date}`);
      return [...trips].sort((a, b) =>
        String(a.departure_time ?? "").localeCompare(String(b.departure_time ?? ""))
      );
    },
    enabled: Boolean(date),
  });
}

export function useUpdateShiftStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await api.put(`/shifts/${id}`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-shifts"] });
      queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
    },
  });
}

// Looks a rider up by name or phone. The backend requires 3+ characters and
// caps the result, so this stays a lookup rather than a passenger list.
export function usePassengerLookup(term) {
  return useQuery({
    queryKey: ["driver-passenger-lookup", term],
    queryFn: async () => {
      const res = await api.get(`/passengers?search=${encodeURIComponent(term)}`);
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: (term ?? "").trim().length >= 3,
  });
}

// Opens an account for a walk-up rider who doesn't have one.
export function useCreateWalkUpPassenger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/passengers", { ...payload, status: "active" });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["driver-passenger-lookup"] });
    },
  });
}
