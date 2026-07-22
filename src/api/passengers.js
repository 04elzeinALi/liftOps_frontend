import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function usePassengers(page = 1) {
  return useQuery({
    queryKey: ["passengers", page],
    queryFn: async () => {
      const res = await api.get(`/passengers?page=${page}`);
      return res.data;
    },
  });
}

export function useCreatePassenger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/passengers", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
      queryClient.invalidateQueries({ queryKey: ["available-passenger-users"] });
    },
  });
}

export function useUpdatePassenger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/passengers/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
    },
  });
}

export function useDeletePassenger() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/passengers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["passengers"] });
      queryClient.invalidateQueries({ queryKey: ["available-passenger-users"] });
    },
  });
}
