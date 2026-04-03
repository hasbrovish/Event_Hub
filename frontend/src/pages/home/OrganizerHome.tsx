import { useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { mockEvents } from "@/data/mockEvents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Mail,
  Plus,
  ThumbsDown,
  TrendingUp,
  Users,
} from "lucide-react";

const weeklyTrends = [
  { cat: "Tech", value: 42 },
  { cat: "Domain", value: 28 },
  { cat: "Health", value: 35 },
  { cat: "Fun", value: 22 },
  { cat: "Product", value: 31 },
];

const registrationTrend = [
  { week: "W1", regs: 120 },
  { week: "W2", regs: 180 },
  { week: "W3", regs: 210 },
  { week: "W4", regs: 265 },
];

const pendingApprovals = [
  {
    id: "a1",
    title: "DevOps Best Practices",
    subtitle: "Hands-on CI/CD and observability session proposed by Rahul Verma.",
    author: "Rahul Verma",
    date: "Apr 14",
    votes: 24,
  },
  {
    id: "a2",
    title: "Financial Planning 101",
    subtitle: "Personal finance basics for early-career employees.",
    author: "Anita Desai",
    date: "Apr 12",
    votes: 18,
  },
  {
    id: "a3",
    title: "Improv Comedy Hour",
    subtitle: "Lightning talks and improv games — community building.",
    author: "Maya Kapoor",
    date: "Apr 10",
    votes: 9,
  },
];

const activityItems: { icon: "check" | "mail" | "clock" | "warning"; text: string }[] = [
  { icon: "check", text: "Approved — AI & ML Workshop" },
  { icon: "mail", text: "Campaign sent — Cricket Tournament" },
  { icon: "clock", text: "New proposal — DevOps Best Practices" },
  { icon: "check", text: "Feedback added — Design Thinking" },
  { icon: "warning", text: "Rejected — Random Talk" },
];

export default function OrganizerHome() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const weekPreview = mockEvents.filter((e) => e.status === "upcoming").slice(0, 3);

  const approve = (title: string) => {
    toast({ title: "Approved", description: `${title} has been approved.` });
  };

  const reject = (title: string) => {
    toast({ title: "Rejected", description: `${title} was rejected.` });
  };

  const ActivityIcon = ({ kind }: { kind: (typeof activityItems)[number]["icon"] }) => {
    if (kind === "check") return <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />;
    if (kind === "mail") return <Mail className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />;
    if (kind === "clock") return <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />;
    return <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      <Card className="border-0 shadow-elevated overflow-hidden bg-[hsl(174_62%_28%)] text-primary-foreground">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Event operations center</h1>
              <p className="text-sm opacity-90">
                Manage proposals, approvals, and campaigns from one place.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => navigate("/campaigns")}
                >
                  Campaigns
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => navigate("/manage-events")}
                >
                  Manage events
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 shrink-0 text-center">
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-4">
                <p className="text-xl font-bold">3</p>
                <p className="text-xs opacity-80 mt-1">Pending</p>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-4">
                <p className="text-xl font-bold">7</p>
                <p className="text-xs opacity-80 mt-1">Active</p>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-4">
                <p className="text-xl font-bold">845</p>
                <p className="text-xs opacity-80 mt-1">Signups</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">8</p>
              <p className="text-xs text-muted-foreground">Total events</p>
              <p className="text-xs text-primary mt-1 flex items-center gap-0.5">
                <TrendingUp className="h-3 w-3" /> +3
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg flex items-center justify-center shrink-0 bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">3</p>
              <p className="text-xs text-muted-foreground">Pending approval</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-sky-500/15 flex items-center justify-center shrink-0">
              <Users className="h-5 w-5 text-sky-600 dark:text-sky-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">845</p>
              <p className="text-xs text-muted-foreground">Total registrations</p>
              <p className="text-xs text-primary mt-1">+12%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-500/15 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold">78%</p>
              <p className="text-xs text-muted-foreground">Engagement rate</p>
              <p className="text-xs text-primary mt-1">+5%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            Approval queue
            <Badge variant="destructive" className="rounded-full h-5 min-w-5 px-1.5">
              1
            </Badge>
          </CardTitle>
          <Button type="button" variant="link" className="h-auto p-0 gap-1 text-primary" onClick={() => navigate("/manage-events")}>
            View all <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {pendingApprovals.map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-border/60 p-4 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                <div>
                  <p className="font-semibold">{item.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{item.subtitle}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    {item.author} · {item.date} · {item.votes} votes
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button type="button" size="sm" onClick={() => approve(item.title)}>
                    Approve
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => toast({ title: "Review", description: `Opened review for ${item.title}.` })}
                  >
                    Review
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    aria-label={`Reject ${item.title}`}
                    onClick={() => reject(item.title)}
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Weekly trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyTrends} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="cat" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={32} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(174 62% 38%)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Registration trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={registrationTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={36} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <ReferenceLine y={40} stroke="hsl(25 90% 55%)" strokeDasharray="4 4" strokeOpacity={0.7} />
                  <Line
                    type="monotone"
                    dataKey="regs"
                    stroke="hsl(174 62% 38%)"
                    strokeWidth={2}
                    dot={{ fill: "hsl(174 62% 38%)", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {activityItems.map((item, i) => (
              <li key={i} className="flex items-start gap-3 text-sm border-b border-border/40 pb-3 last:border-0 last:pb-0">
                <ActivityIcon kind={item.icon} />
                <span>{item.text}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            This week&apos;s events
          </CardTitle>
          <Button type="button" variant="link" className="h-auto p-0 gap-1" onClick={() => navigate("/calendar")}>
            View full calendar <ArrowRight className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
          {weekPreview.map((e) => (
            <div
              key={e.id}
              className="flex-1 min-w-[200px] rounded-lg border border-border/60 p-3 cursor-pointer hover:bg-muted/40"
              onClick={() => navigate(`/event/${e.id}`)}
              onKeyDown={(ev) => ev.key === "Enter" && navigate(`/event/${e.id}`)}
              role="button"
              tabIndex={0}
            >
              <Badge variant="outline" className="text-xs mb-2">
                {e.category}
              </Badge>
              <p className="font-medium text-sm">{e.title}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {e.date} · {e.time}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button type="button" variant="outline" className="gap-2" onClick={() => navigate("/create-event")}>
          <Plus className="h-4 w-4" />
          Create event
        </Button>
      </div>
    </div>
  );
}
