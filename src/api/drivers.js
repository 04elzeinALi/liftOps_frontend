import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

export function useDriversList() {
  return useQuery({
    queryKey: ["drivers-list"],
    queryFn: () => fetchAllPages("/drivers"),
  });
}

export function useDrivers(page = 1) {
  return useQuery({
    queryKey: ["drivers", page],
    queryFn: async () => {
      const res = await api.get(`/drivers?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/drivers", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["drivers-list"] });
    },
  });
}

export function useUpdateDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/drivers/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["drivers-list"] });
      // A driver's name shows on Trips and the Payments "Collected By"
      // column — refresh those so a rename propagates.
      queryClient.invalidateQueries({ queryKey: ["trips"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
    },
  });
}

export function useDeleteDriver() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/drivers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
      queryClient.invalidateQueries({ queryKey: ["drivers-list"] });
    },
  });
}
