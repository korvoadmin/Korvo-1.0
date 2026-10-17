-- REVIEW ONLY / A10 APPROVAL REQUIRED. Data-preserving emergency containment.
-- Handles evidence-only or full A10 schemas. Never drops a bucket, table, enrollment, audit or hold.
-- This freezes interfaces; it is NOT an uninstall or a managed database restore.
begin;
set local lock_timeout='5s';
set local statement_timeout='60s';
do $contain$ declare s text;begin
 foreach s in array array['korvo_evidence_private','korvo_refunds_private','korvo_finance_private'] loop
  if to_regnamespace(s) is not null then
   execute format('revoke execute on all functions in schema %I from public,anon,authenticated,service_role',s);
  end if;
 end loop;end;$contain$;
create function public.korvo_a10_containment_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' or (new.status is distinct from old.status and new.status in('pending_confirmation','completed')) then
  raise exception 'A10 recovery maintenance: intake and completion paused' using errcode='42501';
 end if;return new;
end;$$;
revoke all on function public.korvo_a10_containment_guard() from public,anon,authenticated,service_role;
create trigger a10_pause_job_intake before insert on public.jobs for each row execute function public.korvo_a10_containment_guard();
create trigger a10_pause_active_intake before insert on public.active_jobs for each row execute function public.korvo_a10_containment_guard();
create trigger a10_pause_completion before update of status on public.active_jobs for each row execute function public.korvo_a10_containment_guard();
commit;
