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

