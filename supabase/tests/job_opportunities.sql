begin;
-- Run within BEGIN/ROLLBACK using an administrative SQL connection.
-- Every identity/job/notification created here is temporary transaction data.
create temporary table opportunity_test_ids (name text primary key,id uuid not null);
create temporary table opportunity_test_results (name text primary key);
grant select,insert on opportunity_test_ids,opportunity_test_results to authenticated;
create function pg_temp.assert_ok(p_ok boolean,p_name text) returns void
language plpgsql as $$ begin
  if p_ok is distinct from true then raise exception 'FAILED: %',p_name; end if;
  insert into opportunity_test_results values(p_name);
end; $$;

do $$
declare v_customer uuid:=gen_random_uuid(); v_other uuid:=gen_random_uuid();
  v_pro uuid; v_category text:='Korvo opportunity test '||gen_random_uuid(); v_job uuid;
begin
  insert into opportunity_test_ids values('customer',v_customer),('other',v_other);
  insert into auth.users(id,email,aud,role) values
    (v_customer,v_customer||'@example.invalid','authenticated','authenticated'),
    (v_other,v_other||'@example.invalid','authenticated','authenticated');
  insert into public.profiles(id,account_type,is_active,onboarding_complete)
    values(v_customer,'customer',true,true),(v_other,'customer',true,true);
  for i in 1..8 loop
    v_pro:=gen_random_uuid();
    insert into opportunity_test_ids values('pro'||i,v_pro);
    insert into auth.users(id,email,aud,role) values(v_pro,v_pro||'@example.invalid','authenticated','authenticated');
    insert into public.profiles(id,account_type,is_active,onboarding_complete,city)
      values(v_pro,'professional',true,true,case when i<=4 then 'Atlanta' else 'Savannah' end);
    insert into public.professional_profiles(id,business_name,services,service_areas,is_public)
      values(v_pro,'Opportunity Test Pro '||i,
        array[case when i=8 then 'Unrelated opportunity test service' else v_category end],
        array[case when i<=4 then 'Atlanta' else 'Savannah' end],true);
  end loop;
  perform set_config('request.jwt.claim.sub',v_customer::text,true);
  perform set_config('request.jwt.claims',jsonb_build_object('sub',v_customer,'role','authenticated')::text,true);
  insert into public.jobs(customer_id,title,category,city,state,status)
    values(v_customer,'Opportunity test job',v_category,'Atlanta','GA','open') returning id into v_job;
  insert into opportunity_test_ids values('job',v_job);
end; $$;

select pg_temp.assert_ok((select count(*)=5 from public.job_opportunities where job_id=(select id from opportunity_test_ids where name='job')),'automatic top-five cap');
select pg_temp.assert_ok((select count(*)=4 from public.job_opportunities where job_id=(select id from opportunity_test_ids where name='job') and preferred_area_match),'strongest area matches ranked first');
select pg_temp.assert_ok((select count(*)=1 from public.job_opportunities where job_id=(select id from opportunity_test_ids where name='job') and not preferred_area_match),'preferred areas do not exclude outside-area work');
select pg_temp.assert_ok(not exists(select 1 from public.job_opportunities where professional_id=(select id from opportunity_test_ids where name='pro8')),'unmatched professional not alerted');
select pg_temp.assert_ok((select count(*)=5 from public.notifications where job_id=(select id from opportunity_test_ids where name='job') and type='matched_job'),'one notification per automatic match');

set local role authenticated;
select pg_temp.assert_ok((public.refresh_job_opportunities((select id from opportunity_test_ids where name='job'))->>'created')::integer=0,'refresh retries are idempotent');
select pg_temp.assert_ok((select count(*)=5 from public.job_opportunities where job_id=(select id from opportunity_test_ids where name='job')),'customer can read own opportunity status');
select pg_temp.assert_ok((public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='pro1'))->>'already_invited')::boolean=false,'customer invites an existing recommended match');
select pg_temp.assert_ok((public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='pro1'))->>'already_invited')::boolean=true,'repeated invitation is idempotent');

