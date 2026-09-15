create table if not exists public.qissa_runtime_flags (
  flag text primary key,
  enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint qissa_runtime_flags_flag_format check (flag ~ '^[a-z0-9_]{1,64}$')
);

alter table public.qissa_runtime_flags enable row level security;

revoke all on table public.qissa_runtime_flags from public;
revoke all on table public.qissa_runtime_flags from anon;
revoke all on table public.qissa_runtime_flags from authenticated;
grant select, update on table public.qissa_runtime_flags to service_role;

insert into public.qissa_runtime_flags (flag, enabled)
values ('story_ai_enabled', false)
on conflict (flag) do nothing;
