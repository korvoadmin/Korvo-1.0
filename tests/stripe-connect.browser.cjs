// Browser behavior of the actual dashboard's Connect block; isolated API fixture.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const script = await fs.readFile(path.join(__dirname, '../professional-dashboard.js'), 'utf8');
  const block = script.slice(script.indexOf('  const connectStripeButton'), script.indexOf('  const accountSettingsButton'));
  const browser = await chromium.launch({ headless: true });
  let checks = 0;
  async function setup(query = '', config = {}) {
    const page = await browser.newPage();
    const calls = [], targets = [];
    await page.route('http://korvo.test/**', route => route.fulfill({ contentType: 'text/html', body:
      '<button id="connectStripeButton">Connect Stripe Payouts</button><p id="stripeConnectStatus"></p>' }));
    await page.route('https://**/*', route => { targets.push(route.request().url()); return route.abort(); });
    await page.goto('http://korvo.test/professional-dashboard.html' + query);
    await page.exposeFunction('recordAction', action => calls.push(action));
    await page.evaluate(config => {
      window.alerts = [];window.alert = message => window.alerts.push(message);
      window.korvoSupabase = {
        auth: { getSession: async () => ({ data: { session: config.loggedOut ? null : { access_token: 'fixture' } } }) },
        functions: { invoke: async (_name, options) => {
          await window.recordAction(options.body.action);
          if (options.body.action === 'status') return { data: { status: config.status || 'pending', sandbox: true } };
          await new Promise(resolve => setTimeout(resolve, 80));
          if (config.error) return { error: { context: { json: async () => ({ code: 'STRIPE_REQUEST_FAILED',
            request_id: '00000000-0000-4000-8000-000000000001', error: 'DO_NOT_RENDER_RAW' }) } } };
          return { data: { onboarding_url: config.link || 'https://accounts.stripe.com/r/fixture', sandbox: true } };
        } }
      };
    }, config);
    await page.addScriptTag({ content: block });
    return { page, calls, targets };
  }
  const check = (value, label) => { assert.ok(value, label);console.log('PASS ' + label);checks++; };
  try {
    const f = await setup('?stripe=return');
    await f.page.waitForFunction(() => document.querySelector('#stripeConnectStatus').textContent.includes('needs information'));
    check(f.calls.join() === 'status', 'return checks Stripe and does not claim completion');
    await f.page.evaluate(() => { document.querySelector('button').click();document.querySelector('button').click(); });
    await f.page.waitForTimeout(300);
    check(f.calls.filter(x => x === 'start').length === 1, 'rapid clicks create one onboarding request');
    check(f.targets[0]?.startsWith('https://accounts.stripe.com/'), 'v2 Stripe host is accepted');
    const failure = await setup('', { error: true });
    await failure.page.locator('button').click();
    await failure.page.waitForFunction(() => window.alerts.length === 1);
    const message = await failure.page.locator('#stripeConnectStatus').textContent();
    check(message.includes('Reference:') && !message.includes('DO_NOT_RENDER_RAW'), 'safe error reference replaces generic hidden error');
    check(await failure.page.locator('button').isEnabled(), 'failed request restores button');
    const refresh = await setup('?stripe=refresh');
    await refresh.page.waitForTimeout(300);
    check(refresh.calls.join() === 'start' && refresh.targets.length === 1, 'expired link gets a fresh onboarding link once');
    const bad = await setup('', { link: 'https://accounts.stripe.com.evil.test/' });
    await bad.page.locator('button').click();await bad.page.waitForFunction(() => window.alerts.length === 1);
    check(bad.targets.length === 0, 'lookalike Stripe host is denied');
    const loggedOut = await setup('', { loggedOut: true });
    await loggedOut.page.locator('button').click();await loggedOut.page.waitForFunction(() => window.alerts.length === 1);
    check(loggedOut.calls.length === 0, 'missing session never invokes onboarding');
    console.log(`${checks} Connect browser checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error.message);process.exitCode = 1; });
