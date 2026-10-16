const {chromium}=require('playwright'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++;console.log('PASS '+m);};try{
 const page=await browser.newPage();await page.route('https://fixture.invalid/**',async route=>{const file=new URL(route.request().url()).pathname.slice(1);if(file==='profile.js'||file==='profile.html')return route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.html')?'text/html':'application/javascript'});return route.fulfill({body:'',contentType:'application/javascript'});});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({body:''}));
 await page.addInitScript(()=>{window.queries=[];window.accountType='professional';window.active=true;window.fail=false;window.signedOut=false;window.korvoSupabase={auth:{getUser:async()=>({data:signedOut?{}:{user:{id:'owner'}}}),onAuthStateChange:cb=>{window.authEvent=cb;}},from:table=>({select:()=>({eq:(field,id)=>{queries.push({table,field,id});return {maybeSingle:async()=>fail?{error:true}:{data:table==='profiles'?{id:'owner',account_type:accountType,is_active:active}:{id:'owner',business_name:'<img src=x onerror=alert(1)>',services:['Installation'],service_areas:['Atlanta']}}};}})})};});
 await page.goto('https://fixture.invalid/profile.html?id=another-user');await page.getByRole('status').filter({hasText:'current account profile'}).waitFor();
 ok(await page.evaluate(()=>queries.every(q=>q.id==='owner')),'profile route ignores another account ID in URL');
 ok(await page.locator('#profile-data img').count()===0,'business name renders without markup execution');
 ok((await page.locator('#business-name').innerText()).includes('<img'),'owner profile data remains readable as text');
 await page.evaluate(()=>window.accountType='customer');await page.getByRole('button',{name:'Refresh profile'}).click();await page.waitForFunction(()=>document.getElementById('profile-status').textContent.includes('active professional'));
 ok(await page.locator('#profile-data').isHidden(),'customer cannot view professional profile details');
 await page.evaluate(()=>{accountType='professional';active=false;});await page.getByRole('button',{name:'Refresh profile'}).click();await page.waitForTimeout(20);ok(await page.locator('#profile-data').isHidden(),'inactive account cannot view cached professional details');
 await page.evaluate(()=>{active=true;fail=true;});await page.getByRole('button',{name:'Refresh profile'}).click();await page.waitForTimeout(20);ok(await page.locator('#profile-data').isHidden(),'failed profile lookup clears old private data');
 await page.evaluate(()=>window.fail=false);await page.getByRole('button',{name:'Refresh profile'}).click();await page.locator('#profile-data').waitFor({state:'visible'});
 await page.evaluate(()=>authEvent('SIGNED_OUT'));ok(await page.locator('#profile-data').isHidden()&&(await page.locator('#business-name').innerText())==='','signout clears rendered profile data');
 for(const width of [375,768,1280]){await page.setViewportSize({width,height:900});ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'profile fits '+width+'px');}
 console.log(JSON.stringify({checks_passed:checks,layer:'local profile browser/Auth fixtures',hosted:false}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
