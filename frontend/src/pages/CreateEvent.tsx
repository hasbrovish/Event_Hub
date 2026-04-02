import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X, Send, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import type { EventDetailApi } from "@/types/api";

const CATEGORY_TO_TYPE: Record<string, string> = {
  tech: "Technology",
  domain: "Domain",
  health: "Health",
  fun: "Fun",
  product: "Product",
};

const VIS_MAP: Record<string, string> = {
  all: "org-wide",
  unit: "unit",
  location: "org-wide",
  org: "org-wide",
};

type SessionRow = { id: number; topic: string; speakerName: string; speakerTitle: string; brief: string };

export default function CreateEvent() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("tech");
  const [visibility, setVisibility] = useState("all");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("10:00");
  const [durationMins, setDurationMins] = useState(60);
  const [location, setLocation] = useState("");
  const [maxAttendees, setMaxAttendees] = useState(100);
  const [sessions, setSessions] = useState<SessionRow[]>([
    { id: 1, topic: "", speakerName: "", speakerTitle: "", brief: "" },
  ]);

  const addSession = () =>
    setSessions((s) => [...s, { id: Date.now(), topic: "", speakerName: "", speakerTitle: "", brief: "" }]);
  const removeSession = (id: number) => setSessions((s) => (s.length <= 1 ? s : s.filter((x) => x.id !== id)));

  const buildPayload = () => {
    if (!date) throw new Error("Date required");
    const start = new Date(`${date}T${time}:00`);
    const end = new Date(start.getTime() + durationMins * 60_000);
    const eventType = CATEGORY_TO_TYPE[category] ?? "Technology";
    const vis = VIS_MAP[visibility] ?? "org-wide";
    const sessPayload = sessions.map((s, i) => ({
      topic: s.topic || `Session ${i + 1}`,
      topic_brief: s.brief || null,
      start_datetime: new Date(start.getTime() + i * 30 * 60_000).toISOString(),
      duration_minutes: Math.max(15, Math.floor(durationMins / sessions.length) || 30),
      speaker_name: s.speakerName || (user ? `${user.first_name} ${user.last_name}` : null),
      speaker_title: s.speakerTitle || null,
    }));
    return {
      title,
      description: description || null,
      event_type: eventType,
      tags: [],
      delivery_method: location.toLowerCase().includes("team") ? "Virtual" : "Physical",
      start_date: start.toISOString(),
      end_date: end.toISOString(),
      venue_name: location || null,
      event_url: null,
      slots: maxAttendees,
      visibility: vis,
      group_id: null,
      sessions: sessPayload,
    };
  };

  const createMutation = useMutation({
    mutationFn: async () => {
      const body = buildPayload();
      return apiFetch<EventDetailApi>("/events", { method: "POST", body: JSON.stringify(body) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const submitMutation = useMutation({
    mutationFn: async (eventId: string) => {
      await apiFetch(`/events/${eventId}/submit`, {
        method: "POST",
        body: JSON.stringify({ note: null }),
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["events"] });
    },
  });

  const onSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Use Sign in (dev) in the header.", variant: "destructive" });
      return;
    }
    try {
      const ev = await createMutation.mutateAsync();
      toast({ title: "Draft saved", description: "Your event was created as a draft." });
      navigate(`/event/${ev.id}`);
    } catch (err) {
      toast({
        title: "Could not save",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const onSubmitApproval = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast({ title: "Sign in required", description: "Use Sign in (dev) in the header.", variant: "destructive" });
      return;
    }
    try {
      const ev = await createMutation.mutateAsync();
      await submitMutation.mutateAsync(ev.id);
      toast({ title: "Submitted", description: "Event is pending organizer approval." });
      navigate(`/event/${ev.id}`);
    } catch (err) {
      toast({
        title: "Could not submit",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Propose an Event</h1>
        <p className="text-sm text-muted-foreground">
          Creates records via <code className="text-xs">POST /events</code>. Submit sends{" "}
          <code className="text-xs">POST /events/{"{id}"}/submit</code>.
        </p>
      </div>

      <form className="space-y-6" onSubmit={onSaveDraft}>
        <Card className="shadow-card border-border/60 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title" required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event..."
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="domain">Domain</SelectItem>
                    <SelectItem value="health">Health & Wellness</SelectItem>
                    <SelectItem value="fun">Fun & Recreation</SelectItem>
                    <SelectItem value="product">Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Target visibility</Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Employees</SelectItem>
                    <SelectItem value="unit">My Unit</SelectItem>
                    <SelectItem value="location">My Location</SelectItem>
                    <SelectItem value="org">Organization Wide</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="durationMins">Duration (minutes)</Label>
                <Input
                  id="durationMins"
                  type="number"
                  min={15}
                  value={durationMins}
                  onChange={(e) => setDurationMins(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Venue / Link</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Building or Teams link"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min={1}
                  value={maxAttendees}
                  onChange={(e) => setMaxAttendees(Number(e.target.value))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {sessions.map((session, idx) => (
          <Card key={session.id} className="shadow-card border-border/60 rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Session {idx + 1}</CardTitle>
              {sessions.length > 1 && (
                <Button variant="ghost" size="icon" type="button" onClick={() => removeSession(session.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2 md:col-span-2">
                  <Label>Session topic</Label>
                  <Input
                    value={session.topic}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) => (r.id === session.id ? { ...r, topic: e.target.value } : r)),
                      )
                    }
                    placeholder="Topic"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Speaker name</Label>
                  <Input
                    value={session.speakerName}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) => (r.id === session.id ? { ...r, speakerName: e.target.value } : r)),
                      )
                    }
                    placeholder="Full name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Speaker title</Label>
                  <Input
                    value={session.speakerTitle}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) => (r.id === session.id ? { ...r, speakerTitle: e.target.value } : r)),
                      )
                    }
                    placeholder="Job title"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Topic brief</Label>
                  <Textarea
                    value={session.brief}
                    onChange={(e) =>
                      setSessions((rows) =>
                        rows.map((r) => (r.id === session.id ? { ...r, brief: e.target.value } : r)),
                      )
                    }
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addSession} className="gap-2">
          <Plus className="h-4 w-4" /> Add session
        </Button>

        <div className="flex justify-end gap-3 pt-4 flex-wrap">
          <Button
            type="submit"
            variant="outline"
            disabled={createMutation.isPending}
            className="gap-2"
          >
            <Save className="h-4 w-4" /> Save as Draft
          </Button>
          <Button
            type="button"
            className="gap-2"
            disabled={createMutation.isPending || submitMutation.isPending}
            onClick={(e) => void onSubmitApproval(e)}
          >
            <Send className="h-4 w-4" /> Submit for Approval
          </Button>
        </div>
      </form>
    </div>
  );
}
