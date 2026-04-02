import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function CreateEvent() {
  const { toast } = useToast();
  const [sessions, setSessions] = useState([{ id: 1 }]);

  const addSession = () => setSessions([...sessions, { id: sessions.length + 1 }]);
  const removeSession = (id: number) => setSessions(sessions.filter((s) => s.id !== id));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Event Proposed!",
      description: "Your event has been submitted for organizer approval.",
    });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Propose an Event</h1>
        <p className="text-sm text-muted-foreground">Fill in the details below. Your event will be reviewed by the organizer.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card border-border/60">
          <CardHeader>
            <CardTitle className="text-lg">Event Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="title">Event Title</Label>
                <Input id="title" placeholder="e.g., AI & ML Workshop" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" placeholder="Describe your event..." rows={4} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
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
                <Label htmlFor="group">Target Group</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select group" /></SelectTrigger>
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
                <Input id="date" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" type="time" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration</Label>
                <Input id="duration" placeholder="e.g., 1.5 hours" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Venue / Link</Label>
                <Input id="location" placeholder="Building/Room or MS Teams link" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxAttendees">Max Attendees</Label>
                <Input id="maxAttendees" type="number" placeholder="100" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sessions */}
        {sessions.map((session, idx) => (
          <Card key={session.id} className="shadow-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Speaker / Session {idx + 1}</CardTitle>
              {sessions.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeSession(session.id)}>
                  <X className="h-4 w-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Speaker Name</Label>
                  <Input placeholder="Full name" />
                </div>
                <div className="space-y-2">
                  <Label>Speaker Title</Label>
                  <Input placeholder="e.g., Senior Architect" />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn Profile</Label>
                  <Input placeholder="https://linkedin.com/in/..." />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Session Topic Brief</Label>
                  <Textarea placeholder="Brief about this session..." rows={2} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        <Button type="button" variant="outline" onClick={addSession} className="gap-2">
          <Plus className="h-4 w-4" /> Add Another Session
        </Button>

        <div className="flex justify-end gap-3 pt-4">
          <Button type="button" variant="outline">Save as Draft</Button>
          <Button type="submit" className="gap-2">
            <Send className="h-4 w-4" /> Submit for Approval
          </Button>
        </div>
      </form>
    </div>
  );
}
