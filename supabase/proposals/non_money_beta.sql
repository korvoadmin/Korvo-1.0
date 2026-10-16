-- DEVELOPMENT / separate A11 approval required. No invitations, legal copy or activation.
-- Prerequisites: existing profiles/active_jobs/platform_admins/payments and hardened actor.
create schema korvo_beta_private;
revoke all on schema korvo_beta_private from public,anon,authenticated,service_role;
grant usage on schema korvo_beta_private to authenticated,service_role;
create table korvo_beta_private.cohort(id text primary key check(id='atlanta-v1'),enabled boolean not null default false,paused boolean not null default false,
 customer_cap integer not null default 10 check(customer_cap=10),professional_cap integer not null default 10 check(professional_cap=10),
 categories text[] not null default '{}',cities text[] not null default '{}',check(not enabled or (cardinality(categories)>0 and cardinality(cities)>0)));
insert into korvo_beta_private.cohort(id) values('atlanta-v1');
create table korvo_beta_private.seats(user_id uuid primary key references public.profiles(id),role text not null check(role in('customer','professional')),request_key uuid not null unique,created_at timestamptz not null default now());
create table korvo_beta_private.documents(id uuid primary key default gen_random_uuid(),audience text not null check(audience in('customer','professional')),kind text not null check(kind in('terms','privacy')),version text not null check(length(version) between 1 and 100),sha256 text not null check(sha256 ~ '^[a-f0-9]{64}$'),url text not null check(url ~ '^https://'),approved boolean not null default false,active boolean not null default false,unique(audience,kind,version),check(not active or approved));
create unique index beta_one_active_document on korvo_beta_private.documents(audience,kind) where active;
create table korvo_beta_private.assent(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),document_id uuid not null references korvo_beta_private.documents(id),document_sha256 text not null,request_key uuid not null unique,accepted_at timestamptz not null default now(),unique(user_id,document_id));
create table korvo_beta_private.simulations(id uuid primary key default gen_random_uuid(),active_job_id uuid not null unique references public.active_jobs(id),customer_id uuid not null references public.profiles(id),request_key uuid not null unique,professional_gross_cents bigint not null,fee_cents bigint not null,total_cents bigint not null,created_at timestamptz not null default now(),check(professional_gross_cents between 1 and 89285713),check(fee_cents=floor((professional_gross_cents*12+50)/100.0)),check(total_cents=professional_gross_cents+fee_cents));
create table korvo_beta_private.support_cases(id uuid primary key default gen_random_uuid(),user_id uuid not null references public.profiles(id),request_key uuid not null unique,subject text not null check(length(btrim(subject)) between 5 and 120),body text not null check(length(btrim(body)) between 10 and 3000),created_at timestamptz not null default now());
create table korvo_beta_private.support_replies(id uuid primary key default gen_random_uuid(),case_id uuid not null references korvo_beta_private.support_cases(id),actor_id uuid not null references public.profiles(id),body text not null check(length(btrim(body)) between 5 and 3000),request_key uuid not null unique,created_at timestamptz not null default now());
do $$declare t text;begin foreach t in array array['cohort','seats','documents','assent','simulations','support_cases','support_replies'] loop
 execute format('alter table korvo_beta_private.%I enable row level security',t);execute format('revoke all on korvo_beta_private.%I from public,anon,authenticated,service_role',t);
end loop;end;$$;
create function korvo_beta_private.enabled() returns boolean language sql security definer set search_path='' as $$select enabled from korvo_beta_private.cohort where id='atlanta-v1'$$;
create function korvo_beta_private.ready(p_user uuid,p_role text) returns boolean language sql security definer set search_path='' as $$
select exists(select 1 from public.profiles p join korvo_beta_private.seats s on s.user_id=p.id and s.role=p.account_type where p.id=p_user and p.is_active and p.account_type=p_role)
 and (select count(*) from korvo_beta_private.documents where approved and active and audience=p_role)=2
 and not exists(select 1 from korvo_beta_private.documents d where d.approved and d.active and d.audience=p_role and not exists(select 1 from korvo_beta_private.assent a where a.user_id=p_user and a.document_id=d.id and a.document_sha256=d.sha256))$$;
