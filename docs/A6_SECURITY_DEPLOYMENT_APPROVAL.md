# A6 authorization deployment package — development review only

Not authorized for deployment. No SQL in this package runs automatically.

## Exact scope

Canonical file: supabase/proposals/20261012160000_harden_korvo_api_permissions.sql.
The seven ordered security-review SQL files concatenate byte-for-byte to its 464
statements. Existing manifest/hash tests remain mandatory. Review scopes: foundation
schema/default privileges; administrative APIs; customer/discovery; professional/trust;
quotes/messages/private details; backend grants/RLS; profile/job/transfer guards.

These scopes are independently reviewable, not yet independently deployable. Do not
apply both canonical and split versions, or push every proposal as a migration.
A6 does not authorize evidence/refund/gig proposals, live money, transfers or Pages.

## Snapshot and inverse implementation

scripts/security-snapshot.mjs exports a read-only catalog query that captures function
bodies/owners/ACLs, relation grants and RLS flags, relevant schema ACLs, policies,
noninternal trigger definitions/enabled modes, and current-role default privileges.
It reads no customer rows, Vault values, Auth sessions or credentials.

A read-only live snapshot captured 105 functions, 44 relations (43 public plus Storage
objects), 48 policies and 40 triggers. No non-owner grant chains were present.
The original fingerprint was superseded by portable name-based ACL ordering. The protected snapshot is outside Git,
mode 0600 in a mode-0700 scratch directory. Regenerate it immediately before any
approved deployment; temporary scratch storage is not a durable deployment backup.
Do not publish snapshots or generated inverses: definitions/ACLs are operational data.

The inverse generator requires before/after snapshots and refuses unsupported grant
chains or a preexisting/nonempty private data namespace. Generated SQL first checks
the complete expected postchange catalog fingerprint, then restores original function
bodies, ACLs, policies, triggers, RLS flags and default privileges. It drops only newly
introduced functions/schema, without CASCADE, and checks the original fingerprint
before COMMIT. Drift or missing dependencies abort instead of guessing a rollback.
No user tables/rows are dropped or rewritten.

Usage after obtaining protected before and rehearsed after snapshots:

    node scripts/write-security-recovery.mjs /private/before.json /private/after.json /private/inverse.sql

The writer refuses paths inside the Git repository, creates a new mode-0600 file and
never executes the inverse. Verify the operating connection role matches the snapshot;
current-role default privileges are intentionally scoped, not a cluster-wide backup.

## Verified / still required

Eleven isolated PostgreSQL recovery/writer checks passed: capture, no-CASCADE inverse,
prechange drift refusal, exact metadata restoration, row preservation, original RPC
behavior and repeat-rollback refusal. Test changes cover wrappers, private functions,
policy edits, triggers, table grants and global function defaults.

The latest sprint now verifies the actual current scoped schema in an EMPTY isolated
clone: 105 functions, 44 scoped relations, 48 policies and 40 triggers; 72 dependency
tables and 26 helper definitions are exported without customer rows. The four confirmed
membership catalog entries are synthetic setup, not account data. All seven exact
packages applied, the current 134-check authorization matrix passed, drift was denied,
and the inverse restored the exact catalog fingerprint while preserving a synthetic
profile row. Thirteen rehearsal assertions passed, in addition to 134 matrix checks.

This is isolated current-schema replay, NOT a hosted managed-Supabase inverse test.
No Storage service, managed-role restriction, extension upgrade or hosted session API
is emulated. Raw definitions, snapshots and diagnostic output stay outside Git, 0600.
Name-based ACL/default ordering fixes cross-cluster role-OID portability; old snapshots
must be recaptured using the current query before preparing an inverse.

Remaining engineering prerequisites before execution: fresh durable private backup;
qualify managed role/Storage/extension rollback constraints in an appropriate isolated
Supabase environment; review unsupported dependencies; confirm maintenance window and
operator; rerun current matrix/advisors after approved deployment. Native PostgreSQL
CI now has a dedicated disposable service for financial/gig multi-session tests; those
results are independent of managed Supabase deployment qualification.

## Narrow future approval wording

A6 would authorize ONLY the canonical 464-statement authorization file at SHA-256
`da9d19e45419c99187976caeb289d1abd2fa722ec12155541607ec8ec477bc56`, or the seven
byte-identical ordered packages in LAUNCH_RELEASE_MANIFEST.json, applied once to the
existing sandbox project after the remaining preflight. Do not apply both forms.
Use one transaction, lock_timeout 5s, statement_timeout 60s; abort on any drift,
unsupported grant chain, failed statement or authorization regression. Preserve the
before/after fingerprints, inverse and postdeployment matrix/advisor evidence privately.
No evidence/refund/gig deployment, Pages publication, refunds/transfers or live payments
are included. A6 has NOT been granted. This is a concrete review scope, not a claim
that outstanding managed-environment preflight has passed.
