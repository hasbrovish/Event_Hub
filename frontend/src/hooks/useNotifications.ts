import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { NotificationListResponse, UnreadCountResponse } from "@/types/api";

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ["notifications", page],
    queryFn: () =>
      apiFetch<NotificationListResponse>(`/notifications?page=${page}&page_size=40`),
  });
}

export function useUnreadNotificationCount(enabled: boolean) {
  return useQuery({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => apiFetch<UnreadCountResponse>("/notifications/unread-count"),
    enabled,
    refetchInterval: enabled ? 45_000 : false,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/notifications/${id}/read`, { method: "PATCH" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch<void>("/notifications/read-all", { method: "PATCH" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
