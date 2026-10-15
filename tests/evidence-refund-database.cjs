// Disposable PostgreSQL only. Executes the actual review SQL; no hosted writes.
const {PGlite}=require('@electric-sql/pglite');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
(async()=>{
 const db=new PGlite();let checks=0;
 const ok=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
 const denied=async(sql,label,code)=>{let error;try{await db.exec(sql);}catch(e){error=e;}assert.ok(error,label);if(code)assert.equal(error.code,code,label);ok(true,label);};
 const c='10000000-0000-0000-0000-000000000001',w='10000000-0000-0000-0000-000000000002',other='10000000-0000-0000-0000-000000000003',admin='10000000-0000-0000-0000-000000000004';
 const j='20000000-0000-0000-0000-000000000001',pay='30000000-0000-0000-0000-000000000001',key='40000000-0000-0000-0000-000000000001';
 const as=async(uid,role='authenticated')=>{await db.exec(`reset role;select set_config('request.jwt.claim.sub','${uid}',false);set role ${role};`);};
 const row=async sql=>(await db.query(sql)).rows[0];
 try{
  await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
   create schema auth;create schema storage;create schema korvo_payments_private;
   create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
   create table public.profiles(id uuid primary key,account_type text,is_active boolean default true);
   insert into public.profiles(id,account_type) values('${c}','customer'),('${w}','professional'),('${other}','professional'),('${admin}','customer');
   create table public.platform_admins(user_id uuid primary key,is_active boolean,role text);insert into public.platform_admins values('${admin}',true,'owner');
   create table public.active_jobs(id uuid primary key,customer_id uuid,professional_id uuid,status text);
   insert into public.active_jobs values('${j}','${c}','${w}','active');
   create function korvo_payments_private.actor() returns uuid language plpgsql security definer set search_path='' as $$
   declare uid uuid:=auth.uid();begin if uid is null or not exists(select 1 from public.profiles where id=uid and is_active) then raise exception 'Authentication required' using errcode='42501';end if;return uid;end;$$;
   revoke all on function korvo_payments_private.actor() from public;
   create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
   create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text,unique(bucket_id,name));
   alter table storage.objects enable row level security;
   grant usage on schema auth,storage,public to anon,authenticated,service_role;
   grant select,insert,update,delete on storage.objects to anon,authenticated;
  `);
  // Actual marketplace table and constraints, without hosted dependencies.
  const paymentSQL=await fs.readFile('supabase/migrations/20261012142416_sandbox_marketplace_payments.sql','utf8');
  await db.exec(paymentSQL.slice(paymentSQL.indexOf('create table public.marketplace_payments'),paymentSQL.indexOf('create index marketplace_payments_customer')));
  await db.exec(`insert into public.marketplace_payments(id,active_job_id,customer_id,professional_id,quote_cents,professional_gross_cents,platform_fee_cents,customer_total_cents,status)
   values('${pay}','${j}','${c}','${w}',50000,50000,6000,56000,'paid')`);
  await db.exec(await fs.readFile('supabase/proposals/20261013174432_private_completion_evidence.sql','utf8'));
  await db.exec(await fs.readFile('supabase/proposals/20261013175001_administrative_refund_review.sql','utf8'));
  ok((await row(`select public.completion_evidence_summary('${j}') result`).catch(()=>({result:null}))).result===null,'unsigned evidence summary denied');
  await as(w);ok((await row(`select public.completion_evidence_summary('${j}') result`)).result.required===false,'preexisting job is explicitly legacy');await db.exec('reset role');
  await db.exec(`update public.active_jobs set status='pending_confirmation' where id='${j}';update public.active_jobs set status='completed' where id='${j}';update public.active_jobs set status='active' where id='${j}'`);ok(true,'legacy completion not stranded by new photo gate');
  await db.exec(`insert into korvo_evidence_private.requirements(active_job_id) values('${j}')`);
  const newJob='20000000-0000-0000-0000-000000000002';
  await db.exec(`insert into public.active_jobs values('${newJob}','${c}','${w}','active')`);
  ok((await row(`select count(*)::int n from korvo_evidence_private.requirements where active_job_id='${newJob}'`)).n===1,'new jobs automatically enrolled');
  await denied(`update public.active_jobs set status='pending_confirmation' where id='${newJob}'`,'new job cannot bypass evidence');
  await as(w);await denied(`delete from korvo_evidence_private.requirements where active_job_id='${newJob}'`,'professional cannot opt out of evidence','42501');await db.exec('reset role');

  ok((await row("select public from storage.buckets where id='project-completion-evidence'")).public===false,'evidence bucket is private');
  const reserve=(mime='image/png',size=100,name='fixture.png')=>`select public.completion_reserve_photo('${j}','${name}','${mime}',${size}) result`;
  for(const uid of [c,other,admin]){await as(uid);await denied(reserve(),'nonassigned '+uid.slice(-1)+' cannot reserve photo','42501');}
  await as('','anon');await denied(reserve(),'anonymous cannot reserve','42501');
  await as(w);await denied(reserve('text/html'),'HTML declaration rejected');await denied(reserve('image/png',10485761),'oversize rejected');await denied(reserve('image/png',100,'../escape.png'),'path traversal rejected');
  const photoKey='50000000-0000-0000-0000-000000000001';
  const stableReserve=`select public.completion_reserve_photo('${j}','fixture.png','image/png',100,'${photoKey}') result`;
  const photo=(await row(stableReserve)).result;
  ok((await row(stableReserve)).result.id===photo.id,'reservation retries reuse original id and path');
  await denied(`select public.completion_reserve_photo('${j}','changed.png','image/png',100,'${photoKey}')`,'same reservation key cannot change file');
  await denied(`select public.completion_reserve_photo('${j}','fixture.png','image/png',100,null)`,'null request key rejected');
  await db.exec(`insert into storage.objects(bucket_id,name) values('project-completion-evidence','${photo.storage_path}')`);ok(true,'assigned professional uploads reserved path');
  await denied(`insert into storage.objects(bucket_id,name) values('project-completion-evidence','${j}/${w}/unreserved')`,'unreserved upload rejected','42501');
  await as(other);await denied(`select public.completion_authorize_verification('${photo.id}')`,'cross-account verifier authorization denied','42501');
  await denied(`insert into storage.objects(bucket_id,name) values('project-completion-evidence','${photo.storage_path}x')`,'cross-account upload rejected','42501');
  await as(c);ok((await row(`select public.completion_evidence_summary('${j}') result`)).result.photos.length===0,'customer cannot see unverified evidence');
  await as(w);ok((await row(`select public.completion_authorize_verification('${photo.id}') result`)).result.id===photo.id,'assigned owner can authorize verifier');
  await denied(`select public.completion_validate_file('${photo.id}',repeat('a',64),100,'image/png')`,'frontend cannot attest file validation','42501');
  await db.exec('reset role');await denied(`update public.active_jobs set status='pending_confirmation' where id='${j}'`,'completion blocked without verified photo');
  await denied(`update korvo_evidence_private.photos set file_status='validated' where id='${photo.id}'`,'null verification metadata cannot pass constraint','23514');
  await as('', 'service_role');
  await denied(`select public.completion_validate_file('${photo.id}',repeat('a',64),101,'image/png')`,'server byte mismatch rejected');
  await db.exec(`select public.completion_validate_file('${photo.id}',repeat('a',64),100,'image/png')`);ok(true,'service verifier records matching metadata');
  await db.exec(`select public.completion_validate_file('${photo.id}',repeat('a',64),100,'image/png')`);ok(true,'same verification is idempotent');
  await denied(`select public.completion_validate_file('${photo.id}',repeat('b',64),100,'image/png')`,'verified content hash immutable');
  await as(c);ok((await db.query('select * from storage.objects')).rows.length===1,'customer reads verified evidence');
  await as(other);ok((await db.query('select * from storage.objects')).rows.length===0,'nonparticipant cannot read evidence');await denied(`select public.completion_evidence_summary('${j}')`,'summary participant separation','42501');
  await as(w);await db.exec(`update storage.objects set name='changed'`);ok((await row('select name from storage.objects')).name===photo.storage_path,'client cannot replace evidence');
  await db.exec('delete from storage.objects');ok((await db.query('select * from storage.objects')).rows.length===1,'client cannot delete evidence');
  const pending=(await row(reserve())).result;
  await db.exec('reset role');await denied(`update public.active_jobs set status='pending_confirmation' where id='${j}'`,'unresolved reservation blocks submission');
  await as(w);await db.exec(`select public.completion_abandon_photo('${pending.id}')`);ok(true,'owner abandons unused reservation');
  await denied(`select public.completion_abandon_photo('${photo.id}')`,'validated photo cannot be abandoned');
  const extras=[];for(let n=0;n<4;n++)extras.push((await row(reserve('image/png',100,'extra'+n+'.png'))).result);
  await denied(reserve(),'sixth active photo rejected');
  ok((await row(stableReserve)).result.id===photo.id,'idempotent retry works at five-photo capacity');
  for(const extra of extras)await db.exec(`select public.completion_abandon_photo('${extra.id}')`);
  await db.exec('reset role');await denied(`update public.active_jobs set status='completed' where id='${j}'`,'direct completion bypass rejected');
  await db.exec(`update public.active_jobs set status='pending_confirmation' where id='${j}'`);ok(true,'verified evidence allows completion submission');
  await denied(`update public.active_jobs set status='completed' where id='${j}'`,'customer review required');
  await as(w);await denied(`select public.completion_acknowledge_photos('${j}')`,'professional cannot acknowledge for customer','42501');
  ok((await row(stableReserve)).result.file_status==='validated','retry recovers validated reservation after submission');
  await denied(reserve(),'new photo cannot be reserved after submission','42501');
  await as(c);await db.exec(`select public.completion_acknowledge_photos('${j}')`);ok(true,'customer acknowledges verified evidence');
  await db.exec('reset role');await db.exec(`update public.active_jobs set status='completed' where id='${j}'`);ok(true,'reviewed evidence allows customer completion');
  const request=(pro=50000,fee=6000,k=key,reason='Customer cancellation review')=>`select public.admin_request_marketplace_refund_review('${pay}','${k}',${pro},${fee},'${reason}') result`;
  for(const uid of [c,w,other]){await as(uid);await denied(request(),'ordinary '+uid.slice(-1)+' cannot request refund review','42501');await denied('select public.admin_marketplace_refund_queue()','ordinary '+uid.slice(-1)+' cannot read financial queue','42501');}
  await db.exec('reset role');await db.exec(`insert into public.platform_admins values('${other}',true,'support')`);await as(other);
  await denied(request(),'support cannot request financial review','42501');
  await denied('select public.admin_marketplace_refund_queue()','support cannot read financial queue','42501');
  await denied(`select public.admin_review_marketplace_refund(gen_random_uuid(),'recommended','Support must not move financial state')`,'support cannot recommend financial adjustment','42501');
  await db.exec('reset role');await db.exec(`delete from public.platform_admins where user_id='${other}'`);
  await as('','anon');await denied(request(),'anonymous financial access denied','42501');
  await as(admin);await denied(request(50001),'professional refund cannot exceed quote');await denied(request(50000,6001),'fee refund cannot exceed fee');await denied(request(0,0),'zero refund rejected');await denied(request(-1),'negative refund rejected');
  const review=(await row(request())).result;ok(review.execution_enabled===false,'review cannot execute refund');
  ok((await row(request())).result.id===review.id,'request idempotent');await denied(request(49999),'same key with changed amount rejected');
  await denied(request(50000,6000,'40000000-0000-0000-0000-000000000002'),'second open refund request rejected','23505');
  ok((await row('select public.admin_marketplace_refund_queue() result')).result.length===1,'admin can inspect bounded queue');
  await db.exec(`select public.admin_review_marketplace_refund('${review.id}','needs_information','Please provide additional evidence')`);ok(true,'review can request information');
  const recommend=`select public.admin_review_marketplace_refund('${review.id}','recommended','Evidence supports owner review')`;
  for(const [change,label] of [
   ["status='disputed'",'disputed payment cannot be recommended'],
   ["status='refunded',refunded_total_cents=56000,professional_refunded_cents=50000,platform_fee_refunded_cents=6000",'fully refunded payment cannot be recommended'],
   ["release_status='processing'",'transfer preparation blocks recommendation'],
   ["requires_review=false",'missing payment hold blocks recommendation'],
   ["refunded_total_cents=100",'unallocated provider refund blocks recommendation'],
   ["status='partially_refunded',refunded_total_cents=100,professional_refunded_cents=100",'stale proposed allocation cannot be recommended']]){
   await db.exec('reset role');await db.exec(`update public.marketplace_payments set ${change} where id='${pay}'`);await as(admin);
   await denied(recommend,label);
   await db.exec('reset role');
   ok((await row(`select state from korvo_refunds_private.reviews where id='${review.id}'`)).state==='needs_information',label+' leaves review unchanged');
   await db.exec(`update public.marketplace_payments set status='paid',release_status='held',requires_review=true,refunded_total_cents=0,professional_refunded_cents=0,platform_fee_refunded_cents=0 where id='${pay}'`);await as(admin);
  }
  await db.exec(`select public.admin_review_marketplace_refund('${review.id}','recommended','Evidence supports owner review')`);ok(true,'review recommendation recorded');
  await db.exec(`select public.admin_review_marketplace_refund('${review.id}','recommended','Evidence supports owner review')`);ok(true,'decision retry idempotent');
  await denied(`select public.admin_review_marketplace_refund('${review.id}','rejected','Changed decision without a new review')`,'terminal recommendation cannot silently change');
  await db.exec('reset role');
  let p=await row(`select * from public.marketplace_payments where id='${pay}'`);
  ok(p.requires_review&&p.release_status==='held'&&p.status==='paid'&&Number(p.refunded_total_cents)===0,'review holds funds without changing provider financial state');
  ok(Number(p.professional_gross_cents)===50000&&Number(p.platform_fee_cents)===6000&&Number(p.customer_total_cents)===56000,'quote plus 12 percent unchanged');
  ok(Number((await row('select count(*) n from korvo_refunds_private.audit')).n)===3,'retries create no duplicate audit events');
  await db.exec(`update public.platform_admins set is_active=false where user_id='${admin}'`);await as(admin);await denied('select public.admin_marketplace_refund_queue()','revoked admin immediately denied','42501');
  await db.exec('reset role');await db.exec(`update public.platform_admins set is_active=true where user_id='${admin}';update public.profiles set is_active=false where id='${admin}'`);await as(admin);await denied(request(),'inactive admin denied','42501');
  await db.exec('reset role');await db.exec(`update public.profiles set is_active=true where id='${admin}';update public.marketplace_payments set refunded_total_cents=100 where id='${pay}'`);
  // Use a rejected old review to test a subsequent allocation-safe request.
  await db.exec(`update korvo_refunds_private.reviews set state='rejected'`);await as(admin);
  await denied(request(100,0,'40000000-0000-0000-0000-000000000003'),'unallocated existing refund requires reconciliation');
  for(const role of ['anon','authenticated','service_role']){
   await as(c,role);
   for(const table of ['korvo_evidence_private.photos','korvo_refunds_private.reviews','korvo_refunds_private.audit'].filter(t=>role!=='service_role'||t!=='korvo_evidence_private.photos'))await denied('select * from '+table,role+' direct '+table+' denied','42501');
  }
  await db.exec('reset role');
  for(const schema of ['korvo_evidence_private','korvo_refunds_private']){
   await db.exec(`grant usage on schema ${schema} to authenticated;grant select,insert on all tables in schema ${schema} to authenticated`);
  }
  await as(c);ok((await db.query('select * from korvo_refunds_private.reviews')).rows.length===0,'refund RLS survives accidental SELECT grant');
  ok((await db.query('select * from korvo_evidence_private.photos')).rows.length===0,'evidence RLS survives accidental SELECT grant');
  await denied(`insert into korvo_refunds_private.reviews(payment_id,request_key,professional_cents,platform_fee_cents,reason,requested_by) values('${pay}',gen_random_uuid(),1,0,'Malicious review request','${c}')`,'refund RLS rejects direct forged request','42501');
  console.log(JSON.stringify({checks_passed:checks,environment:'isolated PostgreSQL WASM',hosted_storage_or_auth_tested:false,refund_execution_enabled:false}));
 }finally{await db.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
