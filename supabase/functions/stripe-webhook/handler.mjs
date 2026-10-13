import {sandboxStripe,verifySignature} from '../_shared/stripe.mjs';
import {accountStatus} from '../_shared/connect.mjs';

export async function readLimitedBody(req,limit=524288){
 if(!req.body)return '';
 const reader=req.body.getReader(),chunks=[];let total=0;
 try{
  for(;;){const {done,value}=await reader.read();if(done)break;
   total+=value.byteLength;if(total>limit){await reader.cancel();return null;}chunks.push(value);
  }
  const bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder().decode(bytes);
 }finally{reader.releaseLock();}
}

export function createWebhookHandler({createClient,env,fetch=globalThis.fetch,log=console.error}){
 return async req=>{
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
  if(req.method!=='POST')return json({code:'METHOD_NOT_ALLOWED'},405);
  let event;
  try{
   const secrets=[env('STRIPE_WEBHOOK_SECRET'),env('STRIPE_CONNECT_WEBHOOK_SECRET')].filter(Boolean);
   const url=env('SUPABASE_URL'),service=env('SUPABASE_SERVICE_ROLE_KEY');
   if(!url||!service)return json({code:'WEBHOOK_CONFIGURATION_REQUIRED'},503);
   const stripe=sandboxStripe(env('STRIPE_SECRET_KEY'),fetch);
   const admin=createClient(url,service,{auth:{persistSession:false,autoRefreshToken:false}});
   const body=await readLimitedBody(req);
   if(body===null)return json({code:'PAYLOAD_TOO_LARGE'},413);
   const signature=req.headers.get('stripe-signature');
   let verified=await verifySignature(body,signature,secrets);
   if(!verified&&signature){
    const stored=await admin.rpc('marketplace_webhook_secrets');
    if(stored.error)throw new Error('SIGNING_SECRET_LOOKUP_FAILED');
    verified=await verifySignature(body,signature,stored.data??[]);
   }
   if(!verified)return json({code:'INVALID_SIGNATURE'},400);
   event=JSON.parse(body);
   if(typeof event.id!=='string'||!event.id.startsWith('evt_')||typeof event.type!=='string')return json({code:'INVALID_EVENT'},400);
   if(event.livemode===true)return json({code:'LIVE_EVENT_REJECTED'},400);
   let snapshot={kind:'ignored',livemode:false};
   const type=event.type.replace(/^v1\./,'');
   if(event.type.startsWith('v2.core.account')||type==='account.updated'||type==='capability.updated'){
    const id=event.related_object?.id??(type==='account.updated'?event.data?.object?.id:event.account);
    if(typeof id!=='string'||!/^acct_[A-Za-z0-9]+$/.test(id))throw new Error('INVALID_ACCOUNT_REFERENCE');
    const {data:mapping,error}=await admin.from('professional_stripe_accounts').select('professional_id').eq('stripe_account_id',id).maybeSingle();
    if(error)throw new Error('DATABASE_LOOKUP_FAILED');
    if(mapping){
     const checkedAt=new Date().toISOString();const account=await stripe('v1/accounts/'+id);
     if(account.metadata?.korvo_professional_id!==mapping.professional_id)throw new Error('ACCOUNT_OWNER_MISMATCH');
     snapshot={kind:'connect',livemode:false,account_id:id,professional_id:mapping.professional_id,
      checked_at:checkedAt,...accountStatus(account)};
    }
   }else if(type.startsWith('checkout.session.')||type.startsWith('payment_intent.')||type.startsWith('charge.')||type.startsWith('refund.')){
    // Thin events need a current resource; snapshots also get refreshed instead of trusted as financial state.
    let object=event.data?.object;
    if(!object&&event.related_object?.id){
     const id=event.related_object.id;
     const resource=type.startsWith('checkout.')?'checkout/sessions':type.startsWith('payment_intent.')?'payment_intents':type.startsWith('refund.')?'refunds':type.startsWith('charge.dispute.')?'disputes':'charges';
     object=await stripe('v1/'+resource+'/'+id);
    }
    if(type.startsWith('checkout.session.')&&object?.id) object=await stripe('v1/checkout/sessions/'+object.id);
    if(type==='checkout.session.expired'&&object?.status==='expired'&&object?.payment_status==='unpaid'
     &&object.metadata?.korvo_pricing_version==='quote_plus_12_percent_v1'){
     snapshot={kind:'checkout_expired',livemode:false,payment_id:object.metadata.korvo_payment_id,
      checkout_token:object.metadata.korvo_checkout_token,session_id:object.id};
    }
    let intentId=type.startsWith('payment_intent.')?object?.id:object?.payment_intent;
    if(type.startsWith('charge.dispute.')&&!intentId&&object?.charge){const charge=await stripe('v1/charges/'+object.charge);intentId=charge.payment_intent;}
    if(intentId&&snapshot.kind!=='checkout_expired'){
     const intent=await stripe('v1/payment_intents/'+intentId+'?expand[0]=latest_charge');
     const metadata=intent.metadata??{};
     if(metadata.korvo_pricing_version==='quote_plus_12_percent_v1'){
      const charge=typeof intent.latest_charge==='string'?await stripe('v1/charges/'+intent.latest_charge):intent.latest_charge;
      snapshot={kind:'payment',livemode:false,payment_id:metadata.korvo_payment_id,checkout_token:metadata.korvo_checkout_token,
       payment_intent_id:intent.id,amount:intent.amount,currency:intent.currency,amount_received:intent.amount_received,
       paid:intent.status==='succeeded',failed:intent.status==='requires_payment_method',charge_id:charge?.id??null,
       refunded_cents:charge?.amount_refunded??0,disputed:charge?.disputed===true};
     }else if(metadata.booking_payment_id){
      // Do not drop legacy events silently. Old fee-only payments need explicit reconciliation.
      throw new Error('LEGACY_PAYMENT_REQUIRES_RECONCILIATION');
     }
    }
   }
   const {data,error}=await admin.rpc('marketplace_apply_event',{p_event_id:event.id,p_type:event.type,p_snapshot:snapshot});
   if(error)throw new Error('EVENT_TRANSACTION_FAILED');
   return json({received:true,...data});
  }catch(error){
   const allowed=new Set(['SANDBOX_KEY_REQUIRED','LIVE_STRIPE_RESPONSE_REJECTED','ACCOUNT_OWNER_MISMATCH','INVALID_ACCOUNT_REFERENCE',
    'DATABASE_LOOKUP_FAILED','LEGACY_PAYMENT_REQUIRES_RECONCILIATION','EVENT_TRANSACTION_FAILED','STRIPE_REQUEST_FAILED']);
   const code=allowed.has(error?.message)?error.message:'WEBHOOK_PROCESSING_FAILED';
   log(JSON.stringify({event:'stripe_webhook_failure',event_id:event?.id,code}));
   // Return non-2xx so Stripe retries. The DB never commits processed_at on failure.
   return json({code},500);
  }
 };
}
