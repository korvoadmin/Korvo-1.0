# Korvo 1.0 — authoritative master launch checklist

Audit snapshot: **October 15, 2026, America/New_York**. This document is the launch
engineering source of truth. Owner decisions/approvals retain their stable IDs in
[OWNER_ACTION_CHECKLIST.md](OWNER_ACTION_CHECKLIST.md); the readiness summary is
[CLOSED_BETA_READINESS.md](CLOSED_BETA_READINESS.md). Earlier reports are dated
checkpoint evidence, not competing current task lists.

**Assessment: NO-GO for money-handling closed beta and public launch.** A controlled
sandbox rehearsal is possible; the integrated hosted evidence/refund/release chain is
unfinished. A non-money usability cohort still needs truthful copy, privacy/support,
access controls, explicit scope and invitation approval. Project beta can precede
hospitality only after owner approval; the broader mission remains projects, shifts
and everyday gigs. No merger, deployment, production settings, money movement or
live payment activation occurred for this audit.

## How to read the statuses

- **Complete**: the narrowly stated task has verifiable evidence. A completed test,
  inventory or sandbox backend component does not mean the entire product flow is live.
- **In Progress**: implemented/drafted/tested parts exist but integration, acceptance
  or publication is unfinished. Code alone never clears a feature launch gate.
- **Blocked**: a named decision, approval or prerequisite prevents completion. Safe
  independent parts may still be developed; they are not assigned to the owner.
- **Not Started**: no implementation/result was found for the stated work; create it.
- **Needs Verification**: current evidence is insufficient; inspect/test before
  asserting completion or assigning a defect. An absent record is not proof of failure.

Priorities: P0 = critical **for the applicable cohort**, P1 = important, P2 = future.
P0 shift/public items are gates for those launches, not all prerequisites to a cleared
project-only sandbox cohort. Counts measure itemized work, not a readiness percentage;
tasks vary substantially in risk and size. Every table provides independent capability,
owner involvement and dependencies. “Yes” means engineering can proceed within current
safe development authority; it never authorizes gated deployment or policy selection.

## Confirmed decisions (do not reopen)

- Full professional/worker gross plus 12% **on top**. $500 → $500 professional gross,
  $60 Korvo gross fee, $560 customer total. Gross Korvo revenue is before processing.
- Hourly example: $18 × 6 verified payable hours → $108 gross + $12.96 fee = $120.96,
  excluding other applicable costs. Tips are excluded from the platform fee.
- No payer of processing costs, automatic penalties, refund schedule or release window
  has been selected. Employee wages cannot use contractor Stripe Connect.
- Memberships remain one free job, $29.99/3, $49.99/6 and $89.99/unlimited.
- Main/Pages publication, authorization migration, live payments and transfers remain
  separately approval-gated. Existing development-branch publication is authorized
  after outgoing-history privacy/credential review. No silent approval by inactivity.

## Evidence layers and current deployment boundary

| Layer | Actual evidence | Limit |
| --- | --- | --- |
| Implemented development | Draft PRs #4/#5/#6; latest inspected published code 3d3ebfac | Not merged; code is not deployed proof |
| Passing local/isolated + remote CI | E08: 117 unit/source, 166 browser, 45 gig DB, 91 evidence/refund DB, 7 decoder checks at 3d3ebfac | Browser/Auth/Storage fixtures; no full hosted chain |
| Audit follow-up | E16: 94 isolated evidence/refund checks after owner/admin-only guard fix; E17 document checks | New code remains undeployed; current remote CI recorded in audit report |
| Passing deployed historical | E09/E10: real sandbox Checkout/provider, negative Auth/API/Storage, transactional DB rehearsals | Dated component results; no new real charge or full acceptance this audit |
| Actually deployed backend | Checkout v5; webhook v5; Connect v6; last migration 20261012153716 | Authorization, completion, refund and gig proposals absent |
| Actually published website | E07 direct GET hashes match origin/main | Recovery blank; updated dashboard/onboarding/messaging/posting/recovery development not published |

## Task counts

Total tasks: **144**.

| Status | Count |
| --- | ---: |
| Complete | 20 |
| In Progress | 27 |
| Blocked | 33 |
| Not Started | 22 |
| Needs Verification | 42 |

Priority counts: P0: 106, P1: 35, P2: 3.

## 1. Website and mobile functionality

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WEB-001 | P0 | Complete | Inventory actual published assets; no remaining audit work for this snapshot. This does not certify functional journeys. | Yes; read-only audit completed | None | None | E07: live hashes match main; recovery is blank; development dashboards differ |
| WEB-002 | P0 | Blocked | Publish reviewed dashboard, messaging, onboarding, posting and recovery fixes; verify served bytes afterward. | Yes, after approval | Approval A8; final policy copy D7 | SEC-005, LEG-001, LEG-002 | E01/E07: PRs #4–#6 unmerged; live scripts remain old |
| WEB-003 | P0 | Not Started | Replace dead verification/privacy/terms links and demo affordances with approved working destinations; do not invent legal promises. | Yes for implementation | D6/D7 copy and trust scope; A8 publication | LEG-001, LEG-002, TRU-001 | E13: signup policy href=#; verification.html absent; dashboard.html is a demo |
| WEB-004 | P1 | Needs Verification | Audit all linked routes/assets and error pages, canonical posting route and base-path behavior; distinguish probes from real links. | Yes | A8 only for publication | WEB-002 | E07: post-a-job.js exists; post-job.js probe is noncanonical, not a proven app defect |
| WEB-005 | P1 | Needs Verification | Run full mobile journeys on iOS Safari/Android, orientation, virtual keyboards, file pickers and narrow widths. | Mostly; automated browser work first | Manual only for device behavior automation cannot reproduce | WEB-002 | E08: Chromium fixtures pass; physical devices not verified |
| WEB-006 | P1 | Needs Verification | Review keyboard navigation, focus, labels, contrast, reduced motion and screen-reader announcements throughout critical flows. | Yes for automated/manual engineering audit | None unless genuine assistive-device testing needed | WEB-002 | E08 covers layouts and selected controls, not a complete accessibility audit |
| WEB-007 | P1 | Needs Verification | Measure real load times, asset weight, slow-network behavior, cache busting and stale-script recovery. | Yes | A8 for changed assets | WEB-002 | E07/E13: no documented field-performance or cache release gate |
| WEB-008 | P0 | Blocked | Remove or clearly label unsupported featured-pro verification claims and illustrative endorsements before invitations. | Yes for implementation | D6/D7 approve truthful trust copy; A8 | TRU-001, TRU-008 | E13: index.html hardcodes Verified and ID Verified badges; browse profiles include coming-soon entries |
| WEB-009 | P1 | Needs Verification | Audit DOM injection, external links, navigation/logout redirects and security headers/CSP compatible with hosting. | Yes; fixes can be staged | Approval for production/hosting changes | SEC-005 | E13: selective escaping tests exist; no full frontend/header audit recorded |
| WEB-010 | P1 | Complete | Correct repository README mission to projects, shifts and everyday gigs and link the master register; no live feature is enabled. | Yes; documentation scope completed | A8 remains required for any live marketing edit | None | E17/E13: README wording updated and regression checked; public trust-copy review remains WEB-008 |

