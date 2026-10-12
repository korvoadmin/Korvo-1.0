# Korvo 1.0 Owner Action & Testing Checklist

Updated during the October 12, 2026 development sprint. Active items below require
owner judgment, account access, or explicit authorization. Development and tests
that the engineer can run are tracked separately and must not be assigned to Chris.

## Confirmed decisions and completed history

| ID | Confirmed/completed item | Evidence |
| --- | --- | --- |
| H1 | Professional receives 100% of their agreed quote; customer pays quote plus 12% Korvo fee | Chris's final October 12 correction; `PAYMENT_PRICING_SPEC.md` |
| H2 | All payment development remains sandbox-only | Sprint instructions |
| H3 | Stripe's hosted onboarding page opens from Professional Dashboard | Chris personally confirmed October 12 |
| H4 | Server denies client changes to account type/standing | Prior deployed migration and 102-check diagnostic |
| H5 | $100/$500/$1,000 quote-pricing regression tests pass | 11 local pricing tests this sprint |
| H6 | Membership catalog preserved: one free job, $29.99/3 jobs, $49.99/6 jobs, $89.99/unlimited | Prior confirmed pricing and current database catalog agree; do not ask Chris to select prices again |
| H7 | Genuine sandbox customer charges, decline/retry, partial/full refund, cancellation return and late issue hold verified | Deployed functions/provider/database checks; all contractor allocations remain held |
| H8 | Real participant messaging, completion, feedback and private evidence isolation verified | 29 actual Auth/API/Storage checks; synthetic accounts globally signed out and deactivated |

The earlier 88/12 deduction instruction and fee-only deposit flow are superseded.
Do not ask Chris to reconfirm H1 or H3. No processing-fee payer has been selected.

## A. Decisions required

| ID / priority | Question and options | Recommendation and tradeoffs | Development dependency |
| --- | --- | --- | --- |
| D1 / P0 | Who economically absorbs Stripe processing costs: Korvo from its 12% fee, customer via a separately disclosed charge, or a separately agreed professional adjustment? | Recommend Korvo absorbs costs from its fee for beta: keeps the confirmed customer total and full professional quote clear; lowers Korvo net margin and needs a reserve. Extra customer charges need disclosure and legal/provider review; professional deductions require explicit agreement. | Live financial policy, final receipts and net-revenue reporting. Gross sandbox amounts remain quote + 12%. |
| D2 / P0 | Cancellation/refund rules: full refund before work, staged cancellation charges, or case-by-case support decisions? Should the Korvo fee be refundable when the pro cancels/no-shows? | Recommend full customer refund for pro cancellation/no-show and support-reviewed customer cancellations during beta. Protects trust; costs/refund exposure remain. Staged penalties need defined timing, exceptions and assent. | Automatic refund/cancellation rules and customer terms. No nonrefundable fee or penalty will be silently enabled. |
| D3 / P0 | Release after customer confirmation: immediate, defined issue-report window, or manual support review during beta? | Recommend manual support review during the small beta, then a clearly disclosed window. More operator work and slower transfers, but catches unresolved issues. Immediate release increases recovery risk; a window delays professional access. | Automatic transfer release and customer issue deadline. Verified payment/completion and onboarding remain mandatory. |
| D4 / P0 | Which existing Korvo user should be the owner/admin for financial/support operations? | Use Chris's verified account; do not guess the UUID or grant privilege from editable user metadata. Least-privilege support accounts should not move money. | Admin operations and genuine owner acceptance testing. No owner account was found in the initial database inspection. |
| D5 / P1 | When should reserved membership usage be restored after an approved pre-work cancellation: support review or automatic once-only restoration? | Recommend support review for initial beta: catches repeated cancellations, but requires operator work. Automatic restoration is simpler but needs explicit eligibility/replay rules. Prices and job allowances are already confirmed in H6; existing reservation at acceptance remains unchanged. | Automated allowance restoration and final membership cancellation terms; Stripe Billing integration can proceed independently with the existing catalog. |
| D6 / P0 | Which trade categories require license/identity/background verification in Atlanta beta? | Start with explicitly approved categories and documented requirements; avoid labeling unverified providers as verified. More verification narrows launch supply and introduces review cost. | Public beta eligibility, trust badges, verification policy. |
| D7 / P0 | Which support contact/channel and final customer/professional terms should beta users receive? | Recommend one monitored support route and clearly published payment/cancellation/privacy terms. Simple to operate, but Chris must approve contact details and customer promises; no address or guarantee will be invented. | Published policy pages, support escalation and closed-beta invitations. |

