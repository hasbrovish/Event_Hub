/**
 * Demo participant profile. In production, elected sessions and proposals come from the API.
 */
export const DEMO_USER = {
  displayName: "John",
  electedSpeakerEventIds: new Set<string>(["1", "7"]),
} as const;

export type ProposalApplicationStatus =
  | "draft"
  | "submitted"
  | "under_review"
  | "approved"
  | "revision_requested"
  | "rejected";

export interface UserProposal {
  id: string;
  title: string;
  summary: string;
  submittedAt: string;
  updatedAt: string;
  status: ProposalApplicationStatus;
  track: string;
  votes: number;
  reviewerNote?: string;
  linkedEventId?: string;
}

export const MY_PROPOSALS: UserProposal[] = [
  {
    id: "p1",
    title: "GraphQL vs REST in Enterprise APIs",
    summary: "Comparison session with live schema design and security checklist.",
    submittedAt: "2026-03-18",
    updatedAt: "2026-03-22",
    status: "approved",
    track: "Technology",
    votes: 12,
    linkedEventId: "1",
  },
  {
    id: "p2",
    title: "Kubernetes for Developers",
    summary: "Hands-on deploy pipeline from laptop to cluster for app teams.",
    submittedAt: "2026-03-25",
    updatedAt: "2026-03-28",
    status: "under_review",
    track: "Technology",
    votes: 8,
  },
  {
    id: "p3",
    title: "Web Performance Optimization",
    summary: "Core Web Vitals, lazy loading, and edge caching patterns.",
    submittedAt: "2026-03-20",
    updatedAt: "2026-03-24",
    status: "revision_requested",
    track: "Technology",
    votes: 5,
    reviewerNote: "Please shorten abstract to 120 words and add learning outcomes.",
  },
  {
    id: "p4",
    title: "Inclusive Design Office Hours",
    summary: "Open Q&A on accessibility audits and component libraries.",
    submittedAt: "2026-03-10",
    updatedAt: "2026-03-12",
    status: "rejected",
    track: "Domain",
    votes: 3,
    reviewerNote: "Duplicate of an approved session this quarter.",
  },
  {
    id: "p5",
    title: "Lightning Talks: Product Analytics",
    summary: "Five 10-minute stories on funnel experiments and guardrails.",
    submittedAt: "2026-04-01",
    updatedAt: "2026-04-01",
    status: "submitted",
    track: "Product",
    votes: 0,
  },
];