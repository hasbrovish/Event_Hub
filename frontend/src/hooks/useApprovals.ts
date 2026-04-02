import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, getStoredToken } from "@/lib/api";
import type { ApprovalOutApi, ApprovalsPendingResponse, EmployeeMe } from "@/types/api";

export function userCanReviewApprovals(user: EmployeeMe | null): boolean {
  if (!user?.roles?.length) return false;
  return user.roles.some((r) => r === "organizer" || r === "admin" || r === "platform_admin");
}

export function usePendingApprovals(user: EmployeeMe | null) {
  const token = getStoredToken();
  const can = userCanReviewApprovals(user);
  return useQuery({
    queryKey: ["approvals", "pending"],
    queryFn: () => apiFetch<ApprovalsPendingResponse>("/approvals/pending"),
    enabled: !!token && can,
    staleTime: 10_000,
  });
}

export function useReviewApprovalMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (args: { approvalId: number; decision: string; review_comment?: string | null }) =>
      apiFetch<ApprovalOutApi>(`/approvals/${args.approvalId}`, {
        method: "PATCH",
        body: JSON.stringify({
          decision: args.decision,
          review_comment: args.review_comment?.trim() || null,
        }),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["approvals"] });
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });
}
