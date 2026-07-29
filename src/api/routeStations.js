import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function useRouteStations(page = 1) {
  return useQuery({
    queryKey: ["route-stations", page],
    queryFn: async () => {
      const res = await api.get(`/route-stations?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateRouteStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/route-stations", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-stations"] });
    },
  });
}

export function useDeleteRouteStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ route_id, station_id }) => {
      await api.delete("/route-stations", { data: { route_id, station_id } });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-stations"] });
      queryClient.invalidateQueries({ queryKey: ["route"] });
    },
  });
}

// Replaces a route's whole stop sequence with the given order of station ids.
export function useReorderRouteStations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ route_id, station_ids }) => {
      const res = await api.put("/route-stations/reorder", { route_id, station_ids });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["route-stations"] });
      queryClient.invalidateQueries({ queryKey: ["route"] });
    },
  });
}
