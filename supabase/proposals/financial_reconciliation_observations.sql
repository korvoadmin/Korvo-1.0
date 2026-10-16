-- STAGED / A10 REQUIRED. Observations and explicitly reviewed full-refund component
-- accounting only. Never moves money, changes original prices or clears holds.
-- Dependency: financial_operation_ledger.sql and existing session-checked admin_actor.
create table korvo_finance_private.reconciliation_reports (
 id uuid primary key default gen_random_uuid(),
 payment_id uuid not null references public.marketplace_payments(id),
 revision text not null,
 facts jsonb not null,
 fingerprint text not null,
 created_at timestamptz not null default now(),
 unique(payment_id,revision,fingerprint)
);
create table korvo_finance_private.reconciliation_checks (
 request_key uuid primary key,
 report_id uuid not null references korvo_finance_private.reconciliation_reports(id),
 actor_id uuid not null references public.profiles(id),
 checked_at timestamptz not null default now()
);
create index reconciliation_checks_report_time on korvo_finance_private.reconciliation_checks(report_id,checked_at desc);
create index reconciliation_checks_actor on korvo_finance_private.reconciliation_checks(actor_id);
create table korvo_finance_private.allocation_corrections (
 id uuid primary key default gen_random_uuid(),request_key uuid not null unique,
 payment_id uuid not null unique references public.marketplace_payments(id),
 report_id uuid not null references korvo_finance_private.reconciliation_reports(id),
 actor_id uuid not null references public.profiles(id),
 professional_delta_cents bigint not null check(professional_delta_cents>=0),
 fee_delta_cents bigint not null check(fee_delta_cents>=0),
 reason text not null check(length(btrim(reason)) between 10 and 2000),created_at timestamptz not null default now()
);
create index allocation_correction_report on korvo_finance_private.allocation_corrections(report_id);
create index allocation_correction_actor on korvo_finance_private.allocation_corrections(actor_id);
alter table korvo_finance_private.allocation_corrections enable row level security;
create policy backend_only on korvo_finance_private.allocation_corrections for all to anon,authenticated using(false) with check(false);
revoke all on korvo_finance_private.allocation_corrections from public,anon,authenticated,service_role;
alter table korvo_finance_private.reconciliation_reports enable row level security;
alter table korvo_finance_private.reconciliation_checks enable row level security;
create policy backend_only on korvo_finance_private.reconciliation_reports for all to anon,authenticated using(false) with check(false);
create policy backend_only on korvo_finance_private.reconciliation_checks for all to anon,authenticated using(false) with check(false);
revoke all on korvo_finance_private.reconciliation_reports,korvo_finance_private.reconciliation_checks from public,anon,authenticated,service_role;

create function korvo_finance_private.reconciliation_target(p_payment uuid) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_refunds_private.admin_actor();p public.marketplace_payments%rowtype;
begin
 select * into strict p from public.marketplace_payments where id=p_payment;
 return jsonb_build_object('payment',to_jsonb(p),'revision',md5(to_jsonb(p)::text),'actor_id',uid);
end;$$;

create function korvo_finance_private.record_reconciliation(p_payment uuid,p_actor uuid,p_key uuid,p_revision text,p_facts jsonb) returns jsonb
language plpgsql security definer set search_path='' as $$
declare p public.marketplace_payments%rowtype;r korvo_finance_private.reconciliation_reports%rowtype;
 c korvo_finance_private.reconciliation_checks%rowtype;f text;k text;v jsonb;
 allowed text[]:=array['version','sandbox','state','provider_status','source_matches','gross_cents','captured_cents','refunded_cents','pending_refund_cents','transferred_cents','reversed_cents','disputed','refunds_complete','transfers_complete','full_refund_professional_cents','full_refund_fee_cents','findings'];