select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='pro1'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='pro1'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=1 from public.job_opportunities),'professional sees only own records');
select pg_temp.assert_ok((select count(*)=1 from public.my_job_opportunities(100)),'professional opportunity feed works as authenticated');
select pg_temp.assert_ok((select count(*)=2 from public.notifications where opportunity_id is not null),'one match alert plus one distinct invitation');
select pg_temp.assert_ok((public.respond_to_job_opportunity((select id from public.job_opportunities limit 1),'view')->>'status')='viewed','view transition');
select pg_temp.assert_ok(not exists(select 1 from public.notifications where opportunity_id is not null and read_at is null),'view marks opportunity notifications read');
select pg_temp.assert_ok((public.respond_to_job_opportunity((select id from public.job_opportunities limit 1),'pass')->>'status')='passed','pass transition');
select pg_temp.assert_ok((public.respond_to_job_opportunity((select id from public.job_opportunities limit 1),'view')->>'status')='passed','view cannot undo a pass');
select pg_temp.assert_ok((select not can_quote and reason_code='opportunity_passed' from public.my_job_opportunities(1)),'passed opportunity is not actionable in feed');
do $$ begin
  begin
    update public.job_opportunities set match_score=100;
    raise exception 'Direct mutation unexpectedly allowed';
  exception when insufficient_privilege then
    perform pg_temp.assert_ok(true,'direct opportunity mutation denied');
  end;
  begin
    perform public.refresh_job_opportunities((select id from opportunity_test_ids where name='job'));
    raise exception 'Unauthorized dispatch unexpectedly allowed';
  exception when insufficient_privilege then
    perform pg_temp.assert_ok(true,'professional cannot dispatch another customer job');
  end;
end; $$;

select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='other'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='other'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.job_opportunities),'unrelated customer RLS isolation');
do $$ begin
  begin
    perform public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='pro2'));
    raise exception 'Unauthorized invitation unexpectedly allowed';
  exception when insufficient_privilege then perform pg_temp.assert_ok(true,'other customer cannot invite'); end;
end; $$;

reset role;
do $$ declare v_id uuid;
begin
  select id into v_id from public.job_opportunities where professional_id=(select id from opportunity_test_ids where name='pro1');
  insert into opportunity_test_ids values('pro1_opportunity',v_id);
end; $$;
set local role authenticated;
do $$ begin
  begin
    perform public.respond_to_job_opportunity((select id from opportunity_test_ids where name='pro1_opportunity'),'view');
    raise exception 'Unauthorized response unexpectedly allowed';
  exception when insufficient_privilege then perform pg_temp.assert_ok(true,'cross-account response denied'); end;
end; $$;

select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='customer'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='customer'),'role','authenticated')::text,true);
do $$ begin
  begin
    perform public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='pro1'));
    raise exception 'Passed opportunity was reinvited';
  exception when raise_exception then
    if sqlerrm<>'This opportunity is no longer accepting invitations' then raise; end if;
    perform pg_temp.assert_ok(true,'pass prevents repeat invitation');
  end;
  begin
    perform public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='pro8'));
    raise exception 'Unmatched professional was invited';
  exception when raise_exception then
    if sqlerrm<>'This professional is not currently eligible for an invitation' then raise; end if;
    perform pg_temp.assert_ok(true,'invites require a service match even with strict quoting off');
  end;
end; $$;

-- Choose one eligible professional outside the automatic top five and invite directly.
reset role;
insert into opportunity_test_ids select 'direct_pro',t.id from opportunity_test_ids t
  where t.name in ('pro5','pro6','pro7') and not exists(select 1 from public.job_opportunities o where o.professional_id=t.id)
  order by t.id limit 1;
set local role authenticated;
select pg_temp.assert_ok((public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='direct_pro'))->>'invited')::boolean,'customer invites recommended pro beyond automatic top five');

reset role;
update public.job_matching_config set max_invitations_per_job=2 where id=true;
set local role authenticated;
do $$ begin
  begin
    perform public.invite_professional_to_job((select id from opportunity_test_ids where name='job'),(select id from opportunity_test_ids where name='pro3'));
    raise exception 'Invitation count cap bypassed';
  exception when raise_exception then
    if sqlerrm<>'Invitation limit reached for this job' then raise; end if;
    perform pg_temp.assert_ok(true,'per-job invitation cap enforced');
  end;
end; $$;
reset role;
update public.job_matching_config set max_invitations_per_job=5 where id=true;
set local role authenticated;

-- A real quote INSERT, under the professional role, must drive the tracked status.
select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='pro2'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='pro2'),'role','authenticated')::text,true);
insert into public.quotes(job_id,professional_id,amount,timeframe,message)
  values((select id from opportunity_test_ids where name='job'),auth.uid(),100,'One day','Test quote');
select pg_temp.assert_ok((select status='quoted' and quoted_at is not null and quote_id is not null from public.job_opportunities limit 1),'quote insert marks opportunity quoted');
select pg_temp.assert_ok((select not can_quote and reason_code='already_quoted' from public.my_job_opportunities(1)),'quoted opportunity cannot be quoted again through feed');

-- Accept the quote through the existing lifecycle RPC, not by faking a status update.
select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='customer'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='customer'),'role','authenticated')::text,true);
select public.respond_to_quote((select id from public.quotes where job_id=(select id from opportunity_test_ids where name='job')),'accept');
select pg_temp.assert_ok(not exists(select 1 from public.job_opportunities where job_id=(select id from opportunity_test_ids where name='job') and status in ('offered','viewed')),'accepted job closes unresponded opportunities');
select pg_temp.assert_ok((select status='passed' from public.job_opportunities where professional_id=(select id from opportunity_test_ids where name='pro1')),'closure preserves pass history');
select pg_temp.assert_ok((public.refresh_job_opportunities((select id from opportunity_test_ids where name='job'))->>'reason')='job_not_open','closed job cannot generate alerts');

