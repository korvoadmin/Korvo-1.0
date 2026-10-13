# Korvo Supabase security audit — updated October 13, 2026

Project: `waaglkephsbxdlleuutr`. Stripe account context was verified as Korvo
sandbox (`livemode: false`). No live charge, transfer or bank payout was initiated.
This audit is a deployment checkpoint, not a claim of legal compliance or beta readiness.

## Deployed, tested and pending

| Component | State | Evidence |
| --- | --- | --- |
| Full quote plus 12% payment foundation | Applied and tested | Migration `20261012142416`; $100/$500/$1,000 real deployed Checkout allocation tests |
| Checkout | Deployed v5, JWT required and user validated | Actual sandbox charges, retries, unauthorized callers, terminal-payment handling; safe error stage/reference |
| Stripe webhook | Deployed v5, custom HMAC authentication | Eight real HTTP signature/replay/mode/size/method checks passed again after v5 deployment |
| Connect onboarding | Deployed v6, JWT required and user validated | Eleven actual Auth/function checks; repeated starts leave one mapping; incomplete setup stays restricted |
| Connect event destination | Created in sandbox | Genuine Accounts v2 capability-status events have committed receipts and updated the correct fixture mapping |
| Financial state holds | Applied and regression tested | Migration `20261012153716`; 38 database checks, plus genuine late $560 payment after a Korvo issue opened: `requires_review=true`, release held |
| Foreign-key indexes | Applied and advisor verified | Migration `20261012150819`; 53 indexes; zero unindexed-foreign-key findings afterward |
| Broad authorization hardening | **Not applied** | Automatic approval review rejected deployment; proposal stays outside `supabase/migrations` |
| Dashboard payment controls and recovery pages | Implemented and browser tested; not on Pages yet | Development branch only |
| Contractor transfer execution | **Absent/disabled** | Readiness evaluator cannot call Stripe; no release endpoint enabled; all three test payments remain held |

## Advisor findings, individually assessed

Latest successful advisor rerun: October 12, after the deployed payment changes.
No `ERROR`-level Security Advisor items were returned. Warnings are not proof that
every listed function is exploitable; authorization inside each function was reviewed.

| Finding | Count / advisor level | Assessment and disposition |
| --- | --- | --- |
| Anonymous-executable SECURITY DEFINER | 1 / WARN | `get_professional_trust_summary` returns public trust fields, not private contact data. Proposal removes anonymous execution and uses an invoker wrapper around an internally checked private implementation. No current frontend call to this RPC was found. Not deployed. |
| Authenticated-executable SECURITY DEFINER | 52 / WARN | Includes 18 admin RPCs and ordinary marketplace RPCs. Proposed invoker wrappers preserve the API signatures; private definers retain ownership/admin checks, verify the Auth user and use empty search paths. Internal relationship/restriction helpers lose client execution. Not deployed. |
| RLS enabled without policy | 7 / INFO | Backend-only tables currently default-deny client access. Proposed explicit restrictive deny policies and narrower grants cover matching configuration, transfer tracking, webhook events, admins, badges and verification/history. Not deployed; no blanket permissive policy was added. |
| Leaked-password protection | 1 / WARN | Disabled on the current Free plan. Enabling the paid feature requires owner approval; no upgrade or purchase was made. New recovery UI enforces 12 characters, which does not replace leaked-password protection. |
| Missing foreign-key indexes | 53 before / INFO | All 53 covering indexes were rehearsed, applied and verified. Zero remaining in the successful follow-up advisor result. |
| Repeated Auth evaluation in RLS | 33 / WARN | Proposal wraps stable identity/admin expressions in SELECT initplans. Pending the authorization deployment; tracked separately from payment defects. |
| Unused indexes | 63 at final captured rerun / INFO | Expected after adding indexes to a low-traffic database; retained. Do not drop unique/constraint or newly added indexes based on this observation alone. Counts change as tests exercise queries. |

## Findings and severity

