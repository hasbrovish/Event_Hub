import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { PreferenceOutApi } from "@/types/api";

export function usePreferences() {
  return useQuery({
    queryKey: ["preferences"],
    queryFn: () => apiFetch<PreferenceOutApi>("/preferences"),
  });
}

export type PreferencePatch = Partial<{
  event_types: string[];
  interests: string[];
  notification_frequency: string;
  notification_mechanisms: string[];
  notification_times: string[];
  notify_on_login: boolean;
  followed_group_ids: number[];
}>;

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: PreferencePatch) =>
      apiFetch<PreferenceOutApi>("/preferences", {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["preferences"] });
      void qc.invalidateQueries({ queryKey: ["recommendations"] });
    },
  });
}
