# Korvo 1.0 Owner Action & Testing Checklist

Authoritative engineering/task statuses: [KORVO_MASTER_LAUNCH_CHECKLIST.md](KORVO_MASTER_LAUNCH_CHECKLIST.md).
This file owns stable owner decisions, manual tests and approvals; it is not a second
engineering backlog. Counts and phase readiness come from the master checklist.

Updated during the October 15, 2026 publication/control sprint. Active items below require
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
| H9 | Hourly/fixed gig fee is 12% on top of 100% worker gross; $18 × 6h → $108 + $12.96 | Chris confirmed; `GIG_PRICING_POLICY.md`; pricing/roster regressions |
| H10 | Updated full authorization rollback rehearsal completed | 134 checks passed October 13; fixtures and DDL rolled back; migration remains unapplied |
| H11 | Broader mission preserved: projects, hospitality shifts, property services and everyday gigs | Disabled category/pricing/workflow foundation; no employee wages routed to Connect |
| H12 | Project UI workflow reliability improved and tested | 39 posting/onboarding/messaging browser checks; nine new dashboard completion checks and three quote-response checks; 20 deployed lifecycle checks rolled back. No production publication. |

The earlier 88/12 deduction instruction and fee-only deposit flow are superseded.
Do not ask Chris to reconfirm H1, H3 or H9. No processing-fee payer has been selected.

## A. Decisions required

| ID / priority | Question and options | Recommendation and tradeoffs | Development dependency |
| --- | --- | --- | --- |
| D1 / P0 | Confirmed: Korvo absorbs project Stripe processing costs from its 12% fee. | Keep professional gross and customer quote + 12% unchanged; actual provider-cost ingestion and margin reporting remain. | Live-money readiness; not another fee-payer decision. |
| D2 / P0 | Confirmed: manual review; full refund direction for professional cancellation/no-show. | Define unresolved customer cancellation, partial-work, timing and remedy details; do not invent automatic penalties. | Terms, execution controls and case-specific disposition. |
| D3 / P0 | Confirmed: immediate eligibility after verified confirmation, subject to payment/evidence/dispute/Stripe checks. | Specify non-confirmation timing, reserves, maximum funds age and operating review; eligibility does not authorize transfers. | Financial readiness and A7; no fixed extra delay is inferred. |
| D4 / P0 | Confirmed: founder is sole owner/admin. | Identify verified account and complete controlled privilege approval, MFA and recovery; no UUID or authority inferred from metadata. | Hosted owner acceptance; zero active admins at inspection. |
| D5 / P1 | Confirmed: manual once-only membership allowance restoration during beta. | Preserve tiers; existing hardened restoration SQL now has ten isolated checks. | A6 and operator acceptance; paid Billing lifecycle remains. |
| D6 / P0 | Confirmed: limited lower-risk projects and lawful identity/broader verification direction. | Choose exact categories, evidence thresholds, lawful consent/review and badge language. No automated offense-based exclusion. | Public eligibility, trust copy and qualified screening review. |
| D7 / P0 | Confirmed: email plus in-app support; one-business-day target and approved policies. | Provide monitored email, staffing/calendar, approved terms/privacy/retention and actual service promises. | Published support/policies, durable assent and invitations. |
| D8 / P0 for shifts | Confirmed direction: hiring business employs and directly pays workers; separate 12% Korvo service fee. | Obtain classification/contracts/insurance review; confirm commercial fee timing/refund details. | Commercial billing and employer clearance; no wage collection through Connect. |
| D9 / P0 for hospitality | Confirmed mission: broad hospitality with category-by-category clearance and experience verification. | Approve cleared categories, ages, geography, permits and actual insurance requirements after qualified review. | Public hospitality remains disabled; A9 separate. |
| D10 / P0 for employee shifts | Confirmed: employer payroll; Korvo scheduling, attendance and rebooking. | Resolve workweek/overtime/tips/time-correction/employer-cost agreements and reviewed commercial terms. | Authenticated commercial persistence and A9; no wage penalties or automatic booking. |

Additional owner decisions identified by the master launch audit:

