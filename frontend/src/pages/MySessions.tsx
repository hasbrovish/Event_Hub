import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Mic, Calendar, Users } from "lucide-react";

const mySessions = [
  { id: "1", title: "AI & ML Workshop", date: "Apr 5, 2026", status: "approved", attendees: 87 },
  { id: "2", title: "React Best Practices", date: "Apr 3, 2026", status: "pending", attendees: 0 },
  { id: "3", title: "Cloud Native Patterns", date: "Mar 20, 2026", status: "completed", attendees: 145 },
];

const statusColors: Record<string, string> = {
  approved: "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  completed: "bg-muted text-muted-foreground",
};

export default function MySessions() {
  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Sessions</h1>
          <p className="text-sm text-muted-foreground">Events you've proposed or spoken at</p>
        </div>
        <Button className="gap-2"><Mic className="h-4 w-4" /> Propose New</Button>
      </div>

      <div className="space-y-3">
        {mySessions.map((s) => (
          <Card key={s.id} className="shadow-card border-border/60 hover:shadow-card-hover transition-shadow">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Mic className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium">{s.title}</p>
                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{s.date}</span>
                  {s.attendees > 0 && <span className="flex items-center gap-1"><Users className="h-3 w-3" />{s.attendees}</span>}
                </div>
              </div>
              <Badge className={statusColors[s.status]}>{s.status}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
