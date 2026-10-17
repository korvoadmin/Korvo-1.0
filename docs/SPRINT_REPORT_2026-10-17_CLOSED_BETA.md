# Korvo 1.0 closed-beta focus sprint — October 17 UTC / October 16 Eastern

**NO-GO for rollout or invitations.** Started from verified development checkpoint
999caa8ad700034efe37d73492228a0c348b6125, clean tree, draft PR #7. Branch remains
codex/master-launch-audit. Exact final pushed SHA and reviewed CI run are recorded in
PR #7 and the accompanying engineer response; release file hashes are pinned in
LAUNCH_RELEASE_MANIFEST.json. No production or financial authorization was inferred.

## Implemented engineering work

1. **Closed a beta data-isolation bypass.** Actual current-schema reproduction showed
   an uninvited active professional could see an admitted customer's job through both
   legacy privileged discovery RPCs, even while jobs-table RLS hid it. New A11 discovery
   SQL filters both feeds and retained opportunities/matched notifications by current
   admission, terms and allowed job scope. New outside-cohort matches/notifications
   are suppressed; project recommendations/invitations and opportunity actions are gated.
   No existing records deleted; no hosted exposure test or hosted fix claimed.
2. **Fixed a new-posting regression found by integration.** A policy self-lookup could
   not see the uncommitted inserted tuple, rejecting INSERT RETURNING. Job SELECT policy
   now evaluates row columns; RPC filters use the ID lookup. Positive actual page/SQL
   regression passes alongside outsider denials. Default-off legacy behavior preserved.
3. **Improved authentication UX.** Login now prevents duplicate in-flight requests,
   follows authoritative profile roles, rejects inactive/unsupported profiles, requests
   local signout and clears the successful-login password field. Raw exception logging
   removed. New confirmation-resend page uses documented Auth signup resend API, fixed
   existing login callback, generic account-nondisclosing responses and failure retries.
   Signup routes unconfirmed users there. No real email was sent and no settings changed.
4. **Removed a beta navigation friction point.** Dashboard beta payment link carries
   the current job in a fragment; beta UI preselects it and removes the fragment. It
   never automatically simulates, calls checkout, marks paid or authorizes release.
5. **Qualified a narrower evidence-only composition.** A10 containment now tolerates
   absent refund/finance schemas and still preserves all existing interfaces/data.
   Full and evidence-only A6/A10/A11 compositions both complete the isolated project
   journey and populated recovery. A separately hashed evidence-only review list avoids
   treating later refund/ledger deployment as a non-money beta prerequisite.
6. **Applied founder staffing deferral.** README, disabled preview, policy baseline,
   owner actions and all 144-task phase dependencies now distinguish independent project
   services from potential Korvo 2.0 employee staffing/payroll/agency/EOR work. Research
   and working disabled code retained. Full quote +12%, Korvo-paid processing and all
   membership plans unchanged. No legal/classification determination invented.

## Verification layers

| Evidence | Actual result | Limits |
| --- | --- | --- |
| Actual current-schema full A6/A10/A11 journey | 31 passed locally | Synthetic users/session rows; no genuine managed JWTs; Storage metadata/service verification fixture |
| Evidence-only composed journey/recovery | 31 passed locally without new finance schemas | Same isolated current catalog; no managed restore or Storage bytes |
| Mixed real-page/database integration | 12 passed locally | Actual posting/messages/beta pages; quote/accept via browser API calls, not full quote-form UI; fixture Auth identities |
| Discovery guard regression | 18 passed locally; ordinary CI gate added | Representative legacy-definer fixture +actual new proposal; current-schema reproduction separately above |
| Login/confirmation resend | 20 passed locally | Chromium/Auth fixtures; zero emails/invitations |
| Beta component / payment browser | 20 /22 passed locally | Linked-job privacy, no automatic payment and existing safeguards; provider/RPC fixtures |
| Accessibility | 18 default-off desktop/mobile views +two active beta views passed | Axe WCAG A/AA; actual hardware/assistive behavior unverified |
| A10 financial containment/recovery | 18 passed locally after conditional schema handling | Representative populated financial fixtures; actual transactions absent |
| Unit/source/policy/checklist | 217 passed locally before publication | Staffing deferral and fixed 10+10 scope included |
| Full ordinary nondeploy CI | Runs on the exact published development commit; final result in PR #7 | Includes all unit/browser/SQL/native/Edge checks; private catalog runners are local-only |

The mixed UI/database test uses actual staged SQL, role/RLS checks and synthetic persisted
Auth session rows; its browser bridge is not a Supabase HTTP/Auth emulator or hosted proof.
The journey proves job→quote→booking/conversation/membership→messages→simulation→evidence
metadata→customer acknowledgment→completion→support→recovery. It creates zero provider
payment rows. Image bytes, signed URLs, email delivery and complete quote UI remain gaps.
New physical-service activity, identity-document handling or screening is not authorized.

