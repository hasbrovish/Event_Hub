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

export interface EventCardProps {
  event: EventData;
  registeredOverride?: boolean;
  onRegisterToggle?: (eventId: string) => void;
}

export function EventCard({ event, registeredOverride, onRegisterToggle }: EventCardProps) {
  const navigate = useNavigate();
  const fillPercent = Math.round((event.attendees / event.maxAttendees) * 100);
  const isRegistered = registeredOverride !== undefined ? registeredOverride : !!event.isRegistered;

  return (
    <Card
      className="group cursor-pointer shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 border-border/60 overflow-hidden"
      onClick={() => navigate(`/event/${event.id}`)}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <Badge variant="outline" className={`${categoryStyles[event.category]} text-xs font-medium border`}>
            {categoryLabels[event.category]}
          </Badge>
          {event.status === "live" && (
            <Badge className="bg-destructive text-destructive-foreground animate-pulse text-xs">● LIVE</Badge>
          )}
          {isRegistered && event.status !== "live" && (
            <Badge variant="outline" className="border-primary text-primary text-xs">Registered</Badge>
          )}
        </div>

        <h3 className="font-semibold text-base mb-2 group-hover:text-primary transition-colors line-clamp-2">
          {event.title}
        </h3>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {event.description}
        </p>

        <div className="space-y-2 text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5" />
            <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</span>
            <Clock className="h-3.5 w-3.5 ml-2" />
            <span>{event.time} · {event.duration}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{event.location}</span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" />
            <span>{event.attendees}/{event.maxAttendees}</span>
            <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>
          <Button
            size="sm"
            variant={isRegistered ? "outline" : "default"}
            className="h-7 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onRegisterToggle?.(event.id);
            }}
          >
            {isRegistered ? "Registered ✓" : "Register"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
