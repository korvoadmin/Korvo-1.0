-- Focused rollback test of the three financial administration role gates.
begin;
create schema if not exists korvo_api_private;
grant usage on schema korvo_api_private to authenticated;
CREATE OR REPLACE FUNCTION korvo_api_private.admin_decide_payment_review(p_payment_review_id uuid, p_decision text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_review public.payment_reviews%rowtype;
      v_issue public.project_issues%rowtype;
      v_active_job public.active_jobs%rowtype;
      v_decision text;
      v_notes text;
      v_restore_status text;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if not exists (
        select 1 from public.platform_admins a join public.profiles p on p.id=a.user_id
        where a.user_id=auth.uid() and a.is_active=true and p.is_active=true
          and a.role in ('owner','admin')
      ) then
        raise exception 'Financial admin access required' using errcode='42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      v_decision := lower(trim(coalesce(p_decision, '')));
      v_notes := nullif(left(trim(coalesce(p_notes, '')), 5000), '');

      if v_decision not in ('approve_refund','deny_refund') then
        raise exception 'Invalid payment review decision';
      end if;

      select *
      into v_review
      from public.payment_reviews
      where id = p_payment_review_id
      for update;

      if not found then
        raise exception 'Payment review not found';
      end if;

      if v_review.status <> 'pending' then
        raise exception 'This payment review has already been decided';
      end if;

      select *
      into v_issue
      from public.project_issues
      where id = v_review.issue_id
      for update;

      if not found then
        raise exception 'Issue not found';
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where id = v_review.active_job_id
      for update;

      if not found then
        raise exception 'Active job not found';
      end if;

      if v_decision = 'approve_refund' then
        update public.payment_reviews
        set
          status = 'approved_pending_processor',
          decision_notes = v_notes,
          decided_by = auth.uid(),
          decided_at = now(),
          updated_at = now()
        where id = v_review.id;

        update public.project_issues
        set
          status = 'under_review',
          resolution_type = 'refund_review',
          resolution_notes = v_notes,
          payment_review_required = true,
          assigned_admin_id = coalesce(assigned_admin_id, auth.uid()),
          assigned_at = coalesce(assigned_at, now()),
          updated_at = now()
        where id = v_issue.id;

      else
        update public.payment_reviews
        set
          status = 'denied',
          decision_notes = v_notes,
          decided_by = auth.uid(),
          decided_at = now(),
          updated_at = now()
        where id = v_review.id;

        if v_active_job.status = 'disputed' then
          v_restore_status :=
            case
              when v_issue.previous_active_job_status in ('active','pending_confirmation')
                then v_issue.previous_active_job_status
              else 'active'
            end;

          update public.active_jobs
          set
            status = v_restore_status,
            updated_at = now()
          where id = v_active_job.id;
        end if;

        update public.project_issues
        set
          status = 'resolved',
          resolution_type = 'no_action',
          resolution_notes = coalesce(v_notes, 'Refund request denied after review'),
          payment_review_required = false,
          resolved_by = auth.uid(),
          resolved_at = now(),
          updated_at = now()
        where id = v_issue.id;
      end if;

      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        job_id,
        quote_id,
        active_job_id
      )
      values
      (
        v_review.customer_id,
        'issue_resolved',
        'Payment Review Updated',
        case
          when v_decision = 'approve_refund'
            then 'Korvo approved the refund request for processor handling.'
          else 'Korvo completed the payment review without approving a refund.'
        end,
        v_issue.job_id,
        v_issue.quote_id,
        v_issue.active_job_id
      ),
      (
        v_review.professional_id,
        'issue_resolved',
        'Payment Review Updated',
        case
          when v_decision = 'approve_refund'
            then 'Korvo approved the refund request for processor handling.'
          else 'Korvo completed the payment review without approving a refund.'
        end,
        v_issue.job_id,
        v_issue.quote_id,
        v_issue.active_job_id
      );

      return jsonb_build_object(
        'payment_review_id', v_review.id,
        'decision', v_decision,
        'status',
          case
            when v_decision = 'approve_refund'
              then 'approved_pending_processor'
            else 'denied'
          end
      );
    end;
    $function$;
