import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Check,
  Clock,
  Eye,
  FileText,
  MapPin,
  Send,
  Sparkles,
  Tag,
  User,
  Users,
  Wand2,
} from "lucide-react";

const DESC_MAX = 500;

const STEP_META = [
  { title: "Event Details", subtitle: "Basic info about your event." },
  { title: "Speaker & Sessions", subtitle: "Add speakers and sessions." },
  { title: "Schedule & Venue", subtitle: "When and where." },
  { title: "Review & Submit", subtitle: "Preview and submit." },
] as const;

const STEPPER_LABELS = ["Event Details", "Speaker & Sessions", "Schedule & Venue", "Review & Submit"] as const;

const CATEGORY_OPTIONS = [
  { value: "tech", label: "Technology" },
  { value: "domain", label: "Domain" },
  { value: "health", label: "Health & Wellness" },
  { value: "fun", label: "Fun & Recreation" },
  { value: "product", label: "Product" },
] as const;

const GROUP_OPTIONS = [
  { value: "all", label: "All employees" },
  { value: "unit", label: "My unit" },
  { value: "location", label: "My location" },
  { value: "org", label: "Organization wide" },
] as const;

const DURATION_OPTIONS = [
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60", label: "1 hour" },
  { value: "90", label: "1.5 hours" },
  { value: "120", label: "2 hours" },
  { value: "180", label: "3 hours" },
] as const;

type SpeakerBlock = {
  id: number;
  name: string;
  title: string;
  linkedin: string;
  email: string;
  topic: string;
};

function nextId() {
  return Date.now() + Math.random();
}

