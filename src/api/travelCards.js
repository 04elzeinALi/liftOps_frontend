import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function usePassengersList() {
  return useQuery({
    queryKey: ["passengers-list"],
    queryFn: async () => {
      const res = await api.get("/passengers?page=1");
      return res.data.data;
    },
  });
}

export function useTravelCards(page = 1) {
  return useQuery({
    queryKey: ["travel-cards", page],
    queryFn: async () => {
      const res = await api.get(`/travel-cards?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateTravelCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/travel-cards", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-cards"] });
    },
  });
}

export function useUpdateTravelCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/travel-cards/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-cards"] });
    },
  });
}

export function useDeleteTravelCard() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/travel-cards/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["travel-cards"] });
    },
  });
}
