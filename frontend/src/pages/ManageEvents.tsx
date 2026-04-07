import { useMemo, useState } from "react";
import { mockEvents, type EventData } from "@/data/mockEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Check,
  X,
  Clock,
  Send,
  MoreHorizontal,
  CalendarDays,
  MessageSquareWarning,
  Pencil,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ScheduleOverride = { date: string; time: string };

type CorrectionRecord = { sentAt: string; message: string };

export default function ManageEvents() {
  const { toast } = useToast();
  const [scheduleOverrides, setScheduleOverrides] = useState<Record<string, ScheduleOverride>>({});
  const [corrections, setCorrections] = useState<Record<string, CorrectionRecord>>({});

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [correctionOpen, setCorrectionOpen] = useState(false);
  const [activeEvent, setActiveEvent] = useState<EventData | null>(null);

  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("");
  const [rescheduleNote, setRescheduleNote] = useState("");

  const [correctionMessage, setCorrectionMessage] = useState("");

  const pendingEvents = useMemo(
    () => mockEvents.slice(0, 3).map((e) => ({ ...e, status: "pending" as const })),
    [],
  );
  const approvedEvents = useMemo(() => mockEvents.slice(3, 6), []);
  const completedEvents = useMemo(() => mockEvents.slice(6), []);

  const displaySchedule = (e: EventData) => {
    const o = scheduleOverrides[e.id];
    return { date: o?.date ?? e.date, time: o?.time ?? e.time };
  };

  const openReschedule = (e: EventData) => {
    setActiveEvent(e);
    const { date, time } = displaySchedule(e);
    setRescheduleDate(date);
    setRescheduleTime(time);
    setRescheduleNote("");
    setRescheduleOpen(true);
  };

  const submitReschedule = () => {
    if (!activeEvent) return;
    setScheduleOverrides((prev) => ({
      ...prev,
      [activeEvent.id]: { date: rescheduleDate, time: rescheduleTime },
    }));
    toast({
      title: "Schedule updated",
      description: rescheduleNote
        ? '"' + activeEvent.title + '" moved to ' + rescheduleDate + " at " + rescheduleTime + ". Note shared with the submitter."
        : '"' + activeEvent.title + '" is now set for ' + rescheduleDate + " at " + rescheduleTime + ".",
    });
    setRescheduleOpen(false);
    setActiveEvent(null);
  };

  const openCorrection = (e: EventData) => {
    setActiveEvent(e);
    setCorrectionMessage(corrections[e.id]?.message ?? "");
    setCorrectionOpen(true);
  };

  const submitCorrection = () => {
    if (!activeEvent) return;
    const msg = correctionMessage.trim();
    if (!msg) {
      toast({ title: "Add instructions", description: "Please describe what needs to be corrected.", variant: "destructive" });
      return;
    }
    setCorrections((prev) => ({
      ...prev,
      [activeEvent.id]: { sentAt: new Date().toISOString(), message: msg },
    }));
    toast({
      title: "Sent for correction",
      description: "Instructions emailed to " + activeEvent.speaker.name + ' for "' + activeEvent.title + '" (demo).',
    });
    setCorrectionOpen(false);
    setActiveEvent(null);
    setCorrectionMessage("");
  };

  const EventRow = ({ event, showActions = false }: { event: EventData; showActions?: boolean }) => {
    const { date, time } = displaySchedule(event);
    const correction = corrections[event.id];
    const dateLabel = new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

    return (
      <Card
        className={cn(
          "shadow-card border-border/60 transition-all duration-200",
          correction ? "border-amber-500/40 bg-amber-500/[0.04]" : "hover:shadow-md hover:border-primary/15",
        )}
      >
        <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1 min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-medium text-sm truncate">{event.title}</p>
              <Badge variant="outline" className="text-[10px] shrink-0">
                {event.category}
              </Badge>
              {correction && (
                <Badge className="gap-1 bg-amber-500/15 text-amber-900 dark:text-amber-100 border-amber-500/30 text-[10px]">
                  <MessageSquareWarning className="h-3 w-3" />
                  Awaiting submitter
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-medium text-foreground/90">
                <CalendarDays className="h-3.5 w-3.5 shrink-0 text-primary" />
                {dateLabel} · {time}
              </span>
              <span className="mx-1.5">·</span>
              {event.speaker.name}
            </p>
            {correction && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 border-l-2 border-amber-500/50 pl-2">
                Last request: {correction.message}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {showActions ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-8"
                  onClick={() => openReschedule(event)}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Reschedule
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-8"
                  onClick={() => openCorrection(event)}
                >
                  <Send className="h-3.5 w-3.5" />
                  Send for correction
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  className="gap-1 h-8"
                  onClick={() => toast({ title: "Event approved!" })}
                >
                  <Check className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 h-8"
                  onClick={() => toast({ title: "Event declined", variant: "destructive" })}
                >
                  <X className="h-3.5 w-3.5" /> Decline
                </Button>
              </>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openReschedule(event)}>
                    <Clock className="h-4 w-4" />
                    Reschedule event
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => openCorrection(event)}>
                    <Send className="h-4 w-4" />
                    Send to user for correction
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="gap-2 cursor-pointer"
                    onClick={() =>
                      toast({
                        title: "Bulk notification (demo)",
                        description: 'Reminder queued for attendees of "' + event.title + '".',
                      })
                    }
                  >
                    <Pencil className="h-4 w-4" />
                    Notify attendees
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in pb-16">
      <div>
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <p className="text-sm text-muted-foreground">
          Review requests, reschedule sessions, and send items back to submitters for updates.
        </p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            Pending{" "}
            <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">
              {pendingEvents.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingEvents.map((e) => (
            <EventRow key={e.id} event={e} showActions />
          ))}
        </TabsContent>
        <TabsContent value="approved" className="space-y-3 mt-4">
          {approvedEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </TabsContent>
        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedEvents.map((e) => (
            <EventRow key={e.id} event={e} />
          ))}
        </TabsContent>
      </Tabs>

      <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Reschedule event
            </DialogTitle>
            <DialogDescription>
              New date and time are saved for this event and shared with the submitter (demo — no backend).
            </DialogDescription>
          </DialogHeader>
          {activeEvent && (
            <div className="space-y-4 py-2">
              <p className="text-sm font-medium">{activeEvent.title}</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="res-date">Date</Label>
                  <Input
                    id="res-date"
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="res-time">Time</Label>
                  <Input
                    id="res-time"
                    type="text"
                    placeholder="e.g. 2:00 PM"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="res-note">Note to submitter (optional)</Label>
                <Textarea
                  id="res-note"
                  placeholder="Reason for move or room change…"
                  value={rescheduleNote}
                  onChange={(e) => setRescheduleNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setRescheduleOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitReschedule} disabled={!rescheduleDate.trim() || !rescheduleTime.trim()}>
              Save schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={correctionOpen} onOpenChange={setCorrectionOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquareWarning className="h-5 w-5 text-amber-600" />
              Send to user for correction
            </DialogTitle>
            <DialogDescription>
              The submitter / speaker receives your instructions and can update the proposal before you approve (demo).
            </DialogDescription>
          </DialogHeader>
          {activeEvent && (
            <div className="space-y-3 py-2">
              <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
                <p className="font-medium">{activeEvent.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">To: {activeEvent.speaker.name}</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="corr-msg">What should they fix?</Label>
                <Textarea
                  id="corr-msg"
                  placeholder="e.g. Shorten abstract, add learning outcomes, or confirm room capacity…"
                  value={correctionMessage}
                  onChange={(e) => setCorrectionMessage(e.target.value)}
                  rows={5}
                  className="resize-none min-h-[120px]"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setCorrectionOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submitCorrection}>
              Send instructions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
