// Disposable native CI database only; no hosted settings or real bookings change.
const {Pool}=require('pg'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
if(process.env.CI!=='true'||process.env.PGDATABASE!=='korvo_finance_test'||!['127.0.0.1','localhost'].includes(process.env.PGHOST))throw Error('Dedicated local CI database required');
const admin=new Pool();await admin.query('create database korvo_gig_concurrency');await admin.end();
const pool=new Pool({database:'korvo_gig_concurrency',max:6});let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};
const c='10000000-0000-0000-0000-000000000001';const workers=[2,3,4,5].map(n=>`10000000-0000-0000-0000-00000000000${n}`);
const gigs=[1,2,3,4].map(n=>`20000000-0000-0000-0000-00000000000${n}`);
const insert=(gig,worker)=>pool.query(`insert into korvo_gigs_private.assignments(gig_id,worker_id,state,starts_at,ends_at) values($1,$2,'selected',now(),now()+interval '1 hour') returning id`,[gig,worker]);
async function blockedPair(lock,queries){const blocker=await pool.connect();let waiting=0;try{await blocker.query('begin');await lock(blocker);const pending=queries.map(q=>q());const settled=Promise.allSettled(pending);const end=Date.now()+4000;while(Date.now()<end){waiting=(await blocker.query("select count(*)::int n from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and query like 'insert into korvo_gigs_private.assignments%'")).rows[0].n;if(waiting===2)break;await new Promise(r=>setTimeout(r,25));}await blocker.query('commit');return {waiting,results:await settled};}finally{try{await blocker.query('rollback');}finally{blocker.release();}}}
try{
await pool.query(`create table public.profiles(id uuid primary key,account_type text,is_active boolean);insert into public.profiles values('${c}','customer',true),${workers.map(w=>`('${w}','professional',true)`).join(',')}`);
await pool.query(await fs.readFile('supabase/proposals/20261013002039_gig_foundation_disabled.sql','utf8'));
await pool.query(`insert into korvo_gigs_private.business_profiles values('${c}','CI synthetic restaurant','restaurant','Atlanta');insert into korvo_gigs_private.worker_profiles(worker_id) values ${workers.map(w=>`('${w}')`).join(',')};
update korvo_gigs_private.settings set publishing_enabled=true,contractor_booking_enabled=true`);
for(const g of gigs)await pool.query(`insert into korvo_gigs_private.gigs(id,business_id,title,category,city,private_location,starts_at,ends_at,time_zone,positions,compensation_type,hourly_rate_cents,state,classification,classification_review_id,category_approved)
values($1,$2,'CI fixture','Dishwasher','Atlanta','synthetic location','2026-10-16T21:00Z','2026-10-17T03:00Z','America/New_York',1,'hourly',1800,'open','independent_contractor','CI-only-review',true)`,[g,c]);
for(const g of gigs)for(const w of workers)await pool.query('insert into korvo_gigs_private.applications(gig_id,worker_id) values($1,$2)',[g,w]);
let result=await blockedPair(b=>b.query('select id from korvo_gigs_private.gigs where id=$1 for update',[gigs[0]]),[()=>insert(gigs[0],workers[0]),()=>insert(gigs[0],workers[1])]);
ok(result.waiting===2,'two native capacity requests overlap on same gig lock');
ok(result.results.filter(r=>r.status==='fulfilled').length===1&&result.results.some(r=>r.reason?.message==='Gig capacity reached'),'one concurrent applicant wins final slot; other is denied capacity');
ok((await pool.query('select count(*)::int n from korvo_gigs_private.assignments where gig_id=$1',[gigs[0]])).rows[0].n===1,'capacity remains one after real race');
result=await blockedPair(b=>b.query('select pg_advisory_xact_lock(hashtextextended($1,97013))',[workers[2]]),[()=>insert(gigs[1],workers[2]),()=>insert(gigs[2],workers[2])]);
ok(result.waiting===2,'same worker scheduling requests overlap on advisory lock');
ok(result.results.filter(r=>r.status==='fulfilled').length===1&&result.results.some(r=>r.reason?.message==='Worker scheduling conflict'),'same worker cannot win simultaneous overlapping gigs');
const rollback=await pool.connect();try{await rollback.query('begin');await rollback.query(`insert into korvo_gigs_private.assignments(gig_id,worker_id,state,starts_at,ends_at) values($1,$2,'selected',now(),now()+interval '1 hour')`,[gigs[3],workers[3]]);await rollback.query('rollback');}catch(e){await rollback.query('rollback');throw e;}finally{rollback.release();}
ok((await pool.query('select count(*)::int n from korvo_gigs_private.assignments where gig_id=$1',[gigs[3]])).rows[0].n===0,'aborted reservation leaves no capacity record');
const settings=(await pool.query('select * from korvo_gigs_private.settings')).rows[0];ok(!settings.payment_execution_enabled,'native tests never enable employee or contractor payment execution');
console.log(JSON.stringify({checks_passed:checks,layer:'native PostgreSQL independent-session gig concurrency',hosted_supabase:false}));
}finally{await pool.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
