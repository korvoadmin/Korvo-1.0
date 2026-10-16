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
