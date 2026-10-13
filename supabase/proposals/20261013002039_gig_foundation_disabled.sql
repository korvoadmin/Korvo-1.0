-- PROPOSAL ONLY: no public booking, payroll, Stripe calls or project-table changes.
-- Apply only after review. Existing broad authorization proposal stays separate.
create schema korvo_gigs_private;
revoke all on schema korvo_gigs_private from public,anon,authenticated;
grant usage on schema korvo_gigs_private to service_role;
alter default privileges in schema korvo_gigs_private revoke execute on functions from public;
create table korvo_gigs_private.settings (
 singleton boolean primary key default true check(singleton),
 publishing_enabled boolean not null default false,
 contractor_booking_enabled boolean not null default false,
 payment_execution_enabled boolean not null default false check(not payment_execution_enabled)
);
insert into korvo_gigs_private.settings default values;
create table korvo_gigs_private.business_profiles (
 owner_id uuid primary key references public.profiles(id),
 display_name text not null check(length(btrim(display_name)) between 1 and 120),
 business_kind text not null check(business_kind in ('restaurant','bar','event_venue','small_business','individual','other')),
 city text not null check(length(btrim(city)) between 1 and 120)
);
create table korvo_gigs_private.worker_profiles (
 worker_id uuid primary key references public.profiles(id),
 skills text[] not null default '{}', experience_summary text not null default '',
 service_areas text[] not null default '{}', availability jsonb not null default '[]',
 check(length(experience_summary)<=2000), check(jsonb_typeof(availability)='array')
 -- All fields are self-reported. No license/background/verification badge inferred.
);
create table korvo_gigs_private.gigs (
 id uuid primary key default gen_random_uuid(),
 business_id uuid not null references korvo_gigs_private.business_profiles(owner_id),
 title text not null check(length(btrim(title)) between 1 and 160),
 category text not null check(length(btrim(category)) between 1 and 120),
 city text not null, private_location text not null,
 responsibilities text not null default '', requirements text[] not null default '{}',
 starts_at timestamptz not null, ends_at timestamptz not null, time_zone text not null,
 positions integer not null check(positions between 1 and 100),
 compensation_type text not null check(compensation_type in ('hourly','fixed')),
 hourly_rate_cents bigint, fixed_gross_cents bigint,
 classification text not null default 'unreviewed' check(classification in ('unreviewed','potential_employee','independent_contractor','employee')),
 classification_review_id text, category_approved boolean not null default false,
 state text not null default 'draft' check(state in ('draft','open','filled','canceled','completed','disputed')),
 created_at timestamptz not null default now(),
 check(ends_at>starts_at),
 check((compensation_type='hourly' and hourly_rate_cents between 1 and 99999999 and fixed_gross_cents is null)
  or(compensation_type='fixed' and fixed_gross_cents between 1 and 99999999 and hourly_rate_cents is null)),
 check(classification not in ('employee','independent_contractor') or (classification_review_id is not null and length(btrim(classification_review_id))>0))
);
create index gigs_business_idx on korvo_gigs_private.gigs(business_id);
create index gigs_discovery_idx on korvo_gigs_private.gigs(state,starts_at);
create table korvo_gigs_private.applications (
 gig_id uuid not null references korvo_gigs_private.gigs(id),
 worker_id uuid not null references korvo_gigs_private.worker_profiles(worker_id),
 state text not null default 'applied' check(state in ('applied','withdrawn','selected','declined')),
 note text not null default '' check(length(note)<=2000),created_at timestamptz not null default now(),
 primary key(gig_id,worker_id)
);
create index gig_applications_worker_idx on korvo_gigs_private.applications(worker_id);
create table korvo_gigs_private.assignments (
 id uuid primary key default gen_random_uuid(),
 gig_id uuid not null, worker_id uuid not null,
 state text not null default 'selected' check(state in ('selected','confirmed','attended','completed','canceled','disputed','no_show_review')),
 starts_at timestamptz not null,ends_at timestamptz not null,
 unique(gig_id,worker_id),foreign key(gig_id,worker_id) references korvo_gigs_private.applications(gig_id,worker_id),
 check(ends_at>starts_at)
);
create index gig_assignments_worker_idx on korvo_gigs_private.assignments(worker_id,starts_at,ends_at);
create table korvo_gigs_private.time_records (
 id uuid primary key default gen_random_uuid(),assignment_id uuid not null references korvo_gigs_private.assignments(id),
 revision integer not null check(revision>0),payable_seconds bigint not null check(payable_seconds>=0),
 submitted_by uuid not null references public.profiles(id),
 verified_by uuid references public.profiles(id),verified_at timestamptz,
 payroll_record_reference text,notes text not null default '' check(length(notes)<=2000),
 unique(assignment_id,revision),check((verified_by is null)=(verified_at is null))
);
create index gig_time_submitter_idx on korvo_gigs_private.time_records(submitted_by);
create index gig_time_verifier_idx on korvo_gigs_private.time_records(verified_by);
create table korvo_gigs_private.audit_events (
 id uuid primary key default gen_random_uuid(),gig_id uuid not null references korvo_gigs_private.gigs(id),
 actor_id uuid not null references public.profiles(id),event_type text not null,
 details jsonb not null default '{}',created_at timestamptz not null default now()
);
create index gig_events_gig_idx on korvo_gigs_private.audit_events(gig_id,created_at);
create index gig_events_actor_idx on korvo_gigs_private.audit_events(actor_id);

