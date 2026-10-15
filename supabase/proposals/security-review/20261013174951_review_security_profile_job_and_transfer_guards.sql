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
