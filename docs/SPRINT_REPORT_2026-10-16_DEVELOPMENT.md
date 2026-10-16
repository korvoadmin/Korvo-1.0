# Korvo development integration — October 16, 2026

## Authority and resume

Christopher Contreras explicitly approved the pending development-branch authorization.
Scope: existing codex/master-launch-audit branch and draft PR #7; isolated/local tests,
safe read-only inspection and ordinary nondeploying CI. No merge, Pages publication,
managed migration/Edge/Storage/Auth change, role grant, account deletion, actual refund,
transfer (including sandbox), live charge or invitation was authorized or executed.

Preserved all preceding uncommitted work. Local pre-sprint e00b9ce and remote published
0e51f65 have identical complete tree a39b5bd661bc59569f8854a0bcf26069c4fdda9a;
expected local/remote commit history differences are publication equivalents, not lost
source. PRs #4–#7 remain stacked drafts, with no conflicting new remote heads found.
Final publication uses a fast-forward child of 0e51f65; exact resulting SHA and CI run
are reported in PR #7 and the engineer's final response, not guessed before creation.

Only the regression workflow exists in development source; contents permissions are
read-only, no deployment/secret/provider mutation steps exist. Recent dynamic Pages
runs are main-only, last at 46e226a. Main remains unchanged. Administrative webhook/
Pages-setting endpoints were not accessible through public reads; no settings changed.

## Completed engineering work (development, not launch completion)

- Finished trusted sandbox GET observation bridge, bounded provider adapter, immutable
  reconciliation reports/checks, owner/admin review queue and revision/revocation checks.
  Timeouts persist unavailable observations when the database is available; no new
  provider-operation identity is manufactured. Financial execution remains absent.
- Added explicit audited correction for a proven EXISTING full refund, separate from
  provider reads. Requires fresh current proof, original exact components, current
  financial actor, reason and once-only request key. Preserves original gross, totals,
  review hold and historical receipt. Support/service cannot approve it. Actual records
  remain unchanged. Browser control independently default-off and now tested.
- Fixed stale photo callbacks and timeout/retry behavior; service-only completion facts
  replace browser evidence claims in nonexecuting release evaluation. Legacy rollout
  stays separate; no uploaded image independently releases payment.
- Resolved nine contact/profile references via truthful contact and authenticated own
  read-only profile pages. Added race/signout/role/XSS/mobile tests. Removed misleading
  public-profile/background-verification offer; pinned frontend SDK 2.117.3.
- Added founder policy calculation/architecture contracts: Korvo absorbs actual project
  costs without reducing gross; manual refund recommendations; immediate verified
  release eligibility; separate employer payroll/12% service quote; disabled participant
  attendance/rebooking; version/hash-bound assent receipt construction. These pure
  contracts do not persist terms/cases/attendance, activate bookings or certify screening.
- Tested actual unchanged A6 manual membership restoration SQL: financial role checks,
  one restoration, original actor/reason/history retention. No A6 bytes modified.
- Updated master, owner, security, beta, pricing and separate A6/A8/A10 review boundaries;
  exact release manifest includes new staged sources. Approval packages remain candidates.

Full D1–D12 complete/partial/blocked matrix: FOUNDER_POLICY_BASELINE.md.
The prior report's wholly-undecided D1–D12 descriptions are superseded by those selections;
remaining timing/legal/operational details and activation gates are still unresolved.

## Local verification actually executed

| Layer | Result | Limits |
| --- | --- | --- |
| Node unit/source/document | 210 passing | Includes founder policy, release, observer and handler; isolated fixtures |
| Admin browser | 30 passing | Includes accounting flag/proof, note, failed receipt, same-key retry and duplicate suppression |
| Own-profile browser | 10 passing | Auth/API fixtures, signout, XSS and three widths |
| Photo race browser | 6 passing | Delayed callbacks, refresh and timeout |
| Photo component browser | 16 passing | Storage/Auth fixtures, not hosted |
| Accessibility | 14 views passing | Chromium axe WCAG A/AA; default-off/unauthenticated desktop/mobile, not full assistive-device acceptance |
| Actual reconciliation SQL | 43 passing | PGlite, actual staged SQL, no managed deployment |
| Actual evidence/refund SQL | 106 passing | PGlite with Auth/Storage fixtures |
| Actual ledger SQL | 36 passing | PGlite, no provider operations |
| Actual unchanged A6 membership SQL | 10 passing | PGlite, no real privilege grant |
| Recovery/writer | 11 passing | Isolated metadata/data recovery, not managed Supabase recovery |
| Sharp / same Edge WASM decoder | 7 / 6 passing | Local actual image decode |
| Deno HTTP/WASM | 6 passing | Deno 2.5.6 with Auth/Storage fixtures |
| New and existing Edge entrypoint types | Both pass | Local Deno; no deployment |
| Checklist validator | Valid, 144 tasks | Counts below |

