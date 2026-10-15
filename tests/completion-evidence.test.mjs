import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectCompletionPhoto,verifyStoredCompletionPhoto} from '../supabase/functions/_shared/completion-evidence.mjs';
const png=new Uint8Array([137,80,78,71,13,10,26,10,0,0,0,0]);
const declaration={declared_bytes:12,declared_mime:'image/png'};
const decoder=async()=>({fully_decoded:true,mime:'image/png',frames:1,width:2,height:2});
// Stub decoder tests the orchestration contract; real decoding is a separate suite.
test('missing decoder fails closed',async()=>assert.rejects(inspectCompletionPhoto(png,declaration),/decoder required/));
test('fake HTML cannot be declared as an image',async()=>assert.rejects(inspectCompletionPhoto(new TextEncoder().encode('<html>invalid</html>'),{declared_bytes:20,declared_mime:'image/png'},decoder)));
test('incorrect declared length denied',async()=>assert.rejects(inspectCompletionPhoto(png,{...declaration,declared_bytes:13},decoder),/size/));
test('mime mismatch denied',async()=>assert.rejects(inspectCompletionPhoto(png,{...declaration,declared_mime:'image/jpeg'},decoder),/type/));
test('header inspection alone is insufficient',async()=>assert.rejects(inspectCompletionPhoto(png,declaration,async()=>({mime:'image/png',frames:1,width:2,height:2})),/Invalid/));
test('decoder failure propagated without attestation',async()=>assert.rejects(inspectCompletionPhoto(png,declaration,async()=>{throw Error('corrupt');}),/corrupt/));
test('animated files denied',async()=>assert.rejects(inspectCompletionPhoto(png,declaration,async()=>({...await decoder(),frames:2})),/Invalid/));
test('excessive pixel dimensions denied',async()=>assert.rejects(inspectCompletionPhoto(png,declaration,async()=>({...await decoder(),width:100000000})),/Invalid/));
test('verified bytes receive deterministic sha256',async()=>{const a=await inspectCompletionPhoto(png,declaration,decoder);assert.match(a.sha256,/^[a-f0-9]{64}$/);assert.deepEqual(a,await inspectCompletionPhoto(png,declaration,decoder));});
const id='10000000-0000-0000-0000-000000000001';
function fixture({authorizeError=false,downloadError=false,saveError=false,emptySave=false}={}){
 const calls=[];
 return {calls,photoId:id,decode:decoder,
  actorClient:{rpc:async(name,args)=>{calls.push(name);return {error:authorizeError,data:{id,storage_path:'job/worker/'+id,...declaration}};}},
  serverClient:{storage:{from:bucket=>({download:async path=>{calls.push('download');assert.equal(bucket,'project-completion-evidence');return {error:downloadError,data:new Blob([png])};}})},
   rpc:async(name,args)=>{calls.push(name);assert.equal(args.p_bytes,12);assert.match(args.p_sha256,/^[a-f0-9]{64}$/);return {error:saveError,data:emptySave?null:{id,file_status:'validated'}};}}};
}
test('authorization failure never downloads privileged file',async()=>{const f=fixture({authorizeError:true});await assert.rejects(verifyStoredCompletionPhoto(f),/denied/);assert.deepEqual(f.calls,['completion_authorize_verification']);});
test('storage failure never records validation',async()=>{const f=fixture({downloadError:true});await assert.rejects(verifyStoredCompletionPhoto(f),/Stored photo/);assert.equal(f.calls.length,2);});
test('database attestation failure is not success',async()=>assert.rejects(verifyStoredCompletionPhoto(fixture({saveError:true})),/not confirmed/));
test('empty attestation response is not success',async()=>assert.rejects(verifyStoredCompletionPhoto(fixture({emptySave:true})),/not confirmed/));
test('authorized verified file is attested once',async()=>{const f=fixture();const r=await verifyStoredCompletionPhoto(f);assert.equal(r.id,id);assert.equal(r.file_status,'validated');assert.match(r.sha256,/^[a-f0-9]{64}$/);assert.deepEqual(f.calls,['completion_authorize_verification','download','completion_validate_file']);});
