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

Afterward, administratively remove only these fixtures by their recorded UUIDs:
their jobs first, then their `public.profiles`, then `auth.users`. The profile-to-Auth
foreign key does not cascade. Verify fixture removal and delete the credential file,
even when a test fails. The runner does not perform privileged cleanup itself.