An initial harness lacked synthetic session_id rows required by the actual payment actor;
that was corrected rather than weakening authorization. Integration then exposed and fixed
the real INSERT RETURNING policy issue. All final affected local checks pass. No previously
verified 50+134 A6 qualification was repeated: current read-only metadata fingerprint remains
383b3d8392815061e2eeaf11cad3e9dd and A6 SQL is unchanged.

## Hosted and financial boundary

Read-only managed schema metadata only; no real rows exported. Previously verified Free
plan and absent usable managed recovery remain constraints. Installed tools expose no
retained-backup/PITR reader, protected dump connection or managed rehearsal facility.
A restore mutation endpoint was not used. A10's new Storage policies still need an
owner-capable managed creation/recovery path; A6's narrower scope does not resolve that.

No hosted migrations, RLS/Storage/Auth/settings changes, role grants, Edge deployment,
main merge/Pages publication, real data edits/deletes, paid purchases, Stripe transaction
or invitation occurred. The $112 full-refund component correction stays unapplied and
$560 case stays held without a demonstrated arithmetic mismatch. Neither blocks a
no-money simulation cohort; both remain later financial review work. No Connect banking
or identity information requested. No feature is claimed deployed merely because CI passes.

## Readiness / exact future approval scopes

| Gate | Verdict | Prepared scope and missing prerequisites |
| --- | --- | --- |
| A6 | STILL BLOCKED for execution | Unchanged 462-statement alternate/seven packages; protected backup, qualified managed recovery/operator, fresh drift check, explicit scope approval and hosted role/advisor acceptance |
| A8 | STILL BLOCKED | Exact root frontend manifest including login/resend/beta/navigation; approved content/support, compatible backend, explicit Pages/merge approval, served-byte and genuine signup/reset acceptance afterward |
| A10 evidence-only | STILL BLOCKED | Exact A10_non_money_evidence manifest; private evidence schema, verifier/dependencies, service facts, conditional containment/recovery; managed Storage-owner path, backup/bytes/retention and actual Edge/Storage/JWT acceptance |
| A10 financial | Later money-release scope | Full refund/ledger/reconciliation proposals and endpoints remain default-off; no correction or money-execution permission requested |
| A11 | STILL BLOCKED | Core admission/assent/simulation/support SQL +discovery SQL, checkout guard/dependencies and explicit no-money configuration; protected recovery, approved categories/cities/documents/roster, genuine hosted acceptance and separate activation scope |
| Invitations/go | NOT AUTHORIZED | All applicable above gates, staffed support/incident coverage, consent/test limits/stop criteria and explicit final founder invitation decision |

Do not combine these scopes into a blanket approval or run the entire manifest. A8/A11
release sequence must remain compatible; enabled beta containment keeps cohort enabled
and paused with server checkout prohibited. Never disable the cohort to restore checkout.

## Master checklist and phase correction

All **144 IDs/history retained**. **21 Complete, 46 In Progress, 33 Blocked,
14 Not Started, 30 Needs Verification**. Zero newly Complete. Four Needs Verification
items moved to In Progress: WEB-005, AUTH-002, JOB-006 and TEST-007. Nineteen task IDs
receive specific new implementation/testing evidence; seven staffing items become future
P2 and LEG-005 retains P1 independent-project classification review. Priority totals:
P0 99, P1 35, P2 10. This is scope correction, not increased launch completion.

BETA-008/TEST-007 no longer depend on Connect/real-money BETA-004. BETA-007 non-money
operations excludes reserve/aging clearance. Money, staffing and public-release tasks
remain in the master register. Owner actions and beta summary are synchronized.

## Minimum next steps / precise handoff

Use CLOSED_BETA_MINIMUM_GATES.md. Highest-impact next actions:

1. Engineer: qualify protected managed backup/recovery and owner-capable Storage execution
   through a separately reviewed access/operation plan; no screenshot-first request or
   paid upgrade. Fresh metadata/private captures must be reacquired if scratch is lost.
2. Founder: approve exact low-risk category/geographic scope, legal/privacy/retention and
   support operation; verified owner/MFA; roster/consent/activity limits and stop criteria.
   Staffing/payroll decisions and financial activation are not requested for this cohort.
3. Engineer after separate approvals: staged compatible A6/A11/evidence-only A10/A8 rollout
   and genuine email/quote-form/private-storage/role acceptance. Keep invitations blocked
   until final explicit go; never treat current isolated success as beta launch clearance.

New opt-in commands (private metadata outside Git; pinned isolated tool dependencies):

    NODE_PATH=/path/to/tools/node_modules node tests/beta-journey-current-schema.cjs /private/current-schema.json
    NODE_PATH=/path/to/tools/node_modules node tests/beta-journey-current-schema.cjs /private/current-schema.json --evidence-only
    NODE_PATH=/path/to/tools/node_modules node tests/beta-ui-database.browser.cjs /private/current-schema.json

Use final CI logs for unchanged suites. Outstanding safe engineering includes durable
job/message idempotency across ambiguous timeout/reload and full quote-form UI integration;
these were not silently marked complete. New scope/legal requirements must not be invented.
