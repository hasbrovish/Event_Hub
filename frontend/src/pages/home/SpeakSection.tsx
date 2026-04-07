import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockEvents } from "@/data/mockEvents";
import { DEMO_USER } from "@/data/participantProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, MessageCircle, Mic, Plus, Star, Users } from "lucide-react";

const proposals = [
  { id: "p1", title: "GraphQL vs REST", status: "approved" as const, votes: 12 },
  { id: "p2", title: "Kubernetes for Developers", status: "pending" as const, votes: 8 },
  { id: "p3", title: "Web Performance Optimization", status: "revision" as const, votes: 5 },
];

const statusBadge = {
  approved: "bg-primary/15 text-primary border-primary/30",
  pending: "bg-amber-500/15 text-amber-800 dark:text-amber-200 border-amber-500/30",
  revision: "bg-destructive/10 text-destructive border-destructive/30",
};

const viewsData = [
  { day: "Mon", views: 120 },
  { day: "Tue", views: 180 },
  { day: "Wed", views: 150 },
  { day: "Thu", views: 220 },
  { day: "Fri", views: 280 },
  { day: "Sat", views: 190 },
  { day: "Sun", views: 240 },
];

const ratingData = [
  { name: "5★", value: 62, color: "hsl(174 62% 38%)" },
  { name: "4★", value: 24, color: "hsl(174 45% 50%)" },
  { name: "3★", value: 9, color: "hsl(200 40% 55%)" },
  { name: "2★", value: 3, color: "hsl(220 30% 60%)" },
  { name: "1★", value: 2, color: "hsl(0 40% 60%)" },
];

type ProposalStatus = (typeof proposals)[number]["status"];

export function SpeakSection() {
  const navigate = useNavigate();
  const [proposalTab, setProposalTab] = useState<"all" | ProposalStatus>("all");
  const mySessions = mockEvents.filter((e) => DEMO_USER.electedSpeakerEventIds.has(e.id));

  const counts = useMemo(() => {
    const all = proposals.length;
    const approved = proposals.filter((p) => p.status === "approved").length;
    const pending = proposals.filter((p) => p.status === "pending").length;
    const revision = proposals.filter((p) => p.status === "revision").length;
    return { all, approved, pending, revision };
  }, []);

  return (
    <div className="space-y-6 w-full">
      <Card className="shadow-card border-border/60 border-primary/15 bg-primary/[0.03]">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium flex items-center gap-2">
              <Mic className="h-4 w-4 text-primary" />
              Grow your speaking footprint
            </p>
            <p className="text-sm text-muted-foreground">
              Submit a new idea or open your session list — everything stays linked to this hub.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <Button type="button" className="gap-2" onClick={() => navigate("/create-event")}>
              <Plus className="h-4 w-4" />
              Propose new event
            </Button>
            <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/my-sessions")}>
              My sessions
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg">Upcoming sessions</CardTitle>
          <Button type="button" variant="link" className="h-auto p-0 gap-1 text-primary" onClick={() => navigate("/my-sessions")}>
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {mySessions.map((e) => (
            <div
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-border/60 p-4"
            >
              <div className="flex gap-3 min-w-0">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Mic className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{e.title}</p>
                    <Badge
                      variant="outline"
                      className={
                        e.status === "live"
                          ? "border-destructive/50 text-destructive bg-destructive/10"
                          : "border-emerald-500/50 text-emerald-700 dark:text-emerald-300 bg-emerald-500/10"
                      }
                    >
                      {e.status === "live" ? "Live" : "Upcoming"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {e.date} · {e.time} · {e.attendees} registered
                  </p>
                  <Progress value={(e.attendees / e.maxAttendees) * 100} className="h-2 mt-2 max-w-xs" />
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={() => navigate(`/event/${e.id}`)}>
                View
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Proposal tracker</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={proposalTab} onValueChange={(v) => setProposalTab(v as typeof proposalTab)}>
              <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1 p-1">
                <TabsTrigger value="all" className="text-xs px-2">
                  All ({counts.all})
                </TabsTrigger>
                <TabsTrigger value="approved" className="text-xs px-2">
                  Approved ({counts.approved})
                </TabsTrigger>
                <TabsTrigger value="pending" className="text-xs px-2">
                  Pending ({counts.pending})
                </TabsTrigger>
                <TabsTrigger value="revision" className="text-xs px-2">
                  Revision ({counts.revision})
                </TabsTrigger>
              </TabsList>
              {(["all", "approved", "pending", "revision"] as const).map((tab) => (
                <TabsContent key={tab} value={tab} className="mt-3 space-y-2">
                  {(tab === "all" ? proposals : proposals.filter((p) => p.status === tab)).map((p) => (
                    <div
                      key={p.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-lg border border-border/60 p-3"
                    >
                      <span className="font-medium text-sm">{p.title}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{p.votes} votes</span>
                        <Badge variant="outline" className={statusBadge[p.status]}>
                          {p.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </TabsContent>
              ))}
            </Tabs>
            <Button type="button" variant="secondary" className="w-full gap-2" onClick={() => navigate("/my-proposals")}>
              View all proposals
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Session views (7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={36} />
                    <Tooltip
                      contentStyle={{
                        borderRadius: "8px",
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--card))",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="views"
                      stroke="hsl(174 62% 38%)"
                      strokeWidth={2}
                      dot={{ fill: "hsl(174 62% 38%)", r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Rating breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="h-[180px] w-full sm:w-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={ratingData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        paddingAngle={2}
                      >
                        {ratingData.map((entry) => (
                          <Cell key={entry.name} fill={entry.color} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "8px",
                          border: "1px solid hsl(var(--border))",
                          background: "hsl(var(--card))",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-2 w-full">
                  {ratingData.map((r) => (
                    <li key={r.name} className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                        {r.name}
                      </span>
                      <span className="text-muted-foreground tabular-nums">{r.value}%</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
