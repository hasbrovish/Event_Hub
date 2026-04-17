import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send, Clock, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useEvents } from "@/hooks/useEvents";
import { useCampaigns, useCreateCampaign, useDeleteCampaignDraft, useSendCampaignNow } from "@/hooks/useCampaigns";
import { useToast } from "@/hooks/use-toast";

export default function Campaigns() {
  const { toast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const canOrganize = user?.roles.some((r) =>
    ["organizer", "admin", "platform_admin", "governance"].includes(r),
  );

  const eventsQ = useEvents({ page_size: 80 });
  const campaignsQ = useCampaigns();
  const createMut = useCreateCampaign();
  const sendMut = useSendCampaignNow();
  const delMut = useDeleteCampaignDraft();

  const [eventId, setEventId] = useState<string>("");
  const [message, setMessage] = useState("");
  const [scheduledLocal, setScheduledLocal] = useState("");

  const eventTitle = (id: string) =>
    eventsQ.data?.items.find((e) => e.id === id)?.title ?? id.slice(0, 8);

  const onCreate = () => {
    if (!eventId || !message.trim()) {
      toast({ title: "Pick an event and enter a message", variant: "destructive" });
      return;
    }
    let scheduled_at: string | null = null;
    if (scheduledLocal) {
      const d = new Date(scheduledLocal);
      if (!Number.isNaN(d.getTime())) scheduled_at = d.toISOString();
    }
    createMut.mutate(
      { event_id: eventId, message: message.trim(), scheduled_at },
      {
        onSuccess: () => {
          toast({ title: "Campaign created" });
          setMessage("");
          setScheduledLocal("");
        },
        onError: (e) =>
          toast({
            title: "Failed",
            description: e instanceof Error ? e.message : "Error",
            variant: "destructive",
          }),
      },
    );
  };

  if (!isAuthenticated || !canOrganize) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <p className="text-muted-foreground">
          Organizer, governance team, admin, or platform_admin role required (see PS.md).
        </p>
      </div>
    );
  }

  const isGovernanceOnly =
    user?.roles.includes("governance") &&
    !user.roles.some((r) => ["organizer", "admin", "platform_admin"].includes(r));

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Campaigns</h1>
          <p className="text-sm text-muted-foreground">Backed by <code className="text-xs">/campaigns</code> (mock post)</p>
          {isGovernanceOnly && (
            <p className="text-xs text-muted-foreground mt-2 max-w-xl">
              <strong>Governance team</strong> (PS.md): schedule Teams / Viva / InfyMe-style campaigns for published
              events. Event approval stays with <strong>Event Organizers</strong>.
            </p>
          )}
        </div>
      </div>

      <Card className="shadow-card border-border/60">
        <CardContent className="p-4 space-y-3">
          <p className="font-medium text-sm">New campaign</p>
          <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
            <Select value={eventId || undefined} onValueChange={setEventId}>
              <SelectTrigger className="w-full sm:w-56">
                <SelectValue placeholder={eventsQ.isPending ? "Loading events…" : "Select event"} />
              </SelectTrigger>
              <SelectContent>
                {eventsQ.data?.items.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Message"
              className="flex-1 min-w-[12rem]"
              value={message}
              onChange={(ev) => setMessage(ev.target.value)}
            />
            <Input
              type="datetime-local"
              className="w-full sm:w-52"
              value={scheduledLocal}
              onChange={(ev) => setScheduledLocal(ev.target.value)}
            />
            <Button onClick={onCreate} disabled={createMut.isPending}>
              {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {campaignsQ.isPending && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading campaigns…
        </div>
      )}

      <div className="space-y-3">
        {campaignsQ.data?.items.map((c) => (
          <Card key={c.id} className="shadow-card border-border/60">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Send className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm">{eventTitle(c.event_id)}</p>
                <p className="text-xs text-muted-foreground line-clamp-2">{c.message}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Clock className="h-3 w-3" />
                  {new Date(c.scheduled_at).toLocaleString()} · {c.status}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Badge variant={c.status === "Posted" ? "default" : "outline"}>{c.status}</Badge>
                {c.status !== "Posted" && (
                  <Button
                    size="sm"
                    variant="secondary"
                    disabled={sendMut.isPending}
                    onClick={() =>
                      sendMut.mutate(c.id, {
                        onSuccess: () => toast({ title: "Sent (mock)" }),
                        onError: (e) =>
                          toast({
                            title: "Send failed",
                            description: e instanceof Error ? e.message : "",
                            variant: "destructive",
                          }),
                      })
                    }
                  >
                    Send now
                  </Button>
                )}
                {c.status === "Draft" && (
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={delMut.isPending}
                    onClick={() =>
                      delMut.mutate(c.id, {
                        onSuccess: () => toast({ title: "Draft deleted" }),
                        onError: (e) =>
                          toast({
                            title: "Delete failed",
                            description: e instanceof Error ? e.message : "",
                            variant: "destructive",
                          }),
                      })
                    }
                  >
                    Delete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {campaignsQ.data && campaignsQ.data.items.length === 0 && !campaignsQ.isPending && (
        <p className="text-sm text-muted-foreground">No campaigns yet.</p>
      )}
    </div>
  );
}
