import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format, addMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from "date-fns";
import type { EventData } from "@/data/mockEvents";
import { mockEvents } from "@/data/mockEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar as CalIcon, ChevronLeft, ChevronRight, Clock, Sparkles } from "lucide-react";

const categoryLegend: { key: EventData["category"]; label: string; dot: string }[] = [
  { key: "tech", label: "Tech", dot: "bg-blue-500" },
  { key: "domain", label: "Domain", dot: "bg-violet-500" },
  { key: "health", label: "Health", dot: "bg-emerald-500" },
  { key: "fun", label: "Fun", dot: "bg-amber-400" },
  { key: "product", label: "Product", dot: "bg-rose-500" },
];

const pillByCategory: Record<EventData["category"], string> = {
  tech: "bg-blue-500/90 text-white hover:bg-blue-600",
  domain: "bg-violet-500/90 text-white hover:bg-violet-600",
  health: "bg-emerald-500/90 text-white hover:bg-emerald-600",
  fun: "bg-amber-500/90 text-white hover:bg-amber-600",
  product: "bg-rose-500/90 text-white hover:bg-rose-600",
};

const dotByCategory: Record<EventData["category"], string> = {
  tech: "bg-blue-500",
  domain: "bg-violet-500",
  health: "bg-emerald-500",
  fun: "bg-amber-400",
  product: "bg-rose-500",
};

/** Demo “today” in the calendar story (April 4, 2026) — matches yoga event. */
const DEMO_TODAY = new Date(2026, 3, 4);

function eventsOnDate(events: EventData[], d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const key = `${y}-${m}-${day}`;
  return events.filter((e) => e.date === key);
}

