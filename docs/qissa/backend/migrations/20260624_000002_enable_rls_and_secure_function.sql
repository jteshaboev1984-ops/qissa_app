-- Lock public tables behind Row Level Security.
-- No public policies are added at this stage, so anon/authenticated clients cannot
-- read or write story data directly. Trusted Edge Functions may use service-role
-- access later when persistence is enabled.

alter table public.child_profiles enable row level security;
alter table public.story_sessions enable row level security;
alter table public.story_episodes enable row level security;
alter table public.story_choices enable row level security;
alter table public.story_choice_events enable row level security;
alter table public.safety_reviews enable row level security;
alter table public.app_events enable row level security;

alter function public.set_updated_at() set search_path = public, pg_temp;
