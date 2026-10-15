"""HTTP security/replay checks. A restricted signing fixture is supplied externally.

Only unknown test events are signed here; no financial state is fabricated.
"""
import hashlib,hmac,json,os,pathlib,time,uuid,urllib.request,urllib.error
secret=json.loads(pathlib.Path(os.environ['KORVO_WEBHOOK_SIGNING_FIXTURE']).read_text())['secret']
assert secret.startswith('whsec_')
url='https://waaglkephsbxdlleuutr.supabase.co/functions/v1/stripe-webhook'
event={'id':'evt_korvo_acceptance_'+uuid.uuid4().hex,'type':'korvo.acceptance','livemode':False,'data':{'object':{}}}
body=json.dumps(event,separators=(',',':')).encode();checks=0
def signature(data,timestamp=None):
 ts=timestamp or int(time.time());value=hmac.new(secret.encode(),str(ts).encode()+b'.'+data,hashlib.sha256).hexdigest()
 return f't={ts},v1={value}'
def call(data,sign=None,method='POST'):
 headers={'Content-Type':'application/json'}
 if sign:headers['stripe-signature']=sign
 req=urllib.request.Request(url,data=data if method=='POST' else None,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=40) as r:return r.status,json.load(r)
 except urllib.error.HTTPError as e:return e.code,json.load(e)
def check(ok,label):
 global checks
 if not ok:raise AssertionError(label)
 checks+=1;print('PASS '+label,flush=True)
status,data=call(body);check(status==400,'unsigned webhook denied')
status,data=call(body,'t='+str(int(time.time()))+',v1='+'0'*64);check(status==400,'invalid signature denied')
status,data=call(body,signature(body,int(time.time())-600));check(status==400,'expired signed delivery denied')
live=json.dumps({**event,'livemode':True}).encode();status,data=call(live,signature(live));check(status==400,'live webhook rejected')
status,data=call(body,signature(body));check(status==200 and data.get('received') is True,'valid signed test event accepted')
status,data=call(body,signature(body));check(status==200 and data.get('duplicate') is True,'same signed event safely deduplicated')
status,data=call(body,method='GET');check(status==405,'webhook rejects GET')
status,data=call(b'x'*524289);check(status==413,'oversized webhook rejected')
print(json.dumps({'checks_passed':checks,'event_id':event['id'],'scope':'real deployed signature, sandbox and event-receipt behavior; not Stripe financial delivery simulation'}))
