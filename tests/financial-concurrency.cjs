// Real independent PostgreSQL sessions in a fresh CI-only disposable database.
const {Pool}=require('pg');const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
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
await pool.query(await fs.readFile('supabase/proposals/financial_reconciliation_observations.sql','utf8'));
const target=await transaction(owner,async c=>(await c.query('select public.admin_financial_reconciliation_target($1) result',[payment])).rows[0].result);
const facts={version:1,sandbox:true,state:'needs_review',provider_status:'succeeded',source_matches:true,gross_cents:56000,captured_cents:56000,refunded_cents:0,pending_refund_cents:0,transferred_cents:0,reversed_cents:0,disputed:false,refunds_complete:true,transfers_complete:true,full_refund_professional_cents:null,full_refund_fee_cents:null,findings:['DATABASE_REVIEW_HOLD']};
const checkKey='60000000-0000-0000-0000-000000000001';
const record=(c,k=checkKey)=>c.query('select public.finance_record_reconciliation($1,$2,$3,$4,$5::jsonb) result',[payment,owner,k,target.revision,JSON.stringify(facts)]);
const lock=await pool.connect();await lock.query('begin');await lock.query('select id from public.marketplace_payments where id=$1 for update',[payment]);
const overlapping=Array.from({length:8},()=>transaction('',c=>record(c),'service_role'));const settled=Promise.all(overlapping);let observed=0;const until=Date.now()+5000;
while(Date.now()<until){observed=(await pool.query("select count(*)::int n from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and query like '%finance_record_reconciliation%'")).rows[0].n;if(observed===8)break;await new Promise(r=>setTimeout(r,25));}
try{ok(observed===8,'eight reconciliation writers genuinely overlap on payment lock');}finally{await lock.query('commit');lock.release();}
const saved=await settled;ok(new Set(saved.map(r=>r.rows[0].result.report_id)).size===1,'same observation request creates one immutable report concurrently');
ok((await pool.query('select count(*)::int n from korvo_finance_private.reconciliation_checks')).rows[0].n===1,'concurrent retries produce one reconciliation audit check');
ok((await pool.query('select count(*)::int n from korvo_finance_private.reconciliation_reports')).rows[0].n===1,'concurrent observation facts are not duplicated');
ok((await transaction('',c=>record(c),'service_role')).rows[0].result.report_id===saved[0].rows[0].result.report_id,'lost response replay returns the committed report');
await assert.rejects(transaction('',async c=>{await record(c,'60000000-0000-0000-0000-000000000002');throw Error('simulated interruption');},'service_role'),/simulated interruption/);
ok((await pool.query('select count(*)::int n from korvo_finance_private.reconciliation_checks')).rows[0].n===1,'process interruption rolls back observation audit atomically');
await pool.query("update public.marketplace_payments set updated_at=updated_at+interval '1 microsecond' where id=$1",[payment]);
await assert.rejects(transaction('',c=>record(c,'60000000-0000-0000-0000-000000000003'),'service_role'),/Payment changed/);ok(true,'later webhook revision invalidates provider observations');
const unchanged=(await pool.query('select release_status,requires_review,refunded_total_cents from public.marketplace_payments where id=$1',[payment])).rows[0];
ok(unchanged.release_status==='held'&&unchanged.requires_review&&Number(unchanged.refunded_total_cents)===0,'reconciliation races preserve all financial holds and totals');
await pool.query("update public.marketplace_payments set status='refunded',refunded_total_cents=56000 where id=$1",[payment]);
const fullTarget=await transaction(owner,async c=>(await c.query('select public.admin_financial_reconciliation_target($1) result',[payment])).rows[0].result);
const fullFacts={...facts,refunded_cents:56000,full_refund_professional_cents:50000,full_refund_fee_cents:6000,findings:['DATABASE_REVIEW_HOLD','UNALLOCATED_DATABASE_REFUND']};
const fullReport=(await transaction('',async c=>(await c.query('select public.finance_record_reconciliation($1,$2,$3,$4,$5::jsonb) result',[payment,owner,'60000000-0000-0000-0000-000000000004',fullTarget.revision,JSON.stringify(fullFacts)])).rows[0].result,'service_role')).report_id;
const accountingLock=await pool.connect();await accountingLock.query('begin');await accountingLock.query('select id from public.marketplace_payments where id=$1 for update',[payment]);
const corrections=Promise.all(Array.from({length:8},()=>transaction(owner,async c=>(await c.query('select public.admin_record_verified_full_refund_allocation($1,$2,$3) result',[fullReport,'70000000-0000-0000-0000-000000000001','Reviewed existing full-refund aggregate only'])).rows[0].result)));
let blocked=0;const accountingDeadline=Date.now()+5000;
while(Date.now()<accountingDeadline){blocked=(await pool.query("select count(*)::int n from pg_stat_activity where datname=current_database() and wait_event_type='Lock' and query like '%admin_record_verified_full_refund_allocation%'")).rows[0].n;if(blocked===8)break;await new Promise(r=>setTimeout(r,25));}
try{ok(blocked===8,'eight owner accounting retries genuinely overlap on payment lock');}finally{await accountingLock.query('commit');accountingLock.release();}
const receipts=await corrections;ok(new Set(receipts.map(r=>r.id)).size===1,'concurrent full-refund correction returns one durable receipt');
ok((await pool.query('select count(*)::int n from korvo_finance_private.allocation_corrections')).rows[0].n===1,'concurrent correction creates one immutable accounting audit');
const corrected=(await pool.query('select * from public.marketplace_payments where id=$1',[payment])).rows[0];
ok(Number(corrected.professional_refunded_cents)===50000&&Number(corrected.platform_fee_refunded_cents)===6000,'concurrent correction records original full-refund components exactly once');
ok(corrected.release_status==='held'&&corrected.requires_review&&Number(corrected.refunded_total_cents)===56000,'concurrent correction preserves review hold and provider refund total');
console.log(JSON.stringify({checks_passed:checks,layer:'native PostgreSQL independent-session concurrency',hosted_supabase:false,provider_execution:false}));
}finally{if(!setup.released)try{setup.release();}catch{}await pool.end();}
})().catch(e=>{console.error(e);process.exitCode=1;});