create function korvo_beta_private.actor(require_assent boolean default true) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();r text;begin
 if not korvo_beta_private.enabled() or (select paused from korvo_beta_private.cohort where id='atlanta-v1') then raise exception 'Non-money beta disabled or paused' using errcode='42501';end if;
 select account_type into r from public.profiles where id=uid;
 if not exists(select 1 from korvo_beta_private.seats where user_id=uid and role=r) then raise exception 'Invited beta seat required' using errcode='42501';end if;
 if require_assent and ((select count(*) from korvo_beta_private.documents where approved and active and audience=r)<>2 or exists(select 1 from korvo_beta_private.documents d where d.approved and d.active and d.audience=r and not exists(select 1 from korvo_beta_private.assent a where a.user_id=uid and a.document_id=d.id and a.document_sha256=d.sha256))) then raise exception 'Current approved terms and privacy assent required' using errcode='42501';end if;
 return uid;end;$$;
create function korvo_beta_private.reserve_seat(p_user uuid,p_role text,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare c korvo_beta_private.cohort%rowtype;s korvo_beta_private.seats%rowtype;r text;begin
 select * into strict c from korvo_beta_private.cohort where id='atlanta-v1' for update;
 if not c.enabled or c.paused or p_key is null or p_role is null or p_role not in('customer','professional') then raise exception 'Disabled cohort or invalid seat';end if;
 select account_type into r from public.profiles where id=p_user and is_active;
 if r is distinct from p_role then raise exception 'Active profile role mismatch' using errcode='42501';end if;
 select * into s from korvo_beta_private.seats where request_key=p_key;
 if found then if s.user_id<>p_user or s.role<>p_role then raise exception 'Seat request conflict';end if;return jsonb_build_object('user_id',s.user_id,'role',s.role);end if;
 if exists(select 1 from korvo_beta_private.seats where user_id=p_user) then raise exception 'Seat already reserved';end if;
 if (select count(*) from korvo_beta_private.seats where role=p_role)>=(case when p_role='customer' then c.customer_cap else c.professional_cap end) then raise exception 'Beta role capacity reached' using errcode='23514';end if;
 insert into korvo_beta_private.seats(user_id,role,request_key) values(p_user,p_role,p_key);return jsonb_build_object('user_id',p_user,'role',p_role);end;$$;
create function korvo_beta_private.status() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();r text;docs jsonb;begin
 select account_type into r from public.profiles where id=uid;
 select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'kind',d.kind,'version',d.version,'sha256',d.sha256,'url',d.url,'accepted',exists(select 1 from korvo_beta_private.assent a where a.user_id=uid and a.document_id=d.id and a.document_sha256=d.sha256)) order by d.kind),'[]') into docs from korvo_beta_private.documents d where approved and active and audience=r;
 return jsonb_build_object('enabled',korvo_beta_private.enabled(),'paused',(select paused from korvo_beta_private.cohort where id='atlanta-v1'),'seated',exists(select 1 from korvo_beta_private.seats where user_id=uid and role=r),'role',r,'support_staff',exists(select 1 from public.platform_admins where user_id=uid and is_active and role in('owner','admin','support')),'documents',docs,'money_enabled',false,'invitations_enabled',false);end;$$;
