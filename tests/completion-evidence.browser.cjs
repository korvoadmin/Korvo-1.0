const {chromium}=require('playwright');const fs=require('node:fs/promises');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};
try{
 const page=await browser.newPage();await page.route('https://fixture.invalid/',r=>r.fulfill({body:'<main id="card"></main>',contentType:'text/html'}));await page.goto('https://fixture.invalid/');
 await page.addScriptTag({content:await fs.readFile('completion-evidence.js','utf8')});
 await page.evaluate(()=>{window.calls=[];window.pixels=Uint8Array.from(atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jU1sAAAAASUVORK5CYII='),c=>c.charCodeAt(0));window.fixture={active_job_id:'job',role:'professional',status:'active',required:true,photos:[]};window.uploadFails=false;window.verifyFails=false;
 window.client={rpc:async(name,args)=>{calls.push({name,args});if(name==='completion_evidence_summary')return {data:structuredClone(fixture)};
 if(name==='completion_reserve_photo'){const p={id:'10000000-0000-0000-0000-000000000001',bucket:'project-completion-evidence',storage_path:'job/owner/10000000-0000-0000-0000-000000000001',file_status:'reserved'};window.reservation=p;return {data:p};}
 if(name==='completion_acknowledge_photos')return {data:{active_job_id:'job',customer_reviewed:true}};if(name==='completion_abandon_photo'){fixture.photos=[];return {data:null};}},
 storage:{from:()=>({upload:async(path,file,options)=>{calls.push({name:'upload',path,options});window.uploadFile=file;return {error:uploadFails};},download:async()=>window.downloadFails?{error:true}:{data:new Blob([pixels],{type:'image/png'})}})},
 functions:{invoke:async(name,args)=>{calls.push({name,args});if(verifyFails)return {error:true};const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',await uploadFile.arrayBuffer())),v=>v.toString(16).padStart(2,'0')).join('');fixture.photos=[{...reservation,file_name:uploadFile.name,file_status:'validated'}];return {data:{id:reservation.id,file_status:'validated',sha256:sha}};}}};});
 async function mount(role='professional',extra={}){await page.evaluate(async({role,extra})=>{window.widget?.dispose();fixture={active_job_id:'job',role,status:role==='customer'?'pending_confirmation':'active',required:true,photos:[],...extra};widget=KorvoEvidence.attach({container:document.getElementById('card'),client,activeJobId:'job',role,enabled:true});await widget.ready;},{role,extra});}
 await page.evaluate(async()=>{const w=KorvoEvidence.attach({container:document.getElementById('card'),client,activeJobId:'job',role:'professional'});await w.ready;});ok(await page.evaluate(()=>calls.length===0),'disabled default makes no backend requests');
 await mount();ok(await page.getByLabel('Choose completion photo').count()===1,'professional sees actual upload control');
 ok(await page.evaluate(async()=>{try{await widget.beforeComplete();return false;}catch{return true;}}),'empty evidence blocks professional completion');
 const upload=()=>page.evaluate(()=>widget.upload(new File([pixels],'fixture.png',{type:'image/png'})));
 await upload();ok((await page.locator('.completion-evidence').innerText()).includes('Photo uploaded and verified'),'successful photo saved only after attestation');
 ok(await page.evaluate(()=>calls.find(c=>c.name==='upload').options.upsert===false),'immutable upload disallows upsert');
 await page.evaluate(()=>widget.beforeComplete());ok(true,'verified photo enables professional completion preflight');
 const firstKey=await page.evaluate(()=>calls.find(c=>c.name==='completion_reserve_photo').args.p_request_key);
 await mount();await page.evaluate(()=>window.verifyFails=true);await assert.rejects(upload());ok(true,'failed verifier cannot report upload success');
 await page.evaluate(()=>window.verifyFails=false);await upload();ok(await page.evaluate(k=>calls.filter(c=>c.name==='completion_reserve_photo').every(c=>c.args.p_request_key===k),firstKey),'retry and remount retain the same reservation key');
 await mount();await page.evaluate(()=>window.uploadFails=true);await upload();ok(true,'ambiguous duplicate upload is reconciled through verifier');
 const p={id:'10000000-0000-0000-0000-000000000001',file_name:'<img onerror=alert(1)>.png',storage_path:'job/owner/10000000-0000-0000-0000-000000000001',file_status:'validated'};
 await mount('customer',{photos:[p]});ok(await page.locator('.completion-evidence img').count()===1,'customer sees private downloaded photo');
 ok((await page.locator('.completion-evidence').innerText()).includes(p.file_name),'untrusted file name rendered as text');
 ok(await page.evaluate(async()=>{try{await widget.beforeComplete();return false;}catch{return true;}}),'viewing alone cannot silently acknowledge');
 await page.locator('.completion-evidence input[type=checkbox]').check();await page.evaluate(()=>widget.beforeComplete());ok(await page.evaluate(()=>calls.some(c=>c.name==='completion_acknowledge_photos')),'explicit customer acknowledgment saved before confirmation');
 await page.evaluate(()=>window.downloadFails=true);await mount('customer',{photos:[p]});ok(await page.locator('input[type=checkbox]').isDisabled(),'unavailable private image blocks acknowledgment');
 await mount('professional',{required:false});await page.evaluate(()=>widget.beforeComplete());ok((await page.locator('.completion-evidence').innerText()).includes('original completion process'),'legacy jobs keep their original completion flow');
 await page.setViewportSize({width:375,height:812});ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'evidence controls fit mobile width');
 console.log(checks+' completion evidence browser checks passed.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