## 2. Customer registration and dashboard

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CUS-001 | P0 | Needs Verification | Verify genuine signup, email confirmation, duplicate-email handling, invalid data and customer landing against the approved site. | Mostly | M2 for owner's real inbox if automation cannot receive it | AUTH-001, WEB-002 | E12: signup UI exists; synthetic confirmed Auth users do not prove real email signup |
| CUS-002 | P0 | In Progress | Ship and verify customer posting/role validation, rapid-click protection and saved-response handling in the published dashboard. | Yes, after publication approval | A8 | WEB-002, JOB-001 | E08/E10: fixture checks pass; E07 confirms older dashboard is live |
| CUS-003 | P0 | Blocked | Publish recovery pages, verify allowed callback URL and one-time token use; old password must fail after reset. | Mostly | A8; M2 only after publication/configuration | AUTH-001, WEB-002 | E07: forgot-password.html 200 with zero bytes; reset-password.html 404; 16 fixture checks passed |
| CUS-004 | P1 | Needs Verification | Verify customer profile edits, validation, settings, persistence and privacy through real account permissions. | Yes | A8 for publication | SEC-006 | E13: customer account settings still reports coming soon |
| CUS-005 | P0 | In Progress | Integrate authoritative payment summaries and actionable paid/failed/refunded/review states in customer cards. | Yes | A8 publication | PAY-002, PAY-004 | E08: 19 payment browser checks; E07: new payment dashboard markup not live |
| CUS-006 | P1 | Needs Verification | Verify history, accepted quotes, notifications, empty/loading/error states and pagination with realistic account data. | Yes | None for staging/testing | JOB-006 | E10: backend/history tested; full My Jobs and quote comparison links remain placeholders |
| CUS-007 | P0 | Needs Verification | Verify customer can only view/edit own profile, jobs, messages, private details and completion decisions end to end. | Yes | A6/A8 before final deployed rerun | SEC-005, TEST-007 | E10 deployed negative tests are historical; final current-chain acceptance pending |
| CUS-008 | P1 | Not Started | Provide account data export/deletion request path, retention notice and safe removal workflow preserving required financial records. | Yes for design/code | D7 retention/privacy approval; A4 for actual deletions | LEG-002, ADM-008 | E13: no completed account-rights flow found; no data deletion authorized |
| CUS-009 | P1 | Needs Verification | Specify and test remembered sessions, logout, expired tabs and inactive-account recovery across devices. | Yes | Approval for production Auth/session settings | AUTH-002, AUTH-003 | E12: Remember-me has no distinct persistence policy |
| CUS-010 | P0 | Needs Verification | Verify approved customer terms are reachable and versioned assent is stored at registration/payment/job posting. | Yes for implementation | D7; A8 publication | LEG-001, LEG-002 | E13: checkbox text references policies but linked policy documents are absent |

## 3. Professional registration and dashboard

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRO-001 | P0 | In Progress | Publish/test professional onboarding saves, role boundaries, required services/areas, cache failure recovery and duplicate submits. | Yes | A6/A8 for final rollout | SEC-005, WEB-002 | E08/E10 fixtures pass; E07 live onboarding is the older version |
| PRO-002 | P0 | Needs Verification | Exercise real professional signup/email/login and incomplete-profile routing through completion. | Mostly | M2 only if inbox access is necessary | AUTH-001, PRO-001 | E12: controlled synthetic login is not genuine email registration |
| PRO-003 | P0 | In Progress | Verify professional opportunities, invitations, quotes, job status and notifications with real participants after publication. | Yes | A8 | JOB-002, JOB-006 | E08: 36 opportunity browser checks; E10 backend matching checks; final hosted UI chain pending |
| PRO-004 | P0 | Needs Verification | Verify completed mapped Stripe onboarding and correct refresh/webhook sync; keep unrelated ready accounts unmapped. | Mostly | M1 only where hosted automation remains unreliable | None; owner M1 if automation cannot finish | E06: both mapped accounts incomplete; two unrelated ready accounts do not clear this gate |
| PRO-005 | P0 | Complete | Retain verified incomplete-Connect denial; no remaining implementation for this deployed sandbox guard. | Yes; preserve in regressions | A7 before any transfer activation | None | E02/E06/E09: deployed v6 and both mapped accounts inactive; prior access checks passed |
| PRO-006 | P1 | Needs Verification | Implement/verify professional profile editing, availability, areas, gallery uploads and truthful public profile previews. | Yes | D6 trust rules; A8 publication | TRU-001, SEC-010 | E13: fixed example profile and gallery/settings placeholders; no full acceptance proof |
| PRO-007 | P1 | In Progress | Preserve free job and $29.99/3, $49.99/6, $89.99/unlimited; finish paid Billing lifecycle without changing catalog. | Yes for sandbox implementation | D5 allowance restoration; approval before live billing | PAY-010 | E15/E10: catalog and trial gating verified; Stripe Billing lifecycle unfinished |
| PRO-008 | P0 | In Progress | Require completion evidence, confirmed save and customer review before any release candidate. | Yes for development | A10 deployment; D3 release policy | EVI-001, EVI-002, EVI-004 | E11: proposed gates and UI response tests pass independently; no hosted integrated photo flow |
| PRO-009 | P1 | Needs Verification | Provide reliable job/earnings statements distinguishing gross, fee, held funds, transfers and bank payout status. | Yes | D1/D3 approved cost/release copy; A8 | PAY-007, PAY-008 | E13: no complete reconciled earnings/bank-payout view recorded |
| PRO-010 | P0 | Blocked | Clear professional categories, licensing requirements, onboarding conduct terms and restrictions before beta participation. | Yes for enforcement code | D6/D7 eligibility and terms approval | TRU-001, LEG-001 | E14/E15: final permitted project categories and trust thresholds undecided |

## 4. Business accounts and gig marketplace

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GIG-001 | P0 | Complete | Preserve tested hourly/fixed pricing kernel and employee-payment isolation; no remaining kernel work for confirmed examples. | Yes; preserve regression coverage | None; this is a development component only | None | E08/E11/E15: $108+$12.96=$120.96, tips excluded; all execution disabled |
| GIG-002 | P0 | Blocked | Select employer/classification arrangement and approved category model before public employee/hospitality booking. | No for business/legal choice | D8/D9 with qualified legal/payroll review | LEG-005, LEG-006, LEG-007 | E14: no cleared staffing arrangement; labels alone do not resolve classification |
| GIG-003 | P1 | In Progress | Finish business/worker profile endpoints for display name, skills, experience, availability and areas using existing account boundaries. | Yes for disabled implementation | A9 deployment; D8/D9 before enablement | SEC-005 | E11: private proposed schema exists, no authenticated gig API is deployed |
| GIG-004 | P1 | In Progress | Build business shift posting, saved drafts, private location, timezone, pay, qualifications and worker count. | Yes behind closed gates | A9; D8–D10 before public bookings | GIG-003 | E13: estimator exists; no persisted posting endpoint/UI |
| GIG-005 | P1 | Not Started | Build mobile gig discovery, filters and opportunity details without disclosing private addresses or applicant data. | Yes behind closed gates | A9 public exposure approval | GIG-003, GIG-004 | E11: no deployed public gig feed or privacy-scoped endpoint |
| GIG-006 | P1 | In Progress | Persist applications, business selection, worker confirmation, capacity and filled-state transitions atomically. | Yes for development | A9 deployment | GIG-004, GIG-007 | E11: pure kernel/schema constraints tested; actual API persistence missing |
| GIG-007 | P0 | Needs Verification | Prove overlap/capacity/abort/deadlock behavior with real concurrent PostgreSQL sessions and deterministic lock ordering. | Yes when isolated multi-session environment available | Approval if provisioning has cost | GIG-003 | E11: 45 PGlite checks are sequential, not concurrent proof |
| GIG-008 | P0 | In Progress | Implement verified payable hours, corrections, attendance, cancellations/no-shows, disputes and participant notifications. | Yes for disabled contractor foundation | D2/D8–D10 rules; A9 enablement | GIG-006, GIG-002 | E11: state/pricing kernels only; no unapproved penalty or wage forfeiture |
| GIG-009 | P0 | Blocked | Connect reviewed employee payroll, overtime, tips, employer costs and reporting separately from contractor Connect. | Yes only after arrangement cleared | D8/D10 legal/payroll/cost decisions; A9 | GIG-002, LEG-006 | E14/E15: no payroll route approved; employee wages remain blocked |
| GIG-010 | P2 | Not Started | Add recurring shifts, teams, travel buffers, calendars and advanced business analytics after basic safety is established. | Yes later | Future product scope approval if policies change | GIG-006, GIG-007, GIG-008 | E13: no such production feature found; not a project-beta gate |

