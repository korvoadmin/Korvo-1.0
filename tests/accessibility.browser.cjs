const {chromium}=require('playwright'),{default:AxeBuilder}=require('@axe-core/playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});const results=[];
try{for(const file of ['contact.html','profile.html','forgot-password.html','reset-password.html','login.html','signup.html','admin-refunds.html'])for(const width of [375,1280]){
 const context=await browser.newContext({viewport:{width,height:900}});const page=await context.newPage();
 await page.route('**/*',r=>{const url=new URL(r.request().url());if(url.hostname!=='fixture.invalid')return r.abort();const file=path.join(process.cwd(),url.pathname);try{return r.fulfill({body:fs.readFileSync(file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript'});}catch{return r.fulfill({status:404,body:''});}});
 await page.goto('https://fixture.invalid/'+file);const report=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
 const violations=report.violations.map(v=>({id:v.id,impact:v.impact,selectors:v.nodes.map(n=>n.target)}));results.push({file,width,violations});assert.deepEqual(violations,[],file+' '+width+'px');
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),file+' mobile overflow');await context.close();
}const report={layer:'local Chromium axe WCAG 2/2.1 A/AA, unauthenticated/default-off pages',hosted:false,views:results.length,results};if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({accessibility_views_passed:results.length,hosted:false}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
