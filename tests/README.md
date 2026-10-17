# Opportunity dashboard checks

The browser test loads the actual dashboard HTML, CSS, and JavaScript with an
isolated Supabase client fixture. It makes no live API calls, creates no accounts,
and sends no notifications. It verifies integration with the existing quote form,
server-owned opportunity state, failure recovery, safe rendering, persistent read
actions, rapid clicks, and mobile overflow. This does not replace a signed-in
end-to-end acceptance test against Supabase.

Run from the repository root with Node.js and Playwright 1.56.1:

```sh
npm install --prefix /tmp/korvo-ui-tests --no-audit --no-fund playwright@1.56.1
node /tmp/korvo-ui-tests/node_modules/playwright/cli.js install chromium
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/professional-opportunities.browser.cjs
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/customer-professionals.browser.cjs
```

Optionally set `KORVO_SCREENSHOT=/tmp/korvo-opportunities.png` to capture the
opportunity section at desktop and mobile widths. These images contain test data.

Backend integration checks remain in `supabase/tests/job_opportunities.sql`.

## Optional real signed-in acceptance test

`customer-professionals.acceptance.cjs` serves the actual local dashboard source
with the real Supabase SDK. It signs two temporary accounts in through Auth, creates
a job via the Data API, invites the professional in the customer UI, views and quotes
in the professional UI, and accepts in the customer UI. It signs both accounts out
globally at the end, including on test failure.

This runner changes the configured database. Provision two dedicated temporary
accounts administratively with confirmed `@example.invalid` email addresses, complete
customer/professional profiles, and a unique professional service named
`Korvo acceptance <UUID>`. Do not use existing user accounts. Store the fixture in a
restricted temporary JSON file containing `customer_id`, `customer_email`,
`professional_id`, `professional_email`, `password`, and `service`. Never commit it.
Download the SDK already used by `supabase.js` to a temporary file, then run:

```sh
NODE_PATH=/tmp/korvo-ui-tests/node_modules \
  KORVO_ACCEPTANCE_FIXTURE=/tmp/korvo-acceptance.json \
  KORVO_SUPABASE_SDK=/tmp/korvo-supabase-sdk.js \
  node tests/customer-professionals.acceptance.cjs
```

Afterward, sign fixtures out globally, retain and deactivate the recorded synthetic
users, and remove only the temporary credential file. Deleting users, jobs, uploads
or Stripe accounts requires Chris's explicit approval under the current sprint rules.
Record fixture IDs in the sprint report; never commit credentials. Run runners using
the same accounts sequentially because global sign-out invalidates other test sessions.

## Stripe Connect sandbox checks

```sh
node --experimental-transform-types --test tests/stripe-connect.test.mjs
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/stripe-connect.browser.cjs
```

Run `supabase/tests/connect_eligibility.sql` as an administrative rollback-only SQL
check. The function and browser suites above use isolated fixtures and do not call
Stripe. See `docs/stripe-connect-diagnostic.md` for the real sandbox acceptance
results, deployment scope, security findings, and manual verification steps.

## Payment and recovery regression checks

```sh
node --experimental-transform-types --test tests/*.test.mjs
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/marketplace-payments.browser.cjs
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/password-recovery.browser.cjs
```

The GitHub `Korvo regression checks` workflow runs isolated unit/source and five
browser suites. It does not deploy or use Stripe/Supabase secrets. SQL integration
tests run with administrative access and roll back all fixture changes.

The `supabase/proposals` authorization migration is deliberately outside the normal
migration directory. It was rejected by automatic approval review and must not be
applied or automatically moved into migrations without explicit approval. Chris later
authorized review-only splitting: ordered packages remain under proposals/security-review
and are not independent deployment approvals.

Opt-in real sandbox runners require private administrator-provisioned fixture files:

```sh
KORVO_ACCEPTANCE_FIXTURE=/private/fixture.json python tests/sandbox-payment-acceptance.py
KORVO_ACCEPTANCE_FIXTURE=/private/fixture.json python tests/sandbox-connect-acceptance.py
NODE_PATH=/tmp/korvo-ui-tests/node_modules KORVO_ACCEPTANCE_FIXTURE=/private/fixture.json node tests/stripe-checkout-hosted.browser.cjs
KORVO_WEBHOOK_SIGNING_FIXTURE=/private/signing-fixture.json python tests/sandbox-webhook-acceptance.py
KORVO_ACCEPTANCE_FIXTURE=/private/fixture.json python tests/sandbox-workflow-acceptance.py
```

Provision synthetic `@example.invalid` users and a unique `Korvo acceptance <UUID>`
service. Payment preparation requires enough fixture membership capacity for three
accepted quotes. The hosted runner accepts only the recorded sandbox session and
documented Stripe test cards; `KORVO_TEST_QUOTE=1000 KORVO_TEST_CARD_SCENARIO=decline`
tests insufficient funds; `KORVO_TEST_CARD_SCENARIO=cancel` tests returning unpaid.
Verify provider and database state separately after hosted success. Never run these
against real users, live Stripe, or previously refunded/closed fixtures expecting a
new Checkout session. Workflow evidence records remain retained for approved cleanup.

Recovery browser tests use an isolated Auth fixture. Actual email delivery, redirect
allowlisting, and one-time token consumption remain separate acceptance requirements.

## Disabled gig foundation

