# A10 — evidence and financial review sandbox rollout candidate

**Not deployed; no authorization granted.** Exact file hashes are in
[LAUNCH_RELEASE_MANIFEST.json](LAUNCH_RELEASE_MANIFEST.json). Regenerate and review
that manifest after any source change. This scope is separate from A6 and A8.

The requested future authorization is limited to the existing sandbox project:

1. Private completion-photo SQL, private JPEG/PNG/WebP bucket (10 MiB), participant
   read policies, reservation-only insert, trusted validation and customer-only acknowledgment.
2. `verify-completion-photo` and its pinned/locked decoder/SDK dependencies. Server
   `COMPLETION_EVIDENCE_ENABLED` stays false until the exact hosted acceptance is approved.
3. Owner/admin refund review SQL and the nonexecuting financial-operation ledger.
   Support cannot prepare, recommend or view financial operations. Service observations
   cannot clear holds, update refund allocations or authorize money movement.

Prerequisites: D4 financial operator identity and strong authentication; D7 final
photo consent/retention/support copy; compatible dashboard publication separately
approved under A8; A6 scope compatibility reviewed. Photo enrollment occurs for NEW
active jobs immediately when the SQL is applied: publish compatible UI first and
pause creation during the controlled schema/Edge cutover. Existing jobs are not
backfilled and retain their previous completion path; they still need release review.
Do not apply photo SQL with an unavailable verifier to an open intake cohort.

Before execution, store a private durable catalog/ACL snapshot and database backup,
confirm bucket absence or reconcile its exact existing settings, inspect object
counts and dependencies, review inverse SQL, establish the operator and maintenance
window. Execute only the approved proposals, in explicit transactions with timeouts;
do not move all proposals into an automatic deployment directory.

Hosted acceptance must demonstrate: actual JWT/session denial; customer/pro ownership;
private Storage insert/read and signed-URL expiry; all three valid formats; corrupt,
oversize and animated rejection; same-key retries and ambiguous uploads; concurrent
reservations; customer-only acknowledgment; legacy and enrolled jobs; no payment
release. Measure WASM cold start, CDN outage/integrity, memory and CPU on the actual
Supabase Edge runtime. Local Deno success is insufficient. Use dedicated sandbox
fixtures; never collect banking/identity details from the owner.

Rollback: turn off intake and UI/server flags, preserve all validated evidence and
ledger/audit records, restore reviewed function/policy/trigger grants from the protected
snapshot. Do not drop a populated bucket/schema or remove enrollment to bypass an
incomplete customer review. A populated rollout requires a forward repair or separately
reviewed data-preserving inverse. That exact populated inverse and hosted acceptance
are still engineering prerequisites; this candidate is not a deployment-ready claim.

No refunds, transfers, live payments, release automation, gig activation, production
settings or authorization migration are included. Refund/transfer execution is absent
from the ledger; `execution_enabled` remains false regardless of client input.

## October 16 expanded candidate — separate approval still required

Additional exact objects are enumerated by financial_reconciliation_observations.sql:
private reconciliation_reports, reconciliation_checks and allocation_corrections;
private reconciliation_target, record_reconciliation, reconciliation_queue and
apply_full_refund implementations; public admin_financial_reconciliation_target,
finance_record_reconciliation, admin_financial_reconciliation_queue and
admin_record_verified_full_refund_allocation invoker wrappers. The new
reconcile-marketplace-payment Edge entrypoint only reads Stripe sandbox with GET,
then persists normalized observations through service-only SQL after active financial
actor/payment-revision rechecks. It has no refund or transfer API.

An explicit financial owner/admin request can record only the proven existing FULL
refund component allocation with a fresh immutable provider report, reason, stable
request key and audit receipt. This internal accounting mutation is DISTINCT from
read-only provider checks. Service/support cannot approve it; no original amounts,
refund totals or holds change. It has NOT corrected the actual $112 record. The $560
held case has no demonstrated amount mismatch and still needs case disposition.
Enabling this RPC or making an actual correction needs separately reviewed scope.

completion_release_facts.sql adds service-only completion_release_evidence and private
release_facts: enrollment, assigned-professional evidence, current customer ack and
completion must agree. Legacy jobs stay manual-review candidates. New SQL depends on
existing evidence/refund/ledger proposals, applied in manifest dependency order after
A6 compatibility review. New policy helpers provide no privilege assignment or money
execution. No financial dispatcher/scheduler is added.

Required hosted tests include actual owner/support/anonymous sessions, revoked roles,
provider failures/late responses, duplicate checks, stale payment revisions and once-only
accounting receipts; source permissions must deny direct table writes. Actual Stripe
refunds/transfers are excluded even from acceptance. Preserve observations/corrections
and evidence during recovery; no DROP populated schema/bucket, DELETE accounting audit,
undoing a proven allocation or clearing a hold as rollback. Stop intake/disable flags,
retain reconciliation receipts and use reviewed forward repair; managed populated
recovery qualification remains a blocker. Review retention/access for operator reasons
and document hashes. Final exact manifest and commit must be approved separately.

## October 16 populated containment/recovery evidence

`tests/a10-recovery.cjs` now passes 18 checks using actual evidence/refund/ledger/
reconciliation/release SQL over representative populated Auth/Storage fixtures. It
preserves verified/abandoned photo metadata, customer acknowledgment, completion,
refund review, operation observations, reconciliation audits and financial holds.
Database backup/reload preserves table digests and catalog. `a10_containment.sql`
revokes private evidence/refund/finance function execution (including service role),
pauses new job/active-job inserts and completion transitions, and leaves all data,
buckets and enrollment intact. It does not undo original allocation or issue refunds.

`scripts/a10-recovery.mjs` generates review-only exact changed-function ACL recovery,
drops only the three temporary containment triggers/guard function and validates the
precontainment catalog. Unexpected catalog drift and repeat recovery both fail closed.
No generated SQL executes itself. Protected snapshots are required from the SAME
qualified environment; snapshots contain operational definitions and must stay private.

This is containment/recovery, NOT an uninstall or a managed restore qualification.
Fixtures are representative, not the entire current managed schema. No Storage bytes
are backed up by this test; no actual Edge/Storage upload or signed URL was exercised.
The existing local Deno decoder, SQL/privacy and browser evidence suites remain separate.
A10 STILL BLOCKED pending managed recovery/owner permissions, exact composed A6/A10
rollout compatibility and genuine hosted acceptance under separately approved deployment.

Known provider findings remain UNCHANGED: the $112 full-refund record needs a separately
approved internal component allocation correction ($100 professional/$12 fee); the $560
case is held for review with no demonstrated arithmetic mismatch. Neither was modified.
No fresh Stripe transaction or correction was executed in this continuation.