-- Reserving slots is serialized by worker, then gig: checks capacity AND overlap
-- even if a trusted backend writes directly instead of using a future endpoint.
create function korvo_gigs_private.guard_assignment() returns trigger language plpgsql
security invoker set search_path='' as $$
declare g korvo_gigs_private.gigs%rowtype;n integer;
begin
 if tg_op='UPDATE' and (new.worker_id<>old.worker_id or new.gig_id<>old.gig_id) then
  raise exception 'Assignment identity is immutable';
 end if;
 perform pg_advisory_xact_lock(hashtextextended(new.worker_id::text,97013));
 select * into strict g from korvo_gigs_private.gigs where id=new.gig_id for update;
 new.starts_at:=g.starts_at;new.ends_at:=g.ends_at;
 if tg_op='INSERT' or new.state in ('selected','confirmed','attended','disputed','no_show_review') then
  if not exists(select 1 from korvo_gigs_private.settings where publishing_enabled and contractor_booking_enabled)
   or g.classification<>'independent_contractor' or not g.category_approved or g.classification_review_id is null
   or g.state not in ('open','filled','disputed') then raise exception 'Gig bookings disabled or review required';end if;
  if not exists(select 1 from korvo_gigs_private.applications a where a.gig_id=new.gig_id and a.worker_id=new.worker_id and a.state in ('applied','selected')) then
   raise exception 'Active application required';end if;
  if exists(select 1 from korvo_gigs_private.assignments a where a.worker_id=new.worker_id and a.id<>new.id
    and a.state in ('selected','confirmed','attended','disputed','no_show_review')
    and a.starts_at<new.ends_at and a.ends_at>new.starts_at) then raise exception 'Worker scheduling conflict';end if;
  select count(*) into n from korvo_gigs_private.assignments a where a.gig_id=new.gig_id and a.id<>new.id
   and a.state in ('selected','confirmed','attended','completed','disputed','no_show_review');
  if n>=g.positions then raise exception 'Gig capacity reached';end if;
 end if;
 return new;
end;$$;
create trigger gig_reservation_guard before insert or update on korvo_gigs_private.assignments
 for each row execute function korvo_gigs_private.guard_assignment();
create function korvo_gigs_private.guard_gig() returns trigger language plpgsql
security invoker set search_path='' as $$
begin
 if not exists(select 1 from pg_timezone_names where name=new.time_zone) then raise exception 'Invalid time zone';end if;
 if tg_op='UPDATE' and exists(select 1 from korvo_gigs_private.assignments a where a.gig_id=old.id)
  and (new.business_id<>old.business_id or new.starts_at<>old.starts_at or new.ends_at<>old.ends_at or new.positions<>old.positions
   or new.compensation_type<>old.compensation_type or new.hourly_rate_cents is distinct from old.hourly_rate_cents
   or new.fixed_gross_cents is distinct from old.fixed_gross_cents or new.classification<>old.classification) then
  raise exception 'Reserved gig schedule, owner and compensation are immutable';end if;
 if new.state in ('open','filled') and (not exists(select 1 from korvo_gigs_private.settings where publishing_enabled and contractor_booking_enabled)
  or new.classification<>'independent_contractor' or not new.category_approved or new.classification_review_id is null) then
  raise exception 'Gig publication disabled or review required';end if;
 return new;
end;$$;
create trigger gig_publication_guard before insert or update on korvo_gigs_private.gigs
 for each row execute function korvo_gigs_private.guard_gig();

create function korvo_gigs_private.guard_profile() returns trigger language plpgsql
security invoker set search_path='' as $$
declare uid uuid;kind text;
begin
 if tg_table_name='business_profiles' then uid:=new.owner_id;kind:='customer';
 else uid:=new.worker_id;kind:='professional';end if;
 if not exists(select 1 from public.profiles p where p.id=uid and p.account_type=kind and p.is_active) then
  raise exception 'Active matching account type required';end if;
 return new;
end;$$;
create trigger gig_business_profile_guard before insert or update on korvo_gigs_private.business_profiles
 for each row execute function korvo_gigs_private.guard_profile();
create trigger gig_worker_profile_guard before insert or update on korvo_gigs_private.worker_profiles
 for each row execute function korvo_gigs_private.guard_profile();

do $$ declare t text;begin
 foreach t in array array['settings','business_profiles','worker_profiles','gigs','applications','assignments','time_records','audit_events'] loop
  execute format('alter table korvo_gigs_private.%I enable row level security',t);
  execute format('create policy deny_clients on korvo_gigs_private.%I for all to anon,authenticated using(false) with check(false)',t);
  execute format('revoke all on table korvo_gigs_private.%I from public,anon,authenticated',t);
  execute format('grant select,insert,update on table korvo_gigs_private.%I to service_role',t);
 end loop;
end;$$;
revoke all on all functions in schema korvo_gigs_private from public,anon,authenticated;
grant execute on all functions in schema korvo_gigs_private to service_role;
-- No public RPC, Edge Function, client access or connection to marketplace_payments.
-- Rollback before any adoption: drop schema korvo_gigs_private cascade;
-- After real records exist, never use that rollback without scoped owner approval.
