-- STAGED ONLY. Requires A10. No Stripe calls, execution grant, payout or refund.
-- Depends on administrative_refund_review and existing payment/session guards.
create schema korvo_finance_private;
revoke all on schema korvo_finance_private from public,anon,authenticated,service_role;
grant usage on schema korvo_finance_private to authenticated,service_role;
create table korvo_finance_private.operations (
 id uuid primary key default gen_random_uuid(),
 payment_id uuid not null references public.marketplace_payments(id),
 review_id uuid unique references korvo_refunds_private.reviews(id),
 kind text not null check(kind in('refund','transfer','reversal')),
 idempotency_key text not null unique,
 professional_cents bigint not null check(professional_cents>=0),
 platform_fee_cents bigint not null check(platform_fee_cents>=0),
 amount_cents bigint generated always as(professional_cents+platform_fee_cents) stored,
 currency text not null check(currency='usd'),
 payment_intent_id text not null,
 charge_id text not null,
 state text not null default 'prepared' check(state in('prepared','unknown','pending','succeeded','failed','canceled')),
 provider_id text unique,
 needs_review boolean not null default true,
 created_by uuid not null references public.profiles(id),
 created_at timestamptz not null default now(),
 observed_at timestamptz,
 check(professional_cents+platform_fee_cents>0),
 check((kind='refund')=(review_id is not null)),
 check(kind<>'transfer' or platform_fee_cents=0)
);
create index finance_operations_payment on korvo_finance_private.operations(payment_id);
create index finance_operations_attention on korvo_finance_private.operations(state,created_at) where needs_review;
create table korvo_finance_private.observations (
 id bigint generated always as identity primary key,
 operation_id uuid not null references korvo_finance_private.operations(id),
 receipt_key text not null unique check(length(receipt_key) between 1 and 200),
 provider_id text not null,
 state text not null check(state in('unknown','pending','succeeded','failed','canceled')),
 digest text not null check(digest ~ '^[a-f0-9]{64}$'),
 observed_at timestamptz not null default now()
);
create index finance_observations_operation on korvo_finance_private.observations(operation_id);
alter table korvo_finance_private.operations enable row level security;
alter table korvo_finance_private.observations enable row level security;
create policy backend_only on korvo_finance_private.operations for all to anon,authenticated using(false) with check(false);
create policy backend_only on korvo_finance_private.observations for all to anon,authenticated using(false) with check(false);
revoke all on all tables in schema korvo_finance_private from public,anon,authenticated,service_role;
revoke all on all sequences in schema korvo_finance_private from public,anon,authenticated,service_role;

