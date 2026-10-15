-- Extends the existing catalog/matcher and in-app notifications. No email/SMS delivery.
create schema if not exists korvo_opportunities_private;
revoke all on schema korvo_opportunities_private from public, anon;
grant usage on schema korvo_opportunities_private to authenticated;

alter table public.job_matching_config
  add column automatic_job_alerts_enabled boolean not null default true,
  add column max_matched_alerts_per_job integer not null default 5
    check (max_matched_alerts_per_job between 1 and 25),
  add column max_invitations_per_job integer not null default 5
    check (max_invitations_per_job between 1 and 25),
  add column max_opportunity_alerts_per_day integer not null default 10
    check (max_opportunity_alerts_per_day between 1 and 100);

create table public.job_opportunities (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references public.jobs(id) on delete cascade,
  customer_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  match_score integer not null check (match_score between 0 and 100),
  exact_service_match boolean not null default false,
  catalog_category_match boolean not null default false,
  preferred_area_match boolean not null default false,
  status text not null default 'offered'
    check (status in ('offered', 'viewed', 'passed', 'quoted', 'closed')),
  matched_at timestamptz,
  invited_at timestamptz,
  viewed_at timestamptz,
  passed_at timestamptz,
  quoted_at timestamptz,
  closed_at timestamptz,
  quote_id uuid references public.quotes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (job_id, professional_id),
  check (customer_id <> professional_id),
  check (matched_at is not null or invited_at is not null)
);
comment on table public.job_opportunities is
  'One server-managed opportunity per job/pro pair. Matching/invitation timestamps and response history; no private contact data.';
create index job_opportunities_professional_created_idx
  on public.job_opportunities (professional_id, created_at desc, id);
create index job_opportunities_customer_created_idx
  on public.job_opportunities (customer_id, created_at desc, id);
create index job_opportunities_quote_idx on public.job_opportunities (quote_id)
  where quote_id is not null;
alter table public.job_opportunities enable row level security;
revoke all on public.job_opportunities from public, anon, authenticated;
grant select on public.job_opportunities to authenticated;
create policy "Participants can read their job opportunities"
  on public.job_opportunities for select to authenticated
  using ((select auth.uid()) = professional_id or (select auth.uid()) = customer_id);

alter table public.notifications
  add column opportunity_id uuid references public.job_opportunities(id) on delete cascade;
alter table public.notifications drop constraint notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in ('new_quote','quote_accepted','quote_declined','quote_withdrawn',
    'new_message','completion_requested','job_completed','job_cancelled',
    'review_received','booking_fee_paid','payment_failed','payment_refunded',
    'payment_disputed','issue_opened','issue_message','issue_resolved',
    'safety_report_update','account_warning','account_restricted',
    'matched_job','job_invitation')
);
-- At most one automatic alert and one deliberate invitation for the same opportunity.
create unique index notifications_opportunity_type_key
  on public.notifications (opportunity_id, type) where opportunity_id is not null;
create index notifications_opportunity_daily_limit_idx
  on public.notifications (user_id, created_at desc)
  where type in ('matched_job', 'job_invitation');

