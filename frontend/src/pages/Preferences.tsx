import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Eye, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { usePreferences, useUpdatePreferences } from "@/hooks/usePreferences";
import { useGroupsList } from "@/hooks/useGroups";

const EVENT_TYPES = ["Technology", "Domain", "Health", "Fun", "Product", "Others"] as const;

export default function Preferences() {
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();
  const { data, isPending } = usePreferences();
  const updateMut = useUpdatePreferences();
  const groupsQ = useGroupsList(isAuthenticated);

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [followedGroups, setFollowedGroups] = useState<Set<number>>(new Set());
  const [frequency, setFrequency] = useState<string>("immediate");
  const [notifyLogin, setNotifyLogin] = useState(true);

  useEffect(() => {
    if (!data) return;
    setSelectedTypes(new Set(data.event_types ?? []));
    setFollowedGroups(new Set(data.followed_group_ids ?? []));
    setFrequency(data.notification_frequency || "immediate");
    setNotifyLogin(data.notify_on_login ?? true);
  }, [data]);

  const dirty = useMemo(() => {
    if (!data) return false;
    const orig = new Set(data.event_types ?? []);
    if (orig.size !== selectedTypes.size) return true;
    for (const x of selectedTypes) if (!orig.has(x)) return true;
    const origG = new Set(data.followed_group_ids ?? []);
    if (origG.size !== followedGroups.size) return true;
    for (const x of followedGroups) if (!origG.has(x)) return true;
    return (
      frequency !== (data.notification_frequency || "immediate") ||
      notifyLogin !== (data.notify_on_login ?? true)
    );
  }, [data, selectedTypes, followedGroups, frequency, notifyLogin]);

  const toggleGroup = (id: number) => {
    setFollowedGroups((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => {
      const n = new Set(prev);
      if (n.has(t)) n.delete(t);
      else n.add(t);
      return n;
    });
  };

  const onSave = () => {
    updateMut.mutate(
      {
        event_types: Array.from(selectedTypes),
        followed_group_ids: Array.from(followedGroups).sort((a, b) => a - b),
        notification_frequency: frequency,
        notify_on_login: notifyLogin,
      },
      {
        onSuccess: () => toast({ title: "Preferences saved" }),
        onError: (e) =>
          toast({
            title: "Save failed",
            description: e instanceof Error ? e.message : "Error",
            variant: "destructive",
          }),
      },
    );
  };

  if (!isAuthenticated) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <p className="text-muted-foreground">Sign in to manage preferences.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Preferences</h1>
        <p className="text-sm text-muted-foreground">Synced with <code className="text-xs">GET/PATCH /preferences</code></p>
      </div>

      {isPending && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      )}

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Event interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Used for recommendations and “new event” alerts</p>
          <div className="grid grid-cols-2 gap-3">
            {EVENT_TYPES.map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedTypes.has(cat)}
                  onCheckedChange={() => toggleType(cat)}
                />
                <span className="text-sm">{cat}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg">Followed groups</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Get &quot;new event&quot; alerts when events are published in these groups (with immediate frequency).
          </p>
          {groupsQ.isPending && (
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading groups…
            </p>
          )}
          {groupsQ.isError && (
            <p className="text-sm text-destructive">Could not load groups. Try again later.</p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
            {(groupsQ.data?.items ?? []).map((g) => (
              <label key={g.id} className="flex items-start gap-2 cursor-pointer">
                <Checkbox
                  className="mt-0.5"
                  checked={followedGroups.has(g.id)}
                  onCheckedChange={() => toggleGroup(g.id)}
                />
                <span className="text-sm leading-tight">
                  {g.name}
                  {g.unit ? (
                    <span className="block text-xs text-muted-foreground">{g.unit}</span>
                  ) : null}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Notify on login</p>
              <p className="text-xs text-muted-foreground">In-app feed when you open the hub</p>
            </div>
            <Switch checked={notifyLogin} onCheckedChange={setNotifyLogin} />
          </div>
          <Separator />
          <div className="flex items-center justify-between gap-4">
            <Label className="shrink-0">New-event alerts</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="daily_digest">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="text-xs text-muted-foreground">
            Only <strong>immediate</strong> creates rows when matching events go live; digests are not scheduled yet.
          </p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onSave} disabled={updateMut.isPending || !dirty}>
          {updateMut.isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </div>
  );
}
