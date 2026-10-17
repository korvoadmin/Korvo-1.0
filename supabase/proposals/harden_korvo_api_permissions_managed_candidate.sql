-- Audited incremental hardening of the existing Korvo database.
-- No user data is deleted. Legacy fee-only preparation stays disabled; the new marketplace RPCs and server grants are preserved.
set lock_timeout = '5s';
create schema if not exists korvo_api_private;
revoke all on schema korvo_api_private from public, anon, authenticated, service_role;
grant usage on schema korvo_api_private to authenticated;
revoke create on schema public from public, anon, authenticated;
alter default privileges for role postgres revoke execute on functions from public;
alter default privileges for role postgres in schema public revoke execute on functions from anon, authenticated, service_role;
alter default privileges for role postgres in schema korvo_api_private revoke execute on functions from public, anon, authenticated, service_role;

-- Reviewed API: admin_add_account_restriction; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_add_account_restriction(p_user_id uuid, p_restriction_type text, p_reason text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_source_strike_id uuid DEFAULT NULL::uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_type text := lower(trim(coalesce(p_restriction_type, '')));
      v_reason text := trim(coalesce(p_reason, ''));
      v_id uuid;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_type not in (
        'messaging_disabled',
        'posting_disabled',
        'quoting_disabled',
        'suspended'
      ) then
        raise exception 'Invalid restriction type';
      end if;

      if length(v_reason) < 5 or length(v_reason) > 3000 then
        raise exception 'Restriction reason must be between 5 and 3000 characters';
      end if;

      if not exists (
        select 1
        from public.profiles p
        where p.id = p_user_id
      ) then
        raise exception 'User not found';
      end if;

      update public.account_restrictions
      set
        status = case
          when expires_at is not null and expires_at <= now()
            then 'expired'
          else status
        end,
        updated_at = now()
      where user_id = p_user_id
        and restriction_type = v_type
        and status = 'active'
        and expires_at is not null
        and expires_at <= now();

      insert into public.account_restrictions (
        user_id,
        restriction_type,
        reason,
        status,
        source_strike_id,
        created_by_admin_id,
        expires_at
      )
      values (
        p_user_id,
        v_type,
        v_reason,
        'active',
        p_source_strike_id,
        auth.uid(),
        p_expires_at
      )
      on conflict (user_id, restriction_type)
        where status = 'active'
      do update
      set
        reason = excluded.reason,
        source_strike_id = coalesce(excluded.source_strike_id, account_restrictions.source_strike_id),
        created_by_admin_id = excluded.created_by_admin_id,
        expires_at = excluded.expires_at,
        updated_at = now()
      returning id
      into v_id;

      insert into public.notifications (
        user_id,
        type,
        title,
        body
      )
      values (
        p_user_id,
        'account_restricted',
        'Korvo Account Restriction',
        'A Trust & Safety restriction was applied to your Korvo account.'
      );

      return v_id;
    end;
    $function$;
revoke all on function korvo_api_private.admin_add_account_restriction(p_user_id uuid, p_restriction_type text, p_reason text, p_expires_at timestamp with time zone, p_source_strike_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_add_account_restriction(p_user_id uuid, p_restriction_type text, p_reason text, p_expires_at timestamp with time zone, p_source_strike_id uuid) to authenticated;
create or replace function public.admin_add_account_restriction(p_user_id uuid, p_restriction_type text, p_reason text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone, p_source_strike_id uuid DEFAULT NULL::uuid)
returns uuid
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_add_account_restriction(p_user_id, p_restriction_type, p_reason, p_expires_at, p_source_strike_id); $wrapper$;
revoke all on function public.admin_add_account_restriction(p_user_id uuid, p_restriction_type text, p_reason text, p_expires_at timestamp with time zone, p_source_strike_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_add_account_restriction(p_user_id uuid, p_restriction_type text, p_reason text, p_expires_at timestamp with time zone, p_source_strike_id uuid) to authenticated;

-- Reviewed API: admin_add_account_strike; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_add_account_strike(p_user_id uuid, p_category text, p_reason text, p_points integer DEFAULT 1, p_source_report_id uuid DEFAULT NULL::uuid, p_source_moderation_event_id uuid DEFAULT NULL::uuid, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_category text := lower(trim(coalesce(p_category, '')));
      v_reason text := trim(coalesce(p_reason, ''));
      v_strike_id uuid;
      v_points_total integer;
      v_restriction_id uuid;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_category not in (
        'harassment',
        'spam',
        'off_platform',
        'contact_sharing',
        'payment_solicitation',
        'fraud',
        'unsafe_behavior',
        'inappropriate_content',
        'other'
      ) then
        raise exception 'Invalid strike category';
      end if;

      if length(v_reason) < 5 or length(v_reason) > 3000 then
        raise exception 'Strike reason must be between 5 and 3000 characters';
      end if;

      if p_points < 1 or p_points > 3 then
        raise exception 'Strike points must be between 1 and 3';
      end if;

      if not exists (
        select 1
        from public.profiles p
        where p.id = p_user_id
      ) then
        raise exception 'User not found';
      end if;

      insert into public.account_strikes (
        user_id,
        category,
        reason,
        points,
        status,
        source_report_id,
        source_moderation_event_id,
        issued_by_admin_id,
        expires_at
      )
      values (
        p_user_id,
        v_category,
        v_reason,
        p_points,
        'active',
        p_source_report_id,
        p_source_moderation_event_id,
        auth.uid(),
        p_expires_at
      )
      returning id
      into v_strike_id;

      select coalesce(sum(s.points), 0)::integer
      into v_points_total
      from public.account_strikes s
      where s.user_id = p_user_id
        and s.status = 'active'
        and (s.expires_at is null or s.expires_at > now());

      insert into public.notifications (
        user_id,
        type,
        title,
        body
      )
      values (
        p_user_id,
        'account_warning',
        'Korvo Trust & Safety Warning',
        'A Trust & Safety strike was added to your Korvo account.'
      );

      if v_points_total >= 3 then
        v_restriction_id :=
          public.admin_add_account_restriction(
            p_user_id,
            'suspended',
            'Automatic suspension after reaching 3 active Trust & Safety strike points.',
            null,
            v_strike_id
          );
      end if;

      return jsonb_build_object(
        'strike_id', v_strike_id,
        'active_strike_points', v_points_total,
        'suspended', v_points_total >= 3,
        'restriction_id', v_restriction_id
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_add_account_strike(p_user_id uuid, p_category text, p_reason text, p_points integer, p_source_report_id uuid, p_source_moderation_event_id uuid, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_add_account_strike(p_user_id uuid, p_category text, p_reason text, p_points integer, p_source_report_id uuid, p_source_moderation_event_id uuid, p_expires_at timestamp with time zone) to authenticated;
create or replace function public.admin_add_account_strike(p_user_id uuid, p_category text, p_reason text, p_points integer DEFAULT 1, p_source_report_id uuid DEFAULT NULL::uuid, p_source_moderation_event_id uuid DEFAULT NULL::uuid, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_add_account_strike(p_user_id, p_category, p_reason, p_points, p_source_report_id, p_source_moderation_event_id, p_expires_at); $wrapper$;
revoke all on function public.admin_add_account_strike(p_user_id uuid, p_category text, p_reason text, p_points integer, p_source_report_id uuid, p_source_moderation_event_id uuid, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.admin_add_account_strike(p_user_id uuid, p_category text, p_reason text, p_points integer, p_source_report_id uuid, p_source_moderation_event_id uuid, p_expires_at timestamp with time zone) to authenticated;

-- Reviewed API: admin_add_issue_note; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_add_issue_note(p_issue_id uuid, p_note text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_note text;
      v_note_id uuid;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      v_note := trim(coalesce(p_note, ''));

      if length(v_note) < 1 or length(v_note) > 5000 then
        raise exception 'Admin note must be between 1 and 5000 characters';
      end if;

      if not exists (
        select 1
        from public.project_issues
        where id = p_issue_id
      ) then
        raise exception 'Issue not found';
      end if;

      insert into public.project_issue_admin_notes (
        issue_id,
        admin_id,
        note
      )
      values (
        p_issue_id,
        auth.uid(),
        v_note
      )
      returning id into v_note_id;

      update public.project_issues
      set updated_at = now()
      where id = p_issue_id;

      return v_note_id;
    end;
    $function$;
revoke all on function korvo_api_private.admin_add_issue_note(p_issue_id uuid, p_note text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_add_issue_note(p_issue_id uuid, p_note text) to authenticated;
create or replace function public.admin_add_issue_note(p_issue_id uuid, p_note text)
returns uuid
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_add_issue_note(p_issue_id, p_note); $wrapper$;
revoke all on function public.admin_add_issue_note(p_issue_id uuid, p_note text) from public, anon, authenticated, service_role;
grant execute on function public.admin_add_issue_note(p_issue_id uuid, p_note text) to authenticated;

-- Reviewed API: admin_claim_project_issue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_claim_project_issue(p_issue_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_issue public.project_issues%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      select *
      into v_issue
      from public.project_issues
      where id = p_issue_id
      for update;

      if not found then
        raise exception 'Issue not found';
      end if;

      if v_issue.status not in ('open','under_review') then
        raise exception 'This issue is already closed';
      end if;

      if v_issue.assigned_admin_id is not null
         and v_issue.assigned_admin_id <> auth.uid() then
        raise exception 'This issue is already assigned to another admin';
      end if;

      update public.project_issues
      set
        status = 'under_review',
        assigned_admin_id = auth.uid(),
        assigned_at = coalesce(assigned_at, now()),
        updated_at = now()
      where id = v_issue.id;

      return jsonb_build_object(
        'issue_id', v_issue.id,
        'status', 'under_review',
        'assigned_admin_id', auth.uid()
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_claim_project_issue(p_issue_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_claim_project_issue(p_issue_id uuid) to authenticated;
create or replace function public.admin_claim_project_issue(p_issue_id uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_claim_project_issue(p_issue_id); $wrapper$;
revoke all on function public.admin_claim_project_issue(p_issue_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_claim_project_issue(p_issue_id uuid) to authenticated;

-- Reviewed API: admin_claim_safety_report; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_claim_safety_report(p_report_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_report public.trust_safety_reports%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      select *
      into v_report
      from public.trust_safety_reports
      where id = p_report_id
      for update;

      if not found then
        raise exception 'Safety report not found';
      end if;

      if v_report.status not in ('open','under_review') then
        raise exception 'This report is already closed';
      end if;

      if v_report.assigned_admin_id is not null
         and v_report.assigned_admin_id <> auth.uid() then
        raise exception 'This report is already assigned to another admin';
      end if;

      update public.trust_safety_reports
      set
        status = 'under_review',
        assigned_admin_id = auth.uid(),
        updated_at = now()
      where id = v_report.id;

      insert into public.trust_safety_audit_log (
        subject_user_id,
        report_id,
        actor_user_id,
        actor_kind,
        action,
        details
      )
      values (
        v_report.reported_user_id,
        v_report.id,
        auth.uid(),
        'admin',
        'report_claimed',
        jsonb_build_object(
          'assigned_admin_id', auth.uid()
        )
      );

      return jsonb_build_object(
        'report_id', v_report.id,
        'status', 'under_review',
        'assigned_admin_id', auth.uid()
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_claim_safety_report(p_report_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_claim_safety_report(p_report_id uuid) to authenticated;
create or replace function public.admin_claim_safety_report(p_report_id uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_claim_safety_report(p_report_id); $wrapper$;
revoke all on function public.admin_claim_safety_report(p_report_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.admin_claim_safety_report(p_report_id uuid) to authenticated;

-- Reviewed API: admin_decide_payment_review; authorization remains inside the private implementation.
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
revoke all on function korvo_api_private.admin_decide_payment_review(p_payment_review_id uuid, p_decision text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_decide_payment_review(p_payment_review_id uuid, p_decision text, p_notes text) to authenticated;
create or replace function public.admin_decide_payment_review(p_payment_review_id uuid, p_decision text, p_notes text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_decide_payment_review(p_payment_review_id, p_decision, p_notes); $wrapper$;
revoke all on function public.admin_decide_payment_review(p_payment_review_id uuid, p_decision text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.admin_decide_payment_review(p_payment_review_id uuid, p_decision text, p_notes text) to authenticated;

-- Reviewed API: admin_issue_queue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_issue_queue()
 RETURNS TABLE(issue_id uuid, active_job_id uuid, job_id uuid, job_title text, issue_type text, issue_status text, opened_by_role text, description text, requested_resolution text, payment_review_required boolean, assigned_admin_id uuid, evidence_count bigint, payment_review_status text, created_at timestamp with time zone, updated_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      return query
      select
        pi.id,
        pi.active_job_id,
        pi.job_id,
        aj.job_title,
        pi.issue_type,
        pi.status,
        pi.opened_by_role,
        pi.description,
        pi.requested_resolution,
        pi.payment_review_required,
        pi.assigned_admin_id,
        (
          select count(*)
          from public.project_issue_evidence e
          where e.issue_id = pi.id
        ) as evidence_count,
        pr.status as payment_review_status,
        pi.created_at,
        pi.updated_at
      from public.project_issues pi
      join public.active_jobs aj
        on aj.id = pi.active_job_id
      left join public.payment_reviews pr
        on pr.issue_id = pi.id
      where pi.status in ('open','under_review')
      order by
        case
          when pi.issue_type = 'safety' then 0
          when pi.payment_review_required then 1
          else 2
        end,
        pi.created_at asc;
    end;
    $function$;
revoke all on function korvo_api_private.admin_issue_queue() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_issue_queue() to authenticated;
create or replace function public.admin_issue_queue()
returns TABLE(issue_id uuid, active_job_id uuid, job_id uuid, job_title text, issue_type text, issue_status text, opened_by_role text, description text, requested_resolution text, payment_review_required boolean, assigned_admin_id uuid, evidence_count bigint, payment_review_status text, created_at timestamp with time zone, updated_at timestamp with time zone)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.admin_issue_queue(); $wrapper$;
revoke all on function public.admin_issue_queue() from public, anon, authenticated, service_role;
grant execute on function public.admin_issue_queue() to authenticated;

-- Reviewed API: admin_lift_account_restriction; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_lift_account_restriction(p_restriction_id uuid, p_note text DEFAULT NULL::text)
 RETURNS boolean
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

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      update public.account_restrictions
      set
        status = 'lifted',
        lifted_by_admin_id = auth.uid(),
        lifted_at = now(),
        updated_at = now(),
        reason = case
          when nullif(trim(coalesce(p_note, '')), '') is null
            then reason
          else reason || E'\nLift note: ' || left(trim(p_note), 1000)
        end
      where id = p_restriction_id
        and status = 'active';

      get diagnostics v_count = row_count;

      return v_count = 1;
    end;
    $function$;
revoke all on function korvo_api_private.admin_lift_account_restriction(p_restriction_id uuid, p_note text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_lift_account_restriction(p_restriction_id uuid, p_note text) to authenticated;
create or replace function public.admin_lift_account_restriction(p_restriction_id uuid, p_note text DEFAULT NULL::text)
returns boolean
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_lift_account_restriction(p_restriction_id, p_note); $wrapper$;
revoke all on function public.admin_lift_account_restriction(p_restriction_id uuid, p_note text) from public, anon, authenticated, service_role;
grant execute on function public.admin_lift_account_restriction(p_restriction_id uuid, p_note text) to authenticated;

-- Reviewed API: admin_message_moderation_queue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_message_moderation_queue()
 RETURNS TABLE(moderation_event_id uuid, sender_id uuid, conversation_id uuid, message_id uuid, action text, rule_code text, attempted_body text, review_status text, active_strike_points integer, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      return query
      select
        me.id,
        me.user_id,
        me.conversation_id,
        me.message_id,
        me.action,
        me.rule_code,
        me.attempted_body,
        me.review_status,
        coalesce((
          select sum(s.points)::integer
          from public.account_strikes s
          where s.user_id = me.user_id
            and s.status = 'active'
            and (s.expires_at is null or s.expires_at > now())
        ), 0) as active_strike_points,
        me.created_at
      from public.message_moderation_events me
      where me.review_status = 'pending'
      order by
        case me.action
          when 'blocked' then 0
          else 1
        end,
        me.created_at asc;
    end;
    $function$;
revoke all on function korvo_api_private.admin_message_moderation_queue() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_message_moderation_queue() to authenticated;
create or replace function public.admin_message_moderation_queue()
returns TABLE(moderation_event_id uuid, sender_id uuid, conversation_id uuid, message_id uuid, action text, rule_code text, attempted_body text, review_status text, active_strike_points integer, created_at timestamp with time zone)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.admin_message_moderation_queue(); $wrapper$;
revoke all on function public.admin_message_moderation_queue() from public, anon, authenticated, service_role;
grant execute on function public.admin_message_moderation_queue() to authenticated;

-- Reviewed API: admin_professional_verification_queue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_professional_verification_queue()
 RETURNS TABLE(verification_id uuid, professional_id uuid, professional_name text, business_name text, verification_type text, status text, jurisdiction text, credential_last4 text, submitted_at timestamp with time zone, provider text, expires_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      return query
      select
        v.id,
        v.professional_id,
        trim(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, '')),
        pp.business_name,
        v.verification_type,
        v.status,
        v.jurisdiction,
        v.credential_last4,
        v.submitted_at,
        v.provider,
        v.expires_at
      from public.professional_verifications v
      join public.profiles p
        on p.id = v.professional_id
      join public.professional_profiles pp
        on pp.id = v.professional_id
      where v.status in ('pending','in_review')
      order by v.submitted_at asc;
    end;
    $function$;
revoke all on function korvo_api_private.admin_professional_verification_queue() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_professional_verification_queue() to authenticated;
create or replace function public.admin_professional_verification_queue()
returns TABLE(verification_id uuid, professional_id uuid, professional_name text, business_name text, verification_type text, status text, jurisdiction text, credential_last4 text, submitted_at timestamp with time zone, provider text, expires_at timestamp with time zone)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.admin_professional_verification_queue(); $wrapper$;
revoke all on function public.admin_professional_verification_queue() from public, anon, authenticated, service_role;
grant execute on function public.admin_professional_verification_queue() to authenticated;

-- Reviewed API: admin_release_professional_job_usage; authorization remains inside the private implementation.
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
revoke all on function korvo_api_private.admin_release_professional_job_usage(p_active_job_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_release_professional_job_usage(p_active_job_id uuid, p_reason text) to authenticated;
create or replace function public.admin_release_professional_job_usage(p_active_job_id uuid, p_reason text)
returns boolean
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_release_professional_job_usage(p_active_job_id, p_reason); $wrapper$;
revoke all on function public.admin_release_professional_job_usage(p_active_job_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function public.admin_release_professional_job_usage(p_active_job_id uuid, p_reason text) to authenticated;

-- Reviewed API: admin_resolve_message_moderation; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_resolve_message_moderation(p_moderation_event_id uuid, p_action text, p_notes text DEFAULT NULL::text, p_strike_points integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_event public.message_moderation_events%rowtype;
      v_action text := lower(trim(coalesce(p_action, '')));
      v_notes text := nullif(left(trim(coalesce(p_notes, '')), 3000), '');
      v_category text;
      v_strike jsonb;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_action not in ('dismiss','warn','strike') then
        raise exception 'Invalid moderation resolution action';
      end if;

      select *
      into v_event
      from public.message_moderation_events
      where id = p_moderation_event_id
      for update;

      if not found then
        raise exception 'Moderation event not found';
      end if;

      if v_event.review_status <> 'pending' then
        raise exception 'This moderation event is already reviewed';
      end if;

      v_category :=
        case
          when v_event.rule_code in ('email_address','phone_number','street_address')
            then 'contact_sharing'
          when v_event.rule_code = 'off_platform_payment'
            then 'payment_solicitation'
          when v_event.rule_code in ('external_link','possible_off_platform_contact')
            then 'off_platform'
          else 'other'
        end;

      if v_action = 'strike' then
        v_strike :=
          public.admin_add_account_strike(
            v_event.user_id,
            v_category,
            coalesce(
              v_notes,
              'Korvo Trust & Safety confirmed a messaging policy violation.'
            ),
            p_strike_points,
            null,
            v_event.id,
            null
          );

      elsif v_action = 'warn' then
        insert into public.notifications (
          user_id,
          type,
          title,
          body
        )
        values (
          v_event.user_id,
          'account_warning',
          'Korvo Trust & Safety Warning',
          'Korvo reviewed a messaging policy event involving your account and issued a warning.'
        );
      end if;

      update public.message_moderation_events
      set
        review_status =
          case
            when v_action = 'dismiss' then 'dismissed'
            else 'resolved'
          end,
        reviewed_by_admin_id = auth.uid(),
        review_notes = v_notes,
        reviewed_at = now()
      where id = v_event.id;

      insert into public.trust_safety_audit_log (
        subject_user_id,
        moderation_event_id,
        actor_user_id,
        actor_kind,
        action,
        details
      )
      values (
        v_event.user_id,
        v_event.id,
        auth.uid(),
        'admin',
        'moderation_event_reviewed',
        jsonb_build_object(
          'resolution', v_action,
          'rule_code', v_event.rule_code,
          'strike_points', case when v_action='strike' then p_strike_points else 0 end
        )
      );

      return jsonb_build_object(
        'moderation_event_id', v_event.id,
        'resolution', v_action,
        'review_status',
          case
            when v_action = 'dismiss' then 'dismissed'
            else 'resolved'
          end,
        'strike', v_strike
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_resolve_message_moderation(p_moderation_event_id uuid, p_action text, p_notes text, p_strike_points integer) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_resolve_message_moderation(p_moderation_event_id uuid, p_action text, p_notes text, p_strike_points integer) to authenticated;
create or replace function public.admin_resolve_message_moderation(p_moderation_event_id uuid, p_action text, p_notes text DEFAULT NULL::text, p_strike_points integer DEFAULT 1)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_resolve_message_moderation(p_moderation_event_id, p_action, p_notes, p_strike_points); $wrapper$;
revoke all on function public.admin_resolve_message_moderation(p_moderation_event_id uuid, p_action text, p_notes text, p_strike_points integer) from public, anon, authenticated, service_role;
grant execute on function public.admin_resolve_message_moderation(p_moderation_event_id uuid, p_action text, p_notes text, p_strike_points integer) to authenticated;

-- Reviewed API: admin_resolve_project_issue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_resolve_project_issue(p_issue_id uuid, p_action text, p_notes text DEFAULT NULL::text)
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
      v_restore_status text;
      v_payment_review_required boolean := false;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      v_action := lower(trim(coalesce(p_action, '')));
      v_notes := nullif(left(trim(coalesce(p_notes, '')), 5000), '');

      if v_action not in (
        'return_to_work',
        'restore_completion_review',
        'complete_job',
        'cancel_no_refund',
        'cancel_refund_review',
        'close_no_action'
      ) then
        raise exception 'Invalid admin resolution action';
      end if;

      select *
      into v_issue
      from public.project_issues
      where id = p_issue_id
      for update;

      if not found then
        raise exception 'Issue not found';
      end if;

      if v_issue.status not in ('open','under_review') then
        raise exception 'This issue is already closed';
      end if;

      if v_issue.assigned_admin_id is not null
         and v_issue.assigned_admin_id <> auth.uid() then
        raise exception 'This issue is assigned to another admin';
      end if;

      update public.project_issues
      set
        status = 'under_review',
        assigned_admin_id = auth.uid(),
        assigned_at = coalesce(assigned_at, now()),
        updated_at = now()
      where id = v_issue.id;

      select *
      into v_active_job
      from public.active_jobs
      where id = v_issue.active_job_id
      for update;

      if not found then
        raise exception 'Active job not found';
      end if;

      if v_action = 'return_to_work' then
        if v_active_job.status <> 'disputed' then
          raise exception 'Only a disputed job can be returned to work';
        end if;

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

      elsif v_action = 'restore_completion_review' then
        if v_active_job.status <> 'disputed'
           or v_issue.previous_active_job_status <> 'pending_confirmation' then
          raise exception 'This issue cannot be restored to completion confirmation';
        end if;

        update public.active_jobs
        set
          status = 'pending_confirmation',
          updated_at = now()
        where id = v_active_job.id;

        update public.project_issues
        set
          status = 'resolved',
          resolution_type = 'no_action',
          resolution_notes = v_notes,
          resolved_by = auth.uid(),
          resolved_at = now(),
          updated_at = now()
        where id = v_issue.id;

      elsif v_action = 'complete_job' then
        if v_active_job.status not in ('disputed','pending_confirmation') then
          raise exception 'This job cannot be completed from its current state';
        end if;

        update public.active_jobs
        set
          status = 'completed',
          completed_at = coalesce(completed_at, now()),
          updated_at = now()
        where id = v_active_job.id;

        update public.jobs
        set
          status = 'completed',
          closed_at = now(),
          closed_reason = coalesce(v_notes, 'Korvo admin resolved project as completed'),
          closed_by = null,
          closed_by_role = 'admin',
          updated_at = now()
        where id = v_active_job.job_id;

        if not exists (
          select 1
          from public.project_closures pc
          where pc.job_id = v_active_job.job_id
            and pc.closure_type = 'completed'
        ) then
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
            null,
            'admin',
            'completed',
            coalesce(v_notes, 'Korvo admin resolved project as completed'),
            false
          );
        end if;

        update public.project_issues
        set
          status = 'resolved',
          resolution_type = 'admin_resolved',
          resolution_notes = v_notes,
          resolved_by = auth.uid(),
          resolved_at = now(),
          updated_at = now()
        where id = v_issue.id;

      elsif v_action in ('cancel_no_refund','cancel_refund_review') then
        v_payment_review_required :=
          v_action = 'cancel_refund_review';

        if v_active_job.status not in ('cancelled','completed') then
          update public.active_jobs
          set
            status = 'cancelled',
            cancelled_at = coalesce(cancelled_at, now()),
            cancellation_reason = coalesce(v_notes, 'Korvo admin cancelled project'),
            updated_at = now()
          where id = v_active_job.id;

          update public.jobs
          set
            status = 'cancelled',
            closed_at = now(),
            closed_reason = coalesce(v_notes, 'Korvo admin cancelled project'),
            closed_by = null,
            closed_by_role = 'admin',
            updated_at = now()
          where id = v_active_job.job_id;

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
            null,
            'admin',
            'admin_closed',
            coalesce(v_notes, 'Korvo admin cancelled project'),
            v_payment_review_required
          );
        end if;

        if v_action = 'cancel_refund_review' then
          update public.project_issues
          set
            status = 'under_review',
            resolution_type = 'refund_review',
            resolution_notes = v_notes,
            payment_review_required = true,
            updated_at = now()
          where id = v_issue.id;

          perform public.ensure_payment_review_for_issue()
          from public.project_issues
          where false;

        else
          update public.project_issues
          set
            status = 'resolved',
            resolution_type = 'admin_resolved',
            resolution_notes = v_notes,
            payment_review_required = false,
            resolved_by = auth.uid(),
            resolved_at = now(),
            updated_at = now()
          where id = v_issue.id;
        end if;

      elsif v_action = 'close_no_action' then
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
          resolution_notes = v_notes,
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
        v_issue.customer_id,
        'issue_resolved',
        case
          when v_action = 'cancel_refund_review'
            then 'Issue Sent to Payment Review'
          else 'Project Issue Updated'
        end,
        case
          when v_action = 'cancel_refund_review'
            then 'Korvo moved this project issue to payment review.'
          else 'Korvo resolved or updated the issue for "' || v_active_job.job_title || '".'
        end,
        v_issue.job_id,
        v_issue.quote_id,
        v_issue.active_job_id
      ),
      (
        v_issue.professional_id,
        'issue_resolved',
        case
          when v_action = 'cancel_refund_review'
            then 'Issue Sent to Payment Review'
          else 'Project Issue Updated'
        end,
        case
          when v_action = 'cancel_refund_review'
            then 'Korvo moved this project issue to payment review.'
          else 'Korvo resolved or updated the issue for "' || v_active_job.job_title || '".'
        end,
        v_issue.job_id,
        v_issue.quote_id,
        v_issue.active_job_id
      );

      return jsonb_build_object(
        'issue_id', v_issue.id,
        'action', v_action,
        'active_job_id', v_issue.active_job_id,
        'payment_review_required', v_payment_review_required
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_resolve_project_issue(p_issue_id uuid, p_action text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_resolve_project_issue(p_issue_id uuid, p_action text, p_notes text) to authenticated;
create or replace function public.admin_resolve_project_issue(p_issue_id uuid, p_action text, p_notes text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_resolve_project_issue(p_issue_id, p_action, p_notes); $wrapper$;
revoke all on function public.admin_resolve_project_issue(p_issue_id uuid, p_action text, p_notes text) from public, anon, authenticated, service_role;
grant execute on function public.admin_resolve_project_issue(p_issue_id uuid, p_action text, p_notes text) to authenticated;

-- Reviewed API: admin_resolve_safety_report; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_resolve_safety_report(p_report_id uuid, p_action text, p_notes text DEFAULT NULL::text, p_strike_points integer DEFAULT 1)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_report public.trust_safety_reports%rowtype;
      v_action text := lower(trim(coalesce(p_action, '')));
      v_notes text := nullif(left(trim(coalesce(p_notes, '')), 3000), '');
      v_strike jsonb;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_action not in ('dismiss','warn','strike') then
        raise exception 'Invalid report resolution action';
      end if;

      select *
      into v_report
      from public.trust_safety_reports
      where id = p_report_id
      for update;

      if not found then
        raise exception 'Safety report not found';
      end if;

      if v_report.status in ('resolved','dismissed') then
        raise exception 'This report is already closed';
      end if;

      if v_action = 'strike' then
        v_strike :=
          public.admin_add_account_strike(
            v_report.reported_user_id,
            v_report.category,
            coalesce(v_notes, v_report.details),
            p_strike_points,
            v_report.id,
            null,
            null
          );
      elsif v_action = 'warn' then
        insert into public.notifications (
          user_id,
          type,
          title,
          body
        )
        values (
          v_report.reported_user_id,
          'account_warning',
          'Korvo Trust & Safety Warning',
          'Korvo reviewed a report involving your account and issued a warning.'
        );
      end if;

      update public.trust_safety_reports
      set
        status = case when v_action = 'dismiss' then 'dismissed' else 'resolved' end,
        assigned_admin_id = auth.uid(),
        resolution_notes = v_notes,
        resolved_at = now(),
        updated_at = now()
      where id = v_report.id;

      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        job_id,
        conversation_id
      )
      values (
        v_report.reporter_id,
        'safety_report_update',
        'Report Reviewed',
        'Korvo Trust & Safety reviewed your report.',
        v_report.job_id,
        v_report.conversation_id
      );

      return jsonb_build_object(
        'report_id', v_report.id,
        'action', v_action,
        'status', case when v_action = 'dismiss' then 'dismissed' else 'resolved' end,
        'strike', v_strike
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_resolve_safety_report(p_report_id uuid, p_action text, p_notes text, p_strike_points integer) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_resolve_safety_report(p_report_id uuid, p_action text, p_notes text, p_strike_points integer) to authenticated;
create or replace function public.admin_resolve_safety_report(p_report_id uuid, p_action text, p_notes text DEFAULT NULL::text, p_strike_points integer DEFAULT 1)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_resolve_safety_report(p_report_id, p_action, p_notes, p_strike_points); $wrapper$;
revoke all on function public.admin_resolve_safety_report(p_report_id uuid, p_action text, p_notes text, p_strike_points integer) from public, anon, authenticated, service_role;
grant execute on function public.admin_resolve_safety_report(p_report_id uuid, p_action text, p_notes text, p_strike_points integer) to authenticated;

-- Reviewed API: admin_review_professional_verification; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_review_professional_verification(p_verification_id uuid, p_action text, p_user_status_message text DEFAULT NULL::text, p_provider text DEFAULT NULL::text, p_provider_reference text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_record public.professional_verifications%rowtype;
      v_action text := lower(trim(coalesce(p_action, '')));
      v_new_status text;
      v_overall_status text;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_action not in ('start_review','verify','reject','expire','cancel') then
        raise exception 'Invalid verification action';
      end if;

      select *
      into v_record
      from public.professional_verifications
      where id = p_verification_id
      for update;

      if not found then
        raise exception 'Verification record not found';
      end if;

      v_new_status :=
        case v_action
          when 'start_review' then 'in_review'
          when 'verify' then 'verified'
          when 'reject' then 'rejected'
          when 'expire' then 'expired'
          when 'cancel' then 'cancelled'
        end;

      if v_action = 'start_review'
         and v_record.status <> 'pending' then
        raise exception 'Only pending verifications can enter review';
      end if;

      if v_action in ('verify','reject')
         and v_record.status not in ('pending','in_review') then
        raise exception 'This verification cannot be decided from its current status';
      end if;

      update public.professional_verifications
      set
        status = v_new_status,
        provider = coalesce(nullif(left(trim(coalesce(p_provider, '')), 100), ''), provider),
        provider_reference = coalesce(nullif(left(trim(coalesce(p_provider_reference, '')), 255), ''), provider_reference),
        user_status_message = nullif(left(trim(coalesce(p_user_status_message, '')), 1000), ''),
        reviewed_at = case
          when v_action in ('start_review','verify','reject') then now()
          else reviewed_at
        end,
        verified_at = case
          when v_action = 'verify' then now()
          when v_action in ('reject','expire','cancel') then null
          else verified_at
        end,
        expires_at = case
          when v_action = 'verify' then p_expires_at
          else expires_at
        end,
        reviewed_by_admin_id = auth.uid(),
        updated_at = now()
      where id = v_record.id;

      v_overall_status :=
        public.refresh_professional_verification_state(v_record.professional_id);

      return jsonb_build_object(
        'verification_id', v_record.id,
        'professional_id', v_record.professional_id,
        'verification_type', v_record.verification_type,
        'status', v_new_status,
        'overall_verification_status', v_overall_status
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_review_professional_verification(p_verification_id uuid, p_action text, p_user_status_message text, p_provider text, p_provider_reference text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_review_professional_verification(p_verification_id uuid, p_action text, p_user_status_message text, p_provider text, p_provider_reference text, p_expires_at timestamp with time zone) to authenticated;
create or replace function public.admin_review_professional_verification(p_verification_id uuid, p_action text, p_user_status_message text DEFAULT NULL::text, p_provider text DEFAULT NULL::text, p_provider_reference text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_review_professional_verification(p_verification_id, p_action, p_user_status_message, p_provider, p_provider_reference, p_expires_at); $wrapper$;
revoke all on function public.admin_review_professional_verification(p_verification_id uuid, p_action text, p_user_status_message text, p_provider text, p_provider_reference text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.admin_review_professional_verification(p_verification_id uuid, p_action text, p_user_status_message text, p_provider text, p_provider_reference text, p_expires_at timestamp with time zone) to authenticated;

-- Reviewed API: admin_set_professional_badge; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_set_professional_badge(p_professional_id uuid, p_badge_code text, p_action text, p_reason text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_action text := lower(trim(coalesce(p_action, '')));
      v_badge_code text := lower(trim(coalesce(p_badge_code, '')));
      v_definition public.professional_badge_definitions%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      if v_action not in ('award','revoke') then
        raise exception 'Invalid badge action';
      end if;

      select *
      into v_definition
      from public.professional_badge_definitions
      where code = v_badge_code
        and is_active = true;

      if not found then
        raise exception 'Badge definition not found';
      end if;

      if v_definition.award_mode <> 'manual' then
        raise exception 'This badge is managed automatically by Korvo verification';
      end if;

      if not exists (
        select 1
        from public.professional_profiles
        where id = p_professional_id
      ) then
        raise exception 'Professional not found';
      end if;

      if v_action = 'award' then
        insert into public.professional_badges (
          professional_id,
          badge_code,
          source_type,
          awarded_by_admin_id,
          awarded_at,
          expires_at,
          revoked_at,
          revoke_reason
        )
        values (
          p_professional_id,
          v_badge_code,
          'manual',
          auth.uid(),
          now(),
          p_expires_at,
          null,
          null
        )
        on conflict (professional_id, badge_code)
        do update set
          source_type = 'manual',
          awarded_by_admin_id = auth.uid(),
          awarded_at = now(),
          expires_at = excluded.expires_at,
          revoked_at = null,
          revoke_reason = null;
      else
        update public.professional_badges
        set
          revoked_at = now(),
          revoke_reason = nullif(left(trim(coalesce(p_reason, '')), 1000), '')
        where professional_id = p_professional_id
          and badge_code = v_badge_code
          and revoked_at is null;
      end if;

      return jsonb_build_object(
        'professional_id', p_professional_id,
        'badge_code', v_badge_code,
        'status', case when v_action='award' then 'awarded' else 'revoked' end
      );
    end;
    $function$;
revoke all on function korvo_api_private.admin_set_professional_badge(p_professional_id uuid, p_badge_code text, p_action text, p_reason text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_set_professional_badge(p_professional_id uuid, p_badge_code text, p_action text, p_reason text, p_expires_at timestamp with time zone) to authenticated;
create or replace function public.admin_set_professional_badge(p_professional_id uuid, p_badge_code text, p_action text, p_reason text DEFAULT NULL::text, p_expires_at timestamp with time zone DEFAULT NULL::timestamp with time zone)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_set_professional_badge(p_professional_id, p_badge_code, p_action, p_reason, p_expires_at); $wrapper$;
revoke all on function public.admin_set_professional_badge(p_professional_id uuid, p_badge_code text, p_action text, p_reason text, p_expires_at timestamp with time zone) from public, anon, authenticated, service_role;
grant execute on function public.admin_set_professional_badge(p_professional_id uuid, p_badge_code text, p_action text, p_reason text, p_expires_at timestamp with time zone) to authenticated;

-- Reviewed API: admin_set_professional_membership; authorization remains inside the private implementation.
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
revoke all on function korvo_api_private.admin_set_professional_membership(p_professional_id uuid, p_plan_code text, p_status text, p_current_period_end timestamp with time zone, p_processor text, p_processor_customer_id text, p_processor_subscription_id text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_set_professional_membership(p_professional_id uuid, p_plan_code text, p_status text, p_current_period_end timestamp with time zone, p_processor text, p_processor_customer_id text, p_processor_subscription_id text) to authenticated;
create or replace function public.admin_set_professional_membership(p_professional_id uuid, p_plan_code text, p_status text DEFAULT 'active'::text, p_current_period_end timestamp with time zone DEFAULT NULL::timestamp with time zone, p_processor text DEFAULT NULL::text, p_processor_customer_id text DEFAULT NULL::text, p_processor_subscription_id text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.admin_set_professional_membership(p_professional_id, p_plan_code, p_status, p_current_period_end, p_processor, p_processor_customer_id, p_processor_subscription_id); $wrapper$;
revoke all on function public.admin_set_professional_membership(p_professional_id uuid, p_plan_code text, p_status text, p_current_period_end timestamp with time zone, p_processor text, p_processor_customer_id text, p_processor_subscription_id text) from public, anon, authenticated, service_role;
grant execute on function public.admin_set_professional_membership(p_professional_id uuid, p_plan_code text, p_status text, p_current_period_end timestamp with time zone, p_processor text, p_processor_customer_id text, p_processor_subscription_id text) to authenticated;

-- Reviewed API: admin_trust_safety_queue; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.admin_trust_safety_queue()
 RETURNS TABLE(report_id uuid, reporter_id uuid, reported_user_id uuid, category text, priority text, status text, details text, message_id uuid, conversation_id uuid, job_id uuid, assigned_admin_id uuid, created_at timestamp with time zone)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null or not public.is_korvo_admin() then
        raise exception 'Korvo admin access required';
      end if;

      return query
      select
        r.id,
        r.reporter_id,
        r.reported_user_id,
        r.category,
        r.priority,
        r.status,
        r.details,
        r.message_id,
        r.conversation_id,
        r.job_id,
        r.assigned_admin_id,
        r.created_at
      from public.trust_safety_reports r
      where r.status in ('open','under_review')
      order by
        case r.priority
          when 'urgent' then 0
          when 'high' then 1
          when 'normal' then 2
          else 3
        end,
        r.created_at asc;
    end;
    $function$;
revoke all on function korvo_api_private.admin_trust_safety_queue() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.admin_trust_safety_queue() to authenticated;
create or replace function public.admin_trust_safety_queue()
returns TABLE(report_id uuid, reporter_id uuid, reported_user_id uuid, category text, priority text, status text, details text, message_id uuid, conversation_id uuid, job_id uuid, assigned_admin_id uuid, created_at timestamp with time zone)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.admin_trust_safety_queue(); $wrapper$;
revoke all on function public.admin_trust_safety_queue() from public, anon, authenticated, service_role;
grant execute on function public.admin_trust_safety_queue() to authenticated;

revoke all on function public.assert_professional_job_capacity(p_professional_id uuid) from public, anon, authenticated, service_role;
alter function public.assert_professional_job_capacity(p_professional_id uuid) set search_path = '';

revoke all on function public.audit_issue_evidence_insert() from public, anon, authenticated, service_role;
alter function public.audit_issue_evidence_insert() set search_path = '';

revoke all on function public.audit_message_moderation_insert() from public, anon, authenticated, service_role;
alter function public.audit_message_moderation_insert() set search_path = '';

revoke all on function public.audit_payment_review_changes() from public, anon, authenticated, service_role;
alter function public.audit_payment_review_changes() set search_path = '';

revoke all on function public.audit_professional_subscription_change() from public, anon, authenticated, service_role;
alter function public.audit_professional_subscription_change() set search_path = '';

revoke all on function public.audit_professional_verification_change() from public, anon, authenticated, service_role;
alter function public.audit_professional_verification_change() set search_path = '';

revoke all on function public.audit_project_issue_changes() from public, anon, authenticated, service_role;
alter function public.audit_project_issue_changes() set search_path = '';

revoke all on function public.audit_restriction_change() from public, anon, authenticated, service_role;
alter function public.audit_restriction_change() set search_path = '';

revoke all on function public.audit_safety_report_insert() from public, anon, authenticated, service_role;
alter function public.audit_safety_report_insert() set search_path = '';

revoke all on function public.audit_safety_report_update() from public, anon, authenticated, service_role;
alter function public.audit_safety_report_update() set search_path = '';

revoke all on function public.audit_strike_insert() from public, anon, authenticated, service_role;
alter function public.audit_strike_insert() set search_path = '';

revoke all on function public.audit_user_block_change() from public, anon, authenticated, service_role;
alter function public.audit_user_block_change() set search_path = '';

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

-- Reviewed API: professional_cancel_job; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.professional_cancel_job(p_active_job_id uuid, p_reason text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
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
      into v_active_job
      from public.active_jobs
      where id = p_active_job_id
      for update;

      if not found then
        raise exception 'Active job not found';
      end if;

      if v_active_job.professional_id <> auth.uid() then
        raise exception 'You cannot cancel this job';
      end if;

      if v_active_job.status = 'pending_confirmation' then
        raise exception 'This job is awaiting customer confirmation and cannot be cancelled through the standard flow';
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
        closed_by_role = 'professional',
        updated_at = now()
      where id = v_active_job.job_id;

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
        'professional',
        'professional_cancelled',
        v_reason,
        v_payment_review
      );

      return jsonb_build_object(
        'job_id', v_active_job.job_id,
        'active_job_id', v_active_job.id,
        'status', 'cancelled',
        'payment_review_required', v_payment_review
      );
    end;
    $function$;
revoke all on function korvo_api_private.professional_cancel_job(p_active_job_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.professional_cancel_job(p_active_job_id uuid, p_reason text) to authenticated;
create or replace function public.professional_cancel_job(p_active_job_id uuid, p_reason text DEFAULT ''::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.professional_cancel_job(p_active_job_id, p_reason); $wrapper$;
revoke all on function public.professional_cancel_job(p_active_job_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function public.professional_cancel_job(p_active_job_id uuid, p_reason text) to authenticated;

revoke all on function public.professional_has_job_capacity(p_professional_id uuid) from public, anon, authenticated, service_role;
alter function public.professional_has_job_capacity(p_professional_id uuid) set search_path = '';

revoke all on function public.professional_job_match_details(p_professional_id uuid, p_job_id uuid) from public, anon, authenticated, service_role;
alter function public.professional_job_match_details(p_professional_id uuid, p_job_id uuid) set search_path = '';

revoke all on function public.professional_membership_snapshot_internal(p_professional_id uuid) from public, anon, authenticated, service_role;
alter function public.professional_membership_snapshot_internal(p_professional_id uuid) set search_path = '';

-- Reviewed API: professional_past_projects; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.professional_past_projects()
 RETURNS TABLE(job_id uuid, active_job_id uuid, title text, city text, state text, project_status text, amount numeric, timeframe text, closed_at timestamp with time zone, closure_type text, closure_reason text, payment_review_required boolean, review_rating integer, review_comment text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
      select
        aj.job_id,
        aj.id as active_job_id,
        aj.job_title as title,
        aj.job_city as city,
        aj.job_state as state,
        aj.status as project_status,
        aj.amount,
        aj.timeframe,
        coalesce(aj.completed_at, aj.cancelled_at, j.closed_at) as closed_at,
        pc.closure_type,
        coalesce(pc.reason, j.closed_reason) as closure_reason,
        coalesce(pc.payment_review_required, false) as payment_review_required,
        r.rating as review_rating,
        r.comment as review_comment
      from public.active_jobs aj
      join public.jobs j
        on j.id = aj.job_id
      left join lateral (
        select
          pc1.closure_type,
          pc1.reason,
          pc1.payment_review_required,
          pc1.created_at
        from public.project_closures pc1
        where pc1.active_job_id = aj.id
           or pc1.job_id = aj.job_id
        order by pc1.created_at desc
        limit 1
      ) pc on true
      left join public.reviews r
        on r.active_job_id = aj.id
      where aj.professional_id = auth.uid()
        and exists (select 1 from auth.users u where u.id = auth.uid())
        and aj.status in ('completed','cancelled')
      order by coalesce(aj.completed_at, aj.cancelled_at, j.closed_at, aj.updated_at) desc;
    $function$;
revoke all on function korvo_api_private.professional_past_projects() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.professional_past_projects() to authenticated;
create or replace function public.professional_past_projects()
returns TABLE(job_id uuid, active_job_id uuid, title text, city text, state text, project_status text, amount numeric, timeframe text, closed_at timestamp with time zone, closure_type text, closure_reason text, payment_review_required boolean, review_rating integer, review_comment text)
language sql volatile security invoker set search_path = ''
as $wrapper$ select * from korvo_api_private.professional_past_projects(); $wrapper$;
revoke all on function public.professional_past_projects() from public, anon, authenticated, service_role;
grant execute on function public.professional_past_projects() to authenticated;

-- Reviewed API: professional_request_job_completion; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.professional_request_job_completion(p_active_job_id uuid)
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

      if v_active_job.professional_id <> auth.uid() then
        raise exception 'You cannot update this active job';
      end if;

      if v_active_job.status <> 'active' then
        raise exception 'This job is not eligible for completion submission';
      end if;

      update public.active_jobs
      set
        status = 'pending_confirmation',
        professional_completed_at = now(),
        updated_at = now()
      where id = v_active_job.id;

      return jsonb_build_object(
        'active_job_id', v_active_job.id,
        'status', 'pending_confirmation'
      );
    end;
    $function$;
revoke all on function korvo_api_private.professional_request_job_completion(p_active_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.professional_request_job_completion(p_active_job_id uuid) to authenticated;
create or replace function public.professional_request_job_completion(p_active_job_id uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.professional_request_job_completion(p_active_job_id); $wrapper$;
revoke all on function public.professional_request_job_completion(p_active_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.professional_request_job_completion(p_active_job_id uuid) to authenticated;

-- Reviewed API: professional_withdraw_quote; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.professional_withdraw_quote(p_quote_id uuid, p_reason text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_quote public.quotes%rowtype;
      v_reason text;
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
      into v_quote
      from public.quotes
      where id = p_quote_id
      for update;

      if not found then
        raise exception 'Quote not found';
      end if;

      if v_quote.professional_id <> auth.uid() then
        raise exception 'You cannot withdraw this quote';
      end if;

      if v_quote.status <> 'pending' then
        raise exception 'Only pending quotes can be withdrawn';
      end if;

      update public.quotes
      set
        status = 'withdrawn',
        withdrawn_at = now(),
        withdrawal_reason = v_reason,
        updated_at = now()
      where id = v_quote.id;

      insert into public.notifications (
        user_id,
        type,
        title,
        body,
        job_id,
        quote_id
      )
      values (
        v_quote.customer_id,
        'quote_withdrawn',
        'Quote Withdrawn',
        v_quote.professional_name || ' withdrew the quote for "' || v_quote.job_title || '".',
        v_quote.job_id,
        v_quote.id
      );

      return jsonb_build_object(
        'quote_id', v_quote.id,
        'job_id', v_quote.job_id,
        'status', 'withdrawn'
      );
    end;
    $function$;
revoke all on function korvo_api_private.professional_withdraw_quote(p_quote_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.professional_withdraw_quote(p_quote_id uuid, p_reason text) to authenticated;
create or replace function public.professional_withdraw_quote(p_quote_id uuid, p_reason text DEFAULT ''::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.professional_withdraw_quote(p_quote_id, p_reason); $wrapper$;
revoke all on function public.professional_withdraw_quote(p_quote_id uuid, p_reason text) from public, anon, authenticated, service_role;
grant execute on function public.professional_withdraw_quote(p_quote_id uuid, p_reason text) to authenticated;

revoke all on function public.protect_professional_verification_status() from public, anon, authenticated, service_role;
alter function public.protect_professional_verification_status() set search_path = '';

revoke all on function public.record_professional_job_usage(p_professional_id uuid, p_active_job_id uuid, p_job_id uuid, p_quote_id uuid, p_snapshot jsonb) from public, anon, authenticated, service_role;
alter function public.record_professional_job_usage(p_professional_id uuid, p_active_job_id uuid, p_job_id uuid, p_quote_id uuid, p_snapshot jsonb) set search_path = '';

revoke all on function public.refresh_professional_verification_state(p_professional_id uuid) from public, anon, authenticated, service_role;
alter function public.refresh_professional_verification_state(p_professional_id uuid) set search_path = '';

-- Reviewed API: register_project_issue_evidence; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.register_project_issue_evidence(p_issue_id uuid, p_storage_path text, p_file_name text, p_caption text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_issue public.project_issues%rowtype;
      v_object storage.objects%rowtype;
      v_role text;
      v_size bigint;
      v_mime text;
      v_evidence_id uuid;
      v_expected_prefix text;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_issue
      from public.project_issues
      where id = p_issue_id
      for update;

      if not found then
        raise exception 'Issue not found';
      end if;

      if v_issue.status not in ('open','under_review') then
        raise exception 'Evidence cannot be added to a closed issue';
      end if;

      if auth.uid() = v_issue.customer_id then
        v_role := 'customer';
      elsif auth.uid() = v_issue.professional_id then
        v_role := 'professional';
      else
        raise exception 'You cannot add evidence to this issue';
      end if;

      v_expected_prefix :=
        v_issue.id::text || '/' || auth.uid()::text || '/';

      if p_storage_path is null
         or left(p_storage_path, length(v_expected_prefix)) <> v_expected_prefix then
        raise exception 'Invalid evidence storage path';
      end if;

      select *
      into v_object
      from storage.objects
      where bucket_id = 'project-issue-evidence'
        and name = p_storage_path
      limit 1;

      if not found then
        raise exception 'Uploaded evidence file was not found';
      end if;

      if coalesce(v_object.owner_id, '') <> auth.uid()::text
         and v_object.owner is distinct from auth.uid() then
        raise exception 'You do not own this uploaded evidence file';
      end if;

      begin
        v_size := nullif(v_object.metadata->>'size', '')::bigint;
      exception
        when others then
          v_size := null;
      end;

      v_mime := nullif(trim(coalesce(v_object.metadata->>'mimetype', '')), '');

      if v_size is null or v_size < 1 or v_size > 26214400 then
        raise exception 'Evidence file size is invalid';
      end if;

      if v_mime not in (
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
        'application/pdf',
        'video/mp4'
      ) then
        raise exception 'Evidence file type is not allowed';
      end if;

      if nullif(trim(coalesce(p_file_name, '')), '') is null then
        raise exception 'File name is required';
      end if;

      insert into public.project_issue_evidence (
        issue_id,
        uploaded_by,
        uploader_role,
        storage_bucket,
        storage_path,
        file_name,
        mime_type,
        size_bytes,
        caption
      )
      values (
        v_issue.id,
        auth.uid(),
        v_role,
        'project-issue-evidence',
        p_storage_path,
        left(trim(p_file_name), 255),
        v_mime,
        v_size,
        nullif(left(trim(coalesce(p_caption, '')), 1000), '')
      )
      returning id
      into v_evidence_id;

      update public.project_issues
      set updated_at = now()
      where id = v_issue.id;

      return jsonb_build_object(
        'evidence_id', v_evidence_id,
        'issue_id', v_issue.id,
        'storage_path', p_storage_path,
        'mime_type', v_mime,
        'size_bytes', v_size,
        'status', 'registered'
      );
    end;
    $function$;
revoke all on function korvo_api_private.register_project_issue_evidence(p_issue_id uuid, p_storage_path text, p_file_name text, p_caption text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.register_project_issue_evidence(p_issue_id uuid, p_storage_path text, p_file_name text, p_caption text) to authenticated;
create or replace function public.register_project_issue_evidence(p_issue_id uuid, p_storage_path text, p_file_name text, p_caption text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.register_project_issue_evidence(p_issue_id, p_storage_path, p_file_name, p_caption); $wrapper$;
revoke all on function public.register_project_issue_evidence(p_issue_id uuid, p_storage_path text, p_file_name text, p_caption text) from public, anon, authenticated, service_role;
grant execute on function public.register_project_issue_evidence(p_issue_id uuid, p_storage_path text, p_file_name text, p_caption text) to authenticated;

-- Reviewed API: report_korvo_user; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.report_korvo_user(p_reported_user_id uuid, p_category text, p_details text, p_message_id uuid DEFAULT NULL::uuid, p_conversation_id uuid DEFAULT NULL::uuid, p_job_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_category text := lower(trim(coalesce(p_category, '')));
      v_details text := trim(coalesce(p_details, ''));
      v_conversation public.conversations%rowtype;
      v_message public.messages%rowtype;
      v_related boolean := false;
      v_report_id uuid;
      v_priority text := 'normal';
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      if p_reported_user_id is null or p_reported_user_id = auth.uid() then
        raise exception 'Invalid reported user';
      end if;

      if v_category not in (
        'harassment',
        'spam',
        'off_platform',
        'contact_sharing',
        'payment_solicitation',
        'fraud',
        'unsafe_behavior',
        'inappropriate_content',
        'other'
      ) then
        raise exception 'Invalid report category';
      end if;

      if length(v_details) < 5 or length(v_details) > 3000 then
        raise exception 'Report details must be between 5 and 3000 characters';
      end if;

      if p_message_id is not null then
        select *
        into v_message
        from public.messages
        where id = p_message_id;

        if not found then
          raise exception 'Message not found';
        end if;

        select *
        into v_conversation
        from public.conversations
        where id = v_message.conversation_id;

        if not found then
          raise exception 'Conversation not found';
        end if;

        if auth.uid() not in (v_conversation.customer_id, v_conversation.professional_id) then
          raise exception 'You cannot report this message';
        end if;

        if v_message.sender_id <> p_reported_user_id then
          raise exception 'Reported user does not match the message sender';
        end if;

        p_conversation_id := v_conversation.id;
        p_job_id := coalesce(p_job_id, v_conversation.job_id);
        v_related := true;

      elsif p_conversation_id is not null then
        select *
        into v_conversation
        from public.conversations
        where id = p_conversation_id;

        if not found then
          raise exception 'Conversation not found';
        end if;

        if not (
          (v_conversation.customer_id = auth.uid() and v_conversation.professional_id = p_reported_user_id)
          or
          (v_conversation.professional_id = auth.uid() and v_conversation.customer_id = p_reported_user_id)
        ) then
          raise exception 'Reported user is not the other participant in this conversation';
        end if;

        p_job_id := coalesce(p_job_id, v_conversation.job_id);
        v_related := true;

      elsif p_job_id is not null then
        select exists (
          select 1
          from public.active_jobs aj
          where aj.job_id = p_job_id
            and (
              (aj.customer_id = auth.uid() and aj.professional_id = p_reported_user_id)
              or
              (aj.professional_id = auth.uid() and aj.customer_id = p_reported_user_id)
            )
        )
        into v_related;
      end if;

      if not v_related then
        raise exception 'You can only report a user connected to your Korvo interaction';
      end if;

      if v_category in ('fraud','unsafe_behavior') then
        v_priority := 'high';
      end if;

      insert into public.trust_safety_reports (
        reporter_id,
        reported_user_id,
        category,
        details,
        message_id,
        conversation_id,
        job_id,
        status,
        priority
      )
      values (
        auth.uid(),
        p_reported_user_id,
        v_category,
        v_details,
        p_message_id,
        p_conversation_id,
        p_job_id,
        'open',
        v_priority
      )
      returning id
      into v_report_id;

      return jsonb_build_object(
        'report_id', v_report_id,
        'status', 'open',
        'priority', v_priority
      );
    end;
    $function$;
revoke all on function korvo_api_private.report_korvo_user(p_reported_user_id uuid, p_category text, p_details text, p_message_id uuid, p_conversation_id uuid, p_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.report_korvo_user(p_reported_user_id uuid, p_category text, p_details text, p_message_id uuid, p_conversation_id uuid, p_job_id uuid) to authenticated;
create or replace function public.report_korvo_user(p_reported_user_id uuid, p_category text, p_details text, p_message_id uuid DEFAULT NULL::uuid, p_conversation_id uuid DEFAULT NULL::uuid, p_job_id uuid DEFAULT NULL::uuid)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.report_korvo_user(p_reported_user_id, p_category, p_details, p_message_id, p_conversation_id, p_job_id); $wrapper$;
revoke all on function public.report_korvo_user(p_reported_user_id uuid, p_category text, p_details text, p_message_id uuid, p_conversation_id uuid, p_job_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.report_korvo_user(p_reported_user_id uuid, p_category text, p_details text, p_message_id uuid, p_conversation_id uuid, p_job_id uuid) to authenticated;

-- Reviewed API: request_professional_membership_cancellation; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.request_professional_membership_cancellation()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_subscription public.professional_subscriptions%rowtype;
      v_plan public.professional_membership_plans%rowtype;
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

      select *
      into v_plan
      from public.professional_membership_plans
      where code = v_subscription.plan_code;

      if not found then
        raise exception 'Membership plan not found';
      end if;

      if v_plan.is_paid is false then
        raise exception 'There is no paid recurring membership to cancel';
      end if;

      if v_subscription.status not in ('active','past_due') then
        raise exception 'This membership is not eligible for cancellation scheduling';
      end if;

      update public.professional_subscriptions
      set
        cancel_at_period_end = true,
        change_requested_at = now(),
        change_effective_at = current_period_end,
        pending_plan_code = null,
        updated_at = now()
      where id = v_subscription.id;

      return jsonb_build_object(
        'professional_id', auth.uid(),
        'plan_code', v_subscription.plan_code,
        'cancel_at_period_end', true,
        'effective_at', v_subscription.current_period_end
      );
    end;
    $function$;
revoke all on function korvo_api_private.request_professional_membership_cancellation() from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.request_professional_membership_cancellation() to authenticated;
create or replace function public.request_professional_membership_cancellation()
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.request_professional_membership_cancellation(); $wrapper$;
revoke all on function public.request_professional_membership_cancellation() from public, anon, authenticated, service_role;
grant execute on function public.request_professional_membership_cancellation() to authenticated;

-- Reviewed API: request_professional_membership_change; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.request_professional_membership_change(p_plan_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_plan public.professional_membership_plans%rowtype;
      v_subscription public.professional_subscriptions%rowtype;
      v_code text := lower(trim(coalesce(p_plan_code, '')));
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      select *
      into v_plan
      from public.professional_membership_plans
      where code = v_code
        and is_active = true
        and is_public = true;

      if not found then
        raise exception 'Membership plan not found';
      end if;

      if v_plan.code = 'free_trial' then
        raise exception 'The one-time free trial cannot be selected again';
      end if;

      select *
      into v_subscription
      from public.professional_subscriptions
      where professional_id = auth.uid()
      for update;

      if not found then
        raise exception 'Professional subscription not found';
      end if;

      if v_subscription.plan_code = v_plan.code
         and v_subscription.status in ('trialing','active') then
        raise exception 'This membership plan is already active';
      end if;

      update public.professional_subscriptions
      set
        pending_plan_code = v_plan.code,
        change_requested_at = now(),
        change_effective_at = null,
        updated_at = now()
      where id = v_subscription.id;

      return jsonb_build_object(
        'professional_id', auth.uid(),
        'current_plan_code', v_subscription.plan_code,
        'requested_plan_code', v_plan.code,
        'status', 'pending_payment_setup',
        'payment_setup_required', true
      );
    end;
    $function$;
revoke all on function korvo_api_private.request_professional_membership_change(p_plan_code text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.request_professional_membership_change(p_plan_code text) to authenticated;
create or replace function public.request_professional_membership_change(p_plan_code text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.request_professional_membership_change(p_plan_code); $wrapper$;
revoke all on function public.request_professional_membership_change(p_plan_code text) from public, anon, authenticated, service_role;
grant execute on function public.request_professional_membership_change(p_plan_code text) to authenticated;

-- Reviewed API: request_professional_verification; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.request_professional_verification(p_verification_type text, p_jurisdiction text DEFAULT NULL::text, p_credential_last4 text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_type text := lower(trim(coalesce(p_verification_type, '')));
      v_id uuid;
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
          and coalesce(p.is_active, true) = true
      ) then
        raise exception 'Professional account required';
      end if;

      if not exists (
        select 1
        from public.professional_profiles pp
        where pp.id = auth.uid()
      ) then
        raise exception 'Professional profile required';
      end if;

      if v_type not in (
        'identity',
        'background',
        'license',
        'insurance',
        'business'
      ) then
        raise exception 'Invalid verification type';
      end if;

      if exists (
        select 1
        from public.professional_verifications v
        where v.professional_id = auth.uid()
          and v.verification_type = v_type
          and v.status in ('pending','in_review','verified')
          and (v.expires_at is null or v.expires_at > now())
      ) then
        raise exception 'A current verification already exists for this type';
      end if;

      insert into public.professional_verifications (
        professional_id,
        verification_type,
        status,
        jurisdiction,
        credential_last4,
        user_status_message
      )
      values (
        auth.uid(),
        v_type,
        'pending',
        nullif(left(trim(coalesce(p_jurisdiction, '')), 100), ''),
        nullif(left(regexp_replace(coalesce(p_credential_last4, ''), '[^A-Za-z0-9]', '', 'g'), 4), ''),
        'Verification request received by Korvo.'
      )
      returning id into v_id;

      return jsonb_build_object(
        'verification_id', v_id,
        'verification_type', v_type,
        'status', 'pending'
      );
    end;
    $function$;
revoke all on function korvo_api_private.request_professional_verification(p_verification_type text, p_jurisdiction text, p_credential_last4 text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.request_professional_verification(p_verification_type text, p_jurisdiction text, p_credential_last4 text) to authenticated;
create or replace function public.request_professional_verification(p_verification_type text, p_jurisdiction text DEFAULT NULL::text, p_credential_last4 text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.request_professional_verification(p_verification_type, p_jurisdiction, p_credential_last4); $wrapper$;
revoke all on function public.request_professional_verification(p_verification_type text, p_jurisdiction text, p_credential_last4 text) from public, anon, authenticated, service_role;
grant execute on function public.request_professional_verification(p_verification_type text, p_jurisdiction text, p_credential_last4 text) to authenticated;

-- Reviewed API: respond_to_quote; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.respond_to_quote(p_quote_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_quote public.quotes%rowtype;
      v_job public.jobs%rowtype;
      v_active_job_id uuid;
      v_action text;
      v_membership_snapshot jsonb;
      v_usage_id uuid;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      v_action := lower(trim(coalesce(p_action, '')));

      if v_action not in ('accept', 'decline') then
        raise exception 'Invalid quote action';
      end if;

      select *
      into v_quote
      from public.quotes
      where id = p_quote_id
      for update;

      if not found then
        raise exception 'Quote not found';
      end if;

      if v_quote.customer_id <> auth.uid() then
        raise exception 'You cannot respond to this quote';
      end if;

      if v_quote.status <> 'pending' then
        raise exception 'This quote has already been responded to';
      end if;

      if v_action = 'decline' then
        update public.quotes
        set
          status = 'declined',
          updated_at = now()
        where id = v_quote.id;

        return jsonb_build_object(
          'quote_id', v_quote.id,
          'quote_status', 'declined',
          'job_id', v_quote.job_id
        );
      end if;

      select *
      into v_job
      from public.jobs
      where id = v_quote.job_id
      for update;

      if not found then
        raise exception 'Job not found';
      end if;

      if v_job.customer_id <> auth.uid() then
        raise exception 'You cannot accept a quote for this job';
      end if;

      if v_job.status <> 'open' then
        raise exception 'This job is no longer open';
      end if;

      if exists (
        select 1
        from public.quotes
        where job_id = v_quote.job_id
          and status = 'accepted'
      ) then
        raise exception 'A quote has already been accepted for this job';
      end if;

      -- Locks the professional subscription row until this transaction ends,
      -- preventing two simultaneous quote acceptances from overspending a job allowance.
      v_membership_snapshot :=
        public.assert_professional_job_capacity(v_quote.professional_id);

      update public.quotes
      set
        status = 'accepted',
        updated_at = now()
      where id = v_quote.id;

      update public.quotes
      set
        status = 'declined',
        updated_at = now()
      where job_id = v_quote.job_id
        and id <> v_quote.id
        and status = 'pending';

      update public.jobs
      set
        status = 'accepted',
        updated_at = now()
      where id = v_quote.job_id;

      insert into public.active_jobs (
        job_id,
        quote_id,
        customer_id,
        professional_id,
        amount,
        timeframe,
        status,
        job_title,
        job_reference,
        job_city,
        job_state,
        professional_name,
        accepted_at,
        updated_at
      )
      values (
        v_quote.job_id,
        v_quote.id,
        v_quote.customer_id,
        v_quote.professional_id,
        v_quote.amount,
        v_quote.timeframe,
        'active',
        v_quote.job_title,
        v_quote.job_reference,
        v_quote.job_city,
        v_quote.job_state,
        v_quote.professional_name,
        now(),
        now()
      )
      returning id
      into v_active_job_id;

      v_usage_id :=
        public.record_professional_job_usage(
          v_quote.professional_id,
          v_active_job_id,
          v_quote.job_id,
          v_quote.id,
          v_membership_snapshot
        );

      return jsonb_build_object(
        'quote_id', v_quote.id,
        'quote_status', 'accepted',
        'job_id', v_quote.job_id,
        'job_status', 'accepted',
        'active_job_id', v_active_job_id,
        'membership_usage_id', v_usage_id,
        'membership_plan', v_membership_snapshot->>'plan_code'
      );
    end;
    $function$;
revoke all on function korvo_api_private.respond_to_quote(p_quote_id uuid, p_action text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.respond_to_quote(p_quote_id uuid, p_action text) to authenticated;
create or replace function public.respond_to_quote(p_quote_id uuid, p_action text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.respond_to_quote(p_quote_id, p_action); $wrapper$;
revoke all on function public.respond_to_quote(p_quote_id uuid, p_action text) from public, anon, authenticated, service_role;
grant execute on function public.respond_to_quote(p_quote_id uuid, p_action text) to authenticated;

revoke all on function public.rls_auto_enable() from public, anon, authenticated, service_role;
alter function public.rls_auto_enable() set search_path = '';

-- Reviewed API: send_korvo_message; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.send_korvo_message(p_conversation_id uuid, p_body text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_conversation public.conversations%rowtype;
      v_body text := trim(coalesce(p_body, ''));
      v_other_user uuid;
      v_classification jsonb;
      v_action text;
      v_rule_code text;
      v_notice text;
      v_message public.messages%rowtype;
      v_recent_count integer;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      if length(v_body) < 1 or length(v_body) > 1200 then
        raise exception 'Message must be between 1 and 1200 characters';
      end if;

      select *
      into v_conversation
      from public.conversations
      where id = p_conversation_id
      for update;

      if not found then
        raise exception 'Conversation not found';
      end if;

      if v_conversation.status <> 'active' then
        raise exception 'This conversation is closed';
      end if;

      if auth.uid() = v_conversation.customer_id then
        v_other_user := v_conversation.professional_id;
      elsif auth.uid() = v_conversation.professional_id then
        v_other_user := v_conversation.customer_id;
      else
        raise exception 'You cannot send messages in this conversation';
      end if;

      if not public.is_korvo_action_allowed(auth.uid(), 'message') then
        return jsonb_build_object(
          'status','blocked',
          'reason_code','account_restricted',
          'message','Messaging is currently restricted on this Korvo account.'
        );
      end if;

      if public.is_blocked_between(auth.uid(), v_other_user) then
        return jsonb_build_object(
          'status','blocked',
          'reason_code','user_blocked',
          'message','Messaging is unavailable between these Korvo accounts.'
        );
      end if;

      select count(*)
      into v_recent_count
      from public.messages m
      where m.sender_id = auth.uid()
        and m.created_at >= now() - interval '60 seconds';

      if v_recent_count >= 30 then
        return jsonb_build_object(
          'status','blocked',
          'reason_code','rate_limited',
          'message','Too many messages were sent too quickly. Please wait a moment and try again.'
        );
      end if;

      v_classification := public.classify_message_safety(v_body);
      v_action := coalesce(v_classification->>'action', 'allowed');
      v_rule_code := v_classification->>'rule_code';
      v_notice := v_classification->>'message';

      if v_action = 'blocked' then
        insert into public.message_moderation_events (
          user_id,
          conversation_id,
          action,
          rule_code,
          attempted_body
        )
        values (
          auth.uid(),
          v_conversation.id,
          'blocked',
          coalesce(v_rule_code, 'policy'),
          v_body
        );

        return jsonb_build_object(
          'status','blocked',
          'reason_code',coalesce(v_rule_code, 'policy'),
          'message',coalesce(v_notice, 'This message cannot be sent under Korvo messaging rules.')
        );
      end if;

      insert into public.messages (
        conversation_id,
        sender_id,
        body
      )
      values (
        v_conversation.id,
        auth.uid(),
        v_body
      )
      returning *
      into v_message;

      if v_action = 'flagged' then
        insert into public.message_moderation_events (
          user_id,
          conversation_id,
          message_id,
          action,
          rule_code,
          attempted_body
        )
        values (
          auth.uid(),
          v_conversation.id,
          v_message.id,
          'flagged',
          coalesce(v_rule_code, 'review'),
          v_body
        );
      end if;

      return jsonb_build_object(
        'status','sent',
        'moderation',v_action,
        'notice',v_notice,
        'message',jsonb_build_object(
          'id',v_message.id,
          'conversation_id',v_message.conversation_id,
          'sender_id',v_message.sender_id,
          'body',v_message.body,
          'created_at',v_message.created_at
        )
      );
    end;
    $function$;
revoke all on function korvo_api_private.send_korvo_message(p_conversation_id uuid, p_body text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.send_korvo_message(p_conversation_id uuid, p_body text) to authenticated;
create or replace function public.send_korvo_message(p_conversation_id uuid, p_body text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.send_korvo_message(p_conversation_id, p_body); $wrapper$;
revoke all on function public.send_korvo_message(p_conversation_id uuid, p_body text) from public, anon, authenticated, service_role;
grant execute on function public.send_korvo_message(p_conversation_id uuid, p_body text) to authenticated;

-- Reviewed API: submit_job_review; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.submit_job_review(p_job_id uuid, p_rating integer, p_comment text DEFAULT ''::text)
 RETURNS public.reviews
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
    declare
      v_active_job public.active_jobs%rowtype;
      v_review public.reviews%rowtype;
    begin
      if auth.uid() is null or not exists (select 1 from auth.users u where u.id = auth.uid()) then
        raise exception 'Authentication required' using errcode = '42501';
      end if;

      if auth.uid() is null then
        raise exception 'Authentication required';
      end if;

      if p_rating is null or p_rating < 1 or p_rating > 5 then
        raise exception 'Rating must be between 1 and 5';
      end if;

      select *
      into v_active_job
      from public.active_jobs
      where job_id = p_job_id
        and customer_id = auth.uid()
      for update;

      if not found then
        raise exception 'Completed job not found';
      end if;

      if v_active_job.status <> 'completed' then
        raise exception 'You can only review a completed job';
      end if;

      if exists (
        select 1
        from public.reviews
        where job_id = p_job_id
      ) then
        raise exception 'A review has already been submitted for this job';
      end if;

      insert into public.reviews (
        active_job_id,
        job_id,
        customer_id,
        professional_id,
        rating,
        comment,
        job_title,
        job_reference,
        professional_name,
        created_at,
        updated_at
      )
      values (
        v_active_job.id,
        v_active_job.job_id,
        v_active_job.customer_id,
        v_active_job.professional_id,
        p_rating,
        trim(coalesce(p_comment, '')),
        v_active_job.job_title,
        v_active_job.job_reference,
        v_active_job.professional_name,
        now(),
        now()
      )
      returning *
      into v_review;

      return v_review;
    end;
    $function$;
revoke all on function korvo_api_private.submit_job_review(p_job_id uuid, p_rating integer, p_comment text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.submit_job_review(p_job_id uuid, p_rating integer, p_comment text) to authenticated;
create or replace function public.submit_job_review(p_job_id uuid, p_rating integer, p_comment text DEFAULT ''::text)
returns public.reviews
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.submit_job_review(p_job_id, p_rating, p_comment); $wrapper$;
revoke all on function public.submit_job_review(p_job_id uuid, p_rating integer, p_comment text) from public, anon, authenticated, service_role;
grant execute on function public.submit_job_review(p_job_id uuid, p_rating integer, p_comment text) to authenticated;

revoke all on function public.sync_payment_review_from_booking_payment() from public, anon, authenticated, service_role;
alter function public.sync_payment_review_from_booking_payment() set search_path = '';

revoke all on function public.sync_verification_badges() from public, anon, authenticated, service_role;
alter function public.sync_verification_badges() set search_path = '';

-- Reviewed API: unblock_korvo_user; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.unblock_korvo_user(p_blocked_user_id uuid)
 RETURNS boolean
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

      delete from public.user_blocks
      where blocker_id = auth.uid()
        and blocked_id = p_blocked_user_id;

      get diagnostics v_count = row_count;

      return v_count > 0;
    end;
    $function$;
revoke all on function korvo_api_private.unblock_korvo_user(p_blocked_user_id uuid) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.unblock_korvo_user(p_blocked_user_id uuid) to authenticated;
create or replace function public.unblock_korvo_user(p_blocked_user_id uuid)
returns boolean
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.unblock_korvo_user(p_blocked_user_id); $wrapper$;
revoke all on function public.unblock_korvo_user(p_blocked_user_id uuid) from public, anon, authenticated, service_role;
grant execute on function public.unblock_korvo_user(p_blocked_user_id uuid) to authenticated;

-- Reviewed API: update_open_job; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.update_open_job(p_job_id uuid, p_title text, p_description text, p_category text, p_city text, p_state text, p_budget_min numeric, p_budget_max numeric, p_preferred_date date, p_timeframe text)
 RETURNS jsonb
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
      where id = p_job_id
      for update;

      if not found then
        raise exception 'Job not found';
      end if;

      if v_job.customer_id <> auth.uid() then
        raise exception 'You cannot edit this job';
      end if;

      if v_job.status <> 'open' then
        raise exception 'Only open jobs can be edited';
      end if;

      if nullif(trim(coalesce(p_title, '')), '') is null then
        raise exception 'Job title is required';
      end if;

      if nullif(trim(coalesce(p_description, '')), '') is null then
        raise exception 'Job description is required';
      end if;

      if nullif(trim(coalesce(p_category, '')), '') is null then
        raise exception 'Job category is required';
      end if;

      if nullif(trim(coalesce(p_city, '')), '') is null then
        raise exception 'City is required';
      end if;

      if p_budget_min is not null
         and p_budget_max is not null
         and p_budget_min > p_budget_max then
        raise exception 'Minimum budget cannot exceed maximum budget';
      end if;

      update public.jobs
      set
        title = trim(p_title),
        description = trim(p_description),
        category = trim(p_category),
        city = trim(p_city),
        state = upper(trim(coalesce(nullif(p_state, ''), 'GA'))),
        budget_min = p_budget_min,
        budget_max = p_budget_max,
        preferred_date = p_preferred_date,
        timeframe = nullif(trim(coalesce(p_timeframe, '')), ''),
        updated_at = now()
      where id = v_job.id;

      return jsonb_build_object(
        'job_id', v_job.id,
        'status', 'open',
        'updated', true
      );
    end;
    $function$;
revoke all on function korvo_api_private.update_open_job(p_job_id uuid, p_title text, p_description text, p_category text, p_city text, p_state text, p_budget_min numeric, p_budget_max numeric, p_preferred_date date, p_timeframe text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.update_open_job(p_job_id uuid, p_title text, p_description text, p_category text, p_city text, p_state text, p_budget_min numeric, p_budget_max numeric, p_preferred_date date, p_timeframe text) to authenticated;
create or replace function public.update_open_job(p_job_id uuid, p_title text, p_description text, p_category text, p_city text, p_state text, p_budget_min numeric, p_budget_max numeric, p_preferred_date date, p_timeframe text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.update_open_job(p_job_id, p_title, p_description, p_category, p_city, p_state, p_budget_min, p_budget_max, p_preferred_date, p_timeframe); $wrapper$;
revoke all on function public.update_open_job(p_job_id uuid, p_title text, p_description text, p_category text, p_city text, p_state text, p_budget_min numeric, p_budget_max numeric, p_preferred_date date, p_timeframe text) from public, anon, authenticated, service_role;
grant execute on function public.update_open_job(p_job_id uuid, p_title text, p_description text, p_category text, p_city text, p_state text, p_budget_min numeric, p_budget_max numeric, p_preferred_date date, p_timeframe text) to authenticated;

-- Reviewed API: upsert_job_private_details; authorization remains inside the private implementation.
CREATE OR REPLACE FUNCTION korvo_api_private.upsert_job_private_details(p_job_id uuid, p_service_address_line1 text, p_service_address_line2 text DEFAULT NULL::text, p_service_city text DEFAULT 'Atlanta'::text, p_service_state text DEFAULT 'GA'::text, p_service_postal_code text DEFAULT ''::text, p_access_notes text DEFAULT NULL::text)
 RETURNS jsonb
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
      where id = p_job_id
      for update;

      if not found then
        raise exception 'Job not found';
      end if;

      if v_job.customer_id <> auth.uid() then
        raise exception 'You cannot update private details for this job';
      end if;

      if v_job.status in ('completed', 'cancelled') then
        raise exception 'Closed jobs cannot be edited';
      end if;

      if nullif(trim(p_service_address_line1), '') is null then
        raise exception 'Service address is required';
      end if;

      if nullif(trim(p_service_city), '') is null then
        raise exception 'Service city is required';
      end if;

      if nullif(trim(p_service_state), '') is null then
        raise exception 'Service state is required';
      end if;

      if nullif(trim(p_service_postal_code), '') is null then
        raise exception 'Postal code is required';
      end if;

      insert into public.job_private_details (
        job_id,
        customer_id,
        service_address_line1,
        service_address_line2,
        service_city,
        service_state,
        service_postal_code,
        access_notes,
        created_at,
        updated_at
      )
      values (
        p_job_id,
        auth.uid(),
        trim(p_service_address_line1),
        nullif(trim(coalesce(p_service_address_line2, '')), ''),
        trim(p_service_city),
        upper(trim(p_service_state)),
        trim(p_service_postal_code),
        nullif(trim(coalesce(p_access_notes, '')), ''),
        now(),
        now()
      )
      on conflict (job_id) do update
      set
        service_address_line1 = excluded.service_address_line1,
        service_address_line2 = excluded.service_address_line2,
        service_city = excluded.service_city,
        service_state = excluded.service_state,
        service_postal_code = excluded.service_postal_code,
        access_notes = excluded.access_notes,
        updated_at = now();

      return jsonb_build_object(
        'job_id', p_job_id,
        'status', 'saved'
      );
    end;
    $function$;
revoke all on function korvo_api_private.upsert_job_private_details(p_job_id uuid, p_service_address_line1 text, p_service_address_line2 text, p_service_city text, p_service_state text, p_service_postal_code text, p_access_notes text) from public, anon, authenticated, service_role;
grant execute on function korvo_api_private.upsert_job_private_details(p_job_id uuid, p_service_address_line1 text, p_service_address_line2 text, p_service_city text, p_service_state text, p_service_postal_code text, p_access_notes text) to authenticated;
create or replace function public.upsert_job_private_details(p_job_id uuid, p_service_address_line1 text, p_service_address_line2 text DEFAULT NULL::text, p_service_city text DEFAULT 'Atlanta'::text, p_service_state text DEFAULT 'GA'::text, p_service_postal_code text DEFAULT ''::text, p_access_notes text DEFAULT NULL::text)
returns jsonb
language sql volatile security invoker set search_path = ''
as $wrapper$ select korvo_api_private.upsert_job_private_details(p_job_id, p_service_address_line1, p_service_address_line2, p_service_city, p_service_state, p_service_postal_code, p_access_notes); $wrapper$;
revoke all on function public.upsert_job_private_details(p_job_id uuid, p_service_address_line1 text, p_service_address_line2 text, p_service_city text, p_service_state text, p_service_postal_code text, p_access_notes text) from public, anon, authenticated, service_role;
grant execute on function public.upsert_job_private_details(p_job_id uuid, p_service_address_line1 text, p_service_address_line2 text, p_service_city text, p_service_state text, p_service_postal_code text, p_access_notes text) to authenticated;

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.job_matching_config from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.job_matching_config as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.job_matching_config is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.payment_webhook_events from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.payment_webhook_events as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.payment_webhook_events is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.platform_admins from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.platform_admins as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.platform_admins is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.professional_badges from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.professional_badges as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.professional_badges is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.professional_verification_history from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.professional_verification_history as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.professional_verification_history is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

-- Backend-only table: no direct API access, including future accidental grants.
revoke all on public.professional_verifications from public, anon, authenticated, service_role;
create policy backend_only_deny_clients on public.professional_verifications as restrictive for all to anon, authenticated using (false) with check (false);
comment on policy backend_only_deny_clients on public.professional_verifications is 'Intentionally backend-only. Audited private functions authorize access; clients have no direct grants.';

alter policy "Professionals can view own subscription" on public.professional_subscriptions using (((professional_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Professionals can view own job usage" on public.professional_job_usage using (((professional_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Professionals can view own subscription history" on public.professional_subscription_history using (((professional_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Booking participants can view payment status" on public.booking_payments using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Participants can view messages" on public.messages using ((EXISTS ( SELECT 1
   FROM conversations c
  WHERE ((c.id = messages.conversation_id) AND ((c.customer_id = (select auth.uid())) OR (c.professional_id = (select auth.uid())))))));

alter policy "Customers and professionals can view relevant reviews" on public.reviews using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Participants can view conversations" on public.conversations using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Customers and professionals can view active jobs" on public.active_jobs using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Users can create own profile" on public.profiles with check (((select auth.uid()) = id));

alter policy "Users can update own profile" on public.profiles using (((select auth.uid()) = id)) with check (((select auth.uid()) = id));

alter policy "Users can view own profile" on public.profiles using (((select auth.uid()) = id));

alter policy "Customers and professionals can view jobs" on public.jobs using ((((select auth.uid()) = customer_id) OR ((status = 'open'::text) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.account_type = 'professional'::text) AND (profiles.is_active = true)))))));

alter policy "Customers can create their own jobs" on public.jobs with check ((((select auth.uid()) = customer_id) AND (EXISTS ( SELECT 1
   FROM profiles
  WHERE ((profiles.id = (select auth.uid())) AND (profiles.account_type = 'customer'::text))))));

alter policy "Customers and professionals can view relevant quotes" on public.quotes using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id)));

alter policy "Professionals can submit their own quotes" on public.quotes with check ((((select auth.uid()) = professional_id) AND (EXISTS ( SELECT 1
   FROM profiles p
  WHERE ((p.id = (select auth.uid())) AND (p.account_type = 'professional'::text) AND (p.is_active = true)))) AND (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = quotes.job_id) AND (j.customer_id = quotes.customer_id) AND (j.status = 'open'::text))))));

alter policy "Professionals can create own profile" on public.professional_profiles with check (((select auth.uid()) = id));

alter policy "Professionals can update own profile" on public.professional_profiles using (((select auth.uid()) = id)) with check (((select auth.uid()) = id));

alter policy "Professionals can view own profile" on public.professional_profiles using (((select auth.uid()) = id));

alter policy "Customers can insert own private job details" on public.job_private_details with check ((((select auth.uid()) = customer_id) AND (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = job_private_details.job_id) AND (j.customer_id = (select auth.uid())))))));

alter policy "Customers can update own private job details" on public.job_private_details using (((select auth.uid()) = customer_id)) with check ((((select auth.uid()) = customer_id) AND (EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = job_private_details.job_id) AND (j.customer_id = (select auth.uid())))))));

alter policy "Customers can view own private job details" on public.job_private_details using (((select auth.uid()) = customer_id));

alter policy "Project participants can view closures" on public.project_closures using (((EXISTS ( SELECT 1
   FROM jobs j
  WHERE ((j.id = project_closures.job_id) AND (j.customer_id = (select auth.uid()))))) OR (EXISTS ( SELECT 1
   FROM active_jobs aj
  WHERE ((aj.id = project_closures.active_job_id) AND (aj.professional_id = (select auth.uid())))))));

alter policy "Users can update own notifications" on public.notifications using (((select auth.uid()) = user_id)) with check (((select auth.uid()) = user_id));

alter policy "Users can view own notifications" on public.notifications using (((select auth.uid()) = user_id));

alter policy "Project participants and admins can view issues" on public.project_issues using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id) OR (select public.is_korvo_admin())));

alter policy "Project participants and admins can view issue messages" on public.project_issue_messages using (((select public.is_korvo_admin()) OR (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE ((pi.id = project_issue_messages.issue_id) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Project participants can send issue messages" on public.project_issue_messages with check (((sender_id = (select auth.uid())) AND (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE ((pi.id = project_issue_messages.issue_id) AND (pi.status = ANY (ARRAY['open'::text, 'under_review'::text])) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Users and admins can view restrictions" on public.account_restrictions using (((user_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Issue participants and admins can view evidence" on public.project_issue_evidence using (((select public.is_korvo_admin()) OR (EXISTS ( SELECT 1
   FROM project_issues pi
  WHERE ((pi.id = project_issue_evidence.issue_id) AND ((pi.customer_id = (select auth.uid())) OR (pi.professional_id = (select auth.uid()))))))));

alter policy "Users can view own blocks" on public.user_blocks using (((select auth.uid()) = blocker_id));

alter policy "Admins can view issue admin notes" on public.project_issue_admin_notes using ((select public.is_korvo_admin()));

alter policy "Admins can view case audit log" on public.case_audit_log using ((select public.is_korvo_admin()));

alter policy "Payment review participants and admins can view" on public.payment_reviews using ((((select auth.uid()) = customer_id) OR ((select auth.uid()) = professional_id) OR (select public.is_korvo_admin())));

alter policy "Reporters can view own reports" on public.trust_safety_reports using (((reporter_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Admins can view moderation events" on public.message_moderation_events using ((select public.is_korvo_admin()));

alter policy "Users and admins can view strikes" on public.account_strikes using (((user_id = (select auth.uid())) OR (select public.is_korvo_admin())));

alter policy "Admins can view trust safety audit" on public.trust_safety_audit_log using ((select public.is_korvo_admin()));


-- Protect standing, account type, and completed onboarding against self-escalation.
-- Invoker triggers inspect the actual database role, never user-editable JWT metadata.
create or replace function korvo_api_private.protect_profile_security_fields()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user not in ('anon','authenticated') then return new; end if;
  if new.account_type is null or new.account_type not in ('customer','professional') then
    raise exception 'Invalid account type' using errcode='42501';
  end if;
  if tg_op='INSERT' then
    new.is_active := true;
  else
    if new.is_active is distinct from old.is_active then
      raise exception 'Account standing is managed by Korvo' using errcode='42501';
    end if;
    if new.account_type is distinct from old.account_type and nullif(old.account_type,'') is not null then
      raise exception 'Account type cannot be changed directly' using errcode='42501';
    end if;
  end if;
  if new.account_type='professional' and new.onboarding_complete is true and not exists (
    select 1 from public.professional_profiles pp where pp.id=new.id
      and nullif(btrim(pp.business_name),'') is not null
      and cardinality(pp.services)>0 and cardinality(pp.service_areas)>0
  ) then
    raise exception 'Complete the professional profile before onboarding' using errcode='42501';
  end if;
  return new;
end; $$;
revoke all on function korvo_api_private.protect_profile_security_fields() from public, anon, authenticated, service_role;
create trigger protect_profile_security_fields before insert or update on public.profiles
for each row execute function korvo_api_private.protect_profile_security_fields();

create or replace function korvo_api_private.protect_professional_profile_owner()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') and not exists (
    select 1 from public.profiles p where p.id=new.id and p.account_type='professional' and p.is_active=true
  ) then
    raise exception 'Active professional account required' using errcode='42501';
  end if;
  return new;
end; $$;
revoke all on function korvo_api_private.protect_professional_profile_owner() from public, anon, authenticated, service_role;
create trigger protect_professional_profile_owner before insert or update on public.professional_profiles
for each row execute function korvo_api_private.protect_professional_profile_owner();

create or replace function korvo_api_private.protect_new_job_state()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  if current_user in ('anon','authenticated') then
    if not exists(select 1 from public.profiles p where p.id=auth.uid() and p.is_active=true) then
      raise exception 'Active account required' using errcode='42501';
    end if;
    if exists(select 1 from public.account_restrictions r where r.user_id=auth.uid()
      and r.status='active' and r.restriction_type in ('posting_disabled','suspended')
      and (r.expires_at is null or r.expires_at>now())) then
      raise exception 'Job posting is restricted' using errcode='42501';
    end if;
    if new.status is distinct from 'open' then
      raise exception 'New jobs must start open' using errcode='42501';
    end if;
    new.closed_at := null; new.closed_by := null;
    new.closed_reason := null; new.closed_by_role := null;
  end if;
  return new;
end; $$;
revoke all on function korvo_api_private.protect_new_job_state() from public, anon, authenticated, service_role;
create trigger protect_new_job_state before insert on public.jobs
for each row execute function korvo_api_private.protect_new_job_state();

-- Jobs are written through owner-authorized RPCs after creation. Private job details
-- must also use their RPC, which rejects edits after closure.
revoke insert, update on public.job_private_details from authenticated;
notify pgrst, 'reload schema';

-- The older transfer-tracking table is backend-only while transfers remain disabled.
revoke all on public.job_payment_transfers from public,anon,authenticated,service_role;
create policy transfer_tracking_backend_only on public.job_payment_transfers
as restrictive for all to anon,authenticated using(false) with check(false);
