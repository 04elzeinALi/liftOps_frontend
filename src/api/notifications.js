import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/api/client";

// The signed-in person's own messages. The backend scopes every one of these
// to the caller, so there's no id to pass and no way to read anyone else's.
//
// Polled rather than pushed: there's no websocket in this app, and a shift
// being cancelled is the kind of thing someone should learn about without
// having to reload the page. A minute is frequent enough for that and cheap
// enough to ignore.
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await api.get("/notifications");
      return res.data;
    },
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await api.put(`/notifications/${id}/read`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await api.put("/notifications/read-all");
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
