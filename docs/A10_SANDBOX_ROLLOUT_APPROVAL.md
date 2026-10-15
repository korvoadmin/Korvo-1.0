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
