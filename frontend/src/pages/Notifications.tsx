import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, Calendar, CheckCircle, Info, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

const notifications = [
  { id: 1, type: "event", title: "AI & ML Workshop starts in 1 hour", time: "5 min ago", read: false, icon: Calendar },
  { id: 2, type: "approval", title: "Your event 'React Meetup' was approved!", time: "2 hours ago", read: false, icon: CheckCircle },
  { id: 3, type: "reminder", title: "Yoga session tomorrow at 7 AM", time: "4 hours ago", read: true, icon: Bell },
  { id: 4, type: "update", title: "Cricket Tournament venue changed to Ground B", time: "1 day ago", read: true, icon: AlertTriangle },
  { id: 5, type: "info", title: "New events matching your interests are available", time: "2 days ago", read: true, icon: Info },
];

export default function Notifications() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">Stay updated on events and approvals</p>
        </div>
        <Button variant="outline" size="sm">Mark all read</Button>
      </div>

      <div className="space-y-2">
        {notifications.map((n) => (
          <Card key={n.id} className={`shadow-card border-border/60 transition-colors ${!n.read ? "bg-primary/5 border-primary/20" : ""}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${!n.read ? "bg-primary/10" : "bg-muted"}`}>
                <n.icon className={`h-4 w-4 ${!n.read ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.read ? "font-medium" : ""}`}>{n.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
              </div>
              {!n.read && <Badge variant="default" className="text-[10px] h-5">New</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
