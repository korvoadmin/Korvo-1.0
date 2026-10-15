"""Opt-in actual marketplace completion, isolation and private-storage checks.

Retains synthetic records/uploads. Does not release, transfer or pay out funds.
"""
import base64,json,os,pathlib,re,urllib.request,urllib.error
fp=pathlib.Path(os.environ['KORVO_ACCEPTANCE_FIXTURE']);f=json.loads(fp.read_text())
s=(pathlib.Path(__file__).resolve().parents[1]/'supabase.js').read_text()
base=re.search(r'SUPABASE_URL = "([^"]+)"',s).group(1);key=re.search(r'"(sb_publishable_[^"]+)"',s).group(1)
tokens={};checks=0
def call(path,body=None,role=None,mime='application/json',method=None):
 headers={'apikey':key,'Content-Type':mime}
 if role:headers['Authorization']='Bearer '+tokens[role]
 data=body if isinstance(body,bytes) else json.dumps(body).encode() if body is not None else None
 req=urllib.request.Request(base+path,data=data,headers=headers,method=method)
 try:
  with urllib.request.urlopen(req,timeout=40) as r:
   data=r.read();return r.status,json.loads(data) if 'json' in r.headers.get('Content-Type','') else data
 except urllib.error.HTTPError as e:
  try:return e.code,json.load(e)
  except Exception:return e.code,{}
def check(ok,label):
 global checks
 if not ok:raise AssertionError(label)
 checks+=1;print('PASS '+label,flush=True)
