import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, ClipboardList, ExternalLink, Loader2, Mic, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMySessions } from "@/hooks/useEvents";
import type { EventListItemApi } from "@/types/api";

function canViewMySessions(user: { roles: string[] } | null): boolean {
  return (
    user?.roles?.some((r) => ["speaker", "organizer", "admin", "platform_admin"].includes(r)) ?? false
  );
}

function tabForItem(status: string): "pipeline" | "active" | "done" {
  if (status === "pending" || status === "draft") return "pipeline";
  if (status === "upcoming" || status === "live") return "active";
  return "done";
}

const statusClass: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
  draft: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
  upcoming: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200",
  live: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200",
  completed: "bg-muted text-muted-foreground",
};

function EventRow({ ev }: { ev: EventListItemApi }) {
  const sc = statusClass[ev.status] ?? "bg-muted text-muted-foreground";
  return (
    <Card className="shadow-card border-border/60 hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Mic className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <p className="font-medium text-sm truncate">{ev.title}</p>
              <Badge variant="outline" className="text-[10px]">
                {ev.category}
              </Badge>
              <Badge className={`text-[10px] ${sc}`}>{ev.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(ev.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {ev.time} ·{" "}
              {ev.speaker.name}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Users className="h-3 w-3" />
              {ev.attendees} registered
              {ev.max_attendees ? ` / ${ev.max_attendees}` : ""}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-1 self-start sm:self-center" asChild>
          <Link to={`/event/${ev.id}`}>
            <ExternalLink className="h-3.5 w-3.5" />
            Open
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export default function ManageEvents() {
  const { user, isAuthenticated } = useAuth();
  const allowed = canViewMySessions(user);
  const { data, isPending, isError } = useMySessions({ status: "all", page_size: 100 }, isAuthenticated && allowed);

  const items = data?.items ?? [];
  const pipeline = items.filter((e) => tabForItem(e.status) === "pipeline");
  const active = items.filter((e) => tabForItem(e.status) === "active");
  const done = items.filter((e) => tabForItem(e.status) === "done");

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Sign in to manage events you create or speak at.</p>
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-2">
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <p className="text-sm text-muted-foreground">
          The speaker, organizer, admin, or platform_admin role is required for this view.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Manage Events</h1>
          <p className="text-sm text-muted-foreground">
            Sessions you organize or speak at — from <code className="text-xs">GET /events/my-sessions</code>
          </p>
        </div>
        <Button variant="outline" size="sm" className="gap-2 shrink-0" asChild>
          <Link to="/approvals">
            <ClipboardList className="h-4 w-4" />
            Approval queue
          </Link>
        </Button>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your sessions…
        </div>
      )}
      {isError && (
        <p className="text-sm text-destructive">Could not load sessions. Check that the API is running.</p>
      )}

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline" className="gap-1">
            Draft & pending
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {pipeline.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="active" className="gap-1">
            Active
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {active.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="done" className="gap-1">
            Completed
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
              {done.length}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="space-y-3 mt-4">
          {pipeline.length === 0 && !isPending ? (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4" /> No drafts or items awaiting approval.
            </p>
          ) : (
            pipeline.map((e) => <EventRow key={e.id} ev={e} />)
          )}
        </TabsContent>
        <TabsContent value="active" className="space-y-3 mt-4">
          {active.length === 0 && !isPending ? (
            <p className="text-sm text-muted-foreground">No upcoming or live sessions.</p>
          ) : (
            active.map((e) => <EventRow key={e.id} ev={e} />)
          )}
        </TabsContent>
        <TabsContent value="done" className="space-y-3 mt-4">
          {done.length === 0 && !isPending ? (
            <p className="text-sm text-muted-foreground">No completed sessions yet.</p>
          ) : (
            done.map((e) => <EventRow key={e.id} ev={e} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