begin
 -- Recheck authoritative standing after provider requests, including revocation races.
 if not exists(select 1 from public.platform_admins a join public.profiles u on u.id=a.user_id
  where a.user_id=p_actor and a.is_active and u.is_active and a.role in('owner','admin')) then
  raise exception 'Active financial administrator required' using errcode='42501';end if;
 if p_key is null or p_revision is null or p_revision !~ '^[a-f0-9]{32}$' then raise exception 'Invalid observation identity';end if;
 select * into strict p from public.marketplace_payments where id=p_payment for update;
 select * into c from korvo_finance_private.reconciliation_checks where request_key=p_key;
 if found then
  select * into strict r from korvo_finance_private.reconciliation_reports where id=c.report_id;
  if r.payment_id<>p_payment or c.actor_id<>p_actor then raise exception 'Reconciliation key conflict';end if;
  return jsonb_build_object('report_id',r.id,'checked_at',c.checked_at,'state',r.facts->>'state','execution_enabled',false);
 end if;
 if md5(to_jsonb(p)::text)<>p_revision then raise exception 'Payment changed during provider read; reconcile again';end if;
 if p_facts is null or jsonb_typeof(p_facts)<>'object' or pg_column_size(p_facts)>16384 then raise exception 'Invalid normalized observation';end if;
 if (select count(*) from jsonb_object_keys(p_facts))<>cardinality(allowed) or not p_facts ?& allowed
  or p_facts->'version'<>'1'::jsonb or p_facts->'sandbox'<>'true'::jsonb
  or jsonb_typeof(p_facts->'state')<>'string' or p_facts->>'state' not in('consistent','needs_review','provider_unavailable') then raise exception 'Invalid normalized observation';end if;
 foreach k in array array['source_matches','refunds_complete','transfers_complete'] loop
  if jsonb_typeof(p_facts->k)<>'boolean' then raise exception 'Invalid observation boolean';end if;
 end loop;
 if jsonb_typeof(p_facts->'disputed') not in('boolean','null') then raise exception 'Invalid dispute observation';end if;
 if jsonb_typeof(p_facts->'provider_status')<>'null' and p_facts->>'provider_status' not in
 ('requires_payment_method','requires_confirmation','requires_action','processing','requires_capture','canceled','succeeded') then raise exception 'Invalid provider state';end if;
 foreach k in array array['gross_cents','captured_cents','refunded_cents','pending_refund_cents','transferred_cents','reversed_cents','full_refund_professional_cents','full_refund_fee_cents'] loop
  v:=p_facts->k;
  if jsonb_typeof(v)<>'null' and (jsonb_typeof(v)<>'number' or v::text !~ '^[0-9]+$' or (v::text)::numeric>99999999) then raise exception 'Invalid observed amount';end if;
 end loop;
 if jsonb_typeof(p_facts->'findings')<>'array' or jsonb_array_length(p_facts->'findings')>25 then raise exception 'Invalid findings';end if;
 for v in select value from jsonb_array_elements(p_facts->'findings') loop
  if jsonb_typeof(v)<>'string' or (v#>>'{}') not in(
   'MISSING_PROVIDER_REFERENCE','PAYMENT_SOURCE_MISMATCH','INVALID_PROVIDER_AMOUNTS','CAPTURE_AMOUNT_MISMATCH','CHARGE_SOURCE_MISMATCH','MISSING_PAID_CHARGE',
   'PROVIDER_DISPUTE','REFUND_SOURCE_MISMATCH','PROVIDER_REFUND_TOTAL_MISMATCH','DATABASE_REFUND_TOTAL_MISMATCH','PENDING_PROVIDER_REFUND',
   'UNALLOCATED_DATABASE_REFUND','TRANSFER_SOURCE_MISMATCH','TRANSFER_EXCEEDS_PROFESSIONAL_GROSS','UNEXPECTED_TRANSFER_ON_HELD_PAYMENT',
   'AMBIGUOUS_DATABASE_RELEASE','DATABASE_REVIEW_HOLD','DATABASE_PAYMENT_STATE_MISMATCH','INVALID_PROVIDER_PAGE',
   'DUPLICATE_PROVIDER_OBJECT','INCOMPLETE_PROVIDER_SCAN','PROVIDER_UNAVAILABLE') then raise exception 'Unsupported finding';end if;
 end loop;
 if p_facts->>'state'='consistent' and (p_facts->'findings'<>'[]'::jsonb or p_facts->'source_matches'<>'true'::jsonb
  or p_facts->'transfers_complete'<>'true'::jsonb or p.requires_review or p.status='disputed' or p.release_status='processing'
  or p.refunded_total_cents<>p.professional_refunded_cents+p.platform_fee_refunded_cents) then raise exception 'Incomplete or held facts cannot be consistent';end if;
 if (p_facts->'full_refund_professional_cents'='null'::jsonb)<>(p_facts->'full_refund_fee_cents'='null'::jsonb) then raise exception 'Incomplete aggregate allocation';end if;
 if p_facts->'full_refund_professional_cents'<>'null'::jsonb and
  (p_facts->'refunded_cents'='null'::jsonb or (p_facts->>'full_refund_professional_cents')::bigint<>p.professional_gross_cents or (p_facts->>'full_refund_fee_cents')::bigint<>p.platform_fee_cents
  or (p_facts->>'refunded_cents')::bigint<>p.customer_total_cents or p_facts->'refunds_complete'<>'true'::jsonb) then raise exception 'Aggregate allocation mismatch';end if;
 f:=encode(sha256(convert_to(p_facts::text,'UTF8')),'hex'); -- Content identity; service grants are the trust boundary.
 insert into korvo_finance_private.reconciliation_reports(payment_id,revision,facts,fingerprint) values(p.id,p_revision,p_facts,f)
 on conflict(payment_id,revision,fingerprint) do nothing;
 select * into strict r from korvo_finance_private.reconciliation_reports where payment_id=p.id and revision=p_revision and fingerprint=f;
 insert into korvo_finance_private.reconciliation_checks(request_key,report_id,actor_id) values(p_key,r.id,p_actor) returning * into c;
 return jsonb_build_object('report_id',r.id,'checked_at',c.checked_at,'state',p_facts->>'state','execution_enabled',false);
