import test from 'node:test';import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {priceQuote} from '../supabase/functions/_shared/pricing.mjs';
import {verifySignature,sandboxStripe} from '../supabase/functions/_shared/stripe.mjs';
import {createCheckoutHandler,checkoutParameters} from '../supabase/functions/create-booking-checkout/handler.mjs';
import {createWebhookHandler,readLimitedBody} from '../supabase/functions/stripe-webhook/handler.mjs';
const secret='whsec_fixture_only';const now=Math.floor(Date.now()/1000);
const sign=(body,t=now,key=secret)=>`t=${t},v1=${createHmac('sha256',key).update(t+'.'+body).digest('hex')}`;
const envValues={STRIPE_SECRET_KEY:'sk_test_fixture',STRIPE_WEBHOOK_SECRET:secret,SUPABASE_URL:'https://fixture.invalid',
 SUPABASE_ANON_KEY:'anon',SUPABASE_SERVICE_ROLE_KEY:'service'};
const env=name=>envValues[name];
const payment={...priceQuote(500),id:'payment-fixture',checkout_token:'01234567-0000-4000-8000-000000000001',
 checkout_started_at:new Date().toISOString(),status:'awaiting_payment'};

test('Stripe signature validates exact raw bytes and either configured signing secret',async()=>{
 const body='{"id":"evt_fixture"}';assert.equal(await verifySignature(body,sign(body),[secret],now),true);
 assert.equal(await verifySignature(body,sign(body,now,'whsec_rotated'),[secret,'whsec_rotated'],now),true);
 for(const [b,h] of [[body+' ',sign(body)],[body,sign(body,now-301)],[body,sign(body,now+301)],
  [body,'t='+now+',v1=invalid'],[body,'t='+now+',t='+now+',v1=abc'],[body,null]])assert.equal(await verifySignature(b,h,[secret],now),false);
});
test('sandbox provider rejects live keys and live responses',async()=>{
 assert.throws(()=>sandboxStripe('sk_live_fixture'));
 const provider=sandboxStripe('sk_test_fixture',async()=>Response.json({livemode:true}));
 await assert.rejects(provider('v1/accounts/acct_fixture'),/LIVE_STRIPE_RESPONSE/);
 await assert.rejects(provider('v1/transfers',{method:'POST',params:{}}),/IDEMPOTENCY/);
});
for(const quote of [100,500,1000])test(`Checkout line items charge quote + 12% for $${quote}`,()=>{
 const p={...payment,...priceQuote(quote)};const params=checkoutParameters(p);
 assert.equal(Number(params['line_items[0][price_data][unit_amount]']),quote*100);
 assert.equal(Number(params['line_items[1][price_data][unit_amount]']),quote*12);
 assert.equal(Number(params['line_items[0][price_data][unit_amount]'])+Number(params['line_items[1][price_data][unit_amount]']),quote*112);
 assert.equal(params['payment_method_types[0]'],undefined);
 assert.match(params.integration_identifier,/^korvo_beta_[a-z]{8}$/);
});