| ID | Severity | Component / finding | Resolution |
| --- | --- | --- | --- |
| S01 | High defense-in-depth gate | Excess execution rights on internal/admin definer functions and sensitive helpers | Audited proposal; 131 checks passed for the initial full hardening rehearsal. Deployment blocked pending approval. |
| S02 | High least-privilege gate | Existing support admin classification permits financial membership/review/usage administration | Added owner/admin-only checks to the three private financial implementations in the proposal; focused rollback test passed six support-denial/owner-validation checks. Not deployed. |
| S03 | Medium | Quote insert policy compares `j.customer_id` to itself | Existing quote trigger derives the real job owner. Proposal fixes the policy comparison to `quotes.customer_id`; regression rehearsal verifies ownership. |
| S04 | Medium | Customer-owned professional-profile insert and incomplete professional onboarding need additional checks | Existing deployed account-type/standing guard blocks switching or inventing admin roles. Proposal additionally checks professional profile ownership and actual services/areas/business details. |
| S05 | Medium | Direct private-job-detail writes can avoid lifecycle-checked RPCs | Proposal revokes direct insert/update while preserving the existing owner RPC. |
| S06 | High financial reliability | Event receipt could be marked processed before data mutation succeeds | New financial receipt and state changes commit in one RPC transaction. Failure rolls back the receipt; successful duplicates return `duplicate=true`. Mock and actual database retry checks passed. |
| S07 | High financial reliability | Incorrect fee-only or 88/12 deducted-charge model | Disabled legacy preparation RPC. New immutable quote-plus-12% allocations validated in SQL, Edge handlers, browser summaries and actual Stripe sandbox sessions. |
| S08 | High financial reliability | Project issues/cancellations did not reliably hold new full-price payment records | Targeted hold migration applied; paid and late-paid unresolved cases require review, without automatic refund or release. 38 database checks passed afterward. |
| S09 | Medium abuse resilience | Oversized webhook body read before size rejection | v5 reads a bounded stream and cancels excess input. Unit cancellation check and deployed HTTP 413 test passed. |
| S10 | Medium operational | Generic checkout failures hide the failing stage | v5 returns/logs only safe stage, code and request ID; raw provider/database errors and credentials are not returned. |
| S11 | Medium authentication availability | Forgot-password page was empty | Recovery request/reset pages implemented and 16 isolated browser checks passed. Actual email delivery, allowed callback URL and one-time-link behavior are not yet verified. Not published to Pages. |
| S12 | High launch blocker | Administrative/support payment views still center on legacy booking-payment reviews | New participant summaries work. A full-price financial admin queue and audited refund/release operations remain to be integrated before money-handling beta. No owner/admin account is assigned. |
| S13 | High launch blocker | Actual transfer execution, reversal and payout reconciliation untested | Remain disabled. Readiness checks are tested code, not an enabled payout system. Owner policy and explicit enablement approval are prerequisites. |

No credentials were rotated or requested. Current source was checked for embedded
Stripe keys, webhook secrets and frontend service-role JWTs. These scans do not
establish that every historical commit or external log is secret-free.

## RLS, grants and identity boundaries

All **43 public tables** inspected had RLS enabled. Anonymous SELECT grants were
limited to the service catalog, membership-plan catalog and public badge definitions.
This is a catalog/grants observation, not a substitute for individual policies.

| Data | Boundary checked |
| --- | --- |
| Customer profiles | Own-row select/edit; deployed account type and standing guard |
| Professional profiles | Own-row policies; existing self-verification protection; stronger owner/onboarding checks staged |
| Jobs and quotes | Relevant quote reads; real owner derived by quote trigger; other customer cannot accept; matching handles blocks and eligibility |
| Conversations/messages | Actual participants can send/read; unrelated customer's reads return no messages and sends fail |
| Active jobs/history/reviews | Actual customer confirms own completion; other customer denied; completed feedback saved through RPC |
| Private job/contact details | Full-price verified payment gates contact RPC; legacy fee-only contact unlock removed; direct private-detail lifecycle hardening staged |
| Membership and subscription history | No frontend insert/update/delete privileges; trial capacity tested with a real signed-in professional |
| Stripe account mappings/provision reservations | Backend-only; professionals cannot raw-read mappings; client cannot select another professional or account ID |
| Marketplace payments/receipts | Backend-only raw tables; participant-only whitelisted summary; no client financial mutation grants |
| Refund/dispute/release fields | Verified provider state updates; original quote/allocations retained; review/release holds maintained |
| Admin/verification/configuration/history | No direct frontend financial write privileges; explicit backend-only policy/grant cleanup is pending |

