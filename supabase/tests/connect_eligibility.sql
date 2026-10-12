-- Administrative, rollback-only tests; no Stripe calls or existing-user changes.
begin;
create temporary table connect_test_ids (kind text primary key, id uuid);
create temporary table connect_test_results (name text);
grant all on connect_test_ids,connect_test_results to authenticated,service_role,anon;
create function pg_temp.check_ok(ok boolean, label text) returns void language plpgsql as $$
begin
 if ok is distinct from true then raise exception 'FAILED: %',label; end if;
 insert into connect_test_results values(label);
end; $$;
create function pg_temp.must_deny(statement text,label text) returns void language plpgsql as $$
begin
 begin execute statement;
 exception when insufficient_privilege then perform pg_temp.check_ok(true,label);return;
 end;
 raise exception 'FAILED: %',label;
end; $$;
do $$ declare who text; uid uuid;
begin
 foreach who in array array['customer','professional'] loop
  uid:=gen_random_uuid();insert into connect_test_ids values(who,uid);
  insert into auth.users(id,email,aud,role) values(uid,uid||'@example.invalid','authenticated','authenticated');
 end loop;
end; $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',(select id::text from connect_test_ids where kind='customer'),true);
insert into public.profiles(id,account_type,is_active,onboarding_complete) values(auth.uid(),'customer',true,true);
select pg_temp.check_ok((select account_type='customer' from public.profiles where id=auth.uid()),'customer signup works');
select pg_temp.must_deny('update public.profiles set account_type=''professional'' where id=auth.uid()','customer cannot switch to professional');
select pg_temp.must_deny('update public.profiles set is_active=false where id=auth.uid()','client cannot alter account standing');
update public.profiles set first_name='Fixture' where id=auth.uid();
select pg_temp.check_ok((select first_name='Fixture' from public.profiles where id=auth.uid()),'ordinary profile edit works');
select pg_temp.must_deny('select * from public.professional_stripe_accounts','customer cannot read mappings');
select set_config('request.jwt.claim.sub',(select id::text from connect_test_ids where kind='professional'),true);
insert into public.profiles(id,account_type,is_active,onboarding_complete) values(auth.uid(),'professional',true,false);
insert into public.professional_profiles(id,business_name,services,service_areas) values(auth.uid(),'Fixture',array['Fixture'],array['Atlanta']);
update public.profiles set account_type='professional',onboarding_complete=true where id=auth.uid();
select pg_temp.check_ok((select onboarding_complete from public.profiles where id=auth.uid()),'professional onboarding same-role update works');
select pg_temp.must_deny('select * from public.professional_stripe_accounts','professional cannot read mappings directly');
select pg_temp.must_deny('insert into public.professional_stripe_accounts(professional_id,stripe_account_id) values(auth.uid(),''acct_fake'')','professional cannot forge mapping');
set local role service_role;
insert into public.professional_stripe_accounts(professional_id,stripe_account_id)
 select id,'acct_fixture_'||replace(id::text,'-','') from connect_test_ids where kind='professional'
 on conflict(professional_id) do update set onboarding_status='pending';
select pg_temp.check_ok((select count(*)=1 from public.professional_stripe_accounts where professional_id=(select id from connect_test_ids where kind='professional')),'service role can save mapping');
update public.professional_stripe_accounts set onboarding_status='in_progress'
 where professional_id=(select id from connect_test_ids where kind='professional');
select pg_temp.check_ok((select onboarding_status='in_progress' from public.professional_stripe_accounts where professional_id=(select id from connect_test_ids where kind='professional')),'service role can refresh status');
reset role;
grant select on public.professional_stripe_accounts to authenticated,anon;
set local role authenticated;
select pg_temp.check_ok((select count(*)=0 from public.professional_stripe_accounts),'RLS denies even accidentally granted client SELECT');
set local role anon;
select pg_temp.check_ok((select count(*)=0 from public.professional_stripe_accounts),'RLS denies anonymous');
reset role;
select count(*) as checks_passed from connect_test_results;
rollback;
