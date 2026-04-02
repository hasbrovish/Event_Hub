import { useState } from "react";
import { Link } from "react-router-dom";
import { mockEvents } from "@/data/mockEvents";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Calendar, LayoutGrid, List, Plus, TrendingUp, Users, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const categories = ["all", "tech", "domain", "health", "fun", "product"] as const;
const categoryLabels: Record<string, string> = {
  all: "All",
  tech: "Technology",
  domain: "Domain",
  health: "Health",
  fun: "Fun",
  product: "Product",
};

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEvents =
    activeCategory === "all" ? mockEvents : mockEvents.filter((e) => e.category === activeCategory);

  const liveEvents = mockEvents.filter((e) => e.status === "live");
  const upcomingCount = mockEvents.filter((e) => e.status === "upcoming").length;
  const registeredCount = mockEvents.filter((e) => e.isRegistered).length;

  return (
    <div className="p-5 md:p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card border-border/50 rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground font-medium">Upcoming events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/50 rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-orange-500/12 flex items-center justify-center">
              <Zap className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{liveEvents.length}</p>
              <p className="text-xs text-muted-foreground font-medium">Live now</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/50 rounded-2xl overflow-hidden">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-infy-lavender flex items-center justify-center border border-infy-purple/10">
              <Users className="h-5 w-5 text-infy-purple" />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-foreground">{registeredCount}</p>
              <p className="text-xs text-muted-foreground font-medium">My registrations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {liveEvents.length > 0 && (
        <Card className="gradient-hero text-white overflow-hidden shadow-elevated rounded-2xl border-0">
          <CardContent className="p-5 md:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-infy-gold shadow-[0_0_0_3px_rgba(255,255,255,0.25)] animate-pulse" />
              <div className="min-w-0">
                <p className="font-semibold truncate">{liveEvents[0].title}</p>
                <p className="text-sm text-white/85">
                  Happening now · {liveEvents[0].attendees} attending
                </p>
              </div>
            </div>
            <Button
              size="sm"
              className="shrink-0 rounded-full px-5 bg-infy-gold text-accent-foreground hover:bg-infy-gold/90 font-semibold shadow-md border-0"
            >
              Join now
            </Button>
          </CardContent>
        </Card>
      )}

      <section className="rounded-2xl bg-infy-lavender/90 border border-border/40 p-5 md:p-6 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">Events to participate</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Based on your preferences — filter by category below.
            </p>
          </div>
          <Link
            to="/create-event"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
            Propose an event
          </Link>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-medium transition-all border",
                  activeCategory === cat
                    ? "bg-secondary border-transparent text-foreground shadow-sm"
                    : "bg-card/90 border-border/80 text-muted-foreground hover:bg-card hover:text-foreground",
                )}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 rounded-full bg-card/80 border border-border/60 p-1 shadow-sm">
            <Button
              variant={viewMode === "grid" ? "secondary" : "ghost"}
              size="icon"
              className={cn("h-8 w-8 rounded-full", viewMode === "grid" && "bg-background shadow-sm")}
              onClick={() => setViewMode("grid")}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "secondary" : "ghost"}
              size="icon"
              className={cn("h-8 w-8 rounded-full", viewMode === "list" && "bg-background shadow-sm")}
              onClick={() => setViewMode("list")}
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
              <EventCard event={event} />
            </div>
          ))}
        </div>

        {filteredEvents.length === 0 && (
          <div className="text-center py-14 text-muted-foreground rounded-xl bg-card/50 border border-dashed border-border/60 mt-2">
            <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-25 text-infy-purple" />
            <p className="font-semibold text-foreground">No events in this category</p>
            <p className="text-sm mt-1">Try another filter or check back later.</p>
          </div>
        )}
      </section>

      <p className="text-center text-xs text-muted-foreground pb-2">
        © {new Date().getFullYear()} Event Hub · Internal use
      </p>
    </div>
  );
}
