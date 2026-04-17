import { useParams, useNavigate, Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ArrowLeft, Calendar, Clock, MapPin, Users, Share2, CalendarPlus, Linkedin } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useEventDetail } from "@/hooks/useEvents";
import { useRegisterMutation, useUnregisterMutation } from "@/hooks/useRegistrations";
import { mapDetailToEventData } from "@/lib/eventMap";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiDownloadBlob } from "@/lib/api";

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
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { data: raw, isPending, isError, refetch } = useEventDetail(id);
  const registerMut = useRegisterMutation();
  const unregisterMut = useUnregisterMutation();

  const event = raw ? mapDetailToEventData(raw) : null;

  if (isPending) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">Loading event…</p>
      </div>
    );
  }

  if (isError || !event || !raw) {
    return (
      <div className="p-6 text-center max-w-4xl mx-auto">
        <p className="text-muted-foreground">Event not found.</p>
        <Button variant="outline" onClick={() => navigate("/")} className="mt-4">
          Back to dashboard
        </Button>
      </div>
    );
  }

  const fillPercent = Math.round((event.attendees / Math.max(1, event.maxAttendees)) * 100);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`${categoryStyles[event.category]} border`}>
                {categoryLabels[event.category]}
              </Badge>
              {event.status === "live" && (
                <Badge className="bg-orange-500 text-white border-0 font-bold uppercase text-[10px] tracking-wide">
                  ● Live
                </Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold mb-2">{event.title}</h1>
            <p className="text-muted-foreground leading-relaxed">{event.description}</p>
          </div>

          <Separator />

          <Card className="shadow-card border-border/50 rounded-2xl">
            <CardContent className="p-4 flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-lg">
                  {event.speaker.name.split(" ").map((n) => n[0]).join("")}
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

          {raw.sessions.length > 0 && (
            <div>
              <h2 className="font-semibold mb-2">Sessions</h2>
              <ul className="space-y-2 text-sm">
                {raw.sessions.map((s) => (
                  <li key={s.id} className="rounded-lg border border-border/60 p-3">
                    <p className="font-medium">{s.topic}</p>
                    {s.topic_brief && <p className="text-muted-foreground">{s.topic_brief}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(s.start_datetime).toLocaleString()} · {s.duration_minutes} min
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            {event.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-4">
          <Card className="shadow-card border-border/50 rounded-2xl">
            <CardContent className="p-5 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-primary" />
                  <span>
                    {new Date(event.date + "T12:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    {event.time} · {event.duration}
                  </span>
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
                      <span>{Math.max(0, event.maxAttendees - event.attendees)} spots left</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${fillPercent}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                {raw.my_registration_status === "waitlisted" && (
                  <p className="text-xs text-amber-700 font-medium">You are on the waitlist.</p>
                )}
                <Button
                  className="w-full rounded-full font-semibold shadow-sm"
                  size="lg"
                  disabled={
                    !isAuthenticated ||
                    registerMut.isPending ||
                    unregisterMut.isPending ||
                    raw.db_status !== "Active"
                  }
                  onClick={() => {
                    if (!id) return;
                    if (event.isRegistered) {
                      unregisterMut.mutate(id, {
                        onSuccess: () => {
                          toast({ title: "Registration cancelled" });
                          void refetch();
                        },
                        onError: (err) =>
                          toast({
                            title: "Could not cancel",
                            description: err instanceof Error ? err.message : "Error",
                            variant: "destructive",
                          }),
                      });
                    } else {
                      registerMut.mutate(id, {
                        onSuccess: (res) => {
                          toast({
                            title:
                              res.registration_status === "waitlisted"
                                ? "You are on the waitlist"
                                : "You are registered",
                          });
                          void refetch();
                        },
                        onError: (err) =>
                          toast({
                            title: "Could not register",
                            description: err instanceof Error ? err.message : "Error",
                            variant: "destructive",
                          }),
                      });
                    }
                  }}
                >
                  {!isAuthenticated
                    ? "Sign in to register"
                    : raw.db_status !== "Active"
                      ? "Registration closed"
                      : event.isRegistered
                        ? raw.my_registration_status === "waitlisted"
                          ? "Leave waitlist"
                          : "Cancel registration"
                        : "Register now"}
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1 gap-1"
                    size="sm"
                    disabled={!isAuthenticated || raw.db_status !== "Active"}
                    onClick={() => {
                      if (!id) return;
                      void (async () => {
                        try {
                          const blob = await apiDownloadBlob(`/events/${id}/calendar.ics`);
                          const u = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = u;
                          a.download = `event-${id}.ics`;
                          a.click();
                          URL.revokeObjectURL(u);
                          toast({ title: "Calendar file downloaded" });
                        } catch (e) {
                          toast({
                            title: "Download failed",
                            description: e instanceof Error ? e.message : "Error",
                            variant: "destructive",
                          });
                        }
                      })();
                    }}
                  >
                    <CalendarPlus className="h-3.5 w-3.5" /> Add to Calendar
                  </Button>
                  <Button variant="outline" className="flex-1" size="sm" asChild>
                    <Link to="/" className="flex items-center justify-center gap-1">
                      <Share2 className="h-3.5 w-3.5" /> Share
                    </Link>
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
