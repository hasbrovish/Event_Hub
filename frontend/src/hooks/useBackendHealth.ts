import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type HealthResponse = {
  status: string;
  db: string;
  version: string;
};

export function useBackendHealth(pollMs = 60_000) {
  return useQuery({
    queryKey: ["backend", "health"],
    queryFn: () => apiFetch<HealthResponse>("/health"),
    staleTime: 15_000,
    refetchInterval: pollMs,
    retry: 1,
  });
}
