# Korvo 1.0 — authoritative master launch checklist

Current engineering snapshot: **October 17, 2026, UTC (October 16 America/New_York)**. This document is the launch
engineering source of truth. Owner decisions/approvals retain their stable IDs in
[OWNER_ACTION_CHECKLIST.md](OWNER_ACTION_CHECKLIST.md); the readiness summary is
[CLOSED_BETA_READINESS.md](CLOSED_BETA_READINESS.md). Earlier reports are dated
checkpoint evidence, not competing current task lists.

**Assessment: NO-GO for money-handling closed beta and public launch.** A controlled
sandbox rehearsal is possible; the integrated hosted evidence/refund/release chain is
unfinished. A non-money usability cohort still needs truthful copy, privacy/support,
access controls, explicit scope and invitation approval. The first cohort is 10 customers +10 professionals in metro Atlanta, invitation-only
and without real money. Employee staffing, payroll and hospitality employee-shift
placement are deferred to potential Korvo 2.0. Independent project classification
and category clearance still apply. See CLOSED_BETA_MINIMUM_GATES.md. No merger, deployment, production settings, money movement or
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
- Korvo absorbs processing costs from its 12% fee. Manual refund review and immediate
  verified release eligibility are confirmed; remaining partial/cancellation/reserve/aging
  details are unresolved. Employee wages cannot use contractor Stripe Connect.
- Memberships remain one free job, $29.99/3, $49.99/6 and $89.99/unlimited.
- Main/Pages publication, authorization migration, live payments and transfers remain
  separately approval-gated. Existing development-branch publication is authorized
  after outgoing-history privacy/credential review. No silent approval by inactivity.

## Evidence layers and current deployment boundary

| Layer | Actual evidence | Limit |
| --- | --- | --- |
| Implemented development | Draft PRs #4–#7; current sprint source and exact release manifest | Not merged; code is not deployed proof |
| Passing local/isolated + remote CI | E18/E19: prior CI plus new ledger/current-schema/Deno checks; final native CI result in latest sprint report | Browser/Auth/Storage fixtures; no full hosted chain |
| Audit follow-up | E16: 94 isolated evidence/refund checks after owner/admin-only guard fix; E17 document checks | New code remains undeployed; current remote CI recorded in audit report |
| Passing deployed historical | E09/E10: real sandbox Checkout/provider, negative Auth/API/Storage, transactional DB rehearsals | Dated component results; no new real charge or full acceptance this audit |
| Actually deployed backend | Checkout v5; webhook v5; Connect v6; last migration 20261012153716 | Authorization, completion, refund and gig proposals absent |
| Actually published website | E07 direct GET hashes match origin/main | Recovery blank; updated dashboard/onboarding/messaging/posting/recovery development not published |

## Task counts

Total tasks: **144**.

| Status | Count |
| --- | ---: |
| Complete | 21 |
| In Progress | 46 |
| Blocked | 33 |
| Not Started | 14 |
| Needs Verification | 30 |

Priority counts: P0: 99, P1: 35, P2: 10.

## 1. Website and mobile functionality

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| WEB-001 | P0 | Complete | Inventory actual published assets; no remaining audit work for this snapshot. This does not certify functional journeys. | Yes; read-only audit completed | None | None | E07: live hashes match main; recovery is blank; development dashboards differ |
| WEB-002 | P0 | Blocked | Publish reviewed dashboard, messaging, onboarding, posting and recovery fixes; verify served bytes afterward. | Yes, after approval | Approval A8; final policy copy D7 | SEC-005, LEG-001, LEG-002 | E01/E07: PRs #4–#6 unmerged; live scripts remain old |
| WEB-003 | P0 | In Progress | Nine remaining contact/profile references now resolve in development. Finish 17 policy/demo placeholders, approved documents and durable versioned assent. | Yes for implementation | D6/D7 copy and trust scope; A8 publication | LEG-001, LEG-002, TRU-001 | E20: 18-page offline audit: zero missing/empty linked targets; no publication. |
| WEB-004 | P1 | In Progress | Preserve route inventory; finish base-path, final deployed navigation and error verification after A8. | Yes | A8 only for publication | WEB-002 | E20: 18 pages; zero missing/empty links; authenticated own-profile route tested. |
| WEB-005 | P1 | In Progress | Mixed mobile page/database integration now passes at 375px. Finish full iOS/Android journeys, orientation/keyboards/file pickers and physical/assistive behavior. | Mostly; automated browser work first | Manual only where device behavior cannot be safely reproduced | WEB-002 | E23: 12 current-schema mixed browser/database checks; 18 default-off axe views plus two active beta views; no physical-device claim. |
| WEB-006 | P1 | In Progress | 16 default-off desktop/mobile axe views pass; finish active forms, keyboard/focus/screen-reader and actual device journeys. | Yes for automated/manual engineering audit | A8 for publication; assistive/device verification | WEB-002 | E22: 16 Chromium views zero axe WCAG A/AA violations; real devices not claimed. |
| WEB-007 | P1 | Needs Verification | Measure real load times, asset weight, slow-network behavior, cache busting and stale-script recovery. | Yes | A8 for changed assets | WEB-002 | E07/E13: no documented field-performance or cache release gate |
| WEB-008 | P0 | In Progress | Preserve truthful examples and remove remaining unsubstantiated claims; obtain final category/badge copy and A8 served-version verification. | Yes for implementation | D6/D7 approve truthful trust copy; A8 | TRU-001, TRU-008 | E20: Removed background-verification offer; own-profile navigation replaces misleading public link; no certification claims added. |
| WEB-009 | P1 | Needs Verification | Audit DOM injection, external links, navigation/logout redirects and security headers/CSP compatible with hosting. | Yes; fixes can be staged | Approval for production/hosting changes | SEC-005 | E13: selective escaping tests exist; no full frontend/header audit recorded |
| WEB-010 | P1 | Complete | Correct repository README mission to projects, shifts and everyday gigs and link the master register; no live feature is enabled. | Yes; documentation scope completed | A8 remains required for any live marketing edit | None | E17/E13: README wording updated and regression checked; public trust-copy review remains WEB-008 |

## 2. Customer registration and dashboard

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| CUS-001 | P0 | In Progress | Confirmation-resend page, single-flight login/signup and generic failure handling are staged. Finish actual email/callback/duplicate-email and admitted landing acceptance after A8. | Mostly | M2 real email/callback acceptance; A8 | AUTH-001, WEB-002 | E23: 20 login/confirmation fixtures; signup/recovery suites preserved; zero emails sent. |
| CUS-002 | P0 | In Progress | Ship and verify customer posting/role validation, rapid-click protection and saved-response handling in the published dashboard. | Yes, after publication approval | A8 | WEB-002, JOB-001 | E08/E10: fixture checks pass; E07 confirms older dashboard is live |
| CUS-003 | P0 | Blocked | Publish recovery pages, verify allowed callback URL and one-time token use; old password must fail after reset. | Mostly | A8; M2 only after publication/configuration | AUTH-001, WEB-002 | E07: forgot-password.html 200 with zero bytes; reset-password.html 404; 16 fixture checks passed |
| CUS-004 | P1 | Needs Verification | Verify customer profile edits, validation, settings, persistence and privacy through real account permissions. | Yes | A8 for publication | SEC-006 | E13: customer account settings still reports coming soon |
| CUS-005 | P0 | In Progress | Integrate authoritative payment summaries and actionable paid/failed/refunded/review states in customer cards. | Yes | A8 publication | PAY-002, PAY-004 | E08: 19 payment browser checks; E07: new payment dashboard markup not live |
| CUS-006 | P1 | Needs Verification | Verify history, accepted quotes, notifications, empty/loading/error states and pagination with realistic account data. | Yes | None for staging/testing | JOB-006 | E10: backend/history tested; full My Jobs and quote comparison links remain placeholders |
| CUS-007 | P0 | Needs Verification | Verify customer can only view/edit own profile, jobs, messages, private details and completion decisions end to end. | Yes | A6/A8 before final deployed rerun | SEC-005, TEST-007 | E10 deployed negative tests are historical; final current-chain acceptance pending |
| CUS-008 | P1 | Not Started | Provide account data export/deletion request path, retention notice and safe removal workflow preserving required financial records. | Yes for design/code | D7 retention/privacy approval; A4 for actual deletions | LEG-002, ADM-008 | E13: no completed account-rights flow found; no data deletion authorized |
| CUS-009 | P1 | Needs Verification | Specify and test remembered sessions, logout, expired tabs and inactive-account recovery across devices. | Yes | Approval for production Auth/session settings | AUTH-002, AUTH-003 | E12: Remember-me has no distinct persistence policy |
| CUS-010 | P0 | In Progress | Durable version/hash-bound current role-specific assent and explicit UI are staged. Approve real documents and verify hosted signup/posting/assignment enforcement; no receipt claimed from an unchecked box. | Yes for implementation | D7; A8 and A11 rollout | LEG-001, LEG-002 | E22: 40 SQL and 18 beta browser checks; approved document registry is empty. |

