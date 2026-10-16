# Korvo remaining launch-readiness sprint — October 16, 2026

**NO-GO for invitations, deployment and money.** Development branch:
`codex/master-launch-audit`, draft PR #7. Started at
`94f53693a1d0f221ed368fd62e8f9c5c080929a8` with a clean tree; preserved all existing
work, 144 checklist IDs and D1–D12. Exact published final commit and reviewed CI run
are recorded on PR #7 and in the accompanying engineer response. A commit cannot
contain its own SHA; release file hashes are in LAUNCH_RELEASE_MANIFEST.json.

## Actual implementation

- A6 alternate seven-package candidate: remove only two managed-owned Storage policy
  optimizations. Preserve original canonical scope/history; retain Storage expressions
  calling hardened wrappers. 462 statements, separately hashed, not approved/deployed.
  Non-superuser rollout AND changed-object inverse pass against populated current-schema
  clone, including retained Storage participant/support/owner and cross-pair negatives.
- A10 populated backup/containment/recovery: preserve photo reservations/verification,
  customer acknowledgment, completion, refund recommendations, ledger observations,
  reconciliation audits and holds. Private function revocation plus intake/completion
  freeze; review-only fingerprint-guarded ACL recovery refuses drift/replay. No DROP
  populated schema/bucket or deletion of audits/enrollment to simulate recovery success.
- Default-off non-money beta backend: independent 10-customer and 10-professional seat
  quotas, service-only admission, current approved document version/hash receipts,
  category/city allowlist, job discovery/posting/quote/assignment guards, nonpayment
  simulation and private support cases/replies. Stale quotes cannot assign outsiders.
  No categories/documents/seats seeded; fixed Atlanta scope still requires exact list.
- Default-off beta UI: explicit assent with confirmed receipts, stable retry identities,
  nonpayment simulation, participant/staff support, signout privacy and safe text output.
  Maintenance pause retains history while stopping new workflows; it never enables money.
- Checkout defense: browser beta mode makes no checkout/RPC fallback; server Edge guard
  rejects before provider/client access; enabled database cohort also rejects checkout
  even if a browser flag is removed. No payment, refund or transfer executor added.
- Signup: 12-character NEW-account passwords, in-flight duplicate prevention, safe
  generic exception logging, repeatable failure recovery; legacy login compatibility
  retained. Beta routing is default-off. Password-reset implementation is preserved;
  real email/callback acceptance is still not verified.

## Evidence and verification layers

| Test | Result before publication | Boundary |
| --- | --- | --- |
| Unit/source/document tests | 216 passed | Local Node with TypeScript transform enabled |
| Revised A6 populated current-schema | 50 assertions +134 authorization matrix passed | PGlite; seven synthetic actors; no managed DDL/JWT sessions |
| A6 row preservation | 72 tables; 144 initial rows/25 populated tables; 146 after committed activity retained | Full row digests and catalog restored; Storage metadata only |
| A10 populated backup/containment/recovery | 18 passed, including drift/replay refusal | Representative Auth/Storage fixtures; not whole actual managed schema; no Storage bytes |
| Beta SQL | 40 passed | Actual proposal over isolated representative fixture |
| Beta current-schema compatibility | Six passed | Actual current catalog + alternate A6; compile/default-off/anonymous/transaction rollback |
| Signup browser | Six passed | Local Chromium/Auth fixtures; zero emails |
| Payment browser | 21 passed | Local provider/RPC fixtures; includes beta no-fallback controls |
| Beta browser | 18 passed | Local API fixtures, pause/privacy/XSS/retry/roles; includes two active axe views |
| Accessibility | 16 default-off page views plus two active beta views passed | Chromium 375/1280; no WCAG A/AA violations; no physical assistive/device claim |
| Native simultaneous PostgreSQL | Financial/gig suites retained; beta runner added | Disposable CI; overlapping requests proven through pg_stat_activity; final run linked in PR #7 |
| Full regression/Edge type/WASM checks | Existing ordinary nondeploy CI executes all suites | Review final run logs; previous checkpoint CI 38854490826 passed |

An initial local unit command omitted Node's required TypeScript-transform flag; rerunning
with the project CI command passed all 216. Active axe test setup was corrected to use
an explicit browser context and valid fixture document. A pre-existing signature-expiry test also had a one-second future-boundary race under
parallel execution; it now supplies the verifier's explicit clock parameter, preserving
the production 300-second rule. These harness issues do not constitute hosted failures. Final execution results are attached to PR #7; native checks
must not be inferred from runner code alone. Unrelated previously passing local suites
were not needlessly repeated; the ordinary CI validates the complete changed tree.

## Read-only hosted observations and unchanged financial findings

