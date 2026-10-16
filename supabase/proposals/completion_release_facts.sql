-- A10 REQUIRED. Read-only service facts; cannot release payment or alter a job.
-- Dependency: private_completion_evidence.sql. Legacy jobs fail automatic evidence readiness.
create function korvo_evidence_private.release_facts(p_job uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare j public.active_jobs%rowtype;enrolled boolean;n bigint;pending bigint;reviewed boolean;
begin
 select * into strict j from public.active_jobs where id=p_job;
 enrolled:=exists(select 1 from korvo_evidence_private.requirements where active_job_id=j.id);
 select count(*) filter(where file_status='validated'),count(*) filter(where file_status='reserved'),
  coalesce(bool_and(coalesce(customer_reviewed_by=j.customer_id and customer_reviewed_at>=validated_at
   and professional_id=j.professional_id,false)) filter(where file_status='validated'),false)
 into n,pending,reviewed from korvo_evidence_private.photos where active_job_id=j.id;
 return jsonb_build_object('active_job_id',j.id,'enrolled',enrolled,'validated_count',n,'pending_count',pending,
  'customer_acknowledged',reviewed,'evidence_verified',enrolled and n>0 and pending=0 and reviewed and j.status='completed',
  'legacy_manual_review_required',not enrolled,'execution_enabled',false);
end;$$;
create function public.completion_release_evidence(p_active_job_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select korvo_evidence_private.release_facts(p_active_job_id)$$;
revoke all on function korvo_evidence_private.release_facts(uuid),public.completion_release_evidence(uuid) from public,anon,authenticated,service_role;
grant execute on function korvo_evidence_private.release_facts(uuid),public.completion_release_evidence(uuid) to service_role;
notify pgrst,'reload schema';