| ID / priority | Question and options | Recommendation and tradeoffs | Development dependency |
| --- | --- | --- | --- |
| D11 / P0 | Confirmed: 20-person invitation-only non-money Atlanta beta. | Finalize categories, roster/consent, success/stop criteria, operating ownership and invitation approval. | BETA-002/BETA-008; no invitations or money authorized. |
| D12 / P0 | Confirmed direction: Georgia single-member LLC; 100% founder ownership initially; research insurance. | Registration unverified; tax details, insurance requirements/quotes and qualified review remain. | Entity/tax/insurance clearance before real money; no formation/purchase authorized. |

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
| A6 / P0 | Broad Supabase authorization hardening proposal | Automatic approval review rejected its live deployment because it changes privileges, policies, triggers and many production functions. Proposal: `supabase/proposals/20261012160000_harden_korvo_api_permissions.sql`. Updated complete rehearsal passed all 134 checks October 13; DDL/fixtures rolled back. Chris explicitly instructed that this migration remain unapplied pending approval. Preserve a privilege snapshot and rerun relevant tests/advisors after any approved deployment. |
| A7 / P0 | Enabling actual contractor transfers, even in sandbox | Chris explicitly requires approval. Verify owner/admin authorization, payment, completion evidence, fresh Connect status, issue/refund/dispute holds, balance/reserve, durable idempotency and reconciliation first. Current evaluator cannot execute transfers. |
| A8 / P0 | Merge/publish the development payment/recovery frontend to main/Pages | Reviewable development changes, passing checks and final linked policy/error copy. No main merge or Pages publication is implied by a development push. |
| A9 / P0 for shifts | Apply the isolated gig schema or enable any public shift booking/payroll/payment feature | Review `supabase/proposals/20261013002039_gig_foundation_disabled.sql`, real concurrent PostgreSQL tests, authenticated endpoint/privacy tests and D8–D10 legal/insurance/payroll clearance. Current preview/schema are development-only and all gates stay disabled. |

Separate proposal deployment approval:

| ID / priority | Approval | Concrete prerequisite |
| --- | --- | --- |
| A10 / P0 | Completion-evidence and administrative refund schema/Edge/storage rollout; distinct from A6 | Integrated trusted Edge decoder, UI, current session/ownership/privacy tests, existing-job rollout and reviewed rollback. No photo trigger, private bucket or refund proposal may be deployed merely because isolated tests pass. |

## Dependencies and engineering status

Engineering tasks, automated results and unresolved technical checks are maintained
in `SUPABASE_SECURITY_AUDIT.md` and `CLOSED_BETA_READINESS.md`; they are not manual
assignments for Chris. The earlier usage-review interruption is not an active blocker.
A6 remains an explicit authorization requirement; its updated regression checkpoint is now complete. A9 depends on D8–D10 and verified engineering gates. No new manual gig tests are assigned: pricing, workflow, permissions and mobile tests were automated.
Real-money beta remains blocked by financial policy, verified onboarding, security
and release/admin integration. M2 depends on A8 and callback/email configuration;
A7 depends on D1–D4 and release safeguards; A1 depends on all money-handling gates.

## October 14 review checkpoint

A6 now has seven byte-equivalent, ordered review files under
`supabase/proposals/security-review/` and a deployment/rollback plan. They remain
unapplied and do not constitute independently approved migrations. A verified
prechange snapshot and tested inverse are engineering prerequisites, not owner tests.

Completion evidence and administrative refund review proposals now pass isolated
SQL tests. Approving A6 does not approve these separate proposals. Their hosted
adapters/UI, legacy-job rollout and relevant regression tests must be complete before
requesting deployment approval. No additional manual tests are assigned to Chris.
D1–D4 are unchanged; refund recommendations cannot execute refunds or clear holds.

## October 15 publication approval resolved

The owner explicitly approved the audited development-branch push. Outgoing commits
and intermediate file versions were reviewed; no private credentials or sensitive
real test records were found. Published in draft PR #6; initial GitHub CI passed.
This resolves branch-publication approval only. A6/A7/A8 and separate evidence/refund
deployment approvals remain unchanged. No new manual test is assigned to the owner.

The evidence reservation now supports stable request keys; refund recommendations
recheck current payment state/allocations. The expanded isolated SQL suite passes
91 checks. Hosted integration and actual concurrent sessions remain engineering work.

## Update procedure

Update this file with each development commit. Move completed owner items into
history with evidence. Keep decision IDs stable, record dependencies, and remove
manual tests whenever reliable automation covers them. This is maintained during
active development sessions; no unattended background execution is promised.

## Master launch audit synchronization — October 15

The master checklist contains all 14 requested workstreams, status counts and evidence
layers. Live read-only checks found zero active admins, both mapped Connect accounts
incomplete, blank live recovery and unapplied evidence/refund/security/gig proposals.
Five Stripe sandbox accounts exist; two ready accounts are unmapped and do not clear M1.
The new refund prototype's support-role gap was corrected and tested locally; it remains
undeployed. D11/D12 and A10 clarify real owner gates; no engineering tests were reassigned.

