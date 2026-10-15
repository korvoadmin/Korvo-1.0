-- Administrative integration tests. All fixtures, grants and writes roll back.
begin;
create temporary table security_ids(name text primary key,id uuid not null);
create temporary table security_results(name text primary key);
grant select,insert,update on security_ids,security_results to authenticated,anon;
create function pg_temp.ok(value boolean,label text) returns void language plpgsql as $$
begin
 if value is distinct from true then raise exception 'FAILED: %',label; end if;
 insert into security_results values(label);
end; $$;
create function pg_temp.denied(statement text,label text) returns void language plpgsql as $$
begin
 begin
  execute statement;
 exception when insufficient_privilege then perform pg_temp.ok(true,label); return;
 when raise_exception then
  if sqlerrm ilike '%cannot%' or sqlerrm ilike '%authentication required%' or sqlerrm ilike '%admin access required%' or sqlerrm ilike '%locked%' then
    perform pg_temp.ok(true,label);return;
  end if;
  raise;
 end;
 raise exception 'FAILED: unauthorized action succeeded: %',label;
end; $$;
create function pg_temp.login(who text) returns void language plpgsql as $$
declare uid uuid;
begin
 select id into strict uid from security_ids where name=who;
 perform set_config('request.jwt.claim.sub',uid::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'role','authenticated','user_metadata',jsonb_build_object('role','admin','is_admin',true))::text,true);
end; $$;
grant execute on function pg_temp.ok(boolean,text),pg_temp.denied(text,text),pg_temp.login(text) to authenticated,anon;
do $$ declare who text; uid uuid;
begin
 foreach who in array array['customer','pro','other','admin'] loop
  uid:=gen_random_uuid();insert into security_ids values(who,uid);
  insert into auth.users(id,email,aud,role) values(uid,uid||'@example.invalid','authenticated','authenticated');
  insert into public.profiles(id,account_type,is_active,onboarding_complete)
   values(uid,case when who='pro' then 'professional' else 'customer' end,true,who<>'pro');
 end loop;
end; $$;

select pg_temp.ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname='public' and p.prosecdef and (has_function_privilege('anon',p.oid,'execute') or has_function_privilege('authenticated',p.oid,'execute'))),'no exposed definer executable by clients');
select pg_temp.ok(not exists(select 1 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
 where n.nspname in ('public','korvo_api_private','korvo_opportunities_private') and p.prosecdef and not coalesce(p.proconfig @> array['search_path=""'],false)),'privileged search paths pinned empty');
select pg_temp.ok(not has_schema_privilege('anon','korvo_api_private','usage') and not has_schema_privilege('authenticated','korvo_api_private','create'),'private schema cannot be changed by clients');
select pg_temp.ok(not has_schema_privilege('authenticated','public','create'),'clients cannot shadow public routines');

set local role authenticated;
select pg_temp.login('customer');
select pg_temp.ok(public.is_korvo_admin()=false,'editable metadata cannot grant admin');
select pg_temp.denied('update public.profiles set account_type=''admin'' where id=auth.uid()','self-granted admin role denied');
select pg_temp.denied('update public.profiles set account_type=''professional'' where id=auth.uid()','self role switching denied');
select pg_temp.denied('insert into public.professional_profiles(id,business_name) values(auth.uid(),''Fake pro'')','customer cannot create professional identity');
select pg_temp.denied('select public.is_blocked_between(auth.uid(),auth.uid())','internal block helper unavailable');
select pg_temp.denied('select public.is_korvo_action_allowed(auth.uid(),''quote'')','internal restrictions helper unavailable');
select pg_temp.denied('select public.prepare_booking_payment(gen_random_uuid())','legacy payment preparation disabled');
select pg_temp.denied('update public.booking_payments set status=''paid''','client cannot forge paid status');
select pg_temp.denied('update public.professional_subscriptions set status=''active''','client cannot forge membership');
select pg_temp.denied('insert into public.jobs(customer_id,title,category,city,status) values(auth.uid(),''Forged completed job'',''Test'',''Atlanta'',''completed'')','job cannot start completed');
update public.profiles set first_name='Updated' where id=auth.uid();
select pg_temp.ok((select first_name='Updated' from public.profiles where id=auth.uid()),'ordinary profile edits remain allowed');

