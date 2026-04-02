import { EventData } from "@/data/mockEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

const categoryStyles: Record<string, string> = {
  tech: "event-badge-tech",
  domain: "event-badge-domain",
  health: "event-badge-health",
  fun: "event-badge-fun",
  product: "event-badge-product",
};

const categoryLabels: Record<string, string> = {
  tech: "Technology",
  domain: "Domain",
  health: "Health & Wellness",
  fun: "Fun & Recreation",
  product: "Product",
};

export function EventCard({ event }: { event: EventData }) {
  const navigate = useNavigate();
  const fillPercent = Math.round((event.attendees / event.maxAttendees) * 100);

  return (
    <Card
      className="group cursor-pointer rounded-2xl border-border/50 bg-card shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-0.5 overflow-hidden"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-2 mb-3">
          <Badge
            variant="outline"
            className={`${categoryStyles[event.category]} text-[10px] font-bold uppercase tracking-wide border`}
          >
            {categoryLabels[event.category]}
          </Badge>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {event.status === "live" && (
              <Badge className="bg-orange-500 text-white border-0 text-[10px] font-bold uppercase tracking-wide">
                ● Live
              </Badge>
            )}
            {event.isRegistered && event.status !== "live" && (
              <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-semibold">
                Registered
              </Badge>
            )}
          </div>
        </div>

        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2 text-foreground">
          {event.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{event.description}</p>

        <div className="space-y-2 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-infy-purple/70" />
            <span>
              {new Date(event.date).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <Clock className="h-3.5 w-3.5 shrink-0 ml-1 text-infy-purple/70" />
            <span>
              {event.time} · {event.duration}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-infy-purple/70" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground min-w-0">
            <Users className="h-3.5 w-3.5 shrink-0" />
            <span className="shrink-0">
              {event.attendees}/{event.maxAttendees}
            </span>
            <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant={event.isRegistered ? "outline" : "default"}
            className="h-8 rounded-full px-4 text-xs font-semibold shrink-0 border-primary/30"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            {event.isRegistered ? "View details" : "Register"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
