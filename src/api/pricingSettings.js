import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

// Readable by any authenticated role — drivers and passengers need these
// numbers too, to preview a fare that matches what they'll actually be
// charged (see lib/fare.js). Only admins can write (see usePricingSettings
// below vs the update mutation, and the role:admin gate server-side).
export function usePricingSettings() {
  return useQuery({
    queryKey: ["pricing-settings"],
    queryFn: async () => {
      const res = await api.get("/pricing-settings");
      return res.data;
    },
    // These change rarely and every fare preview across the app depends on
    // them — no need to refetch on every window focus.
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePricingSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await api.put("/pricing-settings", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pricing-settings"] });
    },
  });
}
