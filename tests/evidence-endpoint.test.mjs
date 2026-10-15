import test from 'node:test';import assert from 'node:assert/strict';
import {createEvidenceHandler} from '../supabase/functions/verify-completion-photo/handler.mjs';
const id='10000000-0000-0000-0000-000000000001';
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
function fixture({enabled=true,auth=true,authorize=true,download=true}={}){
 let downloads=0,attestations=0;
 const handler=createEvidenceHandler({env:name=>({COMPLETION_EVIDENCE_ENABLED:enabled?'true':'false',SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'server-fixture'})[name],
  decode:async()=>({fully_decoded:true,mime:'image/png',width:2,height:2,frames:1}),
  createClient:(url,key)=>key==='public-fixture'?{auth:{getUser:async()=>({data:auth?{user:{id}}:{},error:!auth})},rpc:async()=>({error:!authorize,data:{id,storage_path:'job/owner/'+id,declared_bytes:12,declared_mime:'image/png'}})}:{storage:{from:()=>({download:async()=>{downloads++;return {error:!download,data:new Blob([png])};}})},rpc:async()=>{attestations++;return {data:{id,file_status:'validated'}};}}});
 return {handler,counts:()=>({downloads,attestations})};
}
const request=(body={photo_id:id},headers={})=>new Request('https://fixture.invalid',{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json',...headers},body:JSON.stringify(body)});
test('evidence endpoint remains disabled by default',async()=>assert.equal((await fixture({enabled:false}).handler(request())).status,503));
test('reject foreign origin before privileged work',async()=>{const f=fixture();assert.equal((await f.handler(request(undefined,{origin:'https://attacker.invalid'}))).status,403);assert.equal(f.counts().downloads,0);});
test('bad JWT cannot access files',async()=>{const f=fixture({auth:false});assert.equal((await f.handler(request())).status,401);assert.equal(f.counts().downloads,0);});
test('another professional reservation cannot access files',async()=>{const f=fixture({authorize:false});assert.equal((await f.handler(request())).status,422);assert.equal(f.counts().downloads,0);});
test('client cannot submit attestation values',async()=>assert.equal((await fixture().handler(request({photo_id:id,sha256:'forged'}))).status,400));
test('streamed oversized JSON is rejected',async()=>assert.equal((await fixture().handler(request({photo_id:'x'.repeat(2000)}))).status,413));
test('invalid UUID is rejected before download',async()=>{const f=fixture();assert.equal((await f.handler(request({photo_id:'bad'}))).status,422);assert.equal(f.counts().downloads,0);});
test('storage failure cannot attest and raw errors never escape',async()=>{const f=fixture({download:false}),r=await f.handler(request());assert.equal(r.status,422);assert.deepEqual(await r.json(),{code:'PHOTO_NOT_VERIFIED'});assert.equal(f.counts().attestations,0);});
test('verified owner gets only the confirmed attestation and digest',async()=>{const f=fixture(),r=await f.handler(request()),data=await r.json();assert.equal(r.status,200);assert.equal(data.id,id);assert.match(data.sha256,/^[a-f0-9]{64}$/);assert.deepEqual(f.counts(),{downloads:1,attestations:1});});