-- Every flagged administrative endpoint must reject a normal user, even with forged metadata.
do $$ declare f record; call_sql text;
begin
 for f in select p.oid,p.proname,p.proargtypes from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and p.proname like 'admin\_%' escape '\' loop
  select 'select public.'||quote_ident(f.proname)||'('||coalesce(string_agg('null::'||format_type(t,null),','),'')||')'
    into call_sql from unnest(f.proargtypes::oid[]) t;
  perform pg_temp.denied(call_sql,'admin endpoint denies ordinary user: '||f.proname);
 end loop;
end; $$;

select pg_temp.login('pro');
select pg_temp.denied('update public.profiles set onboarding_complete=true where id=auth.uid()','incomplete professional cannot skip onboarding');
insert into public.professional_profiles(id,business_name,services,service_areas,is_public,verification_status)
 values(auth.uid(),'Security Fixture Pro',array['Korvo security '||auth.uid()],array['Atlanta'],true,'Verified');
select pg_temp.ok((select verification_status='Not Verified' from public.professional_profiles where id=auth.uid()),'professional cannot self verify on insert');
update public.profiles set onboarding_complete=true where id=auth.uid();
update public.professional_profiles set verification_status='Verified' where id=auth.uid();
select pg_temp.ok((select verification_status='Not Verified' from public.professional_profiles where id=auth.uid()),'professional cannot self verify on update');
select pg_temp.ok(public.my_professional_membership()->>'plan_code'='free_trial','new professional gets membership through protected trigger');

select pg_temp.login('customer');
insert into public.jobs(customer_id,title,category,city,state,status) values(auth.uid(),'Security Fixture Job',
 'Korvo security '||(select id from security_ids where name='pro'),'Atlanta','GA','open') returning id;
insert into security_ids select 'job',id from public.jobs where customer_id=auth.uid();
select public.upsert_job_private_details((select id from security_ids where name='job'),'123 Fixture Lane',null,'Atlanta','GA','30341',null);
select pg_temp.ok((select count(*)=1 from public.get_job_private_details((select id from security_ids where name='job'))),'owner private details RPC remains available');
select pg_temp.denied('update public.job_private_details set access_notes=''direct write''','private details must use lifecycle checked RPC');

select pg_temp.login('pro');
insert into public.quotes(job_id,professional_id,customer_id,amount,timeframe,message)
 values((select id from security_ids where name='job'),auth.uid(),(select id from security_ids where name='other'),125,'Same day','Fixture quote');
insert into security_ids select 'quote',id from public.quotes where professional_id=auth.uid();
select pg_temp.ok((select customer_id=(select id from security_ids where name='customer') from public.quotes),'quote trigger derives actual customer');
insert into security_ids select 'conversation',id from public.conversations where professional_id=auth.uid();
select pg_temp.ok(public.send_korvo_message((select id from security_ids where name='conversation'),'Ready to discuss the project')->>'status'='sent','message RPC works after wrapper migration');

select pg_temp.login('other');
select pg_temp.denied(format('select public.respond_to_quote(%L,''accept'')',(select id from security_ids where name='quote')),'other customer cannot accept quote');
select pg_temp.denied(format('select public.get_job_private_details(%L)',(select id from security_ids where name='job')),'other customer cannot read private address');
select pg_temp.denied(format('select public.send_korvo_message(%L,''Unauthorized message'')',(select id from security_ids where name='conversation')),'other customer cannot message conversation');
select pg_temp.denied(format('select public.mark_conversation_read(%L)',(select id from security_ids where name='conversation')),'other customer cannot mark conversation read');
select pg_temp.ok((select count(*)=0 from public.quotes),'quote RLS still excludes unrelated users');
select pg_temp.ok((select count(*)=0 from public.messages),'message RLS still excludes unrelated users');

select pg_temp.login('customer');
insert into security_ids select 'active_job',(public.respond_to_quote((select id from security_ids where name='quote'),'accept')->>'active_job_id')::uuid;
select pg_temp.denied(format('select public.get_booking_contact_details(%L)',(select id from security_ids where name='active_job')),'unpaid booking does not unlock private contacts');
select pg_temp.ok(public.get_professional_trust_summary((select id from security_ids where name='pro')) is not null,'authenticated public trust summary works');
select public.block_korvo_user((select id from security_ids where name='pro'));
select pg_temp.ok(public.get_professional_trust_summary((select id from security_ids where name='pro')) is null,'blocked trust identity not disclosed');
select pg_temp.ok((select count(*)=0 from public.job_recommended_professionals((select id from security_ids where name='job'))),'legacy recommendations respect block');
select public.unblock_korvo_user((select id from security_ids where name='pro'));

