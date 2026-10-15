-- REVIEW ONLY: no Stripe operation, money movement, refund policy or release approval.
-- Requires explicit authorization before deployment. Admin comes from database state.
create schema korvo_refunds_private;
revoke all on schema korvo_refunds_private from public,anon,authenticated,service_role;
grant usage on schema korvo_refunds_private to authenticated;
create table korvo_refunds_private.reviews (
 id uuid primary key default gen_random_uuid(),
 payment_id uuid not null references public.marketplace_payments(id),
 request_key uuid not null unique,
 professional_cents bigint not null check(professional_cents>=0),
 platform_fee_cents bigint not null check(platform_fee_cents>=0),
 reason text not null check(length(btrim(reason)) between 10 and 2000),
 requested_by uuid not null references public.profiles(id),
 state text not null default 'pending' check(state in('pending','needs_information','recommended','rejected')),
 reviewed_by uuid references public.profiles(id),reviewed_at timestamptz,
 review_note text,
 created_at timestamptz not null default now(),
 check(professional_cents+platform_fee_cents>0),
 check((reviewed_by is null)=(reviewed_at is null))
);
create unique index one_open_refund_review on korvo_refunds_private.reviews(payment_id) where state<>'rejected';
create index refund_review_requester on korvo_refunds_private.reviews(requested_by);
create index refund_review_reviewer on korvo_refunds_private.reviews(reviewed_by);
create table korvo_refunds_private.audit (
 id bigint generated always as identity primary key,
 review_id uuid not null references korvo_refunds_private.reviews(id),
 actor_id uuid not null references public.profiles(id),action text not null,
 note text not null,created_at timestamptz not null default now()
);
create index refund_audit_review on korvo_refunds_private.audit(review_id);
create index refund_audit_actor on korvo_refunds_private.audit(actor_id);
alter table korvo_refunds_private.reviews enable row level security;
alter table korvo_refunds_private.audit enable row level security;
create policy backend_only on korvo_refunds_private.reviews for all to anon,authenticated using(false) with check(false);
create policy backend_only on korvo_refunds_private.audit for all to anon,authenticated using(false) with check(false);
revoke all on all tables in schema korvo_refunds_private from public,anon,authenticated,service_role;

create function korvo_refunds_private.admin_actor() returns uuid
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_payments_private.actor();
begin
 if not exists(select 1 from public.platform_admins where user_id=uid and is_active and role in('owner','admin')) then
  raise exception 'Active financial administrator required' using errcode='42501';end if;
 return uid;
end;$$;

