import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

export function useStationsList() {
  return useQuery({
    queryKey: ["stations-list"],
    queryFn: () => fetchAllPages("/stations"),
  });
}

// `search` filters server-side, so matches on later pages are found too —
// filtering the fetched page in the browser would only ever search the 15
// rows already on screen.
export function useStations(page = 1, search = "") {
  return useQuery({
    queryKey: ["stations", page, search],
    queryFn: async () => {
      const params = new URLSearchParams({ page });
      if (search) params.set("search", search);
      const res = await api.get(`/stations?${params}`);
      return res.data;
    },
    // Keeps the current rows on screen while a new search is in flight,
    // so the table doesn't blank out on every keystroke.
    placeholderData: (previous) => previous,
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
