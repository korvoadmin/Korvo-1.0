const {chromium}=require('playwright'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};try{
const p=await browser.newPage();await p.route('https://fixture.invalid/',r=>r.fulfill({body:'<main></main>',contentType:'text/html'}));await p.goto('https://fixture.invalid/');await p.addScriptTag({content:await fs.readFile('completion-evidence.js','utf8')});
await p.evaluate(()=>{window.images=[];Object.defineProperty(HTMLImageElement.prototype,'src',{set(value){this.dataset.fixtureSrc=value;images.push(this);}});window.fixture={active_job_id:'job',role:'customer',status:'pending_confirmation',required:true,photos:[{id:'photo',file_name:'fixture.png',file_status:'validated',storage_path:'private/photo'}]};window.client={rpc:async()=>({data:structuredClone(fixture)}),storage:{from:()=>({download:async()=>({data:new Blob(['fixture'])})})}};window.widget=KorvoEvidence.attach({container:document.querySelector('main'),client,activeJobId:'job',role:'customer',enabled:true,imageTimeoutMs:2000});});
await p.waitForFunction(()=>images.length===1);ok(await p.getByRole('button',{name:'Refresh photos'}).isVisible(),'retry remains available while a photo is still loading');
await p.evaluate(()=>{window.refreshing=widget.refresh();});await p.waitForFunction(()=>images.length===2);await p.evaluate(()=>images[0].onload());await p.waitForTimeout(25);
ok(await p.locator('input[type=checkbox]').count()===0,'stale image completion cannot acknowledge a newer summary');
await p.evaluate(()=>images[1].onerror());await p.waitForFunction(()=>document.querySelector('input[type=checkbox]'));
ok(await p.locator('input[type=checkbox]').isDisabled(),'latest image failure keeps acknowledgment disabled');
ok(await p.evaluate(async()=>{try{await widget.beforeComplete();return false;}catch{return true;}}),'stale viewed state cannot pass customer completion');
await p.evaluate(()=>{widget.dispose();widget=KorvoEvidence.attach({container:document.querySelector('main'),client,activeJobId:'job',role:'customer',enabled:true,imageTimeoutMs:30});});
await p.waitForFunction(()=>document.querySelector('input[type=checkbox]'));
ok(await p.locator('input[type=checkbox]').isDisabled(),'image timeout fails closed with retry controls');
ok((await p.locator('main').innerText()).includes('did not load'),'image timeout is actionable rather than indefinite');
console.log(JSON.stringify({checks_passed:checks,layer:'local browser delayed image races',hosted:false}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
