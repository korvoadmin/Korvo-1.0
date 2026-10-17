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

