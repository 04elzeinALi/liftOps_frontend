import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

export function useRoutes() {
  return useQuery({
    queryKey: ["routes-list"],
    queryFn: () => fetchAllPages("/routes"),
  });
}

// A single route with its stops already in station_order — what the route
// diagram and the stop-sequence editor both read.
export function useRoute(id) {
  return useQuery({
    queryKey: ["route", id],
    queryFn: async () => {
      const res = await api.get(`/routes/${id}`);
      return res.data;
    },
    enabled: Boolean(id),
  });
}

export function useRoutesPage(page = 1) {
  return useQuery({
    queryKey: ["routes", page],
    queryFn: async () => {
      const res = await api.get(`/routes?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/routes", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
    },
  });
}

export function useUpdateRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/routes/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
    },
  });
}

export function useDeleteRoute() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/routes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["routes"] });
      queryClient.invalidateQueries({ queryKey: ["routes-list"] });
    },
  });
}
