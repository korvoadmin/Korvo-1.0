// Isolated PostgreSQL rehearsal. No network, Supabase credentials or persisted users.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();let checks=0;
 const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
 const denied=async(sql,label)=>{let failed=false;try{await db.exec(sql);}catch{failed=true;}ok(failed,label);};
 const c='10000000-0000-0000-0000-000000000001', w='10000000-0000-0000-0000-000000000002', w2='10000000-0000-0000-0000-000000000003';
 const g='20000000-0000-0000-0000-000000000001', g2='20000000-0000-0000-0000-000000000002';
 try {
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
   create table public.profiles(id uuid primary key,account_type text,is_active boolean);
   insert into public.profiles values('${c}','customer',true),('${w}','professional',true),('${w2}','professional',true);
   grant usage on schema public to service_role;grant select on public.profiles to service_role;`);
  await db.exec(await fs.readFile('supabase/proposals/20261013002039_gig_foundation_disabled.sql','utf8'));
  ok((await db.query('select count(*)::int n from pg_tables where schemaname=\'korvo_gigs_private\'')).rows[0].n===8,'eight isolated private tables created');
  ok((await db.query('select count(*)::int n from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname=\'korvo_gigs_private\' and c.relkind=\'r\' and c.relrowsecurity')).rows[0].n===8,'all gig tables have RLS');
  const settings=(await db.query('select * from korvo_gigs_private.settings')).rows[0];
  ok(!settings.publishing_enabled&&!settings.contractor_booking_enabled&&!settings.payment_execution_enabled,'all gates default disabled');
  await denied('update korvo_gigs_private.settings set payment_execution_enabled=true','payment enablement hard rejected');
  for(const role of ['anon','authenticated']) {
   await db.exec('set role '+role);
   for(const table of ['settings','business_profiles','worker_profiles','gigs','applications','assignments','time_records','audit_events']) {
    await denied('select * from korvo_gigs_private.'+table,role+' cannot read '+table);
   }
   await denied('update korvo_gigs_private.settings set publishing_enabled=true',role+' cannot enable bookings');
   await denied('insert into korvo_gigs_private.worker_profiles(worker_id) values(\''+w+'\')',role+' cannot impersonate worker');
   await db.exec('reset role');
  }
  await db.exec(`set role service_role;
   insert into korvo_gigs_private.business_profiles values('${c}','Fixture restaurant','restaurant','Atlanta');
   insert into korvo_gigs_private.worker_profiles(worker_id) values('${w}'),('${w2}');`);
  await denied(`insert into korvo_gigs_private.worker_profiles(worker_id) values('${c}')`,'customer cannot become gig worker');
  await denied(`insert into korvo_gigs_private.business_profiles values('${w}','Fake','bar','Atlanta')`,'worker cannot acquire business account by metadata');
  const create=(id,extra='')=>`insert into korvo_gigs_private.gigs(id,business_id,title,category,city,private_location,starts_at,ends_at,time_zone,positions,compensation_type,hourly_rate_cents${extra?',state,classification,classification_review_id,category_approved':''}) values('${id}','${c}','Evening fixture','Dishwasher','Atlanta','private fixture address','2026-10-16T21:00Z','2026-10-17T03:00Z','America/New_York',1,'hourly',1800${extra?','+extra:''})`;
  await db.exec(create(g));
  await denied(`update korvo_gigs_private.gigs set state='open',classification='independent_contractor',classification_review_id='review',category_approved=true where id='${g}'`,'review alone cannot open disabled gig');
  await denied(`update korvo_gigs_private.gigs set classification='independent_contractor' where id='${g}'`,'contractor classification cannot lack review');
  await denied(`update korvo_gigs_private.gigs set time_zone='Fake/Zone' where id='${g}'`,'invalid time zone rejected');
  await db.exec(`insert into korvo_gigs_private.applications(gig_id,worker_id) values('${g}','${w}'),('${g}','${w2}')`);
  await denied(`insert into korvo_gigs_private.applications(gig_id,worker_id) values('${g}','${w}')`,'duplicate applications rejected');
  const reserve=(gig,worker,state='selected')=>`insert into korvo_gigs_private.assignments(gig_id,worker_id,state,starts_at,ends_at) values('${gig}','${worker}','${state}','2026-10-10T00:00Z','2026-10-10T01:00Z')`;
  await denied(reserve(g,w),'disabled gate rejects reservation');
  await denied(reserve(g,w,'completed'),'cannot bypass disabled gate by inserting completed booking');
  // Hypothetical future approvals exist ONLY in this disposable database.
  await db.exec(`update korvo_gigs_private.settings set publishing_enabled=true,contractor_booking_enabled=true`);
  await db.exec(`update korvo_gigs_private.gigs set classification='employee',classification_review_id='review' where id='${g}'`);
  await denied(`update korvo_gigs_private.gigs set state='open',category_approved=true where id='${g}'`,'employee publishing blocked even with global contractor gate');
  await db.exec(`update korvo_gigs_private.gigs set state='open',classification='independent_contractor',classification_review_id='review',category_approved=true where id='${g}'`);
  await db.exec(reserve(g,w));
  const assignment=(await db.query('select * from korvo_gigs_private.assignments')).rows[0];
  ok(new Date(assignment.starts_at).toISOString()==='2026-10-16T21:00:00.000Z','server overwrites client-supplied reservation interval');
  await denied(reserve(g,w),'duplicate assignment rejected');
  await denied(reserve(g,w2),'capacity exceeded rejected');
  await db.exec(create(g2,"'open','independent_contractor','review',true"));
  await db.exec(`insert into korvo_gigs_private.applications(gig_id,worker_id) values('${g2}','${w}')`);
  await denied(reserve(g2,w),'same worker overlapping gigs rejected');
  await denied(`update korvo_gigs_private.gigs set ends_at=ends_at+interval '1 hour' where id='${g}'`,'reserved schedule immutable');
  await denied(`update korvo_gigs_private.gigs set hourly_rate_cents=1584 where id='${g}'`,'cannot deduct fee by editing reserved rate');
  await db.exec(`update korvo_gigs_private.assignments set state='canceled' where gig_id='${g}'`);
  await db.exec(reserve(g2,w));ok(true,'canceled reservation releases overlap without wage forfeiture');
  ok((await db.query("select count(*)::int n from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public'")).rows[0].n===0,'no public gig RPC or payment endpoint introduced');
  console.log(JSON.stringify({checks_passed:checks,environment:'isolated PostgreSQL WASM',concurrent_sessions_tested:false}));
 } finally {await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
