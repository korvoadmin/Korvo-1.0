# Korvo 1.0 sprint report — October 12, 2026

## Owner dashboard

| Category | Status |
| --- | --- |
| Completed | Correct full quote + 12% sandbox collection; genuine payment/failure/retry/refund/late-issue hold synchronization; real messaging/completion/feedback/private Storage checks; safe checkout diagnostics; bounded webhook body; 53 FK indexes |
| Development code | Participant payment cards, recovery request/reset pages, transfer-readiness evaluator, expanded suites and isolated GitHub CI workflow |
| Tests | Final local unit/source run: 69 passed. Browser suites: 29 + 26 + 8 + 19 + 16. Deployed SQL: 38 payment and 56 matching. Actual API runners: 26 payment, 11 Connect, 8 webhook, 29 workflow/Storage. Tests in different layers are reported separately, not summed as independent end-to-end cases. |
| Security proposal | Initial full 131-check rehearsal passed; six financial-role component checks passed. Updated combined 134-check run is not verified: two calls returned invalid/expired MCP request state. Live deployment separately rejected by automatic approval review. |
| Decisions | Processing-cost payer; cancellation/refund policy; release window/reserve/aging policy; owner account; allowance restoration; trade verification; published support/terms. Confirmed membership prices are preserved. |
| Manual tests | Completed hosted Connect setup; actual email confirmation/recovery after publication. Existing hosted-link opening is already confirmed and is not repeated. |
| Approvals | Broad authorization deployment after complete regression; main/Pages publication; any transfer enablement including sandbox; live payments; paid security feature; destructive cleanup; major policy changes |
| Beta | Not ready for money-handling closed beta. Sandbox-only rehearsal works; all releases held. |

## Payment verification

| Quote | Customer charge / frozen allocations | Actual scenario and final observed state |
| --- | --- | --- |
| $100 | $112 total; $100 professional / $12 Korvo gross | Hosted Stripe sandbox payment succeeded; $11.20 partial refund then $100.80 remainder succeeded; Supabase fully refunded $112, review required, held |
| $500 | $560 total; $500 professional / $60 Korvo gross | Hosted Back/cancel returned unpaid; later paid through the earlier session after a synthetic Korvo issue opened; Supabase paid with review required, held |
| $1,000 | $1,120 total; $1,000 professional / $120 Korvo gross | Insufficient-funds decline recorded failed; retry succeeded on same PaymentIntent; professional/customer completion and feedback persisted; held |

Native Stripe reads confirmed sandbox mode and the first completed Checkout amount.
No live testing, contractor transfer or bank payout occurred. Refund examples test
mechanics only; they do not select a business cancellation policy or processing payer.
Expired Checkout reset and stale/malformed events have mock/rollback coverage, not
complete genuine provider-delivery acceptance. Genuine chargeback lifecycle, async
methods, transfer/reversal/reconciliation and complete hosted Connect setup remain.

## Applied migrations and deployed functions

Applied this sprint:

- `20261012142416_sandbox_marketplace_payments.sql`
- `20261012150819_index_korvo_foreign_keys.sql`
- `20261012153716_hold_marketplace_payments_for_issues.sql`

Deployed: `create-booking-checkout` v5; `stripe-webhook` v5;
`create-connect-onboarding` v6. A sandbox Accounts v2 thin-event destination was
created, with signing secret stored encrypted server-side in Vault. Existing snapshot
webhook remains in place. No credentials were exposed, requested or rotated.

Unapplied: `supabase/proposals/20261012160000_harden_korvo_api_permissions.sql`.
Do not move it into automatic migrations or split/deploy it to bypass the approval
rejection. Authorization deployment requires approval and a fresh complete suite.

GitHub publication status is recorded in the commit/PR accompanying this report.
Main/Pages publication has not been authorized or performed by this sprint.
GitHub CI has been configured; its remote result must be checked independently of
the passing local commands.

## Files changed

Frontend: `customer-dashboard.html/js`, `professional-dashboard.html/js`,
`marketplace-payments.js`, `forgot-password.html`, `reset-password.html`,
`password-recovery.js`.

Backend: shared `pricing.mjs`, `stripe.mjs`, `connect.mjs`, `release.mjs`;
Checkout/webhook entrypoints and handlers; Connect handler; three applied migrations;
one unapplied authorization proposal. Release code evaluates readiness only; it has
no transfer execution adapter, endpoint or enabled feature flag.

Tests: payment pricing/handlers/release/source-security unit tests; Connect tests;
customer/professional/Connect/payment/recovery browser suites; four opt-in Python
API runners and hosted Checkout browser runner; payment/security/financial-admin/
opportunity SQL fixtures; test README. CI workflow and Python ignore entries added.

Docs: pricing specification, security audit, owner checklist, beta readiness and this
report. Existing diagnostic retained.

## Retained synthetic fixtures

The following three newly created users have zero remaining Auth sessions, inactive
Korvo profiles, and reversible Auth bans; the professional is hidden from discovery.
Credentials/signing test files are temporary and must be removed at handoff.
Existing users were preserved. No test user, job, Stripe account or upload was deleted.

- Customer `d754ed3b-d42d-4ffd-9719-a24ec4f3b41a`
- Professional `2ae7626c-2c89-4af7-9b32-6aaa046d9ed3`
- Other customer `d3b4be56-950d-4a1b-bb98-3876f8a749fa`
- Synthetic connected account `acct_1UPkoMP4jUDVJCfj` (incomplete, payouts disabled)
- Payment records `5e98de31-fb36-424f-9c1a-b04c0f6801cb`,
  `dbead4cb-a188-47b0-9c5a-89b355eab9ea`,
  `1dd975dd-152a-4900-9f3c-cfbebad214ed`
- Support issue `b716f14e-b997-48b9-9f25-6c70595630d5`; private PNG at
  `project-issue-evidence/b716f14e-b997-48b9-9f25-6c70595630d5/d754ed3b-d42d-4ffd-9719-a24ec4f3b41a/synthetic-fixture.png`

Deletion requires the scoped owner approval in the checklist. A synthetic five-star
review is labeled as an automated test and belongs to the hidden inactive professional;
it must not be presented as a genuine customer endorsement.

## Remaining security and financial risks

Security Advisor still reports one anonymous and 52 authenticated exposed-definer
warnings, seven policyless backend tables and disabled leaked-password protection.
All 43 inspected public tables have RLS and financial raw tables have no frontend
mutation grants. Pending hardening and administrative least privilege still matter;
these observations do not establish comprehensive security completion.

Financial admin queues still need integration with full-price marketplace records.
Ordinary completion proof is not implemented by private issue-evidence uploads.
The release evaluator requires trusted ownership/payment/completion/onboarding,
owner policy, fresh balance/reserve checks and an unused durable operation; it cannot
transfer funds. Durable transfer execution and recovery must be built and accepted
before enablement. Platform available funds and automatic bank payout schedules must
be reconciled; no indefinite holding or escrow promise is made.

Published terms/privacy/support, real email recovery, session persistence, membership
Billing and provider chargeback/async/expired-session acceptance remain incomplete.
See the beta gate checklist for the next three highest-impact tasks.
