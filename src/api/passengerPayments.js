import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

// GET /payments already scopes to the caller's own cards for a passenger
// role (see PaymentController::index).
export function useMyPayments() {
  return useQuery({
    queryKey: ["my-payments"],
    queryFn: async () => {
      const res = await api.get("/payments");
      return res.data.data;
    },
  });
}
