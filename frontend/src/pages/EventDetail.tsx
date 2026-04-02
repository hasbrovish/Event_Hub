import { useParams, useNavigate } from "react-router-dom";
import { mockEvents } from "@/data/mockEvents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, CalendarPlus, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";

const categoryLabels: Record<string, string> = {
  tech: "Technology",
  domain: "Domain",
  health: "Health & Wellness",
  fun: "Fun & Recreation",
  product: "Product",
};

const categoryStyles: Record<string, string> = {
  tech: "event-badge-tech",
  domain: "event-badge-domain",
  health: "event-badge-health",
  fun: "event-badge-fun",
  product: "event-badge-product",
};

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const event = mockEvents.find((e) => e.id === id);

  if (!event) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="outline" onClick={() => navigate("/")} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const fillPercent = Math.round((event.attendees / event.maxAttendees) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`${categoryStyles[event.category]} border`}>
                {categoryLabels[event.category]}
              </Badge>
              {event.status === "live" && (
                <Badge className="bg-destructive text-destructive-foreground animate-pulse">● LIVE</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </div>

          <Separator />

          {/* Speaker Card */}
          <Card className="shadow-card border-border/60">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {event.speaker.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="font-semibold">{event.speaker.name}</p>
                <p className="text-sm text-muted-foreground">{event.speaker.title}</p>
              </div>
              <Button variant="outline" size="sm" className="gap-1">
                <Linkedin className="h-3.5 w-3.5" /> Profile
              </Button>
            </CardContent>
          </Card>

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="w-full lg:w-80 space-y-4">
          <Card className="shadow-card border-border/60">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>{new Date(event.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>{event.time} · {event.duration}</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-primary" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span>{event.attendees} registered</span>
                      <span>{event.maxAttendees - event.attendees} spots left</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${fillPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Button className="w-full" size="lg">
                  {event.isRegistered ? "Registered ✓" : "Register Now"}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1 gap-1" size="sm">
                    <CalendarPlus className="h-3.5 w-3.5" /> Add to Calendar
                  </Button>
                  <Button variant="outline" className="flex-1 gap-1" size="sm">
                    <Share2 className="h-3.5 w-3.5" /> Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
