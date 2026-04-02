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
  refresh_token: string;
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

export type NotificationOutApi = {
  id: number;
  type: string | null;
  title: string | null;
  body: string | null;
  is_read: boolean;
  event_id: string | null;
  created_at: string;
};

export type NotificationListResponse = {
  items: NotificationOutApi[];
  total: number;
  page: number;
  page_size: number;
};

export type UnreadCountResponse = { count: number };

export type PreferenceOutApi = {
  event_types: string[] | null;
  interests: string[] | null;
  notification_frequency: string;
  notification_mechanisms: string[] | null;
  notification_times: string[] | null;
  notify_on_login: boolean;
  followed_group_ids: number[] | null;
};

export type CampaignOutApi = {
  id: number;
  event_id: string;
  created_by: string;
  message: string;
  teams_channel_ids: string[] | null;
  viva_group_ids: string[] | null;
  infyme_banner: boolean;
  scheduled_at: string;
  status: string;
  posted_at: string | null;
  failure_reason: string | null;
  created_at: string;
};

export type CampaignListResponse = {
  items: CampaignOutApi[];
  total: number;
  page: number;
  page_size: number;
};

export type AdminStatsApi = {
  total_users: number;
  organizers: number;
  events_this_month: number;
  pending_approvals: number;
};

export type GroupOrganizerEntryApi = {
  group_id: number;
  group_name: string;
  organizer_wids: string[];
};

export type AccessMatrixResponseApi = { items: GroupOrganizerEntryApi[] };

export type ConfigEntryApi = { key: string; value: string };

export type AdminConfigResponseApi = { items: ConfigEntryApi[] };

export type AuditLogItemApi = {
  id: number;
  action: string;
  detail: string | null;
  actor_wid: string | null;
  created_at: string;
};

export type AdminLogsResponseApi = { items: AuditLogItemApi[] };

export type GroupOutApi = {
  id: number;
  name: string;
  description: string | null;
  org: string;
  geo: string | null;
  unit: string | null;
  subunit: string | null;
  location: string | null;
  dl_emails: string[] | null;
  is_active: boolean;
};

export type GroupListResponseApi = {
  items: GroupOutApi[];
  total: number;
  page: number;
  page_size: number;
};