CREATE OR REPLACE FUNCTION korvo_api_private.admin_set_professional_membership(p_professional_id uuid, p_plan_code text, p_status text DEFAULT 'active'::text, p_current_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_processor text DEFAULT NULL::text, p_processor_customer_id text DEFAULT NULL::text, p_processor_subscription_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_plan public.professional_membership_plans%rowtype;
      v_status text := lower(trim(coalesce(p_status, '')));
      v_period_end timestamptz;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if not exists (
        select 1 from public.platform_admins a join public.profiles p on p.id=a.user_id
        where a.user_id=auth.uid() and a.is_active=true and p.is_active=true
          and a.role in ('owner','admin')
      ) then
        raise exception 'Financial admin access required' using errcode='42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_status not in ('trialing','active','past_due','canceled','expired') then
        raise exception 'Invalid membership status';
      end if;

      select *
      into v_plan
      from public.professional_membership_plans
      where code = lower(trim(coalesce(p_plan_code, '')))
        and is_active = true;

      if not found then
        raise exception 'Membership plan not found';
      end if;

      if not exists (
        select 1
        from public.professional_profiles pp
        where pp.id = p_professional_id
      ) then
        raise exception 'Professional not found';
      end if;

      if v_plan.billing_interval = 'monthly'
         and v_status in ('active','past_due') then
        v_period_end :=
          coalesce(
            p_current_period_end,
            now() + interval '1 month'
          );
      else
        v_period_end := p_current_period_end;
      end if;

      insert into public.professional_subscriptions (
        professional_id,
        plan_code,
        status,
        current_period_start,
        current_period_end,
        pending_plan_code,
        change_requested_at,
        change_effective_at,
        cancel_at_period_end,
        processor,
        processor_customer_id,
        processor_subscription_id,
        started_at,
        canceled_at,
        updated_at
      )
      values (
        p_professional_id,
        v_plan.code,
        v_status,
        now(),
        v_period_end,
        null,
        null,
        now(),
        false,
        nullif(trim(coalesce(p_processor, '')), ''),
        nullif(trim(coalesce(p_processor_customer_id, '')), ''),
        nullif(trim(coalesce(p_processor_subscription_id, '')), ''),
        now(),
        case when v_status='canceled' then now() else null end,
        now()
      )
      on conflict (professional_id)
      do update set
        plan_code = excluded.plan_code,
        status = excluded.status,
        current_period_start = now(),
        current_period_end = excluded.current_period_end,
        pending_plan_code = null,
        change_requested_at = null,
        change_effective_at = now(),
        cancel_at_period_end = false,
        processor = coalesce(excluded.processor, professional_subscriptions.processor),
        processor_customer_id = coalesce(
          excluded.processor_customer_id,
          professional_subscriptions.processor_customer_id
        ),
        processor_subscription_id = coalesce(
          excluded.processor_subscription_id,
          professional_subscriptions.processor_subscription_id
        ),
        canceled_at =
          case
            when excluded.status='canceled' then now()
            else null
          end,
        updated_at = now();

      return public.professional_membership_snapshot_internal(p_professional_id);
    end;
    $function$;
CREATE OR REPLACE FUNCTION korvo_api_private.admin_release_professional_job_usage(p_active_job_id uuid, p_reason text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_count integer;
      v_reason text := nullif(left(trim(coalesce(p_reason, '')), 1000), '');
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if not exists (
        select 1 from public.platform_admins a join public.profiles p on p.id=a.user_id
        where a.user_id=auth.uid() and a.is_active=true and p.is_active=true
          and a.role in ('owner','admin')
      ) then
        raise exception 'Financial admin access required' using errcode='42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_reason is null then
        raise exception 'Release reason is required';
      end if;

      update public.professional_job_usage
      set
        released_at = now(),
        release_reason = v_reason,
        released_by_admin_id = auth.uid()
      where active_job_id = p_active_job_id
        and released_at is null;

      get diagnostics v_count = row_count;

      return v_count = 1;
    end;
    $function$;
grant execute on function korvo_api_private.admin_decide_payment_review(uuid,text,text),korvo_api_private.admin_release_professional_job_usage(uuid,text),korvo_api_private.admin_set_professional_membership(uuid,text,text,timestamptz,text,text,text) to authenticated;
create temporary table role_check_fixture(id uuid);
create temporary table role_check_results(label text);
grant all on role_check_fixture,role_check_results to authenticated;
do $$declare u uuid:=gen_random_uuid();begin
 insert into role_check_fixture values(u);
 insert into auth.users(id,email,aud,role) values(u,u||'@example.invalid','authenticated','authenticated');
 insert into public.profiles(id,account_type,is_active,onboarding_complete) values(u,'customer',true,true);
 insert into public.platform_admins(user_id,role,is_active) values(u,'support',true);
 perform set_config('request.jwt.claim.sub',u::text,true);
 perform set_config('request.jwt.claims',jsonb_build_object('sub',u,'role','authenticated','user_metadata',jsonb_build_object('role','owner'))::text,true);
end;$$;
set local role authenticated;
do $$declare stmt text;begin
 foreach stmt in array array['select korvo_api_private.admin_decide_payment_review(null,null,null)','select korvo_api_private.admin_set_professional_membership(null,null,null)','select korvo_api_private.admin_release_professional_job_usage(null,null)'] loop
  begin execute stmt;raise exception 'Support authorization failed';
  exception when insufficient_privilege then insert into role_check_results values('support denied '||stmt);end;
 end loop;
end;$$;
reset role;
update public.platform_admins set role='owner' where user_id=(select id from role_check_fixture);
set local role authenticated;
do $$declare stmt text;begin
 foreach stmt in array array['select korvo_api_private.admin_decide_payment_review(null,null,null)','select korvo_api_private.admin_set_professional_membership(null,null,null)','select korvo_api_private.admin_release_professional_job_usage(null,null)'] loop
  begin execute stmt;raise exception 'Expected field validation';
  exception when insufficient_privilege then raise exception 'Owner incorrectly denied';
  when raise_exception then insert into role_check_results values('owner reaches validation '||stmt);end;
 end loop;
end;$$;
reset role;
select count(*) as checks_passed from role_check_results;
rollback;