## 5. Job posting, quotes, applications, and messaging

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JOB-001 | P0 | In Progress | Publish real job-post validation/consent/active-customer checks; add durable request idempotency across reload/timeouts. | Yes for code | A8 publication | CUS-010 | E10: rapid-click guard passes; durable cross-reload identity not implemented |
| JOB-002 | P0 | In Progress | Verify quote creation/acceptance, server-owned ownership/price and confirmed response handling on hosted dashboards. | Yes | A6/A8 final rollout | PRO-001, PAY-001 | E10: empty/mismatched quote responses handled in dev; deployed lifecycle/entitlements tested |
| JOB-003 | P0 | Not Started | Add private initial job-photo upload/attachments with ownership, limits, validation and retry recovery. | Yes for development | Approval for new production storage/policies | SEC-010 | E13: posting photo control exists but attachments are not integrated |
| JOB-004 | P0 | In Progress | Ship conversation/draft isolation and delayed-response protection; add durable send idempotency and offline recovery. | Yes for development | A8 publication | SEC-005 | E08/E10: messaging race fixes tested; old live messages.js remains published |
| JOB-005 | P0 | Needs Verification | Verify contact reveal remains participant/payment-gated and moderation safely handles blocked users and personal-data attempts. | Yes | D7 final policy; A6/A8 final checks | PAY-002, SEC-007 | E09/E10: server controls and moderation exist; full live abuse/redaction journey not verified |
| JOB-006 | P1 | Needs Verification | Verify notification delivery/read status, invalid links, counts and retries; decide which email notifications are actually promised. | Yes for in-app; provider work after scope | D7 notification/support promises | AUTH-001 | E10: in-app notifications deployed; outbound email notification service not proven |
| JOB-007 | P0 | Blocked | Implement price/material/scope changes through explicit customer consent, frozen revisions and reviewed adjustment handling. | Yes for development | D1/D2 adjustment/refund terms | PAY-004, LEG-001 | E15: original quote allocations immutable; no approved postacceptance price-change contract |
| JOB-008 | P0 | Needs Verification | Test no-show, partial/incomplete work, failed save, canceled/closed jobs and late payments without automatic penalties. | Yes | D2 before any rule enforcement | EVI-005, PAY-004 | E10: 20 lifecycle checks and hold tests pass; all edge journeys not complete |
| JOB-009 | P1 | Needs Verification | Finish job/history navigation, quote comparison, search/pagination, stale invitation handling and realistic empty/error states. | Yes | A8 publication | CUS-006, PRO-003 | E13: My Jobs/quote comparison features still expose coming-soon copy |
| JOB-010 | P2 | Not Started | Add advanced matching, saved searches, calendars and multilingual workflow support after core beta acceptance. | Yes later | Future scope decisions where needed | JOB-002, JOB-006 | E13: not a closed-beta prerequisite; no complete implementation verified |

## 6. Stripe checkout, payments, refunds, and payouts

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PAY-001 | P0 | Complete | Maintain authoritative project gross quote plus 12% calculation; no pricing-model decision remains. | Yes; regression preserve | None; D1 concerns processing costs only | None | E09/E15: $100/$500/$1000 deployed sandbox charges and frozen allocations verified |
| PAY-002 | P0 | Complete | Retain deployed sandbox checkout ownership, full-price charge and duplicate-session controls; this task is sandbox backend only. | Yes; preserve regression | A1 before live activation | None | E02/E09: Checkout v5; real sandbox success/decline/retry and tampering tests |
| PAY-003 | P0 | Complete | Retain verified webhook signatures, bounded body, atomic receipts, safe retries and stale-state handling. | Yes; preserve regression | None for current sandbox implementation | None | E02/E09: webhook v5 plus HTTP/database/provider tests; not new bank payout evidence |
| PAY-004 | P0 | In Progress | Finish payment recovery/reconciliation jobs for failed/expired/canceled/late/ambiguous provider state; never invent success. | Yes for sandbox code | D2 for policy actions; deployment approval | None; safe reconciliation implementation can proceed | E09: several sandbox cases pass; no complete durable operational reconciliation loop |
| PAY-005 | P0 | Needs Verification | Complete onboarding for a correctly owned mapped account and verify complete/restricted/revoked synchronization. | Mostly | M1 if hosted automation cannot finish | PRO-004 | E05/E06: two mapped accounts incomplete; unrelated ready accounts cannot be reassigned by assumption |
| PAY-006 | P0 | In Progress | Integrate owner/admin refund queue UI, approved instructions, sandbox provider execution, retries and reconciliation. | Yes for development | D1/D2/D4; A10 deployment | ADM-001, SEC-005 | E11: review SQL and 94 local checks; proposals unapplied; no refund executor |
| PAY-007 | P0 | In Progress | Implement durable transfer/reversal ledger, once-only execution, balances/reserves and timeout reconciliation in disabled sandbox code. | Yes for development | D3; A7 before any actual transfer | PAY-005, EVI-004, ADM-001 | E13: release.mjs evaluates only; actual transfer/reversal executor and ledger unfinished |
| PAY-008 | P0 | Blocked | Approve release/issue window and validate provider settlement/holding limits, available balance and platform payout schedule. | Yes for research/design; owner sets policy | D1/D3; A7/A1 activation | PAY-007, LEG-003 | E14/E15: no indefinite-hold/escrow promise allowed; no final operating schedule |
| PAY-009 | P0 | Blocked | Define processing payer, refundable fee, cancellations/no-show treatment, chargebacks, reserves and clear customer receipts. | Yes for code after decisions | D1/D2/D3; A5 if penalties/pricing change | None; D1/D2/D3 are owner policy decisions | E15: professional gets full gross; processing/refund rules explicitly unresolved |
| PAY-010 | P1 | Not Started | Finish sandbox subscription purchase/change/cancel/invoice webhooks, entitlement recovery and reporting using confirmed tiers. | Yes for sandbox | D5 allowance restoration; A1 for live subscriptions | PAY-003 | E10/E15: catalog/database entitlements exist; Stripe Billing lifecycle not complete |