## 3. Professional registration and dashboard

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| PRO-001 | P0 | In Progress | Publish/test professional onboarding saves, role boundaries, required services/areas, cache failure recovery and duplicate submits. | Yes | A6/A8 for final rollout | SEC-005, WEB-002 | E08/E10 fixtures pass; E07 live onboarding is the older version |
| PRO-002 | P0 | Needs Verification | Exercise real professional signup/email/login and incomplete-profile routing through completion. | Mostly | M2 only if inbox access is necessary | AUTH-001, PRO-001 | E12: controlled synthetic login is not genuine email registration |
| PRO-003 | P0 | In Progress | Opportunities and matched notifications now respect admitted cohort/current terms across legacy RPCs. Finish actual professional quote-form/onboarding and hosted acceptance. | Yes | A6/A8/A11 | JOB-002, JOB-006 | E23: Actual-schema outside professional feed bypass reproduced and fixed; 18 representative discovery SQL checks; no hosted fix claimed. |
| PRO-004 | P0 | Needs Verification | Both current mapped account owner metadata values match, but both remain incomplete. Finish actual hosted onboarding and complete/restricted refresh/webhook acceptance. | Mostly | M1 only where hosted automation remains unreliable | None; owner M1 if automation cannot finish | E19: Fresh provider GET and database mapping match; payouts false/transfers inactive; two unrelated ready accounts remain unmapped |
| PRO-005 | P0 | Complete | Retain verified incomplete-Connect denial; no remaining implementation for this deployed sandbox guard. | Yes; preserve in regressions | A7 before any transfer activation | None | E02/E06/E09: deployed v6 and both mapped accounts inactive; prior access checks passed |
| PRO-006 | P1 | In Progress | Own-account read-only profile now implemented. Editing, availability, gallery and truthful public previews still need implementation/acceptance. | Yes | D6 trust rules; A8 publication | TRU-001, SEC-010 | E20: 10 browser checks cover ownership, role/standing, signout, XSS and 375/768/1280 widths; fixtures only. |
| PRO-007 | P1 | In Progress | Preserve confirmed memberships and manual once-only restoration. Finish Billing lifecycle and hosted operator restoration acceptance. | Yes for sandbox implementation | D5 allowance restoration; approval before live billing | PAY-010 | E20: Ten isolated checks exercise unchanged A6 restoration SQL, support denial, once-only mutation and original audit preservation. |
| PRO-008 | P0 | In Progress | Require completion evidence, confirmed save and customer review before any release candidate. | Yes for development | A10 deployment; D3 release policy | EVI-001, EVI-002, EVI-004 | E11: proposed gates and UI response tests pass independently; no hosted integrated photo flow |
| PRO-009 | P1 | Needs Verification | Provide reliable job/earnings statements distinguishing gross, fee, held funds, transfers and bank payout status. | Yes | D1/D3 approved cost/release copy; A8 | PAY-007, PAY-008 | E13: no complete reconciled earnings/bank-payout view recorded |
| PRO-010 | P0 | Blocked | Clear professional categories, licensing requirements, onboarding conduct terms and restrictions before beta participation. | Yes for enforcement code | D6/D7 eligibility and terms approval | TRU-001, LEG-001 | E14/E15: final permitted project categories and trust thresholds undecided |

## 4. Business accounts and gig marketplace

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GIG-001 | P0 | Complete | Preserve tested hourly/fixed pricing kernel and employee-payment isolation; no remaining kernel work for confirmed examples. | Yes; preserve regression coverage | None; this is a development component only | None | E08/E11/E15: $108+$12.96=$120.96, tips excluded; all execution disabled |
| GIG-002 | P2 | Blocked | Future Korvo 2.0 employee/staffing classification arrangement; not a first-beta decision. Independent-project category review remains LEG-004. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | LEG-005, LEG-006, LEG-007 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |
| GIG-003 | P1 | In Progress | Finish business/worker profile endpoints for display name, skills, experience, availability and areas using existing account boundaries. | Yes for disabled implementation | A9 deployment; D8/D9 before enablement | SEC-005 | E11: private proposed schema exists, no authenticated gig API is deployed |
| GIG-004 | P2 | In Progress | Employee-shift posting/drafts/scheduling deferred to potential Korvo 2.0; preserve existing research. Qualifying independent gigs need separate future scope. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | GIG-003 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |
| GIG-005 | P1 | Not Started | Build mobile gig discovery, filters and opportunity details without disclosing private addresses or applicant data. | Yes behind closed gates | A9 public exposure approval | GIG-003, GIG-004 | E11: no deployed public gig feed or privacy-scoped endpoint |
| GIG-006 | P1 | In Progress | Persist applications, business selection, worker confirmation, capacity and filled-state transitions atomically. | Yes for development | A9 deployment | GIG-004, GIG-007 | E11: pure kernel/schema constraints tested; actual API persistence missing |
| GIG-007 | P0 | In Progress | Real native CI capacity/worker overlap and transaction rollback tests pass. Expand crash/deadlock/application concurrency coverage and later hosted authenticated endpoints. | Yes when isolated multi-session environment available | Approval if provisioning has cost | Native CI service and reviewed job results; additional crash/deadlock coverage remains | E19: Seven native gig checks passed at db28fb6; no hosted booking or payment setting changes |
| GIG-008 | P2 | In Progress | Employee attendance/payable-hours/corrections research deferred to potential Korvo 2.0. Preserve existing disabled kernels; no beta staffing work. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | GIG-006, GIG-002 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |
| GIG-009 | P2 | Blocked | Employee payroll/overtime/tips/withholding/staffing invoice and wage distribution deferred to potential Korvo 2.0; no contractor Connect routing. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | GIG-002, LEG-006 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |
| GIG-010 | P2 | Not Started | Add recurring shifts, teams, travel buffers, calendars and advanced business analytics after basic safety is established. | Yes later | Future product scope approval if policies change | GIG-006, GIG-007, GIG-008 | E13: no such production feature found; not a project-beta gate |

## 5. Job posting, quotes, applications, and messaging

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| JOB-001 | P0 | In Progress | Actual posting form persists through composed authorization and returns saved reference. Finish durable request identity across reload/ambiguous timeout and hosted acceptance. | Yes for code | A8/A11 | CUS-010 | E23: 12 mixed browser/database checks; INSERT RETURNING policy self-lookup regression found and fixed; durable cross-reload idempotency remains. |
| JOB-002 | P0 | In Progress | Actual browser API quote/acceptance creates booking, conversation and one membership usage. Finish full quote-form UI and genuine hosted customer/pro acceptance. | Yes | A6/A8/A11 | PRO-001, PAY-001 | E23: 31 current-schema journey +12 mixed page/database checks; no provider payment row created. |
| JOB-003 | P0 | Not Started | Add private initial job-photo upload/attachments with ownership, limits, validation and retry recovery. | Yes for development | Approval for new production storage/policies | SEC-010 | E13: posting photo control exists but attachments are not integrated |
| JOB-004 | P0 | In Progress | Both actual messaging screens exchange database-persisted messages across synthetic accounts. Finish durable send idempotency/offline recovery and hosted publication. | Yes for development | A8 | SEC-005 | E23: 12 mixed browser/database checks; outsider RPC denied in composed SQL; delayed-response suites retained. |
| JOB-005 | P0 | Needs Verification | Verify contact reveal remains participant/payment-gated and moderation safely handles blocked users and personal-data attempts. | Yes | D7 final policy; A6/A8 final checks | PAY-002, SEC-007 | E09/E10: server controls and moderation exist; full live abuse/redaction journey not verified |
| JOB-006 | P1 | In Progress | Legacy discovery/notification bypass now guarded; finish hosted notification delivery/read/count/retry acceptance and any approved email promises. | Yes for in-app; provider work after scope | D7 promises; A8/A11 | AUTH-001 | E23: 18 discovery SQL checks; retained outside-cohort notifications hidden and new matches suppressed; no hosted delivery change. |
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
| PAY-004 | P0 | In Progress | Keep provider discrepancies held and original allocations immutable. Recovery preserves review/ledger/reconciliation records; hosted provider/accounting acceptance and approved corrections remain. | Yes for sandbox code | A10; separately approved accounting correction | None; safe reconciliation implementation can proceed | E22: 18 A10 checks preserve audits/holds; $112 component split unapplied, $560 held review unchanged. |
| PAY-005 | P0 | Needs Verification | Finish hosted complete-state onboarding/refresh for the correctly mapped professional; no account substitution. | Mostly | M1 if hosted automation cannot finish | PRO-004 | E19: Fresh read-only ownership match for both mappings; M1 still open; no new link/session manufactured |
| PAY-006 | P0 | In Progress | Finish hosted permissions, operational refund review and separately approved execution; staged component correction never issues a provider refund. | Yes for development | D1/D2/D4; A10 deployment | ADM-001, SEC-005 | E20: 30 admin browser checks; 43 reconciliation SQL; duplicate request receipts and unchanged holds. |
| PAY-007 | P0 | In Progress | Trusted evidence eligibility integration staged, including immediate verified founder eligibility. Finish reserves/aging/provider settlement, executor design and separately approved transfers. | Yes for development | D3; A7 before any actual transfer | PAY-005, EVI-004, ADM-001 | E20: 29 release tests; evidence facts replace client claims; execution always false; native additions await CI. |
| PAY-008 | P0 | Blocked | Approve release/issue window and validate provider settlement/holding limits, available balance and platform payout schedule. | Yes for research/design; owner sets policy | D1/D3; A7/A1 activation | PAY-007, LEG-003 | E14/E15: no indefinite-hold/escrow promise allowed; no final operating schedule |
| PAY-009 | P0 | Blocked | D1 payer resolved: Korvo absorbs costs. Manual review/full pro-cancellation refund direction recorded. Finish remaining partial/cancellation/remedy details, reserves and receipts. | Yes for code after decisions | D1/D2/D3; A5 if penalties/pricing change | None; D1/D2/D3 are owner policy decisions | E20: Tested processing allocation preserves full gross even when Korvo margin is negative; no automatic refunds or extra customer fee. |
| PAY-010 | P1 | Not Started | Finish sandbox subscription purchase/change/cancel/invoice webhooks, entitlement recovery and reporting using confirmed tiers. | Yes for sandbox | D5 allowance restoration; A1 for live subscriptions | PAY-003 | E10/E15: catalog/database entitlements exist; Stripe Billing lifecycle not complete |

