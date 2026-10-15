-- REVIEW ONLY. Requires explicit production authorization and tested server verifier.
-- Adds project completion evidence; employee gigs/payroll and payouts are unaffected.
create schema korvo_evidence_private;
revoke all on schema korvo_evidence_private from public,anon,authenticated,service_role;
grant usage on schema korvo_evidence_private to authenticated,service_role;
-- Rollout: existing jobs are not silently enrolled/backfilled. New jobs opt in through
-- an insert trigger after this approved migration. Legacy release still needs review.
create table korvo_evidence_private.requirements (
 active_job_id uuid primary key references public.active_jobs(id),enrolled_at timestamptz not null default now()
);
alter table korvo_evidence_private.requirements enable row level security;
create policy deny_client_rows on korvo_evidence_private.requirements for all to anon,authenticated using(false) with check(false);
revoke all on korvo_evidence_private.requirements from public,anon,authenticated,service_role;
grant select on korvo_evidence_private.requirements to service_role;
create function korvo_evidence_private.enroll_new_job() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into korvo_evidence_private.requirements(active_job_id) values(new.id);return new;end;$$;
create trigger enroll_completion_evidence after insert on public.active_jobs for each row execute function korvo_evidence_private.enroll_new_job();
create table korvo_evidence_private.photos (
 id uuid primary key default gen_random_uuid(),request_key uuid not null unique,active_job_id uuid not null references public.active_jobs(id),
 professional_id uuid not null references public.profiles(id),
 storage_path text not null unique,file_name text not null check(length(file_name) between 1 and 120),
 declared_mime text not null check(declared_mime in('image/jpeg','image/png','image/webp')),
 declared_bytes bigint not null check(declared_bytes between 1 and 10485760),
 file_status text not null default 'reserved' check(file_status in('reserved','validated','abandoned')),
 sha256 text,verified_bytes bigint,verified_mime text,validated_at timestamptz,
 customer_reviewed_by uuid references public.profiles(id),customer_reviewed_at timestamptz,
 created_at timestamptz not null default now(),
 check(file_status<>'validated' or (sha256 is not null and verified_bytes is not null
   and verified_mime is not null and validated_at is not null and sha256 ~ '^[0-9a-f]{64}$' and verified_bytes=declared_bytes
   and verified_mime=declared_mime and validated_at is not null)),
 check((customer_reviewed_by is null)=(customer_reviewed_at is null))
);
create index completion_photos_job on korvo_evidence_private.photos(active_job_id);
create index completion_photos_professional on korvo_evidence_private.photos(professional_id);
create index completion_photos_reviewer on korvo_evidence_private.photos(customer_reviewed_by);
alter table korvo_evidence_private.photos enable row level security;
create policy deny_client_rows on korvo_evidence_private.photos for all to anon,authenticated using(false) with check(false);
revoke all on korvo_evidence_private.photos from public,anon,authenticated,service_role;
grant select on korvo_evidence_private.photos to service_role;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
 values('project-completion-evidence','project-completion-evidence',false,10485760,array['image/jpeg','image/png','image/webp']);