## B. Manual tests that automation could not finish reliably

| ID / priority | Page, steps and expected result | Return information | Sandbox safety / dependency |
| --- | --- | --- | --- |
| M1 / P0 | In the existing sandbox Professional Dashboard: 1) Connect Stripe Payouts; 2) confirm Stripe's Sandbox label; 3) complete required hosted setup using Stripe's documented test data (https://docs.stripe.com/connect/testing); 4) return; 5) refresh Stripe status. Expected: complete only after Stripe reports submitted details, enabled payouts and active transfers; incomplete/restricted must stay not ready. | Korvo status and whether Stripe reported completion; a cropped Korvo-status screenshot is enough. Never return SSNs, banking details, tokens or documents. | Safe in sandbox; actual transfers remain disabled. Automated link/status/ownership and genuine thin-event checks passed; hosted completion timed out/returned to login in automation. Opening alone is already H3 and is not requested again. |
| M2 / P0, after approved recovery-page publication | 1) Register one controlled beta email account; 2) confirm the real email; 3) log in; 4) Forgot password → request link; 5) open that link and set a new password; 6) confirm the old password fails and the new password works; 7) reuse the old link and confirm it cannot reset again. | Which step succeeded/failed and the displayed error, without passwords or reset links. | No payment/transfer occurs. Engineer tested request/reset UI and existing Auth logins, but cannot reliably receive the owner's email. Depends on callback allowlisting and approved Pages publication; do not run against the current empty recovery page. |

M1 concerns completion, not reopening an already verified link. M2 activates only
after its publication/configuration dependencies. Do not submit real identity
documents, SSNs, bank details, or payment methods to a synthetic sandbox rehearsal.

## C. Approvals required

| ID / priority | Approval | Concrete prerequisite |
| --- | --- | --- |
| A1 / P0 | Any live Stripe payment, transfer or payout enablement | Verified sandbox end-to-end flow, clean security gates, D1–D4 and customer terms, owner authorization. Silence is not approval. |
| A2 / P0 | Production-facing changes that have not passed relevant tests | Reviewable development commit and test evidence. Unverified code must remain off main and undeployed. |
| A3 / P1 | Paid Supabase upgrade to enable leaked-password protection | Owner approves plan/cost; engineer verifies protection after upgrade. No upgrade has been purchased. |
| A4 / P1 | Deleting retained synthetic Korvo users/test records or Stripe sandbox accounts | Exact fixture inventory, global sign-out, and scoped cleanup proposal; preserve existing users. |
| A5 / P0 | Major cancellation/no-show penalties or changes to customer pricing | D1/D2 decision, precise displayed terms, acceptance evidence and test cases. |
| A6 / P0 | Broad Supabase authorization hardening proposal | Automatic approval review rejected its live deployment because it changes privileges, policies, triggers and many production functions. Proposal: `supabase/proposals/20261012160000_harden_korvo_api_permissions.sql`. Initial full rehearsal passed 131 checks; additional financial-role checks passed six focused checks. A complete updated rehearsal must pass before deployment; repeat attempts encountered expired MCP request state. Approval does not waive testing. |
| A7 / P0 | Enabling actual contractor transfers, even in sandbox | Chris explicitly requires approval. Verify owner/admin authorization, payment, completion evidence, fresh Connect status, issue/refund/dispute holds, balance/reserve, durable idempotency and reconciliation first. Current evaluator cannot execute transfers. |
| A8 / P0 | Merge/publish the development payment/recovery frontend to main/Pages | Reviewable development changes, passing checks and final linked policy/error copy. No main merge or Pages publication is implied by a development push. |

## Dependencies and engineering status

Engineering tasks, automated results and unresolved technical checks are maintained
in `SUPABASE_SECURITY_AUDIT.md` and `CLOSED_BETA_READINESS.md`; they are not manual
assignments for Chris. The earlier usage-review interruption is not an active blocker.
A6 is a separate explicit authorization-deployment rejection and remains unresolved.
Real-money beta remains blocked by financial policy, verified onboarding, security
and release/admin integration. M2 depends on A8 and callback/email configuration;
A7 depends on D1–D4 and release safeguards; A1 depends on all money-handling gates.

## Update procedure

Update this file with each development commit. Move completed owner items into
history with evidence. Keep decision IDs stable, record dependencies, and remove
manual tests whenever reliable automation covers them. This is maintained during
active development sessions; no unattended background execution is promised.