## 7. Supabase security, RLS, authentication, and storage

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| SEC-001 | P0 | Complete | Record current table/RLS inventory; no remaining inventory work for this snapshot, not proof every policy is safe. | Yes; read-only completed | None | None | E05: 43 public tables; zero without RLS |
| SEC-002 | P0 | Complete | Inventory every current advisor finding with separate security/performance dispositions. | Yes; read-only completed | A3 only for paid protection | None | E03/E04: 7 INFO RLS; 1 anon/52 signed-in definer warnings; password warning; 33 initplan/62 unused indexes |
| SEC-003 | P0 | Blocked | Alternate seven-package A6 scope/inverse passes populated non-superuser model without Storage policy changes. Protected durable backup and qualified managed recovery remain required. | Yes | A6 plus bounded managed backup/recovery prerequisites | SEC-004 | E22: Free plan confirmed read-only; 50 populated +134 matrix; original scope preserved. |
| SEC-004 | P0 | Complete | Preserve unchanged seven-package/canonical byte-equivalence and current-schema positive/negative regression. Managed execution is separately blocked. | Yes; verified checkpoint | None for preserved evidence | None | E21: Exact inventory: 464 statements; 103 definitions, 43 function alterations, 46 policies, three triggers; populated 134-check matrix passes. |
| SEC-005 | P0 | Blocked | Review exact 462-statement alternate retaining original Storage expressions. Qualify managed recovery before A6; then genuine deployed role/advisor acceptance. | Yes after approval | A6 exact alternate-scope deployment authorization | SEC-003 | E22: Storage ownership requirement removed from alternate only; six retained Storage access tests pass; no hosted DDL. |
| SEC-006 | P0 | In Progress | Close staged beta definer-feed, opportunity/notification and project-invitation admission gaps; retain hardened role/verification guards. Finish deployed authorization acceptance. | Yes for staged code/tests | A6/A11 deployment | SEC-005 | E23: 31 actual-schema plus18 representative discovery SQL; old bypass reproduced before fix; no production permissions changed. |
| SEC-007 | P0 | In Progress | Current-schema composed multi-account journey and legacy feed negatives pass. Genuine managed JWT sessions and post-deployment matrix remain. | Yes | A6/A10/A11 as applicable | SEC-005 | E23: 31 full +31 evidence-only SQL; 12 mixed page/database; prior unchanged 50+134 A6 evidence retained. |
| SEC-008 | P0 | In Progress | Changed-object-only inverse avoids unnecessary managed ownership requirements. Finish actual backup entitlement/durable snapshot, other-role scope and managed restore qualification. | Yes for inspection/design | Approval for rotating production secrets/settings | None | E21: 12 recovery/writer checks; unchanged Storage objects untouched; archive_mode on does not prove backups or PITR. |
| SEC-009 | P1 | Blocked | Enable leaked-password protection after plan approval; verify feature and failure UX afterward. | Yes after upgrade | A3 paid-plan/cost approval | None | E03: disabled warning persists; stronger UI passwords are not equivalent |
| SEC-010 | P0 | In Progress | Evidence-only composed rollout/recovery passes without new finance schemas. Finish managed Storage-owner path, bytes backup, Edge/signed URLs/JWT/resource acceptance. | Yes for staged code | Evidence-only A10 and D7 retention | EVI-002 | E23: 31 evidence-only actual-schema SQL; service verification fixture and Storage metadata only; no hosted upload. |
| AUTH-001 | P0 | Needs Verification | Inspect SMTP delivery, callback allowlist, signup confirmation, recovery reuse, CAPTCHA and Auth rate limits without weakening settings. | Mostly | M2 inbox test only if required; approval for production configuration | WEB-002 | E12: prior public settings confirmed email verification; actual delivery/configuration not fully verified |
| AUTH-002 | P0 | In Progress | Inactive-profile login now clears local session; actual session-bound actor exercised in isolated integration. Finish site-wide expiry/revocation, stale claims and genuine hosted sessions. | Yes | Approval for production Auth settings | SEC-007 | E23: 20 login/resend fixtures and synthetic session-row-bound composed journey; no hosted Auth mutation. |
| AUTH-003 | P1 | Not Started | Implement explicit Remember-me persistence and reliable logout/expired-session UX without weakening authorization. | Yes for development | Approval for production session-policy changes | AUTH-002 | E13: auth.js/supabase.js use default SDK persistence; control is not wired to separate policy |
| AUTH-004 | P0 | Needs Verification | Establish owner/admin strong authentication/MFA and recovery procedure; validate role revocation and support separation. | Yes for code/docs; owner completes enrollment | D4 owner identity; approval for enforcement/settings | ADM-001 | E05: no active admin; MFA configuration and owner enrollment not proven |

## 8. Completion evidence, disputes, and customer protection

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EVI-001 | P0 | In Progress | Reservation/validation/customer acknowledgment wired to dashboard preflight and server guards; finish actual hosted JWT/Storage acceptance. | Yes for development | A10 deployment; legacy-job rollout approval | SEC-010, EVI-002 | E18: 100 SQL checks and both dashboard preflight-denial checks; schema remains unapplied |
| EVI-002 | P0 | In Progress | Trusted Edge decoder executes through local Deno HTTP for valid/corrupt formats. Qualify actual Supabase Edge cold-start/resources/CDN and hosted private uploads. | Yes for design/code/tests | Deployment approval A10 | SEC-008 | E19: Six Deno HTTP cases plus existing decoder suites; exact A10 manifest; hosted runtime not claimed |
| EVI-003 | P0 | In Progress | Photo refresh/race/timeout handling and both dashboard integrations staged. Finish hosted uploads, private URLs, retries and acknowledgment after A8/A10. | Yes for development | A8/A10 publication/deployment | EVI-001, EVI-002 | E20: Six delayed-image browser race checks and 16 component checks pass; no hosted upload claimed. |
| EVI-004 | P0 | In Progress | Service-only evidence facts now integrated into nonexecuting release evaluator. Finish hosted customer acknowledgment and approved financial operational gates. | Yes for development | D3; A7 before transfers | EVI-001 | E20: 29 release tests and 106 evidence/refund SQL; uploaded image alone never releases funds. |
| EVI-005 | P0 | In Progress | Finish user/admin dispute handling for incomplete/poor work, both-party responses and support escalation. | Yes for code | D2/D3/D7 review and customer-protection rules | ADM-003 | E10: issue backend and payment holds tested; financial/admin UI and final policy incomplete |
| EVI-006 | P0 | Complete | Preserve deployed late-payment/cancellation/open-issue holds without silently clearing them on status restoration. | Yes; verified sandbox component | No new policy decision for existing hold safeguard | None | E02/E09: deployed hold migration plus 38 checks and genuine late $560 case |
| EVI-007 | P0 | Blocked | Approve issue-report deadlines, cancellation/no-show refunds, partial completion and customer response/remedy terms. | No for business policy; yes for implementation | D2/D3/D7 | LEG-001 | E15: no unapproved penalty/refund timetable may be enforced |
| EVI-008 | P1 | Needs Verification | Review evidence metadata/privacy, retention, abusive content reporting, access URLs and download/audit behavior. | Yes for engineering | D7 retention/legal basis; A4 for deletion | SEC-010 | E11: type/isolation tests do not establish metadata removal, malware scanning or retention compliance |
| EVI-009 | P0 | Complete | Existing-job cohort rollout design implemented and tested: no backfill; new active jobs enroll; legacy completion preserved. Execution still requires separate A10 approval and UI-first rollout. | Yes; engineering design and local regression complete | A10 exact rollout approval | None for design; A10 gates rollout | E18: 100 SQL checks include legacy completion, new enrollment and professional opt-out denial; design task only, not deployed feature |
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
| LEG-005 | P1 | Blocked | Review actual independent-project classification/category model for Korvo 1.0; employee staffing/joint-employer research is deferred to potential 2.0. | Yes for research support | D6 qualified project review; D8/D9 only for future staffing | None; D8/D9 qualified arrangement review is the owner gate | E23: Employment cannot be relabeled as a gig; staffing deferral does not clear independent project classification. |
| LEG-006 | P2 | Blocked | Future Korvo 2.0 wage/payroll/employment-tax arrangements deferred. No employee staffing operations in Korvo 1.0 beta. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | LEG-005 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |
| LEG-007 | P0 | Needs Verification | Verify platform general liability, workers compensation/employer, cyber/professional and category-specific coverage as applicable. | Yes for requirement inventory, not coverage binding | Owner approves insurance arrangement/budget with qualified broker/legal review | LEG-003, LEG-005 | E14: no verified bound coverage or liability allocation; do not claim protection exists |
| LEG-008 | P2 | Blocked | Hospitality alcohol/minor/employee-shift permissions deferred with potential Korvo 2.0. Applicable project-category eligibility still requires review. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | LEG-005, LEG-007 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |
| LEG-009 | P0 | Needs Verification | Determine applicable tax reporting, W-9/ITIN handling, 1099/payroll reporting and any taxable fees; protect tax data. | Yes for technical design after accountant advice | Owner/accountant confirms obligations and secure collection | LEG-003, LEG-006 | E14/E15: no verified tax/reporting or secure tax-document workflow |
| LEG-010 | P1 | In Progress | Versioned document and immutable client-assent architecture now staged. Finish approved legal/accessibility/content/complaint notices and hosted acceptance before expansion. | Yes for draft/code | D7 final policy approval; A8/A11 | LEG-001, LEG-002 | E22: Version/hash receipts and revocation tested in isolation; no legal text published. |

