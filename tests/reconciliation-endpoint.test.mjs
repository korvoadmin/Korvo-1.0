import test from 'node:test';import assert from 'node:assert/strict';
import {createReconciliationHandler} from '../supabase/functions/reconcile-marketplace-payment/handler.mjs';
import {payment,intent,charge} from './fixtures/payment-provider.mjs';
const actor='30000000-0000-0000-0000-000000000001',key='40000000-0000-0000-0000-000000000001',report='50000000-0000-0000-0000-000000000001';
const request=(body={payment_id:payment.id,request_key:key},headers={})=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
function fixture({enabled=true,auth=true,financial=true,save=true,provider=true,wrongActor=false}={}){
 const calls=[],providerCalls=[];const handler=createReconciliationHandler({
 env:k=>({FINANCIAL_RECONCILIATION_ENABLED:enabled?'true':'false',SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'service-fixture',STRIPE_SECRET_KEY:'sk_test_fixture'})[k],
 fetch:async(url,options)=>{providerCalls.push({url,method:options.method});if(!provider)throw Error('private provider timeout');return new Response(JSON.stringify(url.includes('/payment_intents/')?intent:url.includes('/charges/')?charge:{data:[],has_more:false}));},
 createClient:(url,k)=>k==='public-fixture'?{auth:{getUser:async()=>auth?{data:{user:{id:actor,user_metadata:{role:'owner'}}}}:{error:true}},rpc:async()=>financial?{data:{payment,actor_id:wrongActor?'wrong':actor,revision:'a'.repeat(32)}}:{error:true}}:
 {rpc:async(name,args)=>{calls.push({name,args});return save?{data:{report_id:report,checked_at:'2026-10-15T12:00:00Z',state:args.p_facts.state,execution_enabled:false}}:{error:true};}}
 });return {handler,calls,providerCalls};
}
test('financial reconciliation remains disabled by default',async()=>assert.equal((await fixture({enabled:false}).handler(request())).status,503));
test('JWT validation precedes financial provider access',async()=>{const f=fixture({auth:false});assert.equal((await f.handler(request())).status,401);assert.equal(f.providerCalls.length,0);});
test('support or forged user metadata never licenses provider access',async()=>{const f=fixture({financial:false});assert.equal((await f.handler(request())).status,403);assert.equal(f.providerCalls.length,0);});
test('lookup actor identity must match authenticated caller',async()=>{const f=fixture({wrongActor:true});assert.equal((await f.handler(request())).status,403);assert.equal(f.calls.length,0);});
test('foreign origin cannot invoke financial observations',async()=>{const f=fixture();assert.equal((await f.handler(request(undefined,{Origin:'https://attacker.invalid'}))).status,403);assert.equal(f.providerCalls.length,0);});
test('client cannot submit provider facts or amounts',async()=>{const f=fixture();assert.equal((await f.handler(request({payment_id:payment.id,request_key:key,facts:{state:'consistent'}}))).status,400);assert.equal(f.providerCalls.length,0);});
test('request body and identifiers are bounded',async()=>{assert.equal((await fixture().handler(request({payment_id:'x'.repeat(2000),request_key:key}))).status,413);assert.equal((await fixture().handler(request({payment_id:'not-id',request_key:key}))).status,400);});
test('authorized observation saves through service procedure using GET-only provider calls',async()=>{const f=fixture(),response=await f.handler(request());assert.equal(response.status,200);assert.equal(f.calls[0].name,'finance_record_reconciliation');assert.equal(f.calls[0].args.p_actor_id,actor);assert.equal(f.calls[0].args.p_request_key,key);assert.equal(f.calls[0].args.p_facts.state,'consistent');assert.equal((await response.json()).execution_enabled,false);assert.ok(f.providerCalls.every(c=>c.method==='GET'));});
test('provider interruption is durably reported without financial retries or raw error exposure',async()=>{const f=fixture({provider:false}),response=await f.handler(request());assert.equal(response.status,200);assert.equal(f.calls[0].args.p_facts.state,'provider_unavailable');assert.equal(JSON.stringify(await response.json()).includes('private provider timeout'),false);});
test('database revision or role race cannot claim a saved observation',async()=>{const f=fixture({save:false}),response=await f.handler(request());assert.equal(response.status,409);assert.equal((await response.json()).code,'OBSERVATION_NOT_CONFIRMED_RECONCILE_AGAIN');});
