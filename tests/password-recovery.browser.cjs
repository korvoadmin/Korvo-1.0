const {chromium}=require('playwright'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});let checks=0;
 const check=(v,label)=>{assert.ok(v,label);checks++;console.log('PASS '+label);};
 try{
  const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/*',async route=>{
   const url=new URL(route.request().url()),file=url.pathname.slice(1);
   if(url.hostname!=='korvo.test')return route.fulfill({body:'',contentType:'application/javascript'});
   if(file==='supabase.js')return route.fulfill({contentType:'application/javascript',body:`window.fixture={calls:[],session:{user:{id:'synthetic'}},emailError:false,userError:false,saveError:false};window.korvoSupabase={auth:{
    resetPasswordForEmail:async(email,options)=>{fixture.calls.push({name:'request',email,options});await new Promise(r=>setTimeout(r,50));return {error:fixture.emailError?{message:'private provider error'}:null};},
    onAuthStateChange:fn=>{fixture.callback=fn;setTimeout(()=>fn('INITIAL_SESSION',fixture.session),0);return {data:{subscription:{unsubscribe(){}}}};},
    getUser:async()=>fixture.userError?{error:{message:'expired'}}:{data:{user:{id:'synthetic'}}},
    updateUser:async(args)=>{fixture.calls.push({name:'save',args});return {error:fixture.saveError?{message:'private provider error'}:null};},
    signOut:async(args)=>{fixture.calls.push({name:'logout',args});return {error:null};}}};`});
   if(!['forgot-password.html','reset-password.html','password-recovery.js','auth.css'].includes(file))return route.fulfill({status:404,body:''});
   return route.fulfill({body:await fs.readFile(file),contentType:file.endsWith('.html')?'text/html':file.endsWith('.css')?'text/css':'application/javascript'});
  });
  await page.goto('http://korvo.test/forgot-password.html');await page.locator('#recoveryEmail').fill('Synthetic@example.invalid');
  await page.getByRole('button',{name:'Send reset link'}).dblclick();await page.waitForTimeout(100);
  check(await page.evaluate(()=>fixture.calls.length===1),'rapid recovery requests call Auth once');
  check(await page.evaluate(()=>fixture.calls[0].email==='synthetic@example.invalid' && fixture.calls[0].options.redirectTo==='https://korvoadmin.github.io/Korvo-1.0/reset-password.html'),'email normalized and callback fixed to Korvo');
  check((await page.locator('#recoveryStatus').innerText()).startsWith('If an account exists'),'reset response avoids account enumeration');
  await page.evaluate(()=>fixture.emailError=true);await page.getByRole('button',{name:'Send reset link'}).click();await page.waitForTimeout(100);
  check((await page.locator('#recoveryStatus').innerText()).includes('could not be requested'),'Auth request failure has safe retry message');
  check(!(await page.locator('body').innerText()).includes('private provider error'),'raw provider error not shown');
  await page.goto('http://korvo.test/reset-password.html');await page.waitForTimeout(100);
  check(await page.locator('#newPassword').isDisabled(),'ordinary session cannot open reset form');
  await page.evaluate(()=>{fixture.userError=true;fixture.callback('PASSWORD_RECOVERY',fixture.session);});await page.waitForTimeout(100);
  check(await page.locator('#newPassword').isDisabled(),'expired or invalid recovery remains disabled');
  await page.goto('about:blank');await page.goto('http://korvo.test/reset-password.html#type=recovery&access_token=synthetic-not-a-real-token');await page.waitForTimeout(100);
  check(await page.locator('#newPassword').isEnabled(),'recovery callback opens form after server user validation');
  check(!page.url().includes('#'),'recovery fragment removed after validation');
  await page.locator('#newPassword').fill('synthetic-passphrase');await page.locator('#confirmNewPassword').fill('mismatched-passphrase');
  await page.getByRole('button',{name:'Save password'}).click();check(await page.evaluate(()=>!fixture.calls.some(x=>x.name==='save')),'mismatched passwords never sent');
  await page.locator('#confirmNewPassword').fill('synthetic-passphrase');await page.evaluate(()=>fixture.saveError=true);
  await page.getByRole('button',{name:'Save password'}).click();await page.waitForTimeout(100);
  check((await page.locator('#recoveryStatus').innerText()).includes('could not be saved'),'failed reset never claims success');
  await page.evaluate(()=>fixture.saveError=false);await page.getByRole('button',{name:'Save password'}).click();await page.waitForTimeout(100);
  check((await page.locator('#recoveryStatus').innerText()).includes('Password saved'),'successful reset displays confirmed result');
  check(await page.evaluate(()=>fixture.calls.some(x=>x.name==='logout' && x.args.scope==='global')),'successful reset requests global sign-out');
  check(await page.locator('#newPassword').inputValue()==='' && await page.locator('#confirmNewPassword').inputValue()==='','password fields cleared after success');
  await page.setViewportSize({width:375,height:812});check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'reset form fits mobile width');
  check(errors.length===0,'recovery pages have no uncaught errors');console.log(checks+' recovery browser checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
