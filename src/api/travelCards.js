import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

export function usePassengersList() {
  return useQuery({
    queryKey: ["passengers-list"],
    queryFn: () => fetchAllPages("/passengers"),
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
      // Refresh the dropdown source the Add-Payment form reads, so a
      // just-created/edited card is selectable immediately.
      queryClient.invalidateQueries({ queryKey: ["travel-cards-list"] });
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
      // Refresh the dropdown source the Add-Payment form reads, so a
      // just-created/edited card is selectable immediately.
      queryClient.invalidateQueries({ queryKey: ["travel-cards-list"] });
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
      // Refresh the dropdown source the Add-Payment form reads, so a
      // just-created/edited card is selectable immediately.
      queryClient.invalidateQueries({ queryKey: ["travel-cards-list"] });
    },
  });
}
