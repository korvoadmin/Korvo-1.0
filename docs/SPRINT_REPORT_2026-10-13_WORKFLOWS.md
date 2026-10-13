# Korvo 1.0 — October 13 workflow reliability sprint

Continued from development head `5e954e9d9ca42b80a028480a6882a5769fb6a97e`.
No completed pricing or gig foundation was rebuilt. Work is on the separate feature
branch `codex/workflow-reliability-sprint`; main, Pages and deployed Supabase functions
remain unchanged. No persistent migration, real payment, refund or transfer occurred.

## Bugs fixed in development source

1. Job forms could submit without final step/consent validation. Submit now checks
   every required step and returns to invalid fields/review before any API write.
2. Posting/onboarding/message handlers lacked in-flight guards. Repeated submissions
   now send one request; posting freezes its submitted draft before Auth awaits.
3. Posting now checks the current active customer profile; onboarding checks the
   current active professional profile before profile writes. These are UI guards,
   not replacements for the pending server authorization fixes.
4. Onboarding sent `verification_status` and `account_type` back to the database.
   Those fields are removed. Individuals without a separate business name use their
   supplied professional display name. No verification badge is inferred.
5. A localStorage exception after confirmed onboarding could report a failed save.
   Cache writes are optional; both database saves must be confirmed before success.
6. A delayed message response used the currently selected conversation instead of
   its original target. It now validates message/thread/sender IDs, writes only the
   original thread and deduplicates the saved message ID.
7. Switching conversations carried composer text across threads. Drafts now belong
   to their own conversations in memory; a late success cannot erase a new draft or
   restore an already sent one. Drafts are not persisted as private browser storage.
8. Inbox refresh could revert a new selection or replace data with a partial/stale
   read. Reads are staged and versioned; overlapping refreshes and send-time refreshes
   are suppressed while current selection is preserved.
9. Completion UI accepted empty RPC results. Both dashboards validate the expected
   active-job ID/status before claiming a saved transition. In-flight repeat actions
   are rejected, including quote acceptance.
10. Professional completion could commit successfully then report failure when its
    follow-up read failed. It now reports the saved request and keeps resubmission
    disabled until refresh. Professional submission still awaits customer confirmation.

No cancellation fine, automatic refund, price increase, wage/tip deduction, employee
payroll route or contractor payout was enabled.

## Test evidence

| Check | Result | Scope |
| --- | --- | --- |
| Unit/handler/pricing/Connect/release/source suites | 101 passed | Pricing, signatures/retries, sandbox guards, no transfer execution |
| Posting/onboarding/messaging browser suite | 39 passed | Actual pages; isolated Auth/API; failures, races, account checks and mobile |
| Professional dashboard browser suite | 34 passed | Includes five new completion/failed-refresh checks |
| Customer dashboard browser suite | 30 passed | Includes four new completion checks |
| Connect/payment/recovery/gig browser suites | 8 / 19 / 16 / 17 passed | Existing payment and disabled-gig protections preserved |
| All seven browser suites | 163 passed total | Mock API/UI tests; not a new provider acceptance run |
| Isolated PostgreSQL gig schema | 45 passed | Unapplied schema, grants/RLS/gates/sequential scheduling |
| New deployed lifecycle database suite | 20 passed | Correct actor, unfinished work, duplicate transitions/reviews, cancellation/no-show issue holds; rolled back |
| Source syntax, diff whitespace, Python runners | Passed | Final source checks |
| Stripe account read-only inspection | Both sandbox mappings still incomplete | details/payouts false, transfers inactive; no account update |

The SQL harness initially had a helper-grant arity error and attempted a session lookup
under the authenticated role. It was corrected to use scoped temporary session IDs;
no Auth privileges were weakened. Duplicate issue rejection is asserted against the
actual eligible-state or existing-issue error, not an arbitrary failure. Final run passed.
The browser harness initially injected onboarding code into its destination fixture;
that harness error was fixed before the passing run. Expected negative cases are not
reported as successful saves.

## Security and financial state

Fresh Security Advisor remains at seven policyless backend tables, one anonymous
definer warning, 52 authenticated definer warnings and leaked-password protection.
No ERROR notice was returned, but applicable authorization launch gates remain unresolved.
The broad 134-check proposal remains unapplied pending explicit owner approval.

The deployed Stripe implementation and project payment model were preserved. Customer
pays full gross quote plus 12%; gig fees are added on top and exclude tips. Employee
shift payments/public booking remain disabled. Processing and employer-cost responsibility
remain owner decisions. SQL paid snapshots existed only in the rollback rehearsal;
they are not proof of newly successful Stripe payments.

## Files and publication

Updated: `post-a-job.js`, `professional-onboarding.js`, `messages.js`,
`professional-dashboard.js`, `customer-dashboard.js`, both dashboard browser suites,
GitHub regression workflow, test README, owner checklist, security audit and beta gates.
Added: `tests/workflow-reliability.browser.cjs`, `supabase/tests/project_lifecycle.sql`
and this report. No new database migration or Edge Function deployment.

Development commit/PR and remote CI results are recorded in the accompanying GitHub
PR. Source-tree equality is verified before publication. Do not merge into main or
publish Pages without owner approval.

## Remaining blockers and next three priorities

Closed beta is still **not ready for real-money handling**. Hosted Connect completion,
approved authorization deployment, owner financial controls, completion evidence,
refund/release policy, durable transfer reconciliation and genuine email acceptance
remain open. Job photo uploads are not yet integrated. Browser submission guards do
not supply durable server idempotency across reloads or ambiguous network failures.
Actual multi-session gig scheduling and authenticated gig endpoints remain unfinished.

1. Deploy reviewed authorization hardening only after approval; rerun advisors and
   participant/financial/Storage regressions.
2. Implement private completion evidence and operator refund/release reconciliation,
   retaining disabled transfers and owner-controlled policies.
3. Finish hosted Connect/email acceptance and the combined customer/professional
   sandbox UI/provider chain; keep hospitality employment/payroll gates closed.

Owner decisions/manual tests/approvals stay in `OWNER_ACTION_CHECKLIST.md`. No new
manual posting, messaging, mobile or pricing test has been delegated to Chris.