end;$$;

create function korvo_finance_private.reconciliation_queue() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform korvo_refunds_private.admin_actor();
 return coalesce((select jsonb_agg(to_jsonb(q)) from (
  select p.id payment_id,p.status,p.release_status,p.requires_review,p.professional_gross_cents,p.platform_fee_cents,p.customer_total_cents,
   p.refunded_total_cents,p.professional_refunded_cents,p.platform_fee_refunded_cents,x.report_id,x.facts,x.checked_at,case when x.report_id is null then 'never_checked'
    when x.revision<>md5(to_jsonb(p)::text) then 'payment_changed'
    when x.checked_at<now()-interval '15 minutes' then 'stale_provider_check' else x.facts->>'state' end attention_reason
  from public.marketplace_payments p left join lateral (
   select r.id report_id,r.revision,r.facts,c.checked_at from korvo_finance_private.reconciliation_reports r
   join korvo_finance_private.reconciliation_checks c on c.report_id=r.id where r.payment_id=p.id
   order by c.checked_at desc,c.request_key desc limit 1
  ) x on true order by p.requires_review desc,p.created_at,p.id limit 100) q),'[]');
end;$$;
-- Explicit, audited INTERNAL accounting correction of a PROVEN full refund only.
-- No partial split, new provider refund, hold clearance or transfer is authorized.
create function korvo_finance_private.apply_full_refund(p_report uuid,p_key uuid,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_refunds_private.admin_actor();r korvo_finance_private.reconciliation_reports%rowtype;
 p public.marketplace_payments%rowtype;e korvo_finance_private.allocation_corrections%rowtype;checked timestamptz;
begin
 if p_key is null or p_reason is null or length(btrim(p_reason)) not between 10 and 2000 then raise exception 'Reasoned accounting request required';end if;
 select * into strict r from korvo_finance_private.reconciliation_reports where id=p_report;
 select * into strict p from public.marketplace_payments where id=r.payment_id for update;
 select * into e from korvo_finance_private.allocation_corrections where request_key=p_key;
 if found then
  if e.payment_id<>p.id or e.report_id<>r.id or e.reason<>p_reason or e.actor_id<>uid then raise exception 'Accounting request key conflict';end if;
  return jsonb_build_object('id',e.id,'state','allocation_recorded','execution_enabled',false);
 end if;
 if exists(select 1 from korvo_finance_private.allocation_corrections where payment_id=p.id) then raise exception 'Full-refund accounting already recorded';end if;
 select max(checked_at) into checked from korvo_finance_private.reconciliation_checks where report_id=r.id;
 if checked is null or checked<now()-interval '15 minutes' or checked>now() or r.revision<>md5(to_jsonb(p)::text) then raise exception 'Fresh current provider reconciliation required';end if;
 if p.status<>'refunded' or p.release_status<>'held' or not p.requires_review or p.refunded_total_cents<>p.customer_total_cents
  or p.professional_refunded_cents+p.platform_fee_refunded_cents=p.refunded_total_cents then raise exception 'Unallocated full-refund held payment required';end if;
 if not (r.facts @> jsonb_build_object('sandbox',true,'source_matches',true,'provider_status','succeeded','refunds_complete',true,'transfers_complete',true,'disputed',false,
  'gross_cents',p.customer_total_cents,'captured_cents',p.customer_total_cents,'refunded_cents',p.customer_total_cents,'pending_refund_cents',0,
  'transferred_cents',0,'reversed_cents',0,'full_refund_professional_cents',p.professional_gross_cents,'full_refund_fee_cents',p.platform_fee_cents))
  or exists(select 1 from jsonb_array_elements_text(r.facts->'findings') v where v not in('DATABASE_REVIEW_HOLD','UNALLOCATED_DATABASE_REFUND')) then raise exception 'Full-refund provider proof required';end if;
 insert into korvo_finance_private.allocation_corrections(request_key,payment_id,report_id,actor_id,professional_delta_cents,fee_delta_cents,reason)
 values(p_key,p.id,r.id,uid,p.professional_gross_cents-p.professional_refunded_cents,p.platform_fee_cents-p.platform_fee_refunded_cents,p_reason) returning * into e;
 update public.marketplace_payments set professional_refunded_cents=professional_gross_cents,platform_fee_refunded_cents=platform_fee_cents,updated_at=now() where id=p.id;
 return jsonb_build_object('id',e.id,'state','allocation_recorded','execution_enabled',false);
end;$$;
create function public.admin_financial_reconciliation_target(p_payment_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.reconciliation_target(p_payment_id)$$;
create function public.finance_record_reconciliation(p_payment_id uuid,p_actor_id uuid,p_request_key uuid,p_revision text,p_facts jsonb) returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.record_reconciliation(p_payment_id,p_actor_id,p_request_key,p_revision,p_facts)$$;
create function public.admin_financial_reconciliation_queue() returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.reconciliation_queue()$$;
create function public.admin_record_verified_full_refund_allocation(p_report_id uuid,p_request_key uuid,p_reason text) returns jsonb language sql security invoker set search_path='' as $$select korvo_finance_private.apply_full_refund(p_report_id,p_request_key,p_reason)$$;
revoke all on function korvo_finance_private.reconciliation_target(uuid),korvo_finance_private.record_reconciliation(uuid,uuid,uuid,text,jsonb),korvo_finance_private.reconciliation_queue(),public.admin_financial_reconciliation_target(uuid),public.finance_record_reconciliation(uuid,uuid,uuid,text,jsonb),public.admin_financial_reconciliation_queue() from public,anon,authenticated,service_role;
grant execute on function korvo_finance_private.reconciliation_target(uuid),korvo_finance_private.reconciliation_queue(),public.admin_financial_reconciliation_target(uuid),public.admin_financial_reconciliation_queue() to authenticated;
grant execute on function korvo_finance_private.record_reconciliation(uuid,uuid,uuid,text,jsonb),public.finance_record_reconciliation(uuid,uuid,uuid,text,jsonb) to service_role;
revoke all on function korvo_finance_private.apply_full_refund(uuid,uuid,text),public.admin_record_verified_full_refund_allocation(uuid,uuid,text) from public,anon,authenticated,service_role;
grant execute on function korvo_finance_private.apply_full_refund(uuid,uuid,text),public.admin_record_verified_full_refund_allocation(uuid,uuid,text) to authenticated;
notify pgrst,'reload schema';