function checkoutFixture(options={}){
 const calls=[],logs=[];const p={...payment,...options.payment};
 const createClient=(_url,key)=>key==='anon'?{auth:{getUser:async()=>options.loggedOut?{error:{}}:{data:{user:{id:'customer'}}}},
 rpc:async()=>options.denied?{error:{}}:{data:p}}:{rpc:async(name,args)=>{calls.push({rpc:name,args});return options.saveFail?{error:{}}:{data:null};}};
 const fetch=async(url,init)=>{calls.push({url,init});return Response.json({id:'cs_fixture',url:'https://checkout.stripe.com/c/pay/test',
  status:'open',amount_total:options.wrongAmount?50000:p.customer_total_cents,currency:'usd',livemode:false});};
 const handler=createCheckoutHandler({createClient,env:name=>name==='STRIPE_SECRET_KEY'&&options.live?'sk_live_fixture':env(name),fetch,log:x=>logs.push(x)});
 return {calls,logs,run:async(body={active_job_id:'booking-fixture'})=>{
 const r=await handler(new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer test'},body:JSON.stringify(body)}));
 return {status:r.status,data:await r.json()};}};
}
test('checkout saves a stable session before returning a sandbox link',async()=>{
 const f=checkoutFixture();const r=await f.run();assert.equal(r.status,200);assert.equal(r.data.customer_total_cents,56000);
 assert.equal(r.data.professional_gross_cents,50000);assert.equal(r.data.sandbox,true);
 assert.equal(f.calls[0].init.headers['Idempotency-Key'],'korvo-checkout-'+payment.checkout_token);
 assert.equal(f.calls[1].rpc,'marketplace_save_checkout');
});
test('browser amount override, invalid user and cross-user denial never call Stripe',async()=>{
 for(const [opts,body] of [[{}, {active_job_id:'booking',amount:1}],[{loggedOut:true},undefined],[{denied:true},undefined]]){
  const f=checkoutFixture(opts);assert.ok((await f.run(body)).status>=400);assert.equal(f.calls.length,0);
 }
});
test('already paid and refunded records cannot be charged again',async()=>{
 for(const status of ['paid','refunded','partially_refunded','disputed']){const f=checkoutFixture({payment:{status}});
  assert.equal((await f.run()).data.already_paid,true);assert.equal(f.calls.length,0);}
});
test('wrong Stripe amount or failed DB save cannot produce a success URL',async()=>{
 for(const opts of [{wrongAmount:true},{saveFail:true},{live:true}])assert.equal((await checkoutFixture(opts).run()).status,502);
});
test('an ambiguous checkout beyond the idempotency window requires reconciliation',async()=>{
 const f=checkoutFixture({payment:{checkout_started_at:new Date(Date.now()-24*3600000).toISOString()}});
 assert.equal((await f.run()).status,409);assert.equal(f.calls.length,0);
});

function webhookFixture(options={}){
 const calls=[],logs=[];
 const createClient=()=>({from:()=>({select(){return this;},eq(){return this;},async maybeSingle(){return {data:{professional_id:'professional-fixture'}};}}),
 rpc:async(name,args)=>{if(name==='marketplace_webhook_secrets')return {data:[]};calls.push({rpc:name,args});if(options.failTransaction)return {error:{}};return {data:options.duplicate?{duplicate:true}:{processed:true}};}});
 const fetch=async url=>{
  calls.push({url});
  if(url.includes('/accounts/'))return Response.json({id:'acct_fixture',metadata:{korvo_professional_id:options.wrongOwner?'other':'professional-fixture'},
   details_submitted:!!options.complete,payouts_enabled:!!options.complete,charges_enabled:false,capabilities:{transfers:options.complete?'active':'inactive'}});
  return Response.json({id:'pi_fixture',amount:56000,amount_received:56000,currency:'usd',status:'succeeded',livemode:false,
   metadata:{korvo_payment_id:'payment-fixture',korvo_checkout_token:payment.checkout_token,korvo_pricing_version:payment.pricing_version},
   latest_charge:{id:'ch_fixture',disputed:!!options.disputed,amount_refunded:options.refunded??0}});
 };
 const handler=createWebhookHandler({createClient,env,fetch,log:x=>logs.push(x)});
 return {calls,logs,run:async(event,valid=true)=>{
 const body=JSON.stringify(event);const r=await handler(new Request('https://fixture.invalid',{method:'POST',
  headers:{'stripe-signature':valid?sign(body):'invalid'},body}));return {status:r.status,data:await r.json()};}};
}
const succeeded={id:'evt_paid',type:'payment_intent.succeeded',livemode:false,data:{object:{id:'pi_fixture'}}};
test('signed payment event refreshes Stripe state and commits one atomic snapshot',async()=>{
 const f=webhookFixture();assert.equal((await f.run(succeeded)).status,200);
 const rpc=f.calls.find(x=>x.rpc);assert.equal(rpc.rpc,'marketplace_apply_event');
 assert.equal(rpc.args.p_snapshot.amount,56000);assert.equal(rpc.args.p_snapshot.paid,true);
 assert.equal(f.calls.filter(x=>x.rpc).length,1);
});
test('transaction failure returns retryable error and a later delivery succeeds',async()=>{
 assert.equal((await webhookFixture({failTransaction:true}).run(succeeded)).status,500);
 assert.equal((await webhookFixture().run(succeeded)).status,200);
 assert.equal((await webhookFixture({duplicate:true}).run(succeeded)).data.duplicate,true);
});
test('unsigned or live events never touch database/Stripe',async()=>{
 for(const [event,valid] of [[succeeded,false],[{...succeeded,livemode:true},true]]){const f=webhookFixture();
  assert.equal((await f.run(event,valid)).status,400);assert.equal(f.calls.length,0);}
});
test('Connect thin events refresh and synchronize only their mapped professional',async()=>{
 const event={id:'evt_account',type:'v2.core.account[requirements].updated',livemode:false,related_object:{id:'acct_fixture'}};
 const f=webhookFixture({complete:true});assert.equal((await f.run(event)).status,200);
 const s=f.calls.find(x=>x.rpc).args.p_snapshot;assert.equal(s.professional_id,'professional-fixture');assert.equal(s.onboarding_status,'complete');
 assert.equal((await webhookFixture({wrongOwner:true}).run(event)).status,500);
 const pending=webhookFixture();await pending.run(event);assert.notEqual(pending.calls.find(x=>x.rpc).args.p_snapshot.onboarding_status,'complete');
});
test('refund and dispute snapshots carry holds without choosing fee policy',async()=>{
 const f=webhookFixture({refunded:5600,disputed:true});await f.run(succeeded);
 const s=f.calls.find(x=>x.rpc).args.p_snapshot;assert.equal(s.refunded_cents,5600);assert.equal(s.disputed,true);
 assert.equal(s.professional_refunded_cents,undefined);
});
test('webhook body limit cancels the input stream before buffering more than its limit',async()=>{
 let cancelled=false;
 const body=new ReadableStream({start(c){c.enqueue(new Uint8Array(300000));c.enqueue(new Uint8Array(300000));},cancel(){cancelled=true;}});
 const result=await readLimitedBody(new Request('https://fixture.invalid',{method:'POST',body,duplex:'half'}));
 assert.equal(result,null);assert.equal(cancelled,true);
});
test('limited raw body preserves multibyte JSON for signature verification',async()=>{
 const body='{"message":"✓ Atlanta"}';assert.equal(await readLimitedBody(new Request('https://fixture.invalid',{method:'POST',body})),body);
});
test('checkout failure includes safe stage/reference and no credentials or raw provider errors',async()=>{
 const f=checkoutFixture({saveFail:true});const r=await f.run();
 assert.equal(r.data.stage,'checkout_save');assert.match(r.data.request_id,/^[0-9a-f-]{36}$/);
 assert.equal(f.logs.length,1);assert.ok(!JSON.stringify({r,logs:f.logs}).includes('sk_test_fixture'));
 assert.ok(!JSON.stringify({r,logs:f.logs}).includes('CHECKOUT_SAVE_FAILED'));
});