## 7. Supabase security, RLS, authentication, and storage

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | P0 | Complete | Record current table/RLS inventory; no remaining inventory work for this snapshot, not proof every policy is safe. | Yes; read-only completed | None | None | E05: 43 public tables; zero without RLS |
| SEC-002 | P0 | Complete | Inventory every current advisor finding with separate security/performance dispositions. | Yes; read-only completed | A3 only for paid protection | None | E03/E04: 7 INFO RLS; 1 anon/52 signed-in definer warnings; password warning; 33 initplan/62 unused indexes |
| SEC-003 | P0 | In Progress | Review exact seven hardening scopes, prepare restricted prechange snapshot, tested inverse and lock/rollback procedures. | Yes | None to prepare; A6 to deploy | SEC-004 | E11: byte-equivalent 464 statements; review plan exists; postcommit inverse not proven |
| SEC-004 | P0 | Complete | Preserve complete authorization rehearsal result and byte-equivalence evidence; rerun only on scope/schema change or rollout. | Yes; verified checkpoint | None for preserved evidence | None | E10/E11: 134-check rollback passed; no deployment implied |
| SEC-005 | P0 | Blocked | Apply explicitly approved authorization scope and rerun advisors plus customer/pro/admin/anon matrix afterward. | Yes after approval | A6 exact deployment authorization | SEC-003 | E02/E05: korvo_api_private absent; broad proposal still unapplied |
| SEC-006 | P0 | In Progress | Close role/verification/onboarding/owner mutation and private-detail lifecycle gaps, preserving legitimate workflows. | Yes for staged code/tests | A6 deployment | SEC-005 | E03/E10: identified guards/RPC-policy fixes staged; deployed account standing guard is only part of scope |
| SEC-007 | P0 | Needs Verification | Verify exposed schemas, RPC grants, function ownership/search paths and account separation for every sensitive endpoint. | Yes | A6 before final deployed verification | SEC-005 | E03/E10: definer warnings need per-function authorization review; no blanket grants |
| SEC-008 | P0 | Needs Verification | Review service-key/Vault access, restricted provider permissions, rotation procedure and secret-free source/history/logs. | Yes for inspection/design | Approval for rotating production secrets/settings | None | E08: outgoing history audit passed; no full historical/external-log certification |
| SEC-009 | P1 | Blocked | Enable leaked-password protection after plan approval; verify feature and failure UX afterward. | Yes after upgrade | A3 paid-plan/cost approval | None | E03: disabled warning persists; stronger UI passwords are not equivalent |
| SEC-010 | P0 | In Progress | Integrate private photo storage/decoder, immutable paths, size/type/pixel limits, upload retries and retention/access rules. | Yes for staged code | A10 completion evidence deployment; D7 retention | EVI-002 | E05: only issue bucket exists; proposed completion bucket not deployed; local file tests pass |
| AUTH-001 | P0 | Needs Verification | Inspect SMTP delivery, callback allowlist, signup confirmation, recovery reuse, CAPTCHA and Auth rate limits without weakening settings. | Mostly | M2 inbox test only if required; approval for production configuration | WEB-002 | E12: prior public settings confirmed email verification; actual delivery/configuration not fully verified |
| AUTH-002 | P0 | Needs Verification | Review token expiry, session revocation, active standing, session-bound sensitive RPCs and stale claims. | Yes | Approval for production Auth settings | SEC-007 | E12: payment actor checks sessions; complete site-wide expiry/revocation policy not verified |
| AUTH-003 | P1 | Not Started | Implement explicit Remember-me persistence and reliable logout/expired-session UX without weakening authorization. | Yes for development | Approval for production session-policy changes | AUTH-002 | E13: auth.js/supabase.js use default SDK persistence; control is not wired to separate policy |
| AUTH-004 | P0 | Needs Verification | Establish owner/admin strong authentication/MFA and recovery procedure; validate role revocation and support separation. | Yes for code/docs; owner completes enrollment | D4 owner identity; approval for enforcement/settings | ADM-001 | E05: no active admin; MFA configuration and owner enrollment not proven |

## 8. Completion evidence, disputes, and customer protection

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVI-001 | P0 | In Progress | Integrate completion reservation/upload metadata, verified-file gates and customer review with actual job RPCs. | Yes for development | A10 deployment; legacy-job rollout approval | SEC-010, EVI-002 | E11: SQL prototype tested, new schema absent in E05; no integrated hosted completion uploads |
| EVI-002 | P0 | In Progress | Choose/review an Edge-compatible full image decoder and implement authenticated verifier endpoint with bounded resources. | Yes for design/code/tests | Deployment approval A10 | SEC-008 | E11: mandatory-decoder core and 7 Sharp tests; Sharp test adapter is not deployed Edge decoder |
| EVI-003 | P0 | Not Started | Build accessible pro upload/retry/abandon and customer preview/acknowledgment UI; retain stable reservation keys. | Yes for development | A8/A10 publication/deployment | EVI-001, EVI-002 | E13: dashboard completion still not wired to completion-photo APIs |
| EVI-004 | P0 | In Progress | Connect verified evidence/customer confirmation/open-issue facts to trusted release readiness, not client assertions. | Yes for development | D3; A7 before transfers | EVI-001 | E11: SQL photo gates and pure release evaluator tested separately, not an integrated release service |
| EVI-005 | P0 | In Progress | Finish user/admin dispute handling for incomplete/poor work, both-party responses and support escalation. | Yes for code | D2/D3/D7 review and customer-protection rules | ADM-003 | E10: issue backend and payment holds tested; financial/admin UI and final policy incomplete |
| EVI-006 | P0 | Complete | Preserve deployed late-payment/cancellation/open-issue holds without silently clearing them on status restoration. | Yes; verified sandbox component | No new policy decision for existing hold safeguard | None | E02/E09: deployed hold migration plus 38 checks and genuine late $560 case |
| EVI-007 | P0 | Blocked | Approve issue-report deadlines, cancellation/no-show refunds, partial completion and customer response/remedy terms. | No for business policy; yes for implementation | D2/D3/D7 | LEG-001 | E15: no unapproved penalty/refund timetable may be enforced |
| EVI-008 | P1 | Needs Verification | Review evidence metadata/privacy, retention, abusive content reporting, access URLs and download/audit behavior. | Yes for engineering | D7 retention/legal basis; A4 for deletion | SEC-010 | E11: type/isolation tests do not establish metadata removal, malware scanning or retention compliance |
| EVI-009 | P0 | Not Started | Design existing-job rollout so new evidence triggers do not strand legacy pending/completed work. | Yes for plan/tests | A10 exact rollout approval | EVI-001 | E11: no reviewed grandfather/backfill policy; do not deploy completion trigger yet |
| EVI-010 | P1 | Needs Verification | Verify one review per completed participant job, truthful ratings, edits/moderation and suppression of test endorsements. | Yes | D7 review moderation terms; A4 fixture cleanup | TRU-008, JOB-008 | E10: feedback and duplicate/cross-account tests pass; full published review lifecycle not verified |

