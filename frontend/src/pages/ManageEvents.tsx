import { mockEvents } from "@/data/mockEvents";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Edit, Send, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

export default function ManageEvents() {
  const { toast } = useToast();

  const pendingEvents = mockEvents.slice(0, 3).map((e) => ({ ...e, status: "pending" as const }));
  const approvedEvents = mockEvents.slice(3, 6);
  const completedEvents = mockEvents.slice(6);

  const EventRow = ({ event, showActions = false }: { event: typeof mockEvents[0]; showActions?: boolean }) => (
    <Card className="shadow-card border-border/60 hover:shadow-card-hover transition-shadow">
      <CardContent className="p-4 flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-medium text-sm truncate">{event.title}</p>
            <Badge variant="outline" className="text-[10px]">{event.category}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {new Date(event.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })} · {event.time} · {event.speaker.name}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {showActions ? (
            <>
              <Button
                size="sm"
                variant="default"
                className="gap-1 h-7"
                onClick={() => toast({ title: "Event approved!" })}
              >
                <Check className="h-3 w-3" /> Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1 h-7"
                onClick={() => toast({ title: "Event declined", variant: "destructive" })}
              >
                <X className="h-3 w-3" /> Decline
              </Button>
            </>
          ) : (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem><Edit className="mr-2 h-3.5 w-3.5" /> Edit</DropdownMenuItem>
                <DropdownMenuItem><Send className="mr-2 h-3.5 w-3.5" /> Send Notification</DropdownMenuItem>
                <DropdownMenuItem><Clock className="mr-2 h-3.5 w-3.5" /> Reschedule</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Manage Events</h1>
        <p className="text-sm text-muted-foreground">Review, approve and manage event requests</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending" className="gap-1">
            Pending <Badge variant="destructive" className="ml-1 h-5 px-1.5 text-[10px]">{pendingEvents.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-3 mt-4">
          {pendingEvents.map((e) => <EventRow key={e.id} event={e} showActions />)}
        </TabsContent>
        <TabsContent value="approved" className="space-y-3 mt-4">
          {approvedEvents.map((e) => <EventRow key={e.id} event={e} />)}
        </TabsContent>
        <TabsContent value="completed" className="space-y-3 mt-4">
          {completedEvents.map((e) => <EventRow key={e.id} event={e} />)}
        </TabsContent>
      </Tabs>
    </div>
  );
}
