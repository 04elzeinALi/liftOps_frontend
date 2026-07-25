import { useQuery } from "@tanstack/react-query";
import { fetchAllPages } from "@/api/fetchAll";

// GET /payments already scopes to the caller's own cards for a passenger
// role (see PaymentController::index).
export function useMyPayments() {
  return useQuery({
    queryKey: ["my-payments"],
    queryFn: () => fetchAllPages("/payments"),
  });
}
