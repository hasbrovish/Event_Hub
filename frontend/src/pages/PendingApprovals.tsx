import { ClipboardList } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { PendingApprovalQueue } from "@/components/PendingApprovalQueue";
import { usePendingApprovals, userCanReviewApprovals } from "@/hooks/useApprovals";

export default function PendingApprovals() {
  const { user, isAuthenticated } = useAuth();
  const canReview = userCanReviewApprovals(user);
  const { data, isPending, isError, refetch } = usePendingApprovals(user);

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold">Pending approvals</h1>
        <p className="text-sm text-muted-foreground mt-2">Sign in to review submitted events.</p>
      </div>
    );
  }

  if (!canReview) {
    return (
      <div className="p-6 max-w-3xl mx-auto animate-fade-in">
        <h1 className="text-2xl font-bold">Pending approvals</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Your account needs the organizer, admin, or platform_admin role to use this queue.
        </p>
      </div>
    );
  }

  const items = data?.items ?? [];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ClipboardList className="h-7 w-7 text-primary" />
          Pending approvals
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Events submitted for governance review. Approve to publish, reject, or request changes.
        </p>
      </div>

      <PendingApprovalQueue
        items={items}
        isPending={isPending}
        isError={isError}
        onRefetch={() => void refetch()}
      />
    </div>
  );
}
