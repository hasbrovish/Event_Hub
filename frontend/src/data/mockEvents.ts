export interface EventData {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  category: "tech" | "domain" | "health" | "fun" | "product";
  location: string;
  speaker: {
    name: string;
    title: string;
    avatar: string;
  };
  attendees: number;
  maxAttendees: number;
  status: "upcoming" | "live" | "completed" | "draft" | "pending";
  tags: string[];
  isRegistered?: boolean;
}

export const mockEvents: EventData[] = [
  {
    id: "1",
    title: "AI & Machine Learning Workshop",
    description: "Deep dive into practical ML applications with hands-on coding sessions. Learn how to build and deploy ML models using Python and TensorFlow.",
    date: "2026-04-05",
    time: "10:00 AM",
    duration: "2 hours",
    category: "tech",
    location: "Building 44, Hall A",
    speaker: { name: "Dr. Priya Sharma", title: "Principal AI Architect", avatar: "" },
    attendees: 87,
    maxAttendees: 150,
    status: "upcoming",
    tags: ["AI", "ML", "Python", "Workshop"],
    isRegistered: true,
  },
  {
    id: "2",
    title: "Cloud Native Architecture Patterns",
    description: "Explore modern cloud architecture patterns including microservices, serverless, and event-driven architectures.",
    date: "2026-04-06",
    time: "2:00 PM",
    duration: "1.5 hours",
    category: "tech",
    location: "Virtual - MS Teams",
    speaker: { name: "Rahul Verma", title: "Cloud Solutions Lead", avatar: "" },
    attendees: 203,
    maxAttendees: 500,
    status: "upcoming",
    tags: ["Cloud", "Architecture", "Microservices"],
  },
  {
    id: "3",
    title: "Banking Domain Deep Dive",
    description: "Understanding core banking transformation and digital payments landscape.",
    date: "2026-04-07",
    time: "11:00 AM",
    duration: "1 hour",
    category: "domain",
    location: "Building 12, Conference Room",
    speaker: { name: "Anita Desai", title: "Domain Consultant", avatar: "" },
    attendees: 45,
    maxAttendees: 80,
    status: "upcoming",
    tags: ["Banking", "FinTech", "Payments"],
  },
  {
    id: "4",
    title: "Yoga & Mindfulness Session",
    description: "A rejuvenating session to improve focus and reduce stress. Suitable for all fitness levels.",
    date: "2026-04-04",
    time: "7:00 AM",
    duration: "45 mins",
    category: "health",
    location: "Wellness Center, Ground Floor",
    speaker: { name: "Maya Kapoor", title: "Certified Yoga Instructor", avatar: "" },
    attendees: 30,
    maxAttendees: 40,
    status: "upcoming",
    tags: ["Yoga", "Wellness", "Mindfulness"],
    isRegistered: true,
  },
  {
    id: "5",
    title: "Cricket Tournament - Season 3",
    description: "Inter-unit cricket tournament. Form your teams and register now!",
    date: "2026-04-10",
    time: "4:00 PM",
    duration: "3 hours",
    category: "fun",
    location: "Sports Ground, Campus 2",
    speaker: { name: "Vikram Singh", title: "Sports Committee Lead", avatar: "" },
    attendees: 120,
    maxAttendees: 200,
    status: "upcoming",
    tags: ["Cricket", "Sports", "Team"],
  },
  {
    id: "6",
    title: "New Product Launch: InfyConnect 2.0",
    description: "Be the first to see InfyConnect 2.0 — our next-gen collaboration platform.",
    date: "2026-04-08",
    time: "3:00 PM",
    duration: "1 hour",
    category: "product",
    location: "Auditorium, Main Campus",
    speaker: { name: "Karthik Nair", title: "Product Manager", avatar: "" },
    attendees: 310,
    maxAttendees: 500,
    status: "upcoming",
    tags: ["Product", "Launch", "Collaboration"],
  },
  {
    id: "7",
    title: "React & TypeScript Best Practices",
    description: "Level up your frontend skills with advanced React patterns and TypeScript tips.",
    date: "2026-04-03",
    time: "11:00 AM",
    duration: "1.5 hours",
    category: "tech",
    location: "Virtual - MS Teams",
    speaker: { name: "Sneha Patel", title: "Senior Frontend Engineer", avatar: "" },
    attendees: 150,
    maxAttendees: 150,
    status: "live",
    tags: ["React", "TypeScript", "Frontend"],
  },
  {
    id: "8",
    title: "Design Thinking Workshop",
    description: "Learn design thinking methodology and apply it to solve real business problems.",
    date: "2026-03-28",
    time: "10:00 AM",
    duration: "3 hours",
    category: "domain",
    location: "Innovation Lab",
    speaker: { name: "Arjun Mehta", title: "UX Design Lead", avatar: "" },
    attendees: 60,
    maxAttendees: 60,
    status: "completed",
    tags: ["Design", "Innovation", "UX"],
  },
];
