import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockEvents, type EventData } from "@/data/mockEvents";
import { DEMO_USER } from "@/data/participantProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  Clock,
  MapPin,
  Mic,
  Search,
  Sparkles,
  Users,
} from "lucide-react";

function electedSessions(): EventData[] {
  return mockEvents.filter((e) => DEMO_USER.electedSpeakerEventIds.has(e.id));
}

function filterPhase(tab: string, e: EventData): boolean {
  if (tab === "all") return true;
  if (tab === "upcoming") return e.status === "upcoming";
  if (tab === "live") return e.status === "live";
  if (tab === "past") return e.status === "completed";
  return true;
}

function matchesQuery(e: EventData, q: string): boolean {
  if (!q) return true;
  return (
    e.title.toLowerCase().includes(q) ||
    e.location.toLowerCase().includes(q) ||
    e.speaker.name.toLowerCase().includes(q)
  );
}

export default function MySessions() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");

  const sessions = useMemo(() => electedSessions(), []);
  const q = query.trim().toLowerCase();

  const tabKeys = ["all", "upcoming", "live", "past"] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <Mic className="h-7 w-7" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My sessions</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-lg">
            Sessions where you were <span className="font-medium text-foreground">elected as speaker</span>. Only these
            appearances are listed — not every event you attend.
          </p>
          <Badge variant="secondary" className="gap-1.5 w-fit font-normal">
            <Sparkles className="h-3 w-3" />
            {sessions.length} elected role{sessions.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <Button type="button" className="gap-2 shrink-0" onClick={() => navigate("/create-event")}>
          Propose new session
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search your speaker sessions..."
          className="pl-9 h-11 rounded-xl border-border/80 bg-card shadow-sm"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex w-full h-auto flex-wrap justify-start gap-1 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:shadow-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="rounded-lg data-[state=active]:shadow-sm">
            Upcoming
          </TabsTrigger>
          <TabsTrigger value="live" className="rounded-lg data-[state=active]:shadow-sm">
            Live
          </TabsTrigger>
          <TabsTrigger value="past" className="rounded-lg data-[state=active]:shadow-sm">
            Past
          </TabsTrigger>
        </TabsList>

        {tabKeys.map((tk) => (
          <TabsContent key={tk} value={tk} className="mt-0 space-y-3 focus-visible:outline-none">
            {sessions
              .filter((e) => filterPhase(tk, e))
              .filter((e) => matchesQuery(e, q))
              .map((e, idx) => {
                const pct = Math.round((e.attendees / e.maxAttendees) * 100);
                const statusBadge =
                  e.status === "live"
                    ? "bg-destructive/15 text-destructive border-destructive/30"
                    : e.status === "completed"
                      ? "bg-muted text-muted-foreground border-border"
                      : "bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 border-emerald-500/30";
                return (
                  <button
                    key={e.id}
                    type="button"
                    onClick={() => navigate(`/event/${e.id}`)}
                    className={cn(
                      "w-full text-left rounded-xl border border-border/70 bg-card shadow-card overflow-hidden",
                      "hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      "transition-all duration-200 animate-fade-in",
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <CardContent className="p-4 sm:p-5 space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                        <div className="flex gap-3 min-w-0">
                          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <Mic className="h-5 w-5 text-primary" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="font-semibold text-base leading-snug">{e.title}</p>
                            <p className="text-xs text-muted-foreground">
                              Listed as speaker: <span className="text-foreground font-medium">{e.speaker.name}</span>
                            </p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5 shrink-0" />
                                {new Date(e.date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5 shrink-0" />
                                {e.time} · {e.duration}
                              </span>
                              <span className="inline-flex items-center gap-1 min-w-0">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{e.location}</span>
                              </span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline" className={cn("shrink-0 capitalize border", statusBadge)}>
                          {e.status}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            Registration fill
                          </span>
                          <span className="tabular-nums">
                            {e.attendees} / {e.maxAttendees}
                          </span>
                        </div>
                        <Progress value={pct} className="h-2" />
                      </div>
                      <div className="flex justify-end pt-1">
                        <span className="text-sm font-medium text-primary inline-flex items-center gap-1">
                          View session
                          <ArrowRight className="h-4 w-4" />
                        </span>
                      </div>
                    </CardContent>
                  </button>
                );
              })}
            {sessions.filter((e) => filterPhase(tk, e)).filter((e) => matchesQuery(e, q)).length === 0 && (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="p-10 text-center text-muted-foreground text-sm space-y-2">
                  <p>No sessions here yet.</p>
                  <p className="text-xs">When you are elected as a speaker for an event, it will appear in this list.</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
