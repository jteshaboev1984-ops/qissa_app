-- QISSA launch hardening: make full profile deletion remove pseudonymous
-- installation-scoped operational events as well as profile/session events.
--
-- The Story AI daily-cost guard writes `story_generation_started` before a
-- profile/session necessarily exists. Those rows carry only installation_id,
-- so the existing profile-scoped deletion query cannot see them. A trusted
-- BEFORE DELETE trigger gives profile deletion one canonical privacy boundary:
-- any app_event linked by child_profile_id OR the profile installation_id is
-- removed before FK `ON DELETE SET NULL` can detach the relationship.

create or replace function public.qissa_delete_profile_app_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.app_events
   where child_profile_id = old.id
      or (old.installation_id is not null and installation_id = old.installation_id);

  return old;
end;
$$;

revoke all on function public.qissa_delete_profile_app_events() from public;
revoke all on function public.qissa_delete_profile_app_events() from anon;
revoke all on function public.qissa_delete_profile_app_events() from authenticated;
grant execute on function public.qissa_delete_profile_app_events() to service_role;

drop trigger if exists trg_qissa_delete_profile_app_events on public.child_profiles;
create trigger trg_qissa_delete_profile_app_events
before delete on public.child_profiles
for each row execute function public.qissa_delete_profile_app_events();
