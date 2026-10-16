// REVIEW-ONLY recovery generator. No connection, provider request or SQL execution.
export const A10_SNAPSHOT_QUERY=`select snapshot,md5(snapshot::text) fingerprint from (select jsonb_build_object(
'functions',(select jsonb_agg(jsonb_build_object('identity',format('%I.%I(%s)',n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)),'schema',n.nspname,'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',(select jsonb_agg(jsonb_build_object('grantee',case when a.grantee=0 then 'PUBLIC' else pg_get_userbyid(a.grantee) end,'privilege',a.privilege_type,'grantable',a.is_grantable) order by a.grantee,a.privilege_type) from aclexplode(coalesce(p.proacl,acldefault('f',p.proowner))) a)) order by n.nspname,p.proname,pg_get_function_identity_arguments(p.oid)) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' or n.nspname in('korvo_evidence_private','korvo_refunds_private','korvo_finance_private')),
'relations',(select jsonb_agg(jsonb_build_array(n.nspname,c.relname,c.relowner::regrole::text,c.relacl::text,c.relrowsecurity,c.relforcerowsecurity) order by n.nspname,c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace where c.relkind='r' and (n.nspname in('public','storage','korvo_evidence_private','korvo_refunds_private','korvo_finance_private'))),
'policies',(select jsonb_agg(to_jsonb(p) order by schemaname,tablename,policyname) from pg_policies p where schemaname in('public','storage','korvo_evidence_private','korvo_refunds_private','korvo_finance_private')),
'triggers',(select jsonb_agg(jsonb_build_array(t.tgname,pg_get_triggerdef(t.oid),t.tgenabled) order by n.nspname,c.relname,t.tgname) from pg_trigger t join pg_class c on c.oid=t.tgrelid join pg_namespace n on n.oid=c.relnamespace where not t.tgisinternal and n.nspname in('public','storage'))
) snapshot) s`;
const role=s=>s==='PUBLIC'?'PUBLIC':'"'+s.replaceAll('"','""')+'"';
export function a10RecoverySQL(before,frozen){
 if(!/^[a-f0-9]{32}$/.test(before?.fingerprint)||!/^[a-f0-9]{32}$/.test(frozen?.fingerprint))throw Error('Valid protected snapshots required');
 const guard=fp=>`DO $guard$ BEGIN IF (SELECT fingerprint FROM (${A10_SNAPSHOT_QUERY}) observed)<>'${fp}' THEN RAISE EXCEPTION 'A10 catalog drift: recovery refused'; END IF; END $guard$;`;
 const sql=['-- REVIEW ONLY. Separate A10 approval and qualified operator required.','BEGIN;',"SET LOCAL lock_timeout='5s';","SET LOCAL statement_timeout='60s';",guard(frozen.fingerprint),
 'DROP TRIGGER a10_pause_job_intake ON public.jobs;','DROP TRIGGER a10_pause_active_intake ON public.active_jobs;','DROP TRIGGER a10_pause_completion ON public.active_jobs;','DROP FUNCTION public.korvo_a10_containment_guard();'];
 for(const f of before.snapshot.functions.filter(f=>['korvo_evidence_private','korvo_refunds_private','korvo_finance_private'].includes(f.schema))){
  const after=frozen.snapshot.functions.find(a=>a.identity===f.identity);if(!after)throw Error('Missing protected function');if(JSON.stringify(after.acl)===JSON.stringify(f.acl))continue;
  const roles=new Set([...(f.acl||[]),...(after.acl||[])].map(a=>a.grantee));for(const name of roles)sql.push(`REVOKE ALL ON FUNCTION ${f.identity} FROM ${role(name)};`);
  for(const a of f.acl||[]){if(a.privilege!=='EXECUTE')throw Error('Unexpected function privilege');sql.push(`GRANT EXECUTE ON FUNCTION ${f.identity} TO ${role(a.grantee)}${a.grantable?' WITH GRANT OPTION':''};`);}
 }
 sql.push(guard(before.fingerprint),'COMMIT;');return sql.join('\n')+'\n';
}