```sh
node --experimental-transform-types --test tests/*.test.mjs
npm install --prefix /tmp/korvo-ui-tests --no-audit --no-fund playwright@1.56.1 @electric-sql/pglite@0.3.14
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/gig-foundation.browser.cjs
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/gig-database.cjs
```

The gig browser runner serves local source and performs no backend writes. PGlite
creates a disposable isolated PostgreSQL schema with mock account profiles/roles;
it checks grants/RLS/gates and sequential reservations. It does not replace real
concurrent PostgreSQL, Supabase Auth or hosted payroll/payment acceptance. The SQL
proposal stays outside automatic migrations, and no gig booking is enabled.

## Project workflow reliability

```sh
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/workflow-reliability.browser.cjs
```

Loads actual posting/onboarding/messaging HTML/CSS/JavaScript with isolated Auth/API
fixtures. Covers submit validation, consent, active account separation, duplicate
clicks, delayed-response thread isolation, per-conversation drafts, failed/empty saves,
cache failures and mobile widths. Expanded dashboard suites cover verified completion
responses and successful-write/failed-refresh recovery. No real message is sent.

`supabase/tests/project_lifecycle.sql` is an administrative transaction rehearsal
against the deployed database. It creates synthetic Auth/profile/job/review/issue
fixtures and SQL-only paid snapshots, performs assertions, then rolls everything back.
Run only through an administrative connection in the authorized sandbox project. It
must never be used to manufacture payment success for a real job. It needs no API keys,
creates no real Stripe charge/refund/transfer and grants no access to auth.sessions.

## Completion evidence and administrative refund review (unapplied)

```sh
npm install --prefix /tmp/korvo-ui-tests --no-audit --no-fund @electric-sql/pglite@0.3.14 sharp@0.34.5
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/evidence-refund-database.cjs
NODE_PATH=/tmp/korvo-ui-tests/node_modules node tests/completion-evidence-decoder.cjs
node --experimental-transform-types --test tests/*.test.mjs
```

The database runner executes the actual proposals in disposable PostgreSQL with
synthetic profiles, admin flags, Storage tables and an actor stub. It tests database
permissions, transitions and idempotency, not real Auth session validation or hosted
Storage. The decoder suite fully decodes local PNG/JPEG/WebP fixtures with Sharp.
Sharp is a test adapter, not an Edge-compatible deployment choice. The server core
requires a trusted full decoder and fails closed without one. A JWT-authenticated Edge adapter and dashboard integration are staged and locally
tested. Actual hosted uploads, managed runtime/Storage acceptance and postdeployment
regression remain unfinished. No proposal is in automatic migrations.

## Authoritative master launch register

```sh
python scripts/check_launch_checklist.py
python scripts/check_launch_checklist.py --sync-counts
node --test tests/launch-checklist.test.mjs
```

Markdown is the sole task/status register. The checker validates 14 sections, IDs,
counts, evidence/dependencies and stable owner links; count synchronization writes only
when the full register is valid. These documentation tests are not product acceptance.

## Execution sprint evidence/recovery/refund tests

Install pinned `@imagemagick/magick-wasm@0.0.44` alongside the existing isolated tools.
Run `evidence-wasm-decoder.cjs`, `security-recovery.cjs`,
`completion-evidence.browser.cjs` and `admin-refunds.browser.cjs` with NODE_PATH set
to that tools directory. Unit discovery includes `evidence-endpoint.test.mjs`.
CI also type-checks the staged endpoint with Deno 2.5.6 and the pinned Supabase SDK.

Recovery snapshots and generated inverses contain operational definitions and MUST
stay outside Git with restricted permissions. The CLI writes a reviewed script only;
it never connects to or mutates Supabase. Full hosted inverse/Storage/Edge/concurrent
acceptance are separate from these local results. See the A6 and evidence rollout docs.

## Launch blocker sprint: financial accounting and current-schema recovery

`financial-ledger.cjs` executes actual disabled ledger/review SQL in disposable PGlite
(36 assertions). `financial-reconciliation.test.mjs` covers trusted GET-only provider
facts, full versus partial legacy refund allocations, timeouts, duplicate matches and
pagination. Refund objects can omit livemode: trusted API context must establish sandbox.
No runner licenses a provider retry, executes a refund or changes payment holds.

`security-current-schema.cjs /private/catalog.json` is opt-in and LOCAL ONLY. Obtain the
read-only SNAPSHOT_QUERY and CLONE_QUERY results privately, combine as `{before,clone}`,
store outside Git mode 0600. The clone reads no user rows; confirmed public membership
catalog and synthetic account fixtures are setup. Thirteen current-schema assertions
and the 134-check role matrix pass. Never upload this snapshot as a CI artifact.
Managed Supabase roles/Storage/extension behavior remain separate qualification.

The `financial-concurrency` CI job uses an immutable PostgreSQL image in a disposable
local service. `financial-concurrency.cjs` and `gig-concurrency.cjs` require CI=true,
localhost and the dedicated test database; there is no production connection option.
They verify actual blocked independent sessions, duplicate preparation/observations,
capacity, overlap and transaction rollback. Activity polling must be outside the
blocking transaction so statistics snapshots refresh. Full native results are in the
latest sprint report, not inferred from these scripts existing.

`evidence-deno-runtime.mjs` runs the actual adapter through local Deno HTTP with real
JPEG/PNG/WebP pixels and fixture Auth/Storage. It is not hosted Edge acceptance. See CI
for the bounded loopback-only network/read permissions and pinned decoder binary.
