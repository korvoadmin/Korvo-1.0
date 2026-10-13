-- Additive sandbox payment foundation. Does not alter existing booking payments.
-- Authoritative pricing: quote + 12% customer fee; professional gross = full quote.
create schema if not exists korvo_payments_private;
revoke all on schema korvo_payments_private from public,anon,authenticated;
grant usage on schema korvo_payments_private to authenticated,service_role;

create table public.marketplace_payments (
 id uuid primary key default gen_random_uuid(),
 active_job_id uuid not null unique references public.active_jobs(id),
 customer_id uuid not null references public.profiles(id),
 professional_id uuid not null references public.profiles(id),
 pricing_version text not null default 'quote_plus_12_percent_v1'
  check(pricing_version='quote_plus_12_percent_v1'),
 currency text not null default 'usd' check(currency='usd'),
 quote_cents bigint not null check(quote_cents>0),
 professional_gross_cents bigint not null,
 platform_fee_cents bigint not null,
 customer_total_cents bigint not null check(customer_total_cents<=99999999),
 status text not null default 'awaiting_payment' check(status in
  ('awaiting_payment','processing','paid','failed','partially_refunded','refunded','disputed')),
 checkout_token uuid not null default gen_random_uuid(),
 checkout_started_at timestamptz not null default now(),
 stripe_checkout_id text unique,
 stripe_payment_intent_id text unique,
 stripe_charge_id text unique,
 refunded_total_cents bigint not null default 0 check(refunded_total_cents>=0),
 professional_refunded_cents bigint not null default 0 check(professional_refunded_cents>=0),
 platform_fee_refunded_cents bigint not null default 0 check(platform_fee_refunded_cents>=0),
 release_status text not null default 'held' check(release_status in('held','processing','released','reversed')),
 requires_review boolean not null default false,
 created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 check(professional_gross_cents=quote_cents),
 check(platform_fee_cents=floor((quote_cents*12+50)/100)),
 check(customer_total_cents=quote_cents+platform_fee_cents),
 check(refunded_total_cents<=customer_total_cents),
 check(professional_refunded_cents<=professional_gross_cents),
 check(platform_fee_refunded_cents<=platform_fee_cents)
);
create index marketplace_payments_customer on public.marketplace_payments(customer_id);
create index marketplace_payments_professional on public.marketplace_payments(professional_id);
create table public.stripe_event_receipts (
 id text primary key,event_type text not null,processed_at timestamptz,
 received_at timestamptz not null default now()
);
create table public.stripe_connect_provisions (
 professional_id uuid primary key references public.profiles(id),
 token uuid not null unique default gen_random_uuid(),created_at timestamptz not null default now()
);
alter table public.professional_stripe_accounts add column if not exists status_checked_at timestamptz;
alter table public.marketplace_payments enable row level security;
alter table public.stripe_event_receipts enable row level security;
alter table public.stripe_connect_provisions enable row level security;
revoke all on public.marketplace_payments,public.stripe_event_receipts,public.stripe_connect_provisions
 from public,anon,authenticated,service_role;
grant select on public.marketplace_payments to service_role;
grant select,insert on public.stripe_connect_provisions to service_role;
create policy marketplace_backend_only on public.marketplace_payments as restrictive for all
 to anon,authenticated using(false) with check(false);
create policy events_backend_only on public.stripe_event_receipts as restrictive for all
 to anon,authenticated using(false) with check(false);
create policy provisions_backend_only on public.stripe_connect_provisions as restrictive for all
 to anon,authenticated using(false) with check(false);

create function korvo_payments_private.actor() returns uuid language plpgsql security definer
set search_path='' as $$
declare uid uuid:=auth.uid();sid text:=auth.jwt()->>'session_id';
begin
 if uid is null or sid is null or not exists(select 1 from auth.sessions s where s.id::text=sid and s.user_id=uid and (s.not_after is null or s.not_after>now()))
  or not exists(select 1 from public.profiles p join auth.users u on u.id=p.id where p.id=uid and p.is_active) then
  raise exception 'Authentication required' using errcode='42501';
 end if;
 return uid;
end; $$;
revoke all on function korvo_payments_private.actor() from public,anon,authenticated,service_role;

