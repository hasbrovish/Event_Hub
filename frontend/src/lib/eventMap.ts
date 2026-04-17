import type { EventData } from "@/data/mockEvents";
import type { EventDetailApi, EventListItemApi } from "@/types/api";

export function mapListItemToEventData(e: EventListItemApi): EventData {
  const cat = e.category;
  const category: EventData["category"] =
    cat === "tech" || cat === "domain" || cat === "health" || cat === "fun" || cat === "product"
      ? cat
      : "tech";
  const st = e.status;
  const status: EventData["status"] =
    st === "upcoming" || st === "live" || st === "completed" || st === "draft" || st === "pending"
      ? st
      : "upcoming";

  return {
    id: e.id,
    title: e.title,
    description: e.description,
    date: e.date,
    time: e.time,
    duration: e.duration,
    category,
    location: e.location,
    speaker: {
      name: e.speaker?.name ?? "TBD",
      title: e.speaker?.title ?? "",
      avatar: e.speaker?.avatar ?? "",
    },
    attendees: e.attendees,
    maxAttendees: e.max_attendees,
    status,
    tags: e.tags ?? [],
    isRegistered: e.is_registered,
  };
}

export function mapDetailToEventData(d: EventDetailApi): EventData {
  const base = mapListItemToEventData(d);
  return { ...base };
}