create function korvo_evidence_private.reserve(p_job uuid,p_name text,p_mime text,p_bytes bigint,p_key uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();j public.active_jobs%rowtype;p korvo_evidence_private.photos%rowtype;eid uuid:=gen_random_uuid();
begin
 select * into strict j from public.active_jobs where id=p_job for update;
 if j.professional_id<>uid or not exists(select 1 from public.profiles where id=uid and account_type='professional') then
  raise exception 'Active assigned professional required' using errcode='42501';end if;
 if p_key is null or p_mime is null or p_mime not in('image/jpeg','image/png','image/webp') or p_bytes is null or p_bytes not between 1 and 10485760
  or p_name is null or length(btrim(p_name)) not between 1 and 120 or p_name ~ '[/\\]' then raise exception 'Invalid completion photo';end if;
 select * into p from korvo_evidence_private.photos where request_key=p_key;
 if found then
  if p.active_job_id<>p_job or p.professional_id<>uid or p.file_name<>p_name or p.declared_mime<>p_mime or p.declared_bytes<>p_bytes then
   raise exception 'Photo request key conflicts with original reservation';end if;
  return jsonb_build_object('id',p.id,'bucket','project-completion-evidence','storage_path',p.storage_path,'file_status',p.file_status);
 end if;
 if j.status<>'active' then raise exception 'Active assigned professional required' using errcode='42501';end if;
 if (select count(*) from korvo_evidence_private.photos where active_job_id=p_job and file_status<>'abandoned')>=5 then
  raise exception 'Maximum five completion photos';end if;
 insert into korvo_evidence_private.photos(id,request_key,active_job_id,professional_id,storage_path,file_name,declared_mime,declared_bytes)
 values(eid,p_key,p_job,uid,p_job::text||'/'||uid::text||'/'||eid::text,p_name,p_mime,p_bytes) returning * into p;
 return jsonb_build_object('id',p.id,'bucket','project-completion-evidence','storage_path',p.storage_path,'file_status',p.file_status);
end;$$;
create function public.completion_reserve_photo(p_active_job_id uuid,p_file_name text,p_mime text,p_bytes bigint,p_request_key uuid default gen_random_uuid()) returns jsonb
language sql security invoker set search_path='' as $$select korvo_evidence_private.reserve(p_active_job_id,p_file_name,p_mime,p_bytes,p_request_key);$$;

create function korvo_evidence_private.summary(p_job uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();j public.active_jobs%rowtype;photos jsonb;
begin
 select * into strict j from public.active_jobs where id=p_job;
 if uid not in(j.customer_id,j.professional_id) then raise exception 'Project participant required' using errcode='42501';end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',p.id,'file_name',p.file_name,'storage_path',p.storage_path,
  'file_status',p.file_status,'customer_reviewed',p.customer_reviewed_by=j.customer_id) order by p.created_at),'[]') into photos
 from korvo_evidence_private.photos p where p.active_job_id=p_job and p.file_status<>'abandoned'
  and (uid=j.professional_id or p.file_status='validated');
 return jsonb_build_object('active_job_id',j.id,'required',exists(select 1 from korvo_evidence_private.requirements where active_job_id=j.id),'status',j.status,'role',case when uid=j.professional_id then 'professional' else 'customer' end,'photos',photos);
