import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { EventDetailApi, EventListResponse } from "@/types/api";

export function useEvents(params: {
  category?: string;
  status?: string;
  page?: number;
  page_size?: number;
}) {
  const sp = new URLSearchParams();
  if (params.category && params.category !== "all") sp.set("category", params.category);
  if (params.status && params.status !== "all") sp.set("status", params.status);
  sp.set("page", String(params.page ?? 1));
  sp.set("page_size", String(params.page_size ?? 50));
  const q = sp.toString();

  return useQuery({
    queryKey: ["events", q],
    queryFn: () => apiFetch<EventListResponse>(`/events?${q}`),
    staleTime: 20_000,
  });
}

export function useEventDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["events", id],
    queryFn: () => apiFetch<EventDetailApi>(`/events/${id}`),
    enabled: !!id,
    staleTime: 20_000,
  });
}

export function useMySessions(
  params: { status?: string; page?: number; page_size?: number },
  enabled: boolean,
) {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "all") sp.set("status", params.status);
  sp.set("page", String(params.page ?? 1));
  sp.set("page_size", String(params.page_size ?? 100));
  const q = sp.toString();

  return useQuery({
    queryKey: ["events", "my-sessions", q],
    queryFn: () => apiFetch<EventListResponse>(`/events/my-sessions?${q}`),
    enabled,
    staleTime: 20_000,
  });
}
