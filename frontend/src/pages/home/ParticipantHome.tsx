import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mockEvents } from "@/data/mockEvents";
import { DEMO_USER } from "@/data/participantProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { DiscoverSection } from "@/pages/home/DiscoverSection";
import { SpeakSection } from "@/pages/home/SpeakSection";
import {
  ArrowRight,
  Calendar,
  Compass,
  Heart,
  Mic,
  Play,
  Plus,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";

const proposals = [
  { id: "p1", title: "GraphQL vs REST", status: "approved" as const, votes: 12 },
  { id: "p2", title: "Kubernetes for Developers", status: "pending" as const, votes: 8 },
  { id: "p3", title: "Web Performance Optimization", status: "revision" as const, votes: 5 },
];

function greetingWord() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function ParticipantHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mainTab, setMainTab] = useState<"discover" | "speak">("discover");
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
  const mySessions = mockEvents.filter((e) => DEMO_USER.electedSpeakerEventIds.has(e.id));

  const counts = useMemo(() => {
    const pending = proposals.filter((p) => p.status === "pending").length;
    return { pending };
  }, []);

  const heroStats = [
    { value: upcomingCount, label: "Upcoming" },
    { value: registeredCount, label: "Registered" },
    { value: liveEvents.length, label: "Live now" },
    { value: mySessions.length, label: "My sessions" },
  ];

  const kpiCards = [
    {
      icon: Calendar,
      value: upcomingCount,
      label: "Upcoming events",
      iconWrap: "bg-[hsl(174_55%_42%)]/15 text-[hsl(174_55%_36%)]",
    },
    {
      icon: Zap,
      value: liveEvents.length,
      label: "Live now",
      iconWrap: "bg-red-500/15 text-red-600 dark:text-red-400",
    },
    {
      icon: Star,
      value: registeredCount,
      label: "Registered",
      iconWrap: "bg-amber-500/20 text-amber-600 dark:text-amber-500",
    },
    {
      icon: Mic,
      value: mySessions.length,
      label: "My sessions",
      iconWrap: "bg-primary/10 text-primary",
    },
  ];

  const myUpcoming = useMemo(
    () =>
      mockEvents.filter(
        (e) => registered[e.id] && (e.status === "upcoming" || e.status === "live"),
      ),
    [registered],
  );

  const onJoinLive = () => {
    if (!live) return;
    toast({ title: "Joining live session", description: live.title });
    navigate(`/event/${live.id}`);
  };

  const watchingCount = live ? live.attendees : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in pb-16">
      <Card className="border-0 shadow-elevated overflow-hidden text-primary-foreground">
        <CardContent className="p-6 sm:p-8 bg-gradient-to-r from-[hsl(174_55%_38%)] via-[hsl(190_50%_32%)] to-[hsl(215_45%_22%)]">
          <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs uppercase tracking-wider opacity-85 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Your event hub
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                {greetingWord()}, welcome back, John! <span className="inline-block">👋</span>
              </h1>
              <p className="text-sm opacity-90">
                {myUpcoming.length} upcoming in your schedule
                {live ? ", 1 live now" : ""} · {mySessions.length} session{mySessions.length !== 1 ? "s" : ""}{" "}
                you&apos;re hosting · {counts.pending} proposal{counts.pending !== 1 ? "s" : ""} awaiting review
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  className="rounded-full h-10 px-5 bg-white/95 text-[hsl(215_45%_22%)] border-0 shadow-md hover:bg-white gap-2"
                  onClick={() => navigate("/create-event")}
                >
                  <Plus className="h-4 w-4" />
                  Propose event
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
                  variant="outline"
                  className="rounded-full h-10 px-5 border-white/40 bg-white/10 text-primary-foreground hover:bg-white/20 gap-2"
                  onClick={() => navigate("/my-sessions")}
                >
                  <Mic className="h-4 w-4" />
                  My sessions
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0 w-full xl:max-w-xl">
              {heroStats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-xl bg-black/20 border border-white/15 backdrop-blur-sm px-3 py-3.5 sm:p-4 text-center ring-1 ring-white/5"
                >
                  <p className="text-xl sm:text-2xl font-bold tabular-nums tracking-tight">{s.value}</p>
                  <p className="text-[10px] sm:text-xs opacity-85 mt-1 font-medium">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
        {kpiCards.map(({ icon: Icon, value, label, iconWrap }) => (
          <Card
            key={label}
            className="shadow-card border-border/60 hover:border-primary/20 hover:shadow-md transition-all duration-200"
          >
            <CardContent className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
              <div className={cn("h-11 w-11 rounded-xl flex items-center justify-center shrink-0", iconWrap)}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold tabular-nums tracking-tight">{value}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-0.5">{label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
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

      <Tabs value={mainTab} onValueChange={(v) => setMainTab(v as typeof mainTab)} className="space-y-6">
        <TabsList className="sticky top-0 z-10 flex w-full h-auto p-1 bg-muted/80 backdrop-blur-md border border-border/60 rounded-xl sm:inline-flex sm:w-auto">
          <TabsTrigger
            value="discover"
            className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm flex-1 sm:flex-none"
          >
            <Compass className="h-4 w-4 shrink-0" />
            Discover and attend
          </TabsTrigger>
          <TabsTrigger value="speak" className="gap-2 rounded-lg px-4 py-2.5 data-[state=active]:shadow-sm flex-1 sm:flex-none">
            <Mic className="h-4 w-4 shrink-0" />
            Speak and propose
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-0 focus-visible:outline-none animate-fade-in">
          <DiscoverSection registered={registered} setRegistered={setRegistered} />
        </TabsContent>

        <TabsContent value="speak" className="mt-0 focus-visible:outline-none animate-fade-in">
          <SpeakSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}
