-- Reviewed API: block_korvo_user; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.block_korvo_user(p_blocked_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      if p_blocked_user_id is null or p_blocked_user_id = auth.uid() then
        raise exception 'Invalid user to block';
      end if;

      if not exists (
        select 1
        from public.conversations c
        where
          (c.customer_id = auth.uid() and c.professional_id = p_blocked_user_id)
          or
          (c.professional_id = auth.uid() and c.customer_id = p_blocked_user_id)
      ) then
        raise exception 'You can only block a user you have interacted with on Korvo';
      end if;

      insert into public.user_blocks (
        blocker_id,
        blocked_id
      )
      values (
        auth.uid(),
        p_blocked_user_id
      )
      on conflict (blocker_id, blocked_id) do nothing;

      return jsonb_build_object(
        'blocked_user_id', p_blocked_user_id,
        'status', 'blocked'
      );
    end;
    $function$;
revoke all on function korvo_api_private.block_korvo_user(p_blocked_user_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.block_korvo_user(p_blocked_user_id uuid) to authenticated;
create or replace function public.block_korvo_user(p_blocked_user_id uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.block_korvo_user(p_blocked_user_id); $wrapper$;
revoke all on function public.block_korvo_user(p_blocked_user_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.block_korvo_user(p_blocked_user_id uuid) to authenticated;

revoke all on function public.bump_conversation_on_message() from public, anon, authenticated, service_role;
alter function public.bump_conversation_on_message() set search_path = '';

-- Reviewed API: cancel_professional_membership_change; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.cancel_professional_membership_change()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_subscription public.professional_subscriptions%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_subscription
      from public.professional_subscriptions
      where professional_id = auth.uid()
      for update;

      if not found then
        raise exception 'Professional subscription not found';
      end if;

      update public.professional_subscriptions
      set
        pending_plan_code = null,
        change_requested_at = null,
        change_effective_at = null,
        cancel_at_period_end = false,
        updated_at = now()
      where id = v_subscription.id;

      return public.professional_membership_snapshot_internal(auth.uid());
    end;
    $function$;
revoke all on function korvo_api_private.cancel_professional_membership_change() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.cancel_professional_membership_change() to authenticated;
create or replace function public.cancel_professional_membership_change()
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.cancel_professional_membership_change(); $wrapper$;
revoke all on function public.cancel_professional_membership_change() from public, anon, authenticated, service_role;
grant execute on function public.cancel_professional_membership_change() to authenticated;

revoke all on function public.classify_message_safety(p_body text) from public, anon, authenticated, service_role;
alter function public.classify_message_safety(p_body text) set search_path = '';

revoke all on function public.create_conversation_for_quote() from public, anon, authenticated, service_role;
alter function public.create_conversation_for_quote() set search_path = '';

revoke all on function public.create_issue_from_paid_cancellation() from public, anon, authenticated, service_role;
alter function public.create_issue_from_paid_cancellation() set search_path = '';

revoke all on function public.current_professional_verification_status(p_professional_id uuid) from public, anon, authenticated, service_role;
alter function public.current_professional_verification_status(p_professional_id uuid) set search_path = '';

-- Reviewed API: customer_cancel_job; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.customer_cancel_job(p_job_id uuid, p_reason text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_job public.jobs%rowtype;
      v_active_job public.active_jobs%rowtype;
      v_reason text;
      v_payment_review boolean := false;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      v_reason :=
        nullif(
          left(
            trim(coalesce(p_reason, '')),
            1000
          ),
          ''
        );

      select *
      into v_job
      from public.jobs
      where id = p_job_id
      for update;

      if not found then
        raise exception 'Job not found';
      end if;

      if v_job.customer_id <> auth.uid() then
        raise exception 'You cannot cancel this job';
      end if;

      if v_job.status in ('completed','cancelled','expired') then
        raise exception 'This job is already closed';
      end if;

      if v_job.status = 'open' then
        insert into public.notifications (
          user_id,
          type,
          title,
          body,
          job_id,
          quote_id
        )
        select
          q.professional_id,
          'job_cancelled',
          'Project Closed',
          '"' || q.job_title || '" was cancelled by the customer.',
          q.job_id,
          q.id
        from public.quotes q
        where q.job_id = v_job.id
          and q.status = 'pending';

        update public.quotes
        set
          status = 'expired',
          updated_at = now()
        where job_id = v_job.id
          and status = 'pending';

        update public.jobs
        set
          status = 'cancelled',
          closed_at = now(),
          closed_reason = v_reason,
          closed_by = auth.uid(),
          closed_by_role = 'customer',
          updated_at = now()
        where id = v_job.id;

        insert into public.project_closures (
          job_id,
          actor_id,
          actor_role,
          closure_type,
          reason,
          payment_review_required
        )
        values (
          v_job.id,
          auth.uid(),
          'customer',
          'customer_cancelled',
          v_reason,
          false
        );

        return jsonb_build_object(
          'job_id', v_job.id,
          'status', 'cancelled',
          'active_job_id', null,
          'payment_review_required', false
        );
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where job_id = v_job.id
      for update;

      if not found then
        raise exception 'Accepted job is missing its active job record';
      end if;

      if v_active_job.status = 'pending_confirmation' then
        raise exception 'This job is awaiting completion confirmation and cannot be cancelled through the standard flow';
      end if;

      if v_active_job.status <> 'active' then
        raise exception 'This active job cannot be cancelled';
      end if;

      select exists (
        select 1
        from public.booking_payments bp
        where bp.active_job_id = v_active_job.id
          and bp.status = 'paid'
      )
      into v_payment_review;

      update public.active_jobs
      set
        status = 'cancelled',
        cancelled_at = now(),
        cancelled_by = auth.uid(),
        cancellation_reason = v_reason,
        updated_at = now()
      where id = v_active_job.id;

      update public.jobs
      set
        status = 'cancelled',
        closed_at = now(),
        closed_reason = v_reason,
        closed_by = auth.uid(),
        closed_by_role = 'customer',
        updated_at = now()
      where id = v_job.id;

      insert into public.project_closures (
        job_id,
        active_job_id,
        actor_id,
        actor_role,
        closure_type,
        reason,
        payment_review_required
      )
      values (
        v_job.id,
        v_active_job.id,
        auth.uid(),
        'customer',
        'customer_cancelled',
        v_reason,
        v_payment_review
      );

      return jsonb_build_object(
        'job_id', v_job.id,
        'active_job_id', v_active_job.id,
        'status', 'cancelled',
        'payment_review_required', v_payment_review
      );
    end;
    $function$;
revoke all on function korvo_api_private.customer_cancel_job(p_job_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.customer_cancel_job(p_job_id uuid, p_reason text) to authenticated;
create or replace function public.customer_cancel_job(p_job_id uuid, p_reason text DEFAULT ''::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.customer_cancel_job(p_job_id, p_reason); $wrapper$;
revoke all on function public.customer_cancel_job(p_job_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function public.customer_cancel_job(p_job_id uuid, p_reason text) to authenticated;

-- Reviewed API: customer_confirm_job_completion; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.customer_confirm_job_completion(p_active_job_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_active_job public.active_jobs%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where id = p_active_job_id
      for update;

      if not found then
        raise exception 'Active job not found';
      end if;

      if v_active_job.customer_id <> auth.uid() then
        raise exception 'You cannot confirm this active job';
      end if;

      if v_active_job.status <> 'pending_confirmation' then
        raise exception 'This job is not waiting for customer confirmation';
      end if;

      update public.active_jobs
      set
        status = 'completed',
        completed_at = now(),
        updated_at = now()
      where id = v_active_job.id;

      update public.jobs
      set
        status = 'completed',
        closed_at = now(),
        closed_reason = 'Customer confirmed completion',
        closed_by = auth.uid(),
        closed_by_role = 'customer',
        updated_at = now()
      where id = v_active_job.job_id
        and customer_id = auth.uid();

      insert into public.project_closures (
        job_id,
        active_job_id,
        actor_id,
        actor_role,
        closure_type,
        reason,
        payment_review_required
      )
      values (
        v_active_job.job_id,
        v_active_job.id,
        auth.uid(),
        'customer',
        'completed',
        'Customer confirmed completion',
        false
      );

      return jsonb_build_object(
        'active_job_id', v_active_job.id,
        'job_id', v_active_job.job_id,
        'status', 'completed'
      );
    end;
    $function$;
revoke all on function korvo_api_private.customer_confirm_job_completion(p_active_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.customer_confirm_job_completion(p_active_job_id uuid) to authenticated;
create or replace function public.customer_confirm_job_completion(p_active_job_id uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.customer_confirm_job_completion(p_active_job_id); $wrapper$;
revoke all on function public.customer_confirm_job_completion(p_active_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.customer_confirm_job_completion(p_active_job_id uuid) to authenticated;

-- Reviewed API: customer_past_projects; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.customer_past_projects()
 RETURNS TABLE(job_id uuid, active_job_id uuid, title text, category text, city text, state text, project_status text, professional_name text, amount numeric, timeframe text, closed_at timestamp with time zone, closure_type text, closure_reason text, payment_review_required boolean, review_rating integer)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
      select
        j.id as job_id,
        aj.id as active_job_id,
        j.title,
        j.category,
        j.city,
        j.state,
        j.status as project_status,
        aj.professional_name,
        aj.amount,
        aj.timeframe,
        coalesce(j.closed_at, aj.completed_at, aj.cancelled_at) as closed_at,
        pc.closure_type,
        coalesce(pc.reason, j.closed_reason) as closure_reason,
        coalesce(pc.payment_review_required, false) as payment_review_required,
        r.rating as review_rating
      from public.jobs j
      left join public.active_jobs aj
        on aj.job_id = j.id
      left join lateral (
        select
          pc1.closure_type,
          pc1.reason,
          pc1.payment_review_required,
          pc1.created_at
        from public.project_closures pc1
        where pc1.job_id = j.id
        order by pc1.created_at desc
        limit 1
      ) pc on true
      left join public.reviews r
        on r.job_id = j.id
      where j.customer_id = auth.uid()
        and exists (select 1 from auth.users u where u.id = auth.uid())
        and j.status in ('completed','cancelled','expired')
      order by coalesce(j.closed_at, aj.completed_at, aj.cancelled_at, j.updated_at) desc;
    $function$;
revoke all on function korvo_api_private.customer_past_projects() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.customer_past_projects() to authenticated;
create or replace function public.customer_past_projects()
returns TABLE(job_id uuid, active_job_id uuid, title text, category text, city text, state text, project_status text, professional_name text, amount numeric, timeframe text, closed_at timestamp with time zone, closure_type text, closure_reason text, payment_review_required boolean, review_rating integer)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.customer_past_projects(); $wrapper$;
revoke all on function public.customer_past_projects() from public, anon, authenticated, service_role;
grant execute on function public.customer_past_projects() to authenticated;

-- Reviewed API: customer_resolve_completion_issue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.customer_resolve_completion_issue(p_issue_id uuid, p_action text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_issue public.project_issues%rowtype;
      v_active_job public.active_jobs%rowtype;
      v_action text;
      v_notes text;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      v_action := lower(trim(coalesce(p_action, '')));
      v_notes := nullif(left(trim(coalesce(p_notes, '')), 2000), '');

      if v_action not in ('return_to_work','complete') then
        raise exception 'Invalid resolution action';
      end if;

      select *
      into v_issue
      from public.project_issues
      where id = p_issue_id
      for update;

      if not found then
        raise exception 'Issue not found';
      end if;

      if v_issue.customer_id <> auth.uid() then
        raise exception 'Only the customer can resolve this completion issue';
      end if;

      if v_issue.issue_type <> 'completion_dispute' then
        raise exception 'This action only applies to completion disputes';
      end if;

      if v_issue.status not in ('open','under_review') then
        raise exception 'This issue is already closed';
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where id = v_issue.active_job_id
      for update;

      if not found then
        raise exception 'Active job not found';
      end if;

      if v_active_job.status <> 'disputed' then
        raise exception 'This job is not currently disputed';
      end if;

      if v_action = 'return_to_work' then
        update public.active_jobs
        set
          status = 'active',
          professional_completed_at = null,
          updated_at = now()
        where id = v_active_job.id;

        update public.project_issues
        set
          status = 'resolved',
          resolution_type = 'returned_to_work',
          resolution_notes = v_notes,
          resolved_by = auth.uid(),
          resolved_at = now(),
          updated_at = now()
        where id = v_issue.id;

        insert into public.notifications (
          user_id,
          type,
          title,
          body,
          job_id,
          quote_id,
          active_job_id
        )
        values (
          v_issue.professional_id,
          'issue_resolved',
          'Project Returned to Active Work',
          'The customer resolved the completion issue and returned "' ||
            v_active_job.job_title || '" to active work.',
          v_active_job.job_id,
          v_active_job.quote_id,
          v_active_job.id
        );

        return jsonb_build_object(
          'issue_id', v_issue.id,
          'status', 'resolved',
          'resolution', 'returned_to_work',
          'active_job_status', 'active'
        );
      end if;

      update public.active_jobs
      set
        status = 'completed',
        completed_at = now(),
        updated_at = now()
      where id = v_active_job.id;

      update public.jobs
      set
        status = 'completed',
        closed_at = now(),
        closed_reason = coalesce(v_notes, 'Customer resolved completion issue and confirmed completion'),
        closed_by = auth.uid(),
        closed_by_role = 'customer',
        updated_at = now()
      where id = v_active_job.job_id
        and customer_id = auth.uid();

      update public.project_issues
      set
        status = 'resolved',
        resolution_type = 'customer_completed',
        resolution_notes = v_notes,
        resolved_by = auth.uid(),
        resolved_at = now(),
        updated_at = now()
      where id = v_issue.id;

      insert into public.project_closures (
        job_id,
        active_job_id,
        actor_id,
        actor_role,
        closure_type,
        reason,
        payment_review_required
      )
      values (
        v_active_job.job_id,
        v_active_job.id,
        auth.uid(),
        'customer',
        'completed',
        coalesce(v_notes, 'Customer resolved completion issue and confirmed completion'),
        false
      );

      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        job_id,
        quote_id,
        active_job_id
      )
      values (
        v_issue.professional_id,
        'issue_resolved',
        'Project Issue Resolved',
        'The customer resolved the issue and confirmed "' ||
          v_active_job.job_title || '" as complete.',
        v_active_job.job_id,
        v_active_job.quote_id,
        v_active_job.id
      );

      return jsonb_build_object(
        'issue_id', v_issue.id,
        'status', 'resolved',
        'resolution', 'customer_completed',
        'active_job_status', 'completed',
        'job_status', 'completed'
      );
    end;
    $function$;
revoke all on function korvo_api_private.customer_resolve_completion_issue(p_issue_id uuid, p_action text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.customer_resolve_completion_issue(p_issue_id uuid, p_action text, p_notes text) to authenticated;
create or replace function public.customer_resolve_completion_issue(p_issue_id uuid, p_action text, p_notes text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.customer_resolve_completion_issue(p_issue_id, p_action, p_notes); $wrapper$;
revoke all on function public.customer_resolve_completion_issue(p_issue_id uuid, p_action text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.customer_resolve_completion_issue(p_issue_id uuid, p_action text, p_notes text) to authenticated;

revoke all on function public.enforce_job_posting_safety() from public, anon, authenticated, service_role;
alter function public.enforce_job_posting_safety() set search_path = '';

revoke all on function public.enforce_quote_safety() from public, anon, authenticated, service_role;
alter function public.enforce_quote_safety() set search_path = '';

revoke all on function public.ensure_payment_review_for_issue() from public, anon, authenticated, service_role;
alter function public.ensure_payment_review_for_issue() set search_path = '';

revoke all on function public.ensure_professional_subscription_row() from public, anon, authenticated, service_role;
alter function public.ensure_professional_subscription_row() set search_path = '';

-- Reviewed API: get_job_private_details; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.get_job_private_details(p_job_id uuid)
 RETURNS TABLE(job_id uuid, service_address_line1 text, service_address_line2 text, service_city text, service_state text, service_postal_code text, access_notes text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_customer_id uuid;
      v_professional_id uuid;
      v_active_status text;
      v_paid boolean := false;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select
        aj.customer_id,
        aj.professional_id,
        aj.status
      into
        v_customer_id,
        v_professional_id,
        v_active_status
      from public.active_jobs aj
      where aj.job_id = p_job_id
      limit 1;

      if v_customer_id is null then
        select j.customer_id
        into v_customer_id
        from public.jobs j
        where j.id = p_job_id;
      end if;

      if v_customer_id is null then
        raise exception 'Job not found';
      end if;

      if auth.uid() = v_customer_id then
        return query
        select
          d.job_id,
          d.service_address_line1,
          d.service_address_line2,
          d.service_city,
          d.service_state,
          d.service_postal_code,
          d.access_notes
        from public.job_private_details d
        where d.job_id = p_job_id;

        return;
      end if;

      if auth.uid() = v_professional_id then
        if v_active_status = 'cancelled' then
          raise exception 'Service address is unavailable for cancelled bookings';
        end if;

        select exists (
          select 1
          from public.booking_payments bp
          where bp.job_id = p_job_id
            and bp.professional_id = auth.uid()
            and bp.status = 'paid'
        )
        into v_paid;

        if not v_paid then
          raise exception 'Service address is locked until required payment is completed';
        end if;

        return query
        select
          d.job_id,
          d.service_address_line1,
          d.service_address_line2,
          d.service_city,
          d.service_state,
          d.service_postal_code,
          d.access_notes
        from public.job_private_details d
        where d.job_id = p_job_id;

        return;
      end if;

      raise exception 'You cannot access private details for this job';
    end;
    $function$;
revoke all on function korvo_api_private.get_job_private_details(p_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.get_job_private_details(p_job_id uuid) to authenticated;
create or replace function public.get_job_private_details(p_job_id uuid)
returns TABLE(job_id uuid, service_address_line1 text, service_address_line2 text, service_city text, service_state text, service_postal_code text, access_notes text)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.get_job_private_details(p_job_id); $wrapper$;
revoke all on function public.get_job_private_details(p_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_job_private_details(p_job_id uuid) to authenticated;

-- Reviewed API: get_professional_trust_summary; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.get_professional_trust_summary(p_professional_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
      select jsonb_build_object(
        'professional_id', pp.id,
        'verification_status',
          public.current_professional_verification_status(pp.id),
        'completed_jobs', (
          select count(*)
          from public.active_jobs aj
          where aj.professional_id = pp.id
            and aj.status = 'completed'
        ),
        'review_count', (
          select count(*)
          from public.reviews r
          where r.professional_id = pp.id
        ),
        'average_rating', (
          select
            case
              when count(*) = 0 then null
              else round(avg(r.rating)::numeric, 2)
            end
          from public.reviews r
          where r.professional_id = pp.id
        ),
        'badges', coalesce((
          select jsonb_agg(
            jsonb_build_object(
              'code', b.badge_code,
              'name', d.name,
              'description', d.description,
              'awarded_at', b.awarded_at,
              'expires_at', b.expires_at
            )
            order by b.awarded_at
          )
          from public.professional_badges b
          join public.professional_badge_definitions d
            on d.code = b.badge_code
          where b.professional_id = pp.id
            and b.revoked_at is null
            and (b.expires_at is null or b.expires_at > now())
            and d.is_public = true
            and d.is_active = true
        ), '[]'::jsonb)
      )
      from public.professional_profiles pp
      join public.profiles p
        on p.id = pp.id
      where auth.uid() is not null
        and exists (select 1 from auth.users u where u.id = auth.uid())
        and not public.is_blocked_between(auth.uid(), pp.id)
        and p.onboarding_complete = true
        and pp.id = p_professional_id
        and pp.is_public = true
        and p.is_active = true
        and p.account_type = 'professional';
    $function$;
revoke all on function korvo_api_private.get_professional_trust_summary(p_professional_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.get_professional_trust_summary(p_professional_id uuid) to authenticated;
create or replace function public.get_professional_trust_summary(p_professional_id uuid)
returns jsonb
language sql stable security invoker set search_path = ''
as $wrapper$ select korvo_api_private.get_professional_trust_summary(p_professional_id); $wrapper$;
revoke all on function public.get_professional_trust_summary(p_professional_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.get_professional_trust_summary(p_professional_id uuid) to authenticated;

-- Internal only: is_blocked_between.
revoke all on function public.is_blocked_between(p_user_a uuid, p_user_b uuid) from public, anon, authenticated, service_role;
alter function public.is_blocked_between(p_user_a uuid, p_user_b uuid) set search_path = '';

-- Internal only: is_korvo_action_allowed.
revoke all on function public.is_korvo_action_allowed(p_user_id uuid, p_action text) from public, anon, authenticated, service_role;
alter function public.is_korvo_action_allowed(p_user_id uuid, p_action text) set search_path = '';

-- Reviewed API: is_korvo_admin; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.is_korvo_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
      select exists (
        select 1
        from public.platform_admins pa
        join public.profiles p on p.id = pa.user_id
        join auth.users u on u.id = pa.user_id
        where pa.user_id = auth.uid()
          and pa.is_active = true
          and p.is_active = true
      );
    $function$;
revoke all on function korvo_api_private.is_korvo_admin() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.is_korvo_admin() to authenticated;
create or replace function public.is_korvo_admin()
returns boolean
language sql stable security invoker set search_path = ''
as $wrapper$ select korvo_api_private.is_korvo_admin(); $wrapper$;
revoke all on function public.is_korvo_admin() from public, anon, authenticated, service_role;
grant execute on function public.is_korvo_admin() to authenticated;

-- Reviewed API: job_recommended_professionals; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.job_recommended_professionals(p_job_id uuid, p_limit integer DEFAULT 25)
 RETURNS TABLE(professional_id uuid, business_name text, match_score integer, verification_status text, completed_jobs integer, review_count integer, average_rating numeric, preferred_area_match boolean, exact_service_match boolean, catalog_category_match boolean, can_quote boolean, reason_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_job public.jobs%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_job
      from public.jobs
      where id = p_job_id;

      if not found then
        raise exception 'Job not found';
      end if;

      if v_job.customer_id <> auth.uid()
         and not public.is_korvo_admin() then
        raise exception 'You cannot view recommendations for this job';
      end if;

      return query
      select
        pp.id,
        pp.business_name,
        (m.details->>'match_score')::integer,
        m.details->>'verification_status',
        (m.details->>'completed_jobs')::integer,
        (m.details->>'review_count')::integer,
        nullif(m.details->>'average_rating','')::numeric,
        coalesce((m.details->>'preferred_area_match')::boolean, false),
        coalesce((m.details->>'exact_service_match')::boolean, false),
        coalesce((m.details->>'catalog_category_match')::boolean, false),
        coalesce((m.details->>'can_quote')::boolean, false),
        m.details->>'reason_code'
      from public.professional_profiles pp
      join public.profiles p on p.id = pp.id
      cross join lateral (
        select public.professional_job_match_details(pp.id, v_job.id) as details
      ) m
      where not public.is_blocked_between(v_job.customer_id, pp.id)
        and p.account_type = 'professional'
        and coalesce(p.is_active, true) = true
        and coalesce(p.onboarding_complete, false) = true
        and coalesce(pp.is_public, true) = true
        and coalesce((m.details->>'service_match')::boolean, false) = true
      order by
        (m.details->>'match_score')::integer desc,
        pp.created_at asc
      limit least(greatest(coalesce(p_limit, 25), 1), 100);
    end;
    $function$;
revoke all on function korvo_api_private.job_recommended_professionals(p_job_id uuid, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.job_recommended_professionals(p_job_id uuid, p_limit integer) to authenticated;
create or replace function public.job_recommended_professionals(p_job_id uuid, p_limit integer DEFAULT 25)
returns TABLE(professional_id uuid, business_name text, match_score integer, verification_status text, completed_jobs integer, review_count integer, average_rating numeric, preferred_area_match boolean, exact_service_match boolean, catalog_category_match boolean, can_quote boolean, reason_code text)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.job_recommended_professionals(p_job_id, p_limit); $wrapper$;
revoke all on function public.job_recommended_professionals(p_job_id uuid, p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.job_recommended_professionals(p_job_id uuid, p_limit integer) to authenticated;

revoke all on function public.link_conversation_to_active_job() from public, anon, authenticated, service_role;
alter function public.link_conversation_to_active_job() set search_path = '';

-- Reviewed API: mark_all_notifications_read; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.mark_all_notifications_read()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_count integer;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      update public.notifications
      set read_at = now()
      where user_id = auth.uid()
        and read_at is null;

      get diagnostics v_count = row_count;

      return v_count;
    end;
    $function$;
revoke all on function korvo_api_private.mark_all_notifications_read() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.mark_all_notifications_read() to authenticated;
create or replace function public.mark_all_notifications_read()
returns integer
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.mark_all_notifications_read(); $wrapper$;
revoke all on function public.mark_all_notifications_read() from public, anon, authenticated, service_role;
grant execute on function public.mark_all_notifications_read() to authenticated;

-- Reviewed API: mark_conversation_read; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.mark_conversation_read(p_conversation_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_conversation public.conversations%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_conversation
      from public.conversations
      where id = p_conversation_id
      for update;

      if not found then
        raise exception 'Conversation not found';
      end if;

      if auth.uid() = v_conversation.customer_id then
        update public.conversations
        set customer_last_read_at = now()
        where id = p_conversation_id;
      elsif auth.uid() = v_conversation.professional_id then
        update public.conversations
        set professional_last_read_at = now()
        where id = p_conversation_id;
      else
        raise exception 'You cannot access this conversation';
      end if;

      return jsonb_build_object(
        'conversation_id', p_conversation_id,
        'read_at', now()
      );
    end;
    $function$;
revoke all on function korvo_api_private.mark_conversation_read(p_conversation_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.mark_conversation_read(p_conversation_id uuid) to authenticated;
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.mark_conversation_read(p_conversation_id); $wrapper$;
revoke all on function public.mark_conversation_read(p_conversation_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.mark_conversation_read(p_conversation_id uuid) to authenticated;

-- Reviewed API: mark_notification_read; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.mark_notification_read(p_notification_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_updated integer;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      update public.notifications
      set read_at = coalesce(read_at, now())
      where id = p_notification_id
        and user_id = auth.uid();

      get diagnostics v_updated = row_count;

      return v_updated = 1;
    end;
    $function$;
revoke all on function korvo_api_private.mark_notification_read(p_notification_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.mark_notification_read(p_notification_id uuid) to authenticated;
create or replace function public.mark_notification_read(p_notification_id uuid)
returns boolean
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.mark_notification_read(p_notification_id); $wrapper$;
revoke all on function public.mark_notification_read(p_notification_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.mark_notification_read(p_notification_id uuid) to authenticated;

-- Reviewed API: my_job_match_feed; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.my_job_match_feed(p_limit integer DEFAULT 50)
 RETURNS TABLE(job_id uuid, job_reference text, title text, category text, city text, state text, budget_min numeric, budget_max numeric, preferred_date date, timeframe text, created_at timestamp with time zone, match_score integer, exact_service_match boolean, catalog_category_match boolean, preferred_area_match boolean, same_city_match boolean, verification_status text, can_quote boolean, reason_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      if not exists (
        select 1
        from public.profiles p
        where p.id = auth.uid()
          and p.account_type = 'professional'
          and p.is_active = true
          and p.onboarding_complete = true
      ) then
        raise exception 'Professional account required';
      end if;

      return query
      select
        j.id,
        j.reference,
        j.title,
        j.category,
        j.city,
        j.state,
        j.budget_min,
        j.budget_max,
        j.preferred_date,
        j.timeframe,
        j.created_at,
        (m.details->>'match_score')::integer,
        coalesce((m.details->>'exact_service_match')::boolean, false),
        coalesce((m.details->>'catalog_category_match')::boolean, false),
        coalesce((m.details->>'preferred_area_match')::boolean, false),
        coalesce((m.details->>'same_city_match')::boolean, false),
        m.details->>'verification_status',
        coalesce((m.details->>'can_quote')::boolean, false),
        m.details->>'reason_code'
      from public.jobs j
      cross join lateral (
        select public.professional_job_match_details(auth.uid(), j.id) as details
      ) m
      where j.status = 'open'
        and not public.is_blocked_between(auth.uid(), j.customer_id)
        and coalesce((m.details->>'service_match')::boolean, false) = true
        and not exists (
          select 1
          from public.quotes q
          where q.job_id = j.id
            and q.professional_id = auth.uid()
        )
      order by
        (m.details->>'match_score')::integer desc,
        j.created_at desc
      limit least(greatest(coalesce(p_limit, 50), 1), 100);
    end;
    $function$;
revoke all on function korvo_api_private.my_job_match_feed(p_limit integer) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.my_job_match_feed(p_limit integer) to authenticated;
create or replace function public.my_job_match_feed(p_limit integer DEFAULT 50)
returns TABLE(job_id uuid, job_reference text, title text, category text, city text, state text, budget_min numeric, budget_max numeric, preferred_date date, timeframe text, created_at timestamp with time zone, match_score integer, exact_service_match boolean, catalog_category_match boolean, preferred_area_match boolean, same_city_match boolean, verification_status text, can_quote boolean, reason_code text)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.my_job_match_feed(p_limit); $wrapper$;
revoke all on function public.my_job_match_feed(p_limit integer) from public, anon, authenticated, service_role;
grant execute on function public.my_job_match_feed(p_limit integer) to authenticated;

-- Reviewed API: my_professional_membership; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.my_professional_membership()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      if not exists (
        select 1
        from public.professional_profiles pp
        where pp.id = auth.uid()
      ) then
        raise exception 'Professional account required';
      end if;

      return public.professional_membership_snapshot_internal(auth.uid());
    end;
    $function$;
revoke all on function korvo_api_private.my_professional_membership() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.my_professional_membership() to authenticated;
create or replace function public.my_professional_membership()
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.my_professional_membership(); $wrapper$;
revoke all on function public.my_professional_membership() from public, anon, authenticated, service_role;
grant execute on function public.my_professional_membership() to authenticated;

-- Reviewed API: my_professional_verifications; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.my_professional_verifications()
 RETURNS TABLE(verification_id uuid, verification_type text, status text, jurisdiction text, credential_last4 text, user_status_message text, submitted_at timestamp with time zone, reviewed_at timestamp with time zone, verified_at timestamp with time zone, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      return query
      select
        v.id,
        v.verification_type,
        v.status,
        v.jurisdiction,
        v.credential_last4,
        v.user_status_message,
        v.submitted_at,
        v.reviewed_at,
        v.verified_at,
        v.expires_at
      from public.professional_verifications v
      where v.professional_id = auth.uid()
      order by v.created_at desc;
    end;
    $function$;
revoke all on function korvo_api_private.my_professional_verifications() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.my_professional_verifications() to authenticated;
create or replace function public.my_professional_verifications()
returns TABLE(verification_id uuid, verification_type text, status text, jurisdiction text, credential_last4 text, user_status_message text, submitted_at timestamp with time zone, reviewed_at timestamp with time zone, verified_at timestamp with time zone, expires_at timestamp with time zone)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.my_professional_verifications(); $wrapper$;
revoke all on function public.my_professional_verifications() from public, anon, authenticated, service_role;
grant execute on function public.my_professional_verifications() to authenticated;

revoke all on function public.normalize_admin_issue_resolution_actor() from public, anon, authenticated, service_role;
alter function public.normalize_admin_issue_resolution_actor() set search_path = '';

revoke all on function public.notify_on_active_job_status_change() from public, anon, authenticated, service_role;
alter function public.notify_on_active_job_status_change() set search_path = '';

revoke all on function public.notify_on_booking_payment_status_change() from public, anon, authenticated, service_role;
alter function public.notify_on_booking_payment_status_change() set search_path = '';

revoke all on function public.notify_on_issue_message_insert() from public, anon, authenticated, service_role;
alter function public.notify_on_issue_message_insert() set search_path = '';

revoke all on function public.notify_on_message_insert() from public, anon, authenticated, service_role;
alter function public.notify_on_message_insert() set search_path = '';

revoke all on function public.notify_on_quote_insert() from public, anon, authenticated, service_role;
alter function public.notify_on_quote_insert() set search_path = '';

revoke all on function public.notify_on_quote_status_change() from public, anon, authenticated, service_role;
alter function public.notify_on_quote_status_change() set search_path = '';

revoke all on function public.notify_on_review_insert() from public, anon, authenticated, service_role;
alter function public.notify_on_review_insert() set search_path = '';

-- Reviewed API: open_project_issue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.open_project_issue(p_active_job_id uuid, p_issue_type text, p_description text, p_requested_resolution text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_active_job public.active_jobs%rowtype;
      v_issue_type text;
      v_description text;
      v_requested_resolution text;
      v_role text;
      v_issue_id uuid;
      v_recipient uuid;
      v_has_paid_payment boolean := false;
      v_payment_review boolean := false;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      v_issue_type := lower(trim(coalesce(p_issue_type, '')));
      v_description := trim(coalesce(p_description, ''));
      v_requested_resolution :=
        nullif(left(trim(coalesce(p_requested_resolution, '')), 1000), '');

      if v_issue_type not in (
        'completion_dispute',
        'quality_issue',
        'damage',
        'safety',
        'payment_refund',
        'other'
      ) then
        raise exception 'Invalid issue type';
      end if;

      if length(v_description) < 5 or length(v_description) > 3000 then
        raise exception 'Issue description must be between 5 and 3000 characters';
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where id = p_active_job_id
      for update;

      if not found then
        raise exception 'Active job not found';
      end if;

      if auth.uid() = v_active_job.customer_id then
        v_role := 'customer';
        v_recipient := v_active_job.professional_id;
      elsif auth.uid() = v_active_job.professional_id then
        v_role := 'professional';
        v_recipient := v_active_job.customer_id;
      else
        raise exception 'You cannot open an issue for this job';
      end if;

      if v_active_job.status not in ('active','pending_confirmation') then
        raise exception 'This job is not eligible for a new issue';
      end if;

      if v_issue_type = 'completion_dispute'
         and (
           v_role <> 'customer'
           or v_active_job.status <> 'pending_confirmation'
         ) then
        raise exception 'Completion disputes can only be opened by the customer while completion is awaiting confirmation';
      end if;

      if exists (
        select 1
        from public.project_issues pi
        where pi.active_job_id = v_active_job.id
          and pi.status in ('open','under_review')
      ) then
        raise exception 'This job already has an open issue';
      end if;

      select exists (
        select 1
        from public.booking_payments bp
        where bp.active_job_id = v_active_job.id
          and bp.status in ('paid','partially_refunded','chargeback')
      )
      into v_has_paid_payment;

      v_payment_review :=
        v_issue_type = 'payment_refund'
        and v_has_paid_payment;

      insert into public.project_issues (
        active_job_id,
        job_id,
        quote_id,
        customer_id,
        professional_id,
        opened_by,
        opened_by_role,
        issue_type,
        status,
        description,
        requested_resolution,
        payment_review_required,
        previous_active_job_status,
        created_at,
        updated_at
      )
      values (
        v_active_job.id,
        v_active_job.job_id,
        v_active_job.quote_id,
        v_active_job.customer_id,
        v_active_job.professional_id,
        auth.uid(),
        v_role,
        v_issue_type,
        'open',
        v_description,
        v_requested_resolution,
        v_payment_review,
        v_active_job.status,
        now(),
        now()
      )
      returning id
      into v_issue_id;

      update public.active_jobs
      set
        status = 'disputed',
        updated_at = now()
      where id = v_active_job.id;

      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        job_id,
        quote_id,
        active_job_id
      )
      values (
        v_recipient,
        'issue_opened',
        'Project Issue Opened',
        'An issue was opened for "' || v_active_job.job_title || '".',
        v_active_job.job_id,
        v_active_job.quote_id,
        v_active_job.id
      );

      return jsonb_build_object(
        'issue_id', v_issue_id,
        'active_job_id', v_active_job.id,
        'job_id', v_active_job.job_id,
        'issue_type', v_issue_type,
        'status', 'open',
        'job_status', 'disputed',
        'previous_job_status', v_active_job.status,
        'payment_review_required', v_payment_review
      );
    end;
    $function$;
revoke all on function korvo_api_private.open_project_issue(p_active_job_id uuid, p_issue_type text, p_description text, p_requested_resolution text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.open_project_issue(p_active_job_id uuid, p_issue_type text, p_description text, p_requested_resolution text) to authenticated;
create or replace function public.open_project_issue(p_active_job_id uuid, p_issue_type text, p_description text, p_requested_resolution text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.open_project_issue(p_active_job_id, p_issue_type, p_description, p_requested_resolution); $wrapper$;
revoke all on function public.open_project_issue(p_active_job_id uuid, p_issue_type text, p_description text, p_requested_resolution text) from public, anon, authenticated, service_role;
grant execute on function public.open_project_issue(p_active_job_id uuid, p_issue_type text, p_description text, p_requested_resolution text) to authenticated;

-- Internal only: prepare_booking_payment.
revoke all on function public.prepare_booking_payment(p_active_job_id uuid) from public, anon, authenticated, service_role;
alter function public.prepare_booking_payment(p_active_job_id uuid) set search_path = '';

revoke all on function public.prepare_quote_insert() from public, anon, authenticated, service_role;
alter function public.prepare_quote_insert() set search_path = '';

