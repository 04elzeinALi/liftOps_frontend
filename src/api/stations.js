import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

export function useStationsList() {
  return useQuery({
    queryKey: ["stations-list"],
    queryFn: () => fetchAllPages("/stations"),
  });
}

export function useStations(page = 1) {
  return useQuery({
    queryKey: ["stations", page],
    queryFn: async () => {
      const res = await api.get(`/stations?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/stations", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
    },
  });
}

export function useUpdateStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/stations/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      // Routes display a linked station's live name (see Route model
      // accessors) — a rename here needs those cached views to refetch too,
      // or they'd keep showing the old name until an unrelated reload.
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
    },
  });
}

export function useDeleteStation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/stations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stations"] });
      queryClient.invalidateQueries({ queryKey: ["stations-list"] });
      // Deleting a linked station nulls the route's FK server-side,
      // falling back to its frozen text — refresh routes to reflect that.
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
    },
  });
}
