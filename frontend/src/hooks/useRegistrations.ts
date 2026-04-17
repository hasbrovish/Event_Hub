import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getStoredToken } from "@/lib/api";
import type { MyRegistrationsResponse, RegistrationActionResponse } from "@/types/api";

export function useMyRegistrations() {
  return useQuery({
    queryKey: ["registrations", "me"],
    queryFn: () => apiFetch<MyRegistrationsResponse>("/registrations/me"),
    enabled: !!getStoredToken(),
    staleTime: 15_000,
  });
}

export function useRegisterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiFetch<RegistrationActionResponse>(`/events/${eventId}/register`, {
        method: "POST",
        body: "{}",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["registrations", "me"] });
    },
  });
}

export function useUnregisterMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (eventId: string) =>
      apiFetch<RegistrationActionResponse>(`/events/${eventId}/register`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
      qc.invalidateQueries({ queryKey: ["registrations", "me"] });
    },
  });
}
