import { useState } from "react";
import { mockEvents } from "@/data/mockEvents";
import { EventCard } from "@/components/EventCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, LayoutGrid, List, TrendingUp, Users, Zap } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";

const categories = ["all", "tech", "domain", "health", "fun", "product"] as const;
const categoryLabels: Record<string, string> = {
  all: "All Events",
  tech: "Technology",
  domain: "Domain",
  health: "Health",
  fun: "Fun",
  product: "Product",
};

export default function Dashboard() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredEvents = activeCategory === "all"
    ? mockEvents
    : mockEvents.filter((e) => e.category === activeCategory);

  const liveEvents = mockEvents.filter((e) => e.status === "live");
  const upcomingCount = mockEvents.filter((e) => e.status === "upcoming").length;
  const registeredCount = mockEvents.filter((e) => e.isRegistered).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{upcomingCount}</p>
              <p className="text-xs text-muted-foreground">Upcoming Events</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <Zap className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold">{liveEvents.length}</p>
              <p className="text-xs text-muted-foreground">Live Now</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-card border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold">{registeredCount}</p>
              <p className="text-xs text-muted-foreground">My Registrations</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Banner */}
      {liveEvents.length > 0 && (
        <Card className="gradient-hero text-primary-foreground overflow-hidden shadow-elevated">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-primary-foreground animate-pulse" />
              <div>
                <p className="font-semibold">{liveEvents[0].title}</p>
                <p className="text-sm opacity-80">Happening now · {liveEvents[0].attendees} watching</p>
              </div>
            </div>
            <Button variant="secondary" size="sm" className="font-medium">
              Join Now
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters & View */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Badge
              key={cat}
              variant={activeCategory === cat ? "default" : "outline"}
              className="cursor-pointer px-3 py-1 transition-colors hover:bg-primary hover:text-primary-foreground"
              onClick={() => setActiveCategory(cat)}
            >
              {categoryLabels[cat]}
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={viewMode === "grid" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode("list")}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Event Grid */}
      <div className={
        viewMode === "grid"
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          : "flex flex-col gap-3"
      }>
        {filteredEvents.map((event, idx) => (
          <div key={event.id} style={{ animationDelay: `${idx * 50}ms` }} className="animate-fade-in">
            <EventCard event={event} />
          </div>
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <TrendingUp className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No events in this category</p>
          <p className="text-sm">Check back later or explore other categories</p>
        </div>
      )}
    </div>
  );
}
