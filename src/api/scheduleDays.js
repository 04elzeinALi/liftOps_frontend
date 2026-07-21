import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

export function useScheduleDays(page = 1) {
  return useQuery({
    queryKey: ["schedule-days", page],
    queryFn: async () => {
      const res = await api.get(`/schedule-days?page=${page}`);
      return res.data;
    },
  });
}

export function useCreateScheduleDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/schedule-days", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-days"] });
    },
  });
}

export function useUpdateScheduleDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/schedule-days/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-days"] });
    },
  });
}

export function useDeleteScheduleDay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/schedule-days/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["schedule-days"] });
    },
  });
}
