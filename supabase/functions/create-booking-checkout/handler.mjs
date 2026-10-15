import {sandboxStripe} from '../_shared/stripe.mjs';
import {validatePricingSnapshot} from '../_shared/pricing.mjs';
const site='https://korvoadmin.github.io/Korvo-1.0';
export function checkoutParameters(p){
 validatePricingSnapshot(p);
 return {mode:'payment',integration_identifier:'korvo_beta_'+p.checkout_token.replace(/-/g,'').slice(0,8).split('').map(x=>String.fromCharCode(97+parseInt(x,16))).join(''),
  success_url:site+'/customer-dashboard.html?payment=return',cancel_url:site+'/customer-dashboard.html?payment=cancel',
  'line_items[0][price_data][currency]':'usd','line_items[0][price_data][unit_amount]':String(p.quote_cents),
  'line_items[0][price_data][product_data][name]':'Professional service','line_items[0][quantity]':'1',
  'line_items[1][price_data][currency]':'usd','line_items[1][price_data][unit_amount]':String(p.platform_fee_cents),
  'line_items[1][price_data][product_data][name]':'Korvo platform fee (12%)','line_items[1][quantity]':'1',
  'payment_intent_data[transfer_group]':'korvo_'+p.id,
  'payment_intent_data[metadata][korvo_payment_id]':p.id,
  'payment_intent_data[metadata][korvo_checkout_token]':p.checkout_token,
  'payment_intent_data[metadata][korvo_pricing_version]':p.pricing_version,
  'metadata[korvo_payment_id]':p.id,'metadata[korvo_checkout_token]':p.checkout_token,
  'metadata[korvo_pricing_version]':p.pricing_version};
}
export function createCheckoutHandler({createClient,env,fetch=globalThis.fetch,log=console.error}){
 return async req=>{
  const headers={'Access-Control-Allow-Origin':'https://korvoadmin.github.io','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type',
   'Access-Control-Allow-Methods':'POST,OPTIONS','Content-Type':'application/json','Cache-Control':'no-store'};
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(req.method==='OPTIONS')return new Response('ok',{headers});if(req.method!=='POST')return json({code:'METHOD_NOT_ALLOWED'},405);
  const requestId=crypto.randomUUID();let stage='configuration';
  try{
   const stripe=sandboxStripe(env('STRIPE_SECRET_KEY'),fetch);
   const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY'),service=env('SUPABASE_SERVICE_ROLE_KEY');
   if(!url||!anon||!service)return json({code:'SERVER_CONFIGURATION_REQUIRED'},503);
   const authorization=req.headers.get('Authorization');if(!authorization)return json({code:'LOGIN_REQUIRED'},401);
   const options={auth:{persistSession:false,autoRefreshToken:false}};
   const client=createClient(url,anon,{...options,global:{headers:{Authorization:authorization}}});
   stage='authentication';
   const user=await client.auth.getUser();if(user.error||!user.data?.user)return json({code:'LOGIN_REQUIRED'},401);
   const body=await req.json();
   if(!body||Object.keys(body).some(k=>k!=='active_job_id')||typeof body.active_job_id!=='string')return json({code:'INVALID_REQUEST'},400);
   stage='payment_snapshot';
   const result=await client.rpc('marketplace_prepare_checkout',{p_active_job_id:body.active_job_id});
   if(result.error)return json({code:'PAYMENT_NOT_ELIGIBLE'},403);
   const p=result.data;validatePricingSnapshot(p);
   if(['paid','partially_refunded','refunded','disputed'].includes(p.status))return json({status:p.status,already_paid:true,sandbox:true});
   if(p.customer_total_cents<50||p.platform_fee_cents<1)return json({code:'AMOUNT_BELOW_CHECKOUT_MINIMUM'},400);
   let session;
   if(p.stripe_checkout_id){
    stage='checkout_lookup';
    session=await stripe('v1/checkout/sessions/'+p.stripe_checkout_id);
    if(session.status!=='open')return json({code:'CHECKOUT_RECONCILIATION_REQUIRED'},409);
   }else{
    if(Date.now()-new Date(p.checkout_started_at).getTime()>23*60*60*1000)return json({code:'CHECKOUT_RECONCILIATION_REQUIRED'},409);
    stage='checkout_create';
    session=await stripe('v1/checkout/sessions',{method:'POST',params:checkoutParameters(p),idempotencyKey:'korvo-checkout-'+p.checkout_token});
    stage='checkout_save';
    const admin=createClient(url,service,options);
    const saved=await admin.rpc('marketplace_save_checkout',{p_id:p.id,p_token:p.checkout_token,p_session:session.id});
    if(saved.error)throw new Error('CHECKOUT_SAVE_FAILED');
   }
   stage='checkout_validation';
   if(session.amount_total!==p.customer_total_cents||session.currency!=='usd')throw new Error('CHECKOUT_AMOUNT_MISMATCH');
   const link=new URL(session.url);if(link.protocol!=='https:'||link.hostname!=='checkout.stripe.com'||link.username||link.password)throw new Error('CHECKOUT_LINK_INVALID');
   return json({checkout_url:session.url,payment_id:p.id,...validatePricingSnapshot(p),sandbox:true});
  }catch(error){
   const code=error?.message==='SANDBOX_KEY_REQUIRED'?'SANDBOX_KEY_REQUIRED':'CHECKOUT_FAILED';
   log(JSON.stringify({event:'checkout_failure',stage,request_id:requestId,code}));
   return json({code,stage,request_id:requestId},502);
  }
 };
}
