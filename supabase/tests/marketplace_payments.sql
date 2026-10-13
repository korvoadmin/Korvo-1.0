-- Administrative integration rehearsal: all fixtures and grants roll back.
begin;
create temporary table payment_test_ids(name text primary key,id uuid);
create temporary table payment_test_results(name text);
grant all on payment_test_ids,payment_test_results to authenticated,service_role,anon;
create function pg_temp.ok(v boolean,label text) returns void language plpgsql as $$
begin if v is distinct from true then raise exception 'FAILED: %',label;end if;insert into payment_test_results values(label);end;$$;
create function pg_temp.denied(q text,label text) returns void language plpgsql as $$
begin begin execute q;exception when insufficient_privilege then perform pg_temp.ok(true,label);return;end;
 raise exception 'FAILED: %',label;end;$$;
create function pg_temp.rejects(q text,label text) returns void language plpgsql as $$
begin begin execute q;exception when raise_exception then perform pg_temp.ok(true,label);return;end;
 raise exception 'FAILED: %',label;end;$$;
grant execute on function pg_temp.ok(boolean,text),pg_temp.denied(text,text),pg_temp.rejects(text,text) to authenticated,service_role,anon;
do $$ declare c uuid:=gen_random_uuid();pro uuid:=gen_random_uuid();other uuid:=gen_random_uuid();sid uuid:=gen_random_uuid();j uuid;q uuid;aj uuid;amount numeric;
begin
 insert into payment_test_ids values('customer',c),('professional',pro),('other',other),('session',sid);
 insert into auth.users(id,email,aud,role) values(c,c||'@example.invalid','authenticated','authenticated'),
  (pro,pro||'@example.invalid','authenticated','authenticated'),(other,other||'@example.invalid','authenticated','authenticated');
 insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,c,now(),now());
 insert into auth.sessions(id,user_id,created_at,updated_at) values(gen_random_uuid(),other,now(),now()) returning id into j;
 insert into payment_test_ids values('other_session',j);
 insert into public.profiles(id,account_type,is_active,onboarding_complete) values(c,'customer',true,true),(pro,'professional',true,true),(other,'customer',true,true);
 insert into public.professional_profiles(id,business_name,services,service_areas,is_public)
  values(pro,'Payment Fixture',array['Korvo payment '||pro],array['Atlanta'],true);
 foreach amount in array array[100,500,1000]::numeric[] loop
  perform set_config('request.jwt.claim.sub',c::text,true);
  insert into public.jobs(customer_id,title,category,city,status) values(c,'Payment fixture '||amount,'Korvo payment '||pro,'Atlanta','open') returning id into j;
  perform set_config('request.jwt.claim.sub',pro::text,true);
  insert into public.quotes(job_id,professional_id,amount,timeframe,message) values(j,pro,amount,'Same day','Payment fixture quote') returning id into q;
  update public.quotes set status='accepted' where id=q;
  update public.jobs set status='accepted' where id=j;
  insert into public.active_jobs(job_id,quote_id,customer_id,professional_id,amount,timeframe,status,job_title,job_reference,job_city,professional_name)
   values(j,q,c,pro,amount,'Same day','active','Fixture job','KRV-FIXTURE','Atlanta','Fixture Pro') returning id into aj;
  insert into payment_test_ids values('active_'||amount::int,aj);
 end loop;
 perform set_config('request.jwt.claim.sub',c::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'session_id',sid,'role','authenticated')::text,true);
end;$$;
set local role authenticated;
do $$ declare a integer;p jsonb;again jsonb;
begin
 foreach a in array array[100,500,1000] loop
  p:=public.marketplace_prepare_checkout((select id from payment_test_ids where name='active_'||a));
  perform pg_temp.ok((p->>'professional_gross_cents')::bigint=a*100,'professional receives full quote '||a);
  perform pg_temp.ok((p->>'platform_fee_cents')::bigint=a*12,'fee added to quote '||a);
  perform pg_temp.ok((p->>'customer_total_cents')::bigint=a*112,'full customer total '||a);
  again:=public.marketplace_prepare_checkout((select id from payment_test_ids where name='active_'||a));
  perform pg_temp.ok(p->>'id'=again->>'id' and p->>'checkout_token'=again->>'checkout_token','repeat checkout preparation stable '||a);
 end loop;
