import test from 'node:test';
import assert from 'node:assert/strict';
import { createHandler, accountStatus } from '../supabase/functions/create-connect-onboarding/handler.ts';

function fixture(options = {}) {
  const calls = [], logs = [], writes = [];
  let mapping = options.existing ? { stripe_account_id: 'acct_fixture' } : null;
  const account = { id: 'acct_fixture', metadata: { korvo_professional_id: 'pro-fixture' },
    details_submitted: false, charges_enabled: false, payouts_enabled: false, capabilities: {}, ...options.account };
  const createClient = (_url, key) => key === 'anon-fixture' ? {
    auth: { getUser: async () => options.invalidSession ? { error: {} } : { data: { user: { id: 'pro-fixture', email: 'fixture@example.invalid' } } } }
  } : { rpc: async (name,args) => {
    assert.equal(name,'marketplace_apply_event');
    assert.equal(args.p_snapshot.professional_id,'pro-fixture');
    writes.push({kind:'update',values:args.p_snapshot});return {data:{processed:true}};
  }, from(table) {
    let kind = 'select', values, filters = [];
    const query = {
      select() { return this; }, eq(k, v) { filters.push([k, v]); return this; },
      upsert(v, opt) { kind = 'upsert'; values = v; assert.equal(opt.ignoreDuplicates, true); return this; },
      update(v) { kind = 'update'; values = v; return this; },
      maybeSingle() { return this; }, single() { return this; },
      then(resolve, reject) { return Promise.resolve().then(() => {
        if (table === 'profiles') return { data: { id: 'pro-fixture', account_type: options.customer ? 'customer' : 'professional',
          is_active: !options.inactive, onboarding_complete: !options.incomplete } };
        if (table === 'professional_profiles') return { data: options.noPro ? null : { id: 'pro-fixture' } };
        if (table === 'stripe_connect_provisions') return {data:{token:'provision-fixture',created_at:new Date().toISOString()}};
        assert.equal(table, 'professional_stripe_accounts');
        if (kind !== 'upsert') assert.ok(filters.some(([k, v]) => k === 'professional_id' && v === 'pro-fixture'));
        if (options.dbLookupFailure && kind === 'select') return { error: { code: '42501' } };
        if (kind === 'upsert') {
          if (options.dbSaveFailure) return { error: { code: '42501' } };
          mapping ||= { stripe_account_id: values.stripe_account_id };
        }
        if (kind !== 'select') writes.push({ kind, values });
        return { data: mapping };
      }).then(resolve, reject); }
    }; return query;
  } };
  const fetch = async (url, init) => {
    const path = new URL(url).pathname;
    calls.push({ path, ...init, body: init.body && JSON.parse(init.body) });
    assert.ok(init.headers.Authorization.startsWith('Bearer sk_test_'));
    assert.equal(init.headers['Stripe-Version'], '2026-09-30.endive');
    if (options.stripeError) return Response.json({ error: { code: 'accounts_v2_access_blocked', message: 'DO_NOT_LEAK_SECRET' } }, { status: 400, headers: { 'request-id': 'req_fixture' } });
    if (path === '/v2/core/accounts') return Response.json({ id: 'acct_fixture', livemode: false });
    if (path === '/v1/accounts/acct_fixture') return Response.json(account);
    if (path === '/v2/core/account_links') return Response.json({ url: options.link ?? 'https://accounts.stripe.com/r/fixture#test', livemode: !!options.liveLink });
    throw new Error('Unexpected endpoint ' + path);
  };
  const env = { SUPABASE_URL: 'https://fixture.invalid', SUPABASE_ANON_KEY: 'anon-fixture',
    SUPABASE_SERVICE_ROLE_KEY: 'service-fixture', STRIPE_SECRET_KEY: options.key ?? 'sk_test_fixture' };
  const handler = createHandler({ createClient, env: name => env[name], fetch, log: item => logs.push(item) });
  return { calls, logs, writes, run: async (body = {}, authenticated = true) => {
    const response = await handler(new Request('https://fixture.invalid', { method: 'POST',
      headers: { ...(authenticated ? { Authorization: 'Bearer fixture-token' } : {}), 'Content-Type': 'application/json' }, body: JSON.stringify(body) }));
    return { status: response.status, data: await response.json(), cache: response.headers.get('cache-control') };
  } };
}

