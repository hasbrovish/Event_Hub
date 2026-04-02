import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Clock } from "lucide-react";

const campaigns = [
  { id: 1, event: "AI & ML Workshop", channel: "MS Teams", status: "scheduled", date: "Apr 3" },
  { id: 2, event: "Cricket Tournament", channel: "Viva Engage", status: "sent", date: "Apr 1" },
  { id: 3, event: "Banking Deep Dive", channel: "MS Teams", status: "draft", date: "-" },
];

export default function Campaigns() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Schedule and manage event promotions</p>
        </div>
        <Button className="gap-2"><Send className="h-4 w-4" /> New Campaign</Button>
      </div>

      {/* Quick Create */}
      <Card className="shadow-card border-border/60">
        <CardContent className="p-4">
          <p className="font-medium text-sm mb-3">Quick Schedule</p>
          <div className="flex gap-3 flex-wrap">
            <Select>
              <SelectTrigger className="w-48"><SelectValue placeholder="Select event" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">AI & ML Workshop</SelectItem>
                <SelectItem value="5">Cricket Tournament</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-40"><SelectValue placeholder="Channel" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="teams">MS Teams</SelectItem>
                <SelectItem value="viva">Viva Engage</SelectItem>
              </SelectContent>
            </Select>
            <Input type="datetime-local" className="w-52" />
            <Button>Schedule</Button>
          </div>
        </CardContent>
      </Card>

      {/* Campaign List */}
      <div className="space-y-3">
        {campaigns.map((c) => (
          <Card key={c.id} className="shadow-card border-border/60">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Send className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{c.event}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {c.date} · {c.channel}
                </p>
              </div>
              <Badge variant={c.status === "sent" ? "default" : "outline"}>
                {c.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
