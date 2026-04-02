import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMyRegistrations } from "@/hooks/useRegistrations";
import { mapListItemToEventData } from "@/lib/eventMap";
import { apiDownloadBlob, getStoredToken } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const categoryLabels: Record<string, string> = {
  tech: "Technology",
  domain: "Domain",
  health: "Health & Wellness",
  fun: "Fun & Recreation",
  product: "Product",
};

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, delta: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}

export default function CalendarPage() {
  const { toast } = useToast();
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));
  const hasToken = !!getStoredToken();
  const { data, isPending } = useMyRegistrations();

  const registeredEvents = useMemo(() => {
    if (!data?.items?.length) return [];
    return data.items.map((r) => mapListItemToEventData(r.event));
  }, [data]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const today = new Date();
  const isToday = (day: number) =>
    day > 0 &&
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day;

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return registeredEvents.filter((e) => e.date === dateStr);
  };

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthTitle = viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Calendar</h1>
          <p className="text-sm text-muted-foreground">Events you are registered or waitlisted for</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-card px-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Previous month"
              onClick={() => setViewMonth((m) => addMonths(m, -1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[10rem] text-center tabular-nums">{monthTitle}</span>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Next month"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <Button variant="outline" size="sm" onClick={() => setViewMonth(startOfMonth(new Date()))}>
            Today
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!hasToken}
            onClick={() => {
              void (async () => {
                try {
                  const blob = await apiDownloadBlob("/registrations/me/calendar.ics");
                  const u = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = u;
                  a.download = "my-events.ics";
                  a.click();
                  URL.revokeObjectURL(u);
                  toast({ title: "Downloaded my-events.ics" });
                } catch (e) {
                  toast({
                    title: "Export failed",
                    description: e instanceof Error ? e.message : "",
                    variant: "destructive",
                  });
                }
              })();
            }}
          >
            Export .ics
          </Button>
          <Button variant="default" size="sm" disabled>
            Month
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-4">
              {!hasToken ? (
                <p className="text-sm text-muted-foreground py-8 text-center">
                  Sign in to load your registrations on the calendar.
                </p>
              ) : (
                <div className="grid grid-cols-7 gap-px">
                  {daysOfWeek.map((d) => (
                    <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                      {d}
                    </div>
                  ))}
                  {cells.map((day, idx) => {
                    const events = day ? getEventsForDay(day) : [];
                    const todayCell = day ? isToday(day) : false;
                    return (
                      <div
                        key={idx}
                        className={`min-h-[80px] border border-border/40 p-1 text-sm ${
                          day ? "bg-card hover:bg-secondary/50 transition-colors" : "bg-muted/30"
                        } ${todayCell ? "ring-2 ring-primary ring-inset" : ""}`}
                      >
                        {day && (
                          <>
                            <span className={`text-xs font-medium ${todayCell ? "text-primary" : ""}`}>{day}</span>
                            {events.slice(0, 2).map((e) => (
                              <Link
                                key={e.id}
                                to={`/event/${e.id}`}
                                className="mt-0.5 block text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary truncate hover:bg-primary/20"
                              >
                                {e.title}
                              </Link>
                            ))}
                            {events.length > 2 && (
                              <div className="text-[10px] text-muted-foreground">+{events.length - 2} more</div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-primary" /> My Registrations
          </h3>
          {!hasToken && (
            <p className="text-xs text-muted-foreground">Sign in to see events you have joined.</p>
          )}
          {hasToken && isPending && <p className="text-xs text-muted-foreground">Loading…</p>}
          {hasToken && !isPending && registeredEvents.length === 0 && (
            <p className="text-xs text-muted-foreground">No active registrations yet. Browse the dashboard to join an event.</p>
          )}
          {registeredEvents.map((event) => (
            <Link key={event.id} to={`/event/${event.id}`}>
              <Card className="shadow-card border-border/60 hover:shadow-card-hover transition-shadow cursor-pointer">
                <CardContent className="p-3">
                  <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}{" "}
                    · {event.time}
                  </p>
                  <Badge variant="outline" className="mt-2 text-[10px]">
                    {categoryLabels[event.category] ?? event.category}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