export default function CreateEvent() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetGroup, setTargetGroup] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  const [speakers, setSpeakers] = useState<SpeakerBlock[]>([
    { id: 1, name: "", title: "", linkedin: "", email: "", topic: "" },
  ]);

  const [eventDate, setEventDate] = useState<Date | undefined>();
  const [dateOpen, setDateOpen] = useState(false);
  const [eventTime, setEventTime] = useState("");
  const [duration, setDuration] = useState("");
  const [maxAttendees, setMaxAttendees] = useState("100");
  const [venue, setVenue] = useState("");

  const categoryLabel = CATEGORY_OPTIONS.find((c) => c.value === category)?.label ?? "Category";
  const durationLabel = DURATION_OPTIONS.find((d) => d.value === duration)?.label;

  const addSpeaker = () => {
    setSpeakers((s) => [...s, { id: nextId(), name: "", title: "", linkedin: "", email: "", topic: "" }]);
  };

  const updateSpeaker = (id: number, patch: Partial<Omit<SpeakerBlock, "id">>) => {
    setSpeakers((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeSpeaker = (id: number) => {
    setSpeakers((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== id)));
  };

  const addTagFromInput = useCallback(() => {
    const t = tagInput.trim();
    if (!t || tags.includes(t)) {
      setTagInput("");
      return;
    }
    setTags((prev) => [...prev, t]);
    setTagInput("");
  }, [tagInput, tags]);

  const validateStep = (s: number): boolean => {
    if (s === 0) {
      if (!title.trim()) {
        toast({ title: "Required", description: "Please enter an event title.", variant: "destructive" });
        return false;
      }
      if (!description.trim()) {
        toast({ title: "Required", description: "Please enter a description.", variant: "destructive" });
        return false;
      }
      if (!category) {
        toast({ title: "Required", description: "Please select a category.", variant: "destructive" });
        return false;
      }
      if (!targetGroup) {
        toast({ title: "Required", description: "Please select a target group.", variant: "destructive" });
        return false;
      }
      return true;
    }
    if (s === 1) {
      for (let i = 0; i < speakers.length; i++) {
        const sp = speakers[i];
        if (!sp.name.trim() || !sp.title.trim() || !sp.topic.trim()) {
          toast({
            title: "Required",
            description: `Speaker / Session ${i + 1}: name, title, and session topic are required.`,
            variant: "destructive",
          });
          return false;
        }
      }
      return true;
    }
    if (s === 2) {
      if (!eventDate) {
        toast({ title: "Required", description: "Please select a date.", variant: "destructive" });
        return false;
      }
      if (!eventTime) {
        toast({ title: "Required", description: "Please select a time.", variant: "destructive" });
        return false;
      }
      if (!duration) {
        toast({ title: "Required", description: "Please select a duration.", variant: "destructive" });
        return false;
      }
      if (!maxAttendees.trim() || Number(maxAttendees) < 1) {
        toast({ title: "Required", description: "Please enter max attendees.", variant: "destructive" });
        return false;
      }
      if (!venue.trim()) {
        toast({ title: "Required", description: "Please enter venue or meeting link.", variant: "destructive" });
        return false;
      }
      return true;
    }
    return true;
  };

  const goNext = () => {
    if (!validateStep(step)) return;
    setStep((x) => Math.min(3, x + 1));
  };

  const goPrev = () => {
    setStep((x) => Math.max(0, x - 1));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const handleSaveDraft = () => {
    toast({ title: "Draft saved", description: "Your proposal was saved as a draft (demo)." });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Submitted for approval",
      description: "Your event will be reviewed by an organizer.",
    });
    navigate("/");
  };

  const previewDate = eventDate ? format(eventDate, "MMM d, yyyy") : "Not set";
  const previewTime = eventTime || "Not set";
  const previewVenue = venue.trim() || "Not set";
  const previewCapacity = maxAttendees.trim() ? maxAttendees : "Not set";

  return (
    <div className="p-6 max-w-3xl mx-auto animate-fade-in pb-10">
      <header className="space-y-6 mb-8">
        <div className="flex items-start gap-3">
          <Button type="button" variant="ghost" size="icon" className="shrink-0 -ml-2" onClick={handleCancel} aria-label="Go back">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary shrink-0" />
              Propose an Event
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Step {step + 1} of 4 — {STEP_META[step].subtitle}
            </p>
          </div>
        </div>

        <nav aria-label="Progress" className="w-full">
          <ol className="flex items-start justify-between gap-1 sm:gap-2">
            {STEPPER_LABELS.map((label, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={label} className="flex-1 min-w-0 flex flex-col items-center">
                  <div className="flex items-center w-full">
                    {i > 0 && (
                      <div
                        className={cn("h-0.5 flex-1 rounded-full min-w-[4px]", done || active ? "bg-primary" : "bg-muted")}
                        aria-hidden
                      />
                    )}
                    <div
                      className={cn(
                        "shrink-0 flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-full text-xs sm:text-sm font-semibold border-2 transition-colors",
                        done && "bg-emerald-500 border-emerald-500 text-white",
                        active && !done && "bg-primary border-primary text-primary-foreground",
                        !done && !active && "bg-muted/50 border-muted text-muted-foreground",
                      )}
                    >
                      {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
                    </div>
                    {i < STEPPER_LABELS.length - 1 && (
                      <div
                        className={cn("h-0.5 flex-1 rounded-full min-w-[4px]", done ? "bg-primary" : "bg-muted")}
                        aria-hidden
                      />
                    )}
                  </div>
                  <span
                    className={cn(
                      "mt-2 text-[10px] sm:text-xs text-center font-medium leading-tight px-0.5",
                      active ? "text-primary" : "text-muted-foreground",
                    )}
                  >
                    {label}
                  </span>
                  <div
                    className={cn("h-1 w-full max-w-[72px] sm:max-w-none mt-1.5 rounded-full", active ? "bg-primary" : "bg-transparent")}
                    aria-hidden
                  />
                </li>
              );
            })}
          </ol>
        </nav>
      </header>

      <form onSubmit={handleSubmit} className="space-y-8">
        {step === 0 && (
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5 text-primary" />
                Event Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="evt-title">
                  Event title <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="evt-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., AI & ML Workshop"
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evt-desc">
                  Description <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="evt-desc"
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, DESC_MAX))}
                  placeholder="Describe your event in detail. What will attendees learn? What's the format?"
                  className="min-h-[140px] resize-y"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {description.length}/{DESC_MAX} characters
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORY_OPTIONS.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>
                    Target group <span className="text-destructive">*</span>
                  </Label>
                  <Select value={targetGroup} onValueChange={setTargetGroup}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select group" />
                    </SelectTrigger>
                    <SelectContent>
                      {GROUP_OPTIONS.map((g) => (
                        <SelectItem key={g.value} value={g.value}>
                          {g.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evt-tags">Tags</Label>
                <div className="relative">
                  <Input
                    id="evt-tags"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTagFromInput();
                      }
                    }}
                    placeholder="Add a tag and press Enter"
                    className="h-11 pr-10"
                  />
                  <Tag className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center rounded-md bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {speakers.map((sp, idx) => (
              <Card key={sp.id} className="shadow-card border-border/60">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                    <User className="h-5 w-5 text-primary" />
                    Speaker / Session {idx + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`sn-${sp.id}`}>
                        Speaker name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`sn-${sp.id}`}
                        value={sp.name}
                        onChange={(e) => updateSpeaker(sp.id, { name: e.target.value })}
                        placeholder="Full name"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`st-${sp.id}`}>
                        Speaker title <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id={`st-${sp.id}`}
                        value={sp.title}
                        onChange={(e) => updateSpeaker(sp.id, { title: e.target.value })}
                        placeholder="e.g., Senior Architect"
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sli-${sp.id}`}>LinkedIn profile</Label>
                      <Input
                        id={`sli-${sp.id}`}
                        value={sp.linkedin}
                        onChange={(e) => updateSpeaker(sp.id, { linkedin: e.target.value })}
                        placeholder="https://linkedin.com/in/..."
                        className="h-11"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`sem-${sp.id}`}>Email</Label>
                      <Input
                        id={`sem-${sp.id}`}
                        type="email"
                        value={sp.email}
                        onChange={(e) => updateSpeaker(sp.id, { email: e.target.value })}
                        placeholder="speaker@company.com"
                        className="h-11"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`stp-${sp.id}`}>
                      Session topic brief <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id={`stp-${sp.id}`}
                      value={sp.topic}
                      onChange={(e) => updateSpeaker(sp.id, { topic: e.target.value })}
                      placeholder="Brief about what this speaker will cover..."
                      className="min-h-[88px] resize-y"
                    />
                  </div>
                  {speakers.length > 1 && (
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removeSpeaker(sp.id)}>
                      Remove this speaker
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
            <button
              type="button"
              onClick={addSpeaker}
              className="w-full rounded-xl border-2 border-dashed border-border/80 bg-muted/20 py-4 px-4 text-sm font-medium text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              <span className="text-lg leading-none">+</span>
              Add another speaker/session
            </button>
          </div>
        )}

        {step === 2 && (
          <Card className="shadow-card border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                <div className="flex items-center gap-1.5 text-primary">
                  <CalendarIcon className="h-5 w-5" />
                  <Clock className="h-5 w-5 -ml-1" />
                </div>
                Schedule &amp; Venue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>
                    Date <span className="text-destructive">*</span>
                  </Label>
                  <Popover open={dateOpen} onOpenChange={setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn("h-11 w-full justify-start text-left font-normal", !eventDate && "text-muted-foreground")}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 shrink-0 opacity-70" />
                        {eventDate ? format(eventDate, "MM/dd/yyyy") : "mm/dd/yyyy"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eventDate}
                        onSelect={(d) => {
                          setEventDate(d);
                          if (d) setDateOpen(false);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evt-time">
                    Time <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="evt-time"
                      type="time"
                      value={eventTime}
                      onChange={(e) => setEventTime(e.target.value)}
                      className="h-11 pl-9"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>
                    Duration <span className="text-destructive">*</span>
                  </Label>
                  <Select value={duration} onValueChange={setDuration}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>
                          {d.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="evt-cap">
                    Max attendees <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                    <Input
                      id="evt-cap"
                      type="number"
                      min={1}
                      value={maxAttendees}
                      onChange={(e) => setMaxAttendees(e.target.value)}
                      placeholder="100"
                      className="h-11 pl-9"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="evt-venue">
                  Venue / meeting link <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  <Input
                    id="evt-venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    placeholder="Building/room name or MS Teams link"
                    className="h-11 pl-9"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card className="shadow-card border-border/60 overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2 font-semibold">
                <Eye className="h-5 w-5 text-primary" />
                Review your event
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl bg-[hsl(174_62%_28%)] text-primary-foreground p-5 sm:p-6 space-y-3">
                <Badge variant="secondary" className="bg-primary-foreground/20 text-primary-foreground border-0 hover:bg-primary-foreground/25">
                  {categoryLabel}
                </Badge>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{title.trim() || "Your event title"}</h2>
                <p className="text-sm opacity-90 line-clamp-4">
                  {description.trim() || "Event description will appear here..."}
                </p>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {tags.map((t) => (
                      <span key={t} className="text-xs rounded-md bg-primary-foreground/15 px-2 py-0.5">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/50 border border-border/60 p-3 flex gap-2 items-start">
                  <CalendarIcon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date</p>
                    <p className="text-sm font-medium">{previewDate}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 border border-border/60 p-3 flex gap-2 items-start">
                  <Clock className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Time</p>
                    <p className="text-sm font-medium">{previewTime}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 border border-border/60 p-3 flex gap-2 items-start">
                  <MapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Venue</p>
                    <p className="text-sm font-medium break-words">{previewVenue}</p>
                  </div>
                </div>
                <div className="rounded-lg bg-muted/50 border border-border/60 p-3 flex gap-2 items-start">
                  <Users className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs text-muted-foreground">Capacity</p>
                    <p className="text-sm font-medium">{previewCapacity}</p>
                    {durationLabel && <p className="text-xs text-muted-foreground mt-0.5">{durationLabel}</p>}
                  </div>
                </div>
              </div>

              <div className="speakers-preview space-y-3">
                <p className="text-sm font-medium">Speakers</p>
                <ul className="space-y-2 text-sm">
                  {speakers.map((sp, i) => (
                    <li key={sp.id} className="rounded-lg border border-border/60 p-3">
                      <p className="font-medium">
                        {sp.name || `Speaker ${i + 1}`}
                        {sp.title ? <span className="text-muted-foreground font-normal"> — {sp.title}</span> : null}
                      </p>
                      {sp.topic ? <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{sp.topic}</p> : null}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3 rounded-lg border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/30 p-4 text-sm text-amber-950 dark:text-amber-100">
                <Wand2 className="h-5 w-5 shrink-0 text-amber-700 dark:text-amber-400" />
                <p>Your event will be reviewed by the organizer before publishing.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="sticky bottom-0 z-10 -mx-6 px-6 py-4 mt-8 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {step === 0 ? (
              <Button type="button" variant="outline" className="gap-2" onClick={handleCancel}>
                <ArrowLeft className="h-4 w-4" />
                Cancel
              </Button>
            ) : (
              <Button type="button" variant="outline" className="gap-2" onClick={goPrev}>
                <ArrowLeft className="h-4 w-4" />
                Previous
              </Button>
            )}
            <div className="flex flex-col-reverse sm:flex-row gap-2 sm:items-center sm:justify-end flex-1">
              {step === 3 ? (
                <>
                  <Button type="button" variant="ghost" className="text-muted-foreground" onClick={handleSaveDraft}>
                    Save as draft
                  </Button>
                  <Button type="submit" className="gap-2 bg-[hsl(174_62%_28%)] hover:bg-[hsl(174_62%_24%)] text-primary-foreground">
                    <Send className="h-4 w-4" />
                    Submit for approval
                  </Button>
                </>
              ) : (
                <Button type="button" className="gap-2 sm:ml-auto bg-[hsl(174_62%_28%)] hover:bg-[hsl(174_62%_24%)] text-primary-foreground" onClick={goNext}>
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
