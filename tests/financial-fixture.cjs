// Synthetic disposable database bootstrap, shared by isolated and native tests.
const fs=require('node:fs/promises');
const ids=Array.from({length:6},(_,i)=>`10000000-0000-0000-0000-00000000000${i+1}`);
const [customer,professional,support,owner,admin,inactive]=ids;
const payment='20000000-0000-0000-0000-000000000001',job='30000000-0000-0000-0000-000000000001';
const key='40000000-0000-0000-0000-000000000001';

async function bootstrapFinancial(db){
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create schema korvo_payments_private;
create function auth.uid() returns uuid language sql as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
create table public.profiles(id uuid primary key,is_active boolean default true);insert into public.profiles(id) values ${ids.map(i=>`('${i}')`).join(',')};
create table public.platform_admins(user_id uuid primary key,role text,is_active boolean);
insert into public.platform_admins values('${support}','support',true),('${owner}','owner',true),('${admin}','admin',true),('${inactive}','admin',false);
create table public.active_jobs(id uuid primary key);insert into public.active_jobs values('${job}');
create function korvo_payments_private.actor() returns uuid language plpgsql security definer set search_path='' as $$declare uid uuid:=auth.uid();begin
if uid is null or not exists(select 1 from public.profiles where id=uid and is_active) then raise exception 'Authentication required' using errcode='42501';end if;return uid;end;$$;
revoke all on function korvo_payments_private.actor() from public;
grant usage on schema public,auth to anon,authenticated,service_role;`);
const sql=await fs.readFile('supabase/migrations/20261012142416_sandbox_marketplace_payments.sql','utf8');
await db.exec(sql.slice(sql.indexOf('create table public.marketplace_payments'),sql.indexOf('create index marketplace_payments_customer')));
await db.exec(`insert into public.marketplace_payments(id,active_job_id,customer_id,professional_id,quote_cents,professional_gross_cents,platform_fee_cents,customer_total_cents,status,stripe_payment_intent_id,stripe_charge_id)
values('${payment}','${job}','${customer}','${professional}',50000,50000,6000,56000,'paid','pi_fixture','ch_fixture')`);
await db.exec(await fs.readFile('supabase/proposals/20261013175001_administrative_refund_review.sql','utf8'));
await db.exec(await fs.readFile('supabase/proposals/financial_operation_ledger.sql','utf8'));
}
module.exports={bootstrapFinancial,ids,customer,professional,support,owner,admin,inactive,payment,job,key};
