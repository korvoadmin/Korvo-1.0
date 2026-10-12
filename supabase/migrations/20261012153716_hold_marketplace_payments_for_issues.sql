-- Sandbox marketplace payment-state safeguard only. No grants, RLS policies,
-- customer/professional authorization, allocation, refunds or transfers are changed.
-- Existing unresolved holds are never cleared automatically.
set lock_timeout='5s';
create function korvo_payments_private.hold_on_job_issue() returns trigger
language plpgsql security definer set search_path='' as $$
declare target uuid;
begin
 if tg_table_name='active_jobs' then target:=new.id;else target:=new.active_job_id;end if;
 if (tg_table_name='active_jobs' and new.status in('cancelled','disputed'))
    or (tg_table_name='project_issues' and new.status in('open','under_review')) then
  update public.marketplace_payments set requires_review=true,updated_at=now()
  where active_job_id=target
    and status in('paid','partially_refunded','refunded','disputed') and requires_review=false;
 end if;
 return new;
end; $$;
revoke all on function korvo_payments_private.hold_on_job_issue() from public,anon,authenticated,service_role;
create trigger marketplace_hold_on_job_status after update of status on public.active_jobs
for each row execute function korvo_payments_private.hold_on_job_issue();
create trigger marketplace_hold_on_project_issue after insert or update of status on public.project_issues
for each row execute function korvo_payments_private.hold_on_job_issue();
create or replace function korvo_payments_private.apply_event(p_event_id text,p_type text,p_snapshot jsonb) returns jsonb
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
     or exists(select 1 from public.active_jobs where id=p.active_job_id and status in('cancelled','disputed'))
     or exists(select 1 from public.project_issues where active_job_id=p.active_job_id and status in('open','under_review')),updated_at=now() where id=p.id;
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

update public.marketplace_payments p set requires_review=true,updated_at=now()
where status in('paid','partially_refunded','refunded','disputed') and requires_review=false
 and (exists(select 1 from public.active_jobs a where a.id=p.active_job_id and a.status in('cancelled','disputed'))
  or exists(select 1 from public.project_issues i where i.active_job_id=p.active_job_id and i.status in('open','under_review')));
