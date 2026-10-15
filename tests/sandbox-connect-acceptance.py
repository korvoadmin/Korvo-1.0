"""Opt-in real sandbox onboarding tests; retains its connected-account fixture."""
import json,os,pathlib,re,urllib.request,urllib.error
fpath=pathlib.Path(os.environ['KORVO_ACCEPTANCE_FIXTURE']);f=json.loads(fpath.read_text())
source=(pathlib.Path(__file__).resolve().parents[1]/'supabase.js').read_text()
base=re.search(r'SUPABASE_URL = "([^"]+)"',source).group(1)
key=re.search(r'"(sb_publishable_[^"]+)"',source).group(1)
checks=0;tokens={}
def call(path,body,token=None):
 headers={'apikey':key,'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 req=urllib.request.Request(base+path,data=json.dumps(body).encode(),headers=headers)
 try:
  with urllib.request.urlopen(req,timeout=40) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def check(ok,label):
 global checks
 if not ok:raise AssertionError(label)
 checks+=1;print('PASS '+label,flush=True)
try:
 for role in ['customer','professional','other']:
  assert f[role+'_email'].endswith('@example.invalid')
  status,data=call('/auth/v1/token?grant_type=password',{'email':f[role+'_email'],'password':f['password']})
  check(status==200 and data['user']['id']==f[role+'_id'],role+' authenticates')
  tokens[role]=data['access_token']
 for role in ['customer','other']:
  status,data=call('/functions/v1/create-connect-onboarding',{'action':'start'},tokens[role]);check(status==403,role+' cannot create contractor payout account')
 status,data=call('/functions/v1/create-connect-onboarding',{'action':'start','professional_id':f['other_id']},tokens['professional'])
 check(status==400,'client cannot choose another account owner')
 for attempt in [1,2]:
  status,data=call('/functions/v1/create-connect-onboarding',{'action':'start'},tokens['professional'])
  check(status==200 and data.get('sandbox') is True and data.get('onboarding_url','').startswith('https://connect.stripe.com/'),'real sandbox onboarding link attempt '+str(attempt))
  check(data.get('status')!='complete','unfinished onboarding stays not ready '+str(attempt))
  f['connect_test']={'status':data['status'],'onboarding_url':data['onboarding_url']};fpath.write_text(json.dumps(f));fpath.chmod(0o600)
 status,data=call('/functions/v1/create-connect-onboarding',{'action':'status'},tokens['professional'])
 check(status==200 and data.get('sandbox') is True and data.get('onboarding_status')!='complete' and data.get('payouts_enabled') is False,'server refresh cannot mark incomplete contractor payout-ready')
 print(json.dumps({'checks_passed':checks,'scope':'deployed Accounts v2 link creation, retries, ownership and incomplete status; complete onboarding not asserted'}))
finally:
 for token in tokens.values():
  req=urllib.request.Request(base+'/auth/v1/logout?scope=global',data=b'',headers={'apikey':key,'Authorization':'Bearer '+token})
  try:urllib.request.urlopen(req,timeout=20).close()
  except Exception:print('WARN fixture sign-out requires verification',flush=True)
