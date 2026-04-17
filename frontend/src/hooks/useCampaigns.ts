import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { CampaignListResponse, CampaignOutApi } from "@/types/api";

export function useCampaigns(eventId?: string) {
  const params = new URLSearchParams({ page: "1", page_size: "50" });
  if (eventId) params.set("event_id", eventId);
  return useQuery({
    queryKey: ["campaigns", eventId ?? "all"],
    queryFn: () => apiFetch<CampaignListResponse>(`/campaigns?${params}`),
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      event_id: string;
      message: string;
      teams_channel_ids?: string[];
      viva_group_ids?: string[];
      infyme_banner?: boolean;
      scheduled_at?: string | null;
    }) =>
      apiFetch<CampaignOutApi>("/campaigns", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useSendCampaignNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<CampaignOutApi>(`/campaigns/${id}/send-now`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}

export function useDeleteCampaignDraft() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      apiFetch<void>(`/campaigns/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["campaigns"] });
    },
  });
}
