import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Check,
  Cloud,
  Lightbulb,
  Megaphone,
  Settings,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";

type NotifFilter = "all" | "unread" | "events" | "approvals" | "updates";

type NotifItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  bucket: NotifFilter;
  Icon: typeof Calendar;
  iconWrap: string;
  iconClass: string;
};

const INITIAL: NotifItem[] = [
  {
    id: "1",
    title: "AI & ML Workshop starts in 1 hour",
    description: "Building 44, Hall A — Don't forget your laptop!",
    time: "5 min ago",
    read: false,
    bucket: "events",
    Icon: Calendar,
    iconWrap: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
    iconClass: "text-violet-600 dark:text-violet-400",
  },
  {
    id: "2",
    title: "Your event 'React Meetup' was approved!",
    description: "Reviewed and approved by the governance team.",
    time: "2 hours ago",
    read: false,
    bucket: "approvals",
    Icon: Check,
    iconWrap: "bg-emerald-500 text-white",
    iconClass: "text-white",
  },
  {
    id: "3",
    title: "Yoga session tomorrow at 7 AM",
    description: "Wellness Center, Ground Floor. Bring a yoga mat.",
    time: "3 hours ago",
    read: true,
    bucket: "events",
    Icon: Calendar,
    iconWrap: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  {
    id: "4",
    title: "Cricket Tournament venue changed",
    description: "Moved to Ground B due to maintenance.",
    time: "1 day ago",
    read: true,
    bucket: "updates",
    Icon: AlertTriangle,
    iconWrap: "bg-amber-500/15 text-amber-600 dark:text-amber-500",
    iconClass: "text-amber-600 dark:text-amber-500",
  },
  {
    id: "5",
    title: "3 new events matching your interests",
    description: "Tech and Health events added this week.",
    time: "2 days ago",
    read: true,
    bucket: "updates",
    Icon: Lightbulb,
    iconWrap: "bg-yellow-500/15 text-yellow-700 dark:text-yellow-400",
    iconClass: "text-yellow-600 dark:text-yellow-400",
  },
  {
    id: "6",
    title: "Cloud Native Architecture — Registration open",
    description: "Limited seats. Virtual session via MS Teams.",
    time: "3 days ago",
    read: true,
    bucket: "events",
    Icon: Cloud,
    iconWrap: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
    iconClass: "text-sky-600 dark:text-sky-400",
  },
];

function matchesFilter(n: NotifItem, f: NotifFilter): boolean {
  if (f === "all") return true;
  if (f === "unread") return !n.read;
  return n.bucket === f;
}

export default function Notifications() {
  const navigate = useNavigate();
  const [items, setItems] = useState<NotifItem[]>(INITIAL);
  const [filter, setFilter] = useState<NotifFilter>("all");

  const unreadCount = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const filtered = useMemo(() => items.filter((n) => matchesFilter(n, filter)), [items, filter]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      unread: items.filter((n) => !n.read).length,
      events: items.filter((n) => n.bucket === "events").length,
      approvals: items.filter((n) => n.bucket === "approvals").length,
      updates: items.filter((n) => n.bucket === "updates").length,
    };
  }, [items]);

  const markAllRead = () => {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const filterTabs: { key: NotifFilter; label: string; icon?: typeof Calendar; showUnreadBadge?: boolean }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: "Unread", showUnreadBadge: true },
    { key: "events", label: "Events", icon: Calendar },
    { key: "approvals", label: "Approvals", icon: CheckCircle2 },
    { key: "updates", label: "Updates", icon: Megaphone },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {unreadCount} unread
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => navigate("/preferences")}>
            <Settings className="h-4 w-4" />
            Prefs
          </Button>
          <Button
            type="button"
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0"
            onClick={markAllRead}
            disabled={unreadCount === 0}
          >
            <Check className="h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {filterTabs.map((tab) => {
          const count =
            tab.key === "all"
              ? counts.all
              : tab.key === "unread"
                ? counts.unread
                : tab.key === "events"
                  ? counts.events
                  : tab.key === "approvals"
                    ? counts.approvals
                    : counts.updates;
          const active = filter === tab.key;
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium border transition-colors",
                active
                  ? "bg-foreground text-background border-foreground"
                  : "bg-card border-border/80 text-muted-foreground hover:text-foreground hover:border-border",
              )}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0 opacity-90" />}
              <span>
                {tab.label}
                <span className="tabular-nums"> ({count})</span>
              </span>
              {tab.showUnreadBadge && counts.unread > 0 && (
                <Badge className="h-5 min-w-5 px-1.5 rounded-full bg-destructive text-destructive-foreground border-0 text-[10px]">
                  {counts.unread}
                </Badge>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Card className="border-border/60 shadow-card">
            <CardContent className="p-10 text-center text-muted-foreground text-sm">Nothing here for this filter.</CardContent>
          </Card>
        ) : (
          filtered.map((n) => {
            const Icon = n.Icon;
            return (
              <Card
                key={n.id}
                className={cn(
                  "shadow-card border-border/60 overflow-hidden transition-colors cursor-pointer",
                  !n.read && "border-l-4 border-l-[hsl(174_62%_38%)]",
                )}
                onClick={() => markRead(n.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && markRead(n.id)}
              >
                <CardContent className="p-4 pl-4">
                  <div className="flex gap-3">
                    <div
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center shrink-0",
                        n.iconWrap,
                      )}
                    >
                      <Icon className={cn("h-5 w-5", n.iconClass)} strokeWidth={n.id === "2" ? 3 : 2} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p
                        className={cn(
                          "text-sm font-medium leading-snug flex flex-wrap items-center gap-2",
                          n.read && "text-muted-foreground",
                        )}
                      >
                        {n.title}
                        {!n.read && (
                          <span
                            className="h-2 w-2 rounded-full bg-[hsl(174_62%_38%)] shrink-0"
                            aria-label="Unread"
                          />
                        )}
                      </p>
                      <p className={cn("text-sm", n.read ? "text-muted-foreground/80" : "text-muted-foreground")}>
                        {n.description}
                      </p>
                      <p className="text-xs text-muted-foreground pt-1">{n.time}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
