# Professional opportunity dashboard checks

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
```

Optionally set `KORVO_SCREENSHOT=/tmp/korvo-opportunities.png` to capture the
opportunity section at desktop and mobile widths. These images contain test data.

Backend integration checks remain in `supabase/tests/job_opportunities.sql`.
