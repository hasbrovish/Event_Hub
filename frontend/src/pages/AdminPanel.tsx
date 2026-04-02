import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, BarChart3, Settings, AlertTriangle, CheckCircle } from "lucide-react";

const accessMatrix = [
  { name: "Priya Sharma", role: "Organizer", group: "Bangalore - Unit 1", status: "active" },
  { name: "Rahul Verma", role: "Governance", group: "Pune - All Units", status: "active" },
  { name: "Anita Desai", role: "Organizer", group: "Hyderabad - Unit 3", status: "active" },
  { name: "Vikram Singh", role: "Governance", group: "Mysore - Sports", status: "pending" },
];

const logs = [
  { time: "10:32 AM", action: "Event approved", user: "Priya Sharma", details: "AI & ML Workshop" },
  { time: "10:15 AM", action: "Campaign sent", user: "System", details: "Cricket Tournament - Teams" },
  { time: "9:48 AM", action: "User login", user: "Admin", details: "Dashboard access" },
  { time: "9:30 AM", action: "Event proposed", user: "Sneha Patel", details: "React Best Practices" },
];

export default function AdminPanel() {
  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Manage access, configuration and monitor system health</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          { icon: Users, label: "Total Users", value: "2,340", color: "text-primary" },
          { icon: Shield, label: "Organizers", value: "18", color: "text-primary" },
          { icon: BarChart3, label: "Events This Month", value: "24", color: "text-primary" },
          { icon: AlertTriangle, label: "Pending Approvals", value: "3", color: "text-destructive" },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-card border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="access">
        <TabsList>
          <TabsTrigger value="access">Access Matrix</TabsTrigger>
          <TabsTrigger value="logs">System Logs</TabsTrigger>
          <TabsTrigger value="config">App Config</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="mt-4">
          <Card className="shadow-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Access Matrix</CardTitle>
              <Button size="sm">Add User</Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {accessMatrix.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell><Badge variant="outline">{row.role}</Badge></TableCell>
                      <TableCell className="text-sm">{row.group}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "active" ? "default" : "secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">Edit</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {logs.map((log, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm border-b border-border/40 pb-3 last:border-0">
                  <span className="text-xs text-muted-foreground w-16 shrink-0">{log.time}</span>
                  <CheckCircle className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <span className="font-medium">{log.action}</span>
                    <span className="text-muted-foreground"> by {log.user}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{log.details}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">App Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { label: "Max events per day", value: "10" },
                { label: "Default notification channel", value: "teams" },
                { label: "Auto-approve for Governance", value: "yes" },
              ].map((cfg) => (
                <div key={cfg.label} className="flex items-center justify-between">
                  <span className="text-sm">{cfg.label}</span>
                  <Select defaultValue={cfg.value}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={cfg.value}>{cfg.value}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
              <div className="flex justify-end pt-4">
                <Button>Save Config</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
