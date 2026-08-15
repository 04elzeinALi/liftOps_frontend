import { useQuery } from "@tanstack/react-query";
import api from "@/api/client";

// Reports are aggregated server-side and returned whole — there is no
// pagination to walk, because summing paginated pages in the browser is how
// you get a confidently wrong total.
//
// `params` is either { period } or { from, to }; the backend prefers an
// explicit range over a preset (see ReportWindow).
function useReport(name, params) {
  return useQuery({
    queryKey: ["report", name, params],
    queryFn: async () => {
      const search = new URLSearchParams(params).toString();
      const res = await api.get(`/reports/${name}?${search}`);
      return res.data;
    },
  });
}

export const useRevenueReport = (params) => useReport("revenue", params);
export const useDriverCashReport = (params) => useReport("driver-cash", params);
export const useFleetReport = (params) => useReport("fleet", params);

// The transactions behind one slice of the revenue report (one payment
// method, route, or card type) — same window params as useRevenueReport,
// plus which slice to drill into.
export function useRevenueDetail(dimension, value, params) {
  return useQuery({
    queryKey: ["report", "revenue-detail", dimension, value, params],
    queryFn: async () => {
      const search = new URLSearchParams({ ...params, dimension, value }).toString();
      const res = await api.get(`/reports/revenue/detail?${search}`);
      return res.data;
    },
    enabled: Boolean(dimension && value),
  });
}
