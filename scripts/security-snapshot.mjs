// Read-only catalog snapshot + drift-guarded inverse generator. Never executes a rollout.
// Snapshot bodies/ACLs are private operational material: write outside Git, mode 0600.
const acl=(expression)=>`(select coalesce(jsonb_agg(jsonb_build_object('grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,'grantor',pg_get_userbyid(a.grantor),'privilege',a.privilege_type,'grantable',a.is_grantable) order by case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,a.privilege_type),'[]') from aclexplode(${expression}) a)`;
export const SNAPSHOT_QUERY=`select snapshot,md5(snapshot::text) fingerprint from (select jsonb_build_object(
'functions',coalesce((select jsonb_agg(jsonb_build_object('identity',format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)),'schema',n.nspname,'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',${acl("coalesce(p.proacl,acldefault('f',p.proowner))")}) order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname in('public','korvo_api_private') and p.prokind='f'),'[]'),
'relations',coalesce((select jsonb_agg(jsonb_build_object('identity',format('%I.%I',n.nspname,c.relname),'schema',n.nspname,'owner',pg_get_userbyid(c.relowner),'rls',c.relrowsecurity,'force_rls',c.relforcerowsecurity,'acl',${acl("coalesce(c.relacl,acldefault('r',c.relowner))")}) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind in('r','p') and (n.nspname in('public','korvo_api_private') or (n.nspname='storage' and c.relname='objects'))),'[]'),
'schemas',coalesce((select jsonb_agg(jsonb_build_object('name',n.nspname,'owner',pg_get_userbyid(n.nspowner),'acl',${acl("coalesce(n.nspacl,acldefault('n',n.nspowner))")}) order by n.nspname) from pg_namespace n where n.nspname in('public','korvo_api_private')),'[]'),
'policies',coalesce((select jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'permissive',permissive,'roles',roles,'cmd',cmd,'using',qual,'check',with_check) order by schemaname,tablename,policyname) from pg_policies where schemaname in('public','korvo_api_private') or (schemaname='storage' and tablename='objects')),'[]'),
 'triggers',coalesce((select jsonb_agg(jsonb_build_object('name',t.tgname,'table',format('%I.%I',n.nspname,c.relname),'definition',pg_get_triggerdef(t.oid),'enabled',t.tgenabled) order by n.nspname,c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and (n.nspname in('public','korvo_api_private') or (n.nspname='storage' and c.relname='objects'))),'[]'),
 'defaults',coalesce((select jsonb_agg(jsonb_build_object('owner',pg_get_userbyid(d.defaclrole),'schema',coalesce(n.nspname,''),'type',d.defaclobjtype,'acl',${acl('d.defaclacl')}) order by pg_get_userbyid(d.defaclrole),coalesce(n.nspname,''),d.defaclobjtype) from pg_default_acl d left join pg_namespace n on n.oid=d.defaclnamespace where (n.nspname in('public','korvo_api_private') or d.defaclnamespace=0) and pg_get_userbyid(d.defaclrole)=current_user),'[]')
) snapshot) s`;
const q=s=>'"'+String(s).replaceAll('"','""')+'"';
const role=s=>s==='PUBLIC'?'PUBLIC':q(s);
const literal=s=>"'"+String(s).replaceAll("'","''")+"'";
function privileges(kind,identity,before,after){
 const names=new Set([...before,...after].map(a=>a.grantee));
 const sql=[...names].map(name=>`REVOKE ALL ON ${kind} ${identity} FROM ${role(name)};`);
 for(const a of before)sql.push(`GRANT ${a.privilege} ON ${kind} ${identity} TO ${role(a.grantee)}${a.grantable?' WITH GRANT OPTION':''};`);
 return sql;
}
export function restoreSQL(before,after){
 if(!/^[a-f0-9]{32}$/.test(before.fingerprint)||!/^[a-f0-9]{32}$/.test(after.fingerprint))throw Error('Invalid catalog fingerprint');
 const b=before.snapshot,a=after.snapshot;
 for(const list of [b.functions,b.relations,b.schemas,a.functions,a.relations,a.schemas])for(const object of list){
  if(object.acl.some(x=>x.grantor!==object.owner))throw Error('Non-owner grant chains require a separately reviewed restore');
 }
 if(b.schemas.some(s=>s.name==='korvo_api_private')||a.relations.some(r=>r.schema==='korvo_api_private'))throw Error('Private schema is not an empty prechange namespace');
 const sql=['-- REVIEW ONLY. Separate explicit A6 approval required; no automatic execution.','BEGIN;',"SET LOCAL lock_timeout='5s';","SET LOCAL statement_timeout='60s';"];
 const assertFingerprint=(expected,label)=>`DO $guard$ BEGIN IF (SELECT fingerprint FROM (${SNAPSHOT_QUERY}) observed)<>${literal(expected)} THEN RAISE EXCEPTION '${label}'; END IF; END $guard$;`;
 sql.push(assertFingerprint(after.fingerprint,'Catalog drift: rollback refused'));
 for(const t of a.triggers)sql.push(`DROP TRIGGER ${q(t.name)} ON ${t.table};`);
 for(const p of a.policies)sql.push(`DROP POLICY ${q(p.name)} ON ${q(p.schema)}.${q(p.table)};`);
 for(const f of b.functions){sql.push(f.definition+';',`ALTER FUNCTION ${f.identity} OWNER TO ${q(f.owner)};`);}
 for(const p of b.policies){
  sql.push(`CREATE POLICY ${q(p.name)} ON ${q(p.schema)}.${q(p.table)} AS ${p.permissive} FOR ${p.cmd} TO ${p.roles.map(role).join(',')}${p.using?' USING ('+p.using+')':''}${p.check?' WITH CHECK ('+p.check+')':''};`);
 }
 for(const t of b.triggers){sql.push(t.definition+';');sql.push(`ALTER TABLE ${t.table} ${t.enabled==='D'?'DISABLE':t.enabled==='A'?'ENABLE ALWAYS':t.enabled==='R'?'ENABLE REPLICA':'ENABLE'} TRIGGER ${q(t.name)};`);}
 for(const r of b.relations){const current=a.relations.find(x=>x.identity===r.identity);if(!current)throw Error('Missing preexisting relation');sql.push(...privileges('TABLE',r.identity,r.acl,current.acl),`ALTER TABLE ${r.identity} ${r.rls?'ENABLE':'DISABLE'} ROW LEVEL SECURITY;`,`ALTER TABLE ${r.identity} ${r.force_rls?'FORCE':'NO FORCE'} ROW LEVEL SECURITY;`);}
 for(const f of b.functions)sql.push(...privileges('FUNCTION',f.identity,f.acl,a.functions.find(x=>x.identity===f.identity)?.acl||[]));
 for(const s of b.schemas)sql.push(...privileges('SCHEMA',q(s.name),s.acl,a.schemas.find(x=>x.name===s.name)?.acl||[]));
 const defaultKey=d=>[d.owner,d.schema,d.type].join('/');const defaults=new Map([...b.defaults,...a.defaults].map(d=>[defaultKey(d),d]));
 for(const [key,d] of defaults){
  const old=b.defaults.find(x=>defaultKey(x)===key),now=a.defaults.find(x=>defaultKey(x)===key);
  if(JSON.stringify(old)===JSON.stringify(now))continue;
  if(d.type!=='f')throw Error('Non-function default privileges require separate review');
  if(d.schema==='korvo_api_private')continue; // Dropped below with the new schema.
  const prefix=`ALTER DEFAULT PRIVILEGES FOR ROLE ${q(d.owner)}${d.schema?' IN SCHEMA '+q(d.schema):''}`;
  const original=old?.acl||(!d.schema?[{grantee:d.owner,privilege:'EXECUTE',grantable:false},{grantee:'PUBLIC',privilege:'EXECUTE',grantable:false}]:[]);
  const names=new Set([...original,...(now?.acl||[])].map(x=>x.grantee));
  for(const name of names)sql.push(`${prefix} REVOKE ALL ON FUNCTIONS FROM ${role(name)};`);
  for(const x of original)sql.push(`${prefix} GRANT ${x.privilege} ON FUNCTIONS TO ${role(x.grantee)}${x.grantable?' WITH GRANT OPTION':''};`);
 }
 for(const f of a.functions.filter(f=>!b.functions.some(old=>old.identity===f.identity)))sql.push(`DROP FUNCTION ${f.identity};`);
 if(a.schemas.some(s=>s.name==='korvo_api_private'))sql.push('DROP SCHEMA korvo_api_private;'); // Deliberately NO CASCADE.
 sql.push(assertFingerprint(before.fingerprint,'Restore differs from original catalog'),'COMMIT;');
 return sql.join('\n')+'\n';
}
