# October 14, 2026: completion evidence and financial review

## Checkpoint verified

Local previous-turn work consisted of seven generated authorization review files,
a draft evidence proposal, an empty refund-review proposal and two package tests.
These were uncommitted, not verified completed features. GitHub PRs #4 and #5 are
still open drafts at 5e954e9d and 39e446d4. The fetched PR #5 source tree exactly
matches the starting local tracked tree despite different reconstructed local hashes.

Live read-only inspection confirms Checkout v5, webhook v5 and Connect v6, with no
migration after 20261012153716. No evidence/refund/security proposal has been applied.

## Built and fixed (development only)

- Verified seven review scopes concatenate exactly to the canonical 464-statement
  authorization proposal. Added scope/dependency, deployment, risk and rollback plan.
  These are review packages, not independently approved deployments.
- Hardened private completion-photo reservation, owner upload, server attestation,
  participant read, customer review and completion gates. Fixed a SQL NULL constraint
  bypass that permitted incomplete validation metadata; blocked direct active-to-
  completed bypass. Photo limit is five; maximum 10 MiB; JPEG/PNG/WebP only.
- Built server-only photo verification core: caller-scoped reservation authorization,
  private download, actual-byte signature/size checks, mandatory full-decoder contract,
  dimensions/animation limits, SHA-256 and confirmed privileged database attestation.
  Missing decoder, failed storage or empty database response cannot report success.
- Built admin-only refund review queue with explicit proposed professional/fee amounts,
  payment-row serialization, request idempotency, conflicting-key rejection, one open
  review per payment, immutable terminal decisions and audit events. Unallocated
  provider refunds block another recommendation request pending reconciliation.
  Review creation adds a payment hold; rejection never clears it. Recommendation
  does not execute a refund or approve a transfer. No financial policy was chosen.
- Added CI steps for the new isolated database and real local image-decoder checks.

## Verification this sprint

| Check | Result / boundary |
| --- | --- |
| Unit/source/security/payment suites | 117 passed; includes 14 evidence-core and two package checks |
| New evidence/refund PostgreSQL suite | 72 passed against actual proposal SQL in disposable PGlite |
| Full local image decoding | Seven passed: genuine PNG/JPEG/WebP, three corrupt files, fake header |
| Existing 134-check authorization rehearsal | Prior verified result retained; not rerun unnecessarily |
| Existing browser/provider tests | Prior results retained; no customer-facing source changed this sprint |

Database fixtures mock Auth actor identity and Storage tables; these tests do not
replace actual JWT/session validation, hosted Storage or concurrent multi-session
transactions. Sharp is the local full-decoder test adapter, not an Edge deployment
choice. No new Stripe charge, refund, transfer or hosted acceptance run occurred.
Remote CI/publication status is recorded after push; local pass does not imply it.

## Current security findings

Live advisor: seven INFO RLS-without-policy findings; one anonymous and 52 signed-in
SECURITY DEFINER warnings; one leaked-password-protection warning. Signed-in RPC
execution warnings require reviewing internal authorization, not blanket revocation
of legitimate APIs. Existing full hardening proposal remains approval-gated.
Live Storage policies are limited to the existing project-issue-evidence bucket;
they do not grant access to the new proposed bucket. Performance advisor separately
reports 33 auth RLS initplan warnings and 62 unused-index information findings.
No indexes were dropped and no new live grants/policies were applied.

Advisor remediation: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable
and https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection .
Reviewed current Storage access guidance and changelog; recent TLS cipher retirement
and Postgres extension/index notices do not require a change to these isolated SQL
proposals. No hosted database upgrade was performed.

## Deployment and remaining gates

No production/main/Pages merge, persistent migration, Edge deployment, actual refund,
live payment or contractor transfer. All new SQL stays under supabase/proposals.

Evidence remains unfinished: authenticated Edge adapter with a reviewed compatible
full image decoder, dashboard upload/review UI, actual hosted file validation,
existing-job rollout/grandfather policy and postdeployment workflow regression.
Do not deploy the completion trigger until those parts and legacy jobs are reviewed.

Refund review remains unfinished: owner-admin designation, UI, hosted role/session
acceptance, policy-approved execution adapter, stale-provider reconciliation and
concurrent-session tests. Current queue recommendations are nonbinding and cannot
change refund totals. No policy, processing payer or holding period is inferred.

Authorization A6 remains unapproved. A tested postcommit inverse/snapshot procedure is
still a deployment prerequisite. Connect complete status remains unverified; prior
incomplete accounts stay ineligible. Closed-beta gates remain red for money handling.
Employee/gig booking and payment gates remain disabled.

## Owner needs / next three priorities

Existing D1–D4 decisions: processing costs, cancellation/refund rules, release policy
and verified owner-admin account. Existing A6/A7/A8 approvals remain required; no
new manual tests are assigned. New evidence/refund proposals also require approval
and hosted regression completion before deployment.

1. Finish scoped authorization deployment rehearsal and tested restore plan, obtain
   approval, then apply and verify the advisor/workflow matrix.
2. Finish reviewed Edge image decoder, evidence UI and hosted participant acceptance.
3. Finish completed Connect synchronization and admin/refund/release reconciliation,
   after owner role and financial policy decisions; keep execution disabled.

## Publication checkpoint

Implementation commit `e5d28e7` is local on
`codex/completion-evidence-refund-review`, based on the actual fetched PR #5 commit
`39e446d4`. Automatic approval review rejected the branch push, stating that the
payload could contain sensitive code/documentation and the GitHub destination was
not explicitly approved. No alternate upload or push was attempted. Publication
and remote CI are therefore unverified; no new draft PR was created. Existing PRs
#4/#5 are unchanged. Explicit authorization to push this branch is needed before
retrying. The code/tests and report remain committed locally.
