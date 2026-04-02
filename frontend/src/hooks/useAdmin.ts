import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type {
  AccessMatrixResponseApi,
  AdminConfigResponseApi,
  AdminLogsResponseApi,
  AdminStatsApi,
} from "@/types/api";

export function useAdminStats(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: () => apiFetch<AdminStatsApi>("/admin/stats"),
    enabled,
  });
}

export function useAccessMatrix(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "access-matrix"],
    queryFn: () => apiFetch<AccessMatrixResponseApi>("/admin/access-matrix"),
    enabled,
  });
}

export function useAdminConfig(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "config"],
    queryFn: () => apiFetch<AdminConfigResponseApi>("/admin/config"),
    enabled,
  });
}

export function usePatchAdminConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (entries: { key: string; value: string }[]) =>
      apiFetch<AdminConfigResponseApi>("/admin/config", {
        method: "PATCH",
        body: JSON.stringify({ entries }),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["admin", "config"] });
      void qc.invalidateQueries({ queryKey: ["admin", "logs"] });
    },
  });
}

export function useAdminLogs(enabled: boolean) {
  return useQuery({
    queryKey: ["admin", "logs"],
    queryFn: () => apiFetch<AdminLogsResponseApi>("/admin/logs"),
    enabled,
    staleTime: 15_000,
  });
}
