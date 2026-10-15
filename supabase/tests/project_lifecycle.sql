-- Administrative integration rehearsal: all fixtures and grants roll back.
begin;
create temporary table lifecycle_ids(name text primary key,id uuid);
create temporary table lifecycle_results(name text);
grant all on lifecycle_ids,lifecycle_results to authenticated,service_role,anon;
create function pg_temp.ok(v boolean,label text) returns void language plpgsql as $$
begin if v is distinct from true then raise exception 'FAILED: %',label;end if;insert into lifecycle_results values(label);end;$$;
create function pg_temp.denied(q text,label text) returns void language plpgsql as $$
begin begin execute q;exception when insufficient_privilege then perform pg_temp.ok(true,label);return;end;
 raise exception 'FAILED: %',label;end;$$;
create function pg_temp.rejects(q text,label text) returns void language plpgsql as $$
begin begin execute q;exception when raise_exception then perform pg_temp.ok(true,label);return;end;
 raise exception 'FAILED: %',label;end;$$;
grant execute on function pg_temp.ok(boolean,text),pg_temp.denied(text,text),pg_temp.rejects(text,text) to authenticated,service_role,anon;
do $$ declare c uuid:=gen_random_uuid();pro uuid:=gen_random_uuid();other uuid:=gen_random_uuid();sid uuid:=gen_random_uuid();j uuid;q uuid;aj uuid;amount numeric;
begin
 insert into lifecycle_ids values('customer',c),('professional',pro),('other',other),('session',sid);
 insert into auth.users(id,email,aud,role) values(c,c||'@example.invalid','authenticated','authenticated'),
  (pro,pro||'@example.invalid','authenticated','authenticated'),(other,other||'@example.invalid','authenticated','authenticated');
 insert into auth.sessions(id,user_id,created_at,updated_at) values(sid,c,now(),now());
 insert into auth.sessions(id,user_id,created_at,updated_at) values(gen_random_uuid(),other,now(),now()) returning id into j;
 insert into lifecycle_ids values('other_session',j);
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
  insert into lifecycle_ids values('active_'||amount::int,aj);
 end loop;
 perform set_config('request.jwt.claim.sub',c::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',c,'session_id',sid,'role','authenticated')::text,true);
end;$$;

create function pg_temp.login(name text) returns void language plpgsql as $$
declare uid uuid;sid uuid;begin
 select id into strict uid from lifecycle_ids where lifecycle_ids.name=login.name;
 select id into sid from lifecycle_ids where lifecycle_ids.name=login.name||'_session';
 perform set_config('request.jwt.claim.sub',uid::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',uid,'session_id',sid,'role','authenticated')::text,true);
end;$$;
create function pg_temp.expected_failure(q text,expected text,label text) returns void language plpgsql as $$
begin begin execute q;exception when others then
 if sqlerrm !~* expected then raise exception 'Unexpected failure for %: %',label,sqlerrm;end if;
 perform pg_temp.ok(true,label);return;end;raise exception 'FAILED: %',label;end;$$;
grant execute on function pg_temp.login(text),pg_temp.expected_failure(text,text,text) to authenticated;
insert into lifecycle_ids values('professional_session',gen_random_uuid());
insert into lifecycle_ids select 'customer_session',id from lifecycle_ids where name='session';
insert into auth.sessions(id,user_id,created_at,updated_at) select (select id from lifecycle_ids where name='professional_session'),id,now(),now() from lifecycle_ids where name='professional';
set local role authenticated;
select pg_temp.login('customer');
select pg_temp.expected_failure(format('select public.customer_confirm_job_completion(%L)',(select id from lifecycle_ids where name='active_100')),'not waiting','customer cannot complete unfinished work');
select pg_temp.expected_failure(format('select public.professional_request_job_completion(%L)',(select id from lifecycle_ids where name='active_100')),'cannot update','customer cannot impersonate professional completion');
select pg_temp.expected_failure(format('select public.submit_job_review((select job_id from public.active_jobs where id=%L),5,''fixture'')',(select id from lifecycle_ids where name='active_100')),'completed','incomplete job cannot receive review');
select pg_temp.login('professional');
do $$declare p jsonb;begin
 p:=public.professional_request_job_completion((select id from lifecycle_ids where name='active_100'));
 perform pg_temp.ok(p->>'status'='pending_confirmation','professional completion awaits customer confirmation');
end;$$;
select pg_temp.expected_failure(format('select public.professional_request_job_completion(%L)',(select id from lifecycle_ids where name='active_100')),'not eligible','duplicate professional completion rejected');
select pg_temp.expected_failure(format('select public.customer_confirm_job_completion(%L)',(select id from lifecycle_ids where name='active_100')),'cannot confirm','professional cannot self-confirm customer completion');
select pg_temp.login('other');
select pg_temp.expected_failure(format('select public.customer_confirm_job_completion(%L)',(select id from lifecycle_ids where name='active_100')),'cannot confirm','other customer cannot confirm work');
select pg_temp.ok((select count(*)=0 from public.active_jobs where id=(select id from lifecycle_ids where name='active_100')),'other customer cannot read private active job');
select pg_temp.login('customer');
do $$declare p jsonb;r public.reviews%rowtype;begin
 p:=public.customer_confirm_job_completion((select id from lifecycle_ids where name='active_100'));
 perform pg_temp.ok(p->>'status'='completed','correct customer completes submitted work');
 select * into r from public.submit_job_review((select job_id from public.active_jobs where id=(select id from lifecycle_ids where name='active_100')),5,'Synthetic rollback fixture');
 perform pg_temp.ok(r.customer_id=(select id from lifecycle_ids where name='customer') and r.rating=5,'review saved under correct customer');
end;$$;
select pg_temp.expected_failure(format('select public.customer_confirm_job_completion(%L)',(select id from lifecycle_ids where name='active_100')),'not waiting','duplicate customer completion rejected');
select pg_temp.expected_failure(format('select public.submit_job_review((select job_id from public.active_jobs where id=%L),5,''repeat'')',(select id from lifecycle_ids where name='active_100')),'already|duplicate','duplicate review prevented');
-- Seed a paid DB snapshot only inside this rollback; this is not a Stripe charge.
select public.marketplace_prepare_checkout((select id from lifecycle_ids where name='active_500'));
reset role;
update public.marketplace_payments set status='paid' where active_job_id=(select id from lifecycle_ids where name='active_500');
set local role authenticated;
select pg_temp.login('professional');
do $$declare p jsonb;begin
 p:=public.professional_cancel_job((select id from lifecycle_ids where name='active_500'),'Synthetic no-show/cancellation review fixture');
 perform pg_temp.ok(p->>'status'='cancelled','professional cancellation records canceled state');
end;$$;
select pg_temp.expected_failure(format('select public.professional_request_job_completion(%L)',(select id from lifecycle_ids where name='active_500')),'not eligible','canceled job cannot submit completion');
select pg_temp.login('customer');
select pg_temp.expected_failure(format('select public.customer_confirm_job_completion(%L)',(select id from lifecycle_ids where name='active_500')),'not waiting','canceled job cannot be confirmed completed');
reset role;
select pg_temp.ok((select requires_review and release_status='held' and professional_gross_cents=50000 and platform_fee_cents=6000 and customer_total_cents=56000 and refunded_total_cents=0 from public.marketplace_payments where active_job_id=(select id from lifecycle_ids where name='active_500')),'cancellation holds payment without fee deduction, automatic refund or penalty');
set local role authenticated;
select pg_temp.login('other');
select pg_temp.expected_failure(format('select public.open_project_issue(%L,''other'',''Synthetic no-show complaint'')',(select id from lifecycle_ids where name='active_1000')),'cannot|participant','outsider cannot open job dispute');
select pg_temp.login('customer');
select public.marketplace_prepare_checkout((select id from lifecycle_ids where name='active_1000'));
reset role;
update public.marketplace_payments set status='paid' where active_job_id=(select id from lifecycle_ids where name='active_1000');
set local role authenticated;
select pg_temp.login('customer');
do $$declare p jsonb;begin
 p:=public.open_project_issue((select id from lifecycle_ids where name='active_1000'),'other','Synthetic no-show complaint: professional did not attend','Manual support review');
 perform pg_temp.ok(p->>'issue_id' is not null,'customer no-show complaint opens review without penalty');
end;$$;
select pg_temp.expected_failure(format('select public.open_project_issue(%L,''other'',''Repeated synthetic complaint'')',(select id from lifecycle_ids where name='active_1000')),'already|not eligible','duplicate active dispute rejected');
reset role;
select pg_temp.ok((select requires_review and release_status='held' and professional_gross_cents=100000 and platform_fee_cents=12000 and customer_total_cents=112000 and refunded_total_cents=0 from public.marketplace_payments where active_job_id=(select id from lifecycle_ids where name='active_1000')),'no-show review holds gross allocations without fine or automatic refund');
select count(*) as checks_passed from lifecycle_results;
rollback;
