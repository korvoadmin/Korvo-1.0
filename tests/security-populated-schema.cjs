// OPT-IN: current managed catalog definitions + wholly synthetic retained data.
// Never connects to managed Supabase. Private input/output must remain outside Git.
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs'),assert=require('node:assert/strict'),path=require('node:path');
const {bootstrapCatalog}=require('./security-catalog-fixture.cjs');
(async()=>{
 const file=process.argv[2];if(!file||path.resolve(file).startsWith(process.cwd()+path.sep))throw Error('Private catalog outside Git required');
 const fixture=JSON.parse(fs.readFileSync(file,'utf8'));const managed=process.argv.includes('--managed-candidate');const packageDir=managed?'supabase/proposals/security-review-managed/':'supabase/proposals/security-review/';const manifest=JSON.parse(fs.readFileSync(packageDir+'manifest.json','utf8'));
 const {SNAPSHOT_QUERY,restoreSQL}=await import('../scripts/security-snapshot.mjs');const db=new PGlite();let restored,checks=0;const groups={};
 const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
 const capture=async()=>(await db.query(SNAPSHOT_QUERY)).rows[0];
 const id=n=>`91000000-0000-0000-0000-${String(n).padStart(12,'0')}`;
 const ids={customer:id(1),other:id(2),pro:id(3),otherPro:id(4),owner:id(5),support:id(6),inactive:id(7)};
 const login=async(name,role='authenticated')=>{await db.exec('reset role');await db.query("select set_config('request.jwt.claim.sub',$1,false),set_config('request.jwt.claims',$2,false)",[ids[name]||'',JSON.stringify({sub:ids[name],role,user_metadata:{role:'owner',is_admin:true}})]);await db.exec(`set role ${role}`);};
 const denied=async(sql,label)=>{await assert.rejects(db.exec(sql),e=>e.code==='42501'||/cannot|admin access|Authentication required|restricted|not allowed/i.test(e.message));ok(true,label);};
 const tables=fixture.clone.tables.map(s=>s.match(/^CREATE TABLE (\S+) /)[1]);
 const digest=async database=>{const result=[];for(const table of tables){const r=(await database.query(`select count(*)::int as count,md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) as hash from ${table} t`)).rows[0];result.push({table,...r});}return result;};
 try{
  await bootstrapCatalog(db,fixture,SNAPSHOT_QUERY,restoreSQL);ok((await capture()).fingerprint===fixture.before.fingerprint,'fresh clone matches actual current scoped catalog exactly');
  await db.exec(`insert into public.professional_membership_plans(code,name,monthly_price,included_jobs,allowance_scope,billing_interval,is_paid,priority_support,sort_order) values
   ('free_trial','Free Trial',0,1,'lifetime','none',false,false,0),('starter','Starter',29.99,3,'billing_period','monthly',true,false,10),('growth','Growth',49.99,6,'billing_period','monthly',true,false,20),('unlimited','Unlimited',89.99,null,'billing_period','monthly',true,true,30)`);
  for(const [name,uid] of Object.entries(ids)){
   await db.query("insert into auth.users(id,email,aud,role) values($1,$2,'authenticated','authenticated')",[uid,`${name}@example.invalid`]);
   const pro=['pro','otherPro'].includes(name);await db.query('insert into public.profiles(id,account_type,is_active,onboarding_complete,first_name) values($1,$2,$3,false,$4)',[uid,pro?'professional':'customer',name!=='inactive','Synthetic '+name]);
   if(pro){await db.query("insert into public.professional_profiles(id,business_name,services,service_areas) values($1,$2,$3,array['Atlanta'])",[uid,'Synthetic '+name,['Synthetic '+uid]]);await db.query('update public.profiles set onboarding_complete=true where id=$1',[uid]);}
  }
  await db.query("insert into public.platform_admins(user_id,role) values($1,'owner'),($2,'support')",[ids.owner,ids.support]);
  const bookings=[];
  for(const [customer,pro] of [['customer','pro'],['other','otherPro']]){
   await login(customer,'postgres');
   const job=(await db.query("insert into public.jobs(customer_id,title,category,city,state,status) values($1,'Synthetic retained project',$2,'Atlanta','GA','open') returning id",[ids[customer],'Synthetic '+ids[pro]])).rows[0].id;
   await db.query("select public.upsert_job_private_details($1,'Synthetic address',null,'Atlanta','GA','00000',null)",[job]);
   await login(pro,'postgres');
   const quote=(await db.query("insert into public.quotes(job_id,professional_id,customer_id,amount,timeframe,message) values($1,$2,$3,100,'Synthetic schedule','Synthetic quote') returning id",[job,ids[pro],ids[customer]])).rows[0].id;
   await login(customer,'postgres');
   const active=(await db.query("select public.respond_to_quote($1,'accept') result",[quote])).rows[0].result.active_job_id;
   const conversation=(await db.query('select id from public.conversations where quote_id=$1',[quote])).rows[0].id;
   for(let n=0;n<20;n++)await db.query("insert into public.messages(conversation_id,sender_id,body) values($1,$2,$3)",[conversation,ids[customer],'Synthetic retained message '+n]);
   await db.query("insert into public.marketplace_payments(active_job_id,customer_id,professional_id,quote_cents,professional_gross_cents,platform_fee_cents,customer_total_cents,status,requires_review) values($1,$2,$3,10000,10000,1200,11200,'paid',true)",[active,ids[customer],ids[pro]]);
   const issue=(await db.query("select public.open_project_issue($1,'quality_issue','Synthetic populated recovery issue','Manual review only') result",[active])).rows[0].result.issue_id;
   bookings.push({job,quote,active,conversation,issue,customer,pro});
  }
  await db.exec('reset role');
  await db.exec("insert into storage.buckets(id,name,public) values('project-issue-evidence','project-issue-evidence',false)");
  for(const b of bookings){
   assert.ok(b.issue,'fixture issue identifier');
   const objectPath=`${b.issue}/${ids[b.customer]}/synthetic.png`;
   await db.query("insert into storage.objects(bucket_id,name,owner_id,metadata) values('project-issue-evidence',$1,$2,'{\"synthetic\":true}')",[objectPath,ids[b.customer]]);
   await db.query("insert into public.project_issue_evidence(issue_id,uploaded_by,uploader_role,storage_path,file_name,mime_type,size_bytes) values($1,$2,'customer',$3,'synthetic.png','image/png',24)",[b.issue,ids[b.customer],objectPath]);
   await db.query("insert into public.project_issue_admin_notes(issue_id,admin_id,note) values($1,$2,'Synthetic retained operator note')",[b.issue,ids.owner]);
   await db.query("insert into public.professional_verifications(professional_id,verification_type) values($1,'identity')",[ids[b.pro]]);
  }
  await db.exec("insert into public.stripe_event_receipts(id,event_type,processed_at) values('evt_synthetic_recovery','synthetic.fixture',now())");
  // PGlite protects its built-in postgres role from ALTER ROLE. A distinct
  // non-superuser inherits public-object owner rights, but not Storage ownership.
  await db.exec('create role isolated_managed_operator nosuperuser bypassrls createrole createdb;grant postgres to isolated_managed_operator');
  const before=await capture(),rowsBefore=await digest(db);const populated=rowsBefore.filter(r=>r.count>0);const rowCount=populated.reduce((n,r)=>n+r.count,0);
  ok(populated.length>=15&&rowCount>=60,'representative retained relationships populated before migration');
  groups.population={tables:tables.length,populated_tables:populated.length,rows:rowCount,actor_accounts:7,storage_metadata_only:true};
  // A restore-capable isolated snapshot is exercised separately from the SQL inverse.
  const backup=await db.dumpDataDir('gzip');restored=await PGlite.create({loadDataDir:backup});
  assert.deepEqual(await digest(restored),rowsBefore);ok(true,'isolated database backup restores every retained table count and row digest');
  ok((await restored.query(SNAPSHOT_QUERY)).rows[0].fingerprint===before.fingerprint,'isolated database backup restores permissions, policies, functions and triggers');await restored.close();restored=null;
  const source=fs.readFileSync(manifest.source,'utf8');
  await db.exec('begin;set local role isolated_managed_operator');
  let managedFailure;try{await db.exec(source);}catch(e){managedFailure={code:e.code,message:e.message};}finally{await db.exec('rollback');}
  if(managed)ok(!managedFailure,'managed-compatible scope applies under non-superuser owner-rights alias');else ok(managedFailure?.code==='42501'&&/owner.*objects/.test(managedFailure.message),'actual-like non-superuser operator cannot alter managed Storage policies');
  groups.managed_permission_probe={candidate:managed?'managed-compatible':'original',passed:!managedFailure,sqlstate:managedFailure?.code||null,object:'storage.objects',hosted_role:'postgres',isolated_role:'isolated_managed_operator',operation:'ALTER POLICY',managed_ddl_attempted:false};
  ok((await capture()).fingerprint===before.fingerprint,'non-superuser rollout probe rollback restores prechange permissions');assert.deepEqual(await digest(db),rowsBefore);ok(true,'rollout probe preserves every populated row');
  await db.exec('begin');try{for(const p of manifest.packages.slice(0,3))await db.exec(fs.readFileSync(packageDir+p.file,'utf8'));await db.exec("do $$begin raise exception 'Synthetic interrupted rollout';end$$");}catch(e){assert.match(e.message,/Synthetic interrupted/);}finally{await db.exec('rollback');}
  ok((await capture()).fingerprint===before.fingerprint,'interruption after third package rolls back all catalog changes');assert.deepEqual(await digest(db),rowsBefore);ok(true,'interrupted deployment preserves all populated rows');
  await db.exec(managed?'begin;set local role isolated_managed_operator':'begin');for(const p of manifest.packages){await db.exec(fs.readFileSync(packageDir+p.file,'utf8'));ok(true,'populated package '+p.order+' applies under isolated owner-capable harness');}await db.exec('commit');
  assert.deepEqual(await digest(db),rowsBefore);ok(true,'committed seven-package hardening changes no retained data');
  const after=await capture();const inverse=restoreSQL(before,after);
  fs.writeFileSync(path.join(path.dirname(file),managed?'populated-managed-inverse.sql':'populated-inverse.sql'),inverse,{mode:0o600});
  const b=bookings[0];
  await login('customer');ok((await db.query('select id from public.profiles')).rows.length===1,'customer sees own profile only');
  ok((await db.query('select id from public.jobs')).rows.length===1,'customer sees own existing job only');
  ok((await db.query('select id from public.messages')).rows.length===20,'customer sees own retained conversation messages');
  await denied(`select public.get_job_private_details('${bookings[1].job}')`,'other customer address RPC denied');
  await denied('select public.admin_issue_queue()','forged owner metadata does not authorize customer admin access');
  await login('pro');ok((await db.query('select id from public.quotes')).rows.length===1,'professional sees own retained quote only');
  ok((await db.query('select id from public.messages')).rows.length===20,'professional sees assigned retained messages');
  await denied(`select public.send_korvo_message('${bookings[1].conversation}','Synthetic forbidden message')`,'professional cannot send to another pair conversation');
  await login('support');await db.query('select public.admin_issue_queue()');ok(true,'active support can access authorized support queue');
  await denied('select public.admin_decide_payment_review(null,null,null)','support cannot authorize financial review');
  await denied('select public.admin_release_professional_job_usage(null,null)','support cannot restore financial entitlement');
  await login('owner');ok((await db.query('select public.is_korvo_admin() result')).rows[0].result===true,'isolated database-assigned owner recognized');
  await db.query('select public.admin_issue_queue()');ok(true,'owner can access existing support cases');
  await login('customer','anon');await denied('select public.admin_issue_queue()','anonymous cannot use financial/support admin RPC');
  await denied('select id from public.messages','anonymous cannot read retained messages');
  await db.exec('reset role');
  for(const name of ['customer','pro']){await login(name);ok((await db.query("select id from storage.objects where bucket_id='project-issue-evidence'")).rows.length===1,'retained Storage policy isolates '+name+' evidence');
   await denied(`insert into storage.objects(bucket_id,name,owner_id) values('project-issue-evidence','${bookings[1].issue}/${ids[name]}/forbidden.png','${ids[name]}')`,'cross-pair Storage upload denied for '+name);
  }
  for(const name of ['support','owner']){await login(name);ok((await db.query("select id from storage.objects where bucket_id='project-issue-evidence'")).rows.length===2,'authorized '+name+' retains issue evidence read');}
  await db.exec('reset role');
  // Existing matrix creates independent actors and rolls every additional write back.
  const matrix=await db.exec(fs.readFileSync('supabase/tests/security_hardening.sql','utf8'));
  const matrixResult=matrix.find(r=>r.rows?.[0]?.checks_passed!==undefined)?.rows[0];ok(Number(matrixResult?.checks_passed)===134,'complete 134-check positive/negative matrix passes beside retained populated accounts');groups.authorization_matrix_checks=Number(matrixResult.checks_passed);
  assert.deepEqual(await digest(db),rowsBefore);ok(true,'authorization matrix rollback preserves all retained rows');
  await login('customer');const savedMessage=(await db.query("select public.send_korvo_message($1,'Synthetic committed after hardening') result",[b.conversation])).rows[0].result;
  ok(savedMessage.status==='sent','legitimate post-migration customer write commits through hardened RPC');await db.exec('reset role');
  const rowsAfterWrites=await digest(db);ok(rowsAfterWrites.find(x=>x.table==='public.messages').count===rowsBefore.find(x=>x.table==='public.messages').count+1,'post-migration committed message is added to preservation baseline');
  groups.population.rows_after_committed_activity=rowsAfterWrites.reduce((n,r)=>n+r.count,0);
  await db.exec('begin;set local role isolated_managed_operator');let inverseFailure;
  // Only adapt the snapshot query's CURRENT_USER default-ACL scope to its modeled
  // hosted operator name. No generated operational inverse is modified on disk.
  const modeledInverse=inverse.replaceAll('=current_user',"='postgres'");
  try{await db.exec(modeledInverse.replace(/^BEGIN;$/m,'').replace(/^COMMIT;$/m,''));}catch(e){inverseFailure=e;}finally{await db.exec('rollback');}
  if(managed)ok(!inverseFailure,'managed-compatible inverse runs under non-superuser owner-rights alias');else ok(inverseFailure?.code==='42501'&&/owner.*objects/.test(inverseFailure.message),'actual-like operator also lacks ownership required for changed Storage policy inverse');
  ok((await capture()).fingerprint===after.fingerprint,'permission-limited inverse probe rollback preserves hardened catalog');assert.deepEqual(await digest(db),rowsAfterWrites);ok(true,'inverse probe preserves all records including post-migration activity');
  await db.exec('alter table public.profiles disable row level security');await assert.rejects(db.exec(inverse),/Catalog drift/);await db.exec('rollback');ok(true,'populated inverse refuses catalog drift');await db.exec('alter table public.profiles enable row level security');
  await db.exec(inverse);ok((await capture()).fingerprint===before.fingerprint,'owner-capable inverse restores exact original catalog after commit');
  assert.deepEqual(await digest(db),rowsAfterWrites);ok(true,'owner-capable inverse preserves every retained row including committed post-migration activity');
  await login('customer');ok((await db.query('select id from public.jobs')).rows.length===1,'restored original permitted customer read still works');await db.exec('reset role');
  await assert.rejects(db.exec(inverse),/Catalog drift/);await db.exec('rollback');ok(true,'replayed inverse fails closed');
  const result={checks_passed:checks,candidate:managed?'managed-compatible':'original',...groups,layer:'PGlite PostgreSQL populated actual-schema rehearsal',hosted:false,real_user_rows_exported:0,managed_restore_verified:false};
  fs.writeFileSync(path.join(path.dirname(file),managed?'populated-managed-results.json':'populated-results.json'),JSON.stringify(result,null,2),{mode:0o600});console.log(JSON.stringify(result));
 }finally{if(restored)await restored.close();await db.close();}
})().catch(e=>{console.error({message:e.message,code:e.code});process.exitCode=1;});
