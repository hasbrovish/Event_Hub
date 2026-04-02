import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Shield, Users, BarChart3, Settings, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  useAccessMatrix,
  useAdminConfig,
  useAdminLogs,
  useAdminStats,
  usePatchAdminConfig,
} from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import type { ConfigEntryApi } from "@/types/api";

function tabFromPath(pathname: string): string {
  if (pathname.includes("/admin/logs")) return "logs";
  if (pathname.includes("/admin/config")) return "config";
  return "access";
}

function pathForTab(t: string): string {
  if (t === "logs") return "/admin/logs";
  if (t === "config") return "/admin/config";
  return "/admin/access";
}

export default function AdminPanel() {
  const navigate = useNavigate();
  const loc = useLocation();
  const tab = tabFromPath(loc.pathname);
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const isAdmin = user?.roles.some((r) => r === "admin" || r === "platform_admin");
  const isPlatform = user?.roles.includes("platform_admin");

  const statsQ = useAdminStats(isAuthenticated && !!isAdmin);
  const matrixQ = useAccessMatrix(isAuthenticated && !!isAdmin && tab === "access");
  const logsQ = useAdminLogs(isAuthenticated && !!isAdmin && tab === "logs");
  const configQ = useAdminConfig(isAuthenticated && !!isAdmin && tab === "config");
  const patchConfig = usePatchAdminConfig();

  const [configDraft, setConfigDraft] = useState<ConfigEntryApi[]>([]);

  useEffect(() => {
    if (configQ.data?.items) setConfigDraft(configQ.data.items.map((x) => ({ ...x })));
  }, [configQ.data]);

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="p-6 max-w-6xl mx-auto">
        <p className="text-muted-foreground">Admin or platform_admin role required.</p>
      </div>
    );
  }

  const onSaveConfig = () => {
    patchConfig.mutate(configDraft, {
      onSuccess: () => toast({ title: "Config updated" }),
      onError: (e) =>
        toast({
          title: "Failed",
          description: e instanceof Error ? e.message : "",
          variant: "destructive",
        }),
    });
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Live data from <code className="text-xs">/admin/*</code></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {statsQ.isPending ? (
          <div className="col-span-4 flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading stats…
          </div>
        ) : (
          [
            { icon: Users, label: "Total users", value: String(statsQ.data?.total_users ?? "—") },
            { icon: Shield, label: "Organizers", value: String(statsQ.data?.organizers ?? "—") },
            { icon: BarChart3, label: "Events this month", value: String(statsQ.data?.events_this_month ?? "—") },
            {
              icon: BarChart3,
              label: "Pending approvals",
              value: String(statsQ.data?.pending_approvals ?? "—"),
            },
          ].map((stat) => (
            <Card key={stat.label} className="shadow-card border-border/60">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Tabs value={tab} onValueChange={(v) => navigate(pathForTab(v))}>
        <TabsList>
          <TabsTrigger value="access">Access matrix</TabsTrigger>
          <TabsTrigger value="logs">System logs</TabsTrigger>
          <TabsTrigger value="config">App config</TabsTrigger>
        </TabsList>

        <TabsContent value="access" className="mt-4">
          <Card className="shadow-card border-border/60">
            <CardHeader>
              <CardTitle className="text-lg">Groups → organizer WIDs</CardTitle>
            </CardHeader>
            <CardContent>
              {matrixQ.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Group</TableHead>
                      <TableHead>Organizer WIDs</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {matrixQ.data?.items.map((row) => (
                      <TableRow key={row.group_id}>
                        <TableCell className="font-medium">{row.group_name}</TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground">
                          {row.organizer_wids.length ? row.organizer_wids.join(", ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!matrixQ.isPending && matrixQ.data?.items.length === 0 && (
                <p className="text-sm text-muted-foreground">No groups yet.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="mt-4">
          <Card className="shadow-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Audit log</CardTitle>
              <Button variant="outline" size="sm" onClick={() => void logsQ.refetch()} disabled={logsQ.isPending}>
                Refresh
              </Button>
            </CardHeader>
            <CardContent>
              {logsQ.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : logsQ.isError ? (
                <p className="text-sm text-destructive">Could not load logs.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-28">Time</TableHead>
                      <TableHead className="w-40">Action</TableHead>
                      <TableHead>Detail</TableHead>
                      <TableHead className="w-36">Actor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(logsQ.data?.items ?? []).map((row) => (
                      <TableRow key={row.id}>
                        <TableCell className="text-xs whitespace-nowrap align-top">
                          {new Date(row.created_at).toLocaleString("en-US", {
                            dateStyle: "short",
                            timeStyle: "medium",
                          })}
                        </TableCell>
                        <TableCell className="text-xs font-mono align-top">{row.action}</TableCell>
                        <TableCell className="text-xs text-muted-foreground break-all align-top">
                          {row.detail ?? "—"}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground align-top break-all">
                          {row.actor_wid ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
              {!logsQ.isPending && !logsQ.isError && (logsQ.data?.items?.length ?? 0) === 0 && (
                <p className="text-sm text-muted-foreground">No audit entries yet. Approvals and config changes appear here.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config" className="mt-4">
          <Card className="shadow-card border-border/60">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings className="h-5 w-5" /> Runtime config
              </CardTitle>
              <Button
                size="sm"
                disabled={!isPlatform || patchConfig.isPending}
                onClick={onSaveConfig}
              >
                {patchConfig.isPending ? "Saving…" : "Save"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {!isPlatform && (
                <p className="text-xs text-amber-700">Saving requires <strong>platform_admin</strong>.</p>
              )}
              {configQ.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                configDraft.map((row, i) => (
                  <div key={row.key} className="flex gap-2 items-center">
                    <Input className="font-mono text-xs flex-1" readOnly value={row.key} />
                    <Input
                      className="flex-1"
                      value={row.value}
                      disabled={!isPlatform}
                      onChange={(ev) => {
                        const next = [...configDraft];
                        next[i] = { ...row, value: ev.target.value };
                        setConfigDraft(next);
                      }}
                    />
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
