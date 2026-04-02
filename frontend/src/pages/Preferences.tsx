import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Bell, Eye, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Preferences() {
  const { toast } = useToast();

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Preferences</h1>
        <p className="text-sm text-muted-foreground">Customize your EventHub experience</p>
      </div>

      {/* Event Interests */}
      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" /> Event Interests
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">Select the categories you're interested in</p>
          <div className="grid grid-cols-2 gap-3">
            {["Technology", "Domain", "Health & Wellness", "Fun & Recreation", "Product", "Leadership"].map((cat) => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer">
                <Checkbox defaultChecked={cat === "Technology" || cat === "Health & Wellness"} />
                <span className="text-sm">{cat}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Push Notifications</p>
              <p className="text-xs text-muted-foreground">Get notified about new events</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Email Digest</p>
              <p className="text-xs text-muted-foreground">Receive a daily/weekly summary</p>
            </div>
            <Select defaultValue="daily">
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="off">Off</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Event Reminders</p>
              <p className="text-xs text-muted-foreground">Remind before registered events</p>
            </div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-popup on Return</p>
              <p className="text-xs text-muted-foreground">Show EventHub when away for 1+ hour</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* View Preferences */}
      <Card className="shadow-card border-border/60">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" /> Display
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Default Calendar View</Label>
            <Select defaultValue="week">
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="day">1 Day</SelectItem>
                <SelectItem value="3days">3 Days</SelectItem>
                <SelectItem value="week">Week</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Notification Time</Label>
            <Select defaultValue="morning">
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="login">On Login</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => toast({ title: "Preferences saved!" })}>
          Save Preferences
        </Button>
      </div>
    </div>
  );
}
