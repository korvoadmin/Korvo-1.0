# Korvo controlled Atlanta beta gates

Authoritative itemized task/status register: [KORVO_MASTER_LAUNCH_CHECKLIST.md](KORVO_MASTER_LAUNCH_CHECKLIST.md).
This file is a phase-gate summary; task counts and detailed evidence belong to the master.

October 16, 2026: **NO-GO for money handling; invitation-only non-money beta also
awaits its operational gates.** Founder scope is 20 people in Atlanta, with no
invitations authorized. Korvo absorbs project processing costs; professional gross
and quote + 12% remain unchanged. See FOUNDER_POLICY_BASELINE.md. Historical sections
below preserve prior checkpoints; this current statement supersedes undecided policy descriptions.

| Priority | Gate | Current state / evidence |
| --- | --- | --- |
| P0 | Verified authorization deployment and advisor follow-up | 134-check complete rollback regression passed; broad proposal still requires explicit approval |
| P0 | Correct full-price customer collection and financial record | Sandbox success/decline/retry/refund/late-issue hold verified; no live enablement |
| P0 | Completed Connect setup reliably synchronized | Genuine thin-event incomplete synchronization verified; complete hosted setup still unverified |
| P0 | Owner financial/support permissions | No owner/admin assigned; new full-price operator queue remains needed |
| P0 | Refund/cancellation and processing-cost rules | Owner decisions; do not enable penalties or nonrefundable fees automatically |
| P0 | Completion proof, approved release delay, reserve and funds aging | Readiness checks tested; ordinary completion evidence not integrated |
| P0 | Transfers, reversals, payout reconciliation | Disabled until safeguards tested and explicit owner approval, including sandbox transfers |
| P0 | Customer protection terms, privacy and support route | Final policy/copy/support channel required; existing footer links do not establish published policies |
| P0 | Genuine email signup, confirmation and recovery | Email confirmation configured; actual email/callback acceptance remains unverified; recovery UI is development-only |
| P0 | Professional trade eligibility/trust policy | License/background/identity category rules not silently enabled; owner defines beta scope |
| P1 | Payment/recovery Pages publication | Browser-tested development code; main/Pages deployment not yet done |
| P1 | Membership billing | Confirmed catalog: one free job, $29.99/3, $49.99/6, $89.99/unlimited; Stripe Billing lifecycle still needed |
| P1 | Mobile and workflow regressions | Seven isolated browser suites passed; real API messaging/completion/storage passed; 20 additional deployed lifecycle checks passed; full UI/provider chain still needs final acceptance |
| P1 | Monitoring and operational reconciliation | Use runbook; automatic alerts/admin queue and daily aging review still needed |
| P1 | Leaked-password protection and session policy | Paid feature requires owner approval; Remember-me persistence needs implementation |
| P0 for shifts | Hospitality/employment/category clearance | All shift booking/payment disabled; employer, payroll, insurance, age/alcohol/local requirements unresolved |
| P1 for shifts | Authenticated gig endpoints and concurrent scheduling | Pricing/workflow/preview/private schema tested locally; no deployed gig API; multi-session lock test still needed |

## Operational sandbox runbook

Check function failure logs by safe request/event ID, not by dumping headers or
provider payloads. Monitor `stripe_event_receipts.processed_at`, but remember failed
transactions roll back receipts entirely: logs/provider delivery failures also matter.
No pending receipt rows alone does not prove all provider deliveries succeeded.

Reconcile Stripe session/PaymentIntent amounts and currency with frozen marketplace
records, refunded totals, connected-account ownership/capabilities and release holds.
Never repair a balance by changing original gross allocations. Ambiguous provider
operations require reconciliation using the original reference/idempotency key.
Never manufacture a second transfer key after a timeout.

Until a release policy is approved, all contractor release stays held and execution
absent. Do not promise indefinite holding or describe this as escrow. Separate
charges/transfers and bank payouts are different stages; platform available balance,
automatic platform payouts, Stripe restrictions and reserves need explicit validation
before live operation. Reference: https://docs.stripe.com/connect/separate-charges-and-transfers
and https://docs.stripe.com/connect/manual-payouts .

Before inviting beta users, distinguish synthetic profiles/jobs/reviews from genuine
marketplace activity. The retained fixture professional has been hidden/deactivated;
no synthetic review should be presented as a real customer endorsement.