Initial local Deno HTTP launch could not resolve its npm package under the wrong
configuration location. Reused the CI dependency-root config; all six HTTP cases then
passed. This was test-environment setup, not a decoder/product failure. Chromium's
first download mirror returned an invalid archive; automatic alternate mirror succeeded.

Native additions cover eight overlapping reconciliation writers, once-only audit,
process rollback/revision drift, and eight overlapping full-refund accounting retries.
They require disposable PostgreSQL CI and are NOT claimed locally verified. Prior
checkpoint CI had 10 financial + 7 gig native checks; new expected finance total is 23.
Post-push native/full regression results are authoritative in PR #7 and linked Actions;
do not infer their success from this pre-publication report. Unaffected browser/gig
regressions are exercised by CI rather than unnecessarily repeated locally.

## Managed/deployed verification boundary

Read-only managed inspection: latest migration 20261012153716; checkout v5, webhook v5,
Connect onboarding v6. Photo verifier/reconciliation endpoint are not deployed.
Latest integration checkpoint's 14 managed read-only negative checks remain evidence
of a restricted SQL role subset, not genuine positive customer/pro/support/owner JWT
sessions. The seven-package/current-schema isolated inverse checkpoint is retained;
managed recovery, durable backup and actual operator/MFA remain prerequisites for A6.

Fresh website GET: customer/pro dashboards and messages return 200 with existing
versions; forgot-password.html remains 200/zero bytes and reset-password.html 404.
Development source is not served. No new hosted evidence acceptance or full journey.

## Financial and Connect findings (no provider writes)

Retain latest trusted read-only comparison: $1,120 payment consistent. The $112 payment
has two succeeded refunds ($11.20 + $100.80), proving aggregate $100 gross/$12 fee;
individual refund splits remain unknown and actual component counters remain zero.
Reviewed correction code is prepared, NOT applied. The $560 payment is paid and held
for review, with no demonstrated amount mismatch; no case disposition/hold clearance.
Neither review flag is resolved. Provider/DB raw records and account IDs stay outside Git.
Both mapped Connect accounts match ownership metadata but remain incomplete; unrelated
ready accounts stay unmapped. M1 remains actual mapped hosted completion, not opening
another link. No banking/identity credentials are requested.

## Master checklist and remaining gates

23 rows gain evidence: WEB-003/004/006/008, PRO-006/007, PAY-004/006/007/009,
SEC-007/008/010, EVI-003/004, ADM-002/004/005, TEST-001/002/005/009, BETA-002.
WEB-006 and PRO-006 move Needs Verification -> In Progress. Other statuses unchanged;
zero new full launch tasks Complete. All prior IDs/history preserved.

Total 144: **21 Complete, 38 In Progress, 32 Blocked, 17 Not Started,
36 Needs Verification**. No readiness percentage or full hosted verification claimed.

A6: managed isolated recovery qualification, durable backup and narrow authorization.
A8: approved policies/support/assent, reviewed exact assets, then served-version/M2.
A10: controlled evidence/finance/Storage/Edge rollout, populated recovery and hosted
negative/positive acceptance. No approval is requested for guessed financial arithmetic.
D4 operator/MFA; remaining D2/D3 timing/reserves; D6 cleared categories; D7 actual
support/legal/retention; D11 roster/stop criteria; D12 verified entity/tax/insurance
remain. D8–D10 commercial details/legal clearance and A9 remain separate and disabled.
M1/M2 retain their exact owner-assisted tests. A1/live and A7/transfers stay closed.

NO-GO for money beta/public launch. Founder-approved 20-person Atlanta non-money
scope still needs privacy/support/eligibility/operational gates and invitation approval.

Next: (1) verify final development CI and retain exact checkpoint; (2) qualify managed
A6 recovery without deploying; (3) finish populated A10 recovery/hosted acceptance
preparation and A8 approved policy/assent content, then request each separate approval.
