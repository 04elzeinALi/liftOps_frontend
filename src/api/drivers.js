import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function useDriversList() {
  return useQuery({
    queryKey: ["drivers-list"],
    queryFn: async () => {
      const res = await api.get("/drivers?page=1");
      return res.data.data;
    },
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
