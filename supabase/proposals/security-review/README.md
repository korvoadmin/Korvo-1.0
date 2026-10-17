> Current October 16 verdict: **A6 STILL BLOCKED**. Populated isolated backup/inverse
> passes (44 + 134 checks), but actual managed postgres lacks ownership of two changed
> Storage policies; backup/managed restore evidence is unavailable. No deployment.
> See ../../../docs/A6_MANAGED_RECOVERY_QUALIFICATION.md. Historical steps below do
> not override this blocker; scope and canonical bytes remain unchanged.

# Authorization hardening: ordered review package

Review only. Chris has not authorized deployment. Nothing here is an automatic
migration. The seven SQL files concatenate byte-for-byte to the canonical proposal;
`manifest.json` records their hashes, order and 464 statements. Do not apply both
these packages and the canonical file. The build script refuses to regenerate an
existing manifest.

| Order | Scope | Dependencies / affected workflows |
| --- | --- | --- |
| 1 | Private schema, public CREATE and default function privileges | Changes function defaults for postgres; review future migration grants |
| 2 | Admin APIs behind private implementations | Requires 1; trust, support, memberships and moderation |
| 3 | Customer/discovery APIs | Requires 1 and existing APIs; posting, completion, matching, private details |
| 4 | Professional/trust APIs | Requires 1; professional completion, membership and trust |
| 5 | Quotes, messages and private details | Requires 1; quoting, acceptance, conversation access |
| 6 | Backend function grants and explicit RLS denial | Requires prior wrappers; payments, webhooks and internal tables |
| 7 | Profile/job guards and transfer protections | Requires prior scopes; role, verification, protected fields |

These are independently reviewable scopes, not proven independently deployable
migrations. Cross-function dependencies and policy OR semantics make partial
application unsafe without a new scoped rehearsal. Keep the approved scope in one
transaction unless separately reviewed/rehearsed scopes are explicitly approved.

## Deployment plan (approval required)

1. Confirm current branch, proposal hashes and live schema match the reviewed scope.
   Record security advisor results and migration/function versions. Capture an
   access-restricted schema-only snapshot covering original function definitions,
   function owners, ACLs, default privileges, triggers and policies. Do not commit
   credentials or user rows. A verified restore/inverse script is still required.
2. Rehearse the exact ordered files plus the complete security suite in one
   rollback-only transaction against the then-current schema. The canonical version
   previously passed 134 checks. The byte-equivalence check passed this sprint;
   this is not a new hosted 134-check run or deployment verification.
3. Check customer/professional/anonymous/admin denial and permitted flows, payment
   server grants, webhook retries, memberships, profile inserts and private details.
   Use an explicit transaction and lock_timeout; coordinate a brief low-traffic
   change window. Do not broaden permissions to silence an error.
4. Obtain Chris's explicit approval for the exact deployment scope. No transfer or
   live-payment activation is included. Apply once, then verify migration history,
   security advisor, role/RLS matrix and impacted workflow regressions.
5. If a precommit assertion or lock fails, ROLLBACK immediately; no changes persist.
   After commit, use only the reviewed inverse built from the snapshot in step 1.
   Do not simply drop the private schema: public wrappers depend on it. Halt feature
   publication if a regression appears. No postcommit rollback has been tested yet.

## Remaining approval prerequisites

Exact scoped deployment rehearsal at time of approval, restricted prechange snapshot,
and tested inverse/restore plan. Splitting the proposal does not resolve A6 and does
not authorize deployment. Production authorization remains a closed-beta blocker.
