const {bootstrapFinancial,ids,customer,professional,owner,support,job}=require('./financial-fixture.cjs');const fs=require('node:fs/promises');
async function bootstrapBeta(db){await bootstrapFinancial(db);await db.exec(`alter table public.profiles add account_type text;update public.profiles set account_type=case when id='${professional}' then 'professional' else 'customer' end;
alter table public.active_jobs add job_id uuid,add customer_id uuid,add professional_id uuid,add status text default 'active',add amount numeric(10,2) default 100;update public.active_jobs set customer_id='${customer}',professional_id='${professional}';
grant insert on public.active_jobs to authenticated;
create table public.jobs(id uuid primary key default gen_random_uuid(),customer_id uuid,category text,city text,status text default 'open');alter table public.jobs enable row level security;grant select,insert on public.jobs to authenticated;create policy fixture_allow on public.jobs to authenticated using(true) with check(true);
create table public.quotes(id uuid primary key default gen_random_uuid(),job_id uuid references public.jobs(id),professional_id uuid,customer_id uuid);grant select,insert on public.quotes to authenticated;
create function korvo_payments_private.prepare_checkout(uuid) returns jsonb language sql as $$select '{"fixture":true}'::jsonb$$;`);
await db.exec(await fs.readFile('supabase/proposals/non_money_beta.sql','utf8'));}
module.exports={bootstrapBeta,ids,customer,professional,owner,support,job};
