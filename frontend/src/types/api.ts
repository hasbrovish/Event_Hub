/** API shapes (snake_case from FastAPI). */

export type EmployeeMe = {
  wid: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
};

export type LoginResponse = {
  access_token: string;
  token_type: string;
  user: EmployeeMe;
};

export type EventListItemApi = {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  duration: string;
  category: string;
  location: string;
  speaker: { name: string; title: string; avatar: string };
  attendees: number;
  max_attendees: number;
  status: string;
  tags: string[];
  is_registered: boolean;
};

export type SessionOutApi = {
  id: number;
  session_order: number;
  topic: string;
  topic_brief: string | null;
  start_datetime: string;
  duration_minutes: number;
  speaker_name: string | null;
  speaker_title: string | null;
  speaker_headshot_url: string | null;
};

export type EventDetailApi = EventListItemApi & {
  delivery_method: string;
  visibility: string;
  group_id: number | null;
  created_by: string;
  db_status: string;
  sessions: SessionOutApi[];
  my_registration_status: string | null;
};

export type EventListResponse = {
  items: EventListItemApi[];
  total: number;
  page: number;
  page_size: number;
};

export type RegistrationActionResponse = {
  registration_id: number | null;
  registration_status: string;
  detail?: string | null;
};

export type MyRegistrationEntryApi = {
  registration_id: number;
  registration_status: string;
  event: EventListItemApi;
};

export type MyRegistrationsResponse = {
  items: MyRegistrationEntryApi[];
};

export type ApprovalPendingItemApi = {
  approval_id: number;
  event_id: string;
  event_title: string;
  status: string;
  requested_at: string;
};

export type ApprovalsPendingResponse = {
  items: ApprovalPendingItemApi[];
};

export type ApprovalOutApi = {
  id: number;
  event_id: string;
  status: string;
  request_note: string | null;
  review_comment: string | null;
  requested_at: string;
  reviewed_at: string | null;
  requested_by: string;
  reviewed_by: string | null;
};
