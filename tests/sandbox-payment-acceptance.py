"""Opt-in deployed sandbox test. Fixture credentials stay outside the repository.

Creates retained synthetic jobs/quotes only. Never creates transfers or live charges.
Run with KORVO_ACCEPTANCE_FIXTURE pointing at administrator-provisioned fixtures.
"""
import json, os, pathlib, re, urllib.request, urllib.error

root = pathlib.Path(__file__).resolve().parents[1]
fixture_path = pathlib.Path(os.environ['KORVO_ACCEPTANCE_FIXTURE'])
f = json.loads(fixture_path.read_text())
assert all(f[r + '_email'].endswith('@example.invalid') for r in ['customer', 'professional', 'other'])
assert f['service'].startswith('Korvo acceptance ')
source = (root / 'supabase.js').read_text()
base = re.search(r'SUPABASE_URL = "([^"]+)"', source).group(1)
key = re.search(r'"(sb_publishable_[^"]+)"', source).group(1)
checks = 0

def request(path, body=None, token=None):
    headers = {'apikey': key, 'Content-Type': 'application/json', 'Prefer': 'return=representation'}
    if token: headers['Authorization'] = 'Bearer ' + token
    req = urllib.request.Request(base + path, data=json.dumps(body).encode() if body is not None else None, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=40) as r: return r.status, json.load(r)
    except urllib.error.HTTPError as e:
        try: data = json.load(e)
        except Exception: data = {}
        return e.code, data

def check(ok, label):
    global checks
    if not ok: raise AssertionError(label)
    checks += 1; print('PASS ' + label, flush=True)

def persist():
    fixture_path.write_text(json.dumps(f)); fixture_path.chmod(0o600)

tokens = {}
try:
    for role in ['customer', 'professional', 'other']:
        status, data = request('/auth/v1/token?grant_type=password', {'email': f[role+'_email'], 'password': f['password']})
        check(status == 200 and data.get('user', {}).get('id') == f[role+'_id'], role + ' genuine Auth login')
        tokens[role] = data['access_token']
    f.setdefault('payment_cases', [])
    for quote in [100, 500, 1000]:
        case = next((c for c in f['payment_cases'] if c['quote'] == quote), None)
        if case is None:
            status, jobs = request('/rest/v1/jobs', {'customer_id': f['customer_id'], 'title': 'Sandbox payment fixture '+str(quote),
                'description': 'Synthetic automated test, no real work or money.', 'category': f['service'], 'city': 'Atlanta', 'state': 'GA', 'status': 'open'}, tokens['customer'])
            check(status == 201, 'customer posts isolated job '+str(quote))
            case = {'quote': quote, 'job_id': jobs[0]['id']}; f['payment_cases'].append(case); persist()
        if 'quote_id' not in case:
            status, quotes = request('/rest/v1/quotes', {'job_id': case['job_id'], 'professional_id': f['professional_id'],
                'amount': quote, 'timeframe': 'Same day', 'message': 'Synthetic payment test quote'}, tokens['professional'])
            if status != 201: print('Quote rejected:', status, quotes.get('code'), quotes.get('message'), flush=True)
            check(status == 201, 'professional quotes '+str(quote))
            case['quote_id'] = quotes[0]['id']; persist()
        if 'active_job_id' not in case:
            status, accepted = request('/rest/v1/rpc/respond_to_quote', {'p_quote_id': case['quote_id'], 'p_action': 'accept'}, tokens['customer'])
            check(status == 200 and 'active_job_id' in accepted, 'customer accepts quote '+str(quote))
            case['active_job_id'] = accepted['active_job_id']; persist()
        body = {'active_job_id': case['active_job_id']}
        status, checkout = request('/functions/v1/create-booking-checkout', body, tokens['customer'])
        check(status == 200 and checkout.get('sandbox') is True, 'deployed sandbox Checkout opens '+str(quote))
        check(checkout['professional_gross_cents'] == quote*100 and checkout['platform_fee_cents'] == quote*12 and
              checkout['customer_total_cents'] == quote*112, 'deployed full quote plus 12% allocations '+str(quote))
        case['checkout'] = checkout; persist()
        status, repeat = request('/functions/v1/create-booking-checkout', body, tokens['customer'])
        check(status == 200 and repeat.get('checkout_url') == checkout['checkout_url'], 'repeated checkout reuses session '+str(quote))
        for role in ['professional', 'other']:
            status, denied = request('/functions/v1/create-booking-checkout', body, tokens[role])
            check(status == 403, role+' cannot initiate customer payment '+str(quote))
        status, denied = request('/functions/v1/create-booking-checkout', {**body, 'amount': 1}, tokens['customer'])
        check(status == 400, 'customer amount override denied '+str(quote))
    print(json.dumps({'checks_passed': checks, 'scope': 'actual Auth, Data API and deployed sandbox Checkout; hosted payment completion not asserted'}))
finally:
    for token in tokens.values():
        req = urllib.request.Request(base+'/auth/v1/logout?scope=global', data=b'', headers={'apikey': key, 'Authorization': 'Bearer '+token})
        try: urllib.request.urlopen(req, timeout=20).close()
        except Exception: print('WARN fixture sign-out requires verification', flush=True)
