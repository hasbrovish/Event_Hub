import { mockEvents } from "@/data/mockEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function CalendarPage() {
  const [currentDate] = useState(new Date(2026, 3, 1)); // April 2026
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const registeredEvents = mockEvents.filter((e) => e.isRegistered);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return mockEvents.filter((e) => e.date === dateStr);
  };

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Calendar</h1>
          <p className="text-sm text-muted-foreground">April 2026</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">Today</Button>
          <Button variant="outline" size="sm">Week</Button>
          <Button variant="default" size="sm">Month</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-4">
              <div className="grid grid-cols-7 gap-px">
                {daysOfWeek.map((d) => (
                  <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">
                    {d}
                  </div>
                ))}
                {cells.map((day, idx) => {
                  const events = day ? getEventsForDay(day) : [];
                  const isToday = day === 1; // mock
                  return (
                    <div
                      key={idx}
                      className={`min-h-[80px] border border-border/40 p-1 text-sm ${
                        day ? "bg-card hover:bg-secondary/50 transition-colors cursor-pointer" : "bg-muted/30"
                      } ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
                    >
                      {day && (
                        <>
                          <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>{day}</span>
                          {events.slice(0, 2).map((e) => (
                            <div key={e.id} className="mt-0.5 text-[10px] px-1 py-0.5 rounded bg-primary/10 text-primary truncate">
                              {e.title}
                            </div>
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
            </CardContent>
          </Card>
        </div>

        {/* Registered Events Sidebar */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <CalIcon className="h-4 w-4 text-primary" /> My Registrations
          </h3>
          {registeredEvents.map((event) => (
            <Card key={event.id} className="shadow-card border-border/60 hover:shadow-card-hover transition-shadow cursor-pointer">
              <CardContent className="p-3">
                <p className="font-medium text-sm line-clamp-1">{event.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {event.time}
                </p>
                <Badge variant="outline" className="mt-2 text-[10px]">{event.category}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
