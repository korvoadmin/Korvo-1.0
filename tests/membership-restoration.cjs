// Exercise the unchanged A6 implementation, not a mocked restoration algorithm.
const {PGlite}=require('@electric-sql/pglite'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
const {bootstrapFinancial,owner,admin,support,customer,professional,job}=require('./financial-fixture.cjs');
(async()=>{const db=new PGlite();let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};
const as=uid=>db.exec(`reset role;select set_config('request.jwt.claim.sub','${uid}',false);set role authenticated`);
const restore=reason=>`select public.admin_release_professional_job_usage('${job}','${reason}') result`;
try{
 await bootstrapFinancial(db);await db.exec(`create table auth.users(id uuid primary key);insert into auth.users values('${owner}'),('${admin}'),('${support}'),('${customer}'),('${professional}');
 create schema korvo_api_private;grant usage on schema korvo_api_private to authenticated;
 create function public.is_korvo_admin() returns boolean language sql security definer set search_path='' as $$select exists(select 1 from public.platform_admins where user_id=auth.uid() and is_active)$$;
 create table public.professional_job_usage(id uuid primary key,professional_id uuid,active_job_id uuid unique,released_at timestamptz,release_reason text,released_by_admin_id uuid);
 insert into public.professional_job_usage(id,professional_id,active_job_id) values('90000000-0000-0000-0000-000000000001','${professional}','${job}');
 revoke all on public.professional_job_usage from public,anon,authenticated,service_role;`);
 const source=await fs.readFile('supabase/proposals/20261012160000_harden_korvo_api_permissions.sql','utf8');
 const start=source.indexOf('CREATE OR REPLACE FUNCTION korvo_api_private.admin_release_professional_job_usage(');
 const end=source.indexOf('-- Reviewed API:',start);assert.ok(start>0&&end>start);await db.exec(source.slice(start,end));
 for(const uid of [support,customer,professional]){await as(uid);await assert.rejects(db.exec(restore('Reviewed cancellation reason')));ok(true,'nonfinancial role cannot restore membership allowance');}
 await as(owner);await assert.rejects(db.exec(restore('')));ok(true,'manual restoration requires recorded review reason');
 const first=(await db.query(restore('Owner reviewed pre-work cancellation'))).rows[0].result;ok(first===true,'verified owner manually restores allowance');
 const retry=(await db.query(restore('Repeated ambiguous response retry'))).rows[0].result;ok(retry===false,'repeated restoration does not restore another allowance');
 await db.exec('reset role');const row=(await db.query('select * from public.professional_job_usage')).rows[0];
 ok(row.release_reason==='Owner reviewed pre-work cancellation'&&row.released_by_admin_id===owner,'retry preserves original reason and verified actor');
 ok(!!row.released_at,'original consumed usage remains with restoration timestamp');
 await as(owner);await assert.rejects(db.exec('update public.professional_job_usage set released_at=null'));ok(true,'owner cannot bypass restoration procedure with direct table update');
 await db.exec('reset role');ok((await db.query('select count(*)::int n from public.professional_job_usage')).rows[0].n===1,'restoration never deletes consumed usage history');
 console.log(JSON.stringify({checks_passed:checks,layer:'isolated unchanged A6 membership restoration',hosted:false}));
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
