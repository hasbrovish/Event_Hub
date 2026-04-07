import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MY_PROPOSALS,
  type ProposalApplicationStatus,
  type UserProposal,
} from "@/data/participantProfile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Calendar,
  ChevronDown,
  ClipboardList,
  FileText,
  Search,
  Sparkles,
  ThumbsUp,
} from "lucide-react";

const statusLabel: Record<ProposalApplicationStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  under_review: "Under review",
  approved: "Approved",
  revision_requested: "Revision requested",
  rejected: "Rejected",
};

const statusStyle: Record<ProposalApplicationStatus, string> = {
  draft: "bg-muted text-muted-foreground border-border",
  submitted: "bg-sky-500/10 text-sky-800 dark:text-sky-200 border-sky-500/30",
  under_review: "bg-amber-500/10 text-amber-900 dark:text-amber-200 border-amber-500/30",
  approved: "bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 border-emerald-500/30",
  revision_requested: "bg-orange-500/10 text-orange-900 dark:text-orange-200 border-orange-500/30",
  rejected: "bg-destructive/10 text-destructive border-destructive/30",
};

function filterTab(tab: string, p: UserProposal): boolean {
  if (tab === "all") return true;
  if (tab === "active") return p.status === "submitted" || p.status === "under_review" || p.status === "revision_requested";
  if (tab === "approved") return p.status === "approved";
  if (tab === "closed") return p.status === "rejected" || p.status === "draft";
  return true;
}

function matchesQuery(p: UserProposal, q: string): boolean {
  if (!q) return true;
  return (
    p.title.toLowerCase().includes(q) ||
    p.summary.toLowerCase().includes(q) ||
    p.track.toLowerCase().includes(q)
  );
}

export default function MyProposals() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const [openId, setOpenId] = useState<string | null>(MY_PROPOSALS[0]?.id ?? null);

  const q = query.trim().toLowerCase();
  const total = MY_PROPOSALS.length;
  const active = MY_PROPOSALS.filter(
    (p) => p.status === "submitted" || p.status === "under_review" || p.status === "revision_requested",
  ).length;
  const approvedN = MY_PROPOSALS.filter((p) => p.status === "approved").length;

  const tabKeys = ["all", "active", "approved", "closed"] as const;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8 animate-fade-in pb-16">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary">
            <ClipboardList className="h-7 w-7" />
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My proposals</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl">
            Every event you proposed and where it sits in the review pipeline. Expand a row to read the description.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <FileText className="h-3 w-3" />
              {total} total
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-amber-500/40 text-amber-900 dark:text-amber-200 font-normal">
              <Sparkles className="h-3 w-3" />
              {active} in progress
            </Badge>
            <Badge variant="outline" className="gap-1.5 border-emerald-500/40 text-emerald-900 dark:text-emerald-200 font-normal">
              {approvedN} approved
            </Badge>
          </div>
        </div>
        <Button type="button" className="gap-2 shrink-0" onClick={() => navigate("/create-event")}>
          New proposal
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, track, or summary..."
          className="pl-9 h-11 rounded-xl border-border/80 bg-card shadow-sm"
        />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList className="flex w-full h-auto flex-wrap justify-start gap-1 p-1 bg-muted/60 rounded-xl">
          <TabsTrigger value="all" className="rounded-lg data-[state=active]:shadow-sm">
            All
          </TabsTrigger>
          <TabsTrigger value="active" className="rounded-lg data-[state=active]:shadow-sm">
            In progress
          </TabsTrigger>
          <TabsTrigger value="approved" className="rounded-lg data-[state=active]:shadow-sm">
            Approved
          </TabsTrigger>
          <TabsTrigger value="closed" className="rounded-lg data-[state=active]:shadow-sm">
            Closed
          </TabsTrigger>
        </TabsList>

        {tabKeys.map((tk) => (
          <TabsContent key={tk} value={tk} className="mt-0 space-y-3 focus-visible:outline-none">
            {MY_PROPOSALS.filter((p) => filterTab(tk, p))
              .filter((p) => matchesQuery(p, q))
              .map((p, idx) => (
                <Collapsible
                  key={p.id}
                  open={openId === p.id}
                  onOpenChange={(o) => setOpenId(o ? p.id : null)}
                  className="animate-fade-in"
                  style={{ animationDelay: `${idx * 35}ms` }}
                >
                  <Card
                    className={cn(
                      "shadow-card border-border/70 overflow-hidden transition-all duration-200",
                      openId === p.id && "ring-2 ring-primary/25 border-primary/30 shadow-md",
                    )}
                  >
                    <CollapsibleTrigger asChild>
                      <button
                        type="button"
                        className="w-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <CardContent className="p-4 sm:p-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                          <div className="flex items-start gap-3 min-w-0 flex-1">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 space-y-1">
                              <p className="font-semibold leading-snug">{p.title}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1">
                                  <Calendar className="h-3.5 w-3.5 shrink-0" />
                                  Submitted{" "}
                                  {new Date(p.submittedAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
                                </span>
                                <span>{p.track}</span>
                                <span className="inline-flex items-center gap-1 tabular-nums">
                                  <ThumbsUp className="h-3.5 w-3.5 shrink-0" />
                                  {p.votes} votes
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                            <Badge variant="outline" className={cn("font-medium border", statusStyle[p.status])}>
                              {statusLabel[p.status]}
                            </Badge>
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform duration-200",
                                openId === p.id && "rotate-180",
                              )}
                            />
                          </div>
                        </CardContent>
                      </button>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="px-4 sm:px-5 pb-5 pt-0 bg-muted/20">
                        <p className="text-sm text-muted-foreground leading-relaxed pt-2 pb-1">{p.summary}</p>
                      </div>
                    </CollapsibleContent>
                  </Card>
                </Collapsible>
              ))}
            {MY_PROPOSALS.filter((p) => filterTab(tk, p)).filter((p) => matchesQuery(p, q)).length === 0 && (
              <Card className="border-dashed border-2 bg-muted/20">
                <CardContent className="p-10 text-center text-muted-foreground text-sm">
                  No proposals match this filter{q ? " or search" : ""}.
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
