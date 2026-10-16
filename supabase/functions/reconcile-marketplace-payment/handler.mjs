import {observePayment} from '../_shared/payment-observations.mjs';
import {readOnlySandboxStripe} from '../_shared/stripe-readonly.mjs';
export function createReconciliationHandler({createClient,env,fetch=globalThis.fetch}){
 return async req=>{
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
   'Access-Control-Allow-Origin':'https://korvoadmin.github.io','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const json=(v,status=200)=>new Response(JSON.stringify(v),{status,headers});
  if(req.headers.get('origin')&&req.headers.get('origin')!=='https://korvoadmin.github.io')return json({code:'ORIGIN_DENIED'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({code:'METHOD_NOT_ALLOWED'},405);
  if(env('FINANCIAL_RECONCILIATION_ENABLED')!=='true')return json({code:'RECONCILIATION_DISABLED'},503);
  const authorization=req.headers.get('authorization');if(!/^Bearer\s+\S+$/i.test(authorization||''))return json({code:'LOGIN_REQUIRED'},401);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({code:'JSON_REQUIRED'},415);
  let body;
  try{
   const reader=req.body?.getReader();if(!reader)return json({code:'INVALID_REQUEST'},400);const chunks=[];let size=0;
   try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>1024){await reader.cancel();return json({code:'REQUEST_TOO_LARGE'},413);}chunks.push(value);}}
   finally{reader.releaseLock();}
   const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}body=JSON.parse(new TextDecoder().decode(bytes));
  }catch{return json({code:'INVALID_REQUEST'},400);}
  const uuid=/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i;
  if(!body||Object.keys(body).sort().join()!=='payment_id,request_key'||!uuid.test(body.payment_id)||!uuid.test(body.request_key))return json({code:'INVALID_REQUEST'},400);
  try{
   const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY'),service=env('SUPABASE_SERVICE_ROLE_KEY');
   if(!url||!anon||!service)return json({code:'SERVER_CONFIGURATION_REQUIRED'},503);
   const options={auth:{persistSession:false,autoRefreshToken:false}};
   const actor=createClient(url,anon,{...options,global:{headers:{Authorization:authorization}}});
   const user=await actor.auth.getUser();if(user.error||!user.data?.user)return json({code:'LOGIN_REQUIRED'},401);
   const target=await actor.rpc('admin_financial_reconciliation_target',{p_payment_id:body.payment_id});
   if(target.error||target.data?.actor_id!==user.data.user.id||target.data?.payment?.id!==body.payment_id||!target.data.revision)return json({code:'FINANCIAL_ACCESS_DENIED'},403);
   // Provider access follows session-checked database financial authorization.
   const get=readOnlySandboxStripe(env('STRIPE_SECRET_KEY'),fetch);
   const facts=await observePayment(target.data.payment,get,{providerLivemode:false});
   const server=createClient(url,service,options);
   const saved=await server.rpc('finance_record_reconciliation',{p_payment_id:body.payment_id,p_actor_id:target.data.actor_id,p_request_key:body.request_key,p_revision:target.data.revision,p_facts:facts});
   if(saved.error||!uuid.test(saved.data?.report_id)||saved.data.execution_enabled!==false)return json({code:'OBSERVATION_NOT_CONFIRMED_RECONCILE_AGAIN'},409);
   return json(saved.data);
  }catch{return json({code:'RECONCILIATION_NOT_COMPLETED'},422);}
 };
}
