import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";
import { fetchAllPages } from "@/api/fetchAll";

export function useTravelCardsList() {
  return useQuery({
    queryKey: ["travel-cards-list"],
    queryFn: () => fetchAllPages("/travel-cards"),
  });
}

export function usePaymentsSummary(period) {
  return useQuery({
    queryKey: ["payments-summary", period],
    queryFn: async () => {
      const res = await api.get(`/payments/summary?period=${period}`);
      return res.data;
    },
  });
}

// Returns EVERY payment for the period (day|week|month) as a flat array —
// the admin wants them all on a single page, not paginated. Pass null/"" for
// all payments regardless of date. Keyed under ["payments", ...] so the
// mutation invalidations below still refresh it.
export function usePayments(period = "day") {
  return useQuery({
    queryKey: ["payments", "list", period],
    queryFn: () => fetchAllPages(period ? `/payments?period=${period}` : "/payments"),
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.post("/payments", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      // The totals box (billed/received/by-driver) and card lists derive
      // from payments — refresh them too, or they'd show stale numbers.
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      queryClient.invalidateQueries({ queryKey: ["travel-cards"] });
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await api.put(`/payments/${id}`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      // The totals box (billed/received/by-driver) and card lists derive
      // from payments — refresh them too, or they'd show stale numbers.
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      queryClient.invalidateQueries({ queryKey: ["travel-cards"] });
    },
  });
}

export function useDeletePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(`/payments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      // The totals box (billed/received/by-driver) and card lists derive
      // from payments — refresh them too, or they'd show stale numbers.
      queryClient.invalidateQueries({ queryKey: ["payments-summary"] });
      queryClient.invalidateQueries({ queryKey: ["travel-cards"] });
    },
  });
}