select pg_temp.login('pro');
select public.professional_request_job_completion((select id from security_ids where name='active_job'));
select pg_temp.login('other');
select pg_temp.denied(format('select public.customer_confirm_job_completion(%L)',(select id from security_ids where name='active_job')),'other customer cannot complete booking');
select pg_temp.login('customer');
select public.customer_confirm_job_completion((select id from security_ids where name='active_job'));
select public.submit_job_review((select id from security_ids where name='job'),5,'Fixture review');
select pg_temp.ok((select count(*)=1 from public.customer_past_projects()),'customer history works after completion');
select pg_temp.login('pro');
select pg_temp.ok((select count(*)=1 from public.professional_past_projects()),'professional history works after completion');
select pg_temp.ok((public.get_professional_trust_summary(auth.uid())->>'review_count')::int=1,'trust summary uses actual saved review');
select public.request_professional_verification('identity');
select pg_temp.ok((select count(*)=1 from public.my_professional_verifications()),'professional verification request and own status work');

-- Explicit backend-only policies still deny access if a future migration accidentally grants SELECT.
reset role;
grant select on public.job_matching_config,public.payment_webhook_events,public.platform_admins,
 public.professional_badges,public.professional_verification_history,public.professional_verifications to authenticated,anon;
set local role authenticated;
do $$ declare t text; c bigint;
begin
 foreach t in array array['job_matching_config','payment_webhook_events','platform_admins','professional_badges','professional_verification_history','professional_verifications'] loop
  execute format('select count(*) from public.%I',t) into c;
  perform pg_temp.ok(c=0,'backend-only policy denies authenticated: '||t);
 end loop;
end; $$;
reset role;
update public.profiles set is_active=false where id=(select id from security_ids where name='pro');
set local role authenticated;
select pg_temp.login('pro');
select pg_temp.denied('update public.profiles set is_active=true where id=auth.uid()','disabled account cannot reactivate itself');
reset role;
update public.profiles set is_active=true where id=(select id from security_ids where name='pro');
insert into public.platform_admins(user_id,role) select id,'owner' from security_ids where name='admin';
set local role authenticated;
select pg_temp.login('admin');
select pg_temp.ok(public.is_korvo_admin(),'database-authorized owner recognized');
select * from public.admin_issue_queue();
select * from public.admin_trust_safety_queue();
select * from public.admin_message_moderation_queue();
select * from public.admin_professional_verification_queue();
select public.admin_add_account_strike((select id from security_ids where name='other'),'spam','Fixture verified warning',1);
select pg_temp.ok(true,'authorized admin queues and strike mutation work');
reset role;
update public.platform_admins set role='support' where user_id=(select id from security_ids where name='admin');
set local role authenticated;
select pg_temp.denied('select public.admin_decide_payment_review(null,null,null)','support cannot decide financial payment review');
select pg_temp.denied('select public.admin_set_professional_membership(null,null,null)','support cannot grant financial membership');
select pg_temp.denied('select public.admin_release_professional_job_usage(null,null)','support cannot modify reserved job usage');
reset role;
update public.platform_admins set is_active=false where user_id=(select id from security_ids where name='admin');
set local role authenticated;
select pg_temp.ok(not public.is_korvo_admin(),'revoked admin loses access immediately');
select pg_temp.denied('select public.admin_issue_queue()','revoked admin denied');

set local role anon;
do $$ declare f record; stmt text; t text; c bigint;
begin
 for f in select p.proname,p.proargtypes from pg_proc p join pg_namespace n on n.oid=p.pronamespace
   where n.nspname='public' and has_function_privilege('authenticated',p.oid,'execute') loop
  select 'select public.'||quote_ident(f.proname)||'('||coalesce(string_agg('null::'||format_type(v,null),','),'')||')'
   into stmt from unnest(f.proargtypes::oid[]) v;
  perform pg_temp.denied(stmt,'anonymous cannot execute: '||f.proname);
 end loop;
 foreach t in array array['job_matching_config','payment_webhook_events','platform_admins','professional_badges','professional_verification_history','professional_verifications'] loop
  execute format('select count(*) from public.%I',t) into c;
  perform pg_temp.ok(c=0,'backend-only policy denies anonymous: '||t);
 end loop;
end; $$;
reset role;
select count(*) as checks_passed from security_results;
rollback;