create function korvo_refunds_private.request(p_payment uuid,p_key uuid,p_professional bigint,p_fee bigint,p_reason text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_refunds_private.admin_actor();p public.marketplace_payments%rowtype;r korvo_refunds_private.reviews%rowtype;
begin
 if p_key is null or p_professional is null or p_fee is null or p_professional<0 or p_fee<0
  or p_reason is null or length(btrim(p_reason)) not between 10 and 2000 then raise exception 'Invalid review request';end if;
 select * into strict p from public.marketplace_payments where id=p_payment for update;
 select * into r from korvo_refunds_private.reviews where request_key=p_key;
 if found then
  if r.payment_id<>p_payment or r.professional_cents<>p_professional or r.platform_fee_cents<>p_fee or r.reason<>p_reason then
   raise exception 'Idempotency key conflicts with original request';end if;
  return jsonb_build_object('id',r.id,'state',r.state,'execution_enabled',false);
 end if;
 if p.status not in('paid','partially_refunded') or p.release_status<>'held' then
  raise exception 'Held paid payment required';end if;
 -- Provider refunds may lack an allocation decision. Never guess its split.
 if p.refunded_total_cents<>p.professional_refunded_cents+p.platform_fee_refunded_cents then
  raise exception 'Existing provider refund allocation needs reconciliation';end if;
 if p_professional>p.professional_gross_cents-p.professional_refunded_cents
  or p_fee>p.platform_fee_cents-p.platform_fee_refunded_cents or p_professional+p_fee<=0
  or p_professional+p_fee>p.customer_total_cents-p.refunded_total_cents then
  raise exception 'Refund review exceeds remaining allocation';end if;
 insert into korvo_refunds_private.reviews(payment_id,request_key,professional_cents,platform_fee_cents,reason,requested_by)
 values(p_payment,p_key,p_professional,p_fee,p_reason,uid) returning * into r;
 update public.marketplace_payments set requires_review=true,updated_at=now() where id=p_payment;
 insert into korvo_refunds_private.audit(review_id,actor_id,action,note) values(r.id,uid,'requested',p_reason);
 return jsonb_build_object('id',r.id,'state',r.state,'execution_enabled',false);
end;$$;

create function korvo_refunds_private.decide(p_review uuid,p_state text,p_note text) returns jsonb
language plpgsql security definer set search_path='' as $$
declare uid uuid:=korvo_refunds_private.admin_actor();r korvo_refunds_private.reviews%rowtype;p public.marketplace_payments%rowtype;
begin
 if p_state is null or p_state not in('needs_information','recommended','rejected')
  or p_note is null or length(btrim(p_note)) not between 10 and 2000 then raise exception 'Invalid review decision';end if;
 select * into strict r from korvo_refunds_private.reviews where id=p_review;
 -- Same lock order as request: payment before review. Serialize with webhooks.
 select * into strict p from public.marketplace_payments where id=r.payment_id for update;
 select * into strict r from korvo_refunds_private.reviews where id=p_review for update;
 if r.state=p_state and r.review_note=p_note then
  return jsonb_build_object('id',r.id,'state',r.state,'execution_enabled',false);end if;
 if r.state in('recommended','rejected') then raise exception 'Review already finalized';end if;
 if p_state='recommended' then
  if p.status not in('paid','partially_refunded') or p.release_status<>'held' or not p.requires_review then
   raise exception 'Payment changed; held paid payment under review required';end if;
  if p.refunded_total_cents<>p.professional_refunded_cents+p.platform_fee_refunded_cents then
   raise exception 'Existing provider refund allocation needs reconciliation';end if;
  if r.professional_cents>p.professional_gross_cents-p.professional_refunded_cents
   or r.platform_fee_cents>p.platform_fee_cents-p.platform_fee_refunded_cents
   or r.professional_cents+r.platform_fee_cents>p.customer_total_cents-p.refunded_total_cents then
   raise exception 'Payment changed; proposed refund exceeds remaining allocation';end if;
 end if;
 update korvo_refunds_private.reviews set state=p_state,review_note=p_note,reviewed_by=uid,reviewed_at=now() where id=r.id;
 insert into korvo_refunds_private.audit(review_id,actor_id,action,note) values(r.id,uid,p_state,p_note);
 -- Even rejection never clears a payment hold or authorizes a contractor transfer.
 return jsonb_build_object('id',r.id,'state',p_state,'execution_enabled',false);
end;$$;

create function korvo_refunds_private.queue() returns jsonb language plpgsql security definer set search_path='' as $$
begin
 perform korvo_refunds_private.admin_actor();
 return coalesce((select jsonb_agg(to_jsonb(q)) from (
  select r.*,p.status payment_status,p.requires_review,p.release_status,p.refunded_total_cents
  from korvo_refunds_private.reviews r join public.marketplace_payments p on p.id=r.payment_id
  order by r.created_at desc,r.id limit 100) q),'[]');
end;$$;

create function public.admin_request_marketplace_refund_review(p_payment_id uuid,p_request_key uuid,p_professional_cents bigint,p_platform_fee_cents bigint,p_reason text) returns jsonb
language sql security invoker set search_path='' as $$select korvo_refunds_private.request(p_payment_id,p_request_key,p_professional_cents,p_platform_fee_cents,p_reason);$$;
create function public.admin_review_marketplace_refund(p_review_id uuid,p_state text,p_note text) returns jsonb
language sql security invoker set search_path='' as $$select korvo_refunds_private.decide(p_review_id,p_state,p_note);$$;
create function public.admin_marketplace_refund_queue() returns jsonb
language sql security invoker set search_path='' as $$select korvo_refunds_private.queue();$$;
revoke all on all functions in schema korvo_refunds_private from public,anon,authenticated,service_role;
grant execute on function korvo_refunds_private.request(uuid,uuid,bigint,bigint,text),korvo_refunds_private.decide(uuid,text,text),korvo_refunds_private.queue() to authenticated;
revoke all on function public.admin_request_marketplace_refund_review(uuid,uuid,bigint,bigint,text),public.admin_review_marketplace_refund(uuid,text,text),public.admin_marketplace_refund_queue() from public,anon,authenticated,service_role;
grant execute on function public.admin_request_marketplace_refund_review(uuid,uuid,bigint,bigint,text),public.admin_review_marketplace_refund(uuid,text,text),public.admin_marketplace_refund_queue() to authenticated;
notify pgrst,'reload schema';
