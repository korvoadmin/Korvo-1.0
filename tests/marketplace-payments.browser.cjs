const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});let checks=0;
 const check=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label);};
 try {
  const page=await browser.newPage();await page.setContent('<main id="card"></main>');
  await page.addScriptTag({content:await fs.readFile('marketplace-payments.js','utf8')});
  async function mount(role='customer',status='awaiting_payment',extra={}) {
   await page.evaluate(({role,status,extra})=>{
    document.getElementById('card').replaceChildren();window.calls=[];window.navigation=[];
    window.fixture={status,quote_cents:50000,professional_gross_cents:50000,platform_fee_cents:6000,customer_total_cents:56000,currency:'usd',
      refunded_total_cents:status==='refunded'?56000:status==='partially_refunded'?5600:0,...extra};
    window.invoke={data:{sandbox:true,checkout_url:'https://checkout.stripe.com/c/pay/cs_test_fixture'}};
    window.widget=KorvoPayments.attach({container:document.getElementById('card'),activeJobId:'fixture-job',role,jobStatus:'active',
     client:{rpc:async(name,params)=>{calls.push({name,params});return window.readError?{error:{message:'denied'}}:{data:fixture};},
     functions:{invoke:async(name,params)=>{calls.push({name,params});await new Promise(r=>setTimeout(r,40));return invoke;}}},navigate:url=>navigation.push(url)});
    return widget.ready;
   },{role,status,extra});
  }
  await mount();check((await page.locator('#card').innerText()).includes('Service $500.00 + Korvo fee $60.00 = total $560.00'),'customer sees authoritative quote plus fee');
  check(await page.evaluate(()=>calls[0].params.p_active_job_id==='fixture-job'),'summary scoped to active job');
  await page.getByRole('button',{name:'Pay in sandbox'}).dblclick();await page.waitForTimeout(100);
  check(await page.evaluate(()=>calls.filter(x=>x.name==='create-booking-checkout').length===1),'rapid clicks create one checkout invocation');
  check(await page.evaluate(()=>Object.keys(calls.find(x=>x.name==='create-booking-checkout').params.body).join()==='active_job_id'),'frontend sends no payment amount');
  check(await page.evaluate(()=>navigation.length===1 && navigation[0].startsWith('https://checkout.stripe.com/')),'sandbox checkout opens trusted host');
  await mount('professional');check((await page.locator('#card').innerText()).includes('gross allocation: $500.00'),'professional keeps full gross quote');
  check(await page.getByRole('button',{name:'Pay in sandbox'}).count()===0,'professional cannot initiate customer checkout');
  for(const status of ['paid','processing','refunded','partially_refunded','disputed']) {
   await mount('customer',status);check(await page.getByRole('button',{name:'Pay in sandbox'}).count()===0,status+' does not offer another payment');
  }
  await mount('customer','refunded');check((await page.locator('#card').innerText()).includes('Refunded: $560.00'),'full refund shows original charge and refund total');
  await mount('customer','awaiting_payment',{requires_review:true});check(await page.getByRole('button',{name:'Pay in sandbox'}).count()===0,'review hold blocks checkout UI');
  await mount('customer','awaiting_payment',{professional_gross_cents:44000});check((await page.locator('#card').innerText()).includes('could not be loaded'),'old 88/12 allocation fails closed');
  await mount();await page.evaluate(()=>invoke={data:{sandbox:true,checkout_url:'https://checkout.stripe.com.attacker.example/'}});
  await page.getByRole('button',{name:'Pay in sandbox'}).click();await page.waitForTimeout(100);
  check(await page.evaluate(()=>navigation.length===0),'lookalike payment host is rejected');
  await page.evaluate(()=>window.readError=true);await page.getByRole('button',{name:'Refresh payment'}).click();await page.waitForTimeout(100);
  check((await page.locator('#card').innerText()).includes('could not be loaded'),'read failure clears stale financial data');
  await page.evaluate(()=>window.readError=false);await page.getByRole('button',{name:'Refresh payment'}).click();await page.waitForTimeout(100);
  check((await page.locator('#card').innerText()).includes('$560.00'),'refresh recovers after read failure');
  await page.setViewportSize({width:375,height:812});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'payment controls fit mobile width');
  await page.evaluate(()=>window.KORVO_NON_MONEY_BETA_ENABLED=true);await mount();check(await page.evaluate(()=>calls.length===0),'non-money beta refuses checkout without RPC fallback');check(await page.getByRole('button',{name:'Pay in sandbox'}).count()===0,'non-money beta offers no provider checkout');
  console.log(checks+' payment browser checks passed.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
