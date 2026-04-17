import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ExternalLink, Loader2, Mic, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMySessions } from "@/hooks/useEvents";
import type { EventListItemApi } from "@/types/api";

function allowed(user: { roles: string[] } | null): boolean {
  return (
    user?.roles?.some((r) => ["speaker", "organizer", "admin", "platform_admin"].includes(r)) ?? false
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  draft: "bg-slate-100 text-slate-700",
  upcoming: "bg-emerald-100 text-emerald-700",
  live: "bg-blue-100 text-blue-800",
  completed: "bg-muted text-muted-foreground",
};

function Row({ s }: { s: EventListItemApi }) {
  const cls = statusColors[s.status] ?? "bg-muted text-muted-foreground";
  return (
    <Card className="shadow-card border-border/60 hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Mic className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{s.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {new Date(s.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {s.attendees > 0 && (
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {s.attendees}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge className={cls}>{s.status}</Badge>
          <Button variant="ghost" size="sm" className="h-8 px-2" asChild>
            <Link to={`/event/${s.id}`}>
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MySessions() {
  const { user, isAuthenticated } = useAuth();
  const ok = allowed(user);
  const { data, isPending, isError } = useMySessions({ status: "all", page_size: 100 }, isAuthenticated && ok);

  const rows = data?.items ?? [];

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Sign in to see sessions you speak at or created.</p>
      </div>
    );
  }

  if (!ok) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-2">
        <h1 className="text-2xl font-bold">My Sessions</h1>
        <p className="text-sm text-muted-foreground">Requires speaker, organizer, admin, or platform_admin.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">My Sessions</h1>
        <p className="text-sm text-muted-foreground">Events you proposed or speak at</p>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}
      {isError && <p className="text-sm text-destructive">Could not load sessions.</p>}

      <div className="space-y-3">
        {!isPending && rows.length === 0 && <p className="text-sm text-muted-foreground">No sessions yet.</p>}
        {rows.map((s) => (
          <Row key={s.id} s={s} />
        ))}
      </div>
    </div>
  );
}