def rpc(name,args,role):return call('/rest/v1/rpc/'+name,args,role)
try:
 for role in ['customer','professional','other']:
  assert f[role+'_email'].endswith('@example.invalid')
  status,data=call('/auth/v1/token?grant_type=password',{'email':f[role+'_email'],'password':f['password']})
  check(status==200,role+' signs in');tokens[role]=data['access_token']
 paid=next(c for c in f['payment_cases'] if c['quote']==1000)
 unpaid=next(c for c in f['payment_cases'] if c['quote']==500)
 status,data=rpc('marketplace_payment_summary',{'p_active_job_id':paid['active_job_id']},'customer')
 check(status==200 and data.get('status')=='paid' and data.get('professional_gross_cents')==100000,'genuine successful full-price payment summary')
 status,data=rpc('marketplace_payment_summary',{'p_active_job_id':paid['active_job_id']},'other');check(status==403,'other customer cannot read payment summary')
 status,data=call('/rest/v1/marketplace_payments',role='customer');check(status==403,'customer cannot read raw financial records')
 status,data=call('/rest/v1/professional_stripe_accounts',role='professional');check(status==403,'professional cannot read raw Stripe mappings')
 status,data=call('/rest/v1/conversations?active_job_id=eq.'+paid['active_job_id'],role='customer');check(status==200 and len(data)==1,'accepted quote has participant conversation')
 conversation=data[0]['id']
 status,data=rpc('send_korvo_message',{'p_conversation_id':conversation,'p_body':'Synthetic test: confirming the project scope.'},'customer');check(status==200 and data.get('status')=='sent','customer sends genuine in-app message')
 status,data=rpc('send_korvo_message',{'p_conversation_id':conversation,'p_body':'Synthetic test: work is ready for review.'},'professional');check(status==200 and data.get('status')=='sent','professional replies')
 status,data=rpc('send_korvo_message',{'p_conversation_id':conversation,'p_body':'Unauthorized fixture message'},'other');check(status in [400,401,403,404],'unrelated customer cannot message participants')
 status,data=call('/rest/v1/messages?conversation_id=eq.'+conversation,role='other');check(status==200 and data==[],'unrelated customer cannot read participant messages')
 status,jobs=call('/rest/v1/active_jobs?id=eq.'+paid['active_job_id'],role='professional');check(status==200 and len(jobs)==1,'professional sees own active-job state')
 if jobs[0]['status']=='active':
  status,data=rpc('professional_request_job_completion',{'p_active_job_id':paid['active_job_id']},'professional');check(status==200 and data.get('status')=='pending_confirmation','professional requests completion')
 else:check(jobs[0]['status'] in ['pending_confirmation','completed'] and jobs[0]['professional_completed_at'] is not None,'professional completion previously persisted')
 status,data=rpc('customer_confirm_job_completion',{'p_active_job_id':paid['active_job_id']},'other');check(status in [400,401,403,404],'unrelated customer cannot confirm completion')
 if jobs[0]['status']!='completed':
  status,data=rpc('customer_confirm_job_completion',{'p_active_job_id':paid['active_job_id']},'customer');check(status==200 and data.get('status')=='completed','owning customer confirms completion')
 else:check(jobs[0]['completed_at'] is not None,'customer completion previously persisted')
 status,reviews=call('/rest/v1/reviews?job_id=eq.'+paid['job_id'],role='customer')
 if not reviews:
  status,data=rpc('submit_job_review',{'p_job_id':paid['job_id'],'p_rating':5,'p_comment':'Synthetic automated test review; not a real service endorsement.'},'customer');check(status==200,'customer submits completion feedback')
 else:check(status==200 and len(reviews)==1,'completion feedback previously persisted')
 for role in ['customer','professional']:
  status,data=rpc('marketplace_payment_summary',{'p_active_job_id':paid['active_job_id']},role)
  check(status==200 and data.get('release_status')=='held',role+' sees contractor funds still held after completion')
 if not f.get('storage_test_issue_id'):
  status,data=rpc('open_project_issue',{'p_active_job_id':unpaid['active_job_id'],'p_issue_type':'other','p_description':'Synthetic private upload security test, no actual dispute.'},'customer')
  check(status==200 and data.get('issue_id'),'participant opens isolated support issue')
  f['storage_test_issue_id']=data['issue_id'];fp.write_text(json.dumps(f));fp.chmod(0o600)
 issue=f['storage_test_issue_id']
 png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aVb0AAAAASUVORK5CYII=')
 bucket='/storage/v1/object/project-issue-evidence/'
 status,data=call(bucket+issue+'/'+f['other_id']+'/unauthorized.png',png,'other','image/png');check(status in [400,401,403,404],'cross-customer evidence upload denied')
 status,data=call(bucket+issue+'/'+f['professional_id']+'/impersonated.png',png,'customer','image/png');check(status in [400,401,403,404],'upload impersonating professional folder denied')
 status,data=call(bucket+issue+'/'+f['customer_id']+'/unsafe.html',b'<script>alert(1)</script>','customer','text/html');check(status in [400,401,403,404],'HTML evidence upload rejected')
 path=issue+'/'+f['customer_id']+'/synthetic-fixture.png'
 if f.get('storage_test_path')!=path:
  status,data=call(bucket+path,png,'customer','image/png');check(status in [200,201],'participant uploads permitted private PNG')
 f['storage_test_path']=path;fp.write_text(json.dumps(f));fp.chmod(0o600)
 for role in ['customer','professional']:
  status,data=call('/storage/v1/object/authenticated/project-issue-evidence/'+path,role=role);check(status==200 and data==png,role+' can read own project evidence')
 status,data=call('/storage/v1/object/authenticated/project-issue-evidence/'+path,role='other');check(status in [400,401,403,404],'other customer cannot read private evidence')
 status,data=call('/storage/v1/object/authenticated/project-issue-evidence/'+path);check(status in [400,401,403,404],'anonymous evidence read denied')
 status,data=rpc('register_project_issue_evidence',{'p_issue_id':issue,'p_storage_path':path,'p_file_name':'synthetic-fixture.png','p_caption':'Synthetic security fixture'},'customer');check(status==200,'authorized uploaded evidence registers through RPC')
 print(json.dumps({'checks_passed':checks,'scope':'real API completion, feedback, messages, ownership and Storage; completion proof and transfers remain unfinished'}))
finally:
 for token in tokens.values():
  req=urllib.request.Request(base+'/auth/v1/logout?scope=global',data=b'',headers={'apikey':key,'Authorization':'Bearer '+token})
  try:urllib.request.urlopen(req,timeout=20).close()
  except Exception:print('WARN fixture sign-out requires verification',flush=True)
