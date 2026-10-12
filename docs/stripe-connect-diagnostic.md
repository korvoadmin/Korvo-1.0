# Stripe Connect sandbox diagnostic — October 12, 2026

Scope: `create-connect-onboarding`, its professional dashboard button, and the
authorization/data boundary used by that function. The broader, previously drafted
Supabase security migrations are **not applied** by this change.

## Verified original failure

Supabase's function log at `2026-10-12T05:42:05.982Z` ties the HTTP 500 to Stripe
rejecting `POST /v1/accounts` for this new Connect integration. Stripe directs the
integration to Accounts v2. The `shutdown` entries are worker lifecycle messages;
they are not the diagnostic exception in this request.

The deployed version 1 converted all thrown database and Stripe errors to a generic
500. The dashboard then discarded even that response body. This hid the actual
account-creation failure from the person using the button.

Database inspection confirmed:

- `service_role` has schema usage and SELECT/INSERT/UPDATE on the mapping table,
  SELECT on `profiles`, and BYPASSRLS. The user's grant repaired the earlier 42501.
- `professional_id` is the primary key, so `ON CONFLICT (professional_id)` is valid.
  `stripe_account_id` also has a unique constraint.
- Required timestamps have defaults, `pending` is a valid status, and there were no
  mapping-table triggers. No constraint repair was needed.
- The existing professional is active, has a professional profile, and has completed
  Korvo onboarding. The latest original request passed authentication/eligibility.
- The mapping table originally had zero rows because Stripe account creation failed
  before the save. This was not proof that the SQL grant failed.
- Reaching Stripe after the deployed configuration checks demonstrates that the
  required environment variables were present and `STRIPE_SECRET_KEY` passed the
  `sk_test_` guard. Secret values were not requested or printed.

## Focused changes

The function now creates an Express/recipient account with Accounts v2 and creates
the hosted link with the v2 Account Links API. Both use JSON and the pinned API
version `2026-09-30.endive`. The recipient configuration requires `contact_email`;
it comes from the authenticated Auth user, not the submitted request body.

The link request follows the pinned API's accepted fields. The current stable API
rejects `use_case.account_onboarding.configurations`; this field is not submitted.

Only sandbox secret keys are accepted. A live-mode response is rejected. The function
contains no charge, Checkout, transfer, payout, or subscription creation call.
Existing Express-style platform fee/loss responsibilities are represented in the
sandbox configuration; this does not finalize Korvo's live commercial payment rules.

The account ID is saved before the link is issued. Account creation uses a per-user
idempotency key. Conflict handling cannot overwrite an existing user-to-account
mapping. Subsequent clicks reuse the saved account and request a fresh single-use
link. An unresolved database save failure still needs investigation before the
Stripe idempotency retention window expires; this is not a permanent distributed
transaction guarantee.

Authenticated `status` requests retrieve the account from Stripe and save only the
existing status flags. Stripe supports reading a v2 account through its compatible
v1 retrieval endpoint. No identity documents, bank details, full Stripe account
payload, or onboarding links are stored in the mapping table.

The dashboard accepts only HTTPS links on the exact `accounts.stripe.com` and
`connect.stripe.com` hosts, checks the sandbox response flag, disables repeated
clicks, and shows a safe failure message with a request reference. Expired links
request a new link after authentication. Returning from Stripe refreshes status;
the URL's `stripe=return` parameter never marks onboarding complete.

`complete` requires submitted details, active transfers capability, and enabled
payouts. `charges_enabled` remains a separate flag; recipient-only accounts need
not be able to take direct card charges. A pending Stripe verification is not
misrepresented as complete.

## Authorization

The function validates the JWT with Auth, requires an active professional profile
and completed Korvo onboarding, and derives every lookup from the authenticated
user's ID. It rejects submitted professional/account IDs. Stripe account metadata
must agree with the server-owned mapping before a status or link is returned.

The mapping table remains backend-only, with RLS and an explicit restrictive deny
policy for client roles. Only the service role receives SELECT/INSERT/UPDATE.

Inspection also found that clients could change their own `profiles.account_type`
and `is_active`, undermining the original contractor check. A small invoker trigger
now rejects client changes to these fields after signup. Normal profile edits and
professional onboarding's same-role update remain permitted and are tested. Backend
administration can still manage standing. This is an account-role boundary, not an
identity/background verification system; a person can intentionally register a new
professional account through the normal signup flow.

## Verification

