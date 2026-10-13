const {chromium}=require('playwright');const http=require('node:http');const fs=require('node:fs/promises');const path=require('node:path');const assert=require('node:assert/strict');
(async()=>{let checks=0;const root=process.cwd();const ok=(v,l)=>{assert.ok(v,l);checks++;console.log('PASS '+l);};
 const server=http.createServer(async(req,res)=>{try{const filename=path.resolve(root,'.'+new URL(req.url,'http://localhost').pathname);if(!filename.startsWith(root+path.sep))throw Error();res.setHeader('Content-Type',filename.endsWith('.html')?'text/html':'text/javascript');res.end(await fs.readFile(filename));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch();
 try {const page=await browser.newPage();const failures=[];page.on('pageerror',e=>failures.push(e.message));
  await page.goto(`http://127.0.0.1:${server.address().port}/gig-foundation.html`);await page.waitForSelector('#breakdown dd');
  ok((await page.locator('#breakdown').innerText()).includes('$108.00'),'worker receives full $108');ok((await page.locator('#breakdown').innerText()).includes('$12.96'),'12% fee on top');ok((await page.locator('#breakdown').innerText()).includes('$120.96'),'business subtotal $120.96');
  ok((await page.locator('#cost-note').innerText()).includes('unavailable'),'unresolved costs prevent final total claim');
  ok(await page.locator('button:disabled').count()===3,'publishing, applications and payment disabled');
  await page.locator('#positions').fill('2');await page.getByRole('button',{name:'Calculate estimate'}).click();ok((await page.locator('#breakdown').innerText()).includes('$241.92'),'two-worker roster subtotal preserves each gross');await page.locator('#positions').fill('1');
  await page.locator('#tips').fill('50');await page.getByRole('button',{name:'Calculate estimate'}).click();
  ok((await page.locator('#breakdown').innerText()).includes('$170.96'),'tips added separately');ok((await page.locator('#breakdown').innerText()).includes('$12.96'),'tips do not increase fee');
  await page.locator('#basis').selectOption('fixed');await page.locator('#tips').fill('0');
  for(const amount of [100,500,1000]){await page.locator('#amount').fill(String(amount));await page.getByRole('button',{name:'Calculate estimate'}).click();ok((await page.locator('#breakdown').innerText()).includes(new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(amount*1.12)),`fixed $${amount} plus 12%`);}
  await page.locator('#business').fill('<img src=x onerror=alert(1)>');await page.getByRole('button',{name:'Calculate estimate'}).click();ok(await page.locator('#business-name img').count()===0,'display name rendered as text');
  ok(await page.locator('#category optgroup').count()===3,'hospitality, property and general categories preserved');
  for(const width of [375,768,1280]){await page.setViewportSize({width,height:850});ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`layout fits ${width}px`);}
  ok(failures.length===0,'no browser runtime errors');console.log(`${checks} gig preview browser checks passed.`);
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