test('creates v2 sandbox recipient, persists ID before link, and reuses mapping on retry', async () => {
  const f = fixture(); const result = await f.run();
  assert.equal(result.status, 200); assert.equal(result.data.sandbox, true); assert.equal(result.cache, 'no-store');
  assert.ok(result.data.onboarding_url.startsWith('https://accounts.stripe.com/'));
  assert.deepEqual(f.calls.map(c => c.path), ['/v2/core/accounts', '/v1/accounts/acct_fixture', '/v2/core/account_links']);
  assert.equal(f.calls[0].headers['Idempotency-Key'], 'korvo-connect-v2-provision-fixture');
  assert.equal(f.calls[0].body.contact_email, 'fixture@example.invalid');
  assert.equal(f.calls[0].body.configuration.recipient.capabilities.stripe_balance.stripe_transfers.requested, true);
  assert.equal(f.calls[2].body.use_case.account_onboarding.return_url, 'https://korvoadmin.github.io/Korvo-1.0/professional-dashboard.html?stripe=return');
  assert.equal(f.writes[0].values.stripe_account_id, 'acct_fixture');
  await f.run(); assert.equal(f.calls.filter(c => c.path === '/v2/core/accounts').length, 1);
});
for (const options of [{ customer: true }, { inactive: true }, { incomplete: true }, { noPro: true }]) {
  test('ineligible professional blocked: ' + JSON.stringify(options), async () => {
    const f = fixture(options); assert.equal((await f.run()).status, 403); assert.equal(f.calls.length, 0);
  });
}
test('missing and invalid sessions cannot reach Stripe', async () => {
  const f = fixture(); assert.equal((await f.run({}, false)).status, 401); assert.equal(f.calls.length, 0);
  assert.equal((await fixture({ invalidSession: true }).run()).status, 401);
});
test('live key rejected before any Stripe request', async () => {
  const f = fixture({ key: 'sk_live_fixture' }); assert.equal((await f.run()).status, 503); assert.equal(f.calls.length, 0);
});
test('client cannot supply another professional or Stripe account', async () => {
  for (const body of [{ professional_id: 'other' }, { stripe_account_id: 'acct_other' }, { action: 'delete' }]) {
    const f = fixture(); assert.equal((await f.run(body)).status, 400); assert.equal(f.calls.length, 0);
  }
});
test('status without an account never creates one', async () => {
  const f = fixture(); assert.equal((await f.run({ action: 'status' })).data.status, 'not_connected'); assert.equal(f.calls.length, 0);
});
test('return/status refresh saves Stripe flags but never issues a link or payment', async () => {
  const f = fixture({ existing: true, account: { details_submitted: true, payouts_enabled: true, capabilities: { transfers: 'active' } } });
  const result = await f.run({ action: 'status' }); assert.equal(result.data.status, 'complete');
  assert.equal(result.data.charges_enabled, false); assert.equal(f.calls.length, 1);
  assert.equal(f.writes[0].values.onboarding_status, 'complete');
});
test('lookup/save errors stop before link creation', async () => {
  for (const option of ['dbLookupFailure', 'dbSaveFailure']) {
    const f = fixture({ [option]: true }); const result = await f.run();
    assert.equal(result.status, 500); assert.equal(result.data.code, 'DATABASE_ERROR');
    assert.equal(f.calls.some(c => c.path.includes('account_links')), false);
  }
});
test('Stripe errors report stage/reference without raw error data or credentials', async () => {
  const f = fixture({ stripeError: true }); const result = await f.run();
  assert.equal(result.status, 502); assert.equal(result.data.stage, 'stripe_account_create');
  assert.match(result.data.request_id, /^[a-f0-9-]{36}$/);
  assert.equal(f.logs[0].upstream_code, 'accounts_v2_access_blocked');
  assert.ok(!JSON.stringify([result, f.logs]).includes('DO_NOT_LEAK_SECRET'));
  assert.ok(!JSON.stringify([result, f.logs]).includes('sk_test_'));
});
test('mapping owner mismatch denied', async () => {
  const f = fixture({ existing: true, account: { metadata: { korvo_professional_id: 'other' } } });
  assert.equal((await f.run()).status, 403); assert.equal(f.writes.length, 0);
});
test('unexpected/live links fail closed', async () => {
  for (const options of [{ liveLink: true }, { link: 'https://accounts.stripe.com.evil.test/r' }, { link: 'https://evil@accounts.stripe.com/r' }]) {
    assert.equal((await fixture(options).run()).status, 502);
  }
});
test('completion is based on transfers and payouts, not redirect or card charges', () => {
  assert.equal(accountStatus({ details_submitted: true, payouts_enabled: false }).onboarding_status, 'in_progress');
  assert.equal(accountStatus({ requirements: { disabled_reason: 'rejected.fraud' } }).onboarding_status, 'restricted');
  assert.equal(accountStatus({ details_submitted: true, payouts_enabled: true, capabilities: { transfers: 'inactive' } }).onboarding_status, 'in_progress');
});