## 9. Professional verification and trust

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TRU-001 | P0 | Blocked | Approve launch categories and exact license/ID/background/experience evidence required for each. | No for owner scope; yes for enforcement | D6/D9 | LEG-004, LEG-007 | E15: category/trust scope unresolved; no blanket Verified claim authorized |
| TRU-002 | P0 | In Progress | Integrate verification requests, protected results, expiry, rejection reasons and rechecks with truthful public badges. | Yes for code | D6; A6/A8 deployment/publication | TRU-001, SEC-006 | E10/E13: verification backend exists; stronger authorization and public copy not released |
| TRU-003 | P0 | Needs Verification | Verify who may review documents, revoke/expire badges and audit changes; users must not self-verify. | Yes | D4 admin designation; A6 | SEC-006, ADM-001 | E10: self-verification guards tested historically; final deployed hardened matrix pending |
| TRU-004 | P1 | Blocked | Define lawful identity/background process, consent, vendor/data retention and adverse-action handling where applicable. | Yes for research/design | D6/D7 and qualified review; no vendor purchase authorized | LEG-002, LEG-004 | E14: no approved provider/process established; do not describe checks as completed |
| TRU-005 | P0 | Needs Verification | Verify service-area/skill/business information and visibly separate self-reported experience from independently verified claims. | Yes for engineering | D6 approved badge labels | TRU-001 | E13: profile badges/experience descriptions need source-to-claim review |
| TRU-006 | P1 | Needs Verification | Verify blocked/suspended/restricted professionals cannot quote, receive invitations or bypass standing gates. | Yes | A6 final deployed regression | SEC-005, JOB-005 | E10: matching/action restrictions tested in prior suites; full new scope not deployed |
| TRU-007 | P1 | Not Started | Provide renewal/expiry reminders and case routing when verification or insurance evidence expires. | Yes for design/code | D6/D7 timing and support ownership | TRU-002, ADM-003 | E13: no completed reminder/renewal workflow recorded |
| TRU-008 | P0 | Blocked | Inventory and hide synthetic profiles/reviews/test activity; remove unsupported public verification claims without deleting data. | Yes for inventory/staged copy | A4 deletion only; D6/D7 and A8 for publication | None; safe inventory/staged corrections can proceed | E13: static Verified badges remain; prior fixture pro hidden, full public claim inventory pending |
| TRU-009 | P1 | Needs Verification | Determine required provider insurance proof and expiry for approved categories, with no unsupported coverage guarantee. | Yes for engineering after rules | D6; insurance/legal review and owner coverage decisions | LEG-007 | E14: no verified platform/provider coverage decision evidenced |
| TRU-010 | P2 | Not Started | Add advanced reputation/risk scoring and portability only after transparent baseline trust and appeal procedures. | Yes later | Future policy/privacy approval | TRU-002, EVI-010 | E13: no verified implementation; not a project-beta gate |

## 10. Legal compliance, policies, and insurance

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| LEG-001 | P0 | Blocked | Finalize customer/pro terms, quote/scope changes, cancellation/refunds, disputes and marketplace role; publish and record assent. | Yes for drafting/implementation, not legal clearance | D1/D2/D3/D7; qualified legal review; A8 | PAY-009, TRU-001 | E07/E13: no published terms page; checkbox href=# is not accepted policy publication |
| LEG-002 | P0 | Blocked | Approve privacy, data categories/retention/sharing, account rights, evidence treatment and applicable notices/consent. | Yes for inventory/draft/code | D7 and qualified privacy review; A8 | SEC-008, EVI-008 | E07: privacy.html absent; actual legal coverage unverified |
| LEG-003 | P0 | Needs Verification | Verify legal business/operator identity, registrations, tax details, bank/account ownership and provider agreement obligations. | Mostly for evidence review | Owner supplies/approves authoritative business records; no secrets requested | None; inspect authoritative operator records independently | E14/E15: no authoritative clearance evidence; do not assume entity or payment permissions |
| LEG-004 | P0 | Needs Verification | Review Georgia/local occupational licensing, consumer protection and approved project-category eligibility. | Yes for research; counsel provides clearance | D6 and qualified legal determination | None; research can proceed before category approval | E14: hospitality memo is not category-specific legal approval |
| LEG-005 | P0 | Blocked | Obtain federal/Georgia classification and joint-employer assessment of actual hospitality/gig arrangements. | Yes for research support | D8/D9; qualified employment review | None; D8/D9 qualified arrangement review is the owner gate | E14: no clearance; preserve employee/contractor distinction and disabled bookings |
| LEG-006 | P0 | Blocked | Resolve wage/overtime/tip/timekeeping/payroll/employment tax responsibilities and lawful correction/cancellation treatment. | Yes for engineering after reviewed rules | D8/D10 and qualified payroll/legal review | LEG-005 | E14/E15: gross wages/tips cannot absorb platform fee; no payroll arrangement approved |
| LEG-007 | P0 | Needs Verification | Verify platform general liability, workers compensation/employer, cyber/professional and category-specific coverage as applicable. | Yes for requirement inventory, not coverage binding | Owner approves insurance arrangement/budget with qualified broker/legal review | LEG-003, LEG-005 | E14: no verified bound coverage or liability allocation; do not claim protection exists |
| LEG-008 | P0 | Blocked | Clear alcohol-service roles, worker ages, permits/training, local staffing registrations and youth-work restrictions where applicable. | Yes for research, not legal clearance | D9 and qualified local/legal review | LEG-005, LEG-007 | E14: public hospitality/minor/alcohol roles remain disabled pending clearance |
| LEG-009 | P0 | Needs Verification | Determine applicable tax reporting, W-9/ITIN handling, 1099/payroll reporting and any taxable fees; protect tax data. | Yes for technical design after accountant advice | Owner/accountant confirms obligations and secure collection | LEG-003, LEG-006 | E14/E15: no verified tax/reporting or secure tax-document workflow |
| LEG-010 | P1 | Not Started | Finish complaints, accessibility/legal notices, IP/content permission and policy revision/acceptance records before expansion. | Yes for draft/code | D7 final policy approval; A8 | LEG-001, LEG-002 | E13: no complete published policy suite or acceptance version history evidenced |

## 11. Administrative controls and customer support

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ADM-001 | P0 | Blocked | Designate verified owner account and least-privilege financial/admin/support roles through a controlled grant procedure. | Yes after identity decision | D4; explicit privilege assignment approval | None; D4 and controlled privilege approval required | E05: zero active admins; must not infer owner from editable metadata |
| ADM-002 | P0 | In Progress | Build full-price refund/payment review UI and server-authorized actions separate from legacy fee-only reviews. | Yes for staged code | D1/D2/D4; A10 deployment and A8 publication | PAY-006, ADM-001 | E11: new refund proposal exists; no deployed queue schema or admin frontend |
| ADM-003 | P0 | In Progress | Provide triage, claim/notes, issue evidence, participant communication and audited resolution for support. | Yes for engineering | D7 support route/service expectations; D4 | ADM-001 | E10: case-management RPCs deployed; no complete owner-operated hosted admin workflow |
| ADM-004 | P0 | In Progress | Enforce owner/admin-only financial review; support role must not request/read/recommend financial adjustments. | Yes for staged code/tests | A10 deployment; A6 legacy financial scope | ADM-001, SEC-005 | E16: audit found missing role filter in new proposal; fixed and 94 isolated checks pass; not deployed |
| ADM-005 | P0 | Not Started | Build daily payment/charge/refund/transfer reconciliation, stuck-state alerts and aging/reserve operational review. | Yes for disabled tooling | D1/D3/D7 operating policy; activation approval | PAY-004, PAY-007 | E13: runbook exists; no complete scheduled/alerted operational loop |
| ADM-006 | P0 | Blocked | Choose monitored support contact, staffing/escalation, critical incident channel and customer/pro response promises. | No for owner promises; yes for implementation | D7 | LEG-001 | E15: no approved monitored channel/SLA; footer text is not support coverage |
| ADM-007 | P0 | Needs Verification | Verify immutable audit trails, limited reason/note access, support vs finance visibility, PII-safe logs and case accountability. | Yes | D4/D7; A6/A10 final deployed matrix | SEC-007, ADM-004 | E10/E11: case/audit prototypes tested, complete hosted operational acceptance pending |
| ADM-008 | P0 | Not Started | Create backup/restore verification, incident response, session/secret containment, access revocation and business recovery runbooks. | Yes for plans/tests in isolated environment | Approval for production restores/rotation/costs | SEC-008, AUTH-002 | E13: no verified restore drill; do not use destructive live tests |
| ADM-009 | P1 | Blocked | Approve scoped cleanup of retained synthetic accounts/jobs/uploads/Stripe fixtures after sign-out and dependency inventory. | Yes after scope approval | A4 destructive cleanup authorization | TRU-008 | E09/E10: fixtures deliberately retained; no deletion authorized |
| ADM-010 | P1 | Not Started | Add basic operator metrics, queue pagination/export and cost/abuse budgets without leaking private data. | Yes for design/code | D7; budget/production activation approval if applicable | ADM-005, LEG-002 | E13: refund prototype queue capped at 100; no complete operational dashboard |

