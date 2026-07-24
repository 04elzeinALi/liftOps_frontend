import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

export function usePassengerActivity(id, date) {
  return useQuery({
    queryKey: ["passenger-activity", id, date],
    queryFn: async () => {
      const res = await api.get(`/passengers/${id}/activity?date=${date}`);
      return res.data;
    },
    enabled: Boolean(id && date),
  });
}

export function useDriverActivity(id, date) {
  return useQuery({
    queryKey: ["driver-activity", id, date],
    queryFn: async () => {
      const res = await api.get(`/drivers/${id}/activity?date=${date}`);
      return res.data;
    },
    enabled: Boolean(id && date),
  });
}
