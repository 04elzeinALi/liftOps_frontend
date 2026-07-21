import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

export function useRoutes() {
  return useQuery({
    queryKey: ["routes-list"],
    queryFn: async () => {
      const res = await api.get("/routes?page=1");
      return res.data.data;
    },
  });
}
