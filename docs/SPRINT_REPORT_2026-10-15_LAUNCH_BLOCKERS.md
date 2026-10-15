# Korvo launch blocker elimination — October 15, 2026

Continues draft PR #7 at 092a96e0. No merge, deployment, production setting change,
refund, contractor transfer or live payment occurred. Full quoted professional gross
and 12% added on top, and all four confirmed membership tiers, remain unchanged.

## Implemented and verified

- Durable nonexecuting financial ledger proposal: reviewed component reservations,
  one operation per review, stable persisted provider key, payment-first lock order,
  owner/admin-only preparation, service-only append-only observations, unique receipts,
  terminal-state preservation and stuck/ambiguous operation queue. No dispatch/transfer/
  reversal creation or money-execution API exists. Observations never alter payment
  totals, clear issue holds or guess allocation corrections.
- Admin page can reserve a recommended refund and display operation state/attention,
  behind a separate default-off ledger flag. Confirmed server results are required;
  failed queues expose no controls. Existing role/session authorization stays mandatory.
- Read-only reconciliation exhausts provider pages, matches original amount/currency/
  source/operation ownership, rejects duplicates or ambiguous matches, and never
  licenses a retry after timeout or key expiry. Actual sandbox refund objects omit
  `livemode`; verification now requires trusted server API context instead of assuming
  that field exists. This provider-shape defect was found using real read-only results.
- All seven exact security packages and their inverse were exercised on an empty
  isolated copy of CURRENT catalog definitions: 72 dependency tables, 26 helpers,
  105 scoped functions, 44 relations, 48 policies, 40 triggers. The 134-check matrix
  passes; drift fails closed; exact metadata and a synthetic profile row survive
  recovery. ACL/default fingerprint ordering now uses stable role/schema names,
  fixing database-local OID portability. Raw snapshots never enter Git.
- Real decoder runs through local Deno HTTP: valid and corrupt JPEG/PNG/WebP. This
  qualifies local Deno execution, not hosted Supabase CPU/memory/Auth/Storage limits.
- Homepage/directory/profile examples are explicitly illustrative. Unsupported
  verification/background/insurance and real online-activity badges are removed.
  Five missing navigation targets corrected. The offline inventory still finds nine
  missing routes and 17 placeholders; policies/support/profile navigation block A8.
- Exact hashed A6/A10/A8 review manifest and separate rollout/publication packages
  added. Populated evidence/ledger rollback is data-preserving forward repair or a
  separately reviewed inverse; dropping populated schemas/buckets is not a rollback.

## Evidence layers

| Check | Result / boundary |
| --- | --- |
| New financial reconciliation units | 27 passing local tests |
| Actual financial ledger proposal SQL | 36 passing isolated assertions; Auth actor fixture |
| Current-schema security replay | 13 passing assertions plus 134 authorization checks; local PGlite, no hosted DDL |
| Existing recovery/writer suite | 11 passing; rerun because snapshot ordering changed |
| Existing evidence/refund SQL | 100 passing; rerun for compatibility with ledger dependency |
| Admin browser suite | 16 passing, six new ledger cases |
| Posting/onboarding/messaging browser | 39 passing impacted regressions |
| Static home/profile/directory rendering | Nine local Chromium views (home/profile/directory), widths 375/768/1280; no overflow |
| Local Deno HTTP + actual WASM | Six passing; Auth/Storage fixtures; hosted limits untested |
| Deno entrypoint type-check | Passing on Deno 2.5.6 |
| Native PostgreSQL CI | 17 passing real overlapping tests on disposable PostgreSQL 17.11 (10 finance + 7 gig); not managed Supabase |

Previously passing unaffected suites are retained from CI 38761257051; they were not
repeated locally just for a new report. Full CI reruns are the branch publication gate.
No complete hosted customer-to-payment-to-evidence-to-release journey is claimed.

## Read-only provider/database findings

Both mapped professional account IDs still match provider owner metadata; both remain
incomplete, payouts disabled, transfer capability inactive. Two ready unrelated
accounts remain unmapped. M1 still needs a dedicated active sandbox professional
session and hosted completion; no account was created/reassigned and no secrets or
identity/banking information were requested. No repeat link creation was attempted
without that usable session; completed-state hosted acceptance remains unverified.

