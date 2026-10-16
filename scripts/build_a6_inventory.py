"""Read-only A6 object inventory from the exact canonical SQL; pglast==7.8."""
from pathlib import Path
from collections import Counter
import hashlib,json
from pglast import parse_sql
from pglast.stream import RawStream
ROOT=Path(__file__).resolve().parents[1]
source=ROOT/'supabase/proposals/20261012160000_harden_korvo_api_permissions.sql'
def build():
 raw=source.read_bytes();statements=[s.stmt for s in parse_sql(raw.decode())];render=lambda node:RawStream()(node)
 result={'source':str(source.relative_to(ROOT)),'source_sha256':hashlib.sha256(raw).hexdigest(),'deployment_authorized':False,'statement_count':len(statements),'statement_types':dict(Counter(type(s).__name__ for s in statements)),'functions':[],'altered_functions':[],'policies':[],'triggers':[],'grants':[],'other_statements':[]}
 names=lambda values:'.'.join(v.sval for v in values)
 for s in statements:
  kind=type(s).__name__
  if kind=='CreateFunctionStmt':
   args=[render(p.argType) for p in s.parameters or [] if p.mode.name not in ('FUNC_PARAM_OUT','FUNC_PARAM_TABLE')]
   result['functions'].append({'identity':names(s.funcname)+'('+','.join(args)+')','definition_in_canonical':True})
  elif kind=='AlterFunctionStmt':result['altered_functions'].append(render(s))
  elif kind in ('AlterPolicyStmt','CreatePolicyStmt'):
   result['policies'].append({'operation':'ALTER' if kind=='AlterPolicyStmt' else 'CREATE','table':(s.table.schemaname or 'public')+'.'+s.table.relname,'policy':s.policy_name,'sql':render(s)})
  elif kind=='CreateTrigStmt':result['triggers'].append({'table':(s.relation.schemaname or 'public')+'.'+s.relation.relname,'trigger':s.trigname,'function':names(s.funcname),'sql':render(s)})
  elif kind=='GrantStmt':result['grants'].append(render(s))
  else:result['other_statements'].append(render(s))
 manifest=json.loads((ROOT/'supabase/proposals/security-review/manifest.json').read_text())
 result['packages']=[]
 for package in manifest['packages']:
  nodes=[x.stmt for x in parse_sql((ROOT/'supabase/proposals/security-review'/package['file']).read_text())]
  result['packages'].append({**package,'statement_types':dict(Counter(type(x).__name__ for x in nodes))})
 result['roles_affected']=['PUBLIC','anon','authenticated','service_role','postgres (default function privileges)']
 result['application_roles_tested']=['customer','professional','unrelated customer/professional','support','owner/admin','inactive/revoked','anonymous','service backend']
 result['managed_blockers']=[{'table':'storage.objects','owner':'supabase_storage_admin','policy':p['policy'],'operation':p['operation']} for p in result['policies'] if p['table']=='storage.objects']
 return result
if __name__=='__main__':
 result=build();(ROOT/'docs/A6_OBJECT_INVENTORY.json').write_text(json.dumps(result,indent=2)+'\n')
 print(json.dumps({k:len(result[k]) for k in ['functions','altered_functions','policies','triggers','grants']}))
