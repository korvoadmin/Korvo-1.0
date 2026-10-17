-- A11 REVIEW ONLY. Dependency: revised A6 + non_money_beta.sql + existing opportunities API.
-- Closes security-definer discovery/notification paths that bypass table RLS.
create function korvo_beta_private.row_visible(p_customer uuid,p_category text,p_city text) returns boolean language plpgsql security definer set search_path='' as $$
declare uid uuid;c korvo_beta_private.cohort%rowtype;begin
 if not korvo_beta_private.enabled() then return true;end if;
 begin uid:=korvo_beta_private.actor();exception when insufficient_privilege then return false;end;
 select * into strict c from korvo_beta_private.cohort where id='atlanta-v1';
 return korvo_beta_private.ready(p_customer,'customer') and coalesce(p_category=any(c.categories) and p_city=any(c.cities),false);end;$$;
create function korvo_beta_private.job_visible(p_job uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare j public.jobs%rowtype;begin
 if not korvo_beta_private.enabled() then return true;end if;
 select * into j from public.jobs where id=p_job;if not found then return false;end if;
 return korvo_beta_private.row_visible(j.customer_id,j.category,j.city);end;$$;
-- Evaluate supplied row columns, not a self-lookup: INSERT RETURNING checks before
-- a new tuple is visible to a nested SELECT. Legacy RPC filters use job_visible.
alter policy beta_job_visibility on public.jobs using(korvo_beta_private.row_visible(customer_id,category,city));
create policy beta_opportunity_visibility on public.job_opportunities as restrictive for select to authenticated using(korvo_beta_private.job_visible(job_id));
create policy beta_opportunity_notification_visibility on public.notifications as restrictive for select to authenticated using(not korvo_beta_private.enabled() or (opportunity_id is null and type not in('matched_job','job_invitation')) or korvo_beta_private.job_visible(job_id));
create function korvo_beta_private.guard_opportunity() returns trigger language plpgsql security definer set search_path='' as $$
declare c korvo_beta_private.cohort%rowtype;j public.jobs%rowtype;begin
 if not korvo_beta_private.enabled() then return new;end if;
 select * into strict c from korvo_beta_private.cohort where id='atlanta-v1';select * into j from public.jobs where id=new.job_id;
 if c.paused or not korvo_beta_private.ready(new.professional_id,'professional') or not korvo_beta_private.ready(j.customer_id,'customer') or new.customer_id is distinct from j.customer_id or not coalesce(j.category=any(c.categories) and j.city=any(c.cities),false) then return null;end if;return new;end;$$;
create trigger beta_restrict_opportunity_generation before insert or update of job_id,professional_id,customer_id on public.job_opportunities for each row execute function korvo_beta_private.guard_opportunity();
create function korvo_beta_private.guard_opportunity_notification() returns trigger language plpgsql security definer set search_path='' as $$
declare c korvo_beta_private.cohort%rowtype;j public.jobs%rowtype;r text;begin
 if not korvo_beta_private.enabled() or (new.opportunity_id is null and new.type not in('matched_job','job_invitation')) then return new;end if;
 select * into strict c from korvo_beta_private.cohort where id='atlanta-v1';select * into j from public.jobs where id=new.job_id;select account_type into r from public.profiles where id=new.user_id;
 if c.paused or not korvo_beta_private.ready(new.user_id,r) or not korvo_beta_private.ready(j.customer_id,'customer') or r not in('customer','professional') or (r='customer' and new.user_id is distinct from j.customer_id) or not coalesce(j.category=any(c.categories) and j.city=any(c.cities),false) then return null;end if;return new;end;$$;
create trigger beta_restrict_opportunity_notifications before insert on public.notifications for each row execute function korvo_beta_private.guard_opportunity_notification();
create function korvo_beta_private.respond_opportunity(p_id uuid,p_action text) returns jsonb language plpgsql security definer set search_path='' as $$
begin
 if korvo_beta_private.enabled() and not exists(select 1 from public.job_opportunities o where o.id=p_id and o.professional_id=auth.uid() and korvo_beta_private.job_visible(o.job_id)) then raise exception 'Admitted beta opportunity required' using errcode='42501';end if;
 return korvo_opportunities_private.respond_to_job_opportunity(p_id,p_action);end;$$;
create function korvo_beta_private.invite_professional(p_job uuid,p_professional uuid) returns jsonb language plpgsql security definer set search_path='' as $$begin
 if korvo_beta_private.enabled() and (not korvo_beta_private.job_visible(p_job) or not korvo_beta_private.ready(p_professional,'professional')) then raise exception 'Admitted beta participants required' using errcode='42501';end if;
 return korvo_opportunities_private.invite_professional_to_job(p_job,p_professional);end;$$;
create function korvo_beta_private.customer_professionals(p_job uuid) returns jsonb language plpgsql security definer set search_path='' as $$
declare r jsonb;kind text;begin
 if korvo_beta_private.enabled() and not korvo_beta_private.job_visible(p_job) then raise exception 'Admitted beta job required' using errcode='42501';end if;
 r:=korvo_opportunities_private.customer_job_professionals(p_job);
 if korvo_beta_private.enabled() then foreach kind in array array['recommendations','activity'] loop
 r:=jsonb_set(r,array[kind],coalesce((select jsonb_agg(v order by ord) from jsonb_array_elements(r->kind) with ordinality e(v,ord) where korvo_beta_private.ready((v->>'professional_id')::uuid,'professional')),'[]'));end loop;end if;return r;end;$$;
create or replace function public.respond_to_job_opportunity(p_opportunity_id uuid,p_action text) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.respond_opportunity(p_opportunity_id,p_action)$$;
create or replace function public.invite_professional_to_job(p_job_id uuid,p_professional_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.invite_professional(p_job_id,p_professional_id)$$;
create or replace function public.customer_job_professionals(p_job_id uuid) returns jsonb language sql security invoker set search_path='' as $$select korvo_beta_private.customer_professionals(p_job_id)$$;

CREATE OR REPLACE FUNCTION public.my_job_opportunities(p_limit integer DEFAULT 50)
 RETURNS TABLE(opportunity_id uuid, job_id uuid, title text, category text, city text, state text, budget_min numeric, budget_max numeric, job_status text, opportunity_status text, match_score integer, matched_at timestamp with time zone, invited_at timestamp with time zone, viewed_at timestamp with time zone, passed_at timestamp with time zone, quoted_at timestamp with time zone, can_quote boolean, reason_code text, created_at timestamp with time zone)
 LANGUAGE sql SECURITY INVOKER SET search_path='' AS $beta$ select * from korvo_opportunities_private.my_job_opportunities(p_limit) r where korvo_beta_private.job_visible(r.job_id) $beta$;

CREATE OR REPLACE FUNCTION public.my_job_match_feed(p_limit integer DEFAULT 50)
 RETURNS TABLE(job_id uuid, job_reference text, title text, category text, city text, state text, budget_min numeric, budget_max numeric, preferred_date date, timeframe text, created_at timestamp with time zone, match_score integer, exact_service_match boolean, catalog_category_match boolean, preferred_area_match boolean, same_city_match boolean, verification_status text, can_quote boolean, reason_code text)
 LANGUAGE sql SECURITY INVOKER SET search_path='' AS $beta$ select * from korvo_api_private.my_job_match_feed(p_limit) r where korvo_beta_private.job_visible(r.job_id) $beta$;
revoke all on function korvo_beta_private.row_visible(uuid,text,text),korvo_beta_private.job_visible(uuid),korvo_beta_private.guard_opportunity(),korvo_beta_private.guard_opportunity_notification(),korvo_beta_private.respond_opportunity(uuid,text),korvo_beta_private.invite_professional(uuid,uuid),korvo_beta_private.customer_professionals(uuid) from public,anon,authenticated,service_role;
grant execute on function korvo_beta_private.row_visible(uuid,text,text),korvo_beta_private.job_visible(uuid),korvo_beta_private.enabled(),korvo_beta_private.respond_opportunity(uuid,text),korvo_beta_private.invite_professional(uuid,uuid),korvo_beta_private.customer_professionals(uuid) to authenticated;
revoke all on function public.my_job_opportunities(integer),public.my_job_match_feed(integer),public.respond_to_job_opportunity(uuid,text),public.invite_professional_to_job(uuid,uuid),public.customer_job_professionals(uuid) from public,anon,service_role;
grant execute on function public.my_job_opportunities(integer),public.my_job_match_feed(integer),public.respond_to_job_opportunity(uuid,text),public.invite_professional_to_job(uuid,uuid),public.customer_job_professionals(uuid) to authenticated;
