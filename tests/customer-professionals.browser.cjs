const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function installClient() {
  const now = '2026-10-11T08:00:00Z';
  const jobs = ['j1', 'j2', 'closed'].map(id => ({ id, title: id === 'j1' ? 'Install curtains' : id === 'j2' ? 'Paint hallway' : 'Completed cleaning',
    customer_id: 'customer', category: id === 'j1' ? 'Drapery Installation' : 'Painting', status: id === 'closed' ? 'completed' : 'open', city: 'Atlanta', state: 'GA', created_at: now }));
  const pro = (id, extra = {}) => ({ professional_id: id, business_name: `Business ${id}`, services: ['Curtain Installation'],
    verification_status: 'Not Verified', average_rating: null, review_count: 0, completed_jobs: 0,
    preferred_area_match: false, can_quote: true, has_quote: false, ...extra });
  const activity = (id, extra = {}) => ({ opportunity_id: `o-${id}`, professional_id: id, business_name: `Business ${id}`,
    status: 'offered', matched_at: now, invited_at: null, viewed_at: null, passed_at: null, quoted_at: null, quote_id: null, ...extra });
  window.fixture = { jobs, quotes: [], active: [], calls: [], failRead: false, failJobs: false, failInvite: false, failAfterSend: false, delay: {},
    snapshots: {
      j1: { job: jobs[0], invitation_limit: 5, invitations_used: 1, can_invite: true,
        recommendations: [pro('p1', { business_name: '<img src=x onerror=alert(1)> Installations', average_rating: 4.8, review_count: 12, completed_jobs: 9, verification_status: 'Verified' }),
          pro('p2'), pro('p3'), pro('p4', { has_quote: true }), pro('p5', { can_quote: false }), pro('p6')],
        activity: [activity('p1'), activity('p2', { invited_at: now }), activity('p3', { status: 'passed', passed_at: now }), activity('p4', { status: 'quoted', quoted_at: now, quote_id: 'q1' })] },
      j2: { job: jobs[1], invitation_limit: 5, invitations_used: 0, can_invite: true, recommendations: [pro('p7')], activity: [] },
      closed: { job: jobs[2], invitation_limit: 5, invitations_used: 1, can_invite: false, recommendations: [], activity: [activity('p8', { status: 'closed', invited_at: now, closed_at: now, business_name: null })] }
    }
  };
  const f = window.fixture;
  f.quotes = [{ id: 'q1', job_id: 'j1', customer_id: 'customer', professional_id: 'p4', professional_name: 'Business p4', amount: 200, timeframe: 'Same day', message: 'Installation', status: 'pending', job_title: 'Install curtains', created_at: now }];
  const clone = x => JSON.parse(JSON.stringify(x));
  class Query {
    constructor(table) { this.table = table; this.filters = []; }
    select() { return this; }
    eq(name, value) { this.filters.push([name, value]); return this; }
    order() { return this; }
    then(resolve, reject) { return this.run().then(resolve, reject); }
    async run() {
      if (this.table === 'jobs' && f.failJobs) return { error: { message: 'Offline' } };
      const data = ({ jobs: f.jobs, quotes: f.quotes, active_jobs: f.active, reviews: [] })[this.table] || [];
      return { data: clone(data.filter(row => this.filters.every(([k,v]) => row[k] === v))), error: null };
    }
  }
  window.korvoSupabase = {
    auth: { getUser: async () => ({ data: { user: { id: 'customer' } }, error: null }) },
    from: table => new Query(table),
    rpc: async (name, args) => {
      f.calls.push({ name, args });
      if (name === 'customer_job_professionals') {
        const result = clone(f.snapshots[args.p_job_id]);
        if (f.delay[args.p_job_id]) await new Promise(resolve => setTimeout(resolve, f.delay[args.p_job_id]));
        return f.failRead ? { error: { message: 'Offline' } } : { data: result, error: null };
      }
      if (name === 'invite_professional_to_job') {
        if (f.failInvite) return { error: { message: 'This professional cannot receive another invitation right now' } };
        const s = f.snapshots[args.p_job_id];
        let row = s.activity.find(row => row.professional_id === args.p_professional_id);
        const already = Boolean(row?.invited_at);
        if (!row) { row = activity(args.p_professional_id); s.activity.push(row); }
        row.invited_at = now;
        if (!already) s.invitations_used++;
        if (f.failAfterSend) f.failRead = true;
        return { data: { invited: true, already_invited: already, opportunity_id: row.opportunity_id }, error: null };
      }
      if (name === 'respond_to_quote') {
        if(f.emptyRespond)return {data:null,error:null};
        const quote = f.quotes.find(q => q.id === args.p_quote_id);
        quote.status = args.p_action === 'accept' ? 'accepted' : 'declined';
        if (args.p_action === 'accept') {
          const s = f.snapshots[quote.job_id]; s.job.status = 'active'; s.can_invite = false; s.recommendations = [];
          s.activity.forEach(row => { if (['offered','viewed'].includes(row.status)) row.status = 'closed'; });
          f.active.push({ id: 'a1', job_id: quote.job_id, customer_id: 'customer', professional_name: quote.professional_name, amount: quote.amount, status: 'pending_confirmation', job_title: quote.job_title });
        }
        return { data: {quote_id:args.p_quote_id,quote_status:quote.status,active_job_id:args.p_action==='accept'?'a1':null}, error: null };
      }
      if(name==='customer_confirm_job_completion') {
        if(f.emptyCompletion)return {data:null,error:null};
        f.active[0].status='completed';f.jobs.find(j=>j.id===f.active[0].job_id).status='completed';
        return {data:{active_job_id:args.p_active_job_id,status:'completed'},error:null};
      }
      throw new Error(`Unexpected RPC ${name}`);
    }
  };
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(installClient);
  await page.addInitScript(()=>{window.KorvoEvidence={attach:()=>({beforeComplete:async()=>{if(window.fixture.evidenceDenied)throw Error('Photo review required');window.fixture.evidenceChecked=true;}})};});
  await page.route('**/*', async route => {
    const u = new URL(route.request().url());
    const file = u.pathname.slice(1);
    if (u.hostname !== 'korvo.test' || file === 'supabase.js') return route.fulfill({ body: '', contentType: 'application/javascript' });
    if (!['customer-dashboard.html','customer-dashboard.css','customer-dashboard.js','customer-professionals.js','marketplace-payments.js'].includes(file)) return route.fulfill({ status: 404, body: '' });
    await route.fulfill({ body: await fs.readFile(path.join(root,file)), contentType: file.endsWith('.html') ? 'text/html' : file.endsWith('.css') ? 'text/css' : 'application/javascript' });
  });
  let checks = 0;
  const check = (value, message) => { assert.ok(value, message); checks++; console.log(`PASS ${message}`); };
  const ready = () => page.waitForFunction(() => document.getElementById('customerRecommendationsList').getAttribute('aria-busy') === 'false');
  const pro = id => page.locator(`#customerRecommendationsList [data-professional-id="${id}"]`);
  const refresh = async () => { await page.locator('#refreshCustomerProfessionals').click(); await ready(); };
  try {
    await page.goto('http://korvo.test/customer-dashboard.html'); await ready();
    check(await page.locator('#recommendationsJob option').count() === 3, 'job selector uses real fetched jobs');
    check(await page.locator('#recommendationsJob').inputValue() === 'j1', 'open job selected by default');
    check(await page.locator('.customer-professional-card').count() === 6, 'recommendations render for selected job');
    check(await page.locator('#customerRecommendationsList img').count() === 0, 'professional names are safely escaped');
    check((await page.locator('#customerRecommendationsList').textContent()).includes('4.8 / 5 · 12 reviews'), 'real rating and review count displayed');
    check((await pro('p6').locator('..').textContent()).includes('No reviews yet'), 'new professional has no fabricated rating');
    check(await pro('p2').isDisabled() && await pro('p3').isDisabled() && await pro('p4').isDisabled() && await pro('p5').isDisabled(), 'invited, passed, quoted and ineligible professionals cannot be invited');
    check((await page.locator('#customerOpportunityActivity').textContent()).includes('Passed'), 'response history displayed');
    await pro('p1').evaluate(button => { button.click(); button.click(); }); await ready();
    check(await page.evaluate(() => fixture.calls.filter(c => c.name === 'invite_professional_to_job').length === 1), 'rapid clicks send only one invitation');
    check(await page.evaluate(() => fixture.calls.find(c => c.name === 'invite_professional_to_job').args.p_job_id === 'j1'), 'invitation targets selected job');
    check(await pro('p1').isDisabled() && (await page.locator('#customerProfessionalsStatus').textContent()).includes('Invitation sent'), 'success appears only after server confirms invitation');
    await refresh();
    check(await pro('p1').isDisabled() && (await page.locator('#customerProfessionalsStatus').textContent()).includes('2 of 5'), 'invitation survives a fresh read');
    await page.locator('#customerOpportunityActivity [data-quote-id="q1"]').click();
    await page.waitForFunction(() => document.activeElement?.dataset.quoteId === 'q1');
    check(await page.locator('#quotesList [data-quote-id="q1"]').count() > 0, 'View Quote loads and focuses actual quote');
    await page.evaluate(() => { fixture.snapshots.j1.recommendations.find(p=>p.professional_id==='p6').can_quote = false; });
    await pro('p6').click(); await ready();
    check(await page.evaluate(() => fixture.calls.filter(c => c.name === 'invite_professional_to_job').length === 1), 'eligibility refreshed before sending invitation');
    await page.evaluate(() => { fixture.snapshots.j1.recommendations.find(p=>p.professional_id==='p6').can_quote = true; fixture.failInvite = true; }); await refresh();
    await pro('p6').click(); await ready();
    check((await page.locator('#customerProfessionalsStatus').textContent()).includes('alert limit') && await page.locator('.customer-professional-card').count() === 0, 'server invitation rejection clears stale actions and explains limit');
    await page.evaluate(() => { fixture.failInvite = false; fixture.failAfterSend = true; }); await refresh();
    await pro('p6').click(); await ready();
    check((await page.locator('#customerProfessionalsStatus').textContent()).includes('Invitation sent, but'), 'confirmed invitation is preserved when follow-up read fails');
    await page.evaluate(() => { fixture.failAfterSend = false; fixture.failRead = false; }); await refresh();
    check(await pro('p6').isDisabled(), 'retry reads existing invitation without resending');
    await page.locator('#recommendationsJob').selectOption('closed'); await ready();
    check(await page.locator('.customer-professional-card').count() === 0 && (await page.locator('#customerOpportunityActivity').textContent()).includes('Closed'), 'closed jobs retain history and have no invite actions');
    check((await page.locator('#customerOpportunityActivity').textContent()).includes('Professional no longer listed'), 'hidden historical professional has a safe fallback label');
    await page.evaluate(() => { fixture.delay.j1 = 250; });
    await page.locator('#recommendationsJob').selectOption('j1');
    await page.locator('#recommendationsJob').selectOption('j2'); await ready();
    await page.waitForTimeout(300);
    check(await pro('p7').count() === 1 && await pro('p1').count() === 0, 'slow response cannot overwrite a newly selected job');
    await page.evaluate(() => { fixture.delay = {}; fixture.snapshots.j2.invitations_used = 5; }); await refresh();
    check(await pro('p7').isDisabled(), 'job invitation limit disables new invitations');
    await page.evaluate(() => { fixture.failJobs = true; }); await refresh();
    check((await page.locator('#customerProfessionalsStatus').textContent()).includes('jobs could not be loaded') && await page.locator('.customer-professional-card').count() === 0, 'job load failure clears previous account data');
    await page.evaluate(() => { fixture.failJobs = false; }); await refresh();
    await page.locator('#jobsList .job-professionals-button').first().click(); await ready();
    check(await page.locator('#recommendationsJob').inputValue() === 'j1', 'job card action opens its own recommendations');
    await page.evaluate(()=>fixture.emptyRespond=true);
    await page.locator('#quotesList .generated-accept-quote-button').click();
    await page.locator('#confirmAcceptQuoteButton').click();
    await page.waitForFunction(()=>document.getElementById('infoModalTitle').textContent.includes('Could Not Accept'));
    check(await page.evaluate(()=>fixture.active.length===0),'empty quote response never claims an active job was created');
    await page.locator('#infoModalDoneButton').click();await page.evaluate(()=>fixture.emptyRespond=false);
    await page.locator('#quotesList .generated-accept-quote-button').click();
    await page.locator('#confirmAcceptQuoteButton').click();
    await page.waitForFunction(() => fixture.snapshots.j1.job.status === 'active'); await ready();
    await page.locator('#infoModalDoneButton').click();
    check(await page.locator('.customer-professional-card').count() === 0 && (await page.locator('#customerProfessionalsStatus').textContent()).includes('closed'), 'accepting real quote flow refreshes recommendation closure');
    await page.evaluate(()=>fixture.emptyCompletion=true);
    page.once('dialog',d=>d.accept());await page.locator('.confirm-completion-button').click();
    await page.waitForFunction(()=>document.getElementById('infoModalTitle').textContent.includes('Could Not'));
    check(await page.locator('.confirm-completion-button').isEnabled(),'empty customer completion does not claim saved work');
    await page.locator('#infoModalDoneButton').click();await page.evaluate(()=>{fixture.emptyCompletion=false;fixture.calls=[];});
    await page.evaluate(()=>fixture.evidenceDenied=true);page.once('dialog',d=>d.accept());await page.locator('.confirm-completion-button').click();
    await page.waitForFunction(()=>document.getElementById('infoModalTitle').textContent.includes('Could Not'));
    check(await page.evaluate(()=>fixture.calls.every(c=>c.name!=='customer_confirm_job_completion')),'dashboard blocks customer RPC when photo preflight fails');
    await page.locator('#infoModalDoneButton').click();await page.evaluate(()=>fixture.evidenceDenied=false);

    page.once('dialog',d=>d.accept());await page.locator('.confirm-completion-button').click();
    await page.waitForFunction(()=>document.getElementById('infoModalTitle').textContent.includes('Completion Confirmed'));
    check(await page.evaluate(()=>fixture.calls.filter(c=>c.name==='customer_confirm_job_completion').length===1),'customer confirmation performs one completion RPC');
    check(await page.evaluate(()=>fixture.active[0].status==='completed'),'customer completion uses confirmed server state');
    check(await page.locator('.confirm-completion-button').count()===0,'completed job no longer offers repeat confirmation');
    await page.reload(); await ready();
    await page.setViewportSize({ width: 375, height: 812 });
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'mobile dashboard does not overflow horizontally');
    if (process.env.KORVO_SCREENSHOT) await page.locator('#customerProfessionalsSection').screenshot({ path: process.env.KORVO_SCREENSHOT, style: '.site-header {visibility:hidden!important}' });
    check(errors.length === 0, `no uncaught dashboard errors: ${errors.join(',')}`);
    console.log(`${checks} customer browser checks passed.`);
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
