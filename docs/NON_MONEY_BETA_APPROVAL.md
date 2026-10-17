# A11 — disabled non-money beta backend review package

**Separate approval required; not deployed or activated.** This scope is not silently
included in A6/A8/A10. It implements the D11 10-customer/10-professional Atlanta baseline
without inventing category or legal policy. No invitations are sent by this code.

Exact proposal: supabase/proposals/non_money_beta.sql. Private cohort/seats/documents/
assent/simulations/support_cases/support_replies; seven public invoker RPCs; three beta
triggers (job create/update, quote insert, assignment create/update); restrictive authenticated job discovery policy; a public checkout wrapper
that rejects any enabled cohort. Internal security-definer helpers use empty search_path;
private table grants are revoked/RLS enabled. Seat reservation is service-only and
locked/idempotent with independent fixed 10+10 quotas and authoritative profile roles.
No browser self-admission or support financial authority exists.

Configuration is default OFF, empty categories/cities, no legal document records and
zero seats. Only founder-approved category/city values and approved versioned HTTPS
policy URLs/hashes may be configured after separate authorization. Role-bound current
terms+privacy assent is required for posting, quoting, assignment and simulation. Old
quotes cannot assign an uninvited professional. A missing/revoked document fails closed.

Simulation derives full professional gross and 12% on-top fee from assigned job amount;
returns paid=false, provider_verified=false, release_eligible=false. It never writes
marketplace_payments or calls Stripe. Existing provider/financial data remain unchanged.
The server checkout Edge has an independent KORVO_NON_MONEY_BETA=true guard, also gated
for deployment/configuration. No payout eligibility may be inferred from a simulation.

Support cases/replies are private to their participant or active owner/admin/support,
with request-key receipts. No actual staff role is assigned. No monitored email or
response SLA is claimed operational. Legal document content is not authored/approved here.

Evidence: 40 isolated SQL checks; six current-schema clone compilation/rollback checks;
18 local beta browser fixtures; native PostgreSQL concurrency runner in ordinary CI.
Native CI result belongs to the final commit/run, not code existence. Schema compilation
uses actual current catalog plus revised A6; no real user rows are exported. Full hosted
Auth/Storage/JWT/Edge/browser acceptance is unverified and requires staged rollout approval.

Recovery design: first set paused=true through separately approved operator work while
keeping enabled=true and the Edge no-money guard active. This stops new seats, jobs,
assignments and simulations; support history remains readable. Revoke new beta mutation
RPC grants if needed. Do not disable the cohort to escape gating, delete consent/support
history, drop populated schemas or permit real checkout. A managed populated A11 recovery
rehearsal and protected backup remain required before proposing execution approval.

Activation prerequisites: A6 recoverability/security, composed A10/A11 compatibility,
A8 frontend, exact approved categories/geography, approved terms/privacy/support process,
controlled founder administration/MFA, final hosted negative/positive acceptance and
separate explicit invitation/go approval. Connect completion and live payout rules are
money-launch gates, not reasons to collect banking details for this non-money cohort.

## Revised A11 scope — discovery privacy qualification

Also apply/review non_money_beta_discovery.sql AFTER core A11 in a qualified isolated
rehearsal. It adds seven private helpers, replaces five public invoker wrappers, adds two
restrictive policies and changes the existing jobs policy, adds two opportunity/notification
generation triggers, and grants only required helper execution. It preserves core A11 ACLs.

Reason: an actual uninvited professional could read a beta job via my_job_match_feed and
retained my_job_opportunities even when jobs-table RLS hid it. Both feeds now filter
admission, current terms, customer eligibility and category/city. Direct retained
opportunities/matched notifications are hidden; new outside-cohort notices/opportunities
are suppressed. Project recommendations/invitations and retained opportunity actions are
also gated. No records are deleted. Paused/revoked admission closes discovery.

Jobs policy evaluates supplied row columns rather than self-reading an uncommitted new
row; this preserves INSERT RETURNING. That regression was found by actual browser/database
integration and now has dedicated positive coverage. Default-off behavior delegates to
the prior API. Evidence: 18 representative SQL, 31 composed actual-schema SQL, 12 mixed
browser/database checks. No managed permission change or hosted acceptance occurred.

Scope count correction: seven PRIVATE helpers in this new file (including row_visible),
five replaced PUBLIC wrappers, two added triggers; core A11's earlier counts remain
separate. Exact files/hashes are pinned by LAUNCH_RELEASE_MANIFEST.json. A11 execution
remains BLOCKED by recovery, owner-approved configuration/content and hosted gates.
