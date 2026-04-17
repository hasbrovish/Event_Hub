import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { GroupListResponseApi } from "@/types/api";

export function useGroupsList(enabled: boolean) {
  return useQuery({
    queryKey: ["groups", "list", "preferences"],
    queryFn: () => apiFetch<GroupListResponseApi>("/groups?page=1&page_size=200"),
    enabled,
    staleTime: 60_000,
  });
}
