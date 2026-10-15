// Local Deno runtime integration only. Auth/Storage are fixtures; not hosted proof.
import * as magick from 'npm:@imagemagick/magick-wasm@0.0.44';
import {makeEvidenceDecoder} from '../supabase/functions/verify-completion-photo/decoder.mjs';
import {createEvidenceHandler} from '../supabase/functions/verify-completion-photo/handler.mjs';
const fixtures=JSON.parse(await Deno.readTextFile(new URL('./fixtures/completion-images.json',import.meta.url)));
const wasm=await Deno.readFile(Deno.args[0]);
const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',wasm)),b=>b.toString(16).padStart(2,'0')).join('');
if(hash!=='b7d6710436b150dc5bd1ca04d80b6b7614c54854d7470f888f7e69a2a41b00e4')throw Error('Unexpected WASM binary');
await magick.initializeImageMagick(wasm);const decode=makeEvidenceDecoder(magick);
let bytes,mime,checks=0,attestations=0;const photo='10000000-0000-0000-0000-000000000001';
const handler=createEvidenceHandler({decode,
 env:name=>({COMPLETION_EVIDENCE_ENABLED:'true',SUPABASE_URL:'https://fixture.invalid',SUPABASE_ANON_KEY:'public-fixture',SUPABASE_SERVICE_ROLE_KEY:'server-fixture'})[name],
 createClient:(url,key)=>key==='public-fixture'?{
  auth:{getUser:async()=>({data:{user:{id:photo}}})},rpc:async()=>({data:{id:photo,storage_path:'fixture/'+photo,declared_bytes:bytes.length,declared_mime:mime}})
 }:{storage:{from:()=>({download:async()=>({data:new Blob([bytes])})})},rpc:async()=>{attestations++;return {data:{id:photo,file_status:'validated'}};}}
});
const server=Deno.serve({hostname:'127.0.0.1',port:0,onListen:()=>{}},handler);
try{
 const request=()=>fetch(`http://127.0.0.1:${server.addr.port}`,{method:'POST',headers:{Authorization:'Bearer fixture','Content-Type':'application/json',Origin:'https://korvoadmin.github.io'},body:JSON.stringify({photo_id:photo})});
 for(const format of ['png','jpeg','webp']){
  bytes=Uint8Array.from(atob(fixtures[format]),c=>c.charCodeAt(0));mime='image/'+format;
  const response=await request();const data=await response.json();
  if(response.status!==200||data.file_status!=='validated'||!/^[a-f0-9]{64}$/.test(data.sha256))throw Error('Deno '+format+' failed');checks++;
  const prior=attestations;bytes=bytes.subarray(0,Math.max(12,Math.floor(bytes.length/2)));
  const rejected=await request();await rejected.arrayBuffer();
  if(rejected.status!==422||attestations!==prior)throw Error('Deno corrupt '+format+' accepted');checks++;
 }
 console.log(JSON.stringify({checks_passed:checks,runtime:Deno.version.deno,layer:'local Deno HTTP and actual WASM decoder',hosted_supabase:false,auth_storage:'fixtures'}));
}finally{await server.shutdown();}
