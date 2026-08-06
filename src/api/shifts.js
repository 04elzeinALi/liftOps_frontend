import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

// Anything that changes a shift also regenerates its segments, so trips have to
// be refetched alongside it.
function invalidateShifts(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["shifts"] });
  queryClient.invalidateQueries({ queryKey: ["shift"] });
  queryClient.invalidateQueries({ queryKey: ["trips"] });
  queryClient.invalidateQueries({ queryKey: ["driver-trips"] });
}

export function useShifts({ page = 1, shiftDate = "", driverId = "", routeId = "", status = "" } = {}) {
  return useQuery({
    queryKey: ["shifts", page, shiftDate, driverId, routeId, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page) });
      if (shiftDate) params.set("shift_date", shiftDate);
      if (driverId) params.set("driver_id", driverId);
      if (routeId) params.set("route_id", routeId);
      if (status) params.set("status", status);
      const res = await api.get(`/shifts?${params.toString()}`);
      return res.data;
    },
  });
}

export function useShift(id) {
  return useQuery({
    queryKey: ["shift", id],
    queryFn: async () => {
      const res = await api.get(`/shifts/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/shifts", payload);
      return res.data;
    },
    onSuccess: () => invalidateShifts(queryClient),
  });
}

export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/shifts/${id}`, payload);
      return res.data;
    },
    onSuccess: () => invalidateShifts(queryClient),
  });
}

export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/shifts/${id}`);
    },
    onSuccess: () => invalidateShifts(queryClient),
  });
}
