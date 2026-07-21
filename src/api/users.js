import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

export function useAvailableDriverUsers() {
  return useQuery({
    queryKey: ["available-driver-users"],
    queryFn: async () => {
      const res = await api.get("/users?page=1");
      return res.data.data;
    },
  });
}
