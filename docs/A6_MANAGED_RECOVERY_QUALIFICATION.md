# A6 managed recovery qualification — October 16, 2026

**Verdict: STILL BLOCKED. This is not deployment approval.**
Resumed from development 6da175566948fe5fac827c46b14124ec877c03b1 / draft PR #7.
Only read-only managed inspection and isolated synthetic testing were performed.
No hosted DDL, role grant, Storage change, restore, branch creation, Edge deployment,
financial operation, main merge or Pages publication occurred. D1–D12 unchanged.

## Exact unchanged deployment candidate

Canonical SHA-256: `da9d19e45419c99187976caeb289d1abd2fa722ec12155541607ec8ec477bc56`.
All seven ordered packages remain byte-identical and total **464 statements**.
Do not apply both canonical and package forms. They are one transaction, not seven
independently deployable releases. Exact objects/SQL and per-package hashes/types:
[A6_OBJECT_INVENTORY.json](A6_OBJECT_INVENTORY.json), generated with pglast 7.8.

| Change class | Exact count | Effect |
| --- | ---: | --- |
| Function CREATE OR REPLACE definitions | 103 | Public invoker wrappers, private authorization implementations and field guards; not 103 newly added public endpoints |
| ALTER FUNCTION statements | 43 | Existing helper/backend privilege/search-path hardening; overlaps function identities |
| Policy changes | 46 | 39 altered existing policies, seven new restrictive denial policies |
| New triggers | 3 | Guard profiles, professional profile ownership and initial job state |
| GRANT/REVOKE statements | 257 | Public/client/backend/schema/table/function grants; not administrator assignment |
| Default-privilege statements | 3 | PostgreSQL-role function defaults for global/public/private scopes |
| Policy comments | 6 | Documentation only |
| Other | 3 | Session lock timeout, private schema creation, PostgREST reload notification |

Affected SQL roles: PUBLIC, anon, authenticated, service_role; postgres function defaults.
Application customer/professional/support/owner roles are authoritative data records,
not new PostgreSQL login roles. No real owner account or privileges are assigned.

## Managed facts actually observed

Project waaglkephsbxdlleuutr is ACTIVE_HEALTHY, PostgreSQL 17.6 / release 17.6.1.166,
region us-east-2. No development branches are present. Inspection connection is
`postgres`, **not superuser**, with BYPASSRLS, CREATEROLE and CREATEDB. Its ownership
covers all 105 scoped public functions and 43 public tables. `storage.objects` belongs
to `supabase_storage_admin`; postgres is neither its member nor inheritor and lacks
Storage schema CREATE. BYPASSRLS does not confer DDL ownership.

Two exact blocked A6 objects are policies **Issue evidence read** and **Issue evidence
upload** on storage.objects. Both their ALTER POLICY rollout and changed-policy inverse
need an owner-capable managed execution method. No such hosted method was exercised
or approved. No hosted DDL was attempted to discover this failure.

WAL settings: archive_mode=on; wal_level=logical. **These do not prove a usable backup,
PITR entitlement, retained recovery interval or tested recovery point.** Project details
omit plan/backup/PITR status. The installed connector has no backup-list/PITR-status
reader. Its restore operation would mutate hosted state and was not invoked.
No backup IDs, timestamps, retention window, RPO or measured managed RTO are claimed.

The role-scoped inverse snapshot covers postgres default ACLs. Managed supabase_admin
has separate public table/sequence/function default ACLs outside that scope. A6 changes
only postgres defaults; do not market the inverse as a whole-cluster roles/settings
backup. No grant-chain support, role passwords or Storage file bytes are exported.

## Populated isolated rehearsal actually executed

Fresh **schema definitions only** captured privately: 105 functions, 44 scoped
relations, 48 policies, 40 triggers; 72 dependency tables and 26 helpers. No hosted
account rows, Auth sessions, passwords, evidence files or provider records were copied.
Private catalog fingerprint: `383b3d8392815061e2eeaf11cad3e9dd` (not a data-backup hash).

PGlite PostgreSQL 17 with exact current definitions was populated BEFORE hardening:
**144 synthetic rows in 25 tables**, seven retained actor accounts, two independent
customer/professional pairs, accepted quotes, conversations/messages, private job
metadata, memberships/usage/history, held full-gross-plus-12% marketplace payments,
issues/evidence metadata/operator notes, verification requests and event receipts.
Storage contains metadata only: no Storage service or image files are emulated.

**44 recovery/authorization assertions plus the existing 134-check matrix passed.**
Every one of the 72 dependency tables is compared using sorted JSON row digests and
counts. This checks all columns, not only selected profile fields.

Verified:
- Export/load of the populated isolated database restores all row digests and the
  original catalog fingerprint in a second isolated instance.
- A deliberately interrupted deployment after package three rolls back atomically.
- All seven exact packages commit under an owner-capable isolated harness without
  changing any retained row.
- Customer/professional own-data reads, unrelated pair/address/message denials,
  support queue access with financial denials, owner queue access, anonymous denial
  and forged editable-owner-metadata rejection work beside populated data.
- The full 134-check matrix passes and its fixture transaction preserves retained rows.
- A legitimate customer message COMMITTED AFTER hardening survives the inverse too.
- The inverse restores exact prechange function bodies, owners/ACLs, policies,
  triggers/enabled modes, RLS/default privileges and scoped schema state after COMMIT.
- Catalog drift and duplicate inverse execution fail closed.
- Non-superuser rollout/inverse failures also preserve records and catalog atomically.