Three synthetic users were administratively provisioned for integration tests.
These were real Auth logins, not real email-signup acceptance tests. Email confirmation
is enabled (`mailer_autoconfirm=false`), anonymous sign-in disabled, email signup enabled.
Editable user metadata is not trusted to assign administrative roles.

Actual token duration, SMTP delivery, recovery redirect allowlisting, CAPTCHA/rate-limit
settings, MFA and hosted one-time recovery acceptance were not fully inspected through
the available configuration tools. Do not claim these settings are hardened or tested.
The login Remember-me control is not wired to a distinct session-persistence policy;
the SDK currently supplies its default persistence. Session-policy work remains.

## Edge and Stripe boundaries

All three deployed Edge Functions were reviewed. Checkout and Connect validate
users server-side and enforce ownership/eligibility; CORS is limited to the Korvo
GitHub Pages origin. CORS does not replace authorization. Financial amounts come
from the accepted quote and immutable server record, never the browser.

Webhook JWT verification is intentionally off because Stripe authenticates with
the raw-body signature. HMAC, timestamp tolerance, sandbox mode and event identity
are checked before processing. Payment/Connect events fetch current Stripe resources;
thin Connect events compare account metadata ownership with the mapping. Stale
Connect refreshes cannot overwrite newer status. Redirecting back is not completion.

Actual Stripe account creation and Checkout prove configured sandbox credentials
are present and usable; their values were never inspected or exposed. The additional
Connect signing secret is encrypted in Supabase Vault and read through a server-only
RPC. Old snapshots use the existing environment signing secret. No secret is sent to
the frontend. v5 payload-size/signature tests passed after deployment.

Original allocations are immutable. Partial/full provider refunds set review holds
and preserve originals; economic refund-component decisions remain explicit owner
policy. Replayed events, stale failures, missing amounts and wrong totals were tested.
Actual asynchronous methods, real chargeback resolution and expired Checkout delivery
are not completely accepted yet. Unit/rollback coverage does not establish provider delivery.

## Storage

`project-issue-evidence` is private, capped at 25 MiB and allows JPEG/PNG/WebP/HEIC/
HEIF/PDF/MP4. Upload policy requires an open/reviewed participant issue and the
uploader's own user-ID folder. Participant/admin reads are scoped to the issue.
No client update/delete policy was found.

Actual API tests verified permitted PNG upload, customer/professional reads, other-user
and anonymous read denial, cross-customer upload denial, owner-folder impersonation
denial, HTML rejection and authorized evidence registration. MIME declarations do not
provide malware scanning or deep file-content validation. Ordinary job-completion
proof/evidence is still separate unfinished work; issue evidence does not fulfill it.

## Verification results and limitations

| Check | Result |
| --- | --- |
| Pricing, handlers, Connect, release-readiness, source-security unit suites | 69 passed, zero failures in final local run |
| Browser suites | Professional 29; customer 26; Connect 8; payment 19; recovery 16 passed |
| Deployed payment SQL suite | 38 passed after hold migration; all fixtures rolled back |
| Deployed matching/invitation SQL suite | 56 passed after deployed payment/hold changes; rolled back |
| Initial complete authorization proposal rehearsal | 131 passed; rolled back; not deployed |
| Additional financial-admin scope rehearsal | 6 passed; rolled back; not deployed |
| Updated combined authorization suite | **134 passed October 13** in the complete rollback rehearsal, including support-role financial denial; no proposal deployed |
| Actual deployed Checkout/API runner | 26 checks passed across $100/$500/$1,000 before completing charges |
| Actual deployed Connect/API runner | 11 checks passed; one mapping; incomplete flags stay false |
| Actual webhook HTTP suite | 8 passed, repeated after v5 deployment; signed unknown test event deduplicated |
| Actual workflow/storage suite | 29 passed; correct review RPC parameter and sequential fixture use required |
| Genuine hosted/provider/payment state | $112 success and full refund; $1,120 decline then success on same PaymentIntent; $560 cancel return followed by late paid issue hold |
| Contractor transfer/bank payout | Not executed; disabled |

