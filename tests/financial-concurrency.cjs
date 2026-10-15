// Real independent PostgreSQL sessions in a fresh CI-only disposable database.
const {Pool}=require('pg');const assert=require('node:assert/strict');
const {bootstrapFinancial,payment,key,owner,admin,support}=require('./financial-fixture.cjs');
(async()=>{
if(process.env.CI!=='true'||process.env.PGDATABASE!=='korvo_finance_test'||!['127.0.0.1','localhost'].includes(process.env.PGHOST))throw Error('Dedicated local CI database required');
const pool=new Pool({max:12});let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};
const setup=await pool.connect();const db={exec:q=>setup.query(q),query:q=>setup.query(q)};
const transaction=async(uid,fn,role='authenticated')=>{const c=await pool.connect();try{await c.query('begin');await c.query("set local statement_timeout='8s'");await c.query(`set local role ${role}`);await c.query("select set_config('request.jwt.claim.sub',$1,true)",[uid]);const value=await fn(c);await c.query('commit');return value;}catch(e){await c.query('rollback');throw e;}finally{c.release();}};
try{
await bootstrapFinancial(db);setup.release();
const review=await transaction(owner,async c=>{const r=(await c.query('select public.admin_request_marketplace_refund_review($1,$2,5000,600,$3) result',[payment,key,'Concurrent fixture explicit review request'])).rows[0].result;await c.query('select public.admin_review_marketplace_refund($1,$2,$3)',[r.id,'recommended','Concurrent fixture recommendation only']);return r.id;});
const blocker=await pool.connect();await blocker.query('begin');await blocker.query('select id from public.marketplace_payments where id=$1 for update',[payment]);
// All eight transactions must actually wait on the same held payment lock.
const concurrent=Array.from({length:8},(_,i)=>transaction(i%2?admin:owner,async c=>(await c.query('select public.admin_prepare_refund_ledger($1) result',[review])).rows[0].result));
let waiting=0;const deadline=Date.now()+5000;
while(Date.now()<deadline){const r=await pool.query("select count(*)::int n from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and query like '%admin_prepare_refund_ledger%'");waiting=r.rows[0].n;if(waiting===8)break;await new Promise(r=>setTimeout(r,30));}
try{ok(waiting===8,'eight independent sessions overlap and wait on payment lock');}finally{await blocker.query('commit');blocker.release();}
const operations=await Promise.all(concurrent);const op=operations[0];
ok(new Set(operations.map(o=>o.id)).size===1,'concurrent preparation creates exactly one operation');
ok(new Set(operations.map(o=>o.idempotency_key)).size===1,'concurrent preparation retains one durable provider key');
ok((await pool.query('select count(*)::int n from korvo_finance_private.operations')).rows[0].n===1,'database contains one allocation reservation');
ok((await pool.query("select count(*)::int n from korvo_refunds_private.audit where action='ledger_prepared'")).rows[0].n===1,'concurrent preparation creates one audit record');
await assert.rejects(transaction(support,c=>c.query('select public.admin_prepare_refund_ledger($1)',[review])));ok(true,'support remains denied during native concurrent workflow');
const observe=(receipt,state)=>transaction('',c=>c.query('select public.finance_record_observation($1,$2,$3,$4,$5) result',[op.id,receipt,'re_fixture',state,'a'.repeat(64)]),'service_role');
await Promise.all(Array.from({length:8},()=>observe('same-receipt','pending')));
ok((await pool.query('select count(*)::int n from korvo_finance_private.observations')).rows[0].n===1,'concurrent duplicate receipts append once');
await Promise.all([observe('success','succeeded'),observe('late','pending')]);
ok((await pool.query('select state from korvo_finance_private.operations')).rows[0].state==='succeeded','success survives competing late pending observation');
const c=await pool.connect();try{await c.query('begin');await c.query('select public.finance_record_observation($1,$2,$3,$4,$5)',[op.id,'aborted','re_fixture','succeeded','b'.repeat(64)]);await c.query('rollback');}finally{c.release();}
ok((await pool.query("select count(*)::int n from korvo_finance_private.observations where receipt_key='aborted'")).rows[0].n===0,'aborted transaction leaves no receipt');
const p=(await pool.query('select * from public.marketplace_payments where id=$1',[payment])).rows[0];
ok(p.release_status==='held'&&p.requires_review&&Number(p.refunded_total_cents)===0,'concurrency never clears hold or changes provider totals');
console.log(JSON.stringify({checks_passed:checks,layer:'native PostgreSQL independent-session concurrency',hosted_supabase:false,provider_execution:false}));
}finally{if(!setup.released)try{setup.release();}catch{}await pool.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
