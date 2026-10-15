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
Fingerprint: f4d7f0804482f37092e2524b6522cca5. The protected snapshot is outside Git,
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

Seven isolated PostgreSQL recovery checks passed: capture, no-CASCADE inverse,
prechange drift refusal, exact metadata restoration, row preservation, original RPC
behavior and repeat-rollback refusal. Test changes cover wrappers, private functions,
policy edits, triggers, table grants and global function defaults.

This is NOT a full current-Supabase-schema rehearsal. Before requesting final A6:

1. Capture fresh before state and an access-restricted durable operational backup.
2. In an appropriate isolated clone/rollback rehearsal, apply the exact approved scope,
   capture after state, generate the inverse, execute it and prove exact restoration.
   Include current Supabase role/Storage/extension constraints and complete authorization
   regression. Preserve the verified 134-check historical result; do not label it new.
3. Verify no unknown new dependencies/grant chains and record any unsupported object.
4. Prepare a low-traffic transactional rollout with lock/statement timeouts, exact
   version/hash, abort conditions and on-call owner. Obtain explicit A6 approval.
5. Only after approval: apply the one reviewed scope, rerun advisors and role/workflow
   matrix, verify Stripe server grants, and store immutable deployment evidence.

Native multi-session PostgreSQL could not run in this container: only UID 0 is mapped,
non-root ownership setup failed, and nested UID mapping was denied. No host user was
created, no production connection was used for concurrency and no workaround bypassed
this restriction. Real concurrency and full hosted inverse qualification remain open.
