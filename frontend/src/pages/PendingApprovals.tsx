import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, ClipboardList, ExternalLink, MessageSquareWarning, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { usePendingApprovals, useReviewApprovalMutation, userCanReviewApprovals } from "@/hooks/useApprovals";

type ReviewKind = "reject" | "request_modification";

export default function PendingApprovals() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const canReview = userCanReviewApprovals(user);
  const { data, isPending, isError, refetch } = usePendingApprovals(user);
  const reviewMut = useReviewApprovalMutation();

  const [dialog, setDialog] = useState<{
    approvalId: number;
    eventTitle: string;
    kind: ReviewKind;
  } | null>(null);
  const [comment, setComment] = useState("");

  const closeDialog = () => {
    setDialog(null);
    setComment("");
  };

  const submitDialog = () => {
    if (!dialog) return;
    const decision = dialog.kind === "reject" ? "reject" : "request_modification";
    reviewMut.mutate(
      { approvalId: dialog.approvalId, decision, review_comment: comment || null },
      {
        onSuccess: () => {
          toast({
            title: decision === "reject" ? "Event rejected" : "Sent back for changes",
          });
          closeDialog();
        },
        onError: (err) =>
          toast({
            title: "Action failed",
            description: err instanceof Error ? err.message : "Error",
            variant: "destructive",
          }),
      },
    );
  };

  const approve = (approvalId: number) => {
    reviewMut.mutate(
      { approvalId, decision: "approve" },
      {
        onSuccess: () => toast({ title: "Event approved and published" }),
        onError: (err) =>
          toast({
            title: "Could not approve",
            description: err instanceof Error ? err.message : "Error",
            variant: "destructive",
          }),
      },
    );
  };

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-primary" />
            Pending approvals
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Events submitted for governance review. Approve to publish, reject, or request changes.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => void refetch()} disabled={isPending}>
          Refresh
        </Button>
      </div>

      {isError && (
        <p className="text-sm text-destructive">Could not load the queue. Check the API and try Refresh.</p>
      )}

      {isPending && <p className="text-sm text-muted-foreground">Loading queue…</p>}

      {!isPending && !isError && items.length === 0 && (
        <Card className="shadow-card border-border/60">
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            No events awaiting approval. When speakers submit drafts, they will appear here.
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {items.map((row) => (
          <Card key={row.approval_id} className="shadow-card border-border/60">
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-sm">{row.event_title}</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {row.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Requested{" "}
                    {new Date(row.requested_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </p>
                </div>
                <Button variant="outline" size="sm" className="shrink-0 gap-1" asChild>
                  <Link to={`/event/${row.event_id}`}>
                    <ExternalLink className="h-3.5 w-3.5" />
                    View event
                  </Link>
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  size="sm"
                  className="gap-1"
                  disabled={reviewMut.isPending}
                  onClick={() => approve(row.approval_id)}
                >
                  <Check className="h-3.5 w-3.5" />
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  disabled={reviewMut.isPending}
                  onClick={() =>
                    setDialog({
                      approvalId: row.approval_id,
                      eventTitle: row.event_title,
                      kind: "request_modification",
                    })
                  }
                >
                  <MessageSquareWarning className="h-3.5 w-3.5" />
                  Request changes
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  className="gap-1"
                  disabled={reviewMut.isPending}
                  onClick={() =>
                    setDialog({ approvalId: row.approval_id, eventTitle: row.event_title, kind: "reject" })
                  }
                >
                  <X className="h-3.5 w-3.5" />
                  Reject
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialog !== null} onOpenChange={(o) => !o && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.kind === "reject" ? "Reject event" : "Request changes"}
            </DialogTitle>
            <p className="text-sm text-muted-foreground pt-1">{dialog?.eventTitle}</p>
          </DialogHeader>
          <Textarea
            placeholder="Optional note to the organizer / speaker…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="resize-none"
          />
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              variant={dialog?.kind === "reject" ? "destructive" : "default"}
              onClick={submitDialog}
              disabled={reviewMut.isPending}
            >
              {dialog?.kind === "reject" ? "Reject" : "Send back"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