## 12. Automated and manual testing

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-001 | P0 | Complete | Retain reviewed 117 passing unit/source/payment/security checks on published development checkpoint. | Yes; completed evidence | None | None | E08: GitHub CI run 38684295134 passed; changed code needs focused follow-up checks |
| TEST-002 | P0 | Complete | Retain 166 passing Chromium fixture browser checks; these are not hosted end-to-end proof. | Yes; completed evidence | None | None | E08: seven suites; customer/pro/payment/recovery/gig/workflow coverage |
| TEST-003 | P0 | Complete | Retain actual deployed payment/matching/lifecycle regression evidence, without reclassifying SQL snapshots as real charges. | Yes; evidence captured | None | None | E09/E10: 94 payment/matching plus 20 lifecycle rollback checks; dated historical results |
| TEST-004 | P0 | Complete | Retain full 134-check authorization rollback rehearsal and separate unapplied deployment boundary. | Yes; evidence captured | A6 only for future deployment | None | E10: complete updated rehearsal passed; no live security migration applied |
| TEST-005 | P0 | Complete | Run actual evidence/refund proposal SQL in isolation including support denials and record all results. | Yes; completed this audit | None | None | E16: 94 passing isolated PostgreSQL checks; simulated Auth/Storage, not hosted proof |
| TEST-006 | P0 | Complete | Retain 7 full JPEG/PNG/WebP decode/corruption checks and mandatory-decoder core tests. | Yes; completed evidence | None | None | E08/E11: local Sharp adapter; no Edge deployment qualification |
| TEST-007 | P0 | Needs Verification | Run complete hosted customer signup→post→quote→accept→sandbox pay→message→photo→confirm→review→release preparation, including failures. | Mostly automated | A6/A8/A10 before deployment-dependent steps; M1/M2 only where needed | SEC-005, EVI-003, PAY-005, ADM-002 | E09/E10: component successes; no complete integrated hosted evidence/release chain |
| TEST-008 | P1 | Needs Verification | Run actual mobile/Safari/Firefox/accessibility and slow-network journeys with real approved deployment. | Mostly automated | Owner manual only for device-specific residuals | WEB-005, WEB-006, WEB-002 | E08: Chromium fixture tests do not establish full browser/device coverage |
| TEST-009 | P0 | Not Started | Run real concurrent scheduling/refund/idempotency/lock tests, crash recovery and bounded resource/abuse tests in isolation. | Yes when suitable environment available | Cost approval only if new paid environment needed | GIG-007, PAY-007 | E11/E16: PGlite single-connection results do not prove actual concurrency |
| TEST-010 | P0 | Complete | Validate unique task IDs, statuses, counts, internal dependencies, evidence keys and owner-reference synchronization automatically. | Yes; completed this audit | None | None | E17: new master-checklist validator and regression tests pass; no deployment involved |

## 13. Closed-beta launch readiness

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BETA-001 | P0 | Complete | Create one 14-section authoritative master checklist with evidence layers, counts, owner mapping and update rules. | Yes; completed audit document | None | None | E17: docs/KORVO_MASTER_LAUNCH_CHECKLIST.md validated; companion docs point here |
| BETA-002 | P0 | Blocked | Approve exact beta scope: cleared project categories, geography, invite cap, sandbox-only vs money handling and success/stop criteria. | No for owner launch scope | D11 plus D6/D7 | LEG-004, LEG-007 | E15: broad mission confirmed; explicit restricted beta operating scope/cap not approved |
| BETA-003 | P0 | Blocked | Clear critical authorization findings with verified deployed fixes and reviewed operational rollback. | Yes after approval | A6 | SEC-003, SEC-005 | E03/E05: staged hardening is not deployed protection |
| BETA-004 | P0 | Blocked | Clear integrated payment/Connect/evidence/refund/release safeguards before any money-handling beta. | Yes for engineering after gates | D1–D4; A7/A10/A1 as applicable | PAY-005, PAY-006, PAY-007, EVI-004 | E05/E06: no complete mapped onboarding; no enabled transfer executor |
| BETA-005 | P0 | Blocked | Publish approved terms/privacy/support/eligibility claims and tested frontend; verify served version and recovery flow. | Yes after approvals | D6/D7; A8 | WEB-002, WEB-008, CUS-003, LEG-001, LEG-002 | E07/E13: blank recovery, missing policies, static verified claims |
| BETA-006 | P0 | Not Started | Prepare controlled invitation/onboarding, genuine-user labels, documented feedback and consent with no fake endorsements. | Yes for implementation | D11/D7; approval before sending invitations | TRU-008, BETA-002 | E13: no verified beta roster/invitation/feedback operating process |
| BETA-007 | P0 | Needs Verification | Prove support coverage, monitoring/alerts, rollback readiness, reserve/aging review and incident drill for beta. | Yes for drills/tooling | D7; D1/D3 operational policy | ADM-005, ADM-006, ADM-008 | E13: runbooks partial; operational ownership and restore drill not evidenced |
| BETA-008 | P0 | Blocked | Perform final go/no-go with per-gate evidence and explicitly approved residual risks; record release commit/settings. | No for owner go decision; yes for evidence preparation | D11; A1/A6/A7/A8/A10 as applicable | BETA-003, BETA-004, BETA-005, BETA-007, TEST-007 | E17: current result NO-GO for money handling; no readiness percentage inferred |
| BETA-009 | P1 | Not Started | Review actual beta incidents, completion/refund/support outcomes and cohort metrics against agreed stop/expand thresholds. | Yes after beta starts | D11 thresholds | BETA-008 | E13: no controlled cohort operating evidence to review yet |
| BETA-010 | P0 | Blocked | Keep employee/hospitality public booking disabled unless that cohort separately clears classification/payroll/insurance gates. | Yes to preserve gates | D8–D10; A9 for expansion | GIG-002, GIG-009, LEG-008 | E11/E14: disabled preview/schema is not a functioning or legally cleared shift marketplace |

