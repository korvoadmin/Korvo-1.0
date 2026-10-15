import {verifyStoredCompletionPhoto} from '../_shared/completion-evidence.mjs';
export function createEvidenceHandler({createClient,env,decode}){
 return async req=>{
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin',
   'Access-Control-Allow-Origin':'https://korvoadmin.github.io','Access-Control-Allow-Headers':'authorization,apikey,x-client-info,content-type','Access-Control-Allow-Methods':'POST,OPTIONS'};
  const json=(data,status=200)=>new Response(JSON.stringify(data),{status,headers});
  if(origin&&origin!=='https://korvoadmin.github.io')return json({code:'ORIGIN_DENIED'},403);
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(req.method!=='POST')return json({code:'METHOD_NOT_ALLOWED'},405);
  // Both deployment and explicit server configuration are approval-gated.
  if(env('COMPLETION_EVIDENCE_ENABLED')!=='true')return json({code:'EVIDENCE_DISABLED'},503);
  const authorization=req.headers.get('Authorization');if(!/^Bearer\s+\S+$/i.test(authorization||''))return json({code:'LOGIN_REQUIRED'},401);
  if(!req.headers.get('content-type')?.startsWith('application/json'))return json({code:'JSON_REQUIRED'},415);
  let body;
  try{
   const reader=req.body?.getReader();if(!reader)return json({code:'INVALID_REQUEST'},400);
   let length=0;const chunks=[];
   while(true){const {value,done}=await reader.read();if(done)break;length+=value.length;if(length>1024){await reader.cancel();return json({code:'REQUEST_TOO_LARGE'},413);}chunks.push(value);}
   const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}body=JSON.parse(new TextDecoder().decode(bytes));
  }catch{return json({code:'INVALID_REQUEST'},400);}
  if(!body||Object.keys(body).join()!=='photo_id'||typeof body.photo_id!=='string')return json({code:'INVALID_REQUEST'},400);
  try{
   const url=env('SUPABASE_URL'),anon=env('SUPABASE_ANON_KEY'),service=env('SUPABASE_SERVICE_ROLE_KEY');
   if(!url||!anon||!service||!decode)return json({code:'SERVER_CONFIGURATION_REQUIRED'},503);
   const options={auth:{persistSession:false,autoRefreshToken:false}};
   const actor=createClient(url,anon,{...options,global:{headers:{Authorization:authorization}}});
   const user=await actor.auth.getUser();if(user.error||!user.data?.user)return json({code:'LOGIN_REQUIRED'},401);
   // Core authorizes the reservation through caller JWT and session-checked SQL before any privileged download.
   const server=createClient(url,service,options);
   return json(await verifyStoredCompletionPhoto({photoId:body.photo_id,actorClient:actor,serverClient:server,decode}));
  }catch{return json({code:'PHOTO_NOT_VERIFIED'},422);}
 };
}