create function korvo_opportunities_private.dispatch_job_matches(p_job_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs%rowtype;
  v_config public.job_matching_config%rowtype;
  v_candidate record;
  v_slots integer;
  v_opportunity_id uuid;
  v_created integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_job from public.jobs where id=p_job_id for update;
  if not found or (v_job.customer_id <> auth.uid() and not public.is_korvo_admin()) then
    raise exception 'Job not found or access denied' using errcode='42501';
  end if;
  if v_job.status is distinct from 'open' then return jsonb_build_object('created',0,'reason','job_not_open'); end if;
  if not public.is_korvo_action_allowed(v_job.customer_id,'post_job') then
    return jsonb_build_object('created',0,'reason','customer_restricted');
  end if;
  select * into v_config from public.job_matching_config where id=true;
  if not found or not v_config.automatic_job_alerts_enabled then
    return jsonb_build_object('created',0,'reason','automatic_alerts_disabled');
  end if;
  select greatest(0,v_config.max_matched_alerts_per_job-count(*)::integer)
    into v_slots from public.job_opportunities where job_id=p_job_id and matched_at is not null;
  if v_slots=0 then return jsonb_build_object('created',0,'reason','job_alert_limit'); end if;

  for v_candidate in
    with candidates as materialized (
      select pp.id, pp.created_at, public.professional_job_match_details(pp.id,p_job_id) as details
      from public.professional_profiles pp join public.profiles p on p.id=pp.id
      where pp.id<>v_job.customer_id and p.account_type='professional'
        and coalesce(p.is_active,false) and coalesce(p.onboarding_complete,false)
        and coalesce(pp.is_public,true)
        and not exists (select 1 from public.job_opportunities o where o.job_id=p_job_id and o.professional_id=pp.id)
        and not exists (select 1 from public.quotes q where q.job_id=p_job_id and q.professional_id=pp.id)
        and (select count(*) from public.notifications n where n.user_id=pp.id
          and n.type in ('matched_job','job_invitation') and n.created_at>now()-interval '24 hours')
          <v_config.max_opportunity_alerts_per_day
    ), strongest as (
      select * from candidates
      where coalesce((details->>'service_match')::boolean,false)
        and coalesce((details->>'can_quote')::boolean,false)
      order by (details->>'match_score')::integer desc,created_at,id limit v_slots
    )
    -- Consistent lock ordering across simultaneous jobs avoids opposite-order recipient locks.
    select * from strongest order by id
  loop
    perform pg_advisory_xact_lock(hashtextextended('korvo_opportunity_alert:'||v_candidate.id::text,0));
    if (select count(*) from public.notifications n where n.user_id=v_candidate.id
      and n.type in ('matched_job','job_invitation') and n.created_at>now()-interval '24 hours')
      >=v_config.max_opportunity_alerts_per_day then continue; end if;
    insert into public.job_opportunities (job_id,customer_id,professional_id,match_score,
      exact_service_match,catalog_category_match,preferred_area_match,matched_at)
    values (p_job_id,v_job.customer_id,v_candidate.id,(v_candidate.details->>'match_score')::integer,
      coalesce((v_candidate.details->>'exact_service_match')::boolean,false),
      coalesce((v_candidate.details->>'catalog_category_match')::boolean,false),
      coalesce((v_candidate.details->>'preferred_area_match')::boolean,false),now())
    on conflict (job_id,professional_id) do nothing returning id into v_opportunity_id;
    if v_opportunity_id is not null then
      insert into public.notifications (user_id,type,title,body,job_id,opportunity_id)
      values (v_candidate.id,'matched_job','New matching job',
        'A new job matches your selected services. Open Korvo to review the opportunity.',p_job_id,v_opportunity_id);
      v_created:=v_created+1;
    end if;
  end loop;
  return jsonb_build_object('created',v_created);
end;
$$;

create function korvo_opportunities_private.invite_professional_to_job(p_job_id uuid,p_professional_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_job public.jobs%rowtype;
  v_config public.job_matching_config%rowtype;
  v_op public.job_opportunities%rowtype;
  v_match jsonb;
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  select * into v_job from public.jobs where id=p_job_id for update;
  if not found or v_job.customer_id<>auth.uid() then
    raise exception 'Job not found or access denied' using errcode='42501';
  end if;
  if v_job.status is distinct from 'open' then raise exception 'This job is no longer open'; end if;
  if not public.is_korvo_action_allowed(auth.uid(),'post_job')
     or not public.is_korvo_action_allowed(auth.uid(),'message') then
    raise exception 'This account cannot send job invitations' using errcode='42501';
  end if;
  if p_professional_id is null or p_professional_id=auth.uid() then raise exception 'Choose an eligible professional'; end if;
  v_match:=public.professional_job_match_details(p_professional_id,p_job_id);
  if not coalesce((v_match->>'service_match')::boolean,false)
     or not coalesce((v_match->>'can_quote')::boolean,false) then
    raise exception 'This professional is not currently eligible for an invitation';
  end if;
  if exists (select 1 from public.quotes where job_id=p_job_id and professional_id=p_professional_id) then
    raise exception 'This professional has already quoted on the job';
  end if;
  select * into v_op from public.job_opportunities
    where job_id=p_job_id and professional_id=p_professional_id for update;
  if v_op.status in ('passed','quoted','closed') then raise exception 'This opportunity is no longer accepting invitations'; end if;
  if v_op.invited_at is not null then
    return jsonb_build_object('opportunity_id',v_op.id,'invited',true,'already_invited',true);
  end if;
  select * into v_config from public.job_matching_config where id=true;
  if not found then raise exception 'Job matching configuration is unavailable'; end if;
  if (select count(*) from public.job_opportunities where job_id=p_job_id and invited_at is not null)
      >=v_config.max_invitations_per_job then raise exception 'Invitation limit reached for this job'; end if;
  perform pg_advisory_xact_lock(hashtextextended('korvo_opportunity_alert:'||p_professional_id::text,0));
  if (select count(*) from public.notifications n where n.user_id=p_professional_id
    and n.type in ('matched_job','job_invitation') and n.created_at>now()-interval '24 hours')
    >=v_config.max_opportunity_alerts_per_day then
    raise exception 'This professional cannot receive another invitation right now';
  end if;
  insert into public.job_opportunities (job_id,customer_id,professional_id,match_score,
    exact_service_match,catalog_category_match,preferred_area_match,invited_at)
  values (p_job_id,v_job.customer_id,p_professional_id,(v_match->>'match_score')::integer,
    coalesce((v_match->>'exact_service_match')::boolean,false),
    coalesce((v_match->>'catalog_category_match')::boolean,false),
    coalesce((v_match->>'preferred_area_match')::boolean,false),now())
  on conflict (job_id,professional_id) do update set invited_at=now(),updated_at=now()
  returning * into v_op;
  insert into public.notifications (user_id,type,title,body,job_id,opportunity_id)
  values (p_professional_id,'job_invitation','You have a job invitation',
    'A customer invited you to review their job and submit a quote in Korvo.',p_job_id,v_op.id)
  on conflict (opportunity_id,type) where opportunity_id is not null do nothing;
  return jsonb_build_object('opportunity_id',v_op.id,'invited',true,'already_invited',false);
end;
$$;

create function korvo_opportunities_private.respond_to_job_opportunity(p_opportunity_id uuid,p_action text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_op public.job_opportunities%rowtype;
  v_job public.jobs%rowtype;
  v_action text:=lower(trim(coalesce(p_action,'')));
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if v_action not in ('view','pass') then raise exception 'Action must be view or pass'; end if;
  select * into v_op from public.job_opportunities where id=p_opportunity_id and professional_id=auth.uid();
  if not found then raise exception 'Opportunity not found or access denied' using errcode='42501'; end if;
  select * into v_job from public.jobs where id=v_op.job_id for update;
  select * into v_op from public.job_opportunities where id=p_opportunity_id for update;
  if public.is_blocked_between(auth.uid(),v_job.customer_id)
     or not public.is_korvo_action_allowed(auth.uid(),'quote') then
    raise exception 'Opportunity is unavailable' using errcode='42501';
  end if;
  if v_action='pass' and (v_job.status is distinct from 'open' or v_op.status in ('quoted','closed')) then
    raise exception 'This opportunity is no longer open';
  end if;
  update public.job_opportunities set
    viewed_at=coalesce(viewed_at,now()),
    passed_at=case when v_action='pass' then coalesce(passed_at,now()) else passed_at end,
    status=case when v_action='pass' then 'passed' when status='offered' then 'viewed' else status end,
    updated_at=now()
    where id=v_op.id returning * into v_op;
  update public.notifications set read_at=coalesce(read_at,now())
    where opportunity_id=v_op.id and user_id=auth.uid();
  return jsonb_build_object('opportunity_id',v_op.id,'status',v_op.status,
    'viewed_at',v_op.viewed_at,'passed_at',v_op.passed_at);
end;
$$;

create function korvo_opportunities_private.my_job_opportunities(p_limit integer)
returns table (opportunity_id uuid,job_id uuid,title text,category text,city text,state text,
  budget_min numeric,budget_max numeric,job_status text,opportunity_status text,match_score integer,
  matched_at timestamptz,invited_at timestamptz,viewed_at timestamptz,passed_at timestamptz,
  quoted_at timestamptz,can_quote boolean,reason_code text,created_at timestamptz)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Authentication required' using errcode='42501'; end if;
  if not exists (select 1 from public.profiles p where p.id=auth.uid() and p.account_type='professional') then
    raise exception 'Professional account required' using errcode='42501';
  end if;
  return query
    with recent as materialized (
      select o.*,public.professional_job_match_details(o.professional_id,o.job_id) as details
      from public.job_opportunities o where o.professional_id=auth.uid()
      order by greatest(o.invited_at,o.matched_at) desc,o.id limit least(greatest(coalesce(p_limit,50),1),100)
    )
    select o.id,j.id,j.title,j.category,j.city,j.state,j.budget_min,j.budget_max,j.status,o.status,
      (o.details->>'match_score')::integer,o.matched_at,o.invited_at,o.viewed_at,o.passed_at,o.quoted_at,
      coalesce((o.details->>'can_quote')::boolean,false) and o.status in ('offered','viewed'),
      case when o.status='passed' then 'opportunity_passed'
        when o.status='quoted' then 'already_quoted'
        when o.status='closed' then 'opportunity_closed'
        else o.details->>'reason_code' end,o.created_at
    from recent o join public.jobs j on j.id=o.job_id
    where not coalesce((o.details->>'blocked_between_users')::boolean,true)
    order by greatest(o.invited_at,o.matched_at) desc,o.id;
end;
$$;

-- Internal triggers rely on the table grants/RLS and validated parent RPC for mutations.
create function korvo_opportunities_private.on_job_opportunity_lifecycle()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.status is distinct from 'open' then
    update public.job_opportunities set status='closed',closed_at=coalesce(closed_at,now()),updated_at=now()
      where job_id=new.id and status in ('offered','viewed');
    return new;
  end if;
  if auth.uid() is null then return new; end if;
  if tg_op='INSERT' then
    perform korvo_opportunities_private.dispatch_job_matches(new.id);
  elsif old.status is distinct from 'open' then
    perform korvo_opportunities_private.dispatch_job_matches(new.id);
  end if;
  return new;
end;
$$;
create trigger job_opportunities_after_job_insert
  after insert on public.jobs for each row execute function korvo_opportunities_private.on_job_opportunity_lifecycle();
create trigger job_opportunities_after_job_status_change
  after update of status on public.jobs for each row
  when (old.status is distinct from new.status) execute function korvo_opportunities_private.on_job_opportunity_lifecycle();

-- Serialize quote insertion with alert creation, invitations and closure on the same job.
create function korvo_opportunities_private.lock_job_for_opportunity_quote()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_status text; v_match jsonb;
begin
  if auth.uid() is not null and auth.uid()<>new.professional_id and not public.is_korvo_admin() then
    raise exception 'You cannot submit another professional''s quote' using errcode='42501';
  end if;
  select status into v_status from public.jobs where id=new.job_id for update;
  if not found or v_status is distinct from 'open' then raise exception 'Quotes require an open job'; end if;
  -- Eligibility can change after an alert (blocks, standing, verification, capacity).
  -- The matcher itself preserves the existing optional strict-service setting.
  v_match:=public.professional_job_match_details(new.professional_id,new.job_id);
  if not coalesce((v_match->>'can_quote')::boolean,false) then
    raise exception 'Professional is not eligible to quote: %',coalesce(v_match->>'reason_code','unavailable');
  end if;
  return new;
end;
$$;
create trigger aa_lock_job_for_opportunity_quote before insert on public.quotes
  for each row execute function korvo_opportunities_private.lock_job_for_opportunity_quote();

create function korvo_opportunities_private.track_job_opportunity_quote()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is not null and auth.uid()<>new.professional_id and not public.is_korvo_admin() then
    raise exception 'You cannot submit another professional''s quote' using errcode='42501';
  end if;
  update public.job_opportunities set status='quoted',quote_id=new.id,
    quoted_at=coalesce(quoted_at,now()),viewed_at=coalesce(viewed_at,now()),updated_at=now()
    where job_id=new.job_id and professional_id=new.professional_id;
  update public.notifications n set read_at=coalesce(n.read_at,now())
    where n.user_id=new.professional_id and n.opportunity_id in
      (select id from public.job_opportunities where job_id=new.job_id and professional_id=new.professional_id);
  return new;
end;
$$;
create trigger track_job_opportunity_after_quote_insert after insert on public.quotes
  for each row execute function korvo_opportunities_private.track_job_opportunity_quote();

-- Public API wrappers stay SECURITY INVOKER; privilege elevation is private and checks the actor.
create function public.refresh_job_opportunities(p_job_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select korvo_opportunities_private.dispatch_job_matches(p_job_id); $$;
create function public.invite_professional_to_job(p_job_id uuid,p_professional_id uuid)
returns jsonb language sql security invoker set search_path = ''
as $$ select korvo_opportunities_private.invite_professional_to_job(p_job_id,p_professional_id); $$;
create function public.respond_to_job_opportunity(p_opportunity_id uuid,p_action text)
returns jsonb language sql security invoker set search_path = ''
as $$ select korvo_opportunities_private.respond_to_job_opportunity(p_opportunity_id,p_action); $$;
create function public.my_job_opportunities(p_limit integer default 50)
returns table (opportunity_id uuid,job_id uuid,title text,category text,city text,state text,
  budget_min numeric,budget_max numeric,job_status text,opportunity_status text,match_score integer,
  matched_at timestamptz,invited_at timestamptz,viewed_at timestamptz,passed_at timestamptz,
  quoted_at timestamptz,can_quote boolean,reason_code text,created_at timestamptz)
language sql security invoker set search_path = ''
as $$ select * from korvo_opportunities_private.my_job_opportunities(p_limit); $$;

revoke all on function korvo_opportunities_private.dispatch_job_matches(uuid),
  korvo_opportunities_private.invite_professional_to_job(uuid,uuid),
  korvo_opportunities_private.respond_to_job_opportunity(uuid,text),
  korvo_opportunities_private.my_job_opportunities(integer),
  korvo_opportunities_private.on_job_opportunity_lifecycle(),
  korvo_opportunities_private.lock_job_for_opportunity_quote(),
  korvo_opportunities_private.track_job_opportunity_quote()
  from public,anon,authenticated,service_role;
grant execute on function korvo_opportunities_private.dispatch_job_matches(uuid),
  korvo_opportunities_private.invite_professional_to_job(uuid,uuid),
  korvo_opportunities_private.respond_to_job_opportunity(uuid,text),
  korvo_opportunities_private.my_job_opportunities(integer) to authenticated;
revoke all on function public.refresh_job_opportunities(uuid),
  public.invite_professional_to_job(uuid,uuid),
  public.respond_to_job_opportunity(uuid,text),
  public.my_job_opportunities(integer) from public,anon,authenticated,service_role;
grant execute on function public.refresh_job_opportunities(uuid),
  public.invite_professional_to_job(uuid,uuid),
  public.respond_to_job_opportunity(uuid,text),
  public.my_job_opportunities(integer) to authenticated;
