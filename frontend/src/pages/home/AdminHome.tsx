import { useNavigate } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Calendar,
  CheckCircle2,
  ClipboardList,
  KeyRound,
  Settings,
  Shield,
} from "lucide-react";

const services = [
  { name: "Auth service", uptime: 99.9, latencyMs: 12, status: "operational" as const },
  { name: "Event API", uptime: 99.95, latencyMs: 28, status: "operational" as const },
  { name: "Notification engine", uptime: 97.2, latencyMs: 230, status: "degraded" as const },
  { name: "Storage", uptime: 100, latencyMs: 8, status: "operational" as const },
  { name: "Database", uptime: 99.98, latencyMs: 5, status: "operational" as const },
  { name: "CDN", uptime: 99.99, latencyMs: 18, status: "operational" as const },
];

const sparklineSeries = [
  { name: "Auth", data: [99.2, 99.4, 99.5, 99.6, 99.7, 99.8, 99.9] },
  { name: "API", data: [99.0, 99.2, 99.3, 99.4, 99.5, 99.6, 99.5] },
  { name: "Notify", data: [98.5, 98.0, 97.8, 97.5, 97.3, 97.2, 97.2] },
];

const activeUsersData = [
  { t: "6am", u: 120 },
  { t: "8am", u: 420 },
  { t: "10am", u: 890 },
  { t: "12pm", u: 1120 },
  { t: "2pm", u: 980 },
  { t: "4pm", u: 760 },
  { t: "6pm", u: 540 },
  { t: "8pm", u: 310 },
];

const roleDistribution = [
  { name: "Audience", value: 2100, color: "hsl(174 62% 38%)" },
  { name: "Speaker", value: 120, color: "hsl(174 45% 48%)" },
  { name: "Organizer", value: 18, color: "hsl(200 45% 50%)" },
  { name: "Admin", value: 4, color: "hsl(220 35% 55%)" },
];

const auditEntries: { kind: "ok" | "warn"; title: string; sub: string; time: string }[] = [
  { kind: "ok", title: "Event approved", sub: "Priya Sharma", time: "2 min ago" },
  { kind: "ok", title: "Campaign sent to 340 users", sub: "System", time: "18 min ago" },
  { kind: "warn", title: "Failed login attempt (3x)", sub: "Security", time: "42 min ago" },
  { kind: "ok", title: "Database backup completed", sub: "System", time: "1 hr ago" },
];

const trendingMock = [
  { id: "t1", title: "AI & ML Workshop", attendees: 87, max: 150, growth: 12 },
  { id: "t2", title: "Cricket Tournament", attendees: 120, max: 200, growth: 23 },
  { id: "t3", title: "Product Launch 2.0", attendees: 310, max: 500, growth: 5 },
];