## 11. Administrative controls and customer support

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| ADM-001 | P0 | Blocked | Designate verified owner account and least-privilege financial/admin/support roles through a controlled grant procedure. | Yes after identity decision | D4; explicit privilege assignment approval | None; D4 and controlled privilege approval required | E05: zero active admins; must not infer owner from editable metadata |
| ADM-002 | P0 | In Progress | Provider-check and explicit full-refund accounting controls are default-off. Finish genuine hosted owner review and operational provider integration. | Yes for staged code | D1/D2/D4; A10 deployment and A8 publication | PAY-006, ADM-001 | E20: 30 browser checks including stable correction retries, absent proof, unconfirmed responses and preserved holds; no money execution. |
| ADM-003 | P0 | In Progress | Private participant/staff support case and reply UI/RPC with idempotency now staged. Finish hosted triage/resolution, staffing, email and operational support acceptance. | Yes for engineering | D7/D4; A8/A11 | ADM-001 | E22: 40 beta SQL and 18 browser checks; support cannot perform financial actions; no staff assigned. |
| ADM-004 | P0 | In Progress | Preserve database financial-role authorization and support denial; finish actual sole-founder account designation/MFA and hosted revocation tests. | Yes for staged code/tests | A10 deployment; A6 legacy financial scope | ADM-001, SEC-005 | E20: 43 reconciliation SQL checks; no service self-approval and no support allocation correction; no roles assigned. |
| ADM-005 | P0 | In Progress | Trusted persistence and attention states staged; scheduling, operator alerts, reserve/aging decisions and hosted monitoring remain. | Yes for disabled tooling | D1/D3/D7 operating policy; activation approval | PAY-004, PAY-007 | E20: Provider unavailable/late/revision cases and current-state queue tested; no hosted scheduler enabled. |
| ADM-006 | P0 | Blocked | Choose monitored support contact, staffing/escalation, critical incident channel and customer/pro response promises. | No for owner promises; yes for implementation | D7 | LEG-001 | E15: no approved monitored channel/SLA; footer text is not support coverage |
| ADM-007 | P0 | Needs Verification | Verify immutable audit trails, limited reason/note access, support vs finance visibility, PII-safe logs and case accountability. | Yes | D4/D7; A6/A10 final deployed matrix | SEC-007, ADM-004 | E10/E11: case/audit prototypes tested, complete hosted operational acceptance pending |
| ADM-008 | P0 | In Progress | Containment now handles evidence-only and full A10 namespaces without dropping data. Qualify durable managed export/restore, Storage/config/role recovery and incident drill. | Yes for plans/tests in isolated environment | A6/A10 recovery qualification | SEC-008, AUTH-002 | E23: 31 composed actual-schema recovery in each scope; 18 representative A10 financial recovery; no managed restore. |
| ADM-009 | P1 | Blocked | Approve scoped cleanup of retained synthetic accounts/jobs/uploads/Stripe fixtures after sign-out and dependency inventory. | Yes after scope approval | A4 destructive cleanup authorization | TRU-008 | E09/E10: fixtures deliberately retained; no deletion authorized |
| ADM-010 | P1 | Not Started | Add basic operator metrics, queue pagination/export and cost/abuse budgets without leaking private data. | Yes for design/code | D7; budget/production activation approval if applicable | ADM-005, LEG-002 | E13: refund prototype queue capped at 100; no complete operational dashboard |

## 12. Automated and manual testing

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TEST-001 | P0 | Complete | Preserve expanded unit/source/policy/checklist CI gate; final pushed commit/run recorded in PR #7 and sprint report. | Yes; completed evidence | None | None | E23: 217 local unit/source checks; staffing deferral and 10+10 constraints verified. |
| TEST-002 | P0 | Complete | Preserve full browser gate and new login/resend, linked simulation and active/default-off accessibility checks. | Yes; completed evidence | None | None | E23: 20 login/confirmation,20 beta,22 payment browser checks; 18 default-off axe views; 12 private mixed UI/SQL checks local only. |
| TEST-003 | P0 | Complete | Retain actual deployed payment/matching/lifecycle regression evidence, without reclassifying SQL snapshots as real charges. | Yes; evidence captured | None | None | E09/E10: 94 payment/matching plus 20 lifecycle rollback checks; dated historical results |
| TEST-004 | P0 | Complete | Retain full 134-check authorization rollback rehearsal and separate unapplied deployment boundary. | Yes; evidence captured | A6 only for future deployment | None | E10: complete updated rehearsal passed; no live security migration applied |
| TEST-005 | P0 | Complete | Preserve isolated actual proposal and composed current-schema recovery gates with separate hosted limits. | Yes; completed this audit | A6/A10/A11 for hosted changes | None | E23: 18 discovery SQL,31 full +31 evidence-only actual-schema and18 financial recovery checks pass; prior suites retained. |
| TEST-006 | P0 | Complete | Preserve full decoder acceptance and add actual local Deno HTTP execution without relabeling it hosted. | Yes; completed evidence | None | None | E19: Six Deno HTTP valid/corrupt checks; existing actual WASM and Sharp gates retained |
| TEST-007 | P0 | In Progress | Finish hosted signup/verify/reset through admitted post/quote/booking/message/simulation/evidence/ack/support journey. Full quote-form UI and actual Auth/Storage remain unverified. Money-release acceptance is a later phase. | Mostly automated | A6/A8/A11 and evidence-only A10 if enabled; M2 after rollout | SEC-005, EVI-003, CUS-003, CUS-010, BETA-006 | E23: 31 actual-schema full +31 evidence-only composition and 12 mixed UI/database checks pass locally; not full production-UI E2E. |
| TEST-008 | P1 | Needs Verification | Run actual mobile/Safari/Firefox/accessibility and slow-network journeys with real approved deployment. | Mostly automated | Owner manual only for device-specific residuals | WEB-005, WEB-006, WEB-002 | E08: Chromium fixture tests do not establish full browser/device coverage |
| TEST-009 | P0 | In Progress | Real simultaneous financial/gig tests retained; beta quota/duplicate/interruption runner added to disposable PostgreSQL CI. Finish managed crash/recovery qualification. | Yes when suitable environment available | Managed recovery approval where needed | Native CI service and reviewed job results; additional crash/deadlock coverage remains | E22: Native 10+10 concurrency runner; final PR CI log provides execution evidence, not this code claim. |
| TEST-010 | P0 | Complete | Validate unique task IDs, statuses, counts, internal dependencies, evidence keys and owner-reference synchronization automatically. | Yes; completed this audit | None | None | E17: new master-checklist validator and regression tests pass; no deployment involved |

## 13. Closed-beta launch readiness

| ID | Priority | Status | Task and specifically what remains | Can engineering complete independently? | Owner decision / manual test / approval | Dependencies | Evidence / layer |
| --- | --- | --- | --- | --- | --- | --- | --- |
| BETA-001 | P0 | Complete | Create one 14-section authoritative master checklist with evidence layers, counts, owner mapping and update rules. | Yes; completed audit document | None | None | E17: docs/KORVO_MASTER_LAUNCH_CHECKLIST.md validated; companion docs point here |
| BETA-002 | P0 | Blocked | Founder selected 20-person invitation-only non-money Atlanta scope. Finish category allowlist, roster/consent, success/stop criteria and explicit invitation/go approval. | No for owner launch scope | D11 plus D6/D7 | LEG-004, LEG-007 | E20: D11 baseline recorded in disabled policy configuration; no invitations or launch activation. |
| BETA-003 | P0 | Blocked | Clear critical authorization findings with verified deployed fixes and reviewed operational rollback. | Yes after approval | A6 | SEC-003, SEC-005 | E03/E05: staged hardening is not deployed protection |
| BETA-004 | P0 | Blocked | Clear integrated payment/Connect/evidence/refund/release safeguards before any money-handling beta. | Yes for engineering after gates | D1–D4; A7/A10/A1 as applicable | PAY-005, PAY-006, PAY-007, EVI-004 | E05/E06: no complete mapped onboarding; no enabled transfer executor |
| BETA-005 | P0 | Blocked | Publish approved terms/privacy/support/eligibility claims and tested frontend; verify served version and recovery flow. | Yes after approvals | D6/D7; A8 | WEB-002, WEB-008, CUS-003, LEG-001, LEG-002 | E07/E13: blank recovery, missing policies, static verified claims |
| BETA-006 | P0 | In Progress | Preserve disabled 10+10 admission/current assent and repair legacy discovery/notification routes. Finish approved configuration, complete hosted UI/consent/support and explicit invitations approval. | Yes for implementation | D6/D7/D11; A6/A8/A11 and applicable A10 | TRU-008, BETA-002 | E23: 31 full +31 minimal SQL, 12 mixed UI/database, 18 discovery SQL; no invitations. |
| BETA-007 | P0 | Needs Verification | Prove non-money support/error/incident monitoring and recovery with named operators. Real-money reserve/aging monitoring remains a later financial gate. | Yes for drills/tooling | D7/D11 operational ownership | ADM-006, ADM-008 | E23: Populated local containment rehearsals pass; managed restore/operational staffing not qualified. |
| BETA-008 | P0 | Blocked | Perform first NON-MONEY cohort go/no-go after security, Auth, legal/support, recovery and hosted journey pass; record exact release/settings. Later money release additionally requires BETA-004. | No for owner go decision; yes for evidence preparation | D11 explicit invitations/go; A6/A8/A11 and evidence-only A10 as applicable | BETA-003, BETA-005, BETA-007, TEST-007 | E23: No-go: no invitations or rollout approved; Connect/refund/transfer gates excluded from simulated cohort. |
| BETA-009 | P1 | Not Started | Review actual beta incidents, completion/refund/support outcomes and cohort metrics against agreed stop/expand thresholds. | Yes after beta starts | D11 thresholds | BETA-008 | E13: no controlled cohort operating evidence to review yet |
| BETA-010 | P2 | Blocked | Preserve disabled employee/hospitality staffing features as potential Korvo 2.0 research. They are not a first non-money beta clearance dependency. | Preserve archived code/research; no new beta staffing development | Future D8–D10/A9 expansion only; not required now | GIG-002, GIG-009, LEG-008 | E23: Founder expressly deferred employee staffing; prior evidence/status retained. |

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
| E18 | docs/SPRINT_REPORT_2026-10-15_EXECUTION.md; docs/A6_SECURITY_DEPLOYMENT_APPROVAL.md; docs/COMPLETION_EVIDENCE_ROLLOUT.md; current tests | Local security inverse, staged evidence/finance interfaces, read-only ownership/reconciliation; no deployment or hosted/concurrent proof |
| E19 | docs/SPRINT_REPORT_2026-10-15_LAUNCH_BLOCKERS.md; docs/LAUNCH_RELEASE_MANIFEST.json; A6/A10/A8 packages; current tests | Current-schema isolated inverse/134 matrix, disabled financial ledger, real read-only provider reconciliation, local Deno HTTP and native CI scope; no deployment |
| E20 | October 16 development integration and approved founder-policy alignment | SPRINT_REPORT_2026-10-16_DEVELOPMENT.md; FOUNDER_POLICY_BASELINE.md; local suites and PR #7 CI boundaries. No A6/A8/A10 deployment. |
| E21 | October 16 A6 populated recovery qualification | A6_MANAGED_RECOVERY_QUALIFICATION.md; A6_OBJECT_INVENTORY.json; A6_QUALIFICATION_EVIDENCE.json. Verdict STILL BLOCKED; no managed DDL/restore. |
| E22 | October 16 remaining readiness implementation | SPRINT_REPORT_2026-10-16_READINESS.md; A6_MANAGED_CANDIDATE_EVIDENCE.json; NON_MONEY_BETA_APPROVAL.md; release manifest; final PR #7 CI logs. Local/CI layers remain distinct from deployment. |
| E23 | October 17 UTC founder closed-beta focus | SPRINT_REPORT_2026-10-17_CLOSED_BETA.md; CLOSED_BETA_MINIMUM_GATES.md; KORVO_2_0_STAFFING_ARCHIVE.md; final draft PR #7 CI logs. Actual-schema and mixed UI/database tests are isolated/local, not hosted. |

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