## 14. Public-launch readiness

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PUB-001 | P0 | Blocked | Complete controlled beta and resolve material incidents before unrestricted public acquisition or booking. | Yes for engineering; owner authorizes expansion | D11 launch scope and risk acceptance | BETA-008, BETA-009 | E17: money-handling beta still blocked; no public go-live evidence |
| PUB-002 | P0 | Complete | Preserve current no-live-payment/no-transfer/no-public-hospitality safety boundary; no remaining activation action authorized. | Yes; guard preservation | A1/A7/A9 required for any later activation | None | E02/E05/E11: sandbox functions, held records, missing executors and closed gig gates |
| PUB-003 | P0 | Blocked | Obtain explicit separate live Stripe/bank-payout authorization after readiness, operational controls and provider clearance. | Yes only after owner activation approval | A1/A7; D1–D4 | BETA-004, PAY-008, LEG-003 | E15: sandbox approval does not authorize live funds or bank payouts |
| PUB-004 | P0 | Needs Verification | Verify production provider keys/scopes, webhook destinations/signatures, environment isolation and production callback/domains. | Yes for inspection/preparation | Approval for production settings or secret rotation | SEC-008, AUTH-001 | E08/E12: current integration proves sandbox only; do not activate to audit |
| PUB-005 | P0 | Not Started | Prove capacity/rate limits, abuse prevention, real load, queue/reconciliation health and recovery at public traffic levels. | Yes in isolated/staged environments | Cost/production-load approval if needed | TEST-009, ADM-005, ADM-008 | E13: no verified load/scale or restore results for public launch |
| PUB-006 | P1 | Not Started | Prepare approved domain/canonical URLs, social metadata, sitemap, indexing and honest public marketing/referrals. | Yes for development | D7 messaging; approval before public promotion/domain changes | WEB-008, LEG-001 | E13: GitHub Pages source exists; no complete public acquisition/SEO release package |
| PUB-007 | P0 | Needs Verification | Verify public-scale support staffing, insurance, tax/reporting, fraud/chargeback reserve and privacy incident responsibilities. | Mostly engineering inventory | Owner staffing/budget/coverage decisions; qualified review | ADM-006, LEG-007, LEG-009 | E14/E15: operating capacity/coverage not evidenced |
| PUB-008 | P1 | Not Started | Add consent-compatible analytics, service health indicators, operational cost budgets and launch observation plan. | Yes for design/code | D7 privacy analytics choices; budget/activation approval | LEG-002, ADM-010 | E13: no complete privacy-approved analytics/monitoring plan |
| PUB-009 | P0 | Blocked | Clear each new city/category and hospitality staffing rollout separately, preserving wages/tips and appropriate payment route. | Yes for staged engineering | D8–D10; A9 expansion approval | LEG-005, LEG-006, LEG-007, LEG-008 | E14/E15: no permission to apply contractor model to restaurant shifts |
| PUB-010 | P0 | Blocked | Record public go/no-go, reviewed commit/configuration, support/rollback ownership and explicit final publication approval. | No for owner launch decision; yes for evidence package | A1/A8/A9 as applicable; D11 | PUB-001, PUB-003, PUB-004, PUB-005, PUB-007 | E17: no public launch authorization granted by this audit |

## Top 10 remaining launch blockers

1. **SEC-003/SEC-005** — tested security snapshot/inverse, explicit A6, deployment and
   postdeployment authorization/advisor regression. Current RLS inventory is insufficient.
2. **ADM-001/AUTH-004** — verified owner/admin identity, least privilege and strong access;
   zero active admins exist. Support must remain outside financial powers.
3. **PAY-005/PRO-004** — complete a correctly owned mapped Connect account and prove sync;
   two ready unrelated accounts are not acceptable substitutes.
4. **EVI-001–EVI-004/EVI-009** — real private evidence endpoint/UI/decoder, legacy rollout,
   customer acknowledgment and trusted completion facts.
5. **PAY-006/ADM-002** — policy-approved refund/admin UI, provider actions and reconciliation;
   a recommendation queue cannot execute or settle a refund.
6. **PAY-007/PAY-008/ADM-005** — durable transfer/reversal accounting, available funds,
   reserve/aging limits, ambiguous-operation recovery and reconciliation; A7 stays closed.
7. **PAY-009/EVI-007** — D1–D3 processing/refund/cancellation/release policies and clear receipts.
8. **WEB-002/CUS-003/AUTH-001** — approved frontend/recovery publication and real email/token
   verification; the served recovery page is still empty.
9. **WEB-008/TRU-001/LEG-001/LEG-002/LEG-007/ADM-006** — truthful trust claims, approved
   categories/terms/privacy/coverage and monitored support. No guarantee is inferred.
10. **TEST-007/BETA-002/BETA-007/BETA-008** — complete hosted negative/success acceptance,
    explicit beta cohort, operational drill and owner go/no-go. Staffing expansion separately
    requires D8–D10 and A9; it need not be bundled into a cleared project-only beta.

## Exact owner inputs and authorizations

The stable D/M/A definitions and recommendations in OWNER_ACTION_CHECKLIST.md govern.
This table maps them to concrete work and does not repeat confirmed pricing decisions.

| Owner item | Exact input / approval | Blocked tasks |
| --- | --- | --- |
| D1 | Select who bears Stripe processing costs; do not deduct them silently from professional gross | PAY-006, PAY-008, PAY-009, PRO-009 |
| D2 | Refundable fee, cancellation/no-show/partial-work remedies and support exceptions | PAY-006, PAY-009, JOB-007, EVI-007 |
| D3 | Release timing, issue window, reserve/aging operating approach | PAY-007, PAY-008, EVI-004, EVI-007 |
| D4 | Identify and authorize the verified owner/admin account; never send secrets or passwords | ADM-001, AUTH-004, PAY-006 |
| D5 | Membership cancellation allowance restoration: reviewed vs automatic once-only | PRO-007, PAY-010 |
| D6 | Cleared project categories and required license/identity/background evidence, truthful labels | PRO-010, TRU-001, WEB-008, LEG-004 |
| D7 | Monitored support route/operating promises and approved terms/privacy/retention/trust copy | ADM-006, LEG-001, LEG-002, WEB-003 |
| D8 | Host employer, qualified partner or Korvo employer arrangement after qualified review | GIG-002, GIG-009, LEG-005 |
| D9 | Cleared shift categories, locations, age/alcohol eligibility and insurance prerequisites | LEG-008, PUB-009, BETA-010 |
| D10 | Payroll/overtime/tip/time correction and employer-cost responsibility after D8 | GIG-008, GIG-009, LEG-006 |
| D11 | Beta scope/cap/geography, non-money vs money cohort, success/stop criteria and later expansion | BETA-002, BETA-008, PUB-001 |
| D12 | Confirm authoritative operator/entity/tax and appropriate insurance arrangements/budget with qualified advisers | LEG-003, LEG-007, LEG-009, PUB-007 |
| M1 | Complete mapped hosted Stripe sandbox setup only if automation cannot finish; provide status only | PAY-005, PRO-004 |
| M2 | Genuine controlled-email confirmation/reset/reuse test after approved publication and callback verification | CUS-001, CUS-003, AUTH-001 |
| A1 | Separate explicit live payment/payout/subscription activation after all money gates | PUB-003, PAY-010 |
| A2 | Separate authorization for any production-facing unverified change; default is keep it undeployed | All production changes lacking verified scope |
| A3 | Paid plan/cost approval before leaked-password protection upgrade | SEC-009 |
| A4 | Scoped deletion of retained fixtures/data; preserve data until authorized | ADM-009, TRU-008 |
| A5 | Any major penalty, pricing change or nonrefundable-fee enforcement; not granted here | PAY-009, EVI-007 |
| A6 | Exact reviewed authorization migration scope after snapshot/inverse and regression prerequisites | SEC-005, BETA-003 |
| A7 | Any actual contractor transfer including sandbox; tested disabled evaluator is not approval | PAY-007, PUB-003 |
| A8 | Main/Pages merge/publication and related approved frontend release | WEB-002, CUS-003, BETA-005 |
| A9 | Gig schema/public booking/payroll/category activation after legal and technical clearance | GIG-002–GIG-009, BETA-010, PUB-009 |
| A10 | Separate reviewed completion-evidence and admin-refund schema/Edge/storage rollout, including legacy jobs | SEC-010, EVI-001, EVI-009, ADM-002 |