end;$$;
select pg_temp.denied('update public.marketplace_payments set status=''paid''','client cannot forge payment');
select pg_temp.denied('select public.marketplace_apply_event(''evt_fake'',''payment_intent.succeeded'',''{}'')','client cannot forge event');
select pg_temp.denied('select public.marketplace_webhook_secrets()','client cannot read signing secrets');
select pg_temp.denied('select public.prepare_booking_payment(gen_random_uuid())','superseded fee-only RPC disabled');
select set_config('request.jwt.claim.sub',(select id::text from payment_test_ids where name='other'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from payment_test_ids where name='other'),'session_id',(select id from payment_test_ids where name='other_session'),'role','authenticated')::text,true);
select pg_temp.denied(format('select public.marketplace_prepare_checkout(%L)',(select id from payment_test_ids where name='active_500')),'cross-user preparation denied');
select set_config('request.jwt.claim.sub',(select id::text from payment_test_ids where name='customer'),true);
select set_config('request.jwt.claims',jsonb_build_object('sub',(select id from payment_test_ids where name='customer'),'session_id',(select id from payment_test_ids where name='session'),'role','authenticated')::text,true);
reset role;
insert into public.professional_stripe_accounts(professional_id,stripe_account_id) select id,'acct_SQLfixture' from payment_test_ids where name='professional';
create function pg_temp.snapshot() returns jsonb language sql as $$
 select jsonb_build_object('kind','payment','livemode',false,'payment_id',p.id,'checkout_token',p.checkout_token,
 'payment_intent_id','pi_SQLfixture','charge_id','ch_SQLfixture','amount',p.customer_total_cents,'amount_received',p.customer_total_cents,
 'currency','usd','paid',true,'failed',false,'refunded_cents',0,'disputed',false)
 from public.marketplace_payments p where active_job_id=(select id from payment_test_ids where name='active_500');$$;
grant execute on function pg_temp.snapshot() to service_role;
set local role service_role;
select pg_temp.rejects('select public.marketplace_apply_event(''evt_null_amount'',''payment_intent.succeeded'',pg_temp.snapshot()-''amount'')','missing amount denied');
select pg_temp.rejects('select public.marketplace_apply_event(''evt_null_mode'',''payment_intent.succeeded'',pg_temp.snapshot()-''livemode'')','missing sandbox mode denied');
do $$begin
 begin perform public.marketplace_apply_event('evt_retry','payment_intent.succeeded',pg_temp.snapshot()||'{"amount":50000}');
 exception when raise_exception then perform pg_temp.ok(true,'wrong total rolls back');end;