## Execution sprint status history — October 15

No task IDs added or removed. Same-status rows record real implementation/test advances.
Only the narrowly scoped EVI-009 engineering design task became Complete; A10 remains.

| Task | Previous status | New status | Work / evidence / testing layer | Remaining dependencies |
| --- | --- | --- | --- | --- |
| `PRO-004` | Needs Verification | Needs Verification | E18: Mapped account ownership metadata now verified; completed hosted onboarding and complete-state synchronization remain unverified. | See task row; all deployment/owner gates preserved |
| `GIG-007` | Needs Verification | Blocked | E18: Native multi-session PostgreSQL cannot run under this container UID mapping. Run true overlap/capacity/abort/deadlock tests in a suitable isolated environment. | See task row; all deployment/owner gates preserved |
| `PAY-004` | In Progress | In Progress | E18: Read-only reconciliation inventory implemented; one existing sandbox refund lacks component allocation. Finish approved allocation reconciliation, durable retry recovery and provider monitoring. | See task row; all deployment/owner gates preserved |
| `PAY-005` | Needs Verification | Needs Verification | E18: Verify completed setup/refresh for a correctly owned mapped account; no substitution of unrelated ready accounts or arbitrary reassignment. | See task row; all deployment/owner gates preserved |
| `PAY-006` | In Progress | In Progress | E18: Owner/admin-only refund-review UI and durable request keys now tested; provider refund execution/reconciliation still unimplemented and policy-gated. | See task row; all deployment/owner gates preserved |
| `SEC-003` | In Progress | In Progress | E18: Recovery generator now captures and restores functions/ACLs/policies/triggers/defaults with drift guards; finish full current-Supabase inverse rehearsal and durable predeploy snapshot. | See task row; all deployment/owner gates preserved |
| `SEC-007` | Needs Verification | In Progress | E18: Current scoped catalog/RPC grants inventoried; finish full negative authorization and post-approved-rollout matrix. | See task row; all deployment/owner gates preserved |
| `SEC-008` | Needs Verification | In Progress | E18: Protected catalog snapshot and pinned/integrity-checked decoder dependencies added; complete historical/log/rotation/provider-scope audit. | See task row; all deployment/owner gates preserved |
| `SEC-010` | In Progress | In Progress | E18: Private completion enrollment/storage/attestation controls and UI implemented/tested locally; finish hosted Storage/Edge limits/retention checks and A10 rollout. | See task row; all deployment/owner gates preserved |
| `EVI-001` | In Progress | In Progress | E18: Reservation/validation/customer acknowledgment wired to dashboard preflight and server guards; finish actual hosted JWT/Storage acceptance. | See task row; all deployment/owner gates preserved |
| `EVI-002` | In Progress | In Progress | E18: Secure Edge handler, pinned full JPEG/PNG/WebP WASM adapter and integrity check implemented; qualify cold-start/dependency/resource behavior on hosted Edge before A10. | See task row; all deployment/owner gates preserved |
| `EVI-003` | Not Started | In Progress | E18: Pro upload/retry/abandon and customer private viewing/acknowledgment integrated in actual dashboard source, default-off; hosted integration and rollout remain. | See task row; all deployment/owner gates preserved |
| `EVI-004` | In Progress | In Progress | E18: Customer acknowledgment and new-job photo gates now enforced in proposed SQL and dashboard flow; trusted release-service fact integration remains. | See task row; all deployment/owner gates preserved |
| `EVI-009` | Not Started | Complete | E18: Existing-job cohort rollout design implemented and tested: no backfill; new active jobs enroll; legacy completion preserved. Execution still requires separate A10 approval and UI-first rollout. | See task row; all deployment/owner gates preserved |
| `ADM-002` | In Progress | In Progress | E18: Development refund-review page now checks server financial access and supports request/information/recommend/reject; finish hosted roles and approved operational integration. | See task row; all deployment/owner gates preserved |
| `ADM-004` | In Progress | In Progress | E18: Preserved owner/admin role restriction and support request/read/recommend denials; verify exact hosted role/session matrix after approved deployment. | See task row; all deployment/owner gates preserved |
| `ADM-005` | Not Started | In Progress | E18: Read-only payment reconciliation/aging inventory and operator triage added; scheduling, alerts, provider reconciliation and reserve policy remain. | See task row; all deployment/owner gates preserved |
| `TEST-001` | Complete | Complete | E18: Current unit/source suite passes 135 checks including 9 new evidence endpoint security cases; preserve impacted regression gate. | See task row; all deployment/owner gates preserved |
| `TEST-002` | Complete | Complete | E18: Current Chromium fixture coverage includes 194 checks across original and new photo/refund suites; no hosted end-to-end claim. | See task row; all deployment/owner gates preserved |
| `TEST-005` | Complete | Complete | E18: Expanded actual evidence/refund proposal SQL rehearsal now covers 100 isolated assertions, including new versus legacy rollout; hosted Auth/Storage remains separate. | See task row; all deployment/owner gates preserved |
| `TEST-006` | Complete | Complete | E18: Original 7 Sharp checks preserved; identical production WASM adapter adds 6 JPEG/PNG/WebP decode/corruption checks. | See task row; all deployment/owner gates preserved |
| `TEST-009` | Not Started | Blocked | E18: Actual multi-session scheduling/refund/lock/crash tests require an accessible isolated native PostgreSQL environment; local single-session and resource checks continue. | See task row; all deployment/owner gates preserved |

## Launch blocker elimination status history — October 15

All results below are development/isolated or read-only provider results. CI-native
results are recorded after job review in the sprint report; no hosted rollout is implied.

