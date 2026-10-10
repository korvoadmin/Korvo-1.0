// Run with Playwright 1.56.1 and Chromium installed. No real accounts or network
// calls are used: this loads the real dashboard against an isolated client fake.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function installClient() {
  const date = '2026-10-10T12:00:00Z';
  const opportunity = (id, status = 'offered', extra = {}) => ({
    opportunity_id: `o${id}`, job_id: `j${id}`, title: `Curtain installation ${id}`,
    category: 'Drapery Installation', city: 'Atlanta', state: 'GA', budget_min: 200, budget_max: 400,
    job_status: 'open', opportunity_status: status, match_score: 90 - id,
    matched_at: date, invited_at: null, viewed_at: null, passed_at: null, quoted_at: null,
    can_quote: ['offered', 'viewed'].includes(status), reason_code: null, created_at: date, ...extra
  });
  window.fixture = {
    feed: [opportunity(1, 'offered', { title: 'Curtain <img src=x onerror=alert(1)>' }),
      opportunity(2, 'offered', { invited_at: date }), opportunity(3, 'passed', { reason_code: 'opportunity_passed' }),
      opportunity(4, 'quoted', { reason_code: 'already_quoted' }),
      opportunity(5, 'closed', { job_status: 'completed', reason_code: 'opportunity_closed' }),
      opportunity(6, 'offered', { can_quote: false, reason_code: 'membership_unavailable' })],
    notifications: [1, 2].map(id => ({ id: `n${id}`, user_id: 'pro-1',
      type: id === 2 ? 'job_invitation' : 'matched_job', title: id === 2 ? 'Customer invitation' : 'Job match',
      body: 'Review this job in Korvo.', opportunity_id: `o${id}`, job_id: `j${id}`, created_at: date, read_at: null })),
    quotes: [], calls: [], failFeed: false, failResponse: false, failNotifications: false,
    failQuote: false, failDetails: false, authenticated: true
  };
  const f = window.fixture;
  f.jobs = f.feed.map(item => ({ id: item.job_id, title: item.title,
    description: `Full customer description for ${item.job_id}`, category: item.category,
    city: item.city, state: item.state, budget_min: 200, budget_max: 400,
    preferred_date: '2026-10-15', timeframe: 'This week', status: item.job_status, reference: `KRV-${item.job_id}` }));
  f.jobs.push({ id: 'unmatched', title: 'Other open job', category: 'Cleaning', status: 'open', city: 'Atlanta', state: 'GA' });
  const copy = value => JSON.parse(JSON.stringify(value));
  class Query {
    constructor(table) { this.table = table; this.filters = []; }
    select(columns, options = {}) { this.options = options; return this; }
    eq(name, value) { this.filters.push([name, value]); return this; }
    is(name, value) { return this.eq(name, value); }
    order() { return this; }
    limit() { return this; }
    single() { this.one = true; return this; }
    maybeSingle() { this.one = true; return this; }
    update(value) { this.updateValue = value; return this; }
    insert(value) { this.insertValue = value; return this; }
    then(resolve, reject) { return this.run().then(resolve, reject); }
    async run() {
      f.calls.push({ table: this.table, filters: this.filters, insert: this.insertValue, update: this.updateValue });
      let rows = [];
      if (this.table === 'profiles') return { data: { first_name: 'Test', last_name: 'Pro', account_type: 'professional', onboarding_complete: true }, error: null };
      if (this.table === 'professional_profiles') return { data: { business_name: 'Test Installations', services: ['Curtain Installation'] }, error: null };
      if (this.table === 'jobs') {
        if (f.failDetails && this.one) return { data: null, error: { message: 'No access' } };
        rows = f.jobs;
      }
      if (this.table === 'quotes') {
        if (this.insertValue) {
          if (f.failQuote) return { data: null, error: { message: 'Quotes require an open job' } };
          const row = { ...this.insertValue, id: 'q1', job_title: 'Saved quote job', status: 'pending', created_at: date };
          f.quotes.push(row);
          const item = f.feed.find(item => item.job_id === row.job_id);
          if (item) Object.assign(item, { opportunity_status: 'quoted', can_quote: false, reason_code: 'already_quoted' });
          return { data: copy(row), error: null };
        }
        rows = f.quotes;
      }
      if (this.table === 'notifications') {
        if (f.failNotifications) return { error: { message: 'Offline' } };
        rows = f.notifications;
      }
      rows = rows.filter(row => this.filters.every(([name, value]) => row[name] === value));
      if (this.updateValue) rows.forEach(row => Object.assign(row, this.updateValue));
      return { data: this.options?.head ? null : copy(this.one ? rows[0] || null : rows), count: rows.length, error: null };
    }
  }
  window.korvoSupabase = {
    auth: { getUser: async () => ({ data: { user: f.authenticated ? { id: 'pro-1' } : null }, error: null }) },
    from: table => new Query(table),
    rpc: async (name, args) => {
      f.calls.push({ rpc: name, args });
      if (name === 'my_job_opportunities') return f.failFeed ? { error: { message: 'Offline' } } : { data: copy(f.feed), error: null };
      if (name !== 'respond_to_job_opportunity') throw new Error(`Unexpected RPC: ${name}`);
      if (f.failResponse) return { error: { message: 'Not authorized' } };
      const item = f.feed.find(item => item.opportunity_id === args.p_opportunity_id);
      if (args.p_action === 'pass') Object.assign(item, { opportunity_status: 'passed', can_quote: false, reason_code: 'opportunity_passed', passed_at: date });
      else if (item.opportunity_status === 'offered') item.opportunity_status = 'viewed';
      item.viewed_at = date;
      f.notifications.filter(n => n.opportunity_id === item.opportunity_id).forEach(n => { n.read_at = date; });
      return { data: { status: item.opportunity_status, viewed_at: date, passed_at: item.passed_at }, error: null };
    }
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  let checks = 0;
  const check = (condition, message) => { assert.ok(condition, message); checks++; console.log(`PASS ${message}`); };
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(installClient);
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    const file = url.pathname.slice(1);
    if (url.hostname !== 'korvo.test' || file === 'supabase.js') return route.fulfill({ body: '', contentType: 'application/javascript' });
    const allowed = ['professional-dashboard.html', 'professional-dashboard.css', 'professional-dashboard.js', 'professional-opportunities.js'];
    if (!allowed.includes(file)) return route.fulfill({ status: 404, body: '' });
    return route.fulfill({ body: await fs.readFile(path.join(root, file)), contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/javascript' });
  });
  const card = id => page.locator(`#matchedOpportunitiesList [data-opportunity-id="${id}"]`);
  const ready = () => page.waitForFunction(() => document.getElementById('matchedOpportunitiesList').getAttribute('aria-busy') === 'false');
  const closeInfo = () => page.locator('#infoModalDoneButton').click();
  const refresh = async () => { await page.locator('#refreshOpportunitiesButton').click(); await ready(); };
  try {
    await page.goto('http://korvo.test/professional-dashboard.html');
    await ready();
    check(await page.locator('.opportunity-card').count() === 3, 'current feed hides passed, quoted and closed history');
    check(await page.locator('.opportunity-card').first().getAttribute('data-opportunity-id') === 'o2', 'customer invitation is labeled and sorted first');
    check(await card('o1').locator('img').count() === 0 && (await card('o1').textContent()).includes('<img'), 'customer title is escaped, not executed');
    check(await card('o6').locator('[data-action="quote"]').isDisabled(), 'server eligibility disables quote with membership explanation');
    check(await page.locator('#notificationCount').textContent() === '2', 'bell uses persisted unread count');
    if (process.env.KORVO_SCREENSHOT) await page.locator('#matchedOpportunitiesSection').screenshot({ path: process.env.KORVO_SCREENSHOT.replace('.png', '-desktop.png'), style: '.site-header { visibility: hidden !important; }' });

    await card('o1').locator('[data-action="view"]').click(); await ready();
    check((await page.locator('#infoModalMessage').textContent()).includes('Full customer description for j1'), 'view loads the correct full job description');
    check(await page.locator('#notificationCount').textContent() === '1', 'view marks related alert read');
    await closeInfo();
    await page.reload(); await ready(); // fixture resets on reload, so persistence assertions use fresh reads below.
    page.once('dialog', dialog => dialog.dismiss());
    await card('o1').locator('[data-action="pass"]').click();
    check(await page.evaluate(() => fixture.feed[0].opportunity_status) === 'offered', 'cancelled pass saves nothing');
    page.once('dialog', dialog => dialog.accept());
    await card('o1').locator('[data-action="pass"]').click(); await ready();
    check(await card('o1').count() === 0, 'confirmed pass removes current card');
    await page.locator('#opportunityFilter').selectOption('history');
    check((await card('o1').textContent()).includes('Passed') && await card('o1').locator('[data-action="quote"]').count() === 0, 'passed history cannot be quoted from opportunity card');
    await refresh();
    check(await card('o1').count() === 1, 'pass survives a new server feed read');
    await page.locator('#opportunityFilter').selectOption('current');

    await page.locator('#notificationsList [data-opportunity-id="o2"]').click(); await ready();
    check((await page.locator('#infoModalMessage').textContent()).includes('for j2'), 'invitation notification opens its own job');
    await closeInfo();
    await card('o2').locator('[data-action="quote"]').click(); await ready();
    check(await page.locator('#selectedJobReference').inputValue() === 'j2', 'quote form receives job ID rather than opportunity ID');
    await page.locator('#quoteAmount').fill('275');
    await page.locator('#quoteTimeframe').selectOption('Same day');
    await page.locator('#quoteMessage').fill('Installation and cleanup included.');
    await page.locator('#quoteForm button[type="submit"]').click();
    await page.waitForFunction(() => fixture.quotes.length === 1); await ready();
    check(await page.evaluate(() => fixture.quotes[0].job_id === 'j2' && fixture.quotes[0].professional_id === 'pro-1'), 'existing quote submission saves canonical job and signed-in professional');
    await closeInfo();
    check(await card('o2').count() === 0, 'successful quote refreshes opportunity feed');
    await page.locator('#opportunityFilter').selectOption('history');
    check((await card('o2').textContent()).includes('Quoted'), 'only saved quote produces Quoted history');
    await page.locator('#opportunityFilter').selectOption('current');

    await page.evaluate(() => { fixture.feed[5].can_quote = true; fixture.feed[5].reason_code = null; }); await refresh();
    await page.evaluate(() => { fixture.feed[5].can_quote = false; fixture.feed[5].reason_code = 'job_not_open'; });
    await card('o6').locator('[data-action="quote"]').click(); await ready();
    check(await page.locator('#quoteModal').isHidden() && (await page.locator('#infoModalMessage').textContent()).includes('no longer accepting'), 'stale eligibility is checked before opening quote form');
    await closeInfo();
    await page.evaluate(() => { fixture.failResponse = true; });
    page.once('dialog', dialog => dialog.accept());
    await card('o6').locator('[data-action="pass"]').click(); await ready();
    check(await page.evaluate(() => fixture.feed[5].opportunity_status) === 'offered', 'failed pass does not claim a saved response');
    await closeInfo();
    await page.evaluate(() => { fixture.failResponse = false; fixture.failFeed = true; }); await refresh();
    check((await page.locator('#opportunityStatus').textContent()).includes('could not be loaded') && await page.locator('.opportunity-card').count() === 0, 'feed error replaces stale cards with retry state');
    await page.evaluate(() => { fixture.failFeed = false; }); await refresh();
    check(await card('o6').count() === 1, 'refresh recovers from feed failure');

    await page.evaluate(() => { fixture.notifications[0].read_at = null; }); await refresh();
    await page.locator('#markAllReadButton').click();
    await page.waitForFunction(() => document.getElementById('notificationCount').textContent === '0');
    await refresh();
    check(await page.evaluate(() => fixture.notifications.every(n => n.read_at)), 'mark all read persists through fresh reads');
    check(await page.evaluate(() => fixture.calls.filter(c => c.table === 'notifications').every(c => c.filters.some(([k,v]) => k === 'user_id' && v === 'pro-1'))), 'notification reads and writes are scoped to signed-in professional');
    await page.evaluate(() => { fixture.failNotifications = true; }); await refresh();
    check(await page.locator('#notificationCount').textContent() === '—' && await page.locator('#markAllReadButton').isDisabled(), 'notification errors do not show a false zero');
    await page.evaluate(() => { fixture.failNotifications = false; }); await refresh();

    await page.locator('#availableJobsList [data-job-id="unmatched"].submit-quote-button').click();
    check(await page.locator('#selectedJobReference').inputValue() === 'unmatched', 'unmatched open jobs retain the original quote flow');
    await page.locator('#cancelQuoteButton').click();

    // Quote rejection after opening the form must not manufacture quoted history.
    await page.evaluate(() => { fixture.feed[5].can_quote = true; fixture.feed[5].reason_code = null; fixture.failQuote = true; }); await refresh();
    await card('o6').locator('[data-action="quote"]').click(); await ready();
    await page.locator('#quoteAmount').fill('200');
    await page.locator('#quoteTimeframe').selectOption('Same day');
    await page.locator('#quoteMessage').fill('Fixtures only.');
    await page.locator('#quoteForm button[type="submit"]').click();
    await page.locator('#infoModalTitle').filter({ hasText: 'Could Not Submit Quote' }).waitFor();
    check(await page.evaluate(() => fixture.feed[5].opportunity_status === 'viewed' && fixture.quotes.length === 1), 'server quote rejection never produces quoted history');
    await closeInfo(); await page.locator('#cancelQuoteButton').click();
    await page.evaluate(() => { fixture.failQuote = false; fixture.failDetails = true; });
    await card('o6').locator('[data-action="view"]').click(); await ready();
    check((await page.locator('#infoModalTitle').textContent()).includes('unavailable'), 'denied job detail read shows an error rather than cached private details');
    await closeInfo();
    await page.evaluate(() => { fixture.failDetails = false; fixture.calls = []; });
    await card('o6').locator('[data-action="view"]').evaluate(button => { button.click(); button.click(); }); await ready();
    check(await page.evaluate(() => fixture.calls.filter(call => call.rpc === 'respond_to_job_opportunity').length === 1), 'repeated clicks issue only one response request');
    await closeInfo();
    await page.reload(); await ready();
    await page.setViewportSize({ width: 375, height: 812 });
    await page.locator('#matchedOpportunitiesSection').scrollIntoViewIfNeeded();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile layout has no horizontal overflow');
    if (process.env.KORVO_SCREENSHOT) await page.locator('#matchedOpportunitiesSection').screenshot({ path: process.env.KORVO_SCREENSHOT, style: '.site-header { visibility: hidden !important; }' });
    check(errors.length === 0, `dashboard has no uncaught JavaScript errors: ${errors.join(', ')}`);
    console.log(`${checks} browser checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
