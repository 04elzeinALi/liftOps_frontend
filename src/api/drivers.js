import { useQuery } from "@tanstack/react-query";
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