| Task | Previous status | New status | Work, evidence and testing layer | Remaining dependencies |
| --- | --- | --- | --- | --- |
| `SEC-003` | In Progress | In Progress | E19: Current-schema empty-clone inverse and data/privilege preservation pass. Finish managed Supabase constraints, fresh durable backup and final predeploy qualification. Evidence/layer: 13 current-schema assertions plus 134 authorization checks; all seven packages and exact inverse; no hosted DDL. | Existing task-row owner/deployment gates; no approval inferred |
| `SEC-004` | Complete | Complete | E19: Preserve current seven-package byte-equivalence and current-schema authorization regression; rerun on scope/schema change or rollout. Evidence/layer: Current 134-check matrix passed on actual catalog definitions in isolated clone; historical hosted rollback remains separate. | Existing task-row owner/deployment gates; no approval inferred |
| `SEC-007` | In Progress | In Progress | E19: Current customer/pro/support/admin/anonymous matrix passes in current-schema clone. Finish actual managed JWT/session and post-approved-deployment authorization checks. Evidence/layer: 134 isolated current-schema checks; actual live hardening remains unapplied. | Existing task-row owner/deployment gates; no approval inferred |
| `SEC-008` | In Progress | In Progress | E19: Portable private catalog capture and pinned dependencies verified. Finish broader historical/log/rotation/provider-scope audit and managed backup process. Evidence/layer: Fixed role-OID-dependent fingerprints; protected snapshot contains no account rows; outgoing source/history scan required. | Existing task-row owner/deployment gates; no approval inferred |
| `SEC-010` | In Progress | In Progress | E19: Local Deno HTTP/actual decoder and private-photo SQL pass. Finish hosted Storage/signed URLs/JWT/runtime limits and populated-data rollback before A10. Evidence/layer: Six Deno HTTP actual WASM cases; 100 isolated photo/refund SQL; no hosted photo endpoint. | Existing task-row owner/deployment gates; no approval inferred |
| `EVI-002` | In Progress | In Progress | E19: Trusted Edge decoder executes through local Deno HTTP for valid/corrupt formats. Qualify actual Supabase Edge cold-start/resources/CDN and hosted private uploads. Evidence/layer: Six Deno HTTP cases plus existing decoder suites; exact A10 manifest; hosted runtime not claimed. | Existing task-row owner/deployment gates; no approval inferred |
| `PAY-004` | In Progress | In Progress | E19: Read-only provider reconciliation proves full legacy refund aggregate. Prepare auditable database component correction, trusted persistence and scheduled monitoring; partial allocations stay policy-gated. Evidence/layer: Actual sandbox GET: two succeeded refunds total $112; final gross/fee $100/$12 proven; counters unchanged; 27 reconciliation unit tests. | Existing task-row owner/deployment gates; no approval inferred |
| `PAY-006` | In Progress | In Progress | E19: Durable reviewed refund reservation, receipt deduplication and admin interface tested. Finish trusted provider integration, auditable corrections and approved refund execution. Evidence/layer: 36 isolated ledger checks, 16 admin browser cases; no provider write API or automatic refund. | Existing task-row owner/deployment gates; no approval inferred |
| `PAY-007` | In Progress | In Progress | E19: Ledger types and stable-operation/receipt accounting staged. Transfer/reversal creation, executor, release eligibility integration, reserves and ambiguous transfer reconciliation remain absent. Evidence/layer: Disabled ledger schema supports kinds without transfer API; no transfer attempted or authorized. | Existing task-row owner/deployment gates; no approval inferred |
| `ADM-002` | In Progress | In Progress | E19: Owner/admin UI now reserves recommended refunds in a nonexecuting ledger and displays attention queue. Finish approved operational/provider integration and hosted permissions. Evidence/layer: 16 browser cases including confirmed reservation, failed queue/save and duplicate suppression; default-off. | Existing task-row owner/deployment gates; no approval inferred |
| `ADM-004` | In Progress | In Progress | E19: Preserve database owner/admin financial authorization and support denial in ledger/review APIs; finish hosted session/MFA/operator role verification. Evidence/layer: 36 isolated SQL checks plus current-schema 134-role matrix; zero active hosted admins. | Existing task-row owner/deployment gates; no approval inferred |
| `ADM-005` | In Progress | In Progress | E19: Stuck/ambiguous operation queue and read-only provider reconciliation implemented. Connect trusted persistence, scheduling, operator alerts and approved reserves/aging policy. Evidence/layer: 24-hour attention states tested; unknown outcomes never permit provider retry; holds unchanged. | Existing task-row owner/deployment gates; no approval inferred |
| `WEB-003` | Not Started | In Progress | E19: Five dead navigation targets corrected in development. Finish five support/contact and four profile routes plus approved working policy documents/assent. Evidence/layer: Offline audit of 16 pages: nine missing links and 17 placeholders; no invented legal copy. | Existing task-row owner/deployment gates; no approval inferred |
| `WEB-004` | Needs Verification | In Progress | E19: Offline linked-route/asset inventory generated. Finish remaining routes, base-path and final deployed error/navigation verification. Evidence/layer: FRONTEND_RELEASE_AUDIT.json; six Chromium home/profile mobile/tablet/desktop views; no horizontal overflow. | Existing task-row owner/deployment gates; no approval inferred |
| `WEB-008` | Blocked | In Progress | E19: Removed unsupported static verification/background/insurance/online badges and labeled directory/profile data illustrative. Finish approved trust copy and live A8 publication verification. Evidence/layer: index/browse/sample profile staged; A8 exact asset manifest; no website publication. | Existing task-row owner/deployment gates; no approval inferred |
| `PRO-004` | Needs Verification | Needs Verification | E19: Both current mapped account owner metadata values match, but both remain incomplete. Finish actual hosted onboarding and complete/restricted refresh/webhook acceptance. Evidence/layer: Fresh provider GET and database mapping match; payouts false/transfers inactive; two unrelated ready accounts remain unmapped. | Existing task-row owner/deployment gates; no approval inferred |
| `PAY-005` | Needs Verification | Needs Verification | E19: Finish hosted complete-state onboarding/refresh for the correctly mapped professional; no account substitution. Evidence/layer: Fresh read-only ownership match for both mappings; M1 still open; no new link/session manufactured. | Existing task-row owner/deployment gates; no approval inferred |
| `TEST-009` | Blocked | In Progress | E19: Disposable native PostgreSQL CI passes overlapping financial locks/duplicate receipts and gig capacity/worker overlap/abort tests. Broader crash/deadlock/recovery cases and hosted acceptance remain. Evidence/layer: 17 native CI checks passed at db28fb6: 10 financial + 7 gig; activity confirms genuinely blocked overlapping sessions; not hosted Supabase. | Existing task-row owner/deployment gates; no approval inferred |
| `GIG-007` | Blocked | In Progress | E19: Real native CI capacity/worker overlap and transaction rollback tests pass. Expand crash/deadlock/application concurrency coverage and later hosted authenticated endpoints. Evidence/layer: Seven native gig checks passed at db28fb6; no hosted booking or payment setting changes. | Existing task-row owner/deployment gates; no approval inferred |
| `TEST-001` | Complete | Complete | E19: Preserve expanded unit/source/document checks, including reconciliation and portable security fingerprints. Evidence/layer: New reconciliation and fingerprint checks pass locally; final full CI gate in sprint report. | Existing task-row owner/deployment gates; no approval inferred |
| `TEST-002` | Complete | Complete | E19: Preserve browser regression gate; impacted admin/workflow and static mobile rendering verified. Evidence/layer: 16 admin + 39 workflow checks and six home/profile views locally; full CI separate. | Existing task-row owner/deployment gates; no approval inferred |
| `TEST-005` | Complete | Complete | E19: Preserve isolated actual proposal SQL coverage; ledger and current-schema inverse now covered. Evidence/layer: 100 evidence/refund, 36 ledger and current-schema 13 + 134 matrix; hosted Auth/Storage remains separate. | Existing task-row owner/deployment gates; no approval inferred |
| `TEST-006` | Complete | Complete | E19: Preserve full decoder acceptance and add actual local Deno HTTP execution without relabeling it hosted. Evidence/layer: Six Deno HTTP valid/corrupt checks; existing actual WASM and Sharp gates retained. | Existing task-row owner/deployment gates; no approval inferred |

Native CI evidence correction: run 38778541325/job 116572400438 verifies TEST-009
and GIG-007 advance with 10 finance + 7 gig real multi-session assertions. Initial
observer snapshot caching was fixed; successful logs prove blocked overlap. These
rows remain In Progress because crash/deadlock/hosted endpoint coverage is broader.

## October 16 development integration evidence history

All 144 task IDs and prior evidence retained. No additional full launch task Complete.
D1–D12 directions are approved product specifications; operational residuals and
deployment approvals remain. Current source publication/CI evidence is in the sprint
report; local passing tests are not hosted acceptance.