create function korvo_payments_private.prepare_checkout(p_active_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();j public.active_jobs%rowtype;p public.marketplace_payments%rowtype;q bigint;f bigint;
begin
 select * into j from public.active_jobs where id=p_active_job_id for update;
 if not found or j.customer_id<>uid then raise exception 'Job access denied' using errcode='42501';end if;
 select * into p from public.marketplace_payments where active_job_id=j.id for update;
 if found then
  if j.status<>'active' and p.status in('awaiting_payment','processing','failed') then raise exception 'Job is not payable';end if;
  return to_jsonb(p);
 end if;
 if j.status<>'active' then raise exception 'Job is not payable';end if;
 if not exists(select 1 from public.quotes q where q.id=j.quote_id and q.status='accepted'
  and q.customer_id=j.customer_id and q.professional_id=j.professional_id and q.amount=j.amount) then
  raise exception 'Accepted quote does not match booking';end if;
 if not exists(select 1 from public.profiles where id=uid and account_type='customer')
 or not exists(select 1 from public.profiles where id=j.professional_id and account_type='professional' and is_active) then
  raise exception 'Account is not eligible' using errcode='42501';end if;
 if j.amount<>round(j.amount,2) then raise exception 'Fractional cents are not allowed';end if;
 q:=(j.amount*100)::bigint;f:=floor((q*12+50)/100);
 if q<=0 or q+f>99999999 then raise exception 'Invalid quote amount';end if;
 insert into public.marketplace_payments(active_job_id,customer_id,professional_id,quote_cents,
  professional_gross_cents,platform_fee_cents,customer_total_cents)
 values(j.id,j.customer_id,j.professional_id,q,q,f,q+f) returning * into p;
 return to_jsonb(p);
end; $$;
create function public.marketplace_prepare_checkout(p_active_job_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select korvo_payments_private.prepare_checkout(p_active_job_id)$$;
revoke all on function public.marketplace_prepare_checkout(uuid),korvo_payments_private.prepare_checkout(uuid) from public,anon,authenticated,service_role;
grant execute on function public.marketplace_prepare_checkout(uuid),korvo_payments_private.prepare_checkout(uuid) to authenticated;

create function korvo_payments_private.summary(p_active_job_id uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();j public.active_jobs%rowtype;p public.marketplace_payments%rowtype;
begin
 select * into j from public.active_jobs where id=p_active_job_id;
 if not found or uid not in(j.customer_id,j.professional_id) then raise exception 'Job access denied' using errcode='42501';end if;
 select * into p from public.marketplace_payments where active_job_id=j.id;
 if not found then return jsonb_build_object('status','not_started');end if;
 return jsonb_build_object('id',p.id,'pricing_version',p.pricing_version,'currency',p.currency,
  'quote_cents',p.quote_cents,'professional_gross_cents',p.professional_gross_cents,
  'platform_fee_cents',p.platform_fee_cents,'customer_total_cents',p.customer_total_cents,
  'status',p.status,'release_status',p.release_status,'refunded_total_cents',p.refunded_total_cents,'requires_review',p.requires_review);
end; $$;
create function public.marketplace_payment_summary(p_active_job_id uuid) returns jsonb
language sql security invoker set search_path='' as $$select korvo_payments_private.summary(p_active_job_id)$$;
revoke all on function public.marketplace_payment_summary(uuid),korvo_payments_private.summary(uuid) from public,anon,authenticated,service_role;
grant execute on function public.marketplace_payment_summary(uuid),korvo_payments_private.summary(uuid) to authenticated;

create function korvo_payments_private.save_checkout(p_id uuid,p_token uuid,p_session text) returns void
language plpgsql security definer set search_path='' as $$
begin
 update public.marketplace_payments set stripe_checkout_id=p_session,updated_at=now()
 where id=p_id and checkout_token=p_token and (stripe_checkout_id is null or stripe_checkout_id=p_session);
 if not found then raise exception 'Checkout mapping conflict';end if;
end; $$;
create function public.marketplace_save_checkout(p_id uuid,p_token uuid,p_session text) returns void
language sql security invoker set search_path='' as $$select korvo_payments_private.save_checkout(p_id,p_token,p_session)$$;
revoke all on function public.marketplace_save_checkout(uuid,uuid,text),korvo_payments_private.save_checkout(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function public.marketplace_save_checkout(uuid,uuid,text),korvo_payments_private.save_checkout(uuid,uuid,text) to service_role;

-- Snapshot and receipt commit together. A failed update rolls back the receipt too.
create function korvo_payments_private.apply_event(p_event_id text,p_type text,p_snapshot jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.marketplace_payments%rowtype;s text;refunded bigint;checked timestamptz;j public.active_jobs%rowtype;
begin
 if p_event_id is null or length(p_event_id)>255 or (p_snapshot->>'livemode') is distinct from 'false' then raise exception 'Invalid sandbox event';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_event_id,0));
 if exists(select 1 from public.stripe_event_receipts where id=p_event_id and processed_at is not null) then
  return jsonb_build_object('duplicate',true);end if;
 insert into public.stripe_event_receipts(id,event_type) values(p_event_id,p_type) on conflict(id) do nothing;
 if p_snapshot->>'kind'='connect' then
  checked:=(p_snapshot->>'checked_at')::timestamptz;
  if checked is null or checked>now()+interval '1 minute' then raise exception 'Invalid status check timestamp';end if;
  s:=p_snapshot->>'onboarding_status';
  if s is null or s not in('pending','in_progress','complete','restricted') then raise exception 'Invalid onboarding status';end if;
  if s='complete' and ((p_snapshot->>'details_submitted') is distinct from 'true' or (p_snapshot->>'payouts_enabled') is distinct from 'true' or (p_snapshot->>'transfers_active') is distinct from 'true') then
   raise exception 'Incomplete onboarding';end if;
  update public.professional_stripe_accounts set onboarding_status=s,
   details_submitted=(p_snapshot->>'details_submitted')::boolean,
   charges_enabled=(p_snapshot->>'charges_enabled')::boolean,
   payouts_enabled=(p_snapshot->>'payouts_enabled')::boolean,status_checked_at=checked,updated_at=now()
  where stripe_account_id=p_snapshot->>'account_id' and professional_id=(p_snapshot->>'professional_id')::uuid
   and (status_checked_at is null or status_checked_at<=checked);
 elsif p_snapshot->>'kind'='checkout_expired' then
  select * into p from public.marketplace_payments where id=(p_snapshot->>'payment_id')::uuid for update;
  if not found or p.checkout_token::text is distinct from p_snapshot->>'checkout_token' then raise exception 'Checkout identity mismatch';end if;
  if p.stripe_checkout_id is not null and p.stripe_checkout_id is distinct from p_snapshot->>'session_id' then raise exception 'Checkout session mismatch';end if;
  if p.status in('awaiting_payment','processing','failed') then
   update public.marketplace_payments set stripe_checkout_id=null,checkout_token=gen_random_uuid(),checkout_started_at=now(),
    status='awaiting_payment',stripe_payment_intent_id=null,updated_at=now() where id=p.id;
  end if;
 elsif p_snapshot->>'kind'='payment' then
  select * into p from public.marketplace_payments where id=(p_snapshot->>'payment_id')::uuid for update;
  if not found or p.checkout_token::text is distinct from p_snapshot->>'checkout_token'
   or p.customer_total_cents is distinct from (p_snapshot->>'amount')::bigint or p.currency is distinct from p_snapshot->>'currency' then
   raise exception 'Payment identity or amount mismatch';end if;
  if p.stripe_payment_intent_id is not null and p.stripe_payment_intent_id<>p_snapshot->>'payment_intent_id' then
   raise exception 'Payment intent conflict';end if;
  if p_snapshot->>'payment_intent_id' is null then raise exception 'Missing payment intent';end if;
  refunded:=(p_snapshot->>'refunded_cents')::bigint;
  if refunded is null or refunded<0 or refunded>p.customer_total_cents then raise exception 'Invalid refund total';end if;
  -- Never regress paid/refunded/disputed records because a stale failed event arrived.
  if p_snapshot->>'paid'='true' then
   if (p_snapshot->>'amount_received')::bigint is distinct from p.customer_total_cents or p_snapshot->>'charge_id' is null then
    raise exception 'Payment not fully received';end if;
   s:=case when p_snapshot->>'disputed'='true' then 'disputed'
    when greatest(refunded,p.refunded_total_cents)=p.customer_total_cents then 'refunded'
    when greatest(refunded,p.refunded_total_cents)>0 then 'partially_refunded' else 'paid' end;
   update public.marketplace_payments set status=s,stripe_payment_intent_id=p_snapshot->>'payment_intent_id',
    stripe_charge_id=p_snapshot->>'charge_id',refunded_total_cents=greatest(refunded,refunded_total_cents),
    requires_review=requires_review or s in('refunded','partially_refunded','disputed')
     or exists(select 1 from public.active_jobs where id=p.active_job_id and status='cancelled'),updated_at=now() where id=p.id;
  elsif p.status in('awaiting_payment','processing','failed') then
   update public.marketplace_payments set status=case when p_snapshot->>'failed'='true' then 'failed' else 'processing' end,
    stripe_payment_intent_id=p_snapshot->>'payment_intent_id',updated_at=now() where id=p.id;
  end if;
  select * into j from public.active_jobs where id=p.active_job_id;
  select status into s from public.marketplace_payments where id=p.id;
  if s is distinct from p.status and s in('paid','failed','refunded','partially_refunded','disputed') then
   insert into public.notifications(user_id,type,title,body,job_id,quote_id,active_job_id)
    select recipient,case when s='paid' then 'booking_fee_paid' when s='failed' then 'payment_failed'
     when s='disputed' then 'payment_disputed' else 'payment_refunded' end,
     case when s='paid' then 'Job Payment Received' else 'Job Payment Updated' end,
     case when s='paid' then 'The professional service price and Korvo platform fee were paid. Professional funds remain held until completion and release checks.'
      else 'The job payment status changed. Review the payment summary or contact Korvo support.' end,
     j.job_id,j.quote_id,j.id from unnest(array[p.customer_id,p.professional_id]) recipient;
  end if;
 elsif (p_snapshot->>'kind') is distinct from 'ignored' then raise exception 'Unsupported event';end if;
 update public.stripe_event_receipts set processed_at=now() where id=p_event_id;
 return jsonb_build_object('processed',true);
end; $$;
create function public.marketplace_apply_event(p_event_id text,p_type text,p_snapshot jsonb) returns jsonb
language sql security invoker set search_path='' as $$select korvo_payments_private.apply_event(p_event_id,p_type,p_snapshot)$$;
revoke all on function public.marketplace_apply_event(text,text,jsonb),korvo_payments_private.apply_event(text,text,jsonb) from public,anon,authenticated,service_role;
grant execute on function public.marketplace_apply_event(text,text,jsonb),korvo_payments_private.apply_event(text,text,jsonb) to service_role;
notify pgrst,'reload schema';

CREATE OR REPLACE FUNCTION korvo_payments_private.contact_details(p_active_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_active_job public.active_jobs%rowtype;
      v_paid boolean := false;
      v_other public.profiles%rowtype;
      v_role text;
    begin
      perform korvo_payments_private.actor();
      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where id = p_active_job_id;

      if not found then
        raise exception 'Active job not found';
      end if;

      if auth.uid() <> v_active_job.customer_id
         and auth.uid() <> v_active_job.professional_id then
        raise exception 'You cannot access this booking';
      end if;

      if v_active_job.status = 'cancelled' then
        raise exception 'Contact details are unavailable for cancelled bookings';
      end if;

      select exists (
        select 1
        from public.marketplace_payments bp
        where bp.active_job_id = v_active_job.id
          and bp.status = 'paid' and not bp.requires_review
      )
      into v_paid;

      if not v_paid then
        raise exception 'Contact details are locked until required payment is completed';
      end if;

      if auth.uid() = v_active_job.customer_id then
        v_role := 'professional';

        select *
        into v_other
        from public.profiles
        where id = v_active_job.professional_id;
      else
        v_role := 'customer';

        select *
        into v_other
        from public.profiles
        where id = v_active_job.customer_id;
      end if;

      if not found then
        raise exception 'Booking participant profile not found';
      end if;

      return jsonb_build_object(
        'active_job_id', v_active_job.id,
        'job_id', v_active_job.job_id,
        'role', v_role,
        'first_name', v_other.first_name,
        'last_name', v_other.last_name,
        'phone', v_other.phone,
        'email', v_other.email
      );
    end;
    $function$
;
create or replace function public.get_booking_contact_details(p_active_job_id uuid) returns jsonb
language sql security invoker set search_path='' as $$ select korvo_payments_private.contact_details(p_active_job_id) $$;
revoke all on function public.get_booking_contact_details(uuid),korvo_payments_private.contact_details(uuid) from public,anon,authenticated,service_role;
grant execute on function public.get_booking_contact_details(uuid),korvo_payments_private.contact_details(uuid) to authenticated;

-- Signing secrets stay in encrypted Vault; only the server role can read these two names.
create function korvo_payments_private.webhook_secrets() returns text[] language sql security definer set search_path='' as $$
select coalesce(array_agg(decrypted_secret),array[]::text[]) from vault.decrypted_secrets
where name in ('korvo_sandbox_payment_webhook','korvo_sandbox_connect_webhook');$$;
create function public.marketplace_webhook_secrets() returns text[] language sql security invoker set search_path='' as $$
select korvo_payments_private.webhook_secrets();$$;
revoke all on function public.marketplace_webhook_secrets(),korvo_payments_private.webhook_secrets() from public,anon,authenticated,service_role;
grant execute on function public.marketplace_webhook_secrets(),korvo_payments_private.webhook_secrets() to service_role;
-- Superseded fee-only preparation cannot create new customer-visible booking records.
revoke all on function public.prepare_booking_payment(uuid) from public,anon,authenticated;
alter function public.prepare_booking_payment(uuid) set search_path='';