- 15 isolated function tests: auth/eligibility, sandbox enforcement, cross-user
  inputs, idempotency/mapping reuse, failed saves, owner mismatch, status transitions,
  allowed link hosts, and safe errors.
- 12 rollback-only SQL checks, rehearsed before migration and rerun afterward:
  customer/professional signup, normal edits, role/standing protection, mapping
  writes by service role, and client/RLS denial.
- 8 browser checks of the actual dashboard Connect code: v2 redirects, safe failures,
  return/refresh handling, repeat-click protection, session requirement, host checks.
- Existing professional and customer dashboard suites: 29 + 26 checks passed.
- Deno type-check of the handler passed. Full entrypoint type-check was blocked by
  this execution environment's npm-registry connection; the deployed runtime loaded
  the pinned SDK successfully during authenticated tests.

The deployed sandbox API passed 12 authenticated acceptance checks. Stripe created
one test account, Supabase saved its ID, status retrieval persisted the real false
submission/payout flags, link creation returned HTTP 200, and a repeat start reused
the mapping. A customer was rejected, a second professional could not see that
mapping, direct client table reads were denied, and a customer could not change
account type to bypass eligibility. No real identity/bank information was submitted.

Temporary Korvo users, profiles and mappings were removed after global sign-out.
Post-cleanup counts: 2 original profiles, 1 original job, 0 booking payments, 0 Stripe
mappings, 0 remaining fixture Auth users. One empty Stripe sandbox diagnostic account
(`acct_1UPcEbP4jUdvc1pT`) remains in Stripe only, identified by test metadata; no funds
or bank details were added. The existing professional's own account will be created
when they click the button. Full completion with Stripe test identity/bank data was
not exercised; complete/restricted/pending transitions were tested in isolation.
Opening the returned Stripe page in the automated browser failed in this execution
environment. A genuine sandbox link was returned by Stripe, but hosted-page rendering
and the existing professional's own onboarding remain an owner verification step.
The isolated browser suite verifies Korvo's redirect behavior, not Stripe's UI.

## Remaining scope and launch gates

The existing `stripe-webhook` has no Connect account-status handler. This patch
refreshes status on dashboard visit/return and before each onboarding link. It does
not provide background account-update synchronization. Before real payouts, add a
verified Connect event destination, retry-safe processing, and fresh eligibility
checks at the actual transfer/payout decision point.

The existing booking Checkout function and payment webhook are outside this focused
fix. Review found that Checkout lacks the onboarding function's strict test-key
guard; the webhook also lacks a live/test event gate and records events before
business processing, treating any duplicate as handled even after a processing
failure. Do not interpret successful onboarding as payment launch readiness. These
paths were not invoked during onboarding verification.

Security/performance advisors were rerun. Outstanding project-wide items remain:
54 authenticated and 1 anonymous executable SECURITY DEFINER warnings, 7 other
policyless-table notices, leaked-password protection disabled, 33 RLS init-plan
warnings, 53 missing foreign-key-index notices, and 14 unused-index notices. The
Stripe mapping table is not policyless after this migration. Previously drafted
broad migrations must be rebased against the new Stripe tables/service-role needs
before application. No claim of a clean project-wide security audit is made here.

Leaked-password protection requires a Supabase Pro-or-higher plan. No paid upgrade
was performed. See [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Owner verification

1. Refresh the deployed Professional Dashboard, sign in as the existing professional,
   and click **Connect Stripe Payouts**. Confirm a Stripe sandbox onboarding page opens.
2. Return without supplying real bank/identity data. Korvo should show incomplete or
   action-required status, not a false success.
3. With administrative SQL, confirm one mapping for that professional and fresh
   `updated_at`/status flags. Ordinary browser clients must get permission denied
   if they request the mapping table directly.
4. Click again: the mapping/account ID must remain the same and a new link should open.
5. Use only Stripe's documented test data if completing a sandbox onboarding rehearsal.
   Returning alone is insufficient; verify server-refreshed capability/payout flags.
6. Confirm no new Checkout, payment, transfer or payout records. Contractor onboarding
   itself does not collect a customer payment or send money to a bank.

References: [Accounts v2](https://docs.stripe.com/connect/accounts-v2),
[account creation](https://docs.stripe.com/api/v2/core/accounts/create),
[account links](https://docs.stripe.com/api/v2/core/account-links/create),
[Connect testing](https://docs.stripe.com/connect/testing),
[Supabase function errors](https://supabase.com/docs/guides/functions/error-handling).
