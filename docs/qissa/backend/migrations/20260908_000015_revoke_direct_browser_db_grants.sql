-- Closed-beta database access is Edge-Function-only.
-- RLS remains enabled with no direct browser policies, but older public objects
-- inherited Supabase's broad default grants for anon/authenticated. Remove those
-- grants explicitly and make future postgres-owned public objects fail closed.

revoke all privileges on all tables in schema public from anon, authenticated;
revoke all privileges on all sequences in schema public from anon, authenticated;
revoke execute on all functions in schema public from public, anon, authenticated;

-- Trusted Edge Functions continue to use the server-side service role.
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

-- Prevent future postgres-owned public tables/routines from silently restoring
-- browser access through the project's inherited default privileges.
alter default privileges for role postgres in schema public
  revoke all privileges on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on sequences from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke all privileges on functions from public, anon, authenticated;

alter default privileges for role postgres in schema public
  grant all privileges on tables to service_role;
alter default privileges for role postgres in schema public
  grant all privileges on sequences to service_role;
alter default privileges for role postgres in schema public
  grant execute on functions to service_role;
