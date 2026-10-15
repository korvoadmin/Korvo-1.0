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

