# October 15 execution sprint — security, evidence and financial review

## Checkpoint and branch boundaries

Resumed from draft PR #7, published source d789f9b9; the starting local tree matched
that checkpoint. Previous #4/#5/#6 remain draft development work. Original seven
security-review packages and 144 master task IDs are preserved. No production merge,
Pages publication, Supabase migration/Edge deployment, setting change, real transfer,
automatic refund or live payment occurred.

## Built / fixed

1. Security catalog snapshot and drift-guarded inverse generator. Captures function
   definitions/owners/ACLs, table grants/RLS, schemas, policies, triggers and default
   privileges. Writer refuses Git paths, uses exclusive mode-0600 output and never
   executes generated SQL. Inverse refuses catalog drift/unsupported grant chains,
   restores original metadata, checks original fingerprint and uses no CASCADE.
   Protected live snapshot: 105 functions/44 relations/48 policies/40 triggers; no
   non-owner ACL grant chains. Exact full-Supabase inverse is NOT yet rehearsed.
2. Completion-photo Edge handler: explicit server enablement, strict origin/method,
   1-KiB streamed JSON cap, JWT user validation, caller-scoped reservation authorization,
   privileged immutable-path download only afterward, full JPEG/PNG/WebP WASM decoding,
   resource limits, SHA-256 and confirmed server-only attestation. Safe generic errors.
   Pinned magick-wasm 0.0.44 asset is integrity checked; initializer is single-flight.
   The actual fixed CDN asset was downloaded and its SHA-256 matched the pinned package.
3. Pro dashboard upload/retry/abandon controls and customer private-photo viewing/
   explicit acknowledgment, wired before existing completion RPCs. Default-off rollout
   flag cannot bypass database requirements. Stable content-based reservation journals,
   no upsert, ambiguous upload verification and saved-digest comparison prevent false
   upload success. Failed/unviewed photos block acknowledgment. Names render as text.
4. Legacy rollout: existing active jobs are not backfilled/stranded; new active jobs
   auto-enroll after approved rollout and cannot opt out through the frontend. Legacy
   completion does not manufacture verified release evidence. Owner must approve
   UI-first rollout, notices and legacy paid-job support process through A10.
5. Refund-review development page: server financial access before controls; separate
   professional/fee cents; stable request keys; confirmed responses; notes and audit-backed
   information/recommend/reject actions. No refund/transfer execution endpoint. A saved
   review/decision remains saved if subsequent queue refresh fails.
6. Read-only reconciliation/aging inventory: current snapshot has zero pricing failures,
   one unresolved refund component allocation, two held reviews, zero ambiguous releases,
   zero stale checkout candidates and zero unprocessed receipts. Last count does not
   prove successful provider delivery. Original financial rows/allocations unchanged.
7. Current Stripe sandbox ownership check: both mapped accounts' owner metadata matches
   the mapped professional. Both remain incomplete with payouts false/transfers inactive.
   No unrelated ready account was substituted and no mapping changed.

## Tests and exact limits

| Suite | Result | Layer |
| --- | --- | --- |
| Unit/source/document | 135 passed | Isolated Node; includes 9 new endpoint security cases |
| Existing browser suites | 168 passed | Actual dashboard source with API fixtures, including 2 new photo-preflight denial cases |
| New completion evidence browser | 16 passed | Upload/retry/private display/acknowledgment/legacy/mobile fixtures |
| New admin refund browser | 10 passed | Financial access, cents, injection, ambiguous save, same-key retry, no-execution/mobile |
| Evidence/refund SQL | 100 passed | Actual proposal SQL, PGlite with simulated actor/Storage |
| Recovery inverse/writer | 11 passed | Isolated metadata round trip, drift refusal, preserved row/original function |
| Production WASM decoder adapter | 6 passed | Genuine JPEG/PNG/WebP and corrupt versions, identical adapter binary |
| Original decoder checks | Preserved 7-check suite in CI | Sharp test adapter remains separate from Edge |
| Deno 2.5.6 | Type-check passed | Staged entrypoint + pinned dependencies; not hosted execution |
| Dependency audit | Zero known package advisories returned | Locked SDK/WASM package graph; not an engine/hosted security certification |
| Prior deployed/provider regression | Historical evidence preserved | No unnecessary new charge/user/data fixtures |