export default function AdminHome() {
  const navigate = useNavigate();
  const trendingFromEvents = [...mockEvents]
    .filter((e) => e.status === "upcoming" || e.status === "live")
    .slice(0, 3);
  const trending =
    trendingFromEvents.length >= 3
      ? trendingFromEvents.map((e, i) => ({
          id: e.id,
          title: e.title,
          attendees: e.attendees,
          max: e.maxAttendees,
          growth: [12, 23, 5][i] ?? 8,
        }))
      : trendingMock;

  const operational = services.filter((s) => s.status === "operational").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in pb-16">
      <Card className="border-0 shadow-elevated overflow-hidden bg-[hsl(174_62%_28%)] text-primary-foreground">
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs uppercase tracking-wider opacity-80">Admin control center</p>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <Shield className="h-8 w-8 opacity-95" />
                Platform overview
              </h1>
              <p className="text-sm opacity-90">
                Monitor platform health, user activity, and system performance in real-time.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => navigate("/admin/logs")}
                >
                  Logs
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => navigate("/admin/config")}
                >
                  Config
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/30 hover:bg-primary-foreground/25"
                  onClick={() => navigate("/admin/access")}
                >
                  Access matrix
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 shrink-0 w-full max-w-sm">
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-5">
                <p className="text-xs opacity-80">Users</p>
                <p className="text-3xl font-bold mt-1">2,342</p>
              </div>
              <div className="rounded-xl bg-primary-foreground/10 border border-primary-foreground/20 p-5">
                <p className="text-xs opacity-80">Uptime</p>
                <p className="text-3xl font-bold mt-1">99.8%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">2,340</p>
            <p className="text-xs text-muted-foreground">Total users</p>
            <p className="text-xs text-primary mt-1">+48 this week</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">18</p>
            <p className="text-xs text-muted-foreground">Organizers</p>
            <p className="text-xs text-muted-foreground mt-1">+2 pending</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">24</p>
            <p className="text-xs text-muted-foreground">Events this month</p>
            <p className="text-xs text-primary mt-1">+6 vs last month</p>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4">
            <p className="text-2xl font-bold">3</p>
            <p className="text-xs text-muted-foreground">Open issues</p>
            <p className="text-xs text-destructive mt-1">1 critical</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {sparklineSeries.map((s) => (
          <Card key={s.name} className="shadow-card border-border/60">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">{s.name} uptime</p>
              <p className="text-lg font-semibold tabular-nums">{s.data[s.data.length - 1]}%</p>
              <div className="h-12 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={s.data.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
                    <Line type="monotone" dataKey="v" stroke="hsl(174 62% 42%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-card border-border/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System health
          </CardTitle>
          <Badge variant="outline" className="tabular-nums">
            {operational}/{services.length} operational
          </Badge>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((svc) => {
            const degraded = svc.status === "degraded";
            return (
              <div
                key={svc.name}
                className={`rounded-xl border p-4 space-y-2 ${
                  degraded ? "border-amber-500/50 bg-amber-500/5" : "border-border/60"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-sm">{svc.name}</span>
                  <span
                    className={`h-2 w-2 rounded-full shrink-0 ${
                      degraded ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  {svc.uptime}% uptime · {svc.latencyMs}ms
                </p>
                <Progress value={Math.min(svc.uptime, 100)} className="h-1.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="shadow-card border-border/60 lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Active users today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[260px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activeUsersData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="adminAreaFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(174 62% 42%)" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="hsl(174 62% 42%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis dataKey="t" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={40} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: "8px",
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="u"
                    stroke="hsl(174 62% 38%)"
                    strokeWidth={2}
                    fill="url(#adminAreaFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">User roles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={roleDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={2}
                  >
                    {roleDistribution.map((entry) => (
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
            <ul className="mt-2 space-y-1.5 text-sm">
              {roleDistribution.map((r) => (
                <li key={r.name} className="flex justify-between gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                    <span className="truncate">{r.name}</span>
                  </span>
                  <span className="text-muted-foreground tabular-nums shrink-0">{r.value.toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="shadow-card border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Audit log
            </CardTitle>
            <Button type="button" variant="link" className="h-auto p-0 gap-1 text-sm" onClick={() => navigate("/admin/logs")}>
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              {auditEntries.map((row, i) => (
                <li key={i} className="flex gap-3 border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  {row.kind === "ok" ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{row.title}</p>
                    <p className="text-xs text-muted-foreground">{row.sub}</p>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">{row.time}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="shadow-card border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Trending events
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {trending.map((e, rank) => (
              <div key={e.id}>
                <div className="flex justify-between gap-2 text-sm mb-1">
                  <span className="font-medium line-clamp-1">
                    #{rank + 1} {e.title}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-medium shrink-0 tabular-nums">
                    +{e.growth}%
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>
                    {e.attendees}/{e.max}
                  </span>
                </div>
                <Progress value={(e.attendees / e.max) * 100} className="h-2" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">Quick actions</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: "Access matrix", icon: KeyRound, to: "/admin/access" },
            { label: "All events", icon: Calendar, to: "/manage-events" },
            { label: "System logs", icon: ClipboardList, to: "/admin/logs" },
            { label: "App config", icon: Settings, to: "/admin/config" },
          ].map((item) => (
            <button
              key={item.to}
              type="button"
              onClick={() => navigate(item.to)}
              className="rounded-xl border border-border/60 bg-card p-6 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all text-left flex flex-col items-center gap-2"
            >
              <item.icon className="h-8 w-8 text-primary" />
              <span className="font-medium text-sm text-center">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
