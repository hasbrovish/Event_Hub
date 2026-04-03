import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockEvents } from "@/data/mockEvents";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSearchQuery } from "@/contexts/SearchContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Calendar, Heart, LayoutGrid, List, Sparkles, Star, Users, Zap } from "lucide-react";

const categories = ["all", "tech", "domain", "health", "fun", "product"] as const;
const categoryLabels: Record<string, string> = {
  all: "All Events",
  tech: "Technology",
  domain: "Domain",
  health: "Health",
  fun: "Fun",
  product: "Product",
};

function matchesSearch(q: string, text: string) {
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}

export default function AudienceHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { searchQuery } = useSearchQuery();
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [audienceTab, setAudienceTab] = useState("schedule");
  const [registered, setRegistered] = useState<Record<string, boolean>>(() => {
    const init: Record<string, boolean> = {};
    mockEvents.forEach((e) => {
      if (e.isRegistered) init[e.id] = true;
    });
    return init;
  });

  const liveEvents = mockEvents.filter((e) => e.status === "live");
  const upcomingCount = mockEvents.filter((e) => e.status === "upcoming").length;
  const registeredCount = Object.values(registered).filter(Boolean).length;
  const live = liveEvents[0];

  const filteredEvents = useMemo(() => {
    let list = activeCategory === "all" ? mockEvents : mockEvents.filter((e) => e.category === activeCategory);
    const q = searchQuery.trim();
    if (q) {
      list = list.filter(
        (e) =>
          matchesSearch(q, e.title) ||
          matchesSearch(q, e.description) ||
          matchesSearch(q, e.speaker.name),
      );
    }
    return list;
  }, [activeCategory, searchQuery]);

  const myUpcoming = useMemo(
    () =>
      mockEvents.filter(
        (e) => registered[e.id] && (e.status === "upcoming" || e.status === "live"),
      ),
    [registered],
  );

  const topSpeakers = useMemo(() => {
    const map = new Map<string, { name: string; title: string; sessions: number }>();
    mockEvents.forEach((e) => {
      const cur = map.get(e.speaker.name) || { name: e.speaker.name, title: e.speaker.title, sessions: 0 };
      cur.sessions += 1;
      map.set(e.speaker.name, cur);
    });
    return [...map.values()].sort((a, b) => b.sessions - a.sessions).slice(0, 5);
  }, []);

  const forYouEvents = useMemo(
    () => mockEvents.filter((e) => e.status === "upcoming" && !registered[e.id]).slice(0, 6),
    [registered],
  );

  const toggleRegister = (id: string) => {
    const next = !registered[id];
    setRegistered((r) => ({ ...r, [id]: next }));
    const ev = mockEvents.find((e) => e.id === id);
    toast({
      title: next ? "Registered" : "Registration removed",
      description: ev
        ? next
          ? `You are registered for "${ev.title}".`
          : `Removed registration for "${ev.title}".`
        : undefined,
    });
  };

  const onJoinLive = () => {
    if (!live) return;
    toast({ title: "Joining live session", description: live.title });
    navigate(`/event/${live.id}`);
  };

  const scheduleRows = (events: typeof myUpcoming) =>
    events.length === 0 ? (
      <p className="text-sm text-muted-foreground py-4">Nothing here yet — register for events below.</p>
    ) : (
      <ul className="space-y-3">
        {events.map((e) => {
          const pct = Math.round((e.attendees / e.maxAttendees) * 100);
          return (
            <li
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 p-4 hover:bg-muted/30 cursor-pointer transition-colors"
              onClick={() => navigate(`/event/${e.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(ev) => ev.key === "Enter" && navigate(`/event/${e.id}`)}
            >
              <div>
                <p className="font-semibold">{e.title}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {e.time} · {e.location} · {e.duration}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs text-muted-foreground tabular-nums">
                  {e.attendees}/{e.maxAttendees}
                </span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      <Card className="border-0 shadow-elevated overflow-hidden bg-[hsl(174_62%_28%)] text-primary-foreground">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <p className="text-sm opacity-90">{greeting()}</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex flex-wrap items-center gap-2">
                Welcome back, John! <Sparkles className="h-8 w-8 opacity-95" />
              </h1>
              <p className="text-sm opacity-90">
                You have {myUpcoming.length} upcoming session{myUpcoming.length !== 1 ? "s" : ""}
                {live ? " and 1 event is live right now." : "."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => toast({ title: "My interests", description: "Interest preferences (demo)." })}
                >
                  My interests
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => navigate("/calendar")}
                >
                  My calendar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-4 text-center">
                <p className="text-2xl font-bold">{upcomingCount}</p>
                <p className="text-xs opacity-80 mt-1">Upcoming</p>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-4 text-center">
                <p className="text-2xl font-bold">{registeredCount}</p>
                <p className="text-xs opacity-80 mt-1">Registered</p>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-4 text-center">
                <p className="text-2xl font-bold">{liveEvents.length}</p>
                <p className="text-xs opacity-80 mt-1">Live now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
              <Zap className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveEvents.length}</p>
              <p className="text-xs text-muted-foreground">Live now</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">{registeredCount}</p>
              <p className="text-xs text-muted-foreground">Registered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">2300+</p>
              <p className="text-xs text-muted-foreground">Community</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {live && (
        <Card className="border-rose-200/80 dark:border-rose-900/50 bg-rose-50/90 dark:bg-rose-950/30 shadow-card overflow-hidden">
          <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-2">
              <Badge className="bg-destructive text-destructive-foreground gap-1 w-fit">
                <span className="h-1.5 w-1.5 rounded-full bg-primary-foreground animate-pulse" />
                LIVE · {live.attendees} watching
              </Badge>
              <h2 className="text-xl font-bold text-foreground">{live.title}</h2>
              <p className="text-sm text-muted-foreground">by {live.speaker.name}</p>
              <p className="text-sm text-muted-foreground">{live.location}</p>
            </div>
            <Button
              type="button"
              className="gap-2 shrink-0 bg-[hsl(174_62%_28%)] hover:bg-[hsl(174_62%_24%)] text-primary-foreground"
              onClick={onJoinLive}
            >
              Join now <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      )}

      <Tabs value={audienceTab} onValueChange={setAudienceTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3 h-11">
          <TabsTrigger value="schedule">My schedule</TabsTrigger>
          <TabsTrigger value="foryou">For you</TabsTrigger>
          <TabsTrigger value="speakers">Top speakers</TabsTrigger>
        </TabsList>
        <TabsContent value="schedule" className="mt-0">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5">
              <div className="flex justify-end mb-4">
                <Button type="button" variant="link" className="h-auto p-0 gap-1 text-primary" onClick={() => navigate("/calendar")}>
                  View full calendar <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              {scheduleRows(myUpcoming)}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="foryou" className="mt-0">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground mb-4">Picked for you based on your activity.</p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {forYouEvents.map((event, idx) => (
                  <div key={event.id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                    <EventCard
                      event={event}
                      registeredOverride={registered[event.id]}
                      onRegisterToggle={toggleRegister}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="speakers" className="mt-0">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5 space-y-3">
              {topSpeakers.map((s, i) => (
                <div
                  key={s.name}
                  className="flex items-center justify-between rounded-xl border border-border/60 p-4"
                >
                  <div>
                    <p className="font-semibold">
                      #{i + 1} {s.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{s.title}</p>
                  </div>
                  <Badge variant="secondary">{s.sessions} sessions</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Browse events</h2>
          <Button type="button" variant="link" className="h-auto p-0 gap-1 text-primary self-start sm:self-auto" onClick={() => navigate("/calendar")}>
            View full calendar <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Badge
                key={cat}
                variant={activeCategory === cat ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 transition-colors hover:bg-primary hover:text-primary-foreground"
                onClick={() => setActiveCategory(cat)}
              >
                {categoryLabels[cat]}
              </Badge>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-8 w-8"
              onClick={() => setViewMode("list")}
              aria-label="List view"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div
          className={
            viewMode === "grid"
              ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              : "flex flex-col gap-3"
          }
        >
          {filteredEvents.map((event, idx) => (
            <div key={event.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-fade-in">
              <EventCard
                event={event}
                registeredOverride={registered[event.id]}
                onRegisterToggle={toggleRegister}
              />
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Heart className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No events match your filters</p>
            <p className="text-sm">Try another category or clear search</p>
          </div>
        )}
      </section>
    </div>
  );
}