The initial added dashboard test hit a fixture-modal sequencing error; fixed the
harness, used the correct professional RPC field, then both affected suites passed.
An initial decoder resource setting rejected valid images; corrected its bounded
internal list allowance and verified all three formats. Deno found a typed limits
contract mismatch; fixed it and reran successfully. No failing check remains local.

Native PostgreSQL binaries were obtained in scratch, but this container maps only
UID 0: non-root chown failed and nested UID mapping was denied. No host account was
created or security restriction bypassed. Real concurrent reservations/refunds/locks
remain untested. PGlite is not multi-session proof. No production transaction was
held open to imitate a concurrency harness.

Hosted Connect completion was not rerun: no active authenticated synthetic professional
fixture/valid hosted link is available; earlier credentials were intentionally removed
and accounts deactivated. Current provider metadata/status checks are not completed
hosted onboarding. Existing exact M1 steps remain, rather than requesting secrets or
manufacturing more persistent users. All creation/link refresh/failure fixtures remain
covered by existing automated tests.

## Master task accounting

144 IDs retained. New counts: 21 Complete, 31 In Progress, 35 Blocked,
18 Not Started, 39 Needs Verification. One task newly Complete: EVI-009 engineering
rollout design, backed by implemented gates and SQL tests. No deployed feature is
newly declared complete. Twenty-two rows updated with previous/new status, evidence,
testing layer and remaining dependencies in the master history.

Advanced implementation: SEC-003/007/008/010, EVI-001/002/003/004/009,
PAY-004/006, ADM-002/004/005. Updated ownership evidence: PRO-004/PAY-005.
Recorded environment blockers: GIG-007/TEST-009. Refreshed verified test checkpoints:
TEST-001/002/005/006. No pricing, membership, employment or financial policy changed.

## Owner gates and handoff

A6 remains unapproved and not yet ready for final deployment: fresh durable operational
snapshot plus full current-Supabase inverse qualification still required. A8 frontend
publication and A10 evidence/refund/schema/flag rollout remain separate. A7 any real
contractor transfer (including sandbox) and A1 live payments remain closed. D1–D4,
category/support/terms/insurance and shift D8–D10/A9 remain unchanged. One existing
unallocated sandbox refund needs reviewed reconciliation, not an automatic split.

New files: completion-evidence.js; admin-refunds.html/js; verify-completion-photo
index/handler/decoder and pinned package lock; scripts/security-snapshot.mjs and
write-security-recovery.mjs; read-only reconciliation SQL; new browser/endpoint/WASM/
recovery tests; A6 and completion rollout documents. Existing dashboard source, photo
proposal, tests, CI and authoritative documents updated. Full file list is in the PR.

Next session: inspect PR/CI and preserve these results; finish full current-schema
inverse rehearsal in an appropriate isolated environment; qualify the staged photo
endpoint's cold start/CPU/memory/dependency failure and actual hosted JWT/Storage/UI;
then build durable refund/transfer ledger/execution/reconciliation while execution
stays disabled. Read-only monitoring is not a scheduled alerting service. Do not
restart the endpoint/UI work, recreate accounts or repeat unchanged provider charges.

Actual durable refund/transfer ledger, provider refund execution, monitoring scheduling,
full hosted acceptance and public/employee bookings remain unfinished. Money-handling
closed beta is still NO-GO. The verified local work is reviewable development progress.

## Publication checkpoint

Execution commit d31d8add is published in draft PR #7 and independently passed
GitHub CI run 38760874270, including all nine browser suites, Deno type-check, SQL,
WASM and recovery gates. Fetched published tree matched local source exactly.
A final writer hardening adds canonical-parent path checks and private-directory
ownership/mode requirements, with 11 passing recovery/writer assertions (including
symlink-parent, public-directory and overwrite denials). Its separate CI result is
recorded in the PR. Protected snapshots stayed outside Git; no secret/record upload.

## Successor handoff

Continue from SPRINT_REPORT_2026-10-15_LAUNCH_BLOCKERS.md for the subsequent
ledger/current-schema recovery/Deno-runtime/controlled-release sprint. Earlier totals
above are preserved historical checkpoints; authoritative statuses remain in the master.