export default function CalendarPage() {
  const navigate = useNavigate();
  const [viewDate, setViewDate] = useState(() => startOfMonth(new Date(2026, 3, 1)));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const gridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

  const registered = useMemo(() => mockEvents.filter((e) => e.isRegistered), []);

  const agendaSourceDate = useMemo(() => {
    if (viewDate.getFullYear() === DEMO_TODAY.getFullYear() && viewDate.getMonth() === DEMO_TODAY.getMonth()) {
      return DEMO_TODAY;
    }
    return null;
  }, [viewDate]);

  const agendaEvents = agendaSourceDate ? eventsOnDate(mockEvents, agendaSourceDate) : [];

  const selectedDayEvents = selectedDate ? eventsOnDate(mockEvents, selectedDate) : [];

  const isDemoToday = (d: Date) => isSameDay(d, DEMO_TODAY);

  return (
    <div className="p-6 max-w-7xl mx-auto animate-fade-in pb-16">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 xl:gap-8">
        <div className="xl:col-span-2 space-y-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <CalIcon className="h-7 w-7 text-[hsl(174_55%_38%)] shrink-0" />
              My Calendar
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Click any date to see events.</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {categoryLegend.map((c) => (
              <div key={c.key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", c.dot)} />
                {c.label}
              </div>
            ))}
          </div>

          <Card className="shadow-card border-border/60 overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/60">
              <CardTitle className="text-lg font-semibold">{format(viewDate, "MMMM yyyy")}</CardTitle>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewDate((d) => addMonths(d, -1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setViewDate((d) => addMonths(d, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4">
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1 text-center text-xs font-medium text-muted-foreground mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
                {gridDays.map((day) => {
                  const inMonth = isSameMonth(day, viewDate);
                  const dayNum = day.getDate();
                  const dayEvents = eventsOnDate(mockEvents, day);
                  const selected = selectedDate && isSameDay(day, selectedDate);
                  const demoToday = isDemoToday(day) && inMonth;

                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      disabled={!inMonth}
                      onClick={() => inMonth && setSelectedDate(day)}
                      className={cn(
                        "min-h-[72px] sm:min-h-[88px] rounded-lg border p-1 sm:p-1.5 text-left transition-all",
                        !inMonth && "opacity-40 border-transparent bg-muted/20 cursor-default",
                        inMonth && "border-border/50 bg-card hover:bg-muted/50 hover:border-primary/25",
                        selected && inMonth && "ring-2 ring-primary ring-offset-2 ring-offset-background border-primary/40",
                      )}
                    >
                      {inMonth && (
                        <>
                          <div
                            className={cn(
                              "flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold mb-1",
                              demoToday && "bg-emerald-500 text-white shadow-sm",
                              !demoToday && "text-foreground",
                            )}
                          >
                            {dayNum}
                          </div>
                          <div className="flex flex-col gap-0.5">
                            {dayEvents.slice(0, 2).map((e) => (
                              <span
                                key={e.id}
                                role="link"
                                tabIndex={0}
                                className={cn(
                                  "truncate rounded px-1 py-0.5 text-[9px] sm:text-[10px] font-medium leading-tight cursor-pointer",
                                  pillByCategory[e.category],
                                )}
                                onClick={(ev) => {
                                  ev.stopPropagation();
                                  navigate(`/event/${e.id}`);
                                }}
                                onKeyDown={(ev) => {
                                  if (ev.key === "Enter") {
                                    ev.stopPropagation();
                                    navigate(`/event/${e.id}`);
                                  }
                                }}
                              >
                                {e.title}
                              </span>
                            ))}
                            {dayEvents.length > 2 && (
                              <span className="text-[9px] text-muted-foreground pl-0.5">+{dayEvents.length - 2} more</span>
                            )}
                          </div>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 xl:pt-12">
          <Card className="shadow-card border-border/60 min-h-[140px]">
            <CardContent className="p-5 flex flex-col items-center justify-center text-center min-h-[inherit]">
              {selectedDate && selectedDayEvents.length > 0 ? (
                <div className="w-full space-y-3 text-left">
                  <p className="text-sm font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</p>
                  <ul className="space-y-2">
                    {selectedDayEvents.map((e) => (
                      <li key={e.id}>
                        <button
                          type="button"
                          className="w-full text-left rounded-lg border border-border/60 p-3 hover:bg-muted/50 transition-colors"
                          onClick={() => navigate(`/event/${e.id}`)}
                        >
                          <span className={cn("inline-block h-2 w-2 rounded-full mr-2 align-middle", dotByCategory[e.category])} />
                          <span className="font-medium text-sm">{e.title}</span>
                          <p className="text-xs text-muted-foreground mt-1 pl-4">
                            {e.time} · {e.location}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <Sparkles className="h-10 w-10 text-primary/60 mb-3" />
                  <p className="text-sm text-muted-foreground max-w-[240px]">
                    Select a date. Click on any day to see event details.
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-base font-semibold">My Registrations</CardTitle>
              <Badge variant="secondary" className="tabular-nums">
                {registered.length}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {registered.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  onClick={() => navigate(`/event/${event.id}`)}
                  className="w-full text-left rounded-xl border border-border/60 p-3 hover:bg-muted/40 hover:border-primary/20 transition-colors"
                >
                  <div className="flex items-start gap-2">
                    <span className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0", dotByCategory[event.category])} />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm line-clamp-2">{event.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(event.date + "T12:00:00"), "EEE, MMM d")} · {event.time}
                      </p>
                      <Badge variant="outline" className="mt-2 text-[10px] font-normal text-muted-foreground border-border/80">
                        upcoming
                      </Badge>
                    </div>
                  </div>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-elevated overflow-hidden text-primary-foreground">
            <CardContent className="p-5 bg-gradient-to-br from-[hsl(174_55%_32%)] to-[hsl(215_45%_28%)]">
              <h3 className="text-sm font-semibold opacity-90 flex items-center gap-2">
                <CalIcon className="h-4 w-4" />
                Today&apos;s agenda
              </h3>
              {agendaSourceDate && (
                <p className="text-xs opacity-80 mt-1">{format(agendaSourceDate, "EEEE, MMMM d, yyyy")}</p>
              )}
              {!agendaSourceDate && (
                <p className="text-xs opacity-80 mt-1">Sample agenda shows when viewing April 2026.</p>
              )}
              <ul className="mt-4 space-y-3">
                {!agendaSourceDate ? (
                  <li className="text-sm opacity-85">Open April 2026 to preview today&apos;s sample sessions.</li>
                ) : agendaEvents.length === 0 ? (
                  <li className="text-sm opacity-85">No sessions on this day.</li>
                ) : (
                  agendaEvents.map((e) => (
                    <li key={e.id}>
                      <button
                        type="button"
                        className="w-full flex gap-2 text-left rounded-lg bg-white/10 hover:bg-white/15 p-2.5 transition-colors"
                        onClick={() => navigate(`/event/${e.id}`)}
                      >
                        <Clock className="h-4 w-4 shrink-0 mt-0.5 opacity-90" />
                        <span className="text-sm font-medium leading-snug">
                          {e.time} {e.title}
                        </span>
                      </button>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
