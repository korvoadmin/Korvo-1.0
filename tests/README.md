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
applied, split, or automatically moved into migrations without explicit approval.

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
