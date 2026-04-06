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
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  Calendar,
  CalendarDays,
  ChevronRight,
  Clock,
  Globe,
  Heart,
  Laptop,
  LayoutGrid,
  List,
  MapPin,
  PartyPopper,
  Play,
  Rocket,
  Star,
  Trophy,
  Users,
  Zap,
} from "lucide-react";

const categories = ["all", "tech", "domain", "health", "fun", "product"] as const;

const categoryConfig: Record<
  (typeof categories)[number],
  { label: string; icon: typeof Laptop }
> = {
  all: { label: "All events", icon: LayoutGrid },
  tech: { label: "Technology", icon: Laptop },
  domain: { label: "Domain", icon: Globe },
  health: { label: "Health", icon: Heart },
  fun: { label: "Fun", icon: PartyPopper },
  product: { label: "Product", icon: Rocket },
};

function matchesSearch(q: string, text: string) {
  return text.toLowerCase().includes(q.trim().toLowerCase());
}

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
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
            <li key={e.id}>
              <button
                type="button"
                className={cn(
                  "w-full text-left rounded-xl border border-border/60 bg-card p-4 sm:p-5",
                  "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
                  "hover:bg-muted/40 hover:border-primary/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  "transition-all shadow-sm hover:shadow-md",
                )}
                onClick={() => navigate(`/event/${e.id}`)}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="font-semibold text-base leading-snug">{e.title}</p>
                  <div className="flex flex-col sm:flex-row sm:flex-wrap gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                      {e.time}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 shrink-0 text-primary/80" aria-hidden />
                      <span className="truncate">{e.location}</span>
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 sm:pl-4 border-t sm:border-t-0 border-border/50 pt-3 sm:pt-0">
                  <span className="text-sm text-muted-foreground tabular-nums whitespace-nowrap">{e.duration}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                      {e.attendees}/{e.maxAttendees}
                    </span>
                    <div className="w-20 sm:w-28 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[hsl(174_62%_38%)] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden />
                  </div>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    );

  const watchingCount = live ? live.attendees : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      <Card className="border-0 shadow-elevated overflow-hidden text-primary-foreground">
        <CardContent
          className="p-6 sm:p-8 bg-gradient-to-r from-[hsl(174_55%_38%)] via-[hsl(190_50%_32%)] to-[hsl(215_45%_22%)]"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                {greetingWord()}, welcome back, John! <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm opacity-90">
                You have {myUpcoming.length} upcoming session{myUpcoming.length !== 1 ? "s" : ""}
                {live ? " and 1 event is live right now." : "."}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full h-10 px-5 bg-white/95 text-[hsl(215_45%_22%)] border-0 shadow-md hover:bg-white gap-2"
                  onClick={() => toast({ title: "My interests", description: "Pick topics you care about (demo)." })}
                >
                  <Heart className="h-4 w-4 text-rose-500" />
                  My interests
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="rounded-full h-10 px-5 bg-white/95 text-[hsl(215_45%_22%)] border-0 shadow-md hover:bg-white gap-2"
                  onClick={() => navigate("/calendar")}
                >
                  <Calendar className="h-4 w-4 text-[hsl(174_55%_36%)]" />
                  My calendar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0">
              <div className="rounded-xl bg-black/20 border border-white/15 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold">{upcomingCount}</p>
                <p className="text-xs opacity-85 mt-1">Upcoming</p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/15 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold">{registeredCount}</p>
                <p className="text-xs opacity-85 mt-1">Registered</p>
              </div>
              <div className="rounded-xl bg-black/20 border border-white/15 backdrop-blur-sm p-4 text-center">
                <p className="text-2xl font-bold">{liveEvents.length}</p>
                <p className="text-xs opacity-85 mt-1">Live now</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-card border-border/60 hover:shadow-md transition-shadow cursor-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-[hsl(174_55%_42%)]/15 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-[hsl(174_55%_36%)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60 hover:shadow-md transition-shadow cursor-default">
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
        <Card className="shadow-card border-border/60 hover:shadow-md transition-shadow cursor-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-amber-500/20 flex items-center justify-center shrink-0">
              <Star className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{registeredCount}</p>
              <p className="text-xs text-muted-foreground">Registered</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60 hover:shadow-md transition-shadow cursor-default">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-950/15 dark:bg-blue-400/15 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-blue-800 dark:text-blue-300" />
            </div>
            <div>
              <p className="text-2xl font-bold">2300+</p>
              <p className="text-xs text-muted-foreground">Community</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {live && (
        <div
          className={cn(
            "rounded-xl border border-rose-200/90 dark:border-rose-900/40 bg-rose-50/95 dark:bg-rose-950/25",
            "shadow-card overflow-hidden border-l-4 border-l-destructive pl-1",
          )}
        >
          <div className="p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-6">
            <div className="flex gap-4 min-w-0 flex-1">
              <div className="shrink-0 flex flex-col items-center gap-2 pt-0.5">
                <div
                  className="h-11 w-11 rounded-full bg-destructive/15 flex items-center justify-center ring-2 ring-destructive/25"
                  aria-hidden
                >
                  <Play className="h-5 w-5 text-destructive fill-destructive translate-x-0.5" />
                </div>
              </div>
              <div className="min-w-0 space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-destructive text-destructive-foreground gap-1.5 font-semibold">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
                    </span>
                    LIVE
                  </Badge>
                  <span className="text-sm font-medium text-destructive">{watchingCount} watching</span>
                </div>
                <h2 className="text-xl font-bold text-foreground leading-tight">{live.title}</h2>
                <p className="text-sm text-muted-foreground">
                  by {live.speaker.name} · {live.location}
                </p>
              </div>
            </div>
            <Button
              type="button"
              className="gap-2 shrink-0 w-full lg:w-auto h-11 rounded-lg bg-[hsl(174_62%_28%)] hover:bg-[hsl(174_62%_24%)] text-primary-foreground shadow-md"
              onClick={onJoinLive}
            >
              Join now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <Tabs value={audienceTab} onValueChange={setAudienceTab} className="space-y-4">
        <TabsList className="flex w-full max-w-2xl h-auto p-0 bg-transparent rounded-none border-b border-border gap-0 justify-start">
          <TabsTrigger
            value="schedule"
            className={cn(
              "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
              "data-[state=active]:shadow-none px-4 py-3 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium",
            )}
          >
            <CalendarDays className="h-4 w-4 shrink-0" />
            My schedule
          </TabsTrigger>
          <TabsTrigger
            value="foryou"
            className={cn(
              "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
              "data-[state=active]:shadow-none px-4 py-3 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium",
            )}
          >
            <Star className="h-4 w-4 shrink-0" />
            For you
          </TabsTrigger>
          <TabsTrigger
            value="speakers"
            className={cn(
              "rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent",
              "data-[state=active]:shadow-none px-4 py-3 gap-2 text-muted-foreground data-[state=active]:text-foreground font-medium",
            )}
          >
            <Trophy className="h-4 w-4 shrink-0" />
            Top speakers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="schedule" className="mt-0 focus-visible:outline-none">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5 space-y-4">
              {scheduleRows(myUpcoming)}
              <div className="flex justify-center pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 gap-1.5 text-primary font-medium"
                  onClick={() => navigate("/calendar")}
                >
                  View full calendar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="foryou" className="mt-0 focus-visible:outline-none">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5 space-y-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4 text-amber-500 shrink-0" />
                Picked for you based on your activity.
              </p>
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
              {forYouEvents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">You&apos;re registered for everything we&apos;d suggest — nice!</p>
              )}
              <div className="flex justify-center pt-2 border-t border-border/50">
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 gap-1.5 text-primary font-medium"
                  onClick={() => navigate("/calendar")}
                >
                  View full calendar
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="speakers" className="mt-0 focus-visible:outline-none">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5 space-y-3">
              {topSpeakers.map((s, i) => (
                <button
                  key={s.name}
                  type="button"
                  className={cn(
                    "w-full flex items-center justify-between gap-3 rounded-xl border border-border/60 p-4 text-left",
                    "hover:bg-muted/50 hover:border-primary/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors",
                  )}
                  onClick={() => {
                    toast({ title: s.name, description: "Speaker profile (demo)." });
                  }}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-amber-500/15 flex items-center justify-center shrink-0">
                      <Trophy className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold">
                        #{i + 1} {s.name}
                      </p>
                      <p className="text-sm text-muted-foreground">{s.title}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="tabular-nums">
                      {s.sessions} sessions
                    </Badge>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <section className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-6 w-6 text-[hsl(174_55%_38%)] shrink-0" />
            Browse events
          </h2>
          <Button type="button" variant="link" className="h-auto p-0 gap-1 text-primary self-start sm:self-auto" onClick={() => navigate("/calendar")}>
            View full calendar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => {
              const { label, icon: Icon } = categoryConfig[cat];
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium border transition-all",
                    active
                      ? "bg-primary text-primary-foreground border-primary shadow-sm"
                      : "bg-card border-border/80 text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  <Icon className={cn("h-4 w-4 shrink-0", active ? "opacity-95" : "opacity-70")} />
                  {label}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border/60 p-0.5 bg-muted/30">
            <Button
              type="button"
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-md"
              onClick={() => setViewMode("grid")}
              aria-label="Grid view"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === "list" ? "default" : "ghost"}
              size="icon"
              className="h-9 w-9 rounded-md"
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