end;$$;
create function public.completion_evidence_summary(p_active_job_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select korvo_evidence_private.summary(p_active_job_id);$$;

create function korvo_evidence_private.abandon(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();p korvo_evidence_private.photos%rowtype;j public.active_jobs%rowtype;
begin
 select * into strict p from korvo_evidence_private.photos where id=p_id;
 select * into strict j from public.active_jobs where id=p.active_job_id for update;
 if p.professional_id<>uid or j.status<>'active' or p.file_status<>'reserved' then raise exception 'Reserved photo owner required' using errcode='42501';end if;
 update korvo_evidence_private.photos set file_status='abandoned' where id=p_id and file_status='reserved';
end;$$;
create function public.completion_abandon_photo(p_photo_id uuid) returns void language sql security invoker set search_path='' as $$select korvo_evidence_private.abandon(p_photo_id);$$;

create function korvo_evidence_private.authorize_verification(p_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();p korvo_evidence_private.photos%rowtype;
begin
 select * into strict p from korvo_evidence_private.photos where id=p_id;
 if p.professional_id<>uid or p.file_status='abandoned' then raise exception 'Photo owner required' using errcode='42501';end if;
 return jsonb_build_object('id',p.id,'professional_id',p.professional_id,'storage_path',p.storage_path,'declared_bytes',p.declared_bytes,'declared_mime',p.declared_mime);
end;$$;
create function public.completion_authorize_verification(p_photo_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_evidence_private.authorize_verification(p_photo_id);$$;

create function korvo_evidence_private.validate_file(p_id uuid,p_sha text,p_bytes bigint,p_mime text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p korvo_evidence_private.photos%rowtype;j public.active_jobs%rowtype;
begin
 select * into strict p from korvo_evidence_private.photos where id=p_id;
 select * into strict j from public.active_jobs where id=p.active_job_id for update;
 select * into strict p from korvo_evidence_private.photos where id=p_id for update;
 if p.file_status='abandoned' or j.status not in('active','pending_confirmation') then raise exception 'Photo is no longer eligible';end if;
 if p_sha is null or p_sha !~ '^[0-9a-f]{64}$' or p_bytes is distinct from p.declared_bytes or p_mime is distinct from p.declared_mime then raise exception 'File validation mismatch';end if;
 if p.file_status='validated' and p.sha256<>p_sha then raise exception 'Evidence content changed';end if;
 update korvo_evidence_private.photos set file_status='validated',sha256=p_sha,verified_bytes=p_bytes,verified_mime=p_mime,validated_at=coalesce(validated_at,now()) where id=p_id;
 return jsonb_build_object('id',p_id,'file_status','validated');
end;$$;
create function public.completion_validate_file(p_photo_id uuid,p_sha256 text,p_bytes bigint,p_mime text) returns jsonb language sql security invoker set search_path='' as $$select korvo_evidence_private.validate_file(p_photo_id,p_sha256,p_bytes,p_mime);$$;

create function korvo_evidence_private.acknowledge(p_job uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();j public.active_jobs%rowtype;
begin
 select * into strict j from public.active_jobs where id=p_job for update;
 if j.customer_id<>uid or j.status<>'pending_confirmation' then raise exception 'Waiting customer participant required' using errcode='42501';end if;
 if not exists(select 1 from korvo_evidence_private.photos where active_job_id=p_job and file_status='validated') then raise exception 'Completion photo required';end if;
 update korvo_evidence_private.photos set customer_reviewed_by=uid,customer_reviewed_at=now() where active_job_id=p_job and file_status='validated';
 return jsonb_build_object('active_job_id',p_job,'customer_reviewed',true);
end;$$;
create function public.completion_acknowledge_photos(p_active_job_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_evidence_private.acknowledge(p_active_job_id);$$;

create function korvo_evidence_private.can_read(p_path text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();begin
 return exists(select 1 from korvo_evidence_private.photos p join public.active_jobs j on j.id=p.active_job_id
  where p.storage_path=p_path and p.file_status='validated' and uid in(j.customer_id,j.professional_id));
end;$$;
create function korvo_evidence_private.can_upload(p_path text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();begin
 return exists(select 1 from korvo_evidence_private.photos p join public.active_jobs j on j.id=p.active_job_id
  where p.storage_path=p_path and p.professional_id=uid and p.file_status='reserved' and j.status='active');
end;$$;
create policy completion_read on storage.objects for select to authenticated using(bucket_id='project-completion-evidence' and korvo_evidence_private.can_read(name));
create policy completion_upload on storage.objects for insert to authenticated with check(bucket_id='project-completion-evidence' and korvo_evidence_private.can_upload(name));
-- No client update/delete policy. Upload uses upsert:false and a fresh server path.

create function korvo_evidence_private.guard_completion() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from korvo_evidence_private.requirements where active_job_id=new.id) then return new;end if;
 if new.status='pending_confirmation' and old.status='active' then
  if not exists(select 1 from korvo_evidence_private.photos where active_job_id=new.id and file_status='validated')
   or exists(select 1 from korvo_evidence_private.photos where active_job_id=new.id and file_status='reserved') then raise exception 'Validate or abandon all completion photos before submitting';end if;
 elsif new.status='completed' and old.status is distinct from 'completed' then
  if old.status<>'pending_confirmation' then raise exception 'Customer confirmation required';end if;
  if not exists(select 1 from korvo_evidence_private.photos where active_job_id=new.id and file_status='validated')
   or exists(select 1 from korvo_evidence_private.photos where active_job_id=new.id and file_status='validated' and customer_reviewed_by is distinct from new.customer_id) then raise exception 'Customer evidence review required';end if;
 end if;
 return new;
end;$$;
create trigger completion_photo_gate before update of status on public.active_jobs for each row execute function korvo_evidence_private.guard_completion();

revoke all on all functions in schema korvo_evidence_private from public,anon,authenticated,service_role;
grant execute on function korvo_evidence_private.reserve(uuid,text,text,bigint,uuid),korvo_evidence_private.summary(uuid),korvo_evidence_private.abandon(uuid),korvo_evidence_private.authorize_verification(uuid),korvo_evidence_private.acknowledge(uuid),korvo_evidence_private.can_read(text),korvo_evidence_private.can_upload(text) to authenticated;
grant execute on function korvo_evidence_private.validate_file(uuid,text,bigint,text) to service_role;
revoke all on function public.completion_reserve_photo(uuid,text,text,bigint,uuid),public.completion_evidence_summary(uuid),public.completion_abandon_photo(uuid),public.completion_authorize_verification(uuid),public.completion_validate_file(uuid,text,bigint,text),public.completion_acknowledge_photos(uuid) from public,anon,authenticated,service_role;
grant execute on function public.completion_reserve_photo(uuid,text,text,bigint,uuid),public.completion_evidence_summary(uuid),public.completion_abandon_photo(uuid),public.completion_authorize_verification(uuid),public.completion_acknowledge_photos(uuid) to authenticated;
grant execute on function public.completion_validate_file(uuid,text,bigint,text) to service_role;
notify pgrst,'reload schema';
