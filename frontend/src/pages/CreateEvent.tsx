import { useCallback, useRef, useState } from "react";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Bold,
  CalendarIcon,
  Check,
  ChevronDown,
  Clock,
  Italic,
  Laptop,
  List,
  MapPin,
  Plus,
  Send,
  Underline,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type LocationFormat = "venue" | "online";

const TIMEZONES = [
  { value: "UTC", label: "(UTC) Coordinated Universal Time" },
  { value: "Asia/Colombo", label: "(GMT+05:30) India / Sri Lanka" },
  { value: "America/New_York", label: "(GMT-05:00) Eastern Time" },
  { value: "America/Chicago", label: "(GMT-06:00) Central Time" },
  { value: "America/Los_Angeles", label: "(GMT-08:00) Pacific Time" },
  { value: "Europe/London", label: "(GMT+00:00) London" },
  { value: "Europe/Paris", label: "(GMT+01:00) Central European" },
  { value: "Asia/Tokyo", label: "(GMT+09:00) Japan" },
  { value: "Australia/Sydney", label: "(GMT+10:00) Sydney" },
];

const VENUE_SUGGESTIONS = [
  "Town Hall — Main Auditorium",
  "Building 7 — Conference Room A",
  "Innovation Lab",
  "HQ — Floor 3 Training Room",
];

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1">
      <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export default function CreateEvent() {
  const { toast } = useToast();
  const descriptionRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState([{ id: 1 }]);
  const [locationFormat, setLocationFormat] = useState<LocationFormat>("venue");
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [showEndTime, setShowEndTime] = useState(false);
  const [startPopoverOpen, setStartPopoverOpen] = useState(false);
  const [endPopoverOpen, setEndPopoverOpen] = useState(false);
  const [timezone, setTimezone] = useState("Asia/Colombo");

  const addSession = () => setSessions([...sessions, { id: Date.now() }]);
  const removeSession = (id: number) => setSessions(sessions.filter((s) => s.id !== id));

  const runFormat = useCallback((command: "bold" | "italic" | "underline" | "insertUnorderedList") => {
    const el = descriptionRef.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false);
  }, []);

  const handleToolbarMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Event Proposed!",
      description: "Your event has been submitted for organizer approval.",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10 animate-fade-in pb-16">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Create an event</h1>
        <p className="text-sm text-muted-foreground">Propose an event for organizer approval.</p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-10">
        <section className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-name" className="text-base font-medium">
              Event name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="event-name"
              name="eventName"
              placeholder="Enter the name of your event"
              className="h-11 text-base"
              required
            />
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            title="Location"
            description="Choose how attendees will join your event."
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setLocationFormat("venue")}
              aria-pressed={locationFormat === "venue"}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                locationFormat === "venue"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card",
              )}
            >
              {locationFormat === "venue" && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <MapPin className="h-6 w-6 text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-foreground">Venue</p>
                <p className="text-sm text-muted-foreground">In-person with a physical location.</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLocationFormat("online")}
              aria-pressed={locationFormat === "online"}
              className={cn(
                "relative flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-all duration-200",
                "hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                locationFormat === "online"
                  ? "border-primary bg-primary/5 shadow-sm"
                  : "border-border bg-card",
              )}
            >
              {locationFormat === "online" && (
                <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
              )}
              <Laptop className="h-6 w-6 text-primary" aria-hidden />
              <div>
                <p className="font-semibold text-foreground">Online</p>
                <p className="text-sm text-muted-foreground">Virtual meeting or live stream link.</p>
              </div>
            </button>
          </div>

          <div className="space-y-2">
            {locationFormat === "venue" ? (
              <>
                <Label htmlFor="location-detail">
                  Location name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location-detail"
                  name="locationName"
                  placeholder="Start typing for suggestions or enter a venue"
                  list="venue-suggestions"
                  className="h-11"
                  required
                />
                <datalist id="venue-suggestions">
                  {VENUE_SUGGESTIONS.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </>
            ) : (
              <>
                <Label htmlFor="location-detail-online">
                  Meeting or stream link <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="location-detail-online"
                  name="meetingLink"
                  type="url"
                  placeholder="https://teams.microsoft.com/... or Zoom link"
                  className="h-11"
                  required
                />
              </>
            )}
          </div>
        </section>

        <section className="space-y-4">
          <SectionTitle
            title="Date and time"
            description="Select when the event starts. Add an end time if needed."
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="space-y-2 sm:min-w-[200px]">
              <Label>
                Start date <span className="text-destructive">*</span>
              </Label>
              <Popover open={startPopoverOpen} onOpenChange={setStartPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "h-11 w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                    {startDate ? format(startDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={(d) => {
                      setStartDate(d);
                      if (d) setStartPopoverOpen(false);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2 sm:w-40">
              <Label htmlFor="start-time">
                Start time <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                <Input id="start-time" name="startTime" type="time" className="h-11 pl-9" required />
              </div>
            </div>
            <div className="flex items-center pb-2 sm:pb-0">
              {!showEndTime ? (
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => setShowEndTime(true)}
                >
                  + Add end time
                </button>
              ) : (
                <button
                  type="button"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground hover:underline"
                  onClick={() => {
                    setShowEndTime(false);
                    setEndDate(undefined);
                  }}
                >
                  Remove end time
                </button>
              )}
            </div>
          </div>

          {showEndTime && (
            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end pt-2 border-t border-border/60">
              <div className="space-y-2 sm:min-w-[200px]">
                <Label>End date</Label>
                <Popover open={endPopoverOpen} onOpenChange={setEndPopoverOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "h-11 w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                      {endDate ? format(endDate, "PPP") : "Pick end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={(d) => {
                        setEndDate(d);
                        if (d) setEndPopoverOpen(false);
                      }}
                      initialFocus
                      disabled={(date) => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2 sm:w-40">
                <Label htmlFor="end-time">End time</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input id="end-time" name="endTime" type="time" className="h-11 pl-9" />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2 max-w-md">
            <Label htmlFor="timezone">
              Time zone <span className="text-destructive">*</span>
            </Label>
            <Select value={timezone} onValueChange={setTimezone} required>
              <SelectTrigger id="timezone" className="h-11">
                <SelectValue placeholder="Select time zone" />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <section className="space-y-3">
          <Label className="text-base font-medium" htmlFor="event-description">
            Event description <span className="text-destructive">*</span>
          </Label>
          <div className="rounded-lg border border-input bg-background overflow-hidden shadow-sm">
            <div
              className="flex flex-wrap gap-1 border-b border-border bg-muted/30 px-2 py-1.5"
              onMouseDown={handleToolbarMouseDown}
            >
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Bold"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => runFormat("bold")}
              >
                <Bold className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Italic"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => runFormat("italic")}
              >
                <Italic className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Underline"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => runFormat("underline")}
              >
                <Underline className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label="Bullet list"
                onMouseDown={handleToolbarMouseDown}
                onClick={() => runFormat("insertUnorderedList")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <div
              ref={descriptionRef}
              id="event-description"
              role="textbox"
              aria-multiline="true"
              contentEditable
              suppressContentEditableWarning
              className="min-h-[160px] px-3 py-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground"
              data-placeholder="Describe your event, agenda, and what attendees should expect..."
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Use the toolbar to format text. Rich text is stored for this session until you submit.
          </p>
        </section>

        <section className="space-y-4">
          <SectionTitle
            title="Event details"
            description="Category, audience, and capacity for organizer review."
          />
          <Card className="shadow-card border-border/60">
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select name="category">
                  <SelectTrigger id="category">
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
                <Label htmlFor="group">Target group</Label>
                <Select name="group">
                  <SelectTrigger id="group">
                    <SelectValue placeholder="Select group" />
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
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" name="duration" placeholder="e.g., 1.5 hours" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max attendees</Label>
                <Input id="maxAttendees" name="maxAttendees" type="number" min={1} placeholder="100" />
              </div>
            </CardContent>
          </Card>
        </section>

        <Collapsible defaultOpen className="group">
          <Card className="shadow-card border-border/60">
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer select-none hover:bg-muted/40 transition-colors rounded-t-xl">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-lg">Speaker / sessions</CardTitle>
                  <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
                </div>
                <p className="text-sm font-normal text-muted-foreground text-left">
                  Add one or more speakers or session blocks.
                </p>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-6 pt-0">
                {sessions.map((session, idx) => (
                  <div
                    key={session.id}
                    className="rounded-lg border border-border/80 p-4 space-y-4 bg-muted/20"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-medium text-sm">Session {idx + 1}</h3>
                      {sessions.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeSession(session.id)}
                          aria-label={`Remove session ${idx + 1}`}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`sp-name-${session.id}`}>Speaker name</Label>
                        <Input id={`sp-name-${session.id}`} placeholder="Full name" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`sp-title-${session.id}`}>Speaker title</Label>
                        <Input id={`sp-title-${session.id}`} placeholder="e.g., Senior Architect" />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`sp-li-${session.id}`}>LinkedIn profile</Label>
                        <Input id={`sp-li-${session.id}`} placeholder="https://linkedin.com/in/..." />
                      </div>
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor={`sp-topic-${session.id}`}>Session topic brief</Label>
                        <textarea
                          id={`sp-topic-${session.id}`}
                          className="flex min-h-[72px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          placeholder="Brief about this session..."
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addSession} className="gap-2 w-full sm:w-auto">
                  <Plus className="h-4 w-4" /> Add another session
                </Button>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-2">
          <Button type="button" variant="outline">
            Save as draft
          </Button>
          <Button type="submit" className="gap-2">
            <Send className="h-4 w-4" /> Submit for approval
          </Button>
        </div>
      </form>
    </div>
  );
}