The two successful refunds ($11.20 and $100.80) total the original $112 payment.
The trusted read-only reconciliation module confirms final aggregate components are
$100 professional and $12 Korvo. Individual refund splits are not established.
Database component counters remain zero and must be corrected through a separately
reviewed provenance-preserving reconciliation write; no D2 policy decision is needed
to derive the final FULL-refund aggregate. Other partial-refund policy remains D2.
No financial records or provider objects were modified. Zero active admins remain.

## Completion, blockers and handoff

No additional full master task is Complete this sprint: these advances still need
integration, hosted verification or approval. 23 master rows advanced; 144 tasks: 21 Complete, 36 In Progress, 32 Blocked, 17 Not Started, 38 Needs Verification. Preserve all 144 task IDs. The master
history lists each advanced ID, prior/new status, evidence/layer and dependencies.

Money-handling closed beta and public launch remain NO-GO. Primary remaining gates:
managed-Supabase rollback qualification/durable backup and A6; verified operator/MFA;
hosted photo/Storage/JWT acceptance and data-preserving A10 rollout; reviewed refund
execution, release-policy/funds/reserve accounting and A7; completed mapped Connect;
remaining frontend/policy/support routes and A8/M2; full hosted multi-account journey;
approved categories, legal/insurance and D11 beta scope/stop criteria.

Owner inputs remain D1 processing payer, D2 remedies, D3 release/reserve windows,
D4 verified operator, D6 categories/trust, D7 policies/support/retention, D11 cohort
and D12 entity/tax/insurance. D5 and D8–D10 remain separate membership/shift gates.
A6/A8/A10 are separate; A1/live and A7/transfers remain closed. M1 Connect and M2 real
email/recovery are the outstanding owner-assisted tests; no credentials are requested.

Next: (1) qualify managed Supabase inverse and approve exact A6 only after preflight;
(2) finish evidence populated rollback + controlled hosted A10 acceptance after compatible
UI; (3) integrate trusted ledger reconciliation writes/execution design with approved
financial policy, keeping every provider mutation gated. Use the current hashed manifest
and private fresh snapshot; do not repeat 134 isolated checks unless schema/scope changes.

## GitHub publication and CI

Published audited development commits `7fcb7d76468638b50ccefc1214b6efd458c476c0` and
`db28fb62d08ab7c7b53a88d66d6fbaffbc8558d4` in draft PR #7; main and PRs #4–#6
remain unmerged. Local equivalents: `1b64644` and `023ec1a`; fetched trees match.
Outgoing 35 initial versions + 10 follow-up versions were checked for secrets,
external credentials, private keys, personal email/identity records and provider
account IDs. Private catalog/provider responses and snapshots stay outside Git.
The only database password is a public disposable CI-only fixture, not a service credential.

First CI 38778273140 passed all isolated regressions, but the new native observer
initially failed because activity statistics were read within a long transaction.
Moved observer polling to an independent autocommit connection; pinned the tested
PostgreSQL image digest and reran affected branch CI. Run 38778541325 at db28fb6
passes the native job: all eight finance sessions and both competing gig sessions
were observed waiting concurrently; exactly one result wins where required; duplicate
receipts append once; terminal success survives late pending and aborts leave no rows.
Both jobs in run 38778541325 PASSED. Logs confirm 163 unit/source/document tests,
200 browser checks, 45 isolated gig SQL, 100 evidence/refund SQL, 36 ledger SQL,
11 recovery/writer, six actual WASM decoder, seven Sharp decoder and six Deno HTTP
checks; Deno type-check and integration-runner syntax checks pass. Native concurrency
adds 17 tests. These are separate layers, not a single hosted acceptance total.
https://github.com/korvoadmin/Korvo-1.0/actions/runs/38778541325

Private opt-in current-schema replay is not uploaded/run in GitHub: local 13 + 134
results are separate from CI. Reuse those verified results unless schema/scope changes.
The exact public release manifest remains valid; report-only changes do not alter it.