create function korvo_finance_private.prepare_refund(p_review uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_refunds_private.admin_actor();r korvo_refunds_private.reviews%rowtype;
 p public.marketplace_payments%rowtype;o korvo_finance_private.operations%rowtype;
begin
 select * into strict r from korvo_refunds_private.reviews where id=p_review;
 -- All money-related review operations use payment -> review -> operation lock order.
 select * into strict p from public.marketplace_payments where id=r.payment_id for update;
 select * into strict r from korvo_refunds_private.reviews where id=p_review for update;
 select * into o from korvo_finance_private.operations where review_id=p_review;
 if found then return to_jsonb(o)||jsonb_build_object('execution_enabled',false);end if;
 if r.state<>'recommended' or p.status not in('paid','partially_refunded')
  or p.release_status<>'held' or not p.requires_review
  or p.stripe_payment_intent_id is null or p.stripe_charge_id is null then
  raise exception 'Recommended held provider payment required';end if;
 if p.refunded_total_cents<>p.professional_refunded_cents+p.platform_fee_refunded_cents then
  raise exception 'Unallocated provider refund requires reconciliation';end if;
 if r.professional_cents>p.professional_gross_cents-p.professional_refunded_cents
  or r.platform_fee_cents>p.platform_fee_cents-p.platform_fee_refunded_cents
  or r.professional_cents+r.platform_fee_cents>p.customer_total_cents-p.refunded_total_cents then
  raise exception 'Review exceeds remaining original allocations';end if;
 -- A different unresolved or successful operation must be reconciled before any new one.
 if exists(select 1 from korvo_finance_private.operations where payment_id=p.id) then
  raise exception 'Existing operation requires reconciliation';end if;
 insert into korvo_finance_private.operations(payment_id,review_id,kind,idempotency_key,
 professional_cents,platform_fee_cents,currency,payment_intent_id,charge_id,created_by)
 values(p.id,r.id,'refund','korvo-refund-v1-'||r.id,r.professional_cents,r.platform_fee_cents,
 p.currency,p.stripe_payment_intent_id,p.stripe_charge_id,uid) returning * into o;
 insert into korvo_refunds_private.audit(review_id,actor_id,action,note)
 values(r.id,uid,'ledger_prepared','Nonexecuting refund allocation reserved; provider execution disabled');
 return to_jsonb(o)||jsonb_build_object('execution_enabled',false);
end;$$;

-- Trusted backend only, after validated GET reconciliation. No payment counters,
-- holds or transfer eligibility change. Receipt uniqueness prevents duplicate accounting.
create function korvo_finance_private.observe(p_operation uuid,p_receipt text,p_provider text,p_state text,p_digest text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare o korvo_finance_private.operations%rowtype;e korvo_finance_private.observations%rowtype;
begin
 if p_receipt is null or length(p_receipt) not between 1 and 200 or p_provider is null
  or p_provider !~ '^(re|tr|trr)_[A-Za-z0-9]+$' or p_state is null
  or p_state not in('unknown','pending','succeeded','failed','canceled')
  or p_digest is null or p_digest !~ '^[a-f0-9]{64}$' then raise exception 'Invalid provider observation';end if;
 select * into strict o from korvo_finance_private.operations where id=p_operation for update;
 if (o.kind='refund' and p_provider !~ '^re_') or (o.kind='transfer' and p_provider !~ '^tr_')
  or (o.kind='reversal' and p_provider !~ '^trr_') then raise exception 'Provider object kind mismatch';end if;
 if o.provider_id is not null and o.provider_id<>p_provider then raise exception 'Provider identity conflict';end if;
 select * into e from korvo_finance_private.observations where receipt_key=p_receipt;
 if found then
  if e.operation_id<>p_operation or e.provider_id<>p_provider or e.state<>p_state or e.digest<>p_digest then
   raise exception 'Observation receipt conflict';end if;
  return to_jsonb(o)||jsonb_build_object('execution_enabled',false);
 end if;
 insert into korvo_finance_private.observations(operation_id,receipt_key,provider_id,state,digest)
 values(o.id,p_receipt,p_provider,p_state,p_digest);
 -- Terminal success/failure cannot be overwritten by a late pending event or opposite outcome.
 update korvo_finance_private.operations set provider_id=p_provider,observed_at=now(),needs_review=true,
 state=case when state in('succeeded','failed','canceled') then state else p_state end where id=o.id returning * into o;
 return to_jsonb(o)||jsonb_build_object('execution_enabled',false);
end;$$;

create function korvo_finance_private.queue() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform korvo_refunds_private.admin_actor();
 return coalesce((select jsonb_agg(to_jsonb(q)) from (
 select o.*,extract(epoch from(now()-o.created_at))::bigint age_seconds,
 case when o.state='unknown' then 'ambiguous_provider_outcome'
 when o.state in('prepared','pending') and o.created_at<now()-interval '24 hours' then 'stuck_operation'
 when o.state in('succeeded','failed','canceled') then 'allocation_and_terminal_review'
 else 'awaiting_provider_reconciliation' end attention_reason
 from korvo_finance_private.operations o where needs_review order by o.created_at,o.id limit 100) q),'[]');
end;$$;
create function public.admin_prepare_refund_ledger(p_review_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.prepare_refund(p_review_id)$$;
create function public.admin_financial_operation_queue() returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.queue()$$;
create function public.finance_record_observation(p_operation uuid,p_receipt text,p_provider text,p_state text,p_digest text) returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.observe(p_operation,p_receipt,p_provider,p_state,p_digest)$$;
revoke all on all functions in schema korvo_finance_private from public,anon,authenticated,service_role;
grant execute on function korvo_finance_private.prepare_refund(uuid),korvo_finance_private.queue() to authenticated;
grant execute on function korvo_finance_private.observe(uuid,text,text,text,text) to service_role;
revoke all on function public.admin_prepare_refund_ledger(uuid),public.admin_financial_operation_queue(),public.finance_record_observation(uuid,text,text,text,text) from public,anon,authenticated,service_role;
grant execute on function public.admin_prepare_refund_ledger(uuid),public.admin_financial_operation_queue() to authenticated;
grant execute on function public.finance_record_observation(uuid,text,text,text,text) to service_role;
-- No transfer/reversal creation API, dispatch claim, executor or automatic retry exists.
notify pgrst,'reload schema';
