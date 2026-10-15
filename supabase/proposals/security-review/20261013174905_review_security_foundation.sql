-- Audited incremental hardening of the existing Korvo database.
-- No user data is deleted. Legacy fee-only preparation stays disabled; the new marketplace RPCs and server grants are preserved.
set lock_timeout = '5s';
create schema if not exists korvo_api_private;
revoke all on schema korvo_api_private from public, anon, authenticated, service_role;
grant usage on schema korvo_api_private to authenticated;
revoke create on schema public from public, anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema korvo_api_private revoke execute on functions from public, anon, authenticated, service_role;