Permission simulation uses a distinct non-superuser operator inheriting public-object
owner rights, without Storage ownership. PGlite protects its built-in postgres role
from ALTER ROLE, so this is an alias, not exact managed-role emulation. The inverse
simulation adapts ONLY the fingerprint query's current-role default-ACL filter to the
modeled postgres scope; the actual generated inverse file is unchanged. Both attempts
reproduce SQLSTATE **42501** for storage.objects ownership. This matches the independent
hosted membership/ownership inspection, but does not qualify managed execution.

Additional regression: 12 recovery/writer assertions and 213 unit/source/document
checks pass locally; the refreshed empty current-schema replay retains 13 + 134 passes.
These reruns were necessary because inverse generation changed. Unrelated payment,
browser and provider suites were not repeated locally. CI results are recorded in PR #7.

The first synthetic setup used the wrong actor for a quote and expected anonymous
SELECT to return zero where the grant is revoked. The guards rejected both; fixtures
were corrected. PGlite's built-in-role limitation required the documented role alias.
No product authorization was weakened to pass these tests.

## Recovery improvement implemented

The old inverse indiscriminately dropped/recreated every scoped policy/trigger and
rewrote unchanged table ACL/RLS state, including managed-owned Storage objects.
The generator now mutates only changed policies/triggers/functions/ACLs/RLS flags,
while preserving complete pre/post fingerprint guards and NO CASCADE behavior.
Regression verifies untouched managed-owned objects are not rewritten. Changed Storage
policies STILL require their owner; the fix is not a workaround for the A6 blocker.

## Backup/restore capabilities versus this project's proof

Official documentation checked October 16:
https://supabase.com/docs/guides/platform/backups

Provider documentation describes daily backups for paid plans, PITR as an eligible
paid-plan add-on, and off-site logical exports for free projects. This project's plan
and entitlements remain unverified; no upgrade or purchase is authorized. Physical
backup files are not generally direct downloads. Restores make the project unavailable;
actual downtime and recovery point must be verified before approval. Database backups
contain Storage metadata, **not Storage object bytes**. Custom-role passwords need
separate recovery handling. Edge/Auth/provider configuration is not restored by the
A6 metadata inverse. Read current provider instructions rather than promising exact
RPO/RTO from these generic capabilities.

## Prerequisites before requesting deployment approval

1. Read-only confirmation of actual scheduled/PITR backup status, retained timestamps,
   plan entitlement, last successful backup and authorized restore path; no Restore click.
2. Verified durable private database backup plus protected schema/ACL snapshot and a
   restore rehearsal in an approved managed isolated environment. Storage bytes and
   settings/role-secret recovery need their own inventory. Scratch catalog is not backup.
3. Resolve Storage ownership through a separately reviewed owner-capable provider method,
   OR prepare/review a narrower revised A6 scope and inverse. Do not grant roles or
   silently remove policies from the approved-for-review canonical file.
4. Verified operator, maintenance window, bounded locks/timeouts, fresh schema/owner drift
   check, dependencies and explicit rollback trigger/decision owner. No app-admin grant.
5. Genuine hosted JWT/session customer/pro/support/owner and anon acceptance after an
   independently authorized rollout. Existing read-only negative smoke is not that matrix.

Whole-database restore can discard writes after its recovery point and cause payment/
webhook divergence. Use the surgical inverse for an authorization-only regression when
qualified; preserve post-rollout business writes, stop intake, reconcile provider events,
and never run a broad restore automatically. Restoring baseline also restores its known
security weaknesses; keep intake paused and prefer reviewed forward repair when safer.

A6 alone cannot clear A8, A10, real-money, transfer, hospitality or invitation gates.

## October 16 continuation — revised scope and verified plan

**STILL BLOCKED for execution.** Read-only organization inspection now confirms Free
(`tier_free`), resolving the earlier plan uncertainty. Available connectors expose no
retained-backup/PITR listing or restore qualification. Project `waaglkephsbxdlleuutr`
is healthy; no branches exist. Archive mode is not backup proof. No paid upgrade,
managed export, restore, settings change or hosted DDL was performed.

An ALTERNATE candidate removes exactly the two Storage policy optimization statements:
`harden_korvo_api_permissions_managed_candidate.sql`, SHA-256
`8ae18c0f4fdfb16fc8ca6d6b7d6c94c95b9003f9b7b37e831d8f1eae84552f1c`.
Its seven ordered packages live in `supabase/proposals/security-review-managed/`.
462 statements remain; original 464-statement canonical/package bytes are preserved.
The original is still blocked by Storage ownership. The alternate retains original
Storage expressions, hardens their referenced public authorization wrappers and needs
explicit approval of its changed scope; it does not grant Storage-owner membership.

Fresh current-schema catalog fingerprint: `383b3d8392815061e2eeaf11cad3e9dd`.
50 populated assertions plus the 134-check authorization matrix pass for the alternate.
The rollout and inverse both run under an isolated NOSUPERUSER/BYPASSRLS alias inheriting
public postgres-owner rights, without Storage ownership. The model adapts only the
inverse query's CURRENT_USER default-ACL scope to postgres; the operational inverse
is not edited. Existing customer/pro issue-photo reads, cross-pair upload denials and
support/owner issue-photo access pass with the original Storage policies retained.
The clone includes 72 tables, 144 initial synthetic rows in 25 populated tables,
seven actors and 146 rows after legitimate committed activity. All retained row digests
survive package rollout, inverse and isolated backup/reload. No real user rows exported.
This is PGlite, not a managed recovery rehearsal or genuine hosted JWT matrix.

Remaining prerequisites: protected durable logical database export and tested recovery
path, separately protected Storage bytes/config/role-secret inventory, approved operator
and maintenance scope, managed-compatible rehearsal permissions, fresh snapshots and
explicit A6. Free plan is not permission to buy PITR. An owner may authorize a bounded
backup/recovery engineering operation separately; a screenshot is not required as the
first step. Do not deploy either candidate until recoverability is qualified.