end;$$;
reset role;
select pg_temp.ok(not exists(select 1 from public.stripe_event_receipts where id='evt_retry'),'failed event never marked processed');
set local role service_role;
select pg_temp.ok((public.marketplace_apply_event('evt_retry','payment_intent.succeeded',pg_temp.snapshot())->>'processed')::boolean,'failed delivery retries successfully');
select pg_temp.ok((public.marketplace_apply_event('evt_retry','payment_intent.succeeded',pg_temp.snapshot())->>'duplicate')::boolean,'completed delivery idempotent');
reset role;
select pg_temp.ok((select count(*)=2 from public.notifications where active_job_id=(select id from payment_test_ids where name='active_500') and type='booking_fee_paid'),'one payment notice per participant despite retry');
set local role authenticated;
select pg_temp.ok(public.get_booking_contact_details((select id from payment_test_ids where name='active_500'))->>'role'='professional','full-price paid booking unlocks contacts');
set local role service_role;
select public.marketplace_apply_event('evt_old_failure','payment_intent.payment_failed',pg_temp.snapshot()||'{"paid":false,"failed":true}');
select pg_temp.ok((select status='paid' from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_500')),'failure cannot regress paid');
select public.marketplace_apply_event('evt_refund','charge.refunded',pg_temp.snapshot()||'{"refunded_cents":5600}');
select pg_temp.ok((select status='partially_refunded' and professional_gross_cents=50000 and platform_fee_cents=6000 from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_500')),'refund preserves original quote and fee');
select public.marketplace_apply_event('evt_dispute','charge.dispute.created',pg_temp.snapshot()||'{"disputed":true}');
select pg_temp.ok((select status='disputed' and release_status='held' from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_500')),'dispute holds release');
reset role;
select pg_temp.ok((select refunded_total_cents=5600 from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_500')),'refund total cannot regress');
set local role service_role;
do $$declare s jsonb;
begin
 s:=jsonb_build_object('kind','connect','livemode',false,'account_id','acct_SQLfixture','professional_id',(select id from payment_test_ids where name='professional'),
  'checked_at',now(),'onboarding_status','complete','details_submitted',false,'charges_enabled',false,'payouts_enabled',false,'transfers_active',false);
 begin perform public.marketplace_apply_event('evt_bad_onboarding','account.updated',s);
 exception when raise_exception then perform pg_temp.ok(true,'incomplete onboarding denied');end;
 s:=s||jsonb_build_object('details_submitted',true,'payouts_enabled',true,'transfers_active',true);
 perform public.marketplace_apply_event('evt_good_onboarding','account.updated',s);
 s:=s||jsonb_build_object('checked_at',now()-interval '1 minute','onboarding_status','pending','details_submitted',false,'payouts_enabled',false);
 perform public.marketplace_apply_event('evt_stale_onboarding','account.updated',s);
end;$$;
reset role;
select pg_temp.ok((select onboarding_status='complete' from public.professional_stripe_accounts where stripe_account_id='acct_SQLfixture'),'stale status cannot overwrite completed snapshot');
select pg_temp.ok((select count(*)=3 from public.marketplace_payments where active_job_id in(select id from payment_test_ids where name like 'active_%')),'one payment per job');
update auth.sessions set not_after=now()-interval '1 second' where id=(select id from payment_test_ids where name='session');
set local role authenticated;
select pg_temp.denied(format('select public.marketplace_prepare_checkout(%L)',(select id from payment_test_ids where name='active_100')),'expired session cannot prepare payment');
reset role;

-- Paid work must stay on hold when a Korvo issue/cancellation follows payment.
reset role;
update auth.sessions set not_after=null where id=(select id from payment_test_ids where name='session');
create function pg_temp.hold_snapshot(a integer) returns jsonb language sql as $$
 select jsonb_build_object('kind','payment','livemode',false,'payment_id',p.id,'checkout_token',p.checkout_token,
 'payment_intent_id','pi_hold_'||a,'charge_id','ch_hold_'||a,'amount',p.customer_total_cents,
 'amount_received',p.customer_total_cents,'currency','usd','paid',true,'failed',false,'refunded_cents',0,'disputed',false)
 from public.marketplace_payments p where active_job_id=(select id from payment_test_ids where name='active_'||a);$$;
grant execute on function pg_temp.hold_snapshot(integer) to service_role;
set local role service_role;
select public.marketplace_apply_event('evt_hold_paid_100','payment_intent.succeeded',pg_temp.hold_snapshot(100));
reset role;
update public.active_jobs set status='cancelled' where id=(select id from payment_test_ids where name='active_100');
select pg_temp.ok((select requires_review and release_status='held' from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_100')),'paid cancellation sets hold immediately');
update public.active_jobs set status='active' where id=(select id from payment_test_ids where name='active_100');
select pg_temp.ok((select requires_review from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_100')),'status restoration never silently clears hold');
set local role service_role;
select public.marketplace_apply_event('evt_hold_paid_1000','payment_intent.succeeded',pg_temp.hold_snapshot(1000));
set local role authenticated;
select public.open_project_issue((select id from payment_test_ids where name='active_1000'),'payment_refund','Synthetic unresolved payment issue');
reset role;
select pg_temp.ok((select requires_review and release_status='held' from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_1000')),'paid project issue sets review hold');
select pg_temp.ok((select status='paid' and professional_gross_cents=100000 and platform_fee_cents=12000 and refunded_total_cents=0 from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_1000')),'issue never chooses refund policy or changes allocation');
update public.marketplace_payments set requires_review=false where active_job_id=(select id from payment_test_ids where name='active_1000');
set local role service_role;
select public.marketplace_apply_event('evt_late_paid_issue','payment_intent.succeeded',pg_temp.hold_snapshot(1000));
reset role;
select pg_temp.ok((select requires_review from public.marketplace_payments where active_job_id=(select id from payment_test_ids where name='active_1000')),'late successful provider event preserves unresolved issue hold');

select count(*) as checks_passed from payment_test_results;
rollback;