Legal/insurance/manual owner inputs are not engineering tests. All reliable automated
checks remain engineering work. No request to send documents, banking details, SSNs,
credentials or real tax data into a chat is implied. Owner may provide safe verification
of decisions through appropriate connected account flows.

## Recommended development order

1. Finish P0 independent evidence preparation: scoped security snapshot/inverse,
   support/finance denial regressions, truthful-copy inventory and document integrity.
2. In parallel obtain D1–D4, D6/D7 and D11/D12. Prepare approved policies and owner access.
3. Complete disabled evidence decoder/endpoint/UI and refund/reconciliation integrations;
   retain stable retry keys and original allocations. Do not execute transfers.
4. Rehearse exact scoped authorization changes; obtain A6; only then deploy/verify that scope.
5. Obtain A10 for tested evidence/refund rollout and A8 for reviewed frontend/recovery copy;
   verify actual served assets and real email callback/token behavior.
6. Complete correctly owned sandbox Connect setup and full TEST-007 hosted chain, including
   negative/failure cases and release preparation. Re-run only impacted suites as changes occur.
7. Finish durable transfer/reversal/reserve/reconciliation safeguards and policy-approved
   sandbox scenarios; request A7 only after those prerequisites are concrete and reviewable.
8. Verify support, monitoring, restore/incident runbooks and beta scope. Obtain explicit
   BETA-008 go/no-go for the chosen cohort; live funds still need A1.
9. Operate a limited cleared cohort, review actual incidents/outcomes, close regressions.
10. Clear public scale, legal/insurance/tax/support requirements and request public approval.
    Develop shift endpoints behind closed gates in parallel; D8–D10/A9 are separate gates.

## Evidence registry

All entries are time-bounded. No sensitive customer rows, account IDs, keys or fixture
credentials are embedded. No mutation was used to produce the live snapshot.

| Key | Evidence source | Supports / limitation |
| --- | --- | --- |
| E01 | GitHub PRs [#4](https://github.com/korvoadmin/Korvo-1.0/pull/4), [#5](https://github.com/korvoadmin/Korvo-1.0/pull/5), [#6](https://github.com/korvoadmin/Korvo-1.0/pull/6); published head 3d3ebfac | Open drafts, not merged; current source tree inspected |
| E02 | October 15 Supabase list_migrations/list_edge_functions; project waaglkephsbxdlleuutr | Last migration 20261012153716; Checkout v5, webhook v5, Connect v6 |
| E03 | October 15 read-only Security Advisor | 7 RLS INFO, 1 anon + 52 authenticated definer WARN, leaked-password WARN; no blanket finding of 53 exploitable APIs |
| E04 | October 15 read-only Performance Advisor | 33 auth initplan WARN, 62 unused-index INFO; no indexes dropped |
| E05 | October 15 aggregate SQL catalog/payment/admin/mapping/storage query | 43 RLS public tables; 0 active admins; all 3 payment releases held; no proposed private schemas; private issue bucket only |
| E06 | October 15 Stripe sandbox GetAccounts plus exact internal mapping comparison (no identifiers published) | 5 total, 2 ready but unmapped; both mapped incomplete, payouts false, transfers inactive; no provider writes |
| E07 | October 15 direct HTTPS GET/hash comparison, [live site](https://korvoadmin.github.io/Korvo-1.0/); docs/LAUNCH_AUDIT_EVIDENCE_2026-10-15.json | Served files match main; forgot-password empty, reset/privacy/terms 404. post-job.js probe excluded as noncanonical |
| E08 | [GitHub run 38684295134](https://github.com/korvoadmin/Korvo-1.0/actions/runs/38684295134), reviewed job logs at 3d3ebfac | 117 unit/source, 166 Chromium fixture, 45 gig DB, 91 evidence/refund DB, 7 full decoder checks passed |
| E09 | docs/SPRINT_REPORT_2026-10-12.md and docs/SUPABASE_SECURITY_AUDIT.md | Historical actual sandbox payment/provider/HTTP and negative Auth/Storage checks; not a fresh full journey |
| E10 | docs/SPRINT_REPORT_2026-10-13.md and docs/SPRINT_REPORT_2026-10-13_WORKFLOWS.md | 134 hardening rollback, 94 payment/matching DB and 20 deployed lifecycle checks; dated preserved evidence |
| E11 | PR #6 source, supabase/proposals, docs/SPRINT_REPORT_2026-10-15_PUBLICATION.md, tests/README.md | Actual proposed SQL and isolated tests; no deployment or real concurrent-session proof |
| E12 | docs/SUPABASE_SECURITY_AUDIT.md Auth findings; current supabase.js/auth.js and recovery source | Known configuration gaps, remembered-session issue; no claim SMTP/MFA/rate settings are verified |
| E13 | Current HTML/JS/README file inventory and targeted placeholder/link/source inspection | Explicit missing/placeholder functionality and unsupported static trust claims; source existence is not feature completion |
| E14 | docs/HOSPITALITY_COMPLIANCE_REVIEW.md, docs/GIG_MARKETPLACE_FOUNDATION.md | Prior primary-source research and unresolved questions, not legal advice/clearance, bound insurance or employer authorization |
| E15 | docs/PAYMENT_PRICING_SPEC.md, docs/GIG_PRICING_POLICY.md and owner H/D/M/A register | Confirmed business decisions preserved; undecided policy stays undecided |
| E16 | tests/evidence-refund-database.cjs; audit follow-up report | 94 isolated checks after owner/admin-only role fix; host actor/Storage simulated; no deployed role change |
| E17 | scripts/check_launch_checklist.py and tests/launch-checklist.test.mjs; audit follow-up report | Validates counts, all 14 sections, IDs, acyclic dependencies, evidence and owner refs; scoped audit tasks complete only when checks pass |

## Synchronization and maintenance rules

This Markdown file is the authoritative task/status register. Do not maintain a
second competing task database. Update a row only with dated evidence and the layer
(local/isolated, deployed, published) it actually proves. Add rows rather than erase
remaining work; retain IDs and cross-reference dependencies. If a new dependency is
found, change status promptly. Regenerate counts from rows with the checker.

OWNER_ACTION_CHECKLIST.md owns the stable decision/manual/approval definitions;
CLOSED_BETA_READINESS.md summarizes gates and links here. Neither may mark a gate
ready because code or CI exists. Check the owner-reference validator after edits.
Any milestone summary must include Needs Verification separately. Re-audit version
state after deployments; historical tests are not automatically current acceptance.