| Task | Previous status | New status | Work / evidence / layer | Remaining dependencies |
| --- | --- | --- | --- | --- |
| `WEB-003` | In Progress | In Progress | 18-page offline audit: zero missing/empty linked targets; no publication. | Remaining: Nine remaining contact/profile references now resolve in development. Finish 17 policy/demo placeholders, approved documents and durable versioned assent. |
| `WEB-004` | In Progress | In Progress | 18 pages; zero missing/empty links; authenticated own-profile route tested. | Remaining: Preserve route inventory; finish base-path, final deployed navigation and error verification after A8. |
| `WEB-006` | Needs Verification | In Progress | 14 Chromium desktop/mobile views pass axe WCAG A/AA with zero violations; default-off/unauthenticated states only. | Remaining: Extend automated accessibility to active authenticated workflows; complete keyboard/focus/screen-reader and real-device review. |
| `WEB-008` | In Progress | In Progress | Removed background-verification offer; own-profile navigation replaces misleading public link; no certification claims added. | Remaining: Preserve truthful examples and remove remaining unsubstantiated claims; obtain final category/badge copy and A8 served-version verification. |
| `PRO-006` | Needs Verification | In Progress | 10 browser checks cover ownership, role/standing, signout, XSS and 375/768/1280 widths; fixtures only. | Remaining: Own-account read-only profile now implemented. Editing, availability, gallery and truthful public previews still need implementation/acceptance. |
| `PRO-007` | In Progress | In Progress | Ten isolated checks exercise unchanged A6 restoration SQL, support denial, once-only mutation and original audit preservation. | Remaining: Preserve confirmed memberships and manual once-only restoration. Finish Billing lifecycle and hosted operator restoration acceptance. |
| `PAY-004` | In Progress | In Progress | 43 isolated reconciliation SQL and targeted handler/observer tests; $112 full-refund split $100/$12 proven; $560 review hold retained. | Remaining: GET-only trusted observation/persistence and audited full-refund correction implemented. Finish deployment, hosted acceptance, cost ingestion and scheduled alerts; actual correction remains unapplied. |
| `PAY-006` | In Progress | In Progress | 30 admin browser checks; 43 reconciliation SQL; duplicate request receipts and unchanged holds. | Remaining: Finish hosted permissions, operational refund review and separately approved execution; staged component correction never issues a provider refund. |
| `PAY-007` | In Progress | In Progress | 29 release tests; evidence facts replace client claims; execution always false; native additions await CI. | Remaining: Trusted evidence eligibility integration staged, including immediate verified founder eligibility. Finish reserves/aging/provider settlement, executor design and separately approved transfers. |
| `PAY-009` | Blocked | Blocked | Tested processing allocation preserves full gross even when Korvo margin is negative; no automatic refunds or extra customer fee. | Remaining: D1 payer resolved: Korvo absorbs costs. Manual review/full pro-cancellation refund direction recorded. Finish remaining partial/cancellation/remedy details, reserves and receipts. |
| `SEC-007` | In Progress | In Progress | 14 managed read-only negative checks from integration checkpoint; zero user writes; no positive-role-session proof. | Remaining: Retain isolated matrix and managed negative subset; finish genuine customer/pro/support/owner JWT sessions and post-A6 deployment verification. |
| `SEC-008` | In Progress | In Progress | Supabase SDK pinned 2.117.3; no provider captures or account data added; publication scan recorded in current sprint report. | Remaining: Pinned frontend SDK and private snapshot handling retained. Complete outgoing history/privacy checks, provider scopes and durable managed backup process. |
| `SEC-010` | In Progress | In Progress | 106 isolated evidence/refund SQL, 16 component and six stale-photo browser checks; local Deno/WASM remains separate. | Remaining: Finish actual hosted private Storage/signed URLs/JWT/Edge resource qualification and populated rollback before A10. |
| `EVI-003` | In Progress | In Progress | Six delayed-image browser race checks and 16 component checks pass; no hosted upload claimed. | Remaining: Photo refresh/race/timeout handling and both dashboard integrations staged. Finish hosted uploads, private URLs, retries and acknowledgment after A8/A10. |
| `EVI-004` | In Progress | In Progress | 29 release tests and 106 evidence/refund SQL; uploaded image alone never releases funds. | Remaining: Service-only evidence facts now integrated into nonexecuting release evaluator. Finish hosted customer acknowledgment and approved financial operational gates. |
| `ADM-002` | In Progress | In Progress | 30 browser checks including stable correction retries, absent proof, unconfirmed responses and preserved holds; no money execution. | Remaining: Provider-check and explicit full-refund accounting controls are default-off. Finish genuine hosted owner review and operational provider integration. |
| `ADM-004` | In Progress | In Progress | 43 reconciliation SQL checks; no service self-approval and no support allocation correction; no roles assigned. | Remaining: Preserve database financial-role authorization and support denial; finish actual sole-founder account designation/MFA and hosted revocation tests. |
| `ADM-005` | In Progress | In Progress | Provider unavailable/late/revision cases and current-state queue tested; no hosted scheduler enabled. | Remaining: Trusted persistence and attention states staged; scheduling, operator alerts, reserve/aging decisions and hosted monitoring remain. |
| `TEST-001` | Complete | Complete | 210 local unit/source/document tests pass; new founder policy, observer, handler and release coverage included. | Remaining: Preserve expanded unit/source regression gate; run final CI at the published development commit. |
| `TEST-002` | Complete | Complete | 30 admin, 10 own-profile, six race and 16 evidence browser checks; 14 axe views; local fixtures. | Remaining: Preserve browser gate; latest accounting UI now tested; final complete CI remains a publication checkpoint. |
| `TEST-005` | Complete | Complete | 43 reconciliation, 106 evidence/refund, 36 ledger, ten membership and 11 recovery assertions pass locally. | Remaining: Preserve actual isolated proposal SQL coverage and unchanged A6 membership regression; hosted boundaries remain separate. |
| `TEST-009` | In Progress | In Progress | Prior 17 native checks retained; new overlapping eight-writer observation/correction cases implemented; result in current sprint report. | Remaining: Verify new native reconciliation and accounting concurrency additions in disposable CI; broader crash/deadlock and hosted recovery remain. |
| `BETA-002` | Blocked | Blocked | D11 baseline recorded in disabled policy configuration; no invitations or launch activation. | Remaining: Founder selected 20-person invitation-only non-money Atlanta scope. Finish category allowlist, roster/consent, success/stop criteria and explicit invitation/go approval. |

## October 16 A6 populated recovery evidence history

Seven existing IDs advanced; zero new tasks Complete. Current Storage-owner and backup
blockers are explicit; all D1–D12 and prior evidence retained.

| Task | Previous status | New status | Work / evidence / layer | Remaining dependencies |
| --- | --- | --- | --- | --- |
| `SEC-003` | In Progress | Blocked | 44 populated assertions plus 134-role matrix; 144 retained initial rows/25 tables and committed post-migration activity preserved. No managed restore. | Populated isolated backup/inverse now qualified. Managed Storage ownership, actual backup availability, durable protected backup and managed recovery method block final A6 qualification. |
| `SEC-004` | Complete | Complete | Exact inventory: 464 statements; 103 definitions, 43 function alterations, 46 policies, three triggers; populated 134-check matrix passes. | Preserve unchanged seven-package/canonical byte-equivalence and current-schema positive/negative regression. Managed execution is separately blocked. |
| `SEC-005` | Blocked | Blocked | Read-only actual postgres non-superuser/no Storage owner membership; isolated rollout and inverse reproduce 42501. No hosted DDL. | Resolve owner-capable managed Storage policy execution/recovery and backup prerequisites before exact A6 authorization; then verify deployed matrix/advisors. |
| `SEC-007` | In Progress | In Progress | 44 isolated recovery/auth assertions plus 134 matrix; owner metadata forgery and unrelated pair reads/messages denied. No hosted fixtures copied. | Populated retained customer/pro/support/owner isolation now verified in actual-schema clone. Genuine positive hosted JWT/session acceptance remains. |
| `SEC-008` | In Progress | In Progress | 12 recovery/writer checks; unchanged Storage objects untouched; archive_mode on does not prove backups or PITR. | Changed-object-only inverse avoids unnecessary managed ownership requirements. Finish actual backup entitlement/durable snapshot, other-role scope and managed restore qualification. |
| `TEST-001` | Complete | Complete | 213 local checks pass; new exact A6 object/hash, Storage-blocker and read-only-preflight checks; CI in PR #7. | Preserve expanded inventory/preflight/source-security unit gate; retain separate published CI evidence. |
| `TEST-005` | Complete | Complete | 44 populated + 134 matrix, 12 recovery/writer and refreshed empty current-schema 13 + 134 pass locally. Unrelated suites reused. | Preserve populated actual-schema recovery, full matrix and isolated backup coverage; managed service/restore remains unverified. |

## October 16 remaining-readiness evidence history

Zero new tasks Complete. Five existing items move into In Progress; ten other IDs
receive specific evidence updates. All 144 stable IDs and earlier evidence remain.
No managed deployment, real money or invitations occurred.

| Task | Previous status | New status | Work / evidence / layer | Remaining dependencies |
| --- | --- | --- | --- | --- |
| `CUS-001` | Needs Verification | In Progress | Six local signup/Auth browser checks; no email sent. | New-account 12-character and duplicate-in-flight guards tested. Finish genuine hosted signup, email confirmation, duplicate-email and landing acceptance after A8. |
| `CUS-010` | Needs Verification | In Progress | 40 SQL and 18 beta browser checks; approved document registry is empty. | Durable version/hash-bound current role-specific assent and explicit UI are staged. Approve real documents and verify hosted signup/posting/assignment enforcement; no receipt claimed from an unchecked box. |
| `LEG-010` | Not Started | In Progress | Version/hash receipts and revocation tested in isolation; no legal text published. | Versioned document and immutable client-assent architecture now staged. Finish approved legal/accessibility/content/complaint notices and hosted acceptance before expansion. |
| `ADM-008` | Not Started | In Progress | 50 actual-schema A6 assertions plus 134 matrix; 18 representative A10 recovery checks; no managed restore. | Backup/inverse and populated evidence-finance containment/recovery rehearsed. Finish durable protected export, managed recovery, Storage byte/config/role-secret inventory and incident acceptance. |
| `BETA-006` | Not Started | In Progress | 40 isolated SQL, six actual-schema compile/rollback and 18 beta browser checks; no invitations. | Default-off 10+10 admission, current assent, allowlist discovery/assignment, simulation and private support staged. Finish roster/consent, real hosted onboarding, feedback operations and invitation approval. |
| `SEC-003` | Blocked | Blocked | Free plan confirmed read-only; 50 populated +134 matrix; original scope preserved. | Alternate seven-package A6 scope/inverse passes populated non-superuser model without Storage policy changes. Protected durable backup and qualified managed recovery remain required. |
| `SEC-005` | Blocked | Blocked | Storage ownership requirement removed from alternate only; six retained Storage access tests pass; no hosted DDL. | Review exact 462-statement alternate retaining original Storage expressions. Qualify managed recovery before A6; then genuine deployed role/advisor acceptance. |
| `SEC-007` | In Progress | In Progress | 50 populated +134 matrix; six current-schema beta checks; no hosted positive-role matrix. | Populated positive/negative participant/support/owner matrix and retained Storage policies pass. Finish genuine hosted role JWT/session acceptance after approved rollout. |
| `SEC-010` | In Progress | In Progress | 18 representative populated A10 checks; Storage bytes not backed up; no new hosted upload. | Populated evidence containment/recovery preserves uploads/acks/holds. Finish managed recovery and actual hosted private Storage/Edge/JWT/signed-URL/resource acceptance after A10. |
| `ADM-003` | In Progress | In Progress | 40 beta SQL and 18 browser checks; support cannot perform financial actions; no staff assigned. | Private participant/staff support case and reply UI/RPC with idempotency now staged. Finish hosted triage/resolution, staffing, email and operational support acceptance. |
| `WEB-006` | In Progress | In Progress | 16 Chromium views zero axe WCAG A/AA violations; real devices not claimed. | 16 default-off desktop/mobile axe views pass; finish active forms, keyboard/focus/screen-reader and actual device journeys. |
| `PAY-004` | In Progress | In Progress | 18 A10 checks preserve audits/holds; $112 component split unapplied, $560 held review unchanged. | Keep provider discrepancies held and original allocations immutable. Recovery preserves review/ledger/reconciliation records; hosted provider/accounting acceptance and approved corrections remain. |
| `TEST-001` | Complete | Complete | 216 local unit/source checks pass; final CI is a distinct verification layer. | Preserve expanded unit/source/document gate; final commit CI result is linked from PR #7 and current sprint report. |
| `TEST-005` | Complete | Complete | 50+134 A6, 18 A10, 40 beta SQL and six current-schema beta checks pass locally. | Preserve populated current-schema and representative A10/beta SQL regression gates; retain managed acceptance as separate work. |
| `TEST-009` | In Progress | In Progress | Native 10+10 concurrency runner; final PR CI log provides execution evidence, not this code claim. | Real simultaneous financial/gig tests retained; beta quota/duplicate/interruption runner added to disposable PostgreSQL CI. Finish managed crash/recovery qualification. |