-- Isolate a fresh service for daily throttling and block checks.
reset role;
do $$ declare v_category text:='Daily cap test '||gen_random_uuid(); v_customer uuid; v_pro uuid; v_job uuid;
begin
  select id into v_customer from opportunity_test_ids where name='customer';
  select id into v_pro from opportunity_test_ids where name='pro8';
  update public.professional_profiles set services=array[v_category] where id=v_pro;
  update public.job_matching_config set max_opportunity_alerts_per_day=1 where id=true;
  insert into public.jobs(customer_id,title,category,city,status)
    values(v_customer,'Daily test one',v_category,'Atlanta','open') returning id into v_job;
  insert into opportunity_test_ids values('daily1',v_job);
  insert into public.jobs(customer_id,title,category,city,status)
    values(v_customer,'Daily test two',v_category,'Atlanta','open') returning id into v_job;
  insert into opportunity_test_ids values('daily2',v_job);
  perform pg_temp.assert_ok((select count(*)=1 from public.notifications where user_id=v_pro and type in ('matched_job','job_invitation')),'rolling daily alert cap');
  perform pg_temp.assert_ok(not exists(select 1 from public.job_opportunities where job_id=v_job),'capped professional is not alerted on another job');
end; $$;
set local role authenticated;
do $$ begin
  begin
    perform public.invite_professional_to_job((select id from opportunity_test_ids where name='daily2'),(select id from opportunity_test_ids where name='pro8'));
    raise exception 'Daily invitation cap bypassed';
  exception when raise_exception then
    if sqlerrm<>'This professional cannot receive another invitation right now' then raise; end if;
    perform pg_temp.assert_ok(true,'invitations share the rolling daily limit');
  end;
end; $$;
reset role;
-- The existing block RPC requires a prior conversation. Seed a historical block as fixture data.
insert into public.user_blocks(blocker_id,blocked_id) values
  ((select id from opportunity_test_ids where name='customer'),(select id from opportunity_test_ids where name='pro8'));
set local role authenticated;
do $$ begin
  begin
    perform public.invite_professional_to_job((select id from opportunity_test_ids where name='daily2'),(select id from opportunity_test_ids where name='pro8'));
    raise exception 'Blocked professional was invited';
  exception when raise_exception then
    if sqlerrm<>'This professional is not currently eligible for an invitation' then raise; end if;
    perform pg_temp.assert_ok(true,'block prevents invitation');
  end;
end; $$;
select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='pro8'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='pro8'),'role','authenticated')::text,true);
select pg_temp.assert_ok((select count(*)=0 from public.my_job_opportunities(100)),'blocked opportunity hidden from actionable feed');
do $$ begin
  begin
    insert into public.quotes(job_id,professional_id,amount,timeframe,message)
      values((select id from opportunity_test_ids where name='daily1'),auth.uid(),100,'One day','Test quote after block');
    raise exception 'Blocked professional was able to quote';
  exception when raise_exception then
    if sqlerrm<>'Professional is not eligible to quote: user_blocked' then raise; end if;
    perform pg_temp.assert_ok(true,'quote rechecks eligibility after an alert');
  end;
end; $$;

reset role;
-- Strict service matching is deliberately OFF: eligible pros may still browse and quote unrelated services.
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from opportunity_test_ids where name='pro7'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from opportunity_test_ids where name='pro7'),'role','authenticated')::text,true);
insert into public.quotes(job_id,professional_id,amount,timeframe,message)
  values((select id from opportunity_test_ids where name='daily2'),auth.uid(),120,'One day','Test quote for another service');
select pg_temp.assert_ok((select count(*)=1 from public.quotes where job_id=(select id from opportunity_test_ids where name='daily2')),'nonmatching service can still quote when strict matching is off');
reset role;
select pg_temp.assert_ok(not has_function_privilege('anon','public.invite_professional_to_job(uuid,uuid)','EXECUTE'),'anonymous invitation execution denied');
select pg_temp.assert_ok(not has_function_privilege('authenticated','korvo_opportunities_private.track_job_opportunity_quote()','EXECUTE'),'internal trigger cannot be invoked by client');
select pg_temp.assert_ok(not has_table_privilege('anon','public.job_opportunities','SELECT'),'anonymous opportunity read denied');
select pg_temp.assert_ok((select require_service_match_for_quote=false from public.job_matching_config where id=true),'strict quote matching setting preserved');
select pg_temp.assert_ok(not exists(select 1 from public.job_service_match_rules where requires_verified_identity or requires_verified_background or requires_verified_license),'verification requirements preserved');
select count(*) as tests_passed,jsonb_agg(name order by name) as checks from opportunity_test_results;

rollback;
