"""Build a separately reviewed A6 variant; never changes canonical SQL or deploys."""
from pathlib import Path
import json,hashlib
from pglast import parse_sql
ROOT=Path(__file__).resolve().parents[1]
ORIGINAL=ROOT/'supabase/proposals/security-review'
DEST=ROOT/'supabase/proposals/security-review-managed'
SOURCE=ROOT/'supabase/proposals/harden_korvo_api_permissions_managed_candidate.sql'
def remove_storage_optimizations(text):
 spans=[]
 for node in parse_sql(text):
  s=node.stmt
  if type(s).__name__=='AlterPolicyStmt' and s.table.schemaname=='storage' and s.table.relname=='objects':
   if s.policy_name not in ('Issue evidence read','Issue evidence upload'):raise ValueError('Unexpected Storage policy')
   start=node.stmt_location;end=start+node.stmt_len
   if text[end]!=';':raise ValueError('Expected terminator')
   spans.append((start,end+1))
 for start,end in reversed(spans):text=text[:start]+text[end:]
 return text,len(spans)
def main():
 manifest=json.loads((ORIGINAL/'manifest.json').read_text());DEST.mkdir(exist_ok=True)
 packages=[];assembled='';omitted=0
 for p in manifest['packages']:
  text,n=remove_storage_optimizations((ORIGINAL/p['file']).read_text());omitted+=n;assembled+=text
  (DEST/p['file']).write_text(text);packages.append({**p,'statements':len(parse_sql(text)),'sha256':hashlib.sha256(text.encode()).hexdigest()})
 assert omitted==2 and len(parse_sql(assembled))==462
 canonical=(ROOT/manifest['source']).read_text();assert hashlib.sha256(canonical.encode()).hexdigest()==manifest['source_sha256']
 assert remove_storage_optimizations(canonical)[0]==assembled
 SOURCE.write_text(assembled)
 result={**manifest,'source':str(SOURCE.relative_to(ROOT)),'source_sha256':hashlib.sha256(assembled.encode()).hexdigest(),'statements':462,'packages':packages,'supersedes_original':False,'omitted_only':['ALTER POLICY Issue evidence read ON storage.objects','ALTER POLICY Issue evidence upload ON storage.objects'],'reason':'Retain existing Storage expressions; optimize no managed-owned policy. Existing expressions still call hardened public wrappers.'}
 (DEST/'manifest.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({'statements':462,'sha256':result['source_sha256'],'deployment_allowed':False}))
if __name__=='__main__':main()