create function korvo_beta_private.accept_document(p_doc uuid,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_beta_private.actor(false);d korvo_beta_private.documents%rowtype;a korvo_beta_private.assent%rowtype;begin
 if p_key is null then raise exception 'Assent request identity required';end if;
 select * into strict d from korvo_beta_private.documents where id=p_doc and approved and active and audience=(select account_type from public.profiles where id=uid) for share;
 select * into a from korvo_beta_private.assent where request_key=p_key;
 if found then if a.user_id<>uid or a.document_id<>p_doc or a.document_sha256<>d.sha256 then raise exception 'Assent key conflict';end if;return jsonb_build_object('id',a.id,'document_id',d.id,'sha256',a.document_sha256);end if;
 insert into korvo_beta_private.assent(user_id,document_id,document_sha256,request_key) values(uid,d.id,d.sha256,p_key) on conflict(user_id,document_id) do nothing;
 select * into strict a from korvo_beta_private.assent where user_id=uid and document_id=d.id;
 if a.document_sha256<>d.sha256 then raise exception 'Document changed without version revision';end if;
 return jsonb_build_object('id',a.id,'document_id',d.id,'sha256',a.document_sha256);end;$$;
create function korvo_beta_private.guard_job() returns trigger language plpgsql security definer set search_path='' as $$
declare uid uuid;c korvo_beta_private.cohort%rowtype;begin
 if not korvo_beta_private.enabled() then return new;end if;uid:=korvo_beta_private.actor();select * into strict c from korvo_beta_private.cohort where id='atlanta-v1';
 if new.customer_id is distinct from uid or not exists(select 1 from korvo_beta_private.seats where user_id=uid and role='customer') or not coalesce(new.category=any(c.categories),false) or not coalesce(new.city=any(c.cities),false) then raise exception 'Beta customer/category/location not allowed' using errcode='42501';end if;return new;end;$$;
create function korvo_beta_private.visible(p_category text,p_city text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid;c korvo_beta_private.cohort%rowtype;begin
 if not korvo_beta_private.enabled() then return true;end if;
 begin uid:=korvo_beta_private.actor();exception when insufficient_privilege then return false;end;
 select * into strict c from korvo_beta_private.cohort where id='atlanta-v1';return coalesce(p_category=any(c.categories) and p_city=any(c.cities),false);end;$$;
create policy beta_job_visibility on public.jobs as restrictive for select to authenticated using(korvo_beta_private.visible(category,city));
create function korvo_beta_private.guard_quote() returns trigger language plpgsql security definer set search_path='' as $$
declare uid uuid;j public.jobs%rowtype;begin
 if not korvo_beta_private.enabled() then return new;end if;uid:=korvo_beta_private.actor();
 select * into strict j from public.jobs where id=new.job_id for key share;
 if new.customer_id is distinct from j.customer_id or new.professional_id is distinct from uid or not exists(select 1 from korvo_beta_private.seats where user_id=uid and role='professional') or not exists(select 1 from korvo_beta_private.seats where user_id=j.customer_id and role='customer') or not korvo_beta_private.visible(j.category,j.city) then raise exception 'Beta professional/job not allowed' using errcode='42501';end if;return new;end;$$;
create trigger beta_restrict_quotes before insert on public.quotes for each row execute function korvo_beta_private.guard_quote();
create trigger beta_restrict_job_creation before insert or update of category,city,customer_id on public.jobs for each row execute function korvo_beta_private.guard_job();
create function korvo_beta_private.guard_assignment() returns trigger language plpgsql security definer set search_path='' as $$
declare uid uuid;j public.jobs%rowtype;begin
 if not korvo_beta_private.enabled() then return new;end if;uid:=korvo_beta_private.actor();
 select * into strict j from public.jobs where id=new.job_id for key share;
 if new.customer_id is distinct from uid or j.customer_id is distinct from uid or not korvo_beta_private.ready(uid,'customer') or not korvo_beta_private.ready(new.professional_id,'professional') or not korvo_beta_private.visible(j.category,j.city) then raise exception 'Current admitted beta participants and allowed job required' using errcode='42501';end if;return new;end;$$;
create trigger beta_restrict_assignment before insert or update of job_id,customer_id,professional_id on public.active_jobs for each row execute function korvo_beta_private.guard_assignment();
create function korvo_beta_private.guard_checkout(p_job uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if korvo_beta_private.enabled() then raise exception 'Non-money beta: checkout prohibited' using errcode='42501';end if;
 return korvo_payments_private.prepare_checkout(p_job);end;$$;
create or replace function public.marketplace_prepare_checkout(p_active_job_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.guard_checkout(p_active_job_id)$$;
create function korvo_beta_private.simulate(p_job uuid,p_key uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_beta_private.actor();j public.active_jobs%rowtype;s korvo_beta_private.simulations%rowtype;q bigint;f bigint;begin
 if p_key is null then raise exception 'Simulation request required';end if;select * into strict j from public.active_jobs where id=p_job for update;
 if j.customer_id is distinct from uid or j.status<>'active' or not exists(select 1 from korvo_beta_private.seats where user_id=uid and role='customer') then raise exception 'Active customer job required' using errcode='42501';end if;
 q:=round(j.amount*100);if q<1 or q>89285713 or j.amount*100<>q then raise exception 'Invalid agreed amount';end if;f:=floor((q*12+50)/100.0);
 if not korvo_beta_private.ready(j.professional_id,'professional') or not exists(select 1 from public.jobs p where p.id=j.job_id and p.customer_id=uid and korvo_beta_private.visible(p.category,p.city)) then raise exception 'Current admitted professional and allowed source job required' using errcode='42501';end if;
 select * into s from korvo_beta_private.simulations where request_key=p_key;
 if found and (s.active_job_id<>p_job or s.customer_id<>uid) then raise exception 'Simulation key conflict';end if;
 if not found then insert into korvo_beta_private.simulations(active_job_id,customer_id,request_key,professional_gross_cents,fee_cents,total_cents) values(p_job,uid,p_key,q,f,q+f) on conflict(active_job_id) do nothing;end if;
 select * into strict s from korvo_beta_private.simulations where active_job_id=p_job;
 if s.professional_gross_cents<>q or s.fee_cents<>f then raise exception 'Agreed quote changed; review required';end if;
 return jsonb_build_object('id',s.id,'active_job_id',p_job,'professional_gross_cents',s.professional_gross_cents,'fee_cents',s.fee_cents,'total_cents',s.total_cents,'mode','simulation','paid',false,'provider_verified',false,'release_eligible',false);end;$$;
create function korvo_beta_private.open_support(p_key uuid,p_subject text,p_body text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_beta_private.actor(false);c korvo_beta_private.support_cases%rowtype;begin
 if p_key is null then raise exception 'Support request required';end if;select * into c from korvo_beta_private.support_cases where request_key=p_key;
 if found then if c.user_id<>uid or c.subject<>p_subject or c.body<>p_body then raise exception 'Support key conflict';end if;else insert into korvo_beta_private.support_cases(user_id,request_key,subject,body) values(uid,p_key,p_subject,p_body) returning * into c;end if;
 return jsonb_build_object('id',c.id,'financial_action',false);end;$$;
create function korvo_beta_private.support_queue() returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();staff boolean;begin
 select exists(select 1 from public.platform_admins where user_id=uid and is_active and role in('owner','admin','support')) into staff;
 return coalesce((select jsonb_agg(to_jsonb(c)||jsonb_build_object('replies',(select coalesce(jsonb_agg(to_jsonb(r) order by r.created_at),'[]') from korvo_beta_private.support_replies r where r.case_id=c.id)) order by c.created_at) from (select * from korvo_beta_private.support_cases where user_id=uid or staff order by created_at desc limit 100)c),'[]');end;$$;
create function korvo_beta_private.reply_support(p_case uuid,p_key uuid,p_body text) returns jsonb language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();c korvo_beta_private.support_cases%rowtype;r korvo_beta_private.support_replies%rowtype;begin
 if not korvo_beta_private.enabled() or p_key is null then raise exception 'Support unavailable';end if;
 select * into strict c from korvo_beta_private.support_cases where id=p_case for update;
 if c.user_id<>uid and not exists(select 1 from public.platform_admins where user_id=uid and is_active and role in('owner','admin','support')) then raise exception 'Case participant required' using errcode='42501';end if;
 select * into r from korvo_beta_private.support_replies where request_key=p_key;
 if found then if r.case_id<>p_case or r.actor_id<>uid or r.body<>p_body then raise exception 'Reply key conflict';end if;else insert into korvo_beta_private.support_replies(case_id,actor_id,body,request_key) values(p_case,uid,p_body,p_key) returning * into r;end if;
 return jsonb_build_object('id',r.id,'financial_action',false);end;$$;
create function public.beta_status() returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.status()$$;
create function public.beta_reserve_seat(p_user_id uuid,p_role text,p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.reserve_seat(p_user_id,p_role,p_request_key)$$;
create function public.beta_accept_document(p_document_id uuid,p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.accept_document(p_document_id,p_request_key)$$;
create function public.beta_simulate_payment(p_active_job_id uuid,p_request_key uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.simulate(p_active_job_id,p_request_key)$$;
create function public.beta_open_support(p_request_key uuid,p_subject text,p_body text) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.open_support(p_request_key,p_subject,p_body)$$;
create function public.beta_support_queue() returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.support_queue()$$;
create function public.beta_reply_support(p_case_id uuid,p_request_key uuid,p_body text) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.reply_support(p_case_id,p_request_key,p_body)$$;
revoke all on all functions in schema korvo_beta_private from public,anon,authenticated,service_role;
grant execute on function korvo_beta_private.status(),korvo_beta_private.accept_document(uuid,uuid),korvo_beta_private.simulate(uuid,uuid),korvo_beta_private.open_support(uuid,text,text),korvo_beta_private.support_queue(),korvo_beta_private.reply_support(uuid,uuid,text),korvo_beta_private.guard_checkout(uuid),korvo_beta_private.visible(text,text) to authenticated;
grant execute on function korvo_beta_private.reserve_seat(uuid,text,uuid) to service_role;
revoke all on function public.beta_status(),public.beta_reserve_seat(uuid,text,uuid),public.beta_accept_document(uuid,uuid),public.beta_simulate_payment(uuid,uuid),public.beta_open_support(uuid,text,text),public.beta_support_queue(),public.beta_reply_support(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.beta_status(),public.beta_accept_document(uuid,uuid),public.beta_simulate_payment(uuid,uuid),public.beta_open_support(uuid,text,text),public.beta_support_queue(),public.beta_reply_support(uuid,uuid,text) to authenticated;
grant execute on function public.beta_reserve_seat(uuid,text,uuid) to service_role;