## October 17 UTC closed-beta focus evidence history

Zero new Complete tasks. Four Needs Verification items move to In Progress: WEB-005,
AUTH-002, JOB-006, TEST-007. Employee staffing is future P2 scope; LEG-005 retains P1
independent-project classification review. All 144 IDs/history remain. BETA-008/TEST-007
now use NON-MONEY dependencies; BETA-004 and staffing are later phases, not beta blockers.

| Task | Previous status | New status | Work / layer | Remaining dependencies |
| --- | --- | --- | --- | --- |
| `WEB-005` | Needs Verification | In Progress | 12 current-schema mixed browser/database checks; 18 default-off axe views plus two active beta views; no physical-device claim. | Mixed mobile page/database integration now passes at 375px. Finish full iOS/Android journeys, orientation/keyboards/file pickers and physical/assistive behavior. |
| `AUTH-002` | Needs Verification | In Progress | 20 login/resend fixtures and synthetic session-row-bound composed journey; no hosted Auth mutation. | Inactive-profile login now clears local session; actual session-bound actor exercised in isolated integration. Finish site-wide expiry/revocation, stale claims and genuine hosted sessions. |
| `TEST-007` | Needs Verification | In Progress | 31 actual-schema full +31 evidence-only composition and 12 mixed UI/database checks pass locally; not full production-UI E2E. | Finish hosted signup/verify/reset through admitted post/quote/booking/message/simulation/evidence/ack/support journey. Full quote-form UI and actual Auth/Storage remain unverified. Money-release acceptance is a later phase. |
| `JOB-006` | Needs Verification | In Progress | 18 discovery SQL checks; retained outside-cohort notifications hidden and new matches suppressed; no hosted delivery change. | Legacy discovery/notification bypass now guarded; finish hosted notification delivery/read/count/retry acceptance and any approved email promises. |
| `CUS-001` | In Progress | In Progress | 20 login/confirmation fixtures; signup/recovery suites preserved; zero emails sent. | Confirmation-resend page, single-flight login/signup and generic failure handling are staged. Finish actual email/callback/duplicate-email and admitted landing acceptance after A8. |
| `PRO-003` | In Progress | In Progress | Actual-schema outside professional feed bypass reproduced and fixed; 18 representative discovery SQL checks; no hosted fix claimed. | Opportunities and matched notifications now respect admitted cohort/current terms across legacy RPCs. Finish actual professional quote-form/onboarding and hosted acceptance. |
| `JOB-001` | In Progress | In Progress | 12 mixed browser/database checks; INSERT RETURNING policy self-lookup regression found and fixed; durable cross-reload idempotency remains. | Actual posting form persists through composed authorization and returns saved reference. Finish durable request identity across reload/ambiguous timeout and hosted acceptance. |
| `JOB-002` | In Progress | In Progress | 31 current-schema journey +12 mixed page/database checks; no provider payment row created. | Actual browser API quote/acceptance creates booking, conversation and one membership usage. Finish full quote-form UI and genuine hosted customer/pro acceptance. |
| `JOB-004` | In Progress | In Progress | 12 mixed browser/database checks; outsider RPC denied in composed SQL; delayed-response suites retained. | Both actual messaging screens exchange database-persisted messages across synthetic accounts. Finish durable send idempotency/offline recovery and hosted publication. |
| `SEC-006` | In Progress | In Progress | 31 actual-schema plus18 representative discovery SQL; old bypass reproduced before fix; no production permissions changed. | Close staged beta definer-feed, opportunity/notification and project-invitation admission gaps; retain hardened role/verification guards. Finish deployed authorization acceptance. |
| `SEC-007` | In Progress | In Progress | 31 full +31 evidence-only SQL; 12 mixed page/database; prior unchanged 50+134 A6 evidence retained. | Current-schema composed multi-account journey and legacy feed negatives pass. Genuine managed JWT sessions and post-deployment matrix remain. |
| `SEC-010` | In Progress | In Progress | 31 evidence-only actual-schema SQL; service verification fixture and Storage metadata only; no hosted upload. | Evidence-only composed rollout/recovery passes without new finance schemas. Finish managed Storage-owner path, bytes backup, Edge/signed URLs/JWT/resource acceptance. |
| `ADM-008` | In Progress | In Progress | 31 composed actual-schema recovery in each scope; 18 representative A10 financial recovery; no managed restore. | Containment now handles evidence-only and full A10 namespaces without dropping data. Qualify durable managed export/restore, Storage/config/role recovery and incident drill. |
| `BETA-006` | In Progress | In Progress | 31 full +31 minimal SQL, 12 mixed UI/database, 18 discovery SQL; no invitations. | Preserve disabled 10+10 admission/current assent and repair legacy discovery/notification routes. Finish approved configuration, complete hosted UI/consent/support and explicit invitations approval. |
| `BETA-007` | Needs Verification | Needs Verification | Populated local containment rehearsals pass; managed restore/operational staffing not qualified. | Prove non-money support/error/incident monitoring and recovery with named operators. Real-money reserve/aging monitoring remains a later financial gate. |
| `BETA-008` | Blocked | Blocked | No-go: no invitations or rollout approved; Connect/refund/transfer gates excluded from simulated cohort. | Perform first NON-MONEY cohort go/no-go after security, Auth, legal/support, recovery and hosted journey pass; record exact release/settings. Later money release additionally requires BETA-004. |
| `TEST-001` | Complete | Complete | 217 local unit/source checks; staffing deferral and 10+10 constraints verified. | Preserve expanded unit/source/policy/checklist CI gate; final pushed commit/run recorded in PR #7 and sprint report. |
| `TEST-002` | Complete | Complete | 20 login/confirmation,20 beta,22 payment browser checks; 18 default-off axe views; 12 private mixed UI/SQL checks local only. | Preserve full browser gate and new login/resend, linked simulation and active/default-off accessibility checks. |
| `TEST-005` | Complete | Complete | 18 discovery SQL,31 full +31 evidence-only actual-schema and18 financial recovery checks pass; prior suites retained. | Preserve isolated actual proposal and composed current-schema recovery gates with separate hosted limits. |
| `GIG-002` | Blocked / P0 | Blocked / P2 | Founder staffing deferral; no code deletion or completion claim. | Future Korvo 2.0 employee/staffing classification arrangement; not a first-beta decision. Independent-project category review remains LEG-004. |
| `GIG-004` | In Progress / P1 | In Progress / P2 | Founder staffing deferral; no code deletion or completion claim. | Employee-shift posting/drafts/scheduling deferred to potential Korvo 2.0; preserve existing research. Qualifying independent gigs need separate future scope. |
| `GIG-008` | In Progress / P0 | In Progress / P2 | Founder staffing deferral; no code deletion or completion claim. | Employee attendance/payable-hours/corrections research deferred to potential Korvo 2.0. Preserve existing disabled kernels; no beta staffing work. |
| `GIG-009` | Blocked / P0 | Blocked / P2 | Founder staffing deferral; no code deletion or completion claim. | Employee payroll/overtime/tips/withholding/staffing invoice and wage distribution deferred to potential Korvo 2.0; no contractor Connect routing. |
| `LEG-006` | Blocked / P0 | Blocked / P2 | Founder staffing deferral; no code deletion or completion claim. | Future Korvo 2.0 wage/payroll/employment-tax arrangements deferred. No employee staffing operations in Korvo 1.0 beta. |
| `LEG-008` | Blocked / P0 | Blocked / P2 | Founder staffing deferral; no code deletion or completion claim. | Hospitality alcohol/minor/employee-shift permissions deferred with potential Korvo 2.0. Applicable project-category eligibility still requires review. |
| `BETA-010` | Blocked / P0 | Blocked / P2 | Founder staffing deferral; no code deletion or completion claim. | Preserve disabled employee/hospitality staffing features as potential Korvo 2.0 research. They are not a first non-money beta clearance dependency. |

| `LEG-005` | Blocked / P0 | Blocked / P1 | Founder defers staffing while independent-project classification review remains applicable. | D6/LEG-004 qualified project review; D8/D9 only future staffing. |