## Next three highest-impact tasks

1. Approve the reviewed authorization deployment scope (134-check rehearsal passed),
   deploy it and verify security/performance advisors and workflow regressions.
2. Finish hosted Connect completion and the full-price financial admin/refund workflow
   after owner role, processing-cost and cancellation decisions.
3. Integrate completion proof and durable release/reversal reconciliation, verify
   reserves/aging rules, then request explicit sandbox transfer enablement approval.

## Marketplace scope

Korvo remains a local marketplace for projects, shifts and everyday gigs. Home/property,
hospitality and general work are preserved in the new disabled foundation. Existing
project onboarding/quotes/payments are unchanged. A project-only cleared beta may
precede shift launch; employee staffing must not inherit contractor Connect payments.
The development estimator and unapplied schema are not a functioning shift marketplace.

## Workflow follow-up

Development source now fixes job-submit validation/duplicate clicks, professional
onboarding permissions/cache recovery, conversation response/draft isolation and
completion-response validation. A successful professional completion request remains
saved even when the follow-up dashboard read fails. These changes are tested, not
published to main/Pages. Source-price records and unapproved penalty/refund rules are
unchanged. Ordinary completion evidence and project photo attachments are still not
integrated; the photo controls must not be described as a working upload feature.

## October 14 evidence/control checkpoint

Still not ready for money-handling closed beta. New private evidence and admin refund
review SQL passed 72 isolated database checks; the verifier core and security package
checks are part of 117 passing unit/source tests. Seven real local decoder checks
passed. All new proposals remain unapplied. Completion-photo UI/Edge integration and
hosted acceptance remain development work. Refund recommendations cannot move money.
The security scope/dependency and rollback plan is in proposals/security-review/README.md;
a tested postcommit restore remains required before authorized deployment. No current
owner decision, transfer gate, Connect completion gate or employment gate was cleared.
See SPRINT_REPORT_2026-10-14_EVIDENCE_CONTROLS.md for precise test boundaries.

## October 15 publication and retry checks

Audited development source is published in draft PR #6; initial GitHub CI passed.
No deployment occurred. Additional reservation-key and stale-refund-recommendation
checks expanded the isolated SQL suite to 91 passing checks. Actual hosted sessions,
storage, Edge decoder/UI and concurrent transactions remain unverified. Authorization,
Connect completion, financial policy and transfer gates remain unchanged. Details:
`SPRINT_REPORT_2026-10-15_PUBLICATION.md`.

## Master audit reconciliation — October 15

Money-handling closed beta and public launch remain NO-GO. Actual live asset hashes
match main: recovery request is empty, reset page absent and new workflow/payment
frontend fixes unpublished. All 43 public tables have RLS, but hardened authorization
is unapplied; zero active admins exist. All three payment records remain release-held.
Both mapped Stripe accounts are incomplete; two other ready accounts are unmapped.
Only the private issue-evidence bucket exists. Evidence/refund/gig proposal schemas
are absent. There is no complete hosted evidence/refund/release acceptance chain.

Do not infer readiness from the number of passing tests or Completed audit rows.
A cleared project cohort can precede separately cleared shifts only with D11 scope
and explicit release approvals. D1–D4/D6/D7 and relevant legal/insurance checks remain.

## Execution checkpoint — October 15

Master now: 144 tasks; 21 Complete, 31 In Progress, 35 Blocked, 18 Not Started,
39 Needs Verification. The newly completed item is the narrowly scoped legacy-job
rollout DESIGN (EVI-009), not an enabled evidence/payment feature.

Staged photo endpoint, real WASM decoder, dashboard upload/customer-review controls,
refund-review page, read-only reconciliation inventory and drift-guarded security
inverse are tested locally. UI/server flags stay off. Actual hosted Edge/Storage/JWT
acceptance, full Supabase inverse and native concurrent PostgreSQL remain unverified.
The native test environment cannot map a non-root user; fixtures do not replace that proof.
No A6/A8/A10 rollout, actual transfer, automatic refund or live payment occurred.
Money-handling beta remains NO-GO; see the master history and execution sprint report.

## Launch blocker elimination — October 15