Harness failures corrected: wrong review parameter, assuming every existing payment
must be denied after job completion (terminal records correctly return already-paid),
global fixture row count, fieldset actionability and shared-fixture global-sign-out races.
Initial generated hardening SQL missing terminators was corrected before its successful
rehearsal. None of these failures is presented as a passing test before correction.

## Deployment blocker and next verification

Automatic approval review rejected the broad live hardening migration because it
changes privileges, RLS, triggers and many production-facing functions together.
It was not split or indirectly deployed to bypass that rejection. The proposal is
`supabase/proposals/20261012160000_harden_korvo_api_permissions.sql`.

Before any authorization deployment: obtain explicit approval, repeat the **complete
updated** rollback suite, preserve a schema/privilege snapshot, apply the approved
migration, then rerun security, matching, payment and Storage regressions and both
advisors. Do not proceed if any predeployment check fails. Roll back only reviewed
affected definitions/grants if regression occurs; never disable RLS or grant blanket
client access. No blanket automatic downgrade script is provided for sensitive grants.

Closed beta remains blocked by unresolved authorization work, financial policy,
verified Connect completion, release/refund/admin integration and final end-to-end gates.

## October 13 checkpoint

The updated full 134-check authorization rehearsal passed. The earlier expired-request
failures no longer block test verification. The broad migration remains unapplied as
Chris explicitly requested; these are proposed fixes, not deployed security remediation.
The deployed payment/matching regressions passed again (38 + 56, all rolled back).

Fresh advisors remain: seven policyless backend tables, one anonymous definer,
52 authenticated definers and leaked-password protection; performance has 33 RLS
initplan findings and 62 unused indexes. No ERROR findings were returned. Counts
of definers are warnings to audit, not proof of 53 exploitable functions. Do not
blindly delete low-traffic indexes; no unindexed-FK warning returned. Existing
critical/high authorization gates remain until reviewed changes are approved/applied.
Remediation links remain in the advisor inventory above.

Both mapped Stripe accounts were read directly in sandbox and remain incomplete:
submitted details false, payouts false, transfers inactive. The existing professional's
last status-check timestamp is null, so completed onboarding cannot be claimed.
No account was changed to manufacture success.

The separate disabled gig foundation has 45 isolated PostgreSQL checks: all eight
private tables have RLS, anon/authenticated access denied, gates false, employee
publication blocked, and duplicate/capacity/overlap/compensation guards verified.
No new schema, grant, function or policy was applied to Supabase. Concurrent
multi-session reservations and future endpoint authorization remain unverified.
See `GIG_MARKETPLACE_FOUNDATION.md` and `SPRINT_REPORT_2026-10-13.md`.

## October 13 workflow follow-up

Security Advisor was rerun: 7 policyless-table notices, 1 anonymous and 52 authenticated
SECURITY DEFINER warnings, and leaked-password protection remain. No authorization
migration, database grant, Edge Function or production frontend was deployed.
Client role checks improve normal UI behavior; they do not remediate direct Data API
permissions or replace RLS. Broad hardening still needs explicit approval.

New source fixes bind delayed message results and drafts to their original conversation,
validate saved-message identity, stage inbox reads before replacing caches, suppress
in-flight duplicate writes and verify server completion responses. Job posting rechecks
all steps/consent and current active customer profile. Onboarding checks current active
professional profile, stops sending role/verification changes, and tolerates cache errors
only after confirmed database saves.

101 unit/handler/source checks, 163 isolated browser checks and 45 isolated gig database
checks passed. The new deployed project lifecycle SQL suite passed 20 checks and rolled
back its fixtures: wrong-party/incomplete/duplicate completion/review, cancellation and
no-show disputes with held original allocations and no automatic refund or penalty.
The fixture's paid states are SQL snapshots, not new Stripe payments. Browser suites use
mock Auth/API responses, not real emails or provider onboarding. Both directly inspected
sandbox Stripe accounts still report details false, payouts false and transfers inactive.
Durable cross-reload job/message idempotency and completion evidence remain unfinished.
See `SPRINT_REPORT_2026-10-13_WORKFLOWS.md`.
