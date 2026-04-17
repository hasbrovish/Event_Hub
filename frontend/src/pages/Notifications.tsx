import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CheckCircle, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "@/hooks/useNotifications";

function relTime(iso: string): string {
  const sec = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (sec < 10) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 48) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function iconForType(t: string | null) {
  switch (t) {
    case "approved":
    case "rejected":
    case "modification":
      return CheckCircle;
    case "registration":
      return Calendar;
    case "new_event":
      return Info;
    default:
      return Bell;
  }
}

export default function Notifications() {
  const { isAuthenticated } = useAuth();
  const { data, isPending, isError } = useNotifications(1);
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Sign in to see notifications.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on events and approvals</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={markAll.isPending || !data?.items.length}
          onClick={() => markAll.mutate()}
        >
          Mark all read
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {isError && (
        <p className="text-sm text-destructive">Could not load notifications.</p>
      )}

      <div className="space-y-2">
        {data?.items.map((n) => {
          const Icon = iconForType(n.type);
          const title = n.title || n.body || "Notification";
          return (
            <Card
              key={n.id}
              className={`shadow-card border-border/60 transition-colors cursor-pointer ${!n.is_read ? "bg-primary/5 border-primary/20" : ""}`}
              onClick={() => {
                if (!n.is_read) markRead.mutate(n.id);
              }}
            >
              <CardContent className="p-4 flex items-start gap-3">
                <div
                  className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.is_read ? "bg-primary/10" : "bg-muted"}`}
                >
                  <Icon className={`h-4 w-4 ${!n.is_read ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${!n.is_read ? "font-medium" : ""}`}>{title}</p>
                  {n.body && n.title && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-xs text-muted-foreground mt-0.5">{relTime(n.created_at)}</p>
                </div>
                {!n.is_read && <Badge className="text-[10px] h-5">New</Badge>}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {data && data.items.length === 0 && !isPending && (
        <p className="text-sm text-muted-foreground">No notifications yet.</p>
      )}
    </div>
  );
}