See SPRINT_REPORT_2026-10-15_LAUNCH_BLOCKERS.md for current implementation/evidence.
Current-schema isolated security packages/inverse and 134-role matrix pass; this is
not a managed hosted rollback. Disabled durable refund ledger, read-only provider
reconciliation and admin operation queue are locally tested. Full sandbox refund
aggregate is proven, but database component correction remains unapplied. Actual
local Deno decoder HTTP passes; hosted Supabase Auth/Storage/runtime is still pending.
Native multi-session finance/gig CI is a separate layer, never deployed proof.

A6/A8/A10 review scopes are pinned in LAUNCH_RELEASE_MANIFEST.json. Frontend has nine
missing links and 17 placeholders; support/policies and real recovery/email remain
launch gates despite truthful sample labels. No new complete hosted journey or money
feature is claimed. Money-handling beta/public launch remain NO-GO. Updated master
counts below are synchronized after the final sprint checks.

Current authoritative counts after this sprint: 144 tasks: 21 Complete, 36 In Progress, 32 Blocked, 17 Not Started, 38 Needs Verification.

Native CI now VERIFIED at db28fb6/run 38778541325: 17 multi-session checks pass
(10 financial + 7 gig), including observed blocked overlap, once-only reservation/
receipts, capacity and worker conflict protection, and transaction rollback. This
resolves the container-local environment blocker for these cases. Broader crash/
deadlock and managed Supabase endpoint tests remain; no hosted settings changed.

## October 16 current integration checkpoint

See SPRINT_REPORT_2026-10-16_DEVELOPMENT.md and the master E20 evidence. The nine
previously missing navigation references now resolve to truthful contact/own-profile
pages in development; 17 policy/demo placeholders remain. No Pages publication.
Reconciliation observations and a reviewed full-refund component correction are
implemented in unapplied SQL/default-off UI; neither sandbox review flag was cleared.
Trusted evidence release facts and stale-photo handling are staged; hosted upload,
signed URL, actual Edge runtime and full customer journey remain unverified.

D1–D12 working decisions are recorded; do not ask again for selected fee payer,
manual allowance restoration, employer-pay direction or 20-person non-money scope.
Unresolved legal, category, policy timing, reserves, actual support operation and
operator identity remain separate. A6 needs managed recovery qualification/durable
backup; A8 needs approved copy/assent and served-version acceptance; A10 needs
populated recovery and actual hosted evidence/finance acceptance. A1/A7/A9 stay closed.

## October 16 A6 populated recovery follow-up

A6 STILL BLOCKED: isolated rehearsal now preserves 144 initial synthetic rows across
25 populated tables and post-migration committed activity across all 72 dependency
tables. Forty-four recovery assertions plus the 134-check matrix pass; inverse now
mutates only changed metadata. Actual managed postgres lacks Storage ownership for
two A6 policies; backup/PITR availability, durable backup and managed restore remain
unverified. No hosted migration/restore or new role grant. This evidence does not
clear positive hosted JWT/Storage or launch gates. See A6_MANAGED_RECOVERY_QUALIFICATION.md.

## Current October 16 continuation — supersedes older gate descriptions

**NO-GO for invitations and money.** Default-off infrastructure now enforces 10 customers
plus 10 professionals, empty category/city allowlists, current approved versioned assent,
private support, no-payment simulations and server-side checkout prohibition. It is staged,
not deployed. Categories and legal content are not invented. A11 is separately registered
in OWNER_ACTION_CHECKLIST.md; A6/A10/A8 remain separately blocked.

A6 alternate: 50 populated +134 authorization checks; original managed Storage policies
retained, ownership requirement removed from alternate only. Organization Free verified;
actual protected backup/managed recovery not qualified. A10: 18 populated representative
backup/containment/recovery checks; no actual Storage bytes or managed restore. A11:
40 SQL, six current-schema compilation/rollback and 18 beta browser checks. Signup: six
Auth-fixture checks. Axe: 16 views. Final native/full CI is recorded on PR #7. No hosted
end-to-end journey, real signup/recovery email, evidence upload or new deployed acceptance
is claimed. Existing Stripe $112 allocation correction and $560 review hold are unchanged.

Owner gates: approved exact D6 scope, approved D7 documents/support operation, verified
founder/MFA, D11 roster/consent/stop criteria and explicit invitations approval AFTER safe
backend/frontend rollout and hosted acceptance. Connect/payout/live-money activation is
not required for this simulated cohort; all real-money paths remain prohibited. Remaining
legal/insurance duties need qualified owner review. No participant was invited.
