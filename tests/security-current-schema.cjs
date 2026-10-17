// Opt-in private catalog replay; never connects to Supabase or copies user records.
const {PGlite}=require('@electric-sql/pglite');const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{
 const file=process.argv[2];if(!file)throw Error('Private catalog fixture path required (outside Git)');
 const {before,clone}=JSON.parse(fs.readFileSync(file,'utf8'));
 const {SNAPSHOT_QUERY,restoreSQL}=await import('../scripts/security-snapshot.mjs');const db=new PGlite();
 const q=s=>'"'+s.replaceAll('"','""')+'"';let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};
 try{
  await db.exec("set check_function_bodies=false");
  for(const role of clone.roles)await db.exec(`create role ${q(role)}`);
  for(const schema of clone.schemas)await db.exec(`create schema ${q(schema)}`);
  for(const sql of [...clone.enums,...clone.sequences,...clone.tables,...clone.constraints,...clone.helpers])await db.exec(sql);
  for(const sql of clone.schema_grants)await db.exec(sql);
  for(const f of before.snapshot.functions)await db.exec(f.definition);
  for(const r of before.snapshot.relations)await db.exec(`alter table ${r.identity} owner to ${q(r.owner)}`);
  for(const f of before.snapshot.functions)await db.exec(`alter function ${f.identity} owner to ${q(f.owner)}`);
  for(const s of before.snapshot.schemas)await db.exec(`alter schema ${q(s.name)} owner to ${q(s.owner)}`);
  // Recreate current non-function defaults as clone setup, not as an unsupported
  // rollback mutation. The rollout itself must leave these default ACLs unchanged.
  for(const d of before.snapshot.defaults){
   const kind={r:'TABLES',S:'SEQUENCES',f:'FUNCTIONS'}[d.type];if(!kind)throw Error('Unsupported clone default type');
   const prefix=`alter default privileges for role ${q(d.owner)}${d.schema?' in schema '+q(d.schema):''}`;
   await db.exec(`${prefix} revoke all on ${kind} from public`);
   for(const a of d.acl)await db.exec(`${prefix} grant ${a.privilege} on ${kind} to ${a.grantee==='PUBLIC'?'PUBLIC':q(a.grantee)}${a.grantable?' with grant option':''}`);
  }
  const capture=async()=>(await db.query(SNAPSHOT_QUERY)).rows[0];
  // Restore original catalog permissions into the empty clone, never a hosted database.
  const initialInverse=restoreSQL(before,await capture());
  await db.exec(initialInverse);
  ok((await capture()).fingerprint===before.fingerprint,'empty clone exactly matches current scoped metadata');
  const manifest=JSON.parse(fs.readFileSync('supabase/proposals/security-review/manifest.json','utf8'));
  for(const p of manifest.packages){await db.exec(fs.readFileSync('supabase/proposals/security-review/'+p.file,'utf8'));ok(true,'current-schema package '+p.order+' '+p.name);}
  // Confirmed nonpersonal membership catalog, verified read-only against the project.
  await db.exec(`insert into public.professional_membership_plans(code,name,monthly_price,included_jobs,allowance_scope,billing_interval,is_paid,priority_support,sort_order) values
   ('free_trial','Free Trial',0,1,'lifetime','none',false,false,0),
   ('starter','Starter',29.99,3,'billing_period','monthly',true,false,10),
   ('growth','Growth',49.99,6,'billing_period','monthly',true,false,20),
   ('unlimited','Unlimited',89.99,null,'billing_period','monthly',true,true,30)`);
  const matrix=await db.exec(fs.readFileSync('supabase/tests/security_hardening.sql','utf8'));
  const result=matrix.find(r=>r.rows?.[0]?.checks_passed!==undefined)?.rows[0];
  ok(Number(result?.checks_passed)>=134,'current-schema customer/professional/support/admin/anonymous matrix: '+result?.checks_passed+' checks');
  ok((await db.query('select count(*)::int n from public.profiles')).rows[0].n===0,'no account records copied into clone');
  const fixture='90000000-0000-0000-0000-000000000001';
  await db.exec(`insert into auth.users(id,email,aud,role) values('${fixture}','recovery-fixture@example.invalid','authenticated','authenticated');
    insert into public.profiles(id,account_type,is_active,onboarding_complete) values('${fixture}','customer',true,true)`);
  const rowBefore=(await db.query('select to_jsonb(p) data from public.profiles p')).rows[0].data;
  const after=await capture();const inverse=restoreSQL(before,after);
  await db.exec('alter table public.profiles disable row level security');
  await assert.rejects(db.exec(inverse),/Catalog drift/);await db.exec('rollback');ok(true,'current-schema rollback rejects unreviewed catalog drift');
  await db.exec('alter table public.profiles enable row level security');
  await db.exec(inverse);ok((await capture()).fingerprint===before.fingerprint,'all seven packages inverse restores actual current catalog fingerprint');
  assert.deepEqual((await db.query('select to_jsonb(p) data from public.profiles p')).rows[0].data,rowBefore);ok(true,'inverse preserves synthetic current-schema account row exactly');
  console.log(JSON.stringify({checks_passed:checks,layer:'isolated current-schema catalog replay',hosted:false,rows_exported:0}));
 }finally{await db.close();}
})().catch(e=>{console.error({message:e.message,code:e.code});process.exitCode=1;});
