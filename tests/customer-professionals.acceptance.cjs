// Opt-in live API acceptance runner. Use only explicitly provisioned temporary
// @example.invalid test accounts and remove them after the run. No credentials
// belong in the repository. The dashboard source is served locally; Auth and
// Data API requests use the actual configured Supabase project.
const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');

(async () => {
  if (!process.env.KORVO_ACCEPTANCE_FIXTURE || !process.env.KORVO_SUPABASE_SDK) throw new Error('Temporary fixture and downloaded SDK paths are required.');
  const fixture = JSON.parse(await fs.readFile(process.env.KORVO_ACCEPTANCE_FIXTURE, 'utf8'));
  assert.ok(fixture.customer_email.endsWith('@example.invalid') && fixture.professional_email.endsWith('@example.invalid'));
  assert.match(fixture.service, /^Korvo acceptance [a-f0-9-]{36}$/);
  const proxyUrl = process.env.HTTPS_PROXY && new URL(process.env.HTTPS_PROXY);
  const browser = await chromium.launch({ headless: true, ...(proxyUrl ? { proxy: {
    server: `${proxyUrl.protocol}//${proxyUrl.host}`, username: decodeURIComponent(proxyUrl.username), password: decodeURIComponent(proxyUrl.password)
  } } : {}) });
  const pages = [];
  const allowed = new Set(['supabase.js','customer-dashboard.html','customer-dashboard.js','customer-dashboard.css','customer-professionals.js',
    'professional-dashboard.html','professional-dashboard.js','professional-dashboard.css','professional-opportunities.js']);
  async function login(email, id) {
    const context = await browser.newContext({ ignoreHTTPSErrors: true });
    const page = await context.newPage(); pages.push(page);
    await page.route('http://korvo.test/**', async route => {
      const file = new URL(route.request().url()).pathname.slice(1);
      if (file === 'acceptance-login') return route.fulfill({ contentType: 'text/html', body: '<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script><script src="supabase.js"></script>' });
      if (!allowed.has(file)) return route.fulfill({ status: 404, body: '' });
      await route.fulfill({ body: await fs.readFile(path.join(root, file)), contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/javascript' });
    });
    await page.route('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2', async route => route.fulfill({ contentType: 'application/javascript', body: await fs.readFile(process.env.KORVO_SUPABASE_SDK) }));
    await page.goto('http://korvo.test/acceptance-login');
    await page.waitForFunction(() => typeof korvoSupabase !== 'undefined');
    const result = await page.evaluate(async ({ email, password }) => {
      const { data, error } = await korvoSupabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(`Test sign-in failed: ${error.message}`);
      return data.user.id;
    }, { email, password: fixture.password });
    assert.equal(result, id);
    return page;
  }
  let checks = 0;
  const check = (value, message) => { assert.ok(value, message); checks++; console.log(`PASS ${message}`); };
  try {
    const customer = await login(fixture.customer_email, fixture.customer_id);
    const pro = await login(fixture.professional_email, fixture.professional_id);
    check(true, 'temporary customer and professional sign in through actual Supabase Auth');
    const jobId = await customer.evaluate(async f => {
      const { data, error } = await korvoSupabase.from('jobs').insert({ customer_id: f.customer_id,
        title: 'Korvo temporary acceptance test', description: 'Automated isolated acceptance test; not a real customer request.',
        category: f.service, city: 'Atlanta', state: 'GA', status: 'open', budget_min: 100, budget_max: 250 }).select('id').single();
      if (error) throw new Error(`Test job failed: ${error.message}`);
      return data.id;
    }, fixture);
    await customer.goto('http://korvo.test/customer-dashboard.html');
    await customer.waitForFunction(() => document.getElementById('customerRecommendationsList').getAttribute('aria-busy') === 'false');
    const invite = customer.locator(`[data-professional-id="${fixture.professional_id}"]`);
    check(await invite.count() === 1 && await invite.isEnabled(), 'signed-in customer sees the matching temporary professional');
    await invite.click();
    await customer.waitForFunction(() => document.getElementById('customerProfessionalsStatus').textContent.startsWith('Invitation sent.'));
    check(await invite.isDisabled(), 'real invitation persists and disables repeat invite');
    await pro.goto('http://korvo.test/professional-dashboard.html');
    await pro.waitForFunction(() => document.getElementById('matchedOpportunitiesList').getAttribute('aria-busy') === 'false');
    check((await pro.locator('#matchedOpportunitiesList').textContent()).includes('Customer invitation'), 'professional receives the real invitation in the opportunity feed');
    await pro.locator('#matchedOpportunitiesList [data-action="view"]').click();
    await pro.locator('#infoModalDoneButton').click();
    await customer.locator('#refreshCustomerProfessionals').click();
    await customer.waitForFunction(() => document.getElementById('customerOpportunityActivity').textContent.includes('Viewed'));
    check(true, 'customer sees professional viewed status from actual database');
    await pro.waitForFunction(() => document.getElementById('matchedOpportunitiesList').getAttribute('aria-busy') === 'false');
    await pro.locator('#matchedOpportunitiesList [data-action="quote"]').click();
    await pro.locator('#quoteAmount').fill('150');
    await pro.locator('#quoteTimeframe').selectOption('Same day');
    await pro.locator('#quoteMessage').fill('Temporary acceptance test quote.');
    await pro.locator('#quoteForm button[type="submit"]').click();
    await pro.locator('#infoModalTitle').filter({ hasText: 'Quote Submitted!' }).waitFor();
    check(true, 'real quote submitted through the professional dashboard');
    await customer.locator('#refreshCustomerProfessionals').click();
    await customer.waitForFunction(() => document.getElementById('customerOpportunityActivity').textContent.includes('Quoted'));
    await customer.locator('#customerOpportunityActivity [data-quote-id]').click();
    await customer.locator('#quotesList .generated-accept-quote-button').click();
    await customer.locator('#confirmAcceptQuoteButton').click();
    await customer.locator('#infoModalTitle').filter({ hasText: 'Professional Selected!' }).waitFor();
    check((await customer.locator('#customerProfessionalsStatus').textContent()).includes('closed'), 'customer accepts quote and invitations close in the live backend');
    const result = await customer.evaluate(async id => {
      const { data, error } = await korvoSupabase.from('active_jobs').select('job_id,status').eq('job_id', id).single();
      if (error) throw new Error(error.message);
      return data;
    }, jobId);
    check(result.job_id === jobId && result.status === 'active', 'acceptance created the real active job');
    console.log(`${checks} signed-in acceptance checks passed. Temporary accounts and job require administrative cleanup.`);
  } finally {
    for (const page of pages) {
      try { await page.evaluate(async () => { if (typeof korvoSupabase !== 'undefined') await korvoSupabase.auth.signOut({ scope: 'global' }); }); } catch {}
    }
    await browser.close();
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
