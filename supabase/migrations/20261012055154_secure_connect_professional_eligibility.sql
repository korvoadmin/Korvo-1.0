-- Capture the previously dashboard-created mapping without changing existing rows.
create table if not exists public.professional_stripe_accounts (
 professional_id uuid primary key references public.profiles(id) on delete cascade,
 stripe_account_id text not null unique,
 onboarding_status text not null default 'pending'
   check (onboarding_status in ('pending','in_progress','complete','restricted')),
 charges_enabled boolean not null default false,
 payouts_enabled boolean not null default false,
 details_submitted boolean not null default false,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.professional_stripe_accounts enable row level security;
revoke all on public.professional_stripe_accounts from public, anon, authenticated, service_role;
grant select, insert, update on public.professional_stripe_accounts to service_role;
-- Backend-only, even if a future migration accidentally grants client SELECT.
create policy stripe_accounts_backend_only on public.professional_stripe_accounts
 as restrictive for all to anon, authenticated using (false) with check (false);

-- A customer's self-editable profile must not be a route to professional-only APIs.
-- Existing signup and professional onboarding may repeat the same account type.
create schema if not exists korvo_connect_private;
revoke all on schema korvo_connect_private from public, anon, authenticated;
create or replace function korvo_connect_private.protect_profile_eligibility()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
 if current_user in ('anon','authenticated') then
  if tg_op = 'INSERT' then
   if new.account_type is null or new.account_type not in ('customer','professional')
      or new.is_active is distinct from true then
    raise exception 'Invalid account eligibility' using errcode = '42501';
   end if;
  elsif new.account_type is distinct from old.account_type
     or new.is_active is distinct from old.is_active then
   raise exception 'Account type and standing are managed by Korvo' using errcode = '42501';
  end if;
 end if;
 return new;
end;
$$;
revoke all on function korvo_connect_private.protect_profile_eligibility() from public, anon, authenticated;
create trigger protect_connect_profile_eligibility before insert or update on public.profiles
 for each row execute function korvo_connect_private.protect_profile_eligibility();
notify pgrst, 'reload schema';
