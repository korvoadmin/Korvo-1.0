const {PGlite}=require('@electric-sql/pglite');const assert=require('node:assert/strict');const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process');
(async()=>{const {SNAPSHOT_QUERY,restoreSQL}=await import('../scripts/security-snapshot.mjs');const db=new PGlite();let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;};
try{
 await db.exec(`create role anon;create role authenticated;create role service_role;create schema storage;create table public.fixture(id int,owner_id int);alter table public.fixture enable row level security;grant select,insert on public.fixture to authenticated;create policy own_row on public.fixture to authenticated using(owner_id=1) with check(owner_id=1);create function public.fixture_rpc() returns int language sql security definer as $$select 1$$;create function public.fixture_trigger() returns trigger language plpgsql as $$begin return new;end;$$;create trigger original before insert on public.fixture for each row execute function public.fixture_trigger();insert into public.fixture values(1,1);`);
 const capture=async()=>(await db.query(SNAPSHOT_QUERY)).rows[0];const before=await capture();ok(before.snapshot.functions.length===2,'original function bodies captured');
 await db.exec(`create schema korvo_api_private;create function korvo_api_private.fixture_rpc() returns int language sql security definer set search_path='' as $$select 2$$;create or replace function public.fixture_rpc() returns int language sql security invoker as $$select korvo_api_private.fixture_rpc()$$;revoke execute on function public.fixture_rpc() from public;revoke insert on public.fixture from authenticated;alter policy own_row on public.fixture using(owner_id=2) with check(owner_id=2);alter default privileges revoke execute on functions from public;create function korvo_api_private.guard() returns trigger language plpgsql as $$begin return new;end;$$;create trigger new_guard before insert on public.fixture for each row execute function korvo_api_private.guard();`);
 const after=await capture(),inverse=restoreSQL(before,after);ok(!inverse.includes('CASCADE'),'inverse cannot cascade-delete unknown dependencies');
 await db.exec('alter table public.fixture disable row level security');
 await assert.rejects(db.exec(inverse),/Catalog drift/);await db.exec('rollback');checks++;
 await db.exec('alter table public.fixture enable row level security');
 await db.exec(inverse);ok((await capture()).fingerprint===before.fingerprint,'exact function/ACL/policy/trigger/default/schema metadata restored');
 ok((await db.query('select * from public.fixture')).rows.length===1,'existing row preserved');
 ok((await db.query('select public.fixture_rpc() n')).rows[0].n===1,'original function behavior restored');
 await assert.rejects(db.exec(inverse),/Catalog drift/);await db.exec('rollback');checks++;
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'korvo-recovery-writer-'));
 try{
  const b=path.join(dir,'before.json'),a=path.join(dir,'after.json'),out=path.join(dir,'inverse.sql');fs.writeFileSync(b,JSON.stringify(before),{mode:0o600});fs.writeFileSync(a,JSON.stringify(after),{mode:0o600});
  const run=target=>spawnSync(process.execPath,['scripts/write-security-recovery.mjs',b,a,target],{encoding:'utf8'});
  ok(run(out).status===0&&(fs.statSync(out).mode&0o777)===0o600,'CLI writes protected inverse outside Git');
  ok(run(out).status!==0,'CLI refuses to overwrite an existing operational file');
  fs.symlinkSync(process.cwd(),path.join(dir,'repo-link'),'dir');
  ok(run(path.join(dir,'repo-link','must-not-write-security-inverse.sql')).status!==0,'CLI rejects symlink-parent path into Git');
  fs.mkdirSync(path.join(dir,'public-output'),{mode:0o755});ok(run(path.join(dir,'public-output','inverse.sql')).status!==0,'CLI rejects a nonprivate output directory');
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 console.log(JSON.stringify({checks_passed:checks,layer:'isolated PostgreSQL metadata recovery',full_hosted_schema_rehearsed:false}));
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
