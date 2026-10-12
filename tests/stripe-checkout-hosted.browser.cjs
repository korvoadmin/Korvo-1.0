// Opt-in genuine sandbox hosted Checkout; never use a real payment method.
const {chromium}=require('playwright'),fs=require('node:fs/promises'),assert=require('node:assert/strict');
(async()=>{
 const fixture=JSON.parse(await fs.readFile(process.env.KORVO_ACCEPTANCE_FIXTURE,'utf8'));
 const quote=Number(process.env.KORVO_TEST_QUOTE||100);
 const c=fixture.payment_cases.find(c=>c.quote===quote);
 assert.equal(c.checkout.sandbox,true);assert.ok(c.checkout.checkout_url.includes('/cs_test_'));
 assert.ok(fixture.customer_email.endsWith('@example.invalid'));
 const proxy=process.env.HTTPS_PROXY&&new URL(process.env.HTTPS_PROXY);
 const browser=await chromium.launch({headless:true,...(proxy?{proxy:{server:proxy.protocol+'//'+proxy.host,username:decodeURIComponent(proxy.username),password:decodeURIComponent(proxy.password)}}:{})});
 try {
  const page=await browser.newPage({ignoreHTTPSErrors:true});
  await page.goto(c.checkout.checkout_url,{timeout:90000});
  await page.getByText('Sandbox',{exact:true}).waitFor();
  const expected=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(quote*1.12);
  assert.ok((await page.locator('body').innerText()).includes(expected));console.log('PASS Stripe hosted sandbox displays '+expected);
  if(process.env.KORVO_TEST_CARD_SCENARIO==='cancel'){await page.getByText('Back',{exact:true}).click();await page.waitForURL('**/customer-dashboard.html?payment=cancel',{timeout:60000});console.log('PASS hosted cancellation returns without claiming payment');return;}
  await page.locator('#email').fill(fixture.customer_email);
  await page.locator('#enableStripePass').uncheck();
  // Stripe's radio overlay prevents semantic click actionability; click its visible card selector.
  const box=await page.locator('#payment-method-label-card').boundingBox();assert.ok(box);
  await page.mouse.click(box.x-35,box.y+box.height/2);
  await page.locator('#cardNumber').fill(process.env.KORVO_TEST_CARD_SCENARIO==='decline'?'4000000000009995':'4242424242424242');
  await page.locator('#cardExpiry').fill('1230');await page.locator('#cardCvc').fill('123');
  await page.locator('#billingName').fill('Korvo Synthetic Tester');await page.locator('#billingPostalCode').fill('30303');
  await page.getByRole('button',{name:'Pay',exact:true}).click();
  if(process.env.KORVO_TEST_CARD_SCENARIO==='decline') {
   await page.getByText(/insufficient funds|card was declined/i).first().waitFor({timeout:60000});
   console.log('PASS Stripe hosted sandbox rejects insufficient-funds test card');
  }else {
   await page.waitForURL('**/customer-dashboard.html?payment=return',{timeout:90000});
   console.log('PASS hosted sandbox payment returns to customer dashboard; webhook/database confirmation must be verified separately');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error('Hosted sandbox test failed:',e.name);process.exitCode=1;});
