# Korvo 1.0 — October 13 development sprint

## Outcome

The existing project payment model is preserved. A disabled foundation now supports
hourly/fixed compensation, multiple workers, scheduling, business/worker profile
storage and shift state transitions. It is **not a deployed shift marketplace**.
The updated full authorization proposal passed its 134-check rollback rehearsal.
No live payments, contractor transfers, payroll, public hospitality booking, production
merge, new Edge deployment or persistent database migration occurred this sprint.

## Implemented and tested

- Worker gross remains 100%; Korvo adds 12%. $18 × 6h = $108 + $12.96. Two workers
  yield $216 gross + $25.92. Fixed $100/$500/$1,000 agree with existing projects.
- Estimates and server-verified payable-hours reconciliation are separate. Employee
  reconciliation requires reviewed payroll/workweek gross; no single-shift overtime
  assumption or implicit processing/employer-cost payer exists. Tips have no Korvo fee.
- Unreviewed/employee classifications cannot qualify for contractor Connect. All gig
  calculation results and schema payment gates prohibit execution.
- Offset/IANA scheduling covers overnight/DST intervals, availability and overlap.
- Server transition kernel covers applications, withdrawal/rejection, selection,
  confirmation, attendance, cancellation, no-show review, disputes and completion/
  feedback eligibility. Cancellation/no-show does not forfeit wages or tips.
- Backend-only schema proposal has eight RLS-protected tables; duplicate, capacity,
  overlap, reserved-pay/schedule and classification/publication guards.
- Development pricing preview retains hospitality/property/general categories,
  renders names safely, fits mobile and offers no enabled booking/payment actions.
- CI includes the new browser suite and isolated PostgreSQL rehearsal.
- Federal/Georgia compliance sources and unresolved legal/insurance/payroll gates
  recorded; owner list retains confirmed decisions and adds only genuine decisions/
  approvals. No new manual gig test is assigned to Chris.

## Verification

| Environment / check | Result this sprint | Limit |
| --- | --- | --- |
| Unit/source/security/handler suites | **101 passed**, zero failures | Includes 69 existing checks and 32 new gig checks; mocked handlers are not provider completion |
| Existing dashboard/payment/recovery browser suites | **98 passed** | Isolated SDK/API fixtures; not full live hosted checkout |
| Gig browser suite | **17 passed** | Local estimator; widths 375/768/1280; no backend writes |
| Isolated PostgreSQL gig schema | **45 passed** | PGlite roles/RLS/triggers; no real concurrent sessions |
| Deployed project payment database suite | **38 passed** | Transaction rolled back all fixtures |
| Deployed matching/opportunity database suite | **56 passed** | Transaction rolled back all fixtures |
| Updated complete security proposal rehearsal | **134 passed** | Full proposal/fixtures rolled back; authorization changes not deployed |
| Python opt-in integration runners | Compilation passed | Existing genuine sandbox acceptance results belong to October 12 report; not rerun as new charges today |
| Direct Stripe sandbox account inspection | Both mapped accounts incomplete: details false, payouts false, transfers inactive | Hosted completion not verified; no account modified to manufacture success |
| Supabase advisors | Security/performance rerun | Pending findings below; no claim of clean security |

Initial unit invocation lacked the existing `--experimental-transform-types` flag;
it failed on TypeScript parameter properties. Running the repository's documented
command passed; no Edge code change was needed. Browser install retried a broken
CDN archive successfully. The isolated database harness initially attempted to create
an existing public schema; corrected before its 45-check passing run.

## Security and deployment

Current deployed functions remain checkout **v5**, webhook **v5**, Connect **v6**.
Prior genuine sandbox charge/refund/decline/thin-event results remain documented in
`SPRINT_REPORT_2026-10-12.md`; this sprint did not reprocess them or create new users.

Security Advisor: 7 policyless backend tables, 1 anonymous-definer warning,
52 authenticated-definer warnings and leaked-password protection. No ERROR result.
Performance: 33 RLS initplan warnings and 62 unused-index notices; no missing-FK-index
warning. Unused indexes were not blindly removed. Review findings and remediation:
`SUPABASE_SECURITY_AUDIT.md`.

Unapplied proposals:

- `20261012160000_harden_korvo_api_permissions.sql`: explicit owner authorization
  still required; complete updated test checkpoint is now verified.
- `20261013002039_gig_foundation_disabled.sql`: isolated private schema, not in
  automatic migrations, awaiting endpoint/concurrency/category/deployment review.

Development code was published in commit `56abf1cc38ae0703b5b72489b1b7a62c7c00fa1d`,
draft PR https://github.com/korvoadmin/Korvo-1.0/pull/4 . Its source tree matches the
local committed tree. GitHub CI run `38327881536` passed all configured checks.
A follow-up adds four explicit RLS checks (45 isolated checks pass locally) and its
remote CI must be verified separately. Branch remains `codex/sandbox-marketplace-sprint`. Main/Pages
is unchanged. No Supabase migration or Edge Function was deployed this sprint.

## Files

- New shared modules: `gig-pricing.mjs`, `gig-scheduling.mjs`, `gig-workflow.mjs`.
- New preview: `gig-foundation.html`, `gig-foundation.js`.
- New proposal: `supabase/proposals/20261013002039_gig_foundation_disabled.sql`.
- New tests: `gig-foundation.test.mjs`, `gig-workflow.test.mjs`,
  `gig-foundation.browser.cjs`, `gig-database.cjs`.
- New docs: `GIG_PRICING_POLICY.md`, `GIG_MARKETPLACE_FOUNDATION.md`,
  `HOSPITALITY_COMPLIANCE_REVIEW.md`, this report.
- Updated: owner checklist, security audit, beta readiness, project pricing
  specification, test README and GitHub regression workflow.

## Owner dashboard and readiness

| Category | Current state |
| --- | --- |
| Completed | Disabled pricing/workflow/schema/preview; full updated security rehearsal; existing project regressions |
| Decisions | D1–D7 existing processing/refund/release/admin/trade/support decisions; D8 employer model, D9 cleared shift categories/age/insurance, D10 payroll-cost/time/tip arrangement |
| Manual tests | Existing M1 hosted Connect completion; M2 genuine email/recovery after approved publication. No gig pricing/mobile test delegated to owner. |
| Approvals | Existing security migration, production frontend merge, any transfers/live enablement; A9 future gig schema/category/booking activation |
| Technical blockers | Authenticated gig endpoints and notifications, real concurrent scheduling, completion-proof integration, financial operator/refund workflows, durable release/reversal reconciliation, email/configuration acceptance |
| Legal/financial risks | Classification/joint-employment, wages/tips/payroll, insurance, local alcohol/age requirements, unknown cost payer, reserves/funds aging and unresolved production authorization |
| Readiness | **Not ready for money-handling closed beta or public shift bookings.** Safe sandbox rehearsals and disabled foundation development remain possible. |

## Next three priorities

1. After explicit approval, deploy the reviewed authorization hardening and rerun
   security/performance, payment, matching and participant isolation checks.
2. Finish hosted Connect completion, owner financial controls, job-completion evidence
   and durable sandbox release/refund/reversal safeguards; keep execution disabled.
3. Add authenticated draft/application endpoints and actual multi-session scheduling
   tests, while obtaining employment/category/insurance/payroll clearance before any
   shift booking or employee-payment activation.
