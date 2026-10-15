# October 15, 2026: approved publication and retry controls

## Publication and audit

Owner explicitly approved development-branch publication to the existing
korvoadmin/Korvo-1.0 repository after an outgoing-history privacy/credential review.
Fetched all remote branch refs first: only two local commits were new. Inspected
all 25 unique changed blob versions in those commits, filenames and commit metadata.
Pattern checks covered private keys, Stripe secrets, webhook secrets, GitHub tokens,
AWS keys, Supabase secrets, nonpublic JWTs, credential URLs, SSNs, card candidates,
private email candidates and sensitive fixture filenames. Numeric matches were
hand-constructed UUID fixtures, not payment cards. No sensitive real test records,
private credentials or newly disclosed personal contact data were found. This is a
scoped audit of outgoing history, not certification of every preexisting remote commit.

The destination was verified through connected GitHub metadata (same repository,
public visibility, push permission). CLI push lacked GitHub authentication; the
connected app published the audited source with the existing PR #5 commit as parent.
No existing remote commit was rewritten. Trees were fetched and compared byte-for-byte.

| Local original | Published equivalent |
| --- | --- |
| e5d28e7 | 3ad443acd5b25368f2b6d340ee4e2b66a9e59e0a |
| 2d8b3b9 | 5a69bcadca5e3822eee0177a6f2a1d6d08d01139 |

Branch: codex/completion-evidence-refund-review. Draft PR #6 is stacked against
codex/workflow-reliability-sprint. PRs #4/#5 and main remain unchanged.
https://github.com/korvoadmin/Korvo-1.0/pull/6

## CI reviewed

GitHub Actions run 38684067277 / job 116254804124 succeeded on published 5a69bcad.
All steps passed: unit/source, seven browser suites, gig PostgreSQL suite, new
completion/refund PostgreSQL suite, full image decoder checks and Python runner
syntax checks. The new SQL suite at that checkpoint had 72 passing checks.
https://github.com/korvoadmin/Korvo-1.0/actions/runs/38684067277

## Additional safe development

- Added persistent completion-photo request keys. A retry with the same metadata
  returns the same ID/path and consumes no extra slot, including at five-photo
  capacity and after validation/submission. Conflicting metadata or null keys fail.
  Future upload UI must retain and resend the same key across ambiguous responses;
  omitting the key generates a new reservation for backwards compatibility.
- Added recommendation-time refund checks under a payment-row lock: disputes,
  completed refunds, transfer preparation, missing holds, unresolved refund allocations
  and amounts exceeding remaining allocations all reject a stale recommendation.
- Use the same payment-before-review lock order as request creation. This reduces
  lock-order risk; actual multi-session deadlock/concurrency testing is still pending.
  Idempotent terminal responses remain historical review results, not execution authority.
- Expanded the isolated SQL suite to 91 passing checks. Added stale-state failure
  checks that prove rejected recommendations leave the review unchanged.

Follow-up CI is recorded after publication. No deployed policy, grant, storage bucket,
Edge Function, payment, transfer or original financial allocation was changed.

## Still untested / blockers

- Evidence: real JWT/session endpoint, compatible Edge full decoder, upload/review UI,
  hosted private file reads/writes and existing-job rollout. Local decoder and fake
  Auth/Storage database tests do not clear those gates.
- Refunds: real owner-admin assignment and hosted role/session tests, UI, provider
  execution/reconciliation, true concurrent sessions and explicit financial policy.
  Review recommendations cannot execute refunds or clear payment holds.
- Authorization: security proposal remains unapplied; reviewed snapshot/inverse and
  scoped deployment regression are required before approved rollout. Prior 134-check
  rehearsal remains the verified historical checkpoint; no duplicate run claimed.
- Completed Stripe Connect setup and final customer/provider hosted acceptance remain
  unverified. Incomplete accounts stay ineligible. No new Stripe transaction attempted.

Owner needs remain D1–D4 (processing costs, cancellation/refunds, release policy,
verified owner-admin designation), A6 (authorization deployment), A7 (any transfers,
including sandbox), A8 (main/Pages publication), category/support/terms clearance.
Evidence/refund deployment needs its own approval after integration and regression.
Branch publication approval is resolved and does not authorize any of those actions.
Hospitality employment/payroll/insurance gates and public shift bookings stay disabled.

Korvo is closer to a controlled beta, but still not ready for money handling.

## Next three priorities

1. Finish authorization deployment snapshot/inverse and exact scoped rehearsal;
   deploy only after explicit authorization, then rerun advisors and workflows.
2. Integrate the trusted Edge decoder, private evidence UI and actual hosted tests.
3. Complete Connect onboarding and admin/refund/release reconciliation after owner
   policies and admin identity are confirmed; preserve disabled execution gates.