## Execution sprint — October 15

Master IDs unchanged. Completion photo Edge/dashboard code and refund-review UI are
now locally tested and default-off, with no production publication or schema deployment.
The tested EVI-009 design preserves existing active jobs and enrolls new ones after
approved rollout. A10 must approve that cohort boundary, compatible UI-first release,
legacy paid-job support review and hosted acceptance; no transfer is implied.

A6 now has read-only snapshot/inverse tooling, a protected current catalog snapshot
and 11 isolated metadata recovery/writer assertions. The full current-Supabase inverse
rehearsal is still engineering work, not a manual task for Chris; A6 is not deployed.
Actual multi-session testing is blocked by the container UID restrictions. No paid
provisioning decision is requested while other independent work remains available.

M1 remains the existing exact hosted setup test: both mapped account-owner metadata
values match, but payouts/transfers remain disabled. No active signed-in synthetic
professional fixture/valid hosted link is available in this checkpoint, so hosted
completion was not rerun by manufacturing more users or changing existing mappings.
Use sandbox test data only and provide the final Korvo/Stripe completion status, not
bank/identity details. Engineer verifies synchronization after that status is reached.

Read-only reconciliation finds one existing sandbox refund with unresolved component
allocation. It remains held; D2 and financial reconciliation must specify the actual
professional/fee split rather than an automated guess. D1–D4 are unchanged.

## Launch blocker elimination checkpoint — October 15

Current-schema empty-clone replay now passes all seven packages, 134 authorization
checks and 13 metadata/drift/data-preservation assertions. This resolves the isolated
current-schema rehearsal work, not managed Supabase rollback qualification or A6.
Native finance/gig concurrency is being moved to disposable GitHub CI; no paid
provisioning is required. A10 and A8 now have exact file/hash manifests and separate
packages: A10_SANDBOX_ROLLOUT_APPROVAL.md and A8_FRONTEND_RELEASE_APPROVAL.md.

Read-only provider facts establish the previously unallocated payment was fully
refunded: $11.20+$100.80=$112, final components $100 professional/$12 Korvo.
Individual refund splits remain unknown. The database correction is still unwritten;
engineering must prepare a reviewed, auditable reconciliation write. This is not an
owner decision about the aggregate arithmetic and does not reopen confirmed pricing.
D2 still governs future partial refunds/remedies. All payment holds remain intact.

Admin ledger preparation/monitoring is staged and default-off. D4 owner/admin identity
and MFA, D1–D3 money policy, D6 categories, D7 actual support/policy/retention destinations,
D11 cohort and D12 legal/entity/insurance remain. Nine frontend routes/17 placeholders
still block A8; unsupported static badges were removed and examples labeled.
A6/A8/A10 remain unapproved; no actual refund, transfer or live payment is authorized.
M1/M2 exact existing manual steps remain, with no request for identity/bank credentials.

Current authoritative counts after this sprint: 144 tasks: 21 Complete, 36 In Progress, 32 Blocked, 17 Not Started, 38 Needs Verification.

Native CI now VERIFIED at db28fb6/run 38778541325: 17 multi-session checks pass
(10 financial + 7 gig), including observed blocked overlap, once-only reservation/
receipts, capacity and worker conflict protection, and transaction rollback. This
resolves the container-local environment blocker for these cases. Broader crash/
deadlock and managed Supabase endpoint tests remain; no hosted settings changed.

## October 16 effective development authorization and policy alignment

Founder explicitly authorized development-branch work, isolated/local tests, safe
read-only verification and nondeploying CI/publication to the existing PR #7 branch.
This resolves development permission only; A6/A8/A10 and all financial execution
remain unapproved. Current D1–D12 rows supersede the older undecided descriptions;
see FOUNDER_POLICY_BASELINE.md for complete/partial/blocked implementation boundaries.
Historical sprint evidence below/above is preserved and is not a current activation.

The $112 full refund still needs the reviewed aggregate accounting correction; its
$100/$12 total split is arithmetic, not a new D2 decision. Correction code and audit
SQL are now written and isolated-tested, not deployed or applied. The $560 case has
no demonstrated amount mismatch but remains on review hold. Do not clear either
review merely because a read-only observer ran. In-app support/email service and the
one-business-day target are not operational promises until configured and approved.
