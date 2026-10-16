> October 16 continuation: **STILL BLOCKED — NOT READY FOR DEPLOYMENT APPROVAL**.
> Alternate 462-statement scope passes 50 populated assertions +134 authorization
> checks while retaining original Storage policies. Original scope remains owner-blocked.
> Free plan confirmed; protected backup/managed recovery still unqualified.
> See A6_MANAGED_RECOVERY_QUALIFICATION.md and A6_MANAGED_CANDIDATE_EVIDENCE.json.

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

## October 16 narrowly scoped founder review package

Impact: retain exact canonical SHA and seven-package order above; 464 statements,
103 function definitions, 43 ALTER FUNCTIONs, 39 altered/seven new policies, three
triggers, 257 grant/revoke statements, three default-ACL changes, six policy comments
and three other statements. No user data migration, app-admin assignment or feature
activation. Full identities and SQL appear in A6_OBJECT_INVENTORY.json.

**Do not approve execution yet.** Required evidence is actual backup/PITR availability,
durable protected backups and managed restore rehearsal, plus a Storage owner-capable
execution/recovery method or a separately reviewed narrower candidate. The current
postgres role cannot ALTER either Issue evidence read/upload policy on storage.objects.
No privilege grant or scope reduction has been made to bypass this restriction.

Rollback: private fresh before/after capture and pinned revised inverse generator;
stop intake; run one reviewed transaction with 5-second lock and 60-second statement
limits only after ownership and drift checks. Changed objects alone are restored;
unchanged managed objects are not rewritten. Keep data and post-migration activity.
Abort on fingerprint/privilege/lock/assertion failure. After inverse, confirm exact
baseline catalog, protected row totals/digests and permitted/denied workflows. Baseline
recovery restores known vulnerabilities too: do not reopen intake without disposition.
A broad database restore is a separate outage/data-loss/provider-reconciliation action,
not an automatic A6 fallback. No restore or migration is authorized by this package.

Local evidence: 44 populated assertions (144 initial synthetic rows/25 tables, 146 after
committed activity), full 134-check matrix, isolated database export/load, exact inverse,
interruption/drift/replay tests; 12 recovery/writer checks and 213 units/source checks.
Genuine hosted sessions/Storage service/managed recovery are NOT verified. See E21 and
PR #7 for final development commit/CI. No need to rerun unrelated local payment tests.

## Revised candidate for founder review — not execution-ready

See October 16 continuation in A6_MANAGED_RECOVERY_QUALIFICATION.md and the separately
hashed managed-candidate manifest. Prefer reviewing the 462-statement alternate that
leaves both managed-owned Storage policies unchanged. It passes 50 populated assertions
plus 134 matrix checks under the isolated operator model. Original inventory/history
remain authoritative for the ORIGINAL 464-statement scope, not the alternate.

Impact otherwise retains the seven existing scopes: owner/admin separation, customer/
professional boundaries, sensitive RPC grants, private helper schemas, RLS and protected
profile/job/transfer triggers. Anonymous/support denials and legitimate participant access
are tested in isolation. No privileges assigned, rows deleted or hosted changes made.
Free plan confirmed; actual protected backup/managed restore capability remains unqualified.
A6 is STILL BLOCKED, although the alternate is ready for technical scope review.

Future approved sequence: protected durable backup; current catalog/owner drift check;
qualified recovery rehearsal; pause intake; apply exactly ONE reviewed candidate in
manifest order with bounded locks/timeouts; capture after state; run genuine session
matrix/advisors; resume only on acceptance. On authorization regression pause intake,
compare current fingerprint and apply the protected changed-object-only inverse through
the qualified operator. Drift aborts; investigate/forward-repair rather than force it.
A whole-database restore can discard intervening writes and requires independent approval.
Residual risks: managed ownership/extension differences, role/default-ACL scope, recovery
downtime, restoring old security weaknesses, and Storage bytes outside database backups.
