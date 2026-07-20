import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function useBuses(page = 1) {
  return useQuery({
    queryKey: ["buses", page],
    queryFn: async () => {
      const res = await api.get(`/buses?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/buses", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });
}

export function useUpdateBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/buses/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });
}

export function useDeleteBus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/buses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["buses"] });
    },
  });
}