Connected Supabase organization now confirms Free/tier_free; project healthy and zero
branches. Current catalog fingerprint remains `383b3d8392815061e2eeaf11cad3e9dd`.
Available connectors do not expose retained backup/PITR listings or a qualified restore
path. Archive mode does not establish recoverability. No paid upgrade or hosted export
was initiated. Private schema definitions and generated inverses remain outside Git;
no real user rows were exported into test fixtures.

No new Stripe transaction/provider mutation occurred. Preserve the earlier provider
findings: $112 full refund has a pending internal component allocation correction
($100 professional/$12 Korvo); no correction applied. The $560 payment remains held for
case review without demonstrated arithmetic mismatch. Original gross and 12% on-top
allocations, refunds, observations and holds are preserved; no balance guessed or edited.
Connect completion remains a later financial gate, not a prerequisite to nonpayment
simulation. No real identity/bank information requested.

## Approval assessments

| Gate | Assessment | Exact remaining prerequisite |
| --- | --- | --- |
| A6 | STILL BLOCKED for execution; alternate ready for technical scope review | Protected durable backup, qualified managed recovery/operator, fresh catalog drift check and explicit alternate-scope approval; genuine post-rollout role/advisor acceptance |
| A10 | STILL BLOCKED | Composed managed rollout/recovery compatibility, Storage bytes/retention/permissions, actual hosted Edge/private Storage/JWT acceptance, exact separate approval |
| A8 | STILL BLOCKED | Approved D6/D7 content/support operation, backend compatibility, exact manifest approval and later served-byte/signup/reset acceptance |
| A11 (new separate scope) | DEVELOPMENT REVIEW ONLY | Admission/assent/support schema + server no-money guard deployment/configuration, populated managed recovery and actual hosted acceptance; no silent A6/A10 expansion |
| Invitations | NOT AUTHORIZED | Approved scope, roster/consent/support/stop criteria and successful operational security/hosted gates, then explicit go decision |

Outgoing scan covers all 369 existing historical blobs plus current tracked/new files;
no flagged credentials/private keys/non-anonymous JWTs/personal emails or sensitive
fixture records were found. Private captures/inverses are excluded from Git.

No main merge, Pages publish, Edge deployment, managed migration/policy/settings change,
actual privilege assignment, live user edit/delete, paid purchase, Stripe transaction or
participant invitation occurred. All feature changes are development-only until separately
approved. Passing local/CI tests does not establish operational deployment.

## Authoritative checklist and owner attention

144 IDs retained. **21 Complete, 42 In Progress, 33 Blocked, 14 Not Started,
34 Needs Verification. Zero newly Complete.** Five moved to In Progress: CUS-001,
CUS-010, LEG-010, ADM-008, BETA-006. Ten more evidence updates: SEC-003, SEC-005,
SEC-007, SEC-010, ADM-003, WEB-006, PAY-004, TEST-001, TEST-005, TEST-009.
Status history records previous/new state, work, layer and remaining dependencies.
Counts regenerated with scripts/check_launch_checklist.py --sync-counts.

Founder-only work: approve exact D6 category/geographic scope and D7 documents/support
operation; verify sole-founder account/MFA/recovery through separately controlled access;
set D11 consent/roster/success/stop criteria and later invitation decision. Routine
backup/CI/security verification remains engineering work; no screenshot-first assignment.
Remaining D2/D3 money policies, D8–D10 commercial/employment and D12 legal/insurance are
preserved rather than invented. See OWNER_ACTION_CHECKLIST.md for all stable gates.

## Precise handoff / highest-impact next engineering work

1. Obtain bounded recovery access/scope, create protected durable backup and qualify
   managed-compatible restore/Storage byte/config recovery. Do not rerun 50+134 locally
   unless schema/candidate changes; use fresh drift inspection and actual managed rehearsal.
2. Compose approved A6 alternate with A10/A11 in a populated managed isolated environment;
   rehearse containment/inverse and genuine JWT/Edge/Storage acceptance without money.
3. After founder-approved categories/documents/support and exact A8/A11 rollout, verify
   genuine signup/reset, admitted customer/pro journey, private photos/acknowledgment,
   support and server no-money refusal; keep invitations blocked until explicit go.

Private current-schema fixture/recovery captures are scratch-only and must be reacquired
if lost, never recovered from Git. New qualification commands:

    NODE_PATH=/path/to/tools/node_modules node tests/security-populated-schema.cjs /private/current-schema.json --managed-candidate
    NODE_PATH=/path/to/tools/node_modules node tests/beta-current-schema.cjs /private/current-schema.json
    NODE_PATH=/path/to/tools/node_modules node tests/a10-recovery.cjs
    NODE_PATH=/path/to/tools/node_modules node tests/non-money-beta.cjs

The native beta runner refuses non-CI/non-local databases and only uses the disposable
PostgreSQL CI service. Reuse final CI results on the exact published commit instead of
repeating completed suites without a code/schema change.
